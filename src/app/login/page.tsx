import { redirect } from 'next/navigation';

import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { PublicTopBar } from '@/components/public/public-top-bar';
import { getSession } from '@/lib/auth-server';

const modeLabels = ['Profile', 'Ask', 'Inbox', 'Newspaper'];

export default async function LoginPage() {
  const session = await getSession().catch(() => null);
  if (session?.user) redirect('/dashboard');

  return (
    <main className="min-h-screen overflow-hidden bg-karte-bg text-karte-text-2 antialiased">
      <PublicTopBar current="login" variant="minimal" />

      <section className="relative min-h-[calc(100vh-4rem)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_top_left,#000_20%,transparent_70%)]" />
          <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-cyan-400/[0.10] blur-[160px]" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_420px] lg:gap-16">
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
              <span className="text-karte-accent/80">·</span> Welcome back
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-karte-text sm:text-5xl lg:text-6xl">
              Manage the profile people{' '}
              <span
                className="font-serif italic font-normal text-karte-accent-soft"
                style={{ fontFamily: 'var(--font-instrument-serif), serif' }}
              >
                actually
              </span>{' '}
              talk to.
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.65] tracking-[-0.005em] text-karte-text-3 sm:text-base">
              Sign in to update your links, train your AI chat, review Inbox
              messages, and publish generated profile modes.
            </p>

            <div className="mt-10 grid max-w-xl gap-2 sm:grid-cols-2">
              {modeLabels.map((label) => (
                <div
                  key={label}
                  className="rounded-xl border border-karte-border bg-white/[0.02] px-4 py-3 text-[13px] font-medium text-karte-text-2"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-karte-border bg-karte-surface p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-karte-accent">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 32 32"
                  fill="none"
                  className="h-6 w-6"
                >
                  <path
                    d="M8 7 h16 a4 4 0 0 1 4 4 v9 a4 4 0 0 1 -4 4 h-9 l-4 4 v-4 h-3 a4 4 0 0 1 -4 -4 v-9 a4 4 0 0 1 4 -4 Z"
                    fill="#0a0a0a"
                  />
                  <circle cx="13" cy="15.5" r="1.25" fill="#67e8f9" />
                  <circle cx="16.5" cy="15.5" r="1.25" fill="#67e8f9" />
                  <circle cx="20" cy="15.5" r="1.25" fill="#67e8f9" />
                </svg>
              </div>
              <div>
                <p
                  className="text-[18px] font-normal italic tracking-[-0.005em] text-karte-text"
                  style={{ fontFamily: 'var(--font-instrument-serif), serif' }}
                >
                  Karte
                </p>
                <p className="text-[12px] text-karte-text-4">
                  Creator dashboard
                </p>
              </div>
            </div>

            <h2 className="text-xl font-semibold tracking-[-0.01em] text-karte-text">
              Sign in to continue
            </h2>
            <p className="mt-2 text-[14px] leading-[1.6] text-karte-text-3">
              Your Google account verifies ownership and powers email-verified
              messaging.
            </p>

            <div className="mt-6">
              <GoogleSignInButton />
            </div>

            <div className="mt-6 border-t border-karte-border pt-5">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
                <span className="text-karte-accent/80">·</span> After sign in
              </p>
              <ul className="mt-3 space-y-2 text-[13px] leading-[1.55] text-karte-text-2">
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-karte-accent/60" />
                  Set your visitor intent.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-karte-accent/60" />
                  Enable anonymous or email-verified DMs.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-karte-accent/60" />
                  Generate profile modes that make your page memorable.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
