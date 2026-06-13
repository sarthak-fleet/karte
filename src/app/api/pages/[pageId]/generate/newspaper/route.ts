import { and,eq } from 'drizzle-orm';

import { db, ensureProjectsTable } from '@/db';
import type { PageSettings } from '@/db/schema';
import { generatedPages,pages, users } from '@/db/schema';
import { generate, resolveAiConfig } from '@/lib/ai-client';
import { NEWSPAPER_SYSTEM_PROMPT } from '@/lib/ai-prompts';
import { getSession } from '@/lib/auth-server';
import { asGeneratedPageContent, type NewspaperContent } from '@/lib/generated-page-types';
import { buildProfileMemory } from '@/lib/profile-memory';
import { rateLimit } from '@/lib/rate-limit';
import { parseAIResponse } from '@/lib/saasmaker';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const session = await getSession();

  const isBackgroundCall = req.headers.get('x-background-generation') === '1';
  if (!isBackgroundCall) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { ok } = rateLimit(`newspaper:${ip}`, { windowMs: 3_600_000, maxRequests: 3 });
    if (!ok) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (!session?.user?.id) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  await ensureProjectsTable();

  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, session.user.id)));
  if (!page || !page.newspaperEnabled) {
    return new Response(
      JSON.stringify({ error: 'Newspaper not enabled' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const [user] = await db.select().from(users).where(eq(users.id, page.userId));
  const aiConfig = resolveAiConfig(user);
  if (!aiConfig) {
    return new Response(
      JSON.stringify({ error: 'AI not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Read page settings for newspaper customization
  const settings = (page.pageSettings as PageSettings | null)?.newspaper;
  const memory = await buildProfileMemory({ page, mode: 'newspaper' });

  // Build system prompt with tone and name preferences
  let systemPrompt = NEWSPAPER_SYSTEM_PROMPT;
  const promptAdditions: string[] = [];

  if (settings?.name) {
    promptAdditions.push(`Use "${settings.name}" as the newspaper masthead name instead of generating one.`);
  }
  if (settings?.tone && settings.tone !== 'Prestigious') {
    promptAdditions.push(`Write in a "${settings.tone}" newspaper tone. ${
      settings.tone === 'Tabloid'
        ? 'Use sensational headlines, exclamation marks, and dramatic language like a tabloid paper.'
        : settings.tone === 'Local'
          ? 'Write in a warm, community-focused local newspaper style. Make it feel homey and personal.'
          : ''
    }`);
  }

  if (promptAdditions.length > 0) {
    systemPrompt += '\n\nIMPORTANT: ' + promptAdditions.join(' ');
  }

  try {
    const raw = await generate(aiConfig, {
      system: systemPrompt,
      prompt: `Write a newspaper front page about this person using this source desk:\n\n${memory.promptContext}`,
      reasoningLevel: 'deep',
    });

    const newspaper = parseAIResponse<NewspaperContent>(raw);

    // Upsert generated page
    const existing = await db
      .select()
      .from(generatedPages)
      .where(
        and(
          eq(generatedPages.pageId, pageId),
          eq(generatedPages.type, 'newspaper')
        )
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(generatedPages)
        .set({
          content: asGeneratedPageContent(newspaper),
          status: 'ready',
          updatedAt: new Date(),
        })
        .where(eq(generatedPages.id, existing[0].id));
    } else {
      await db.insert(generatedPages).values({
        pageId,
        type: 'newspaper',
        content: asGeneratedPageContent(newspaper),
        status: 'ready',
      });
    }

    return Response.json(newspaper);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to generate newspaper' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
