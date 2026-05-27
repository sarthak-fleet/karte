import { ImageResponse } from 'next/og';

const SIZE = { width: 1200, height: 630 };

export async function GET() {
  // Hardcoded for now — diagnosing whether the hang is in req.url or
  // somewhere else.
  const slug = 'sarthak';
  const name = 'Sarthak Agrawal';
  const headline = 'PUBLIC BUILDER PROFILE EXPANDS';
  const accent = '#67e8f9';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'K';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px',
          background: '#0a0a0a',
          color: '#ededed',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '104px',
              height: '104px',
              borderRadius: '28px',
              background: accent,
              color: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '44px',
              fontWeight: 700,
              marginRight: '28px',
            }}
          >
            {initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '22px', color: accent, fontWeight: 500 }}>
              karte.cc/{slug}
            </div>
            <div style={{ fontSize: '56px', fontWeight: 700, marginTop: '8px' }}>
              {name}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '42px', fontWeight: 700, marginTop: '70px', color: '#ffffff' }}>
          {headline}
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
