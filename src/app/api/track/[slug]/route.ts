import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { pageEvents, pages } from '@/db/schema';
import { isValidSlug } from '@/lib/validation';

const EVENT_TYPES = new Set([
  'page_view',
  'outbound_click',
  'contact_submit',
  'section_view',
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  await ensureProjectsTable();

  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.published, true)));

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const eventType = typeof body.eventType === 'string' ? body.eventType : '';
  const visitorId =
    typeof body.visitorId === 'string' && body.visitorId.trim()
      ? body.visitorId.trim()
      : null;
  const resourceType =
    typeof body.resourceType === 'string' && body.resourceType.trim()
      ? body.resourceType.trim()
      : null;
  const resourceId =
    typeof body.resourceId === 'string' && body.resourceId.trim()
      ? body.resourceId.trim()
      : null;
  const resourceLabel =
    typeof body.resourceLabel === 'string' && body.resourceLabel.trim()
      ? body.resourceLabel.trim()
      : null;
  const metadata =
    body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
      ? (body.metadata as Record<string, unknown>)
      : null;

  if (!EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
  }

  await db.insert(pageEvents).values({
    pageId: page.id,
    visitorId,
    eventType,
    resourceType,
    resourceId,
    resourceLabel,
    metadata,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
