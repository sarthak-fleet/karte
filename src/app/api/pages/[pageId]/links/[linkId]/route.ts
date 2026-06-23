import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { links } from '@/db/schema';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';
import { isValidUrl, MAX_TITLE_LENGTH } from '@/lib/validation';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ pageId: string; linkId: string }> },
) {
  const { pageId, linkId } = await params;
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const page = await loadOwnedPage(pageId, auth.userId);
  if (!page) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [existing] = await db
    .select()
    .from(links)
    .where(and(eq(links.id, linkId), eq(links.pageId, pageId)));
  if (!existing)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();

  // Field-by-field upsert: undefined → keep existing, null/empty → clear,
  // string → set. Lets callers send partial updates.
  const next = {
    title: typeof body.title === 'string' ? body.title.trim() : existing.title,
    url: typeof body.url === 'string' ? body.url.trim() : existing.url,
    icon:
      body.icon === undefined
        ? existing.icon
        : typeof body.icon === 'string' && body.icon.trim()
          ? body.icon.trim()
          : null,
    imageUrl:
      body.imageUrl === undefined
        ? existing.imageUrl
        : typeof body.imageUrl === 'string' && body.imageUrl.trim()
          ? body.imageUrl.trim()
          : null,
    body:
      body.body === undefined
        ? existing.body
        : typeof body.body === 'string' && body.body.trim()
          ? body.body.trim()
          : null,
    enabled:
      body.enabled === undefined ? existing.enabled : Boolean(body.enabled),
  };

  if (!next.title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }
  if (!next.url || !isValidUrl(next.url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }
  if (next.title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      { error: `Title too long (max ${MAX_TITLE_LENGTH} chars)` },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(links)
    .set(next)
    .where(and(eq(links.id, linkId), eq(links.pageId, pageId)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; linkId: string }> },
) {
  const { pageId, linkId } = await params;
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  // Verify page ownership
  const page = await loadOwnedPage(pageId, auth.userId);

  if (!page) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await db
    .delete(links)
    .where(and(eq(links.id, linkId), eq(links.pageId, pageId)));

  return NextResponse.json({ success: true });
}
