import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { conversations, pages } from '@/db/schema';
import { resolvePublicProfileSlug } from '@/lib/demo-profiles';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const requestedSlug = (await params).slug;
  const slug = resolvePublicProfileSlug(requestedSlug);
  const body = await req.json().catch(() => ({}));
  const { visitorId, visitorEmail } = body as {
    visitorId?: unknown;
    visitorEmail?: unknown;
  };

  // Ensure visitorEmail column exists before insert (lazy migration).
  await ensureProjectsTable();

  // Find the published page by slug
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.published, true)));

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  // Chat is gated behind email capture — refuse to create the conversation
  // without a syntactically valid email so the bucket is meaningful as a lead.
  const email =
    typeof visitorEmail === 'string' ? visitorEmail.trim().toLowerCase() : '';
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: 'Email required to chat' },
      { status: 400 },
    );
  }

  const [conversation] = await db
    .insert(conversations)
    .values({
      pageId: page.id,
      visitorId: typeof visitorId === 'string' ? visitorId : null,
      visitorEmail: email,
    })
    .returning();

  return NextResponse.json(
    {
      id: conversation.id,
      pageId: conversation.pageId,
      createdAt: conversation.createdAt,
    },
    { status: 201 },
  );
}
