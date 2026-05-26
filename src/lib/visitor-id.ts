'use client';

const VISITOR_ID_KEY = 'karte_visitor_id';
const COOKIE_NAME = 'lc_vid';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function getOrCreateVisitorId() {
  if (typeof window === 'undefined') {
    return null;
  }

  // 1. Try cookie first (more stable across subdomains/clearing storage)
  let visitorId = getCookie(COOKIE_NAME);

  // 2. Fallback to localStorage
  if (!visitorId) {
    visitorId = window.localStorage.getItem(VISITOR_ID_KEY);
  }

  // 3. Generate new one if both missing
  if (!visitorId) {
    visitorId = crypto.randomUUID();
  }

  // Always mirror to localStorage for client-side persistence/batching
  if (window.localStorage.getItem(VISITOR_ID_KEY) !== visitorId) {
    window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }

  return visitorId;
}
