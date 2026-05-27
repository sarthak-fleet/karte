'use client';

import { useEffect, useRef, useState } from 'react';

interface RoamingCharacterProps {
  avatarUrl: string | null;
  displayName: string;
  lines: ReadonlyArray<string>;
  accentColor: string;
}

const STEP_MS = 60;
const STEP_PX = 1.2;
const TALK_INTERVAL_MIN_MS = 6000;
const TALK_INTERVAL_MAX_MS = 14000;
const TALK_DURATION_MS = 5200;
const TYPE_MS = 28;

/**
 * Codex-pets style mascot. The user's avatar bobs along the bottom
 * edge of the viewport, walks left/right, and every 6-14 seconds
 * stops and emits a typewritten speech bubble with one of the
 * greeting lines (rotated through). Clicking the character opens
 * the floating chat widget via the existing button if present.
 *
 * Stays out of the bottom-right corner where the ChatWidget lives.
 * Hidden entirely on prefers-reduced-motion.
 */
export function RoamingCharacter({
  avatarUrl,
  displayName,
  lines,
  accentColor,
}: RoamingCharacterProps) {
  const [enabled, setEnabled] = useState(false);
  const [pos, setPos] = useState(20);
  const [dir, setDir] = useState<1 | -1>(1);
  const [bobUp, setBobUp] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initial enable — skip if reduced-motion or if the lines array is empty.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (lines.length === 0) return;
    setEnabled(true);
  }, [lines.length]);

  // Walk loop — pause walking while speaking so the bubble doesn't drift.
  useEffect(() => {
    if (!enabled || speaking) return;
    const id = setInterval(() => {
      setPos((p) => {
        const max = 88;
        const min = 4;
        let next = p + dir * STEP_PX;
        if (next > max) {
          next = max;
          setDir(-1);
        } else if (next < min) {
          next = min;
          setDir(1);
        }
        return next;
      });
      setBobUp((b) => !b);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [enabled, speaking, dir]);

  // Talk loop — wait, then speak (type out a line), then go quiet.
  useEffect(() => {
    if (!enabled) return;
    const wait =
      TALK_INTERVAL_MIN_MS +
      Math.random() * (TALK_INTERVAL_MAX_MS - TALK_INTERVAL_MIN_MS);
    const id = setTimeout(() => {
      setCharIdx(0);
      setSpeaking(true);
    }, wait);
    return () => clearTimeout(id);
  }, [enabled, lineIdx]);

  // Type the current line + close the bubble at the end.
  useEffect(() => {
    if (!speaking) return;
    const current = lines[lineIdx] ?? '';
    if (charIdx < current.length) {
      const id = setTimeout(() => setCharIdx((c) => c + 1), TYPE_MS);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setSpeaking(false);
      setLineIdx((i) => (i + 1) % lines.length);
    }, TALK_DURATION_MS - current.length * TYPE_MS);
    return () => clearTimeout(id);
  }, [speaking, charIdx, lineIdx, lines]);

  if (!enabled) return null;

  const current = lines[lineIdx] ?? '';
  const typed = current.slice(0, charIdx);
  const facingFlip = dir === -1 ? 'scaleX(-1)' : 'scaleX(1)';

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed bottom-6 z-30 transition-[left] duration-[60ms] ease-linear"
      style={{ left: `${pos}%` }}
      aria-hidden="true"
    >
      {/* Speech bubble — emits above the character when speaking */}
      {speaking && (
        <div
          className="pointer-events-none absolute bottom-[78px] left-1/2 w-[260px] max-w-[80vw] -translate-x-1/2 rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[12.5px] leading-[1.5] text-karte-text shadow-[0_12px_36px_-16px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          style={{
            backgroundColor: `${accentColor}1f`,
            border: `1px solid ${accentColor}33`,
          }}
        >
          <span>{typed}</span>
          {charIdx < current.length && (
            <span
              className="ml-0.5 inline-block h-[1em] w-[2px] -translate-y-[1px] align-middle"
              style={{
                backgroundColor: accentColor,
                animation: 'roam-cursor 1s steps(2) infinite',
              }}
            />
          )}
          {/* Tail pointing down at the character */}
          <span
            className="absolute -bottom-[6px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r"
            style={{
              backgroundColor: `${accentColor}1f`,
              borderColor: `${accentColor}33`,
            }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new CustomEvent('karte:open-widget', { detail: { mode: 'chat' } }));
        }}
        title={`Chat with ${displayName}`}
        aria-label={`Chat with ${displayName}`}
        className="pointer-events-auto relative block h-16 w-16 transition-transform duration-150 hover:scale-110 active:scale-95"
        style={{
          transform: `translateY(${bobUp ? -3 : 0}px) ${facingFlip}`,
          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Soft floor shadow */}
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-1/2 h-2 w-12 -translate-x-1/2 rounded-full opacity-50 blur-md"
          style={{ backgroundColor: accentColor }}
        />
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="relative h-16 w-16 rounded-full object-cover ring-2 ring-white/[0.10]"
            style={{ boxShadow: `0 8px 24px -10px ${accentColor}cc` }}
          />
        ) : (
          <span
            className="relative flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-zinc-950 ring-2 ring-white/[0.10]"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)`,
              boxShadow: `0 8px 24px -10px ${accentColor}cc`,
            }}
          >
            {displayName[0]?.toUpperCase() ?? '·'}
          </span>
        )}
      </button>

      <style>{`
        @keyframes roam-cursor {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
