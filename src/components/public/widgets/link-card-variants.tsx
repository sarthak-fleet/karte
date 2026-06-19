import { hostnameFromUrl } from '@/lib/hostname';
import type { WidgetVariant } from '@/lib/widget-types';

// Data shape consumed by every LinkCard variant. Includes optional richer
// fields (`imageUrl`, `body`) but the line variant — the only one we ship
// today — uses them sparingly. Keeping the type as-is so the picker /
// renderer don't need a sweep.
export interface LinkCardData {
  id: string;
  title: string;
  url: string;
  icon?: string | null;
  imageUrl?: string | null;
  body?: string | null;
}

// ── Brand-icon detection ────────────────────────────────────────────
// Map URL hostname → an SVG glyph (or character) so links auto-render
// with the right brand icon even when the user didn't supply one. We
// keep these inline so the bundle picks up only what's used, and we
// use the same source-of-truth as the dashboard expects.
//
// Strategy: simplest geometry that reads at 18-24px on dark surfaces.
// Single accent path, currentColor for theming.

function pathByHost(host: string): { d: string; viewBox?: string } | null {
  const h = host.toLowerCase();
  if (h.includes('github')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M12 2C6.475 2 2 6.475 2 12c0 4.425 2.875 8.175 6.875 9.5.5.075.675-.225.675-.475v-1.7c-2.775.6-3.4-1.325-3.4-1.325-.45-1.175-1.125-1.475-1.125-1.475-.925-.625.075-.625.075-.625 1.025.075 1.575 1.05 1.575 1.05.9 1.55 2.375 1.1 2.95.85.1-.65.35-1.1.625-1.35-2.2-.25-4.525-1.1-4.525-4.925 0-1.1.375-1.975 1.025-2.675-.1-.25-.45-1.275.1-2.65 0 0 .85-.275 2.75 1.025.8-.225 1.65-.325 2.5-.325s1.7.1 2.5.325c1.9-1.3 2.75-1.025 2.75-1.025.55 1.375.2 2.4.1 2.65.65.7 1.025 1.575 1.025 2.675 0 3.825-2.325 4.675-4.525 4.925.35.3.675.9.675 1.825V21c0 .25.175.55.675.475C19.125 20.175 22 16.425 22 12 22 6.475 17.525 2 12 2z',
    };
  }
  if (h.includes('linkedin')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8 17.5V10H5.5v7.5H8zm-1.25-8.625A1.5 1.5 0 1 0 6.75 5.875a1.5 1.5 0 0 0 0 3zM18.5 17.5v-4.1c0-2.05-1.1-3-2.575-3-1.2 0-1.75.65-2.05 1.1V10H11.4v7.5h2.5v-4.025c0-1.025.475-1.6 1.275-1.6.75 0 1.325.5 1.325 1.6V17.5h2z',
    };
  }
  if (h.includes('twitter') || h.includes('x.com')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z',
    };
  }
  if (h.includes('youtube')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.255 4 12 4 12 4s-6.255 0-7.814.418A2.506 2.506 0 0 0 2.418 6.186C2 7.745 2 12 2 12s0 4.255.418 5.814a2.506 2.506 0 0 0 1.768 1.768C5.745 20 12 20 12 20s6.255 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 16.255 22 12 22 12s0-4.255-.418-5.814zM10 15.464V8.536L16 12z',
    };
  }
  if (h.includes('instagram')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.175 8.796 2.163 12 2.163zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.25a3.25 3.25 0 1 1 0-6.5 3.25 3.25 0 0 1 0 6.5zm5.25-8.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z',
    };
  }
  if (h.includes('tiktok')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05 6.32 6.32 0 0 0-5.69 9.7 6.32 6.32 0 0 0 12.07-2.66V8.6a8.16 8.16 0 0 0 4.77 1.53V6.7c-.34 0-1.34-.01-1.34-.01z',
    };
  }
  if (h.includes('dribbble')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm8.043 8.59l-4.36-1.04a17.2 17.2 0 0 0-1.4-2.92 8.04 8.04 0 0 1 5.76 3.96zM12 4.05c.9 0 1.77.13 2.6.38a14.7 14.7 0 0 1 1.39 2.95C12.81 7.85 9.45 8 6.4 7.84A8.05 8.05 0 0 1 12 4.05zM4.05 12c0-.42.04-.83.1-1.23 3.4.21 7.13.07 10.7-.84.27.55.52 1.12.74 1.72-3.7.99-6.95 3.06-9.5 5.83A7.94 7.94 0 0 1 4.05 12zm3.7 7.3c2.27-2.6 5.23-4.55 8.65-5.46.94 2.78 1.4 5.7 1.43 8.66A7.92 7.92 0 0 1 12 19.95c-1.55 0-3.02-.45-4.25-1.65zm11.93-1.06a25.7 25.7 0 0 0-1.4-7.8c1.04-.05 2.1-.02 3.18.13a7.95 7.95 0 0 1-1.78 7.67z',
    };
  }
  if (h.includes('behance')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M9.5 12.5c.7-.4 1.2-1.2 1.2-2.2 0-1.9-1.4-3-3.5-3H2v11h5.5c2.4 0 4-1.2 4-3.4 0-1.3-.6-2.1-2-2.4zM5 9.5h2.2c1 0 1.5.5 1.5 1.2s-.5 1.2-1.5 1.2H5V9.5zm2.4 7H5v-2.7h2.4c1.1 0 1.7.5 1.7 1.4 0 .8-.6 1.3-1.7 1.3zm10.6-7.4c-2.8 0-4.6 2-4.6 4.5s1.8 4.5 4.6 4.5c2 0 3.5-.9 4.2-2.6h-2.4c-.3.6-.9 1-1.8 1-1.1 0-1.9-.7-2-1.9H22v-.6c0-2.6-1.7-4.9-4-4.9zm-2 3.5c.2-1 .9-1.6 2-1.6s1.8.6 1.9 1.6h-3.9zM14 6h6V7.5h-6V6z',
    };
  }
  if (h.includes('medium')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z',
    };
  }
  if (h.includes('substack')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z',
    };
  }
  if (h.includes('cal.com') || h.includes('calendly') || h.includes('savvycal')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1zm12 8H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9z',
    };
  }
  if (h.includes('spotify')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12C24 5.4 18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z',
    };
  }
  if (h.includes('threads')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291.553-.032 1.078-.025 1.566.013-.022-.396-.16-.74-.41-1.022-.343-.388-.876-.585-1.583-.585h-.045c-.567 0-1.337.156-1.83.879l-1.689-1.136c.66-.967 1.732-1.5 3.018-1.5h.06c2.143.014 3.42 1.317 3.547 3.58.073.03.142.064.212.098 1.402.66 2.426 1.66 2.962 2.893.747 1.715.815 4.518-1.66 6.945-1.886 1.85-4.175 2.683-7.426 2.708Z',
    };
  }
  if (h.includes('ko-fi')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M11.351 2.715c-2.7 0-4.768.001-6.832.703C2.454 4.121 1 5.879 1 9.184c0 3.328.6 5.578 1.952 7.097.95 1.062 2.198 1.682 3.752 1.916.6.087 1.265.137 2.097.137 5.358 0 8.232-2.06 8.594-6.165 4.945-.05 5.78-2.685 5.78-5.41 0-3.144-1.652-4.044-5.94-4.044zm.353 7.043c-.157 4.31-1.913 5.66-6.04 5.66H4.927l-.005-9.83h2.913c4.13 0 5.815 1.4 5.87 4.17zm5.685.92c-.255 0-.524-.02-.804-.06V5.93h.804c1.74 0 2.62.554 2.62 2.39 0 1.795-.88 2.358-2.62 2.358zm-9.99-3.59c-.973 0-1.812.36-2.353 1.014-.493-.708-1.355-1.014-2.143-1.014-1.785 0-3.082 1.43-3.082 3.402 0 2.32 1.866 4.013 2.972 4.92.493.41 1.196 1.05 1.785 1.66.394.41.926.624 1.428.624.502 0 1.034-.21 1.428-.624.59-.61 1.292-1.25 1.785-1.66 1.105-.907 2.972-2.6 2.972-4.92 0-1.972-1.297-3.402-3.082-3.402-.788 0-1.66.306-2.143 1.014-.541-.654-1.38-1.014-2.353-1.014z',
    };
  }
  if (h.includes('buymeacoffee')) {
    return {
      viewBox: '0 0 24 24',
      d: 'M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 0 0-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 0 0-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37a25.875 25.875 0 0 0 3.265-.099c.166-.014.331-.03.495-.046.485-.05.974-.139 1.398-.391.45-.273.7-.748.7-1.276 0-.36-.115-.717-.31-1.014-.078-.119-.17-.226-.272-.32a17.27 17.27 0 0 0-1.95-1.532c-.13-.083-.282-.18-.443-.18-.183 0-.328.131-.42.293-.087.16-.092.337-.013.501.083.165.215.296.346.42a13.875 13.875 0 0 1 2.04 2.474c-.046.044-.085.094-.118.149-.297.502-.65.969-1.04 1.402-.4.444-.873.85-1.394 1.183a8.5 8.5 0 0 1-1.71.788c-.638.21-1.301.34-1.978.376-1.379.075-2.844-.302-3.85-1.282-.5-.487-.85-1.107-1.082-1.762-.103-.295-.18-.6-.224-.91-.054-.42-.038-.875.04-1.29.082-.43.207-.85.4-1.244z',
    };
  }
  return null;
}

function HostIcon({ url, accentColor }: { url: string; accentColor: string }) {
  const host = hostnameFromUrl(url);
  const glyph = host ? pathByHost(host) : null;

  // Compact tinted bubble with either a brand SVG (preferred) or the
  // first letter of the host as a generic fallback.
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
      style={{
        backgroundColor: `${accentColor}1a`,
        color: accentColor,
      }}
    >
      {glyph ? (
        <svg
          viewBox={glyph.viewBox ?? '0 0 24 24'}
          width="20"
          height="20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d={glyph.d} />
        </svg>
      ) : (
        <span className="text-[14px] font-semibold uppercase">
          {host[0] ?? '→'}
        </span>
      )}
    </span>
  );
}

/**
 * `link-line` — single shipped variant for links. A clean row: brand
 * icon (auto-detected from URL host, override-able via `data.icon`),
 * title, optional one-line body, trailing arrow. Plays well stacked
 * in a 1-col stream or as a 2-col grid.
 *
 * We intentionally do not ship `square` / `wide` / `hero` variants:
 * large link cards read busy and visually compete with projects.
 * Projects are the place for image-driven shapes; links are the index.
 */
const lineVariant: WidgetVariant<LinkCardData> = {
  id: 'link-line',
  resourceType: 'link',
  size: 'line',
  budget: 'low',
  bestFor:
    'Every link, every time. Auto-detected brand icon, compact row layout. Pairs with optional one-line body for context.',
  requires: ['title', 'url'],
  render: (data, ctx) => {
    const userIcon = data.icon?.trim();
    const hasBody = !!data.body && data.body.trim().length > 0;
    return (
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        data-track-type="link"
        data-track-id={data.id || data.url}
        data-track-label={data.title}
        className="group flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 transition-all duration-200 ease-[var(--karte-ease)] hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.05]"
        style={ctx.accentColor ? { borderColor: `${ctx.accentColor}1f` } : undefined}
      >
        {userIcon ? (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[16px]"
            style={{
              backgroundColor: `${ctx.accentColor}1a`,
              color: ctx.accentColor,
            }}
          >
            {userIcon}
          </span>
        ) : (
          <HostIcon url={data.url} accentColor={ctx.accentColor} />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-karte-text">
            {data.title}
          </p>
          {hasBody && (
            <p className="mt-0.5 truncate text-[12px] leading-[1.4] text-karte-text-3">
              {data.body}
            </p>
          )}
        </div>
        <span
          aria-hidden="true"
          className="shrink-0 text-karte-text-4 transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5"
        >
          ↗
        </span>
      </a>
    );
  },
};

export const linkCardVariants: ReadonlyArray<WidgetVariant<LinkCardData>> = [
  lineVariant,
];

export const linkCardVariantsById = Object.freeze(
  Object.fromEntries(linkCardVariants.map((v) => [v.id, v])),
) as Readonly<Record<string, WidgetVariant<LinkCardData>>>;
