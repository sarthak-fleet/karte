import { and, eq, inArray } from 'drizzle-orm';

import { db, ensureProjectsTable } from '@/db';
import { generatedPages } from '@/db/schema';
import { loadOwnedPage } from '@/lib/api-auth';
import { getSession } from '@/lib/auth-server';

type GenMode = 'roast' | 'encyclopedia' | 'newspaper';
const GEN_MODES: GenMode[] = ['roast', 'encyclopedia', 'newspaper'];

type ModeStatus = {
  status: 'pending' | 'generating' | 'ready' | 'error';
  hasContent: boolean;
  updatedAt: string | null;
};

// Lightweight polling endpoint for the dashboard. After the owner toggles a
// mode on, the dashboard polls this every few seconds to flip "Generating…"
// → "Ready" or surface an error. Returns one entry per mode (defaulting to
// pending when no row exists yet).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  const { pageId } = await params;
  await ensureProjectsTable();

  // Verify the page belongs to this user before exposing status.
  const page = await loadOwnedPage(pageId, session.user.id);
  if (!page) {
    return new Response(JSON.stringify({ error: 'Page not found' }), {
      status: 404,
    });
  }

  const rows = await db
    .select({
      type: generatedPages.type,
      status: generatedPages.status,
      content: generatedPages.content,
      updatedAt: generatedPages.updatedAt,
    })
    .from(generatedPages)
    .where(
      and(
        eq(generatedPages.pageId, pageId),
        inArray(generatedPages.type, GEN_MODES),
      ),
    );

  const result: Record<GenMode, ModeStatus> = {
    roast: { status: 'pending', hasContent: false, updatedAt: null },
    encyclopedia: { status: 'pending', hasContent: false, updatedAt: null },
    newspaper: { status: 'pending', hasContent: false, updatedAt: null },
  };

  for (const row of rows) {
    if (!GEN_MODES.includes(row.type as GenMode)) continue;
    result[row.type as GenMode] = {
      status: row.status as ModeStatus['status'],
      hasContent: Boolean(row.content),
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    };
  }

  return Response.json(result);
}
