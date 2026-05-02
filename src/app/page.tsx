import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import Link from 'next/link';

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
        <div className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-10 px-5 pb-14 pt-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:pb-16 lg:pt-14">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.32em] text-cyan-200">
              Personal presence, not just links
            </p>
            <h1 className={`${jakarta.className} mt-5 text-5xl font-bold tracking-tight text-white sm:text-7xl`}>
              LinkChat
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-300">
              Replace Linktree with a personal website and an AI version of you.
              Then give visitors shareable ways to experience your profile:
              Encyclopedia, Newspaper, and Roast Me.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/create"
                className="rounded-xl bg-cyan-300 px-6 py-3 text-center text-sm font-semibold text-gray-950 transition hover:bg-cyan-200"
              >
                Build Your Profile
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Sign In
              </Link>
            </div>

            <div className="mt-8 grid gap-2 text-sm text-gray-300 sm:grid-cols-3">
              {['Links', 'Website', 'Chat'].map((item) => (
                <div
                  key={item}
                  className="border-l border-cyan-300/50 bg-white/[0.03] px-4 py-3"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[28px] border border-white/15 bg-[#181817]/95 p-5 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-4 border-b border-white/10 pb-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300 text-xl font-bold text-gray-950">
                  LC
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-200">
                    sarthak.linkchat
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    Sarthak Agrawal
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Builder, researcher, product person.
                  </p>
                </div>
              </div>

              <div className="grid border-b border-white/10 py-5 sm:grid-cols-3">
                {['Links', 'Projects', 'DM'].map((item) => (
                  <div
                    key={item}
                    className="border-white/10 py-3 text-center text-sm font-medium text-white sm:border-l first:sm:border-l-0"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="py-5">
                <p className="text-sm font-medium text-cyan-100">
                  Ask this profile
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-300">
                  “What should I know before reaching out?”
                </p>
                <p className="mt-4 border-l border-cyan-300/60 bg-cyan-300/10 p-3 text-sm leading-6 text-gray-300">
                  Start with the current projects. For a real reply, send a
                  verified DM through the profile.
                </p>
              </div>

              <div className="grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
                {['Encyclopedia', 'Newspaper', 'Roast Me'].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm font-medium text-white"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
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

      <footer className="border-t border-white/10 px-5 py-8 text-center sm:px-6">
        <p className="text-sm text-gray-500">© 2026 LinkChat.</p>
      </footer>
    </main>
  );
}
