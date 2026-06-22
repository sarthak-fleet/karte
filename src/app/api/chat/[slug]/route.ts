import { and, desc, eq } from 'drizzle-orm';

import { db, ensureProjectsTable } from '@/db';
import { conversations, messages, pages, users } from '@/db/schema';
import { resolveAiConfig, streamResponse } from '@/lib/ai-client';
import { CHAT_RESPONSE_ENVELOPE_PROMPT } from '@/lib/ai-prompts';
import { resolvePublicProfileSlug } from '@/lib/demo-profiles';
import { buildProfileMemory } from '@/lib/profile-memory';
import { search } from '@/lib/knowledgebase';
import { rateLimit } from '@/lib/rate-limit';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const RECENT_CONTEXT_MESSAGE_LIMIT = 6;
const RECENT_CONTEXT_CHAR_LIMIT = 1200;
const PROFILE_CONTEXT_CHAR_LIMIT = 3600;
const RAG_CONTEXT_CHAR_LIMIT = 1400;
const RAG_TIMEOUT_MS = 500;

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const requestedSlug = (await params).slug;
  const slug = resolvePublicProfileSlug(requestedSlug);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { ok } = rateLimit(ip);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }

  let body: { query?: unknown; visitorEmail?: unknown; conversationId?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const { query, visitorEmail, conversationId } = body;

  if (typeof query !== 'string' || !query.trim()) {
    return new Response(JSON.stringify({ error: 'query required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (query.length > 2000) {
    return new Response(JSON.stringify({ error: 'query is too long (max 2000 characters)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get page + user config
  const [page] = await db.select().from(pages).where(and(eq(pages.slug, slug), eq(pages.published, true)));
  if (!page || !page.chatEnabled) {
    return new Response(JSON.stringify({ error: 'Chat not available' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Email gate: chat is a lead-capture surface, so we require a visitor email
  // before letting the AI respond. Accept it either from the request (header
  // or body) or from the conversation row (set on first message). For new
  // conversations with no row yet, the client must include `visitorEmail`.
  await ensureProjectsTable();

  const headerEmail = req.headers.get('x-visitor-email')?.trim().toLowerCase() ?? '';
  const bodyEmail =
    typeof visitorEmail === 'string' ? visitorEmail.trim().toLowerCase() : '';
  const providedEmail = bodyEmail || headerEmail;

  let storedEmail: string | null = null;
  if (typeof conversationId === 'string' && conversationId) {
    const [existing] = await db
      .select({ visitorEmail: conversations.visitorEmail, pageId: conversations.pageId })
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (existing && existing.pageId === page.id) {
      storedEmail = existing.visitorEmail ?? null;

      // Lazy-persist email onto an existing conversation that doesn't have one yet
      // (covers conversations created before this feature shipped).
      if (!storedEmail && providedEmail && EMAIL_RE.test(providedEmail) && providedEmail.length <= 254) {
        await db
          .update(conversations)
          .set({ visitorEmail: providedEmail })
          .where(eq(conversations.id, conversationId));
        storedEmail = providedEmail;
      }
    }
  }

  const effectiveEmail =
    storedEmail || (providedEmail && EMAIL_RE.test(providedEmail) && providedEmail.length <= 254 ? providedEmail : '');

  if (!effectiveEmail) {
    return new Response(JSON.stringify({ error: 'Email required to chat' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const recentConversationContext =
    typeof conversationId === 'string' && conversationId
      ? await buildRecentConversationContext(conversationId, page.id)
      : '';
  const directRecall = answerFromRecentConversation(query, recentConversationContext);
  if (directRecall) {
    return new Response(directRecall, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  const directProfileAnswer = answerFromLocalProfile(query, page);
  if (directProfileAnswer) {
    return new Response(directProfileAnswer, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const [user] = await db.select().from(users).where(eq(users.id, page.userId));

  const aiConfig = resolveAiConfig(user);
  if (!aiConfig) {
    return new Response(JSON.stringify({ error: 'Chat not configured — AI endpoint missing' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const [memory, retrievedContext] = await Promise.all([
      buildProfileMemory({ page, mode: 'chat', query }),
      user.smApiKey && user.smIndexId
        ? searchWithTimeout(user.smIndexId, query, { userId: page.userId, pageId: page.id })
          .then((searchResults) => searchResults.results.map((r) => r.chunk_content).join('\n\n'))
          .then((context) => clampContext(context, RAG_CONTEXT_CHAR_LIMIT))
          .catch(() => '')
        : Promise.resolve(''),
    ]);

    const baseSystemPrompt = page.chatSystemPrompt
      || `You are a helpful assistant that answers questions about ${page.displayName}.`;

    // Visitor-intent ranking: the page can declare a preferred posture
    // (explore / ask / reach / vibe) in pageSettings.visitorIntent. We
    // translate that into a component-picking hint so the AI surfaces
    // the right kind of help. Default (no hint) keeps the AI free to
    // pick whatever fits.
    const visitorIntent = (page.pageSettings as { visitorIntent?: string } | null)
      ?.visitorIntent;
    const intentHint = buildIntentHint(visitorIntent);

    const systemPrompt = [
      baseSystemPrompt,
      'Keep the answer tight: usually 1-3 short paragraphs, under 120 words, unless the visitor explicitly asks for depth.',
      'Use the Profile Memory source cards as the primary truth. Do not invent facts, dates, credentials, employers, or personal details that are not present in the sources.',
      'If the sources do not answer the question, say what is missing and suggest contacting the profile owner or using a listed link.',
      `Profile Memory:\n${clampContext(memory.promptContext, PROFILE_CONTEXT_CHAR_LIMIT)}`,
      recentConversationContext ? `Recent conversation memory:\n${recentConversationContext}` : '',
      recentConversationContext
        ? 'Use recent conversation memory for visitor-provided facts in this room, such as what they just said they are wearing, doing, building, or asking about. Do not claim those facts are in the public profile.'
        : '',
      retrievedContext ? `Optional external index matches:\n${retrievedContext}` : '',
      CHAT_RESPONSE_ENVELOPE_PROMPT,
      intentHint,
    ].filter(Boolean).join('\n\n');

    // Stream the response — text appears word-by-word client-side.
    // Components live in a JSON tail after the <<<COMPONENTS>>> marker;
    // the client splits on the marker and renders components when the
    // stream completes.
    return streamResponse(aiConfig, {
      system: systemPrompt,
      prompt: query,
      reasoningLevel: 'fast',
      maxOutputTokens: 160,
      timeoutMs: 8000,
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Chat service unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function answerFromLocalProfile(query: string, page: typeof pages.$inferSelect): string | null {
  const normalizedQuery = query.toLowerCase();
  const firstName = page.displayName.split(/\s+/)[0]?.toLowerCase() ?? '';
  const asksIntro =
    /\bwhat\s+is\s+(this\s+)?profile\s+about\b/.test(normalizedQuery)
    || /\bwhat\s+(does|do)\s+.+\s+do\b/.test(normalizedQuery)
    || /\bwho\s+(is|are)\s+/.test(normalizedQuery)
    || /\btell me about\s+(this profile|this person|him|her|them)\b/.test(normalizedQuery)
    || (firstName ? new RegExp(`\\btell me about\\s+${firstName}\\b`).test(normalizedQuery) : false);

  if (!asksIntro || !page.bio) return null;

  const bio = page.bio.replace(/\s+/g, ' ').trim();
  const sentence = bio.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
  const summary = sentence || bio;
  const clipped =
    summary.length > 360
      ? `${summary.slice(0, 357).replace(/\s+\S*$/, '').trim()}...`
      : summary;
  return `${page.displayName}: ${clipped}`;
}

function answerFromRecentConversation(query: string, context: string): string | null {
  if (!context) return null;
  const normalizedQuery = query.toLowerCase();
  const asksWearingColor =
    /\bwhat\b.*\b(colou?r|shirt|t-?shirt|wearing)\b/.test(normalizedQuery)
    && /\b(colou?r|shirt|t-?shirt|wearing)\b/.test(normalizedQuery);
  const asksWhatVisitorSaid =
    /\bwhat\b.*\b(i|me|my)\b.*\b(said|say|told|tell|mentioned|shared)\b/.test(normalizedQuery)
    || /\bwhat\b.*\b(did|do)\b.*\b(i|me)\b.*\b(say|tell|mention|share)\b/.test(normalizedQuery);

  const visitorLines = context
    .split('\n')
    .filter((line) => line.toLowerCase().startsWith('visitor:'));

  if (asksWhatVisitorSaid) {
    const visitorFact = lastVisitorFact(visitorLines, normalizedQuery);
    if (visitorFact) return `You told me: ${visitorFact}`;
  }

  if (!asksWearingColor) return null;

  const colors = [
    'red',
    'blue',
    'green',
    'yellow',
    'black',
    'white',
    'grey',
    'gray',
    'pink',
    'purple',
    'orange',
    'brown',
    'navy',
    'maroon',
  ];
  for (const line of visitorLines.reverse()) {
    const lower = line.toLowerCase();
    if (!/\bwearing\b/.test(lower) || !/\b(t-?shirt|shirt)\b/.test(lower)) continue;
    const color = colors.find((candidate) => new RegExp(`\\b${candidate}\\b`).test(lower));
    if (color) {
      const display = color === 'grey' ? 'gray' : color;
      return `You said you're wearing a ${display} t-shirt.`;
    }
  }

  return null;
}

function lastVisitorFact(visitorLines: string[], normalizedQuery: string): string | null {
  const normalizedTopic = normalizedQuery
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\b(what|did|do|i|me|my|say|said|tell|told|mention|mentioned|share|shared|you|about)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (let index = visitorLines.length - 1; index >= 0; index -= 1) {
    const line = visitorLines[index];
    const content = line.replace(/^visitor:\s*/i, '').replace(/\s+/g, ' ').trim();
    if (!content || content.length > 280 || /[?]/.test(content)) continue;

    const lower = content.toLowerCase();
    if (!/\b(i am|i'm|im|my|mine|we are|we're|our|i have|i like|i prefer|i need|i want)\b/.test(lower)) {
      continue;
    }

    if (normalizedTopic) {
      const topicWords = normalizedTopic
        .split(' ')
        .filter((word) => word.length >= 3);
      if (topicWords.length && !topicWords.some((word) => lower.includes(word))) {
        continue;
      }
    }

    return content;
  }

  return null;
}

function clampContext(value: string, limit: number): string {
  const normalized = value.replace(/\s+\n/g, '\n').trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit).trimEnd()}\n[truncated for live chat speed]`;
}

function searchWithTimeout(
  indexId: string,
  query: string,
  scope: { userId: string; pageId: string },
): ReturnType<typeof search> {
  return Promise.race([
    search(indexId, query, 3, scope),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('RAG search timed out')), RAG_TIMEOUT_MS);
    }),
  ]) as ReturnType<typeof search>;
}

async function buildRecentConversationContext(conversationId: string, pageId: string): Promise<string> {
  const [conversation] = await db
    .select({ pageId: conversations.pageId })
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!conversation || conversation.pageId !== pageId) return '';

  const recent = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(RECENT_CONTEXT_MESSAGE_LIMIT);

  const lines = recent
    .reverse()
    .map((message) => {
      const role = message.role === 'assistant' ? 'Assistant' : 'Visitor';
      const content = message.content.replace(/\s+/g, ' ').trim();
      return content ? `${role}: ${content}` : '';
    })
    .filter(Boolean);

  const context = lines.join('\n');
  if (context.length <= RECENT_CONTEXT_CHAR_LIMIT) return context;
  return context.slice(context.length - RECENT_CONTEXT_CHAR_LIMIT).replace(/^[^\n]*\n?/, '').trim();
}

// ── Visitor-intent ranking ──────────────────────────────────────────
// PageSettings.visitorIntent expresses what the owner wants visitors
// to do first. Each intent maps to a soft 'favor these components'
// hint added to the system prompt — never overrides what the visitor
// is actually asking, just nudges the component picks.
function buildIntentHint(intent: string | undefined): string {
  switch (intent) {
    case 'reach':
      return 'VISITOR INTENT: this page wants visitors to reach out. When a visitor question even loosely touches availability, contact, calls, or hiring — strongly favor BookCallSlot + AvailabilityChip + HiringStatus components.';
    case 'explore':
      return 'VISITOR INTENT: this page wants visitors to explore the owner\'s work. Strongly favor TimelineSlice, ProjectMini, MetricCard, and EssayLink when relevant.';
    case 'ask':
      return 'VISITOR INTENT: this page is built for ask-anything chat. Lean into prose answers; use components sparingly — only when they materially help a follow-up action.';
    case 'vibe':
      return 'VISITOR INTENT: this page is curated for vibe / taste. Favor QuoteBlock, EssayLink, LocationCard, and AskAgain that surface personality over transactions.';
    default:
      return '';
  }
}
