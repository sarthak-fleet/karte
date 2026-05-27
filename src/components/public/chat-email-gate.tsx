'use client';

import { useRef,useState } from 'react';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

interface ChatEmailGateProps {
  displayName: string;
  accentColor: string;
  accentTextColor: string;
  onSubmit: (email: string) => void;
}

/**
 * Inline gate above the chat input. Renders before the visitor's first message
 * when no email has been captured yet. Email becomes a lead tied to the page
 * owner (persisted by the chat API when the conversation is created).
 *
 * Required. There is no skip — chat is a lead-capture surface.
 */
export function ChatEmailGate({
  displayName,
  accentColor,
  accentTextColor,
  onSubmit,
}: ChatEmailGateProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();

    if (!normalized) {
      setError('Drop your email to start the chat.');
      inputRef.current?.focus();
      return;
    }

    if (!EMAIL_RE.test(normalized) || normalized.length > 254) {
      setError('That email looks off — double-check and try again.');
      inputRef.current?.focus();
      return;
    }

    setError(null);
    onSubmit(normalized);
  }

  // Hex with alpha — accentColor is dynamic (per-page theme), so we compose
  // ring + border colors from it inline rather than via Tailwind classes.
  const focusBorder = `${accentColor}66`; // ~40%
  const focusRing = `${accentColor}26`;   // ~15%

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-karte-border-strong bg-white/[0.025] px-4 py-4"
      aria-label="Email gate"
    >
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
        One quick step
      </p>
      <p className="mb-3 text-[13px] leading-[1.5] text-karte-text">
        Drop your email to start chatting.{' '}
        <span className="text-karte-text-3">
          {displayName} will see who reached out.
        </span>
      </p>
      <div className="flex items-stretch gap-2">
        <input
          ref={inputRef}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          placeholder="you@example.com"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'chat-email-gate-error' : undefined}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = focusBorder;
            e.currentTarget.style.boxShadow = `0 0 0 2px ${focusRing}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '';
            e.currentTarget.style.boxShadow = '';
          }}
          className="min-w-0 flex-1 rounded-xl border border-karte-border-strong bg-white/[0.025] px-3.5 py-2.5 text-[13px] text-karte-text placeholder:text-karte-text-4 outline-none transition-all duration-200 ease-[var(--karte-ease)]"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 ease-[var(--karte-ease)] hover:brightness-110 active:scale-[0.97]"
          style={{ backgroundColor: accentColor, color: accentTextColor }}
        >
          Continue
        </button>
      </div>
      {error && (
        <p
          id="chat-email-gate-error"
          role="alert"
          className="mt-2 text-[11px] leading-[1.4] text-red-300"
        >
          {error}
        </p>
      )}
      <p className="mt-2 text-[10px] leading-[1.4] text-karte-text-4">
        We use this once so {displayName} can follow up — no spam.
      </p>
    </form>
  );
}
