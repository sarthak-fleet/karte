import { and,eq } from 'drizzle-orm';

import { db, ensureProjectsTable } from '@/db';
import type { PageSettings } from '@/db/schema';
import { generatedPages,pages, users } from '@/db/schema';
import { generate, resolveAiConfig } from '@/lib/ai-client';
import { ROAST_SYSTEM_PROMPT } from '@/lib/ai-prompts';
import { asGeneratedPageContent, type RoastContent } from '@/lib/generated-page-types';
import { buildProfileMemory } from '@/lib/profile-memory';
import { rateLimit } from '@/lib/rate-limit';
import { parseAIResponse } from '@/lib/saasmaker';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;

  // Skip rate-limit for background generation triggered by the worker itself
  // (e.g. when a mode is toggled on in page-toggles → fire-and-forget regen).
  // User-initiated calls still get the 3/hour/IP cap.
  const isBackgroundCall = req.headers.get('x-background-generation') === '1';
  if (!isBackgroundCall) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { ok } = rateLimit(`roast:${ip}`, { windowMs: 3_600_000, maxRequests: 3 });
    if (!ok) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
      });
    }
  }

  await ensureProjectsTable();

  // Get page and user
  const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
  if (!page || !page.roastEnabled) {
    return new Response(JSON.stringify({ error: 'Roast not enabled' }), {
      status: 404,
    });
  }

  const [user] = await db.select().from(users).where(eq(users.id, page.userId));
  const aiConfig = resolveAiConfig(user);
  if (!aiConfig) {
    return new Response(JSON.stringify({ error: 'AI not configured' }), {
      status: 503,
    });
  }

  // Find the existing generated page so this request can replace stale roasts.
  const existing = await db
    .select()
    .from(generatedPages)
    .where(
      and(eq(generatedPages.pageId, pageId), eq(generatedPages.type, 'roast'))
    )
    .limit(1);

  // Read page settings for roast customization
  const settings = (page.pageSettings as PageSettings | null)?.roast;
  const memory = await buildProfileMemory({ page, mode: 'roast' });

  // Build system prompt with tone preference
  let systemPrompt = ROAST_SYSTEM_PROMPT;
  if (settings?.tone && settings.tone !== 'Savage') {
    systemPrompt += `\n\nIMPORTANT: Write the roast in a "${settings.tone}" tone. ${
      settings.tone === 'Friendly'
        ? 'Keep it light-hearted and good-natured. Tease rather than roast.'
        : settings.tone === 'Sarcastic'
          ? 'Be dripping with sarcasm and irony. Use dry wit and deadpan humor.'
          : ''
    }`;
  }

  try {
    const raw = await generate(aiConfig, {
      system: systemPrompt,
      prompt: `Roast this person based on this profile research packet:\n\n${memory.promptContext}`,
    });

    const roast = parseAIResponse<RoastContent>(raw);

    // Upsert generated page
    if (existing[0]) {
      await db
        .update(generatedPages)
        .set({
          content: asGeneratedPageContent(roast),
          status: 'ready',
          updatedAt: new Date(),
        })
        .where(eq(generatedPages.id, existing[0].id));
    } else {
      await db.insert(generatedPages).values({
        pageId,
        type: 'roast',
        content: asGeneratedPageContent(roast),
        status: 'ready',
      });
    }

    return Response.json(roast);
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to generate roast' }), {
      status: 500,
    });
  }
}
