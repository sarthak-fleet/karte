import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { contactSubmissions, pages } from '@/db/schema';
import { getSession } from '@/lib/auth-server';

const SUBMISSION_STATUSES = new Set(['unread', 'replied', 'archived']);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ pageId: string; submissionId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId, submissionId } = await params;
  await ensureProjectsTable();

  const page = await db.query.pages.findFirst({
    where: and(eq(pages.id, pageId), eq(pages.userId, session.user.id)),
  });

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const body = await req.json();
  const status = typeof body.status === 'string' ? body.status : '';

  if (!SUBMISSION_STATUSES.has(status)) {
    return NextResponse.json(
      { error: 'Status must be unread, replied, or archived' },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(contactSubmissions)
    .set({ status: status as 'unread' | 'replied' | 'archived' })
    .where(
      and(
        eq(contactSubmissions.id, submissionId),
        eq(contactSubmissions.pageId, pageId),
      ),
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
