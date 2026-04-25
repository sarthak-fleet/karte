import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { db } from '@/db';
import { pages, infoBlocks, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { deleteDocument } from '@/lib/saasmaker';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; blockId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId, blockId } = await params;

  const page = await db.query.pages.findFirst({
    where: and(eq(pages.id, pageId), eq(pages.userId, session.user.id)),
  });

  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Look up block for saas-maker cleanup
  const [block] = await db.select().from(infoBlocks).where(and(eq(infoBlocks.id, blockId), eq(infoBlocks.pageId, pageId)));

  if (block?.smDocumentId) {
    const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
    if (user?.smIndexId) {
      try {
        const adminKey = process.env.SAASMAKER_ADMIN_KEY!;
        await deleteDocument(adminKey, user.smIndexId, block.smDocumentId);
      } catch {
        console.error('Failed to delete document from saas-maker');
      }
    }
  }

  await db
    .delete(infoBlocks)
    .where(and(eq(infoBlocks.id, blockId), eq(infoBlocks.pageId, pageId)));

  return NextResponse.json({ success: true });
}
