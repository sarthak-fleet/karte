import { count, desc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { conversations, messages } from '@/db/schema';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { pageId } = await params;

  // Verify ownership
  const page = await loadOwnedPage(pageId, auth.userId);

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
