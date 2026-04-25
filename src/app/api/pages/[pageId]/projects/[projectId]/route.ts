import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth-server';
import { db, ensureProjectsTable } from '@/db';
import { pages, projects } from '@/db/schema';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; projectId: string }> },
) {
  const { pageId, projectId } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureProjectsTable();

  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, session.user.id)));

  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.pageId, pageId)));

  return NextResponse.json({ success: true });
}
