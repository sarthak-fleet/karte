import { and, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { conversations, messages,pages } from '@/db/schema';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const body = await req.json();
  const { conversationId, role, content } = body;

  if (!conversationId || !role || !content) {
    return NextResponse.json(
      { error: 'conversationId, role, and content are required' },
      { status: 400 },
    );
  }

  if (!['user', 'assistant'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Validate conversationId belongs to the page slug
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.published, true)));

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.pageId, page.id),
      ),
    );

  if (!conversation) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 },
    );
  }

  const [message] = await db
    .insert(messages)
    .values({ conversationId, role, content })
    .returning();

  return NextResponse.json(message, { status: 201 });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const conversationId = url.searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json(
      { error: 'conversationId query param required' },
      { status: 400 },
    );
  }

  // Validate page
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.published, true)));

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  // Validate conversation belongs to page
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.pageId, page.id),
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
