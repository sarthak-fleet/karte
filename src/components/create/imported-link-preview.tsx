'use client';

import { LinkCard } from '@/components/public/link-card';

export interface ImportedLinkItem {
  title: string;
  url: string;
}

/**
 * Renders the imported links as a mini Karte profile preview — just the
 * stacked link cards, no chat widget or other Karte chrome. Visual tone
 * mirrors the real public profile so the visitor can see exactly what
 * their page will look like after claiming.
 */
export function ImportedLinkPreview({
  links,
  sourceUrl,
}: {
  links: ImportedLinkItem[];
  sourceUrl?: string | null;
}) {
  if (links.length === 0) return null;

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span className="text-karte-accent/80">·</span> Live preview
          </p>
          <p className="mt-2 text-sm text-karte-text-3">
            {links.length} link{links.length === 1 ? '' : 's'} imported
            {sourceUrl ? (
              <span className="text-karte-text-4"> · from {prettyHost(sourceUrl)}</span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-3">
        {links.map((item) => (
          <LinkCard
            key={item.url}
            title={item.title}
            url={item.url}
          />
        ))}
      </div>
    </div>
  );
}

function prettyHost(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return value;
  }
}
