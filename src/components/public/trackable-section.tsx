'use client';

import { useEffect, useRef } from 'react';

import { trackEvent } from '@/lib/analytics';

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
        trackEvent(slug, {
          eventType: 'section_view',
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
