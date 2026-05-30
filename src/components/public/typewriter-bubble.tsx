'use client';

import { useEffect, useState } from 'react';

import { useReducedMotion } from '@/lib/use-reduced-motion';

const TYPE_MS = 28; // per character
const HOLD_MS = 2600; // pause once a line completes
const FADE_MS = 320;

/**
 * Floating speech bubble that types lines next to the avatar on load.
 * Cycles through `lines` with a typewriter reveal — pause — fade —
 * next. After the last line, holds it indefinitely. Visitors with
 * `prefers-reduced-motion` see the final line instantly with no typing.
 *
 * This is the "the profile talks back" moment — link-in-bio pages
 * are usually static walls of buttons. Karte greets you in real text.
 */
export function TypewriterBubble({
  lines,
  accentColor,
}: {
  lines: ReadonlyArray<string>;
  accentColor: string;
}) {
  const reducedMotion = useReducedMotion();
  // Reduced-motion: jump to the final line, fully typed, no cycling.
  // The 'reduced' branch is implemented purely in render via these
  // initializers; the typing effect is skipped below.
  const [lineIdx, setLineIdx] = useState(() => (reducedMotion ? lines.length - 1 : 0));
  const [charIdx, setCharIdx] = useState(() =>
    reducedMotion ? lines[lines.length - 1]?.length ?? 0 : 0,
  );
  const [phase, setPhase] = useState<'typing' | 'holding' | 'fading'>('typing');
  const [visible, setVisible] = useState(true);

  // 'holding' is a transient phase that immediately flips to 'fading';
  // we run the flip inside a 0ms timer so the setState happens in a
  // callback rather than synchronously during the effect run.
  useEffect(() => {
    if (reducedMotion) return;
    if (lines.length === 0) return;
    const current = lines[lineIdx] ?? '';

    if (phase === 'typing') {
      if (charIdx < current.length) {
        const t = setTimeout(() => setCharIdx((c) => c + 1), TYPE_MS);
        return () => clearTimeout(t);
      }
      // Last line just settles in — no fade-cycle past the end.
      if (lineIdx >= lines.length - 1) return;
      const t = setTimeout(() => setPhase('holding'), HOLD_MS);
      return () => clearTimeout(t);
    }

    if (phase === 'holding') {
      const t = setTimeout(() => setPhase('fading'), 0);
      return () => clearTimeout(t);
    }

    if (phase === 'fading') {
      // Both the immediate fade-out and the delayed reset run inside
      // setTimeouts so neither is a synchronous setState during the
      // effect run.
      const hideT = setTimeout(() => setVisible(false), 0);
      const cycleT = setTimeout(() => {
        setLineIdx((i) => i + 1);
        setCharIdx(0);
        setVisible(true);
        setPhase('typing');
      }, FADE_MS);
      return () => {
        clearTimeout(hideT);
        clearTimeout(cycleT);
      };
    }
  }, [phase, charIdx, lineIdx, lines, reducedMotion]);

  if (lines.length === 0) return null;

  const current = lines[lineIdx] ?? '';
  const text = reducedMotion ? current : current.slice(0, charIdx);
  const isLast = lineIdx >= lines.length - 1 && charIdx >= current.length;
  const showCursor = !reducedMotion && !isLast;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none relative"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
    >
      <div
        className="relative rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] leading-[1.5] text-karte-text shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        style={{
          backgroundColor: `${accentColor}1f`,
          border: `1px solid ${accentColor}33`,
        }}
      >
        <span>{text}</span>
        {showCursor && (
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block h-[1em] w-[2px] -translate-y-[1px] align-middle"
            style={{
              backgroundColor: accentColor,
              animation: 'karte-cursor-blink 1s steps(2) infinite',
            }}
          />
        )}
        {/* Tail pointing down-left toward the avatar */}
        <span
          aria-hidden="true"
          className="absolute -bottom-[6px] left-3 h-3 w-3 rotate-45 border-b border-l"
          style={{
            backgroundColor: `${accentColor}1f`,
            borderColor: `${accentColor}33`,
          }}
        />
      </div>
      <style>{`
        @keyframes karte-cursor-blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
