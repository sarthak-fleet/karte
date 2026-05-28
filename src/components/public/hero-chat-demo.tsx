'use client';

import { useEffect, useState } from 'react';

interface Turn {
  // Who's "speaking" in the demo.
  // - `visitor` renders right-aligned, neutral surface.
  // - `karte` renders left-aligned, accent-tinted (the page answering).
  side: 'visitor' | 'karte';
  text: string;
}

// Scripted conversation a real visitor might have with a real profile.
// Concrete, "I get this DM weekly"-feeling questions — not "what is
// your favorite color." Each Karte reply implies a specific link or
// resource the owner would have wired up: rates page, hiring link,
// calendar.
const SCRIPT: ReadonlyArray<Turn> = [
  {
    side: 'visitor',
    text: 'what do you charge for a 4-week shipping sprint?',
  },
  {
    side: 'karte',
    text: '$18k for the standard 4-week. I have one slot open in June — rate card + bookings here: /sarthak/rates',
  },
  {
    side: 'visitor',
    text: 'are you open to a senior eng role?',
  },
  {
    side: 'karte',
    text: 'Not full-time roles for the next 6 months. Open to fractional + advising. 20-min intro: /sarthak/call',
  },
  {
    side: 'visitor',
    text: 'what stack is Karte built on?',
  },
  {
    side: 'karte',
    text: 'Next.js on Cloudflare Workers, Drizzle + D1, better-auth. Long-form writeup: /sarthak/stack',
  },
];

const TYPE_MS = 18;
const PAUSE_AFTER_TURN_MS = 900;
const PAUSE_BETWEEN_SIDES_MS = 420;
const RESTART_MS = 3200;

/**
 * The "your profile already knows what you'd say" demo. Self-typing
 * conversation between a visitor and a Karte profile shown above the
 * fold. Cycles indefinitely. Replaces a static screenshot with a
 * live performance of the value prop.
 */
export function HeroChatDemo() {
  const [turnIdx, setTurnIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
  }, []);

  // Drive the typewriter. When the current line finishes, pause and
  // advance to the next turn. When we run out of turns, hold a beat
  // and restart from the top.
  useEffect(() => {
    if (reducedMotion) return;
    const current = SCRIPT[turnIdx];
    if (!current) return;

    if (charIdx < current.text.length) {
      const next = current.text[charIdx];
      // Type a touch slower on spaces — feels more natural.
      const delay = next === ' ' ? TYPE_MS * 1.6 : TYPE_MS;
      const id = setTimeout(() => setCharIdx((c) => c + 1), delay);
      return () => clearTimeout(id);
    }

    const isLastTurn = turnIdx >= SCRIPT.length - 1;
    const wait = isLastTurn ? RESTART_MS : PAUSE_AFTER_TURN_MS;
    const id = setTimeout(() => {
      if (isLastTurn) {
        setTurnIdx(0);
        setCharIdx(0);
      } else {
        setTurnIdx((t) => t + 1);
        setCharIdx(0);
      }
    }, wait);
    return () => clearTimeout(id);
  }, [turnIdx, charIdx, reducedMotion]);

  // Compose the visible transcript: every fully-typed prior turn,
  // plus the currently-typing turn (or the whole thing if reduced
  // motion is on).
  const visibleTurns: Array<{ turn: Turn; partial: string; isActive: boolean }> = [];
  for (let i = 0; i <= turnIdx; i++) {
    const turn = SCRIPT[i];
    if (!turn) continue;
    const isActive = i === turnIdx && !reducedMotion;
    visibleTurns.push({
      turn,
      partial: isActive ? turn.text.slice(0, charIdx) : turn.text,
      isActive,
    });
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />

      {/* Frame header — fake address bar suggesting this is a live page */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-4">
        <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
        <div className="ml-3 flex-1 truncate rounded-md bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-karte-text-4">
          karte.cc/sarthak <span className="text-karte-text-5">— chat</span>
        </div>
      </div>

      {/* Conversation reel — fixed-ish height so the page doesn't jump */}
      <div
        className="mt-4 flex flex-col gap-3 overflow-hidden text-[13.5px] leading-[1.55] sm:gap-3.5 sm:text-[14px]"
        style={{ minHeight: '320px' }}
      >
        {visibleTurns.map((entry, i) => (
          <ChatLine key={i} entry={entry} />
        ))}
      </div>

      {/* Footer hint — the demo is interactive on the real page */}
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-karte-text-5">
        <span>Live transcript from a real profile.</span>
        <span className="text-karte-accent-soft">Try it →</span>
      </div>

      <style>{`
        @keyframes karte-hero-cursor {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function ChatLine({
  entry,
}: {
  entry: { turn: Turn; partial: string; isActive: boolean };
}) {
  const isVisitor = entry.turn.side === 'visitor';

  if (entry.partial.length === 0 && entry.isActive) {
    // While we're between turns showing nothing yet, render a thin
    // typing indicator on the side that's about to speak.
    return (
      <div className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}>
        <TypingDots side={entry.turn.side} />
      </div>
    );
  }

  return (
    <div className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${
          isVisitor
            ? 'rounded-br-md bg-white/[0.05] text-karte-text'
            : 'rounded-bl-md text-karte-text shadow-[0_8px_24px_-16px_rgba(0,0,0,0.5)]'
        }`}
        style={
          isVisitor
            ? undefined
            : {
                backgroundColor: 'rgba(103,232,249,0.10)',
                border: '1px solid rgba(103,232,249,0.20)',
              }
        }
      >
        <span>{entry.partial}</span>
        {entry.isActive && entry.partial.length < entry.turn.text.length && (
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block h-[1em] w-[2px] -translate-y-[1px] align-middle"
            style={{
              backgroundColor: isVisitor ? '#ededed' : '#67e8f9',
              animation: 'karte-hero-cursor 1s steps(2) infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}

function TypingDots({ side }: { side: 'visitor' | 'karte' }) {
  const isVisitor = side === 'visitor';
  return (
    <div
      className={`flex items-center gap-1 rounded-2xl px-3 py-2 ${
        isVisitor ? 'rounded-br-md bg-white/[0.05]' : 'rounded-bl-md'
      }`}
      style={
        isVisitor
          ? undefined
          : {
              backgroundColor: 'rgba(103,232,249,0.10)',
              border: '1px solid rgba(103,232,249,0.20)',
            }
      }
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-karte-text-4"
          style={{
            animation: `karte-typing-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes karte-typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
