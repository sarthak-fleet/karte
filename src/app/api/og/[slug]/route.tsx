import { ImageResponse } from 'next/og';

// Per-slug OG image. Reads all the data it needs from URL query params
// (h, name, loc, accent, grad2, live) — the page's generateMetadata
// computes those and bakes them into the og:image URL. We skip a D1
// call here because the OpenNext + CF Workers OG route context can't
// reliably reach the binding (the call hangs and the runtime kills
// the request after the time budget).
//
// Cache aggressively at the edge — same payload only re-renders when
// the headline / theme changes.

const SIZE = { width: 1200, height: 630 };

function getInitials(displayName: string): string {
  return (
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'K'
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const q = url.searchParams;

  const displayName = q.get('name') || slug;
  const headline = q.get('h') || `Visit ${displayName} on Karte`;
  const location = q.get('loc') || '';
  const isLive = q.get('live') === '1';
  // accent + grad2 come in as hex without the leading # to keep the
  // URL clean; reattach here.
  const accentRaw = q.get('accent') || '67e8f9';
  const grad2Raw = q.get('grad2') || accentRaw;
  const accent = `#${accentRaw}`;
  const grad2 = `#${grad2Raw}`;

  const initials = getInitials(displayName);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 80,
          background: `linear-gradient(135deg, ${accent}22 0%, #0a0a0a 45%, #0a0a0a 70%, ${grad2}1a 100%)`,
          color: '#ededed',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top row: initials tile + identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: 28,
              background: `linear-gradient(135deg, ${accent}, ${grad2})`,
              color: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            {initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: accent,
                letterSpacing: 4,
                textTransform: 'uppercase',
              }}
            >
              karte.cc/{slug}
            </div>
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                lineHeight: 1.05,
                marginTop: 8,
                letterSpacing: -1.5,
              }}
            >
              {displayName}
              {location ? (
                <span style={{ color: '#a1a1aa', fontWeight: 500, fontSize: 30 }}>
                  {`  ·  ${location}`}
                </span>
              ) : (
                ''
              )}
            </div>
          </div>
        </div>

        {/* Headline block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 56,
            paddingLeft: 24,
            borderLeft: `4px solid ${accent}`,
            maxWidth: 980,
          }}
        >
          {isLive && (
            <div
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: accent,
                letterSpacing: 4,
                textTransform: 'uppercase',
                marginBottom: 18,
              }}
            >
              · Today&apos;s headline · auto-written by AI
            </div>
          )}
          <div
            style={{
              fontSize: isLive ? 56 : 44,
              fontWeight: isLive ? 700 : 500,
              lineHeight: 1.15,
              letterSpacing: -1.2,
              color: '#ffffff',
              textTransform: isLive ? 'uppercase' : 'none',
            }}
          >
            {headline}
          </div>
        </div>

        {/* Footer bar */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 32,
            borderTop: '1px solid #ffffff14',
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: '#a1a1aa',
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            Built on Karte · the profile that talks back
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 18,
              color: accent,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: accent,
              }}
            />
            Live
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    },
  );
}
