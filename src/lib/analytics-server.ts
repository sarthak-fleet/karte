import { getCloudflareContext } from '@opennextjs/cloudflare';

import { db } from '@/db';
import { pageEvents } from '@/db/schema';

export type EventType =
  | 'page_view'
  | 'outbound_click'
  | 'contact_submit'
  | 'section_view'
  | 'hook_open'
  | 'chat_cta_click'
  | 'dm_start'
  | 'dm_submit';

export interface AnalyticsEvent {
  slug: string;
  pageId: string;
  visitorId?: string | null;
  eventType: EventType;
  resourceType?: string | null;
  resourceId?: string | null;
  resourceLabel?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface AnalyticsEngineDataset {
  writeDataPoint(event: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

function getAnalyticsDataset(): AnalyticsEngineDataset | null {
  try {
    const { env } = getCloudflareContext();
    return (env as any).ANALYTICS ?? null;
  } catch {
    return null;
  }
}

export async function recordEvent(event: AnalyticsEvent) {
  const {
    slug,
    pageId,
    visitorId,
    eventType,
    resourceType,
    resourceId,
    resourceLabel,
    metadata,
  } = event;

  // 1. Primary high-volume ingestion to Workers Analytics Engine
  const analytics = getAnalyticsDataset();
  if (analytics) {
    try {
      // Sanitize metadata to only include coarse/non-sensitive fields
      let coarseMetadata: Record<string, unknown> | null = null;
      if (metadata) {
        coarseMetadata = { ...metadata };
        // Remove known sensitive fields
        delete coarseMetadata.email;
        delete coarseMetadata.name;
        delete coarseMetadata.message;
      }

      analytics.writeDataPoint({
        blobs: [
          slug,
          eventType,
          visitorId || '',
          resourceType || '',
          resourceId || '',
          pageId,
          // Avoid person names in labels for WAE
          eventType === 'contact_submit' || eventType === 'dm_submit'
            ? 'form_submission'
            : (resourceLabel || ''),
          coarseMetadata ? JSON.stringify(coarseMetadata) : '',
        ],
        indexes: [slug],
      });
    } catch (err) {
      console.error('[analytics] Failed to write to Analytics Engine:', err);
    }
  }

  // 2. Secondary write to DB to preserve dashboard behavior
  try {
    await db.insert(pageEvents).values({
      pageId,
      visitorId,
      eventType,
      resourceType,
      resourceId,
      resourceLabel,
      metadata,
    });
  } catch (err) {
    console.error('[analytics] Failed to write to database:', err);
  }
}
