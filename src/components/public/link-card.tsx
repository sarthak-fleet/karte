'use client';

export function LinkCard({
  id,
  title,
  url,
  icon,
  imageUrl,
  body,
  accentColor,
}: {
  id?: string;
  title: string;
  url: string;
  icon?: string | null;
  imageUrl?: string | null;
  body?: string | null;
  accentColor?: string;
}) {
  // Three layouts in one component — chosen by what data is present:
  //   - imageUrl  → thumbnail card (image on the left, title + body on the right)
  //   - body only → wide card (icon block + title + body)
  //   - neither   → original line (centered title)
  // Keeping it in one component instead of variant routing because callers
  // already pass these props through; switching the layout is the simplest
  // way to put the new inputs to work without rebuilding the renderer.
  const hasImage = !!imageUrl;
  const hasBody = !!body && body.trim().length > 0;
  const rich = hasImage || hasBody;

  if (rich) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-track-type="link"
        data-track-id={id ?? url}
        data-track-label={title}
        className="group flex w-full items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-white/[0.20] hover:bg-white/[0.05]"
        style={accentColor ? { borderColor: `${accentColor}28` } : undefined}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl!}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl"
            style={{
              backgroundColor: accentColor
                ? `${accentColor}1a`
                : 'rgba(103,232,249,0.10)',
              color: accentColor || '#67e8f9',
            }}
          >
            {icon ?? '→'}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-karte-text group-hover:text-white">
            {title}
          </p>
          {hasBody && (
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-[1.45] text-karte-text-3">
              {body}
            </p>
          )}
        </div>
        <span
          aria-hidden="true"
          className="shrink-0 text-karte-text-4 transition-transform duration-200 group-hover:translate-x-0.5"
        >
          ↗
        </span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-track-type="link"
      data-track-id={id ?? url}
      data-track-label={title}
      className="group flex min-h-16 w-full items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] px-6 py-4 text-center transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-white/[0.20] hover:bg-white/[0.05]"
      style={accentColor ? { borderColor: `${accentColor}28` } : undefined}
    >
      <span className="text-base font-semibold text-karte-text group-hover:text-white/90">
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </span>
    </a>
  );
}
