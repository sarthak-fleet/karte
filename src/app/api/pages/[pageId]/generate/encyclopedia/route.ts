import { and,eq } from 'drizzle-orm';

import { db, ensureProjectsTable } from '@/db';
import type { PageSettings } from '@/db/schema';
import { generatedPages,pages, users } from '@/db/schema';
import { generate, resolveAiConfig } from '@/lib/ai-client';
import { ENCYCLOPEDIA_SYSTEM_PROMPT } from '@/lib/ai-prompts';
import { getSession } from '@/lib/auth-server';
import { asGeneratedPageContent, type EncyclopediaContent } from '@/lib/generated-page-types';
import { buildProfileMemory } from '@/lib/profile-memory';
import { rateLimit } from '@/lib/rate-limit';
import { parseAIResponse } from '@/lib/saasmaker';

export async function POST(req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const session = await getSession();

  const isBackgroundCall = req.headers.get('x-background-generation') === '1';
  if (!isBackgroundCall) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { ok } = rateLimit(`encyclopedia:${ip}`, { windowMs: 3_600_000, maxRequests: 3 });
    if (!ok) return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 });
  }

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await ensureProjectsTable();

  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, session.user.id)));
  if (!page || !page.encyclopediaEnabled) {
    return new Response(JSON.stringify({ error: 'Encyclopedia not enabled' }), { status: 404 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, page.userId));
  const aiConfig = resolveAiConfig(user);
  if (!aiConfig) {
    return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 503 });
  }

  // Read page settings for encyclopedia customization
  const settings = (page.pageSettings as PageSettings | null)?.encyclopedia;
  const memory = await buildProfileMemory({ page, mode: 'encyclopedia' });

  // Build system prompt with style preference
  let systemPrompt = ENCYCLOPEDIA_SYSTEM_PROMPT;
  if (settings?.style && settings.style !== 'Formal Wikipedia') {
    systemPrompt += `\n\nIMPORTANT: Write in a "${settings.style}" style. ${
      settings.style === 'Casual'
        ? 'Use a conversational, relaxed tone. Less formal than Wikipedia — more like an entertaining blog post in encyclopedia format.'
        : settings.style === 'Academic'
          ? 'Use rigorous academic language with proper citations-style references, formal analysis, and scholarly framing.'
          : ''
    }`;
  }

  try {
    const raw = await generate(aiConfig, {
      system: systemPrompt,
      prompt: `Write a Wikipedia-style encyclopedia article about this person using this source file:\n\n${memory.promptContext}`,
      reasoningLevel: 'deep',
    });

    const encyclopedia = parseAIResponse<EncyclopediaContent>(raw);

    // Upsert
    const existing = await db
      .select()
      .from(generatedPages)
      .where(and(eq(generatedPages.pageId, pageId), eq(generatedPages.type, 'encyclopedia')))
      .limit(1);

    if (existing[0]) {
      await db
        .update(generatedPages)
        .set({ content: asGeneratedPageContent(encyclopedia), status: 'ready', updatedAt: new Date() })
        .where(eq(generatedPages.id, existing[0].id));
    } else {
      await db.insert(generatedPages).values({
        pageId,
        type: 'encyclopedia',
        content: asGeneratedPageContent(encyclopedia),
        status: 'ready',
      });
    }

    return Response.json(encyclopedia);
  } catch (error) {
    console.error('Failed to generate encyclopedia', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined,
      responseBody: typeof error === 'object' && error && 'responseBody' in error
        ? (error as { responseBody?: unknown }).responseBody
        : undefined,
      cause: error instanceof Error && error.cause instanceof Error
        ? { name: error.cause.name, message: error.cause.message }
        : undefined,
    });
    return new Response(JSON.stringify({ error: 'Failed to generate encyclopedia' }), { status: 500 });
  }
}
