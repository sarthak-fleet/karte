// Probe: does next/og's ImageResponse work in a normal API route on
// OpenNext + CF Workers, or does it hang the same way it does in
// dynamic param routes? Remove once we have a working path.

import { ImageResponse } from 'next/og';

export async function GET() {
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
          color: '#67e8f9',
          fontSize: 60,
          fontFamily: 'sans-serif',
        }}
      >
        og probe — {new Date().toISOString().slice(0, 10)}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
