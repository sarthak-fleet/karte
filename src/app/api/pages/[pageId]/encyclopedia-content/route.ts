import { getSession } from '@/lib/auth-server';
import { db, ensureProjectsTable } from '@/db';
import { pages, generatedPages } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import type { EncyclopediaContent } from '@/lib/generated-page-types';

export async function PUT(req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { pageId } = await params;
  await ensureProjectsTable();

  // Verify ownership
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, session.user.id)));

  if (!page) {
    return new Response(JSON.stringify({ error: 'Page not found' }), { status: 404 });
  }

  const body: EncyclopediaContent = await req.json();

  // Upsert into generatedPages
  const existing = await db
    .select()
    .from(generatedPages)
    .where(and(eq(generatedPages.pageId, pageId), eq(generatedPages.type, 'encyclopedia')))
    .limit(1);

  if (existing[0]) {
    await db
      .update(generatedPages)
      .set({
        content: body as any,
        status: 'ready',
        updatedAt: new Date(),
      })
      .where(eq(generatedPages.id, existing[0].id));
  } else {
    await db.insert(generatedPages).values({
      pageId,
      type: 'encyclopedia',
      content: body as any,
      status: 'ready',
    });
  }

  return Response.json({ ok: true });
}
