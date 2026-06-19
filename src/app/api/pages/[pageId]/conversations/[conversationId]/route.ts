import { and, asc,eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { conversations, messages } from '@/db/schema';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; conversationId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { pageId, conversationId } = await params;

  // Verify ownership
  const page = await loadOwnedPage(pageId, auth.userId);

  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Verify conversation belongs to page
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.pageId, pageId),
      ),
    );

  if (!conversation) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 },
    );
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  return NextResponse.json(msgs);
}
