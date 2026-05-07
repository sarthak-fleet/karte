'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { trackEvent } from '@/lib/analytics';

const RESERVED_PATHS = new Set(['', 'dashboard', 'login', 'api']);

function getPublicSlug(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length !== 1) {
    return null;
  }

  if (RESERVED_PATHS.has(parts[0])) {
    return null;
  }

  return parts[0];
}

function isExternalUrl(href: string) {
  try {
    const url = new URL(href, window.location.href);
    if (['mailto:', 'tel:'].includes(url.protocol)) {
      return true;
    }

    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.origin !== window.location.origin
      : false;
  } catch {
    return false;
  }
}

export function PageAnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const slug = getPublicSlug(pathname);
    if (!slug || lastTrackedPath.current === pathname) {
      return;
    }

    lastTrackedPath.current = pathname;

    trackEvent(slug, {
      eventType: 'page_view',
      metadata: {
        pathname,
        referrer: document.referrer || null,
      },
    });
  }, [pathname]);

  useEffect(() => {
    const analyticsSlug = getPublicSlug(pathname);
    if (!analyticsSlug) {
      return;
    }
    const slug = analyticsSlug;

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest('a');
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute('href');
      if (!href || !isExternalUrl(href)) {
        return;
      }

      trackEvent(slug, {
        eventType: 'outbound_click',
        resourceType: anchor.getAttribute('data-track-type') || 'outbound',
        resourceId: anchor.getAttribute('data-track-id') || href,
        resourceLabel:
          anchor.getAttribute('data-track-label') ||
          anchor.getAttribute('aria-label') ||
          anchor.textContent?.trim() ||
          href,
        metadata: {
          href,
        },
      });
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  return null;
}
