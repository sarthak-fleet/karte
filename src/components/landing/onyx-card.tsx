'use client';

import { type CSSProperties,useCallback, useRef } from 'react';

interface OnyxCardProps {
  idx: string;         // e.g. "i", "ii", "iii" — appears as "card i / v" indicator
  serial: string;      // e.g. "№ 00471" — appears in the header right
  kicker: string;      // e.g. "DIGITAL CARD · CARD V2026" — header centered label
  footL: React.ReactNode; // footer left content
  footR: React.ReactNode; // footer right content
  children: React.ReactNode; // card body
}

/**
 * The card frame for the Onyx landing deck.
 *
 * Each section of the landing page is rendered as one of these cards.
 * The frame supplies: gold foil border (via mask-composite), corner
 * ◆ glyphs, mouse-tracking sheen (radial-gradient driven by --mx/--my
 * CSS vars), a three-column header (mark / kicker / serial), the body
 * slot, and a footer strip with left/right content separated by a
 * gradient hairline rule.
 *
 * Ported from Claude Design handoff bundle (variations/onyx.jsx).
 */
export function OnyxCard({ idx, serial, kicker, footL, footR, children }: OnyxCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Track the cursor's position over the card and feed it into the
  // --mx / --my CSS vars. The sheen overlay reads those to position
  // a soft radial gradient at the cursor. No state — direct style
  // mutation, so React doesn't re-render on every mouse pixel.
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const r = node.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 100;
    const my = ((e.clientY - r.top) / r.height) * 100;
    node.style.setProperty('--mx', `${mx}%`);
    node.style.setProperty('--my', `${my}%`);
  }, []);

  const initialStyle: CSSProperties = {
    // Sensible defaults so the sheen sits at center before any
    // mouse interaction (and on touch devices where there's no
    // hover signal).
    ['--mx' as never]: '50%',
    ['--my' as never]: '50%',
  };

  return (
    <div
      ref={ref}
      className="onyx-screen"
      onMouseMove={onMove}
      style={initialStyle}
    >
      <div className="onyx-screen-sheen" />
      <div className="onyx-screen-foil" />
      <div className="onyx-screen-corner tl" aria-hidden="true">◆</div>
      <div className="onyx-screen-corner tr" aria-hidden="true">◆</div>
      <div className="onyx-screen-corner bl" aria-hidden="true">◆</div>
      <div className="onyx-screen-corner br" aria-hidden="true">◆</div>

      <header className="onyx-screen-head">
        <div className="onyx-screen-mark">
          <span className="onyx-screen-diamond" aria-hidden="true">◆</span>
          <span className="onyx-screen-brand">Karte</span>
        </div>
        <div className="onyx-screen-kicker">{kicker}</div>
        <div className="onyx-screen-serial">{serial}</div>
      </header>

      <div className="onyx-screen-body">{children}</div>

      <footer className="onyx-screen-foot">
        <span>{footL}</span>
        <span className="onyx-screen-rule" aria-hidden="true" />
        <span>{footR}</span>
      </footer>

      <div className="onyx-screen-idx" aria-hidden="true">card {idx} / vi</div>
    </div>
  );
}
