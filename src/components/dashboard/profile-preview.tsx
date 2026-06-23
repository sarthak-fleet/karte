'use client';

import { useState } from 'react';

interface ProfilePreviewProps {
  slug: string;
  /** Bumped on save to force the iframe to reload with fresh content. */
  refreshKey: number;
}

type Frame = 'phone' | 'desktop';

const FRAMES: Record<
  Frame,
  { label: string; widthClass: string; aspect: string }
> = {
  phone: {
    label: 'Phone',
    widthClass: 'max-w-[400px]',
    aspect: 'aspect-[9/19.5]',
  },
  desktop: {
    label: 'Desktop',
    widthClass: 'max-w-full',
    aspect: 'aspect-[4/3]',
  },
};

/**
 * Live profile preview. Iframes the real /[slug] page so the preview is
 * exactly what visitors see — no fake mock to maintain alongside the
 * real renderer. Mobile/desktop toggle, manual refresh, open-in-new-tab.
 *
 * The iframe key combines `refreshKey` (bumped on save) and `frame` so
 * switching device or saving forces a clean reload, not a cached one.
 */
export function ProfilePreview({ slug, refreshKey }: ProfilePreviewProps) {
  const [frame, setFrame] = useState<Frame>('phone');
  const [localRefresh, setLocalRefresh] = useState(0);
  const cfg = FRAMES[frame];
  const iframeKey = `${frame}-${refreshKey}-${localRefresh}`;
  const href = `/${slug}`;

  return (
    <div className="rounded-2xl bg-white/[0.02] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span className="text-karte-accent/80">·</span> Live preview
          </p>
          <p className="mt-1 font-mono text-[12px] text-karte-text-3">
            karte.cc/{slug}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-white/[0.04] p-0.5 text-[12px]">
            {(Object.keys(FRAMES) as Frame[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrame(f)}
                className={`rounded-full px-3 py-1 font-medium transition-colors duration-150 ${
                  frame === f
                    ? 'bg-white/[0.08] text-karte-text'
                    : 'text-karte-text-3 hover:text-karte-text'
                }`}
              >
                {FRAMES[f].label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLocalRefresh((n) => n + 1)}
            title="Refresh"
            aria-label="Refresh preview"
            className="rounded-full p-1.5 text-karte-text-3 transition-colors duration-150 hover:bg-white/[0.05] hover:text-karte-text"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.84 1.05 6.5 2.74" />
              <path d="M21 4v5h-5" />
            </svg>
          </button>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            aria-label="Open profile in new tab"
            className="rounded-full p-1.5 text-karte-text-3 transition-colors duration-150 hover:bg-white/[0.05] hover:text-karte-text"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className={`relative w-full ${cfg.widthClass} overflow-hidden rounded-[28px] border border-karte-border-strong bg-karte-bg`}
          style={{
            boxShadow:
              '0 20px 60px -30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {frame === 'phone' && (
            <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-1 w-12 -translate-x-1/2 rounded-full bg-white/[0.10]" />
          )}
          <div className={`w-full ${cfg.aspect}`}>
            <iframe
              key={iframeKey}
              src={href}
              title={`Preview of karte.cc/${slug}`}
              loading="lazy"
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
