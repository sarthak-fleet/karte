'use client';

import { useEffect, useRef } from 'react';

import { getOrCreateVisitorId } from '@/lib/visitor-id';

function postEvent(slug: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
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

export function TrackableSection({
  slug,
  sectionId,
  sectionType,
  sectionTitle,
  children,
}: {
  slug: string;
  sectionId: string;
  sectionType: string;
  sectionTitle: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || trackedRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.4) {
          return;
        }

        trackedRef.current = true;
        postEvent(slug, {
          eventType: 'section_view',
          visitorId: getOrCreateVisitorId(),
          resourceType: sectionType,
          resourceId: sectionId,
          resourceLabel: sectionTitle,
        });
        observer.disconnect();
      },
      { threshold: [0.4] },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [sectionId, sectionTitle, sectionType, slug]);

  return <div ref={ref}>{children}</div>;
}
