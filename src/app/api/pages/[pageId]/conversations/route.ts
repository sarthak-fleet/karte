import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { db } from '@/db';
import { pages, conversations, messages } from '@/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId } = await params;

  // Verify ownership
  const page = await db.query.pages.findFirst({
    where: and(eq(pages.id, pageId), eq(pages.userId, session.user.id)),
  });

  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Get conversations with message count and first user message preview
  const convos = await db
    .select({
      id: conversations.id,
      visitorId: conversations.visitorId,
      createdAt: conversations.createdAt,
      messageCount: count(messages.id),
      firstMessage: sql<string>`MIN(CASE WHEN ${messages.role} = 'user' THEN ${messages.content} END)`,
    })
    .from(conversations)
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.pageId, pageId))
    .groupBy(conversations.id)
    .orderBy(desc(conversations.createdAt));

  return NextResponse.json(convos);
}
