'use client';

import { useEffect, useRef, useState } from 'react';

interface Turn {
  // Who's "speaking" in the demo.
  // - `visitor` renders right-aligned, neutral surface.
  // - `karte` renders left-aligned, accent-tinted (the page answering).
  side: 'visitor' | 'karte';
  text: string;
}

// Scripted conversation a real visitor might have with a real profile.
// Plays on a loop until someone takes over with the live input. Each
// Karte reply implies a specific link or resource the owner would
// have wired up: rates page, hiring link, calendar.
const SCRIPT: ReadonlyArray<Turn> = [
  {
    side: 'visitor',
    text: 'what do you charge for a 4-week shipping sprint?',
  },
  {
    side: 'karte',
    text: '$18k for the standard 4-week. One slot open in June — rate card + bookings at /sarthak/rates',
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

const SUGGESTED_PROMPTS: ReadonlyArray<string> = [
  'are you hiring?',
  'how much does Karte cost?',
  'why should I switch from Linktree?',
];

const TYPE_MS = 18;
const PAUSE_AFTER_TURN_MS = 900;
const RESTART_MS = 3200;

type LiveTurn = Turn & { id: string };

/**
 * The "your profile already knows what you'd say" demo. Self-typing
 * conversation cycles on a loop until a visitor takes over: a real
 * input at the bottom hits a seeded persona endpoint and the AI
 * answers as Sarthak. Live mode persists for the rest of the session
 * — no auto-cycle once you've taken the wheel.
 */
export function HeroChatDemo() {
  const [mode, setMode] = useState<'scripted' | 'live'>('scripted');
  const [turnIdx, setTurnIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Live mode state — visitor's own conversation
  const [liveTurns, setLiveTurns] = useState<LiveTurn[]>([]);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const reelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
  }, []);

  // Drive the scripted typewriter when nobody's interacted yet.
  useEffect(() => {
    if (mode !== 'scripted') return;
    if (reducedMotion) return;
    const current = SCRIPT[turnIdx];
    if (!current) return;

    if (charIdx < current.text.length) {
      const next = current.text[charIdx];
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
  }, [mode, turnIdx, charIdx, reducedMotion]);

  // Auto-scroll the reel as content lands.
  useEffect(() => {
    const node = reelRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [liveTurns, mode, charIdx]);

  async function handleSubmit(event?: React.FormEvent) {
    if (event) event.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;

    setError('');
    const userTurn: LiveTurn = {
      id: crypto.randomUUID(),
      side: 'visitor',
      text,
    };
    setLiveTurns((prev) => [...prev, userTurn]);
    setDraft('');
    setMode('live');
    setPending(true);

    try {
      const res = await fetch('/api/demo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        answer?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Could not answer that — try again.');
      }
      const answer = (data.answer ?? '').trim();
      if (!answer) {
        throw new Error('Empty answer — try rephrasing.');
      }
      const reply: LiveTurn = {
        id: crypto.randomUUID(),
        side: 'karte',
        text: answer,
      };
      setLiveTurns((prev) => [...prev, reply]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setPending(false);
    }
  }

  function handleSuggest(text: string) {
    setDraft(text);
    // Submit on next tick so React picks up the draft change first.
    setTimeout(() => {
      setDraft(text);
      void handleSubmit();
    }, 0);
  }

  // Build the visible reel. In scripted mode, show every fully-typed
  // prior turn plus the currently-typing turn. In live mode, show
  // the visitor's actual conversation.
  let visibleTurns: Array<{ key: string; turn: Turn; partial: string; isActive: boolean }> = [];

  if (mode === 'scripted') {
    for (let i = 0; i <= turnIdx; i++) {
      const turn = SCRIPT[i];
      if (!turn) continue;
      const isActive = i === turnIdx && !reducedMotion;
      visibleTurns.push({
        key: `s-${i}`,
        turn,
        partial: isActive ? turn.text.slice(0, charIdx) : turn.text,
        isActive,
      });
    }
  } else {
    visibleTurns = liveTurns.map((turn) => ({
      key: turn.id,
      turn,
      partial: turn.text,
      isActive: false,
    }));
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />

      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-4">
        <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
        <div className="ml-3 flex-1 truncate rounded-md bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-karte-text-4">
          karte.cc/sarthak <span className="text-karte-text-5">— chat</span>
        </div>
        {mode === 'live' && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-karte-accent/15 px-2 py-1 text-[10px] font-medium text-karte-accent-soft">
            <span
              className="block h-1.5 w-1.5 rounded-full bg-karte-accent"
              style={{ animation: 'karte-pulse-dot 1.4s ease-in-out infinite' }}
            />
            LIVE
          </span>
        )}
      </div>

      <div
        ref={reelRef}
        className="mt-4 flex flex-col gap-3 overflow-y-auto pr-1 text-[13.5px] leading-[1.55] sm:gap-3.5 sm:text-[14px]"
        style={{ height: '320px' }}
      >
        {visibleTurns.length === 0 && mode === 'live' ? (
          <div className="flex h-full items-center justify-center text-center text-[13px] text-karte-text-4">
            <p>
              Ask anything. The demo is wired to a seeded version of
              Sarthak&rsquo;s profile.
            </p>
          </div>
        ) : (
          visibleTurns.map((entry) => <ChatLine key={entry.key} entry={entry} />)
        )}
        {pending && (
          <div className="flex justify-start">
            <TypingDots side="karte" />
          </div>
        )}
      </div>

      {/* Live input — the moment a visitor types, scripted demo pauses. */}
      <form
        onSubmit={handleSubmit}
        className="mt-4 flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/30 px-3 py-2 focus-within:border-karte-accent/40 focus-within:bg-black/40"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            mode === 'scripted'
              ? 'Or ask your own — try it →'
              : 'Ask another…'
          }
          maxLength={280}
          disabled={pending}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-karte-text placeholder-karte-text-5 outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          className="rounded-xl bg-karte-accent px-3 py-1.5 text-[12.5px] font-semibold text-zinc-950 transition hover:bg-karte-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? '…' : 'Ask'}
        </button>
      </form>

      {error ? (
        <p className="mt-2 text-[12px] text-rose-300/90">{error}</p>
      ) : mode === 'scripted' ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSuggest(prompt)}
              className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11.5px] text-karte-text-3 transition hover:border-karte-accent/30 hover:text-karte-text"
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between text-[11px] text-karte-text-5">
          <span>Answers from a seeded demo. Real profiles tune their own voice.</span>
          <button
            type="button"
            onClick={() => {
              setMode('scripted');
              setLiveTurns([]);
              setTurnIdx(0);
              setCharIdx(0);
              setError('');
            }}
            className="text-karte-accent-soft hover:text-karte-accent"
          >
            Reset demo
          </button>
        </div>
      )}

      <style>{`
        @keyframes karte-hero-cursor {
          50% { opacity: 0; }
        }
        @keyframes karte-pulse-dot {
          0%, 100% { opacity: 0.5; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.1); }
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
        <span style={{ whiteSpace: 'pre-wrap' }}>{entry.partial}</span>
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
