import { and,eq } from 'drizzle-orm';

import { db, ensureProjectsTable } from '@/db';
import { conversations, pages, users } from '@/db/schema';
import type { ChatResponse, RenderableComponent } from '@/lib/ai-components/types';
import { generate, resolveAiConfig } from '@/lib/ai-client';
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

    const systemPrompt = [
      baseSystemPrompt,
      'Use the Profile Memory source cards as the primary truth. Do not invent facts, dates, credentials, employers, or personal details that are not present in the sources.',
      'If the sources do not answer the question, say what is missing and suggest contacting the profile owner or using a listed link.',
      `Profile Memory:\n${memory.promptContext}`,
      retrievedContext ? `Optional external index matches:\n${retrievedContext}` : '',
      CHAT_RESPONSE_ENVELOPE_PROMPT,
    ].filter(Boolean).join('\n\n');

    const raw = await generate(aiConfig, {
      system: systemPrompt,
      prompt: query,
      reasoningLevel: 'fast',
    });

    const parsed = parseChatResponse(raw);
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Chat service unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ── Response parsing ────────────────────────────────────────────────
// AI is told to emit { text, components }. In practice we sometimes
// get markdown fences or stray prose around the JSON. Strip + validate.
const ALLOWED_TYPES: ReadonlySet<RenderableComponent['type']> = new Set([
  'AskAgain', 'AvailabilityChip', 'BookCallSlot', 'EssayLink', 'HiringStatus',
  'LocationCard', 'MetricCard', 'ProjectMini', 'QuoteBlock', 'RateCard',
  'StackList', 'TimelineSlice',
]);

function parseChatResponse(raw: string): ChatResponse {
  // First try: extract the first JSON object in the string.
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const obj = JSON.parse(match[0]) as Record<string, unknown>;
      const text = typeof obj.text === 'string' ? obj.text : '';
      const components = sanitizeComponents(obj.components);
      if (text) return { text, components: components.length ? components : undefined };
    } catch {
      // fall through
    }
  }
  // Fallback: whatever the model returned, render as plain text. Keeps
  // the chat working even when the JSON contract fails on a given turn.
  return { text: raw.trim() || 'Sorry — I lost the thread on that one. Try rephrasing?' };
}

function sanitizeComponents(value: unknown): RenderableComponent[] {
  if (!Array.isArray(value)) return [];
  const out: RenderableComponent[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const type = typeof r.type === 'string' ? r.type : '';
    if (!ALLOWED_TYPES.has(type as RenderableComponent['type'])) continue;
    const props =
      r.props && typeof r.props === 'object'
        ? (r.props as Record<string, unknown>)
        : {};
    // Drop components the AI emitted with empty props — those render
    // as blank cards which look broken. Better to skip than to ship
    // a half-baked card.
    if (Object.keys(props).length === 0) continue;
    // Trust the discriminated-union check at render time — the
    // registry's switch handles bad shapes by returning null.
    out.push({ type, props } as unknown as RenderableComponent);
  }
  return out;
}
