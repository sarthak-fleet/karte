'use client';

import { useEffect, useState } from 'react';

interface ProfileAvatarProps {
  src: string | null;
  alt: string;
  initials: string;
  accentColor: string;
}

type Outcome = 'pending' | 'loaded' | 'error';

/**
 * Hero-sized profile avatar with a graceful fallback to gradient +
 * initials when the source URL fails to load.
 *
 * Why this exists: the third-party avatar host (DiceBear) has been
 * intermittently unreachable in the wild. next/image silently breaks
 * when its source 404s; that leaves a broken-image slot on the
 * hero — the most-seen surface on the profile. With this wrapper we
 * preload via `new Image()` and only mount the real <Image> once
 * we've confirmed the bytes are available.
 *
 * Server-rendered initial state shows the gradient placeholder so
 * the first paint is never empty.
 */
export function ProfileAvatar({
  src,
  alt,
  initials,
  accentColor,
}: ProfileAvatarProps) {
  // Key outcomes by src so changing the avatar URL doesn't require a
  // synchronous setState-in-effect reset (which trips
  // react-hooks/set-state-in-effect). Status is fully derived from
  // the current src plus its recorded load outcome.
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const outcome: Outcome = src ? (outcomes[src] ?? 'pending') : 'error';
  const status: 'loading' | 'loaded' | 'error' =
    outcome === 'loaded' ? 'loaded' : outcome === 'error' ? 'error' : 'loading';

  useEffect(() => {
    if (!src) return;
    if (outcomes[src]) return; // already resolved

    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) setOutcomes((prev) => ({ ...prev, [src]: 'loaded' }));
    };
    img.onerror = () => {
      if (!cancelled) setOutcomes((prev) => ({ ...prev, [src]: 'error' }));
    };
    img.src = src;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [src, outcomes]);

  if (status === 'loaded' && src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className="relative h-28 w-28 rounded-3xl object-cover ring-1 ring-white/[0.10] sm:h-32 sm:w-32"
      />
    );
  }

  // Gradient + initials fallback: shown while loading AND on error.
  return (
    <div
      aria-label={alt}
      className="relative flex h-28 w-28 items-center justify-center rounded-3xl text-3xl font-semibold text-zinc-950 ring-1 ring-white/[0.10] sm:h-32 sm:w-32 sm:text-4xl"
      style={{
        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)`,
      }}
    >
      {initials}
    </div>
  );
}
