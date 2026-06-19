import { and,eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { infoBlocks, users } from '@/db/schema';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';
import { deleteDocument } from '@/lib/saasmaker';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; blockId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { pageId, blockId } = await params;

  const page = await loadOwnedPage(pageId, auth.userId);

  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Look up block for saas-maker cleanup
  const [block] = await db.select().from(infoBlocks).where(and(eq(infoBlocks.id, blockId), eq(infoBlocks.pageId, pageId)));

  if (block?.smDocumentId) {
    const [user] = await db.select().from(users).where(eq(users.id, auth.userId));
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
