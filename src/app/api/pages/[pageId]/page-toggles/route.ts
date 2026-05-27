import { and, eq } from 'drizzle-orm';
import { after } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import type { PageSettings } from '@/db/schema';
import { generatedPages, pages } from '@/db/schema';
import { getSession } from '@/lib/auth-server';

type GenMode = 'roast' | 'encyclopedia' | 'newspaper';
const GEN_MODES: GenMode[] = ['roast', 'encyclopedia', 'newspaper'];

const MODE_TO_COLUMN = {
  roast: 'roastEnabled',
  encyclopedia: 'encyclopediaEnabled',
  newspaper: 'newspaperEnabled',
} as const;

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { pageId } = await params;
  await ensureProjectsTable();

  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, session.user.id)));

  if (!page) {
    return new Response(JSON.stringify({ error: 'Page not found' }), { status: 404 });
  }

  const body = await req.json();
  const { encyclopediaEnabled, roastEnabled, newspaperEnabled, pageSettings } = body;

  // Detect off → on transitions so we can fire background generation only
  // when a mode is first turned on. If content already exists in 'ready'
  // state we skip — owner can still hit "Regenerate" manually.
  const newFlags: Record<GenMode, boolean | undefined> = {
    roast: roastEnabled,
    encyclopedia: encyclopediaEnabled,
    newspaper: newspaperEnabled,
  };
  const transitionedOn: GenMode[] = GEN_MODES.filter((mode) => {
    const wasOn = page[MODE_TO_COLUMN[mode]];
    const willBeOn = newFlags[mode];
    return willBeOn === true && !wasOn;
  });

  const updateData: Record<string, unknown> = {
    encyclopediaEnabled: encyclopediaEnabled ?? page.encyclopediaEnabled,
    roastEnabled: roastEnabled ?? page.roastEnabled,
    newspaperEnabled: newspaperEnabled ?? page.newspaperEnabled,
    updatedAt: new Date(),
  };

  if (pageSettings !== undefined) {
    updateData.pageSettings = pageSettings as PageSettings;
  }

  await db.update(pages).set(updateData).where(eq(pages.id, pageId));

  // For each newly-enabled mode without existing 'ready' content: mark its
  // generatedPages row as 'generating' so the dashboard + profile page can
  // surface the in-progress state immediately, then kick off the AI call in
  // the background (after the response is sent).
  const actuallyGenerating: GenMode[] = [];
  if (transitionedOn.length > 0) {
    const origin = new URL(req.url).origin;
    const cookieHeader = req.headers.get('cookie') ?? '';

    for (const mode of transitionedOn) {
      const [existing] = await db
        .select()
        .from(generatedPages)
        .where(and(eq(generatedPages.pageId, pageId), eq(generatedPages.type, mode)))
        .limit(1);

      // Skip if already-generated content is present.
      if (existing?.status === 'ready' && existing.content) continue;

      actuallyGenerating.push(mode);

      // Mark generating so UI can show the state immediately.
      if (existing) {
        await db
          .update(generatedPages)
          .set({ status: 'generating', updatedAt: new Date() })
          .where(eq(generatedPages.id, existing.id));
      } else {
        await db.insert(generatedPages).values({
          pageId,
          type: mode,
          status: 'generating',
        });
      }

      // Background fire-and-forget. `after()` keeps the worker alive past
      // the response so this fetch can complete. The existing generate
      // route handles the LLM call + DB upsert; we just invoke it.
      after(async () => {
        try {
          await fetch(`${origin}/api/pages/${pageId}/generate/${mode}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              cookie: cookieHeader,
              'x-background-generation': '1',
            },
            body: JSON.stringify({}),
          });
        } catch {
          // If the dispatch itself errored, mark the row as error so the
          // UI doesn't show an indefinite "generating" state.
          await db
            .update(generatedPages)
            .set({ status: 'error', updatedAt: new Date() })
            .where(
              and(
                eq(generatedPages.pageId, pageId),
                eq(generatedPages.type, mode),
              ),
            );
        }
      });
    }
  }

  return Response.json({
    ok: true,
    backgroundGenerating: actuallyGenerating,
  });
}
