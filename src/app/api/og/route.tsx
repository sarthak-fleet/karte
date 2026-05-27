import { ImageResponse } from 'next/og';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') || 'karte';
  const name = url.searchParams.get('name') || slug;
  const headline = url.searchParams.get('h') || `${name} on Karte`;
  const accent = `#${url.searchParams.get('accent') || '67e8f9'}`;
  const initials =
    (name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('')) || 'K';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: '#0a0a0a',
          color: '#ededed',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '108px',
              height: '108px',
              borderRadius: '28px',
              background: accent,
              color: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '46px',
              fontWeight: 700,
              marginRight: '28px',
            }}
          >
            {initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: '22px', color: accent, fontWeight: 500 }}>
              {`karte.cc/${slug}`}
            </div>
            <div style={{ display: 'flex', fontSize: '60px', fontWeight: 700, marginTop: '6px', color: '#ffffff' }}>
              {name}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: '46px',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.15,
          }}
        >
          {headline}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: '20px', color: '#a1a1aa' }}>
            karte.cc
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '18px',
              color: accent,
              border: `1px solid ${accent}`,
              borderRadius: '999px',
              padding: '8px 18px',
              fontWeight: 600,
            }}
          >
            LIVE
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    },
  );
}
