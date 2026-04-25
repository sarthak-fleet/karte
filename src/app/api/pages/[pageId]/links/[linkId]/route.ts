import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { db } from '@/db';
import { pages, links } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; linkId: string }> },
) {
  const { pageId, linkId } = await params;
  const session = await getSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify page ownership
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, session.user.id)));

  if (!page)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await db.delete(links).where(and(eq(links.id, linkId), eq(links.pageId, pageId)));

  return NextResponse.json({ success: true });
}
