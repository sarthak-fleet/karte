'use client';

const roomStorageKey = (slug: string) => `linkchat:room:${slug}`;

export function getStoredRoomId(slug: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(roomStorageKey(slug));
}

export function setStoredRoomId(slug: string, roomId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(roomStorageKey(slug), roomId);
}

export function clearStoredRoomId(slug: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(roomStorageKey(slug));
}

export function buildRoomShareUrl(slug: string, roomId: string): string {
  if (typeof window === 'undefined') {
    return `/${slug}?room=${encodeURIComponent(roomId)}`;
  }

  const url = new URL(window.location.href);
  url.pathname = `/${slug}`;
  url.searchParams.set('room', roomId);
  return url.toString();
}
