import { and, asc, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { links } from '@/db/schema';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';
import { isValidUrl, MAX_TITLE_LENGTH } from '@/lib/validation';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const page = await loadOwnedPage(pageId, auth.userId);
  if (!page)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const pageLinks = await db
    .select()
    .from(links)
    .where(eq(links.pageId, pageId))
    .orderBy(links.sortOrder);

  return NextResponse.json(pageLinks);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const page = await loadOwnedPage(pageId, auth.userId);
  if (!page)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const icon = typeof body.icon === 'string' ? body.icon.trim() : '';
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
  const bodyText = typeof body.body === 'string' ? body.body.trim() : '';

  if (!title || !url) {
    return NextResponse.json(
      { error: 'title and url are required' },
      { status: 400 },
    );
  }

  if (!isValidUrl(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: 'Title too long (max 100 chars)' }, { status: 400 });
  }

  // Auto-increment sortOrder
  const [maxLink] = await db
    .select({ sortOrder: links.sortOrder })
    .from(links)
    .where(eq(links.pageId, pageId))
    .orderBy(desc(links.sortOrder))
    .limit(1);

  const nextOrder = (maxLink?.sortOrder ?? -1) + 1;

  const [link] = await db
    .insert(links)
    .values({
      pageId,
      title,
      url,
      icon: icon || null,
      imageUrl: imageUrl || null,
      body: bodyText || null,
      sortOrder: nextOrder,
    })
    .returning();

  return NextResponse.json(link, { status: 201 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const page = await loadOwnedPage(pageId, auth.userId);
  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const orderedLinkIds = Array.isArray(body.orderedLinkIds)
    ? body.orderedLinkIds.filter(
        (value: unknown): value is string => typeof value === 'string',
      )
    : [];

  if (orderedLinkIds.length === 0) {
    return NextResponse.json(
      { error: 'orderedLinkIds are required' },
      { status: 400 },
    );
  }

  const currentLinks = await db
    .select({ id: links.id })
    .from(links)
    .where(eq(links.pageId, pageId));

  const currentLinkIds = new Set(currentLinks.map((link) => link.id));
  const requestedLinkIds = new Set(orderedLinkIds);

  if (
    currentLinks.length !== orderedLinkIds.length ||
    requestedLinkIds.size !== orderedLinkIds.length ||
    orderedLinkIds.some((id: string) => !currentLinkIds.has(id))
  ) {
    return NextResponse.json(
      { error: 'orderedLinkIds must match the page links exactly' },
      { status: 400 },
    );
  }

  // D1 rejects drizzle's BEGIN/COMMIT transactions — use an atomic
  // batch of per-row UPDATEs instead.
  const updates = orderedLinkIds.map((id: string, index: number) =>
    db
      .update(links)
      .set({ sortOrder: index })
      .where(and(eq(links.pageId, pageId), eq(links.id, id))),
  );
  if (updates.length > 0) {
    await db.batch(updates as [(typeof updates)[number], ...typeof updates]);
  }

  const reorderedLinks = await db
    .select()
    .from(links)
    .where(eq(links.pageId, pageId))
    .orderBy(asc(links.sortOrder));

  return NextResponse.json(reorderedLinks);
}
