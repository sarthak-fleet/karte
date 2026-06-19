import { and, eq } from 'drizzle-orm';

import { db, ensureProjectsTable } from '@/db';
import { generatedPages, pages, users } from '@/db/schema';
import { generate, resolveAiConfig } from '@/lib/ai-client';
import { getSession } from '@/lib/auth-server';
import {
  asGeneratedPageContent,
  type GeneratedPageType,
} from '@/lib/generated-page-types';
import { buildProfileMemory } from '@/lib/profile-memory';
import { rateLimit } from '@/lib/rate-limit';
import { parseAIResponse } from '@/lib/saasmaker';

type ProfilePage = typeof pages.$inferSelect;

function jsonError(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface GenerateModeConfig {
  /** Which generated-page surface this is (also the generatedPages.type). */
  mode: GeneratedPageType;
  /** Human label used in the "{label} not enabled" 404. */
  enabledLabel: string;
  /** Whether the owner has toggled this mode on for the page. */
  isEnabled: (page: ProfilePage) => boolean;
  /** Builds the system prompt, applying any per-mode pageSettings tweaks. */
  buildSystemPrompt: (page: ProfilePage) => string;
  /** Builds the user prompt from the assembled profile memory context. */
  buildPrompt: (memoryContext: string) => string;
  /** Optional hook for mode-specific failure logging. */
  onError?: (error: unknown) => void;
}

/**
 * Shared pipeline behind the roast / newspaper / encyclopedia generate
 * routes: rate-limit → auth → ownership + enabled check → AI config →
 * profile memory → generate → parse → upsert into generatedPages.
 *
 * Each route supplies only the mode-specific prompt building and labels.
 */
export async function generateProfileMode(
  req: Request,
  pageId: string,
  config: GenerateModeConfig,
): Promise<Response> {
  const session = await getSession();

  // Skip the rate-limit for background regeneration fired by the worker
  // itself (e.g. toggling a mode on). User-initiated calls keep the cap.
  const isBackgroundCall = req.headers.get('x-background-generation') === '1';
  if (!isBackgroundCall) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { ok } = rateLimit(`${config.mode}:${ip}`, {
      windowMs: 3_600_000,
      maxRequests: 3,
    });
    if (!ok) return jsonError('Too many requests', 429);
  }

  if (!session?.user?.id) return jsonError('Unauthorized', 401);

  await ensureProjectsTable();

  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, session.user.id)));
  if (!page || !config.isEnabled(page)) {
    return jsonError(`${config.enabledLabel} not enabled`, 404);
  }

  const [user] = await db.select().from(users).where(eq(users.id, page.userId));
  const aiConfig = resolveAiConfig(user);
  if (!aiConfig) return jsonError('AI not configured', 503);

  const memory = await buildProfileMemory({ page, mode: config.mode });

  try {
    const raw = await generate(aiConfig, {
      system: config.buildSystemPrompt(page),
      prompt: config.buildPrompt(memory.promptContext),
      reasoningLevel: 'deep',
    });

    const content = parseAIResponse<Record<string, unknown>>(raw);

    const existing = await db
      .select()
      .from(generatedPages)
      .where(
        and(
          eq(generatedPages.pageId, pageId),
          eq(generatedPages.type, config.mode),
        ),
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(generatedPages)
        .set({
          content: asGeneratedPageContent(content),
          status: 'ready',
          updatedAt: new Date(),
        })
        .where(eq(generatedPages.id, existing[0].id));
    } else {
      await db.insert(generatedPages).values({
        pageId,
        type: config.mode,
        content: asGeneratedPageContent(content),
        status: 'ready',
      });
    }

    return Response.json(content);
  } catch (error) {
    config.onError?.(error);
    return jsonError(`Failed to generate ${config.mode}`, 500);
  }
}
