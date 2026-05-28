import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { pages, timelineEvents } from '@/db/schema';
import type {
  TimelineEventStatus,
  TimelineEventType,
} from '@/db/schema';
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

async function verifyOwnership(pageId: string, eventId: string, userId: string) {
  const [row] = await db
    .select({
      eventId: timelineEvents.id,
      pageOwner: pages.userId,
    })
    .from(timelineEvents)
    .innerJoin(pages, eq(pages.id, timelineEvents.pageId))
    .where(
      and(
        eq(timelineEvents.id, eventId),
        eq(timelineEvents.pageId, pageId),
        eq(pages.userId, userId),
      ),
    );
  return row?.eventId ?? null;
}

// PATCH — update a subset of fields. Partial body allowed.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ pageId: string; eventId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { pageId, eventId } = await params;
  const owned = await verifyOwnership(pageId, eventId, session.user.id);
  if (!owned) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if (typeof body.type === 'string') {
    if (!VALID_TYPES.includes(body.type as TimelineEventType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    patch.type = body.type;
  }
  if (typeof body.title === 'string') {
    const t = body.title.trim();
    if (!t || t.length > MAX_TITLE) {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
    }
    patch.title = t;
  }
  if ('body' in body) patch.body = stringOrNull(body.body, MAX_BODY);
  if ('whereLabel' in body) patch.whereLabel = stringOrNull(body.whereLabel, MAX_FIELD);
  if ('link' in body) patch.link = stringOrNull(body.link, MAX_FIELD);
  if ('imageUrl' in body) patch.imageUrl = stringOrNull(body.imageUrl, MAX_FIELD);
  if (typeof body.whenLabel === 'string') {
    const w = body.whenLabel.trim();
    if (!w) {
      return NextResponse.json({ error: 'whenLabel is required' }, { status: 400 });
    }
    patch.whenLabel = w;
    patch.sortDate = parseWhenLabel(w);
  }
  if (typeof body.status === 'string') {
    if (!VALID_STATUSES.includes(body.status as TimelineEventStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    patch.status = body.status;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const [updated] = await db
    .update(timelineEvents)
    .set(patch)
    .where(eq(timelineEvents.id, eventId))
    .returning();

  return NextResponse.json({ event: updated });
}

// DELETE — remove an event.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; eventId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { pageId, eventId } = await params;
  const owned = await verifyOwnership(pageId, eventId, session.user.id);
  if (!owned) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.delete(timelineEvents).where(eq(timelineEvents.id, eventId));
  return NextResponse.json({ ok: true });
}

function stringOrNull(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}
