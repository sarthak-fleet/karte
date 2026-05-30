'use client';

import { useSyncExternalStore } from 'react';

// SSR-safe subscription to the prefers-reduced-motion media query.
// Returns `false` on the server (motion is the default) and the live
// value on the client, updating if the user toggles the OS setting.
//
// Replaces the older `useState + useEffect → setState` pattern which
// trips react-hooks/set-state-in-effect by calling setState
// synchronously during the effect run.

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia(MEDIA_QUERY);
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MEDIA_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
