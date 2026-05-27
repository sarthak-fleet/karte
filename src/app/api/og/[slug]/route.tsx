import { ImageResponse } from 'next/og';

import { resolveThemeConfig } from '@/lib/themes';

import { getFullPageData } from '@/app/[slug]/_lib/get-page-data';

// Route Handler that returns a per-slug OG image. Wired into the page's
// og:image manually via generateMetadata so we control the URL.
//
// Going with a route handler (not the opengraph-image.tsx convention)
// because that convention hung on the OpenNext + CF Workers stack —
// the Worker timed out during Satori WASM init. Route handlers behave
// differently and seem to work.

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

function safeText(value: string | null | undefined, max: number): string {
  if (!value) return '';
  const t = value.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractNewspaperHeadline(content: any): string | null {
  const h = content?.leadStory?.headline;
  return typeof h === 'string' && h.trim() ? h : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  // Temporarily skip DB fetch — diagnosing whether the hang is in
  // Satori or in the D1 call. If this returns a PNG, the DB call is
  // the bottleneck and we need a different fetch strategy.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = null as Awaited<ReturnType<typeof getFullPageData>>;

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: '#a1a1aa',
            fontFamily: 'sans-serif',
            fontSize: 36,
          }}
        >
          karte.cc/{slug}
        </div>
      ),
      SIZE,
    );
  }

  const { page, modeContent } = data;
  const theme = resolveThemeConfig(page.themeConfig);
  const accent = theme.accentColor;
  const grad2 = theme.gradientTo || accent;

  const newsHeadline = extractNewspaperHeadline(modeContent?.newspaper);
  const headline = newsHeadline || safeText(page.bio, 140) || `Visit ${page.displayName} on Karte`;
  const isLive = !!newsHeadline;
  const initials = getInitials(page.displayName);

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
              karte.cc/{page.slug}
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
              {page.displayName}
              {page.location ? (
                <span style={{ color: '#a1a1aa', fontWeight: 500, fontSize: 30 }}>
                  {`  ·  ${page.location}`}
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
        // Cache aggressively at the edge so the Satori render only runs
        // when the underlying content materially changes. Worker will
        // serve from CF cache for everyone else.
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    },
  );
}
