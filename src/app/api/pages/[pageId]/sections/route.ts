import { NextResponse } from 'next/server';
import { and, asc, desc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth-server';
import { db, ensureProjectsTable } from '@/db';
import { pages, pageSections } from '@/db/schema';
import {
  MAX_SECTION_CONTENT_LENGTH,
  MAX_TITLE_LENGTH,
  isValidUrl,
} from '@/lib/validation';
import { isPageSectionType } from '@/lib/page-sections';

async function verifyPageOwnership(pageId: string, userId: string) {
  const [page] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, userId)));

  return page ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureProjectsTable();

  const page = await verifyPageOwnership(pageId, session.user.id);
  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sections = await db
    .select()
    .from(pageSections)
    .where(eq(pageSections.pageId, pageId))
    .orderBy(asc(pageSections.sortOrder));

  return NextResponse.json(sections);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureProjectsTable();

  const page = await verifyPageOwnership(pageId, session.user.id);
  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const type = typeof body.type === 'string' ? body.type : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const buttonLabel =
    typeof body.buttonLabel === 'string' && body.buttonLabel.trim()
      ? body.buttonLabel.trim()
      : null;
  const buttonUrl =
    typeof body.buttonUrl === 'string' && body.buttonUrl.trim()
      ? body.buttonUrl.trim()
      : null;
  const enabled = body.enabled !== undefined ? Boolean(body.enabled) : true;

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

  const [maxSection] = await db
    .select({ sortOrder: pageSections.sortOrder })
    .from(pageSections)
    .where(eq(pageSections.pageId, pageId))
    .orderBy(desc(pageSections.sortOrder))
    .limit(1);

  const nextOrder = (maxSection?.sortOrder ?? -1) + 1;

  const [section] = await db
    .insert(pageSections)
    .values({
      pageId,
      type,
      title,
      content,
      buttonLabel: normalizedButtonLabel,
      buttonUrl: normalizedButtonUrl,
      sortOrder: nextOrder,
      enabled,
    })
    .returning();

  return NextResponse.json(section, { status: 201 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureProjectsTable();

  const page = await verifyPageOwnership(pageId, session.user.id);
  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const orderedSectionIds = Array.isArray(body.orderedSectionIds)
    ? body.orderedSectionIds.filter(
        (value: unknown): value is string => typeof value === 'string',
      )
    : [];

  if (orderedSectionIds.length === 0) {
    return NextResponse.json(
      { error: 'orderedSectionIds are required' },
      { status: 400 },
    );
  }

  const currentSections = await db
    .select({ id: pageSections.id })
    .from(pageSections)
    .where(eq(pageSections.pageId, pageId));

  const currentIds = currentSections.map((section) => section.id).sort();
  const requestedIds = [...new Set(orderedSectionIds)].sort();

  if (
    currentIds.length !== requestedIds.length ||
    currentIds.some((id, index) => id !== requestedIds[index])
  ) {
    return NextResponse.json(
      { error: 'orderedSectionIds must match the page sections exactly' },
      { status: 400 },
    );
  }

  await db.transaction(async (tx) => {
    for (let index = 0; index < orderedSectionIds.length; index += 1) {
      await tx
        .update(pageSections)
        .set({ sortOrder: index })
        .where(
          and(
            eq(pageSections.pageId, pageId),
            eq(pageSections.id, orderedSectionIds[index]),
          ),
        );
    }
  });

  const sections = await db
    .select()
    .from(pageSections)
    .where(eq(pageSections.pageId, pageId))
    .orderBy(asc(pageSections.sortOrder));

  return NextResponse.json(sections);
}
