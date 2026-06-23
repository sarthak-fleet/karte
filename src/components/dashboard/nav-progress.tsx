'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Linear-style top progress bar: a thin cyan strip that animates 0→90% on each
// route change, then flips to 100% once the new pathname is committed. Gives
// users a clear "navigation is happening" signal without taking over the page
// with a full-page skeleton.
//
// Detection model: we watch `usePathname()`. The first render after a click
// has the OLD pathname (transition hasn't committed yet); we don't know
// transition started here. So we attach a click listener to the document that
// catches anchor clicks targeting an in-app route — that's our "loading start"
// signal. The pathname change is our "loading complete" signal.
export function NavProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<'idle' | 'starting' | 'finishing'>('idle');

  useEffect(() => {
    function onAnchorClick(e: MouseEvent) {
      // Ignore modifier-clicks (open in new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      // External / mailto / hash-only / new-tab links skip the bar
      if (href.startsWith('http') && !href.startsWith(window.location.origin))
        return;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (href.startsWith('#')) return;
      if (anchor.target === '_blank') return;

      setState('starting');
    }

    document.addEventListener('click', onAnchorClick);
    return () => document.removeEventListener('click', onAnchorClick);
  }, []);

  // When the pathname changes, that means the new page committed — flip to
  // "finishing", then back to idle after a short delay so the bar fades out.
  useEffect(() => {
    if (state !== 'starting') return;
    setState('finishing');
    const id = window.setTimeout(() => setState('idle'), 280);
    return () => window.clearTimeout(id);
    // we deliberately only react to pathname changes here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] overflow-hidden"
    >
      <div
        className={`h-full origin-left bg-karte-accent transition-[transform,opacity] duration-300 ease-[var(--karte-ease)] ${
          state === 'idle'
            ? 'scale-x-0 opacity-0'
            : state === 'starting'
              ? 'scale-x-[0.85] opacity-100'
              : 'scale-x-100 opacity-0'
        }`}
        style={{
          transitionDuration: state === 'starting' ? '700ms' : '300ms',
        }}
      />
    </div>
  );
}
