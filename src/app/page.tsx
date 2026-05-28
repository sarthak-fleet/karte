import { Geist, Instrument_Serif } from 'next/font/google';
import Link from 'next/link';

import { HeroChatDemo } from '@/components/public/hero-chat-demo';
import { LandingDemo } from '@/components/public/landing-demo';
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

        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 sm:pt-20 lg:pb-24 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            {/* Left — pitch + CTAs */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
                <span className="text-karte-accent/80">·</span> For people who get
                inbound
              </p>

              <h1
                className="mt-6 max-w-2xl text-[40px] font-semibold leading-[1.02] tracking-[-0.035em] text-karte-text sm:text-[56px] lg:text-[76px]"
              >
                Stop answering<br />
                the same{' '}
                <span
                  className={`${serif.className} font-normal text-karte-accent-soft`}
                  style={{ fontStyle: 'italic' }}
                >
                  DMs.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-[16px] leading-[1.6] text-karte-text-3 sm:text-[18px]">
                Your link in bio{' '}
                <span
                  className={`${serif.className} text-karte-text`}
                  style={{ fontStyle: 'italic' }}
                >
                  already knows
                </span>{' '}
                what you&rsquo;d say. Rates, availability, stack, hiring —
                answered in your voice,{' '}
                <span className="text-karte-text">before they hit your inbox.</span>
              </p>

              <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
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

              <p className="mt-5 text-[12.5px] text-karte-text-4">
                Free · no card · 60-second import from Linktree, Beacons, or Bento.
              </p>

              {/* Showcase placeholder — filled in once the demo profiles ship */}
              <div className="mt-10 max-w-md rounded-2xl border border-dashed border-white/[0.10] bg-white/[0.015] px-5 py-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-5">
                  <span className="text-karte-accent/80">·</span> Coming this week
                </p>
                <p className="mt-2 text-[13px] leading-[1.5] text-karte-text-3">
                  Demo profiles for{' '}
                  <span className="text-karte-text">Naval</span>,{' '}
                  <span className="text-karte-text">Pieter Levels</span>,{' '}
                  <span className="text-karte-text">Paul Graham</span>, and others —
                  built from their public writing. See how the chat would handle
                  their inbound.
                </p>
              </div>
            </div>

            {/* Right — live conversation demo */}
            <div className="lg:pl-4">
              <HeroChatDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Speed — single-row credibility strip ─────────────── */}
      <section className="border-t border-karte-border">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-karte-border sm:grid-cols-4">
            <Stat eyebrow="TTFB" value="< 100 ms" caption="cached at the edge" />
            <Stat eyebrow="To first paint" value="0 JS" caption="static-rendered" />
            <Stat eyebrow="Edge PoPs" value="330+" caption="Cloudflare global" />
            <Stat eyebrow="Time to import" value="60 s" caption="from Linktree / Beacons" />
          </dl>
        </div>
      </section>

      {/* ─── 2. THE FLIP — interactive surfaces (the heart of the revamp) ─ */}
      <section className="border-t border-karte-border">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
              <span className="text-karte-accent/80">·</span> The flip
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-[1.05] tracking-[-0.025em] text-karte-text sm:text-5xl">
              One memory.{' '}
              <span
                className={`${serif.className} font-normal text-karte-accent-soft`}
                style={{ fontStyle: 'italic' }}
              >
                Four living surfaces.
              </span>
            </h2>
            <p className="mt-4 text-[15px] leading-[1.65] text-karte-text-3">
              Visitors don&apos;t scroll a list. They ask, read, screenshot, and share.
              The same sources power every mode.
            </p>
          </div>

          {/* The beautiful interactive demo — shows the product promise immediately */}
          <div className="mt-10">
            <LandingDemo />
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
            <span className="text-karte-accent/80">·</span> Deep dive
          </p>
          <h2 className="mt-8 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-karte-text sm:text-5xl">
            The same memory,{' '}
            <span
              className={`${serif.className} font-normal text-karte-text-3`}
              style={{ fontStyle: 'italic' }}
            >
              four polished outputs.
            </span>
          </h2>
          <p className="mt-6 max-w-2xl text-[15px] leading-[1.65] tracking-[-0.005em] text-karte-text-3">
            Every surface is generated from the sources you already maintain.
            No extra writing. No design work.
          </p>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-24 pt-2 lg:pb-32">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Chat — pull-quote answer */}
            <SurfaceCard
              eyebrow="Chat"
              title="Your AI version, on-call."
              body="Visitors ask. Your page answers — in your voice, from your memory."
              ctaLabel="Try the chat"
              ctaHref="/sarthak"
            >
              <figure>
                <blockquote
                  className={`${serif.className} text-[17px] leading-[1.4] tracking-[-0.005em] text-karte-text sm:text-[19px]`}
                  style={{ fontStyle: 'italic' }}
                >
                  &ldquo;Karte is the main bet — digital cards with chat,
                  Encyclopedia, Newspaper, and Roast modes grounded in your
                  memory.&rdquo;
                </blockquote>
                <figcaption className="mt-3 text-[11.5px] text-karte-text-4">
                  — chat answer from karte.cc/sarthak
                </figcaption>
              </figure>
            </SurfaceCard>

            {/* Encyclopedia — wiki paragraph */}
            <SurfaceCard
              eyebrow="Encyclopedia"
              title="The official record."
              body="A Wikipedia-style identity page, generated from your sources. Editable section by section."
              ctaLabel="Read the wiki"
              ctaHref="/sarthak/encyclopedia"
            >
              <article className="border-l border-white/[0.08] pl-4 font-serif text-[14px] leading-[1.65] text-karte-text">
                <p>
                  <strong className="text-karte-text">Sarthak Agrawal</strong>{' '}
                  is a builder whose work spans AI tooling and the open-web
                  profile category. Since 2024 he has shipped{' '}
                  <span className="underline decoration-cyan-300/40 underline-offset-4">
                    Karte
                  </span>
                  &nbsp;— a digital-card platform where visitors query a
                  memory-backed profile instead of scrolling static links.
                </p>
              </article>
            </SurfaceCard>

            {/* Newspaper — masthead + headline */}
            <SurfaceCard
              eyebrow="Newspaper"
              title="Above the fold."
              body="A front-page treatment of you, generated daily. Built for screenshots and group chats."
              ctaLabel="Read the front page"
              ctaHref="/sarthak/newspaper"
            >
              <div>
                <div className="flex items-baseline gap-2 border-b border-karte-border pb-2 text-[9.5px] font-medium uppercase tracking-[0.22em] text-zinc-600">
                  <span>The Profile Times</span>
                  <span className="text-zinc-700">·</span>
                  <span>Vol. 1</span>
                </div>
                <h4
                  className={`${serif.className} mt-3 text-[22px] font-normal leading-[1.1] tracking-[-0.005em] text-karte-text sm:text-[26px]`}
                >
                  Karte turns your bio into a card people talk to.
                </h4>
                <p
                  className={`${serif.className} mt-2 text-[10.5px] uppercase tracking-[0.18em] text-karte-text-4`}
                  style={{ fontStyle: 'italic' }}
                >
                  By the Memory · Filed from karte.cc/sarthak
                </p>
              </div>
            </SurfaceCard>

            {/* Roast — pull quote + score */}
            <SurfaceCard
              eyebrow="Roast"
              title="Built for screenshots."
              body="A specific, very-online roast read of your profile. Same sources, different tone."
              ctaLabel="Get roasted"
              ctaHref="/sarthak/roast"
            >
              <figure>
                <blockquote
                  className={`${serif.className} text-[17px] leading-[1.4] tracking-[-0.005em] text-karte-text sm:text-[19px]`}
                  style={{ fontStyle: 'italic' }}
                >
                  &ldquo;Built an AI link-in-bio, a personal Wikipedia, a
                  tabloid, and a roast comic — somehow still fewer features
                  than a Notion doc with delusions of grandeur.&rdquo;
                </blockquote>
                <figcaption className="mt-3 flex items-baseline gap-3 text-[11.5px] text-karte-text-4">
                  <span className="font-medium uppercase tracking-[0.22em]">
                    Roast score
                  </span>
                  <span className="text-[20px] font-semibold tabular-nums tracking-[-0.01em] text-karte-text">
                    87
                  </span>
                </figcaption>
              </figure>
            </SurfaceCard>
          </div>
        </div>
      </section>

      {/* ─── 6. FINAL CTA ────────────────────────────────────── */}
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
              they talk to.
            </span>
          </h2>
          <p className="mt-6 max-w-2xl text-[15px] leading-[1.65] tracking-[-0.005em] text-karte-text-3">
            One link. Four surfaces. Conversations that travel. Free forever.
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

/* ─── Stat — single cell in the credibility strip ────────── */

function Stat({
  eyebrow,
  value,
  caption,
}: {
  eyebrow: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="bg-karte-bg p-5 sm:border-l sm:border-karte-border sm:first:border-l-0">
      <dt className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-karte-text-4">
        {eyebrow}
      </dt>
      <dd className="mt-2 font-mono text-[20px] font-semibold tracking-tight text-karte-text">
        {value}
      </dd>
      <dd className="mt-1 text-[12px] text-karte-text-3">{caption}</dd>
    </div>
  );
}

/* ─── SurfaceCard — one cell in the 2×2 surfaces grid ─────── */

function SurfaceCard({
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={ctaHref}
      className="group flex flex-col rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl transition-all duration-200 ease-[var(--karte-ease)] hover:-translate-y-0.5 hover:border-karte-accent/25 hover:bg-white/[0.04] sm:p-7"
    >
      <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
        <span className="text-karte-accent">·</span> {eyebrow}
      </p>
      <h3 className="mt-3 text-[20px] font-semibold leading-[1.2] tracking-[-0.01em] text-karte-text sm:text-[22px]">
        {title}
      </h3>
      <p className="mt-2 text-[13.5px] leading-[1.55] text-karte-text-3">{body}</p>

      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/20 p-4 sm:p-5">
        {children}
      </div>

      <span className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-karte-accent-soft transition-colors duration-200 group-hover:text-karte-accent">
        {ctaLabel}
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
          →
        </span>
      </span>
    </Link>
  );
}
