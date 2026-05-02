'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { getOrCreateVisitorId } from '@/lib/visitor-id';

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

function postEvent(slug: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  const headers = { 'Content-Type': 'application/json' };

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    const ok = navigator.sendBeacon(`/api/track/${slug}`, blob);
    if (ok) return;
  }

  void fetch(`/api/track/${slug}`, {
    method: 'POST',
    headers,
    body,
    keepalive: true,
  });
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

    postEvent(slug, {
      eventType: 'page_view',
      visitorId: getOrCreateVisitorId(),
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

      postEvent(slug, {
        eventType: 'outbound_click',
        visitorId: getOrCreateVisitorId(),
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
