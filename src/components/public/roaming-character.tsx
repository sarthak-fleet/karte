'use client';

import { useEffect, useRef, useState } from 'react';

import { SafeImage } from '@/components/public/safe-image';
import { useReducedMotion } from '@/lib/use-reduced-motion';

interface RoamingCharacterProps {
  avatarUrl: string | null;
  displayName: string;
  lines: ReadonlyArray<string>;
  accentColor: string;
}

const STEP_MS = 90;
const STEP_PX = 0.55;
const TALK_INTERVAL_MIN_MS = 2400;
const TALK_INTERVAL_MAX_MS = 5800;
const TALK_DURATION_MS = 5800;
const TYPE_MS = 32;

function initialsForName(displayName: string): string {
  const parts = displayName.split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'K'
  );
}

function CharacterFallback({
  displayName,
  accentColor,
}: {
  displayName: string;
  accentColor: string;
}) {
  return (
    <span
      className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[28px] text-2xl font-semibold text-zinc-950 ring-1 ring-white/20"
      style={{
        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)`,
      }}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.55),transparent_34%)]" />
      <span className="relative">{initialsForName(displayName)}</span>
    </span>
  );
}

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
  const [pos, setPos] = useState(20);
  const [dir, setDir] = useState<1 | -1>(1);
  const [bobUp, setBobUp] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });
  const reducedMotion = useReducedMotion();
  const enabled = !reducedMotion && lines.length > 0;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Look at cursor — apply a small translate that makes the pet lean
  // toward the mouse. Throttled via requestAnimationFrame.
  useEffect(() => {
    if (!enabled) return;
    let rafId = 0;
    let pending: { x: number; y: number } | null = null;
    function onMove(e: MouseEvent) {
      const node = buttonRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.max(1, Math.hypot(dx, dy));
      // Lean up to 5px toward cursor, scaled by inverse distance so it
      // doesn't twitch at long range. Clamp dy upward — leaning down
      // looks droopy.
      const lean = Math.min(5, 600 / dist);
      pending = {
        x: (dx / dist) * lean,
        y: Math.min(0, (dy / dist) * lean * 0.5),
      };
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          if (pending) setLookOffset(pending);
        });
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enabled]);

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
    const id = setTimeout(
      () => {
        setSpeaking(false);
        setLineIdx((i) => (i + 1) % lines.length);
      },
      TALK_DURATION_MS - current.length * TYPE_MS,
    );
    return () => clearTimeout(id);
  }, [speaking, charIdx, lineIdx, lines]);

  if (!enabled) return null;

  const current = lines[lineIdx] ?? '';
  const typed = current.slice(0, charIdx);
  const facingFlip = dir === -1 ? 'scaleX(-1)' : 'scaleX(1)';
  const fallback = (
    <CharacterFallback displayName={displayName} accentColor={accentColor} />
  );

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
        ref={buttonRef}
        type="button"
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent('karte:open-widget', { detail: { mode: 'chat' } }),
          );
        }}
        title={`Chat with ${displayName}`}
        aria-label={`Chat with ${displayName}`}
        className="pointer-events-auto relative block h-20 w-20 transition-transform duration-150 hover:scale-110 active:scale-95"
        style={{
          transform: `translate(${lookOffset.x}px, calc(${lookOffset.y}px + ${bobUp ? '-3px' : '0px'}))`,
          transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          filter: `drop-shadow(0 6px 14px ${accentColor}88) drop-shadow(0 2px 4px rgba(0,0,0,0.45))`,
        }}
      >
        <span className="block h-20 w-20">
          <SafeImage
            src={avatarUrl}
            alt=""
            className="relative h-20 w-20 object-contain"
            style={{ background: 'transparent', transform: facingFlip }}
            loading={fallback}
            fallback={fallback}
          />
        </span>
      </button>

      <style>{`
        @keyframes roam-cursor {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
