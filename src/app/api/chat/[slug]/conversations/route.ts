import { and,eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { conversations,pages } from '@/db/schema';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const body = await req.json();
  const { visitorId } = body;

  // Find the published page by slug
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.published, true)));

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const [conversation] = await db
    .insert(conversations)
    .values({
      pageId: page.id,
      visitorId: visitorId ?? null,
    })
    .returning();

  return NextResponse.json(
    { id: conversation.id, pageId: conversation.pageId, createdAt: conversation.createdAt },
    { status: 201 },
  );
}
