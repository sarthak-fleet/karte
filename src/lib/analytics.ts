import { getOrCreateVisitorId } from './visitor-id';

export type EventType =
  | 'page_view'
  | 'outbound_click'
  | 'contact_submit'
  | 'section_view'
  | 'hook_open'
  | 'chat_cta_click'
  | 'dm_start'
  | 'dm_submit';

export interface TrackPayload {
  eventType: EventType;
  resourceType?: string;
  resourceId?: string;
  resourceLabel?: string;
  metadata?: Record<string, unknown>;
}

export function trackEvent(slug: string, payload: TrackPayload) {
  const fullPayload = {
    ...payload,
    visitorId: getOrCreateVisitorId(),
  };

  const body = JSON.stringify(fullPayload);

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon(`/api/track/${slug}`, blob)) {
      return;
    }
  }

  void fetch(`/api/track/${slug}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  });
}
