import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { pages, pageSections } from '@/db/schema';
import { getSession } from '@/lib/auth-server';
import { isPageSectionType } from '@/lib/page-sections';
import {
  isValidUrl,
  MAX_SECTION_CONTENT_LENGTH,
  MAX_TITLE_LENGTH,
} from '@/lib/validation';

async function verifyPageOwnership(pageId: string, userId: string) {
  const [page] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, userId)));

  return page ?? null;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ pageId: string; sectionId: string }> },
) {
  const { pageId, sectionId } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureProjectsTable();

  const page = await verifyPageOwnership(pageId, session.user.id);
  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [existing] = await db
    .select()
    .from(pageSections)
    .where(and(eq(pageSections.id, sectionId), eq(pageSections.pageId, pageId)));

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const type = typeof body.type === 'string' ? body.type : existing.type;
  const title =
    typeof body.title === 'string' ? body.title.trim() : existing.title;
  const content =
    typeof body.content === 'string'
      ? body.content.trim()
      : existing.content ?? '';
  const buttonLabel =
    body.buttonLabel === undefined
      ? existing.buttonLabel
      : typeof body.buttonLabel === 'string'
        ? body.buttonLabel.trim() || null
        : null;
  const buttonUrl =
    body.buttonUrl === undefined
      ? existing.buttonUrl
      : typeof body.buttonUrl === 'string'
        ? body.buttonUrl.trim() || null
        : null;
  const enabled =
    body.enabled !== undefined ? Boolean(body.enabled) : existing.enabled;

  if (!isPageSectionType(type)) {
    return NextResponse.json({ error: 'Invalid section type' }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      { error: 'Title too long (max 100 chars)' },
      { status: 400 },
    );
  }

  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  if (content.length > MAX_SECTION_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: 'Content too long (max 2000 chars)' },
      { status: 400 },
    );
  }

  if (buttonUrl && !isValidUrl(buttonUrl)) {
    return NextResponse.json(
      { error: 'Button URL must be a valid URL' },
      { status: 400 },
    );
  }

  if (type === 'cta' && (!buttonLabel || !buttonUrl)) {
    return NextResponse.json(
      { error: 'CTA sections require both a button label and URL' },
      { status: 400 },
    );
  }

  const normalizedButtonLabel = type === 'cta' ? buttonLabel : null;
  const normalizedButtonUrl = type === 'cta' ? buttonUrl : null;

  const [updated] = await db
    .update(pageSections)
    .set({
      type,
      title,
      content,
      buttonLabel: normalizedButtonLabel,
      buttonUrl: normalizedButtonUrl,
      enabled,
    })
    .where(and(eq(pageSections.id, sectionId), eq(pageSections.pageId, pageId)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; sectionId: string }> },
) {
  const { pageId, sectionId } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureProjectsTable();

  const page = await verifyPageOwnership(pageId, session.user.id);
  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db
    .delete(pageSections)
    .where(and(eq(pageSections.id, sectionId), eq(pageSections.pageId, pageId)));

  return NextResponse.json({ success: true });
}
