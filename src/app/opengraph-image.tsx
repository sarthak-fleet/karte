import { ImageResponse } from 'next/og';

/**
 * OG / share-card image for the site root. Next.js serves this at
 * /opengraph-image and wires it into the page's OpenGraph + Twitter
 * card metadata automatically. Mirrors the Onyx deck aesthetic so
 * the karte.cc unfurl in social previews matches the actual page.
 *
 * Satori (the renderer behind next/og) doesn't load Google Fonts at
 * runtime, so we lean on system serif and let italic + tracking
 * carry the brand feel. The deck's full Playfair Display rendering
 * shows up the moment a visitor clicks through.
 */
export const alt = 'Karte — Your link-in-bio, that answers back';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const GOLD = '#c4a46b';
const GOLD_BRIGHT = '#f4ebd4';
const BG = '#0a0805';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: BG,
          color: GOLD_BRIGHT,
          fontFamily: 'serif',
          padding: '48px 64px',
          position: 'relative',
        }}
      >
        {/* Foil hairline edge — drawn as an inset rect with a faint
            gold border. Approximates the deck's foil mask trick. */}
        <div
          style={{
            position: 'absolute',
            inset: '24px',
            border: `1px solid ${GOLD}55`,
            borderRadius: '8px',
            display: 'flex',
          }}
        />

        {/* Card header strip — mark left, kicker center, serial right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '20px',
            borderBottom: `1px dotted ${GOLD}44`,
            zIndex: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div
              style={{
                width: '14px',
                height: '14px',
                transform: 'rotate(45deg)',
                background: GOLD,
                display: 'flex',
              }}
            />
            <div
              style={{
                fontSize: '32px',
                color: GOLD_BRIGHT,
                fontStyle: 'italic',
                fontWeight: 500,
                display: 'flex',
              }}
            >
              Karte
            </div>
          </div>
          <div
            style={{
              fontSize: '13px',
              letterSpacing: '0.32em',
              color: GOLD,
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            Digital Card · Card V2026
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#e8dfca99',
              fontStyle: 'italic',
              display: 'flex',
            }}
          >
            № 00471
          </div>
        </div>

        {/* Body — eyebrow + H1 + sub */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            gap: '24px',
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontSize: '15px',
              letterSpacing: '0.32em',
              color: GOLD,
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            ◆  The link-in-bio, upgraded
          </div>
          <div
            style={{
              fontSize: '88px',
              fontWeight: 500,
              lineHeight: 1,
              color: GOLD_BRIGHT,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              letterSpacing: '-0.025em',
            }}
          >
            <div style={{ display: 'flex' }}>Your link-in-bio,</div>
            <div
              style={{
                display: 'flex',
                fontStyle: 'italic',
                color: GOLD,
                marginTop: '4px',
              }}
            >
              that answers back.
            </div>
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#e8dfcacc',
              fontStyle: 'italic',
              maxWidth: '780px',
              display: 'flex',
              lineHeight: 1.4,
            }}
          >
            karte · /ˈkartə/ — German for card. This one talks back.
          </div>
        </div>

        {/* Card footer strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '20px',
            borderTop: `1px dotted ${GOLD}44`,
            fontSize: '13px',
            letterSpacing: '0.26em',
            color: `${GOLD}b3`,
            textTransform: 'uppercase',
            zIndex: 2,
          }}
        >
          <div style={{ display: 'flex' }}>karte.cc/yourhandle</div>
          <div style={{ display: 'flex' }}>Free · 60-second import</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
