'use client';

import { type ReactNode,useEffect, useState } from 'react';

interface SafeImageProps {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Rendered while loading. Defaults to nothing (no flash). */
  loading?: ReactNode;
  /** Rendered if the image fails to load OR src is empty. Defaults to nothing. */
  fallback?: ReactNode;
}

type Status = 'loading' | 'loaded' | 'error';

/**
 * Image with built-in preload + load/error state. Renders the
 * children-or-fallback based on whether the image actually loaded.
 *
 * Why: project cards, pet avatars, and other places used to render
 * a broken-image icon when the source URL 404'd or the host blocked
 * the request. This component preloads via `new Image()` and only
 * commits the `<img>` to the DOM once the browser has confirmed the
 * pixels are available. If the load fails, the fallback renders
 * instead — so a missing favicon shows the accent gradient, and a
 * missing pet avatar simply doesn't show a pet.
 *
 * Implementation note: a regular `<img onError>` flickers — the
 * browser paints the broken icon for one frame before React unmounts
 * it. Pre-loading via `new Image()` avoids that flicker entirely.
 */
export function SafeImage({
  src,
  alt = '',
  className,
  style,
  loading = null,
  fallback = null,
}: SafeImageProps) {
  const [status, setStatus] = useState<Status>(src ? 'loading' : 'error');

  useEffect(() => {
    if (!src) {
      setStatus('error');
      return;
    }
    setStatus('loading');

    // Off-DOM preload — never causes flicker because the real <img>
    // is only mounted once we know it succeeds.
    const img = new window.Image();
    let cancelled = false;
    img.onload = () => {
      if (!cancelled) setStatus('loaded');
    };
    img.onerror = () => {
      if (!cancelled) setStatus('error');
    };
    img.src = src;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  // While loading we show the loading prop if given, otherwise the
  // fallback. This avoids a Flash Of No Content during preload — the
  // server-rendered HTML already has the fallback in place; the img
  // swaps in once we've verified it loads.
  if (status === 'loading') return <>{loading ?? fallback}</>;
  if (status === 'error' || !src) return <>{fallback}</>;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} style={style} />;
}
