import { and,eq } from 'drizzle-orm';

import { db } from '@/db';
import { pages, users } from '@/db/schema';
import { resolveAiConfig, streamResponse } from '@/lib/ai-client';
import { buildProfileMemory } from '@/lib/profile-memory';
import { rateLimit } from '@/lib/rate-limit';
import { search } from '@/lib/saasmaker';

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

  let body: { query?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const { query } = body;

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
    ].filter(Boolean).join('\n\n');

    return streamResponse(aiConfig, { system: systemPrompt, prompt: query });
  } catch {
    return new Response(JSON.stringify({ error: 'Chat service unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
