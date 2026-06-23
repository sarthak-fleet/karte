// Detects YouTube / Vimeo / Loom from the URL and emits an iframe at the
// embed path each platform expects. If the URL doesn't match a known
// provider we fall back to a plain "Watch video" CTA — never blow up.

function youtubeId(url: string): string | null {
  // youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/embed/<id>, /shorts/<id>
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace(/^\//, '') || null;
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' && parts[1]) return parts[1];
      if (parts[0] === 'shorts' && parts[1]) return parts[1];
    }
    return null;
  } catch {
    return null;
  }
}

function vimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('vimeo.com')) return null;
    const id = u.pathname.split('/').filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function loomId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('loom.com')) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if ((parts[0] === 'share' || parts[0] === 'embed') && parts[1])
      return parts[1];
    return null;
  } catch {
    return null;
  }
}

export function VideoEmbed({
  url,
  accentColor,
}: {
  url: string;
  accentColor: string;
}) {
  const yt = youtubeId(url);
  const vi = vimeoId(url);
  const lo = loomId(url);

  const embedSrc = yt
    ? `https://www.youtube-nocookie.com/embed/${yt}`
    : vi
      ? `https://player.vimeo.com/video/${vi}`
      : lo
        ? `https://www.loom.com/embed/${lo}`
        : null;

  if (!embedSrc) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-karte-border bg-white/[0.025] px-4 py-2 text-[13px] font-medium text-karte-text transition-colors duration-200 hover:bg-white/[0.05]"
      >
        ▶ Watch video{' '}
        <span aria-hidden="true" className="text-karte-text-4">
          ↗
        </span>
      </a>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-karte-border"
      style={{ borderColor: `${accentColor}28` }}
    >
      <div className="relative aspect-video w-full">
        <iframe
          src={embedSrc}
          title="Profile video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
