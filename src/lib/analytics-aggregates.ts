import { sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  dailyResourceStats,
  dailyStats,
  dailyVisitorEvents,
} from '@/db/schema';

export type TrackEventParams = {
  pageId: string;
  visitorId: string | null;
  eventType: string;
  resourceType?: string | null;
  resourceId?: string | null;
  resourceLabel?: string | null;
  createdAt?: Date;
};

export async function recordAggregate(params: TrackEventParams) {
  const {
    pageId,
    visitorId,
    eventType,
    resourceType,
    resourceId,
    resourceLabel,
    createdAt = new Date(),
  } = params;

  const date = createdAt.toISOString().split('T')[0];

  let isNewVisitor = false;
  if (visitorId) {
    try {
      await db.insert(dailyVisitorEvents).values({
        pageId,
        visitorId,
        date,
        eventType,
        resourceId: resourceId ?? null,
      });
      isNewVisitor = true;
    } catch {
      isNewVisitor = false;
    }
  }

  const effectiveEventType =
    eventType === 'contact_submit' && !resourceId ? 'dm_conversion' : eventType;

  if (resourceId && resourceType) {
    await db
      .insert(dailyResourceStats)
      .values({
        pageId,
        date,
        eventType: effectiveEventType,
        resourceType,
        resourceId,
        resourceLabel,
        count: 1,
        visitors: isNewVisitor ? 1 : 0,
      })
      .onConflictDoUpdate({
        target: [
          dailyResourceStats.pageId,
          dailyResourceStats.date,
          dailyResourceStats.eventType,
          dailyResourceStats.resourceId,
        ],
        set: {
          count: sql`${dailyResourceStats.count} + 1`,
          visitors: isNewVisitor
            ? sql`${dailyResourceStats.visitors} + 1`
            : dailyResourceStats.visitors,
          resourceLabel: resourceLabel ?? dailyResourceStats.resourceLabel,
        },
      });
    return;
  }

  await db
    .insert(dailyStats)
    .values({
      pageId,
      date,
      eventType: effectiveEventType,
      count: 1,
      visitors: isNewVisitor ? 1 : 0,
    })
    .onConflictDoUpdate({
      target: [dailyStats.pageId, dailyStats.date, dailyStats.eventType],
      set: {
        count: sql`${dailyStats.count} + 1`,
        visitors: isNewVisitor
          ? sql`${dailyStats.visitors} + 1`
          : dailyStats.visitors,
      },
    });
}
