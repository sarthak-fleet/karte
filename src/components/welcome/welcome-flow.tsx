'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const PENDING_IMPORT_STORAGE_KEY = 'karte_pending_import';

interface PendingImportPayload {
  sourceUrl: string;
  links: Array<{ title: string; url: string }>;
  importedAt?: string;
}

interface WelcomeResult {
  slug: string;
  displayName: string;
  importedCount: number;
  cards: {
    headline: string;
    roast: string;
    questions: Array<{ q: string; a: string }>;
  };
}

type Phase = 'preparing' | 'generating' | 'ready' | 'error';

const STAGE_MESSAGES: Record<Phase, string> = {
  preparing: 'Provisioning your page…',
  generating: 'Teaching it your voice…',
  ready: 'Ready.',
  error: 'Something went sideways.',
};

function readPendingImport(): PendingImportPayload | null {
  try {
    const raw = window.localStorage.getItem(PENDING_IMPORT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingImportPayload>;
    if (
      !parsed ||
      typeof parsed.sourceUrl !== 'string' ||
      !Array.isArray(parsed.links)
    ) {
      return null;
    }
    const cleanLinks = parsed.links.filter(
      (item): item is { title: string; url: string } =>
        !!item &&
        typeof (item as { title?: unknown }).title === 'string' &&
        typeof (item as { url?: unknown }).url === 'string',
    );
    return { sourceUrl: parsed.sourceUrl, links: cleanLinks };
  } catch {
    return null;
  }
}

function clearPendingImport() {
  try {
    window.localStorage.removeItem(PENDING_IMPORT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function WelcomeFlow() {
  const router = useRouter();
  // We always transition to 'generating' immediately, so lazy-init
  // there rather than setState('generating') inside the effect (which
  // trips react-hooks/set-state-in-effect). The earlier 'preparing'
  // beat had no distinct UX value — both phases render the same
  // LoadingState shape.
  const [phase, setPhase] = useState<Phase>('generating');
  const [result, setResult] = useState<WelcomeResult | null>(null);
  const [error, setError] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const pending = readPendingImport();

    fetch('/api/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceUrl: pending?.sourceUrl ?? '',
        links: pending?.links ?? [],
      }),
    })
      .then(async (res) => {
        const data = (await res
          .json()
          .catch(() => ({}))) as Partial<WelcomeResult> & {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || 'Could not set up your profile.');
        }
        if (!data.slug || !data.cards) {
          throw new Error('Unexpected response shape.');
        }
        setResult(data as WelcomeResult);
        setPhase('ready');
        // Now that the server holds the imported links, we can clear
        // the local cache.
        clearPendingImport();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPhase('error');
      });
  }, []);

  if (phase === 'preparing' || phase === 'generating') {
    return <LoadingState phase={phase} />;
  }

  if (phase === 'error') {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/[0.06] p-8 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-rose-300/80">
          · Hiccup
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-karte-text">
          {STAGE_MESSAGES.error}
        </h1>
        <p className="mt-2 text-[14px] text-karte-text-3">{error}</p>
        <button
          type="button"
          onClick={() => router.push('/dashboard/data')}
          className="mt-6 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-zinc-950 hover:bg-zinc-100"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  if (!result) return null;

  return <ReadyState result={result} />;
}

function LoadingState({ phase }: { phase: Phase }) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 backdrop-blur-xl sm:p-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-accent-soft">
        · One sec
      </p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] text-karte-text sm:text-4xl">
        Your profile is{' '}
        <span
          className="font-normal italic text-karte-accent-soft"
          style={{ fontFamily: 'var(--font-instrument-serif), serif' }}
        >
          learning to talk.
        </span>
      </h1>
      <p className="mt-3 max-w-xl text-[14.5px] leading-[1.6] text-karte-text-3">
        Linktree gave you 8 grey buttons. We&apos;re building you a front page,
        a witty assistant, and a couple of jokes about your link collection.
      </p>

      <div className="mt-8 space-y-3">
        {(
          [
            'Provisioning your page',
            'Reading the links',
            'Teaching it your voice',
          ] as const
        ).map((label, i) => {
          const completed = phase === 'generating' ? i < 1 : false;
          const active = phase === 'generating' ? i >= 1 : i === 0;
          return (
            <div
              key={label}
              className="flex items-center gap-3 text-[14px] text-karte-text-3"
            >
              <span
                aria-hidden="true"
                className={`block h-2 w-2 rounded-full ${
                  completed
                    ? 'bg-karte-accent'
                    : active
                      ? 'bg-karte-accent/60'
                      : 'bg-white/[0.10]'
                }`}
                style={
                  active
                    ? { animation: 'karte-pulse 1.4s ease-in-out infinite' }
                    : undefined
                }
              />
              <span className={active ? 'text-karte-text' : ''}>{label}…</span>
            </div>
          );
        })}
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Skeleton lines={2} />
        <Skeleton lines={2} />
        <Skeleton lines={3} />
        <Skeleton lines={3} />
      </div>

      <style>{`
        @keyframes karte-pulse {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes karte-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

function Skeleton({ lines }: { lines: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="h-2.5 w-1/3 rounded-full bg-white/[0.08]" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-full"
            style={{
              width: i === lines - 1 ? '60%' : '100%',
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
              backgroundSize: '200% 100%',
              animation: 'karte-shimmer 2s linear infinite',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ReadyState({ result }: { result: WelcomeResult }) {
  const profileHref = `/${result.slug}`;
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-accent-soft">
          · You couldn&rsquo;t get this on Linktree
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] text-karte-text sm:text-4xl lg:text-5xl">
          Hey {result.displayName.split(' ')[0]} — meet{' '}
          <span
            className="font-normal italic text-karte-accent-soft"
            style={{ fontFamily: 'var(--font-instrument-serif), serif' }}
          >
            karte.cc/{result.slug}
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-[1.65] text-karte-text-3 sm:text-[16px]">
          {result.importedCount > 0
            ? `Pulled in ${result.importedCount} link${result.importedCount === 1 ? '' : 's'}. Here's what your page does that Linktree never did.`
            : 'Here’s a taste of what your page does that Linktree never did. The more you fill in, the sharper it gets.'}
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card eyebrow="Today's headline" accent>
          <p className="text-[20px] font-semibold leading-[1.2] tracking-[-0.01em] text-karte-text sm:text-[22px]">
            &ldquo;{result.cards.headline}&rdquo;
          </p>
          <p className="mt-3 text-[12.5px] text-karte-text-4">
            Auto-rewritten by AI every day. Newspaper mode draws a full front
            page from your stuff.
          </p>
        </Card>

        <Card eyebrow="A gentle roast">
          <p
            className="text-[19px] font-normal leading-[1.3] tracking-[-0.01em] text-karte-text"
            style={{
              fontFamily: 'var(--font-instrument-serif), serif',
              fontStyle: 'italic',
            }}
          >
            &ldquo;{result.cards.roast}&rdquo;
          </p>
          <p className="mt-3 text-[12.5px] text-karte-text-4">
            Roast mode is one of four AI modes. Tune the tone in settings.
          </p>
        </Card>

        <Card eyebrow="What visitors will ask" wide>
          <ul className="space-y-4">
            {result.cards.questions.map((qa, i) => (
              <li key={i} className="border-l-2 border-karte-accent/40 pl-4">
                <p className="text-[14.5px] font-medium text-karte-text">
                  {qa.q}
                </p>
                <p className="mt-1 text-[13.5px] leading-[1.55] text-karte-text-3">
                  {qa.a}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12.5px] text-karte-text-4">
            Your page&rsquo;s chat answers these 24/7. You can edit the answers
            anytime in Data.
          </p>
        </Card>
      </div>

      {/* CTA row */}
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-karte-accent/30 bg-karte-accent/[0.06] px-6 py-6 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-[14px] font-medium text-karte-text">
            Want to see it for real?
          </p>
          <p className="mt-1 text-[13px] text-karte-text-3">
            Your live profile is at{' '}
            <span className="font-mono text-karte-text">
              karte.cc/{result.slug}
            </span>
            .
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/data"
            className="inline-flex items-center justify-center rounded-full border border-white/[0.10] bg-transparent px-5 py-2.5 text-[14px] font-medium text-karte-text hover:bg-white/[0.04]"
          >
            Tune it up
          </Link>
          <Link
            href={profileHref}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-karte-accent px-5 py-2.5 text-[14px] font-semibold text-zinc-950 hover:bg-karte-accent-soft"
          >
            Open my profile
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Card({
  eyebrow,
  children,
  accent = false,
  wide = false,
}: {
  eyebrow: string;
  children: React.ReactNode;
  accent?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 backdrop-blur-xl sm:p-6 ${
        wide ? 'sm:col-span-2' : ''
      } ${accent ? 'border-karte-accent/25 bg-karte-accent/[0.04]' : 'border-white/[0.08] bg-white/[0.02]'}`}
    >
      <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
        <span className="text-karte-accent">·</span> {eyebrow}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
