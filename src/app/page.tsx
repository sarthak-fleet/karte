import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import Link from 'next/link';

import { HomeProfileDemo } from '@/components/public/home-profile-demo';
import { PublicTopBar } from '@/components/public/public-top-bar';

const inter = Inter({ subsets: ['latin'] });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

const profileModes = [
  {
    label: 'Link hub',
    description: 'All your important links in a fast, mobile-first profile.',
  },
  {
    label: 'Personal site',
    description: 'Bio, projects, blogs, sections, proof, and direct messages in one place.',
  },
  {
    label: 'AI version of you',
    description: 'A chatbot grounded in your memory, voice, links, and boundaries.',
  },
  {
    label: 'Encyclopedia',
    description: 'A source-backed, Wikipedia-style identity page visitors can share.',
  },
  {
    label: 'Newspaper',
    description: 'A main-character front page generated from your profile sources.',
  },
  {
    label: 'Roast me',
    description: 'A specific, funny profile read built for screenshots and shares.',
  },
];

const setupSteps = [
  'Add links, projects, blogs, sections, and proof',
  'Teach the profile your memory, voice, FAQs, and boundaries',
  'Turn on chat, DMs, and the viral modes you want people to share',
];

const coreStack = [
  {
    title: 'Replace Linktree',
    body: 'A clean link-in-bio surface that is useful even before the AI features are turned on.',
  },
  {
    title: 'Become your personal site',
    body: 'Projects, blogs, sections, bio, proof, and inbound messages make the page feel owned, not rented.',
  },
  {
    title: 'Let visitors talk to you',
    body: 'Profile Memory turns your page into a grounded assistant that answers like a public version of you.',
  },
];

const viralStack = [
  'Encyclopedia for the official version',
  'Newspaper for the main-character version',
  'Roast Me for the screenshot version',
];

export default function Home() {
  return (
    <main className={`min-h-screen bg-[#10100f] text-white selection:bg-cyan-300/30 ${inter.className}`}>
      <PublicTopBar current="home" variant="minimal" />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-8 px-5 pb-14 pt-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:pb-16 lg:pt-12">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-medium uppercase tracking-[0.32em] text-cyan-200">
              Interactive demo
            </p>
            <h1 className={`${jakarta.className} mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl`}>
              Profiles people can query
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-300 sm:text-lg sm:leading-8">
              Visitors ask questions, switch into memory-backed modes, and share
              Encyclopedia, Newspaper, or Roast pages — not just another link list.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {['Ask the profile', 'Browse modes', 'Share outputs'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-gray-300 sm:text-sm"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/sarthak"
                className="rounded-xl bg-cyan-300 px-6 py-3 text-center text-sm font-semibold text-gray-950 transition hover:bg-cyan-200"
              >
                Try Live Profile
              </Link>
              <Link
                href="/create"
                className="rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Build Yours
              </Link>
              <Link
                href="/login"
                className="px-2 py-3 text-center text-sm font-medium text-gray-400 transition hover:text-white"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <HomeProfileDemo />
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#151514] px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-200">
              The product shape
            </p>
            <h2 className={`${jakarta.className} mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl`}>
              Three core jobs, one profile.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {coreStack.map((item) => (
              <div key={item.title} className="border-t border-cyan-300/50 bg-white/[0.035] p-5">
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#10100f] px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-rose-200">
              Share loops
            </p>
            <h2 className={`${jakarta.className} mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl`}>
              The viral modes are powered by the same memory.
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-400">
              Links, projects, blogs, bio, FAQs, voice, and boundaries do double duty:
              they make the website useful and give the generated pages enough
              source material to feel specific.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {profileModes.map((mode) => (
              <div
                key={mode.label}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
              >
                <h3 className="text-base font-semibold text-white">{mode.label}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  {mode.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {viralStack.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-gray-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#151514] px-5 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-lime-200">
              Profile Memory
            </p>
            <h2 className={`${jakarta.className} mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl`}>
              Every setup step improves the whole product.
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-400">
              The profile memory system is the center of the product. It
              grounds the chatbot, fills the personal site, and gives the
              shareable modes facts to work with.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {['Explore my work', 'Ask me questions', 'Reach out', 'Get the vibe'].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-[#151514] px-4 py-3 text-sm font-medium text-white"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {setupSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#10100f] px-4 py-3"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300 text-sm font-semibold text-gray-950">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-300">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#10100f] px-5 py-16 text-center sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className={`${jakarta.className} text-3xl font-semibold tracking-tight text-white sm:text-4xl`}>
            Build the profile people remember.
          </h2>
          <p className="mt-4 text-sm leading-7 text-gray-400">
            Start your page before you sign in — claim your username when
            you&apos;re ready.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/create"
              className="inline-flex rounded-xl bg-cyan-300 px-7 py-3 text-sm font-semibold text-gray-950 transition hover:bg-cyan-200"
            >
              Build Your Profile
            </Link>
            <Link
              href="/sarthak"
              className="inline-flex rounded-xl border border-white/15 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              See Live Demo
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center sm:px-6">
        <p className="text-sm text-gray-500">© 2026 LinkChat.</p>
      </footer>
    </main>
  );
}
