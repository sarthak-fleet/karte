import { Geist, Instrument_Serif } from 'next/font/google';
import Link from 'next/link';

import { PublicTopBar } from '@/components/public/public-top-bar';

// Landing content changes only on deploy. Long TTL keeps it cached at every
// CF PoP for an hour, with another day of stale-while-revalidate. Deploys
// naturally bust the cache via OpenNext's revalidation flow.
export const dynamic = 'force-static';
export const revalidate = 3600;

const geist = Geist({ subsets: ['latin'], weight: ['400', '500', '600'] });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic' });

const mechanics = [
  {
    n: '01',
    title: 'Feed it your memory',
    desc: 'Links, projects, FAQs, voice, boundaries. The stuff you would say if asked.',
  },
  {
    n: '02',
    title: 'Pick your modes',
    desc: 'Chat, Encyclopedia, Newspaper, Roast — turn on the surfaces you want shared.',
  },
  {
    n: '03',
    title: 'Share one link',
    desc: 'Same link, four surfaces, every visitor. The page does the talking.',
  },
];

const flipExamples = [
  'What is Sarthak building?',
  'Should I reach out?',
  'Generate the wiki entry',
  'Roast this profile',
];

export default function Home() {
  return (
    <main
      className={`min-h-screen bg-karte-bg text-karte-text-2 selection:bg-karte-accent/30 antialiased ${geist.className}`}
    >
      <PublicTopBar current="home" variant="minimal" />

      {/* ─── 1. HERO — single column, left-aligned ──────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_top_left,#000_20%,transparent_70%)]" />
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-karte-accent/10 blur-[160px]" />
        </div>

        {/* Monumental cropped wordmark — typographic mass */}
        <div
          aria-hidden="true"
          className={`${serif.className} pointer-events-none absolute -right-12 top-16 select-none text-[280px] leading-none tracking-[-0.04em] text-karte-text/[0.025] sm:-right-20 sm:text-[420px] lg:-right-32 lg:top-24 lg:text-[560px]`}
          style={{ fontStyle: 'italic' }}
        >
          Karte
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pt-24 lg:pb-28 lg:pt-32">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span className="text-karte-accent/80">·</span> Manifesto
          </p>

          <h1
            className="mt-6 max-w-4xl text-[48px] font-semibold leading-[1.0] tracking-[-0.035em] text-karte-text sm:text-[72px] lg:text-[112px]"
          >
            Your link-in-bio<br />
            is a{' '}
            <span
              className={`${serif.className} font-normal text-karte-accent-soft`}
              style={{ fontStyle: 'italic' }}
            >
              dead end.
            </span>
          </h1>

          {/* Dictionary-entry tagline */}
          <div className="mt-10 max-w-2xl border-l border-white/[0.08] pl-5 text-[15px] leading-[1.7] tracking-[-0.005em] text-karte-text-3 sm:text-[17px] sm:leading-[1.65]">
            <span className="font-medium text-karte-text">karte</span>{' '}
            <span className="text-karte-text-4">/ˈkartə/</span>{' '}
            <span
              className={`${serif.className} text-karte-text-4`}
              style={{ fontStyle: 'italic' }}
            >
              (n.)
            </span>{' '}
            <span className="text-karte-text-3">German for &ldquo;card.&rdquo;</span>{' '}
            <span className="text-karte-text">This one talks back.</span>
          </div>

          <div className="mt-12 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              href="/create"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-medium text-zinc-950 transition-all duration-200 ease-[var(--karte-ease)] hover:bg-zinc-100"
            >
              Claim your name
              <span className="transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/sarthak"
              className="group inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-transparent px-6 py-3 text-[15px] font-medium text-karte-text transition-all duration-200 ease-[var(--karte-ease)] hover:border-white/20 hover:bg-white/[0.03]"
            >
              See it live
              <span className="transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5">↗</span>
            </Link>
          </div>

          <p className="mt-8 text-[13px] text-karte-text-4">
            Free · no card · public beta
          </p>
        </div>
      </section>

      {/* ─── 2. SPEED — credibility flex ──────────────────────── */}
      <section className="border-t border-karte-border">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span className="text-karte-accent/80">·</span> Speed
          </p>

          <div className="mt-8 grid items-end gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <h2 className="text-3xl font-semibold leading-[1.05] tracking-[-0.025em] text-karte-text sm:text-5xl lg:text-[64px]">
              Loads before they{' '}
              <span
                className={`${serif.className} font-normal text-karte-accent-soft`}
                style={{ fontStyle: 'italic' }}
              >
                look away.
              </span>
            </h2>

            <div>
              <p
                className={`${serif.className} text-[80px] font-normal leading-[0.9] tracking-[-0.045em] text-karte-text sm:text-[120px]`}
                style={{ fontStyle: 'italic' }}
              >
                &lt;100ms
              </p>
              <p className="mt-3 text-[13px] leading-[1.55] text-karte-text-3">
                Median time-to-first-byte for a published profile. Anywhere in
                the world.
              </p>
            </div>
          </div>

          <p className="mt-12 max-w-2xl text-[15px] leading-[1.7] tracking-[-0.005em] text-karte-text-3 sm:text-[17px]">
            Karte profiles are static-rendered and edge-cached at every
            Cloudflare data center on Earth. By the time a visitor&apos;s thumb
            lifts off the link, the page is already painted.
          </p>

          <dl className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-karte-border sm:grid-cols-3">
            <div className="bg-karte-bg p-6">
              <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-karte-text-4">
                TTFB
              </dt>
              <dd className="mt-2 font-mono text-[22px] font-semibold tracking-tight text-karte-text">
                &lt; 100 ms
              </dd>
              <dd className="mt-1 text-[12px] text-karte-text-3">
                cached at the edge
              </dd>
            </div>
            <div className="bg-karte-bg p-6 sm:border-l sm:border-karte-border">
              <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-karte-text-4">
                Spinners
              </dt>
              <dd className="mt-2 font-mono text-[22px] font-semibold tracking-tight text-karte-text">
                0
              </dd>
              <dd className="mt-1 text-[12px] text-karte-text-3">
                no client-JS to first paint
              </dd>
            </div>
            <div className="bg-karte-bg p-6 sm:border-l sm:border-karte-border">
              <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-karte-text-4">
                PoPs
              </dt>
              <dd className="mt-2 font-mono text-[22px] font-semibold tracking-tight text-karte-text">
                330+
              </dd>
              <dd className="mt-1 text-[12px] text-karte-text-3">
                worldwide, serving from CF
              </dd>
            </div>
          </dl>

          <p className="mt-8 text-[13px] text-karte-text-4">
            A link-in-bio that lags is a link-in-bio that doesn&apos;t get
            clicked.
          </p>
        </div>
      </section>

      {/* ─── 3. THE PROBLEM — manifesto-scale display ─────────── */}
      <section className="border-t border-karte-border">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span className="text-karte-accent/80">·</span> The problem
          </p>
          <div className="mt-10 max-w-5xl space-y-3 text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-karte-text sm:text-[56px] lg:text-[72px]">
            <p>Visitors land.</p>
            <p className="text-zinc-600">They scroll past dead links.</p>
            <p>
              They{' '}
              <span
                className={`${serif.className} font-normal text-karte-text-3`}
                style={{ fontStyle: 'italic' }}
              >
                forget you
              </span>{' '}
              by tomorrow.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 3. THE FLIP — asymmetric 2-col ──────────────────── */}
      <section className="border-t border-karte-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[1.2fr_1fr] lg:gap-20 lg:py-32">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
              <span className="text-karte-accent/80">·</span> The flip
            </p>
            <h2 className="mt-8 text-3xl font-semibold leading-[1.05] tracking-[-0.025em] text-karte-text sm:text-5xl lg:text-[64px]">
              So we built one that{' '}
              <span
                className={`${serif.className} font-normal text-karte-accent-soft`}
                style={{ fontStyle: 'italic' }}
              >
                doesn&apos;t.
              </span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-[1.65] tracking-[-0.005em] text-karte-text-3">
              A profile that{' '}
              <span className="text-karte-text">answers questions</span>,{' '}
              <span className="text-karte-text">generates pages</span>, and{' '}
              <span className="text-karte-text">gets shared back</span>. The same
              memory powers all of it.
            </p>
          </div>

          {/* Visible menu of questions — looks like a real prompt list */}
          <div className="lg:pt-16">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-600">
              Try a question on the live profile →
            </p>
            <ul className="mt-5 divide-y divide-karte-border border-y border-karte-border">
              {flipExamples.map((q) => (
                <li key={q}>
                  <Link
                    href="/sarthak"
                    className="group flex items-center justify-between gap-4 py-4 text-[16px] text-karte-text transition-colors duration-200 ease-[var(--karte-ease)] hover:text-karte-text"
                  >
                    <span
                      className={`${serif.className} text-karte-text-2 group-hover:text-karte-text`}
                      style={{ fontStyle: 'italic' }}
                    >
                      &ldquo;{q}&rdquo;
                    </span>
                    <span className="text-zinc-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-karte-accent">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 4. THE MECHANIC — 01 / 02 / 03 ──────────────────── */}
      <section className="border-t border-karte-border">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span className="text-karte-accent/80">·</span> How it works
          </p>
          <h2 className="mt-8 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-karte-text sm:text-5xl">
            Three steps.{' '}
            <span
              className={`${serif.className} font-normal text-karte-text-3`}
              style={{ fontStyle: 'italic' }}
            >
              One
            </span>{' '}
            afternoon.
          </h2>

          <ol className="relative mt-20 space-y-16 lg:mt-24 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-16">
            {/* hairline connector — desktop only */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 right-0 top-[44px] hidden h-px bg-gradient-to-r from-white/[0.04] via-white/[0.12] to-white/[0.04] lg:block"
            />
            {mechanics.map((m) => (
              <li key={m.n} className="relative max-w-sm">
                <div
                  className={`${serif.className} text-[88px] font-normal leading-[0.85] tracking-[-0.04em] text-karte-text sm:text-[112px]`}
                  style={{ fontStyle: 'italic' }}
                >
                  {m.n}
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-[-0.01em] text-karte-text">
                  {m.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.65] tracking-[-0.005em] text-karte-text-3">
                  {m.desc}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── 5. FOUR SURFACES — outputs, not UI ──────────────── */}
      <section className="border-t border-karte-border">
        <div className="mx-auto max-w-6xl px-6 pb-10 pt-24 lg:pb-12 lg:pt-32">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span className="text-karte-accent/80">·</span> Four surfaces · one memory
          </p>
          <h2 className="mt-8 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-karte-text sm:text-5xl">
            One profile.{' '}
            <span
              className={`${serif.className} font-normal text-karte-text-3`}
              style={{ fontStyle: 'italic' }}
            >
              Many
            </span>{' '}
            versions of you.
          </h2>
          <p className="mt-6 max-w-2xl text-[15px] leading-[1.65] tracking-[-0.005em] text-karte-text-3">
            Every surface below is generated from the same memory you fed it
            once.
          </p>
        </div>

        {/* Surface 01 — Chat (output: a pull-quote answer) */}
        <SurfaceBlock
          numeral="01"
          eyebrow="Surface 01 — Chat"
          title="Your AI version, on-call."
          body="Visitors ask. The page answers — in your voice, from your memory. No hallucinated facts, no awkward DM-me walls."
          ctaLabel="Try the chat"
          ctaHref="/sarthak"
        >
          <figure>
            <blockquote
              className={`${serif.className} max-w-2xl text-[28px] font-normal leading-[1.3] tracking-[-0.01em] text-karte-text sm:text-[36px]`}
              style={{ fontStyle: 'italic' }}
            >
              &ldquo;Karte is the main bet — digital cards with chat,
              Encyclopedia, Newspaper, and Roast modes grounded in your
              memory.&rdquo;
            </blockquote>
            <figcaption className="mt-5 text-[13px] tracking-[-0.005em] text-karte-text-4">
              — chat answer from karte.cc/sarthak, grounded in Projects + Bio
            </figcaption>
          </figure>
        </SurfaceBlock>

        {/* Surface 02 — Encyclopedia (output: a styled wiki paragraph) */}
        <SurfaceBlock
          numeral="02"
          flipNumeral
          eyebrow="Surface 02 — Encyclopedia"
          title="The official record."
          body="A Wikipedia-style identity page generated from your sources. Citation-grade, screenshot-able, editable section by section."
          ctaLabel="Read the wiki"
          ctaHref="/sarthak/encyclopedia"
        >
          <article className="max-w-2xl border-l border-white/[0.08] pl-6 font-serif text-[17px] leading-[1.7] text-karte-text">
            <p>
              <strong className="text-karte-text">Sarthak Agrawal</strong> is a
              builder and product person whose work spans AI tooling and the
              open-web profile category. Since 2024 he has shipped{' '}
              <a className="underline decoration-cyan-300/40 underline-offset-4">
                Karte
              </a>{' '}
              — a digital card platform where visitors query a
              memory-backed profile instead of scrolling static links.
            </p>
          </article>
        </SurfaceBlock>

        {/* Surface 03 — Newspaper (output: a serif front-page headline) */}
        <SurfaceBlock
          numeral="03"
          eyebrow="Surface 03 — Newspaper"
          title="Above the fold."
          body="A front-page treatment generated from the same memory. Built for screenshots and group chats."
          ctaLabel="Read the front page"
          ctaHref="/sarthak/newspaper"
        >
          <div className="max-w-3xl">
            <div className="flex items-baseline gap-3 border-b border-karte-border pb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-600">
              <span>The Profile Times</span>
              <span className="text-zinc-700">·</span>
              <span>Builder Edition</span>
              <span className="text-zinc-700">·</span>
              <span>Vol. 1</span>
            </div>
            <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
              Lead story
            </p>
            <h4
              className={`${serif.className} mt-2 text-[32px] font-normal leading-[1.05] tracking-[-0.01em] text-karte-text sm:text-[44px]`}
              style={{ fontStyle: 'normal' }}
            >
              Karte turns your bio into a card people actually talk to.
            </h4>
            <p
              className={`${serif.className} mt-4 text-[14px] uppercase tracking-[0.18em] text-karte-text-4`}
              style={{ fontStyle: 'italic' }}
            >
              By the Memory · Filed from karte.cc/sarthak
            </p>
            <div
              className={`${serif.className} mt-6 grid gap-6 text-[15px] leading-[1.65] text-karte-text-2 sm:grid-cols-2`}
              style={{ fontStyle: 'normal' }}
            >
              <p>
                A new wave of personal profiles is replacing the static link
                page. They answer questions in their owners&apos; voice,
                generate encyclopedia entries, and roast themselves for sport
                — all from a single memory pool the owner edits once.
              </p>
              <p>
                The Newspaper edition extracts the headline read. Same
                sources as the wiki and the chat, recomposed as a front page —
                main story, columns, byline. Built for screenshots and group
                chats, no design work required.
              </p>
            </div>
          </div>
        </SurfaceBlock>

        {/* Surface 04 — Roast (output: a roast pull-quote + score) */}
        <SurfaceBlock
          numeral="04"
          flipNumeral
          eyebrow="Surface 04 — Roast"
          title="Built for screenshots."
          body="A specific, very-online roast read of your profile. Same sources, different tone of voice."
          ctaLabel="Get roasted"
          ctaHref="/sarthak/roast"
          isLast
        >
          <figure>
            <blockquote
              className={`${serif.className} max-w-2xl text-[28px] font-normal leading-[1.3] tracking-[-0.01em] text-karte-text sm:text-[36px]`}
              style={{ fontStyle: 'italic' }}
            >
              &ldquo;Built an AI link-in-bio, a personal Wikipedia, a tabloid,
              and a roast comic — somehow still fewer features than a Notion
              doc with delusions of grandeur.&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-baseline gap-4 text-[13px] tracking-[-0.005em] text-karte-text-4">
              <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
                Roast score
              </span>
              <span
                className="text-2xl font-semibold tabular-nums tracking-[-0.01em] text-karte-text"
              >
                87
              </span>
            </figcaption>
          </figure>
        </SurfaceBlock>
      </section>

      {/* ─── 6. INVITE LOOP — aside, narrower + lighter tone ── */}
      <section className="border-t border-karte-border bg-karte-surface">
        <div className="mx-auto max-w-4xl px-6 py-24 lg:py-28">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span className="text-karte-accent/80">·</span> P.S. — the bonus loop
          </p>
          <h2 className="mt-5 text-2xl font-medium leading-[1.35] tracking-[-0.01em] text-karte-text sm:text-3xl lg:text-[36px]">
            Every chat gets a link.{' '}
            <span
              className={`${serif.className} font-normal text-karte-text`}
              style={{ fontStyle: 'italic' }}
            >
              Send it,
            </span>{' '}
            and anyone with it can read the thread and keep going.
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-[1.65] tracking-[-0.005em] text-karte-text-3">
            No signup wall, no app store. The room URL is the invite.
          </p>
          <Link
            href="/sarthak"
            className="group mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-karte-text transition-colors duration-200 ease-[var(--karte-ease)] hover:text-karte-text"
          >
            Start a shareable chat
            <span className="transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </section>

      {/* ─── 7. FINAL CTA ────────────────────────────────────── */}
      <section className="border-t border-karte-border">
        <div className="mx-auto max-w-6xl px-6 py-28 lg:py-40">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span className="text-karte-accent/80">·</span> Start
          </p>
          <h2 className="mt-8 max-w-4xl text-[44px] font-semibold leading-[1.02] tracking-[-0.03em] text-karte-text sm:text-[64px] lg:text-[80px]">
            Build the profile{' '}
            <span
              className={`${serif.className} font-normal text-karte-accent-soft`}
              style={{ fontStyle: 'italic' }}
            >
              they screenshot.
            </span>
          </h2>
          <p className="mt-6 max-w-2xl text-[15px] leading-[1.65] tracking-[-0.005em] text-karte-text-3">
            Claim your username when you&apos;re ready. Free forever, no card.
          </p>

          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              href="/create"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-medium text-zinc-950 transition-all duration-200 ease-[var(--karte-ease)] hover:bg-zinc-100"
            >
              Claim your name — Free
              <span className="transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/sarthak"
              className="group inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-transparent px-6 py-3 text-[15px] font-medium text-karte-text transition-all duration-200 ease-[var(--karte-ease)] hover:border-white/20 hover:bg-white/[0.03]"
            >
              See it live
              <span className="transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-karte-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-12 sm:flex-row sm:items-center">
          <p className="text-[13px] text-karte-text-4">© 2026 Karte.</p>
          <nav className="flex items-center gap-6 text-[13px] text-karte-text-4">
            <Link href="/about" className="transition-colors duration-200 hover:text-karte-text-2">About</Link>
            <Link href="/privacy" className="transition-colors duration-200 hover:text-karte-text-2">Privacy</Link>
            <Link href="/terms" className="transition-colors duration-200 hover:text-karte-text-2">Terms</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

/* ─── SurfaceBlock — type-led, no UI mocks ────────────────── */

function SurfaceBlock({
  numeral,
  flipNumeral = false,
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
  isLast = false,
  children,
}: {
  numeral: string;
  flipNumeral?: boolean;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden border-t border-karte-border ${isLast ? 'border-b-0' : ''}`}
    >
      <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-20">
        {/* Big serif numeral — anchored to content area, not full block */}
        <div
          aria-hidden="true"
          className={`${serif.className} pointer-events-none absolute top-0 select-none text-[140px] leading-[0.85] tracking-[-0.04em] text-karte-text/[0.025] sm:text-[200px] lg:text-[280px] ${
            flipNumeral
              ? '-left-4 sm:-left-8 lg:-left-12'
              : '-right-4 sm:-right-8 lg:-right-12'
          }`}
          style={{ fontStyle: 'italic' }}
        >
          {numeral}
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
          <span className="text-karte-accent/80">·</span> {eyebrow}
        </p>
        <h3 className="mt-6 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-karte-text sm:text-4xl">
          {title}
        </h3>
        <p className="mt-5 max-w-2xl text-[15px] leading-[1.65] tracking-[-0.005em] text-karte-text-3">
          {body}
        </p>

        <div className="mt-12">{children}</div>

        <Link
          href={ctaHref}
          className="group mt-12 inline-flex items-center gap-2 text-[14px] font-medium text-karte-text transition-colors duration-200 ease-[var(--karte-ease)] hover:text-karte-text"
        >
          {ctaLabel}
          <span className="transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </div>
  );
}
