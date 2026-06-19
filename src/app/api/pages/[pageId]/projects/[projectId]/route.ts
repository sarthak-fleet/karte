import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { pages, projects } from '@/db/schema';
import { requireUser } from '@/lib/api-auth';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; projectId: string }> },
) {
  const { pageId, projectId } = await params;
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  await ensureProjectsTable();

  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, auth.userId)));

  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.pageId, pageId)));

  return NextResponse.json({ success: true });
}
