import { and,eq } from 'drizzle-orm';

import { db, ensureProjectsTable } from '@/db';
import { conversations, pages, users } from '@/db/schema';
import { resolveAiConfig, streamResponse } from '@/lib/ai-client';
import { CHAT_RESPONSE_ENVELOPE_PROMPT } from '@/lib/ai-prompts';
import { buildProfileMemory } from '@/lib/profile-memory';
import { rateLimit } from '@/lib/rate-limit';
import { search } from '@/lib/saasmaker';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

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
        ? search(user.smApiKey, user.smIndexId, query, 5)
          .then((searchResults) => searchResults.results.map((r) => r.chunk_content).join('\n\n'))
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
      'Use the Profile Memory source cards as the primary truth. Do not invent facts, dates, credentials, employers, or personal details that are not present in the sources.',
      'If the sources do not answer the question, say what is missing and suggest contacting the profile owner or using a listed link.',
      `Profile Memory:\n${memory.promptContext}`,
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
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Chat service unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
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
