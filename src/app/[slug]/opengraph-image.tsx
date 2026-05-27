import { ImageResponse } from 'next/og';

import { resolveThemeConfig } from '@/lib/themes';

import { getFullPageData } from './_lib/get-page-data';

// Next.js auto-discovers this file and wires the returned image into
// the page's <meta property="og:image"> for /[slug]. Regenerates on
// the same `revalidate` cadence as the page so headlines stay fresh.
//
// Each share unfurls with the actual current newspaper headline from
// the user's AI-generated content (or bio fallback) — every link
// looks alive, not a static thumbnail.

export const alt = 'Karte profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

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
  const headline = content?.leadStory?.headline;
  return typeof headline === 'string' && headline.trim() ? headline : null;
}

export default async function OgImage({ params }: Props) {
  const { slug } = await params;
  const data = await getFullPageData(slug);

  // Render a placeholder if the page is missing — sharers get something
  // graceful instead of a 500.
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
      size,
    );
  }

  const { page, modeContent } = data;
  const theme = resolveThemeConfig(page.themeConfig);
  const accent = theme.accentColor;
  const grad1 = theme.gradientFrom || accent;
  const grad2 = theme.gradientTo || accent;

  // Pick the loudest current line to surface in the unfurl.
  // Priority: live newspaper headline → bio → generic.
  const headline =
    extractNewspaperHeadline(modeContent?.newspaper) ||
    safeText(page.bio, 140) ||
    `Visit ${page.displayName} on Karte`;

  const isHeadlineFromNews = !!extractNewspaperHeadline(modeContent?.newspaper);
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
          background: `radial-gradient(circle at 0% 0%, ${accent}33 0%, transparent 50%), radial-gradient(circle at 100% 100%, ${grad2}22 0%, transparent 55%), linear-gradient(180deg, #0a0a0a 0%, #111111 100%)`,
          color: '#ededed',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top row: avatar tile + identity. Skip external <img> fetch
            (Satori can't reliably load arbitrary remote images in the
            Worker environment) — render an initials tile instead. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: 28,
              background: `linear-gradient(135deg, ${grad1}, ${grad2})`,
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

        {/* The alive bit — newspaper headline (or bio) */}
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
          {isHeadlineFromNews && (
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
              · Today's headline · auto-written by AI
            </div>
          )}
          <div
            style={{
              fontSize: isHeadlineFromNews ? 56 : 44,
              fontWeight: isHeadlineFromNews ? 700 : 500,
              lineHeight: 1.15,
              letterSpacing: -1.2,
              color: '#ffffff',
              textTransform: isHeadlineFromNews ? 'uppercase' : 'none',
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
    size,
  );
}
