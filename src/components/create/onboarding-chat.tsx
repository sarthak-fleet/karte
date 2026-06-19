'use client';

import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect, useRef, useState } from 'react';

import { hostnameFromUrl } from '@/lib/hostname';

const STORAGE_KEY = 'karte_pending_onboarding';

interface OnboardingLink {
  title: string;
  url: string;
  body?: string;
}
interface OnboardingProject {
  title: string;
  url: string;
  description: string;
  imageUrl?: string;
}
interface OnboardingState {
  displayName?: string;
  bio?: string;
  slug?: string;
  location?: string;
  calendarUrl?: string;
  newsletterUrl?: string;
  tipUrl?: string;
  videoUrl?: string;
  links?: OnboardingLink[];
  projects?: OnboardingProject[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ServerReply {
  reply: string;
  state: OnboardingState;
  done: boolean;
  error?: string;
}

function fieldSummary(state: OnboardingState): string[] {
  const lines: string[] = [];
  if (state.displayName) lines.push(`Name: ${state.displayName}`);
  if (state.bio) lines.push(`Bio: ${state.bio}`);
  if (state.location) lines.push(`Location: ${state.location}`);
  if (state.slug) lines.push(`URL: karte.cc/${state.slug}`);
  if (state.calendarUrl)
    lines.push(`Booking: ${hostnameFromUrl(state.calendarUrl, state.calendarUrl)}`);
  if (state.newsletterUrl)
    lines.push(`Newsletter: ${hostnameFromUrl(state.newsletterUrl, state.newsletterUrl)}`);
  if (state.tipUrl) lines.push(`Tip jar: ${hostnameFromUrl(state.tipUrl, state.tipUrl)}`);
  if (state.videoUrl) lines.push(`Video: ${hostnameFromUrl(state.videoUrl, state.videoUrl)}`);
  if (state.links?.length) lines.push(`Links: ${state.links.length}`);
  if (state.projects?.length) lines.push(`Projects: ${state.projects.length}`);
  return lines;
}

export function OnboardingChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<OnboardingState>({});
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // First-load greeting — fetch the opener so we don't hardcode it.
  useEffect(() => {
    if (messages.length !== 0) return;
    void send([], true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function send(history: ChatMessage[], isGreeting = false) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, state }),
      });
      const data = (await res.json().catch(() => ({}))) as ServerReply;
      if (!res.ok || data.error) {
        if (res.status === 429) {
          setError('Too many messages — slow down a moment.');
        } else if (res.status === 503) {
          setError('Onboarding bot is offline right now. Use the import or scratch flow below.');
        } else {
          setError(data.error || 'Something went wrong. Try again.');
        }
        return;
      }
      setState(data.state);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.done) {
        setDone(true);
        try {
          posthog.capture('onboarding_chat_done', {
            hasName: !!data.state.displayName,
            linkCount: data.state.links?.length ?? 0,
            projectCount: data.state.projects?.length ?? 0,
          });
        } catch {
          // analytics never breaks the funnel
        }
      } else if (isGreeting) {
        try {
          posthog.capture('onboarding_chat_started');
        } catch {
          // ignore
        }
      }
    } catch {
      setError('Network blip. Try again?');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading || !draft.trim() || done) return;
    const userMsg: ChatMessage = { role: 'user', content: draft.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setDraft('');
    await send(next);
  }

  function handleClaim() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state, capturedAt: new Date().toISOString() }),
      );
    } catch {
      // localStorage may be blocked — the funnel still works.
    }
    try {
      posthog.capture('onboarding_funnel_signup_clicked', {
        linkCount: state.links?.length ?? 0,
        projectCount: state.projects?.length ?? 0,
      });
    } catch {
      // ignore
    }
    router.push('/login?next=/dashboard/appearance&onboarded=1');
  }

  const summary = fieldSummary(state);

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span className="text-karte-accent/80">·</span> Guided
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.02em] text-karte-text sm:text-3xl">
            Have a quick chat,{' '}
            <span
              className="font-normal italic text-karte-accent-soft"
              style={{ fontFamily: 'var(--font-instrument-serif), serif' }}
            >
              we&apos;ll build your page.
            </span>
          </h2>
          <p className="mt-3 max-w-xl text-[14px] leading-[1.6] text-karte-text-3">
            Tell me your name, what you do, and what you want on the page —
            booking, newsletter, links, projects. I&apos;ll wire it together.
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mt-6 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl bg-black/30 p-4"
      >
        {messages.length === 0 && loading && (
          <p className="text-[13px] italic text-karte-text-4">
            Booting the bot…
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] leading-[1.5] ${
                m.role === 'user'
                  ? 'bg-karte-accent/15 text-karte-text ring-1 ring-karte-accent/25'
                  : 'bg-white/[0.05] text-karte-text-2'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white/[0.05] px-3.5 py-2 text-[13px] text-karte-text-4">
              …
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-[13px] text-rose-300/90" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex items-stretch gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={done ? 'Onboarding done — claim your page →' : 'Say something…'}
          disabled={loading || done}
          className="min-w-0 flex-1 rounded-xl bg-white/[0.045] px-4 py-3 text-[14px] text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 ease-[var(--karte-ease)] hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !draft.trim() || done}
          className="shrink-0 rounded-xl bg-karte-accent px-5 py-3 text-[14px] font-semibold text-zinc-950 transition-all duration-200 ease-[var(--karte-ease)] hover:bg-karte-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>

      {summary.length > 0 && (
        <div className="mt-6 rounded-2xl bg-white/[0.025] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-karte-text-4">
            Captured so far
          </p>
          <ul className="mt-2 space-y-1 text-[13px] leading-[1.55] text-karte-text-2">
            {summary.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-1 text-karte-accent">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {done && (
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-[13px] text-karte-text-3">
            Looking good? Sign in to claim the page.
          </p>
          <button
            type="button"
            onClick={handleClaim}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-medium text-zinc-950 transition-all duration-200 ease-[var(--karte-ease)] hover:bg-zinc-100"
          >
            Claim your Karte page
            <span className="transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5">
              →
            </span>
          </button>
        </div>
      )}
    </section>
  );
}
