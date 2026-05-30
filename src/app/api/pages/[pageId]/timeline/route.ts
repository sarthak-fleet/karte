import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import type { TimelineEventStatus, TimelineEventType } from '@/db/schema';
import { pages, timelineEvents } from '@/db/schema';
import { getSession } from '@/lib/auth-server';
import { parseWhenLabel } from '@/lib/timeline';

const VALID_TYPES: ReadonlyArray<TimelineEventType> = [
  'joined-company',
  'shipped-project',
  'launched-product',
  'wrote-essay',
  'spoke-at',
  'shipped-release',
  'moved-to',
  'life-event',
  'agent-deployed',
  'agent-capability-added',
  'agent-ownership-changed',
  'custom',
];

const VALID_STATUSES: ReadonlyArray<TimelineEventStatus> = [
  'published',
  'pending-review',
  'hidden',
];

const MAX_TITLE = 200;
const MAX_BODY = 1500;
const MAX_FIELD = 200;

async function verifyOwnership(pageId: string, userId: string) {
  const [page] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, userId)));
  return page ?? null;
}

// GET — list events for a page. Owner-only; future: a "public" mode
// for the visible timeline render (filters hidden + pending-review).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { pageId } = await params;
  const page = await verifyOwnership(pageId, session.user.id);
  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const events = await db
    .select()
    .from(timelineEvents)
    .where(eq(timelineEvents.pageId, pageId))
    .orderBy(desc(timelineEvents.sortDate));

  return NextResponse.json({ events });
}

// POST — create a new event. Defaults: source=manual, status=published.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { pageId } = await params;
  const page = await verifyOwnership(pageId, session.user.id);
  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const type = typeof body.type === 'string' ? body.type : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const whenLabel = typeof body.whenLabel === 'string' ? body.whenLabel.trim() : '';

  if (!type || !VALID_TYPES.includes(type as TimelineEventType)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (!title || title.length > MAX_TITLE) {
    return NextResponse.json({ error: 'Title is required (max 200 chars)' }, { status: 400 });
  }
  if (!whenLabel) {
    return NextResponse.json({ error: 'whenLabel is required' }, { status: 400 });
  }

  const sortDate = parseWhenLabel(whenLabel);

  const [event] = await db
    .insert(timelineEvents)
    .values({
      pageId,
      type: type as TimelineEventType,
      title,
      body: stringOrNull(body.body, MAX_BODY),
      whereLabel: stringOrNull(body.whereLabel, MAX_FIELD),
      link: stringOrNull(body.link, MAX_FIELD),
      imageUrl: stringOrNull(body.imageUrl, MAX_FIELD),
      whenLabel,
      sortDate,
      source: 'manual',
      status: 'published',
    })
    .returning();

  return NextResponse.json({ event }, { status: 201 });
}

function stringOrNull(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

// VALID_STATUSES kept local — Next.js route files can only export
// HTTP handlers, so we don't re-export this constant here. The
// [eventId]/route.ts file has its own copy.
