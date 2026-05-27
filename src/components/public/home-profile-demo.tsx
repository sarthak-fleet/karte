'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type DemoMode = 'chat' | 'encyclopedia' | 'newspaper' | 'roast';

const MODE_CYCLE: DemoMode[] = ['chat', 'encyclopedia', 'newspaper', 'roast'];
const CYCLE_MS = 4500;

type ChatPrompt = {
  id: string;
  label: string;
  userMessage: string;
  assistantMessage: string;
  source: string;
};

const DEMO_PROFILE = {
  slug: 'sarthak',
  name: 'Sarthak Agrawal',
  handle: 'karte.cc/sarthak',
  tagline: 'Builder, researcher, product person.',
  initials: 'SA',
};

const CHAT_PROMPTS: ChatPrompt[] = [
  {
    id: 'building',
    label: 'What is Sarthak building?',
    userMessage: 'What is Sarthak building?',
    assistantMessage:
      'Karte is the main bet — digital cards with chat, Encyclopedia, Newspaper, and Roast modes grounded in your memory. Also shipping fleet tooling and AI product experiments.',
    source: 'Projects + bio',
  },
  {
    id: 'reach-out',
    label: 'What should I know before reaching out?',
    userMessage: 'What should I know before reaching out?',
    assistantMessage:
      'Start with the active projects and what kind of collaboration fits. For a real reply, send a verified DM through the profile — chat answers from public memory, not private inbox.',
    source: 'FAQs + boundaries',
  },
  {
    id: 'projects',
    label: 'Which project should I open first?',
    userMessage: 'Which project should I open first?',
    assistantMessage:
      'Open Karte if you care about digital cards + AI profile modes. Open the fleet tooling repos if you want to see how the builder stack ships in production.',
    source: 'Projects',
  },
];

const MODE_TABS: { id: DemoMode; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'encyclopedia', label: 'Encyclopedia' },
  { id: 'newspaper', label: 'Newspaper' },
  { id: 'roast', label: 'Roast Me' },
];

function ModePreview({ mode }: { mode: DemoMode }) {
  if (mode === 'encyclopedia') {
    return (
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div className="rounded-xl border border-karte-border-strong bg-white/[0.04] p-3 text-xs text-karte-text-3">
          <p className="font-semibold text-karte-text">Sarthak Agrawal</p>
          <p className="mt-2">Builder</p>
          <p>Product</p>
          <p>AI tools</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-karte-text">Sarthak Agrawal</p>
          <p className="mt-3 text-sm leading-6 text-karte-text-2">
            Sarthak Agrawal is a builder working on Karte — a digital card platform
            where visitors query a memory-backed profile instead of scrolling static links.
          </p>
          <p className="mt-3 text-sm leading-6 text-karte-text-3">
            The product ships chat, Encyclopedia, Newspaper, and Roast modes from the
            same profile memory: links, projects, bio, FAQs, and voice.
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-cyan-200/80">
            Generated from profile memory
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'newspaper') {
    return (
      <div className="overflow-hidden rounded-xl border border-[#d9c7a0]/30 bg-[#f4efe4] text-[#17130d]">
        <div className="border-b border-[#17130d]/20 px-4 py-2 text-center font-serif text-sm font-bold tracking-[0.18em]">
          THE PROFILE TIMES
        </div>
        <div className="p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#17130d]/55">
            Builder edition · Generated from memory
          </p>
          <h3 className="mt-2 font-serif text-2xl font-bold leading-tight">
            Karte turns your bio into a card people actually talk to
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#17130d]/75">
            Sarthak Agrawal ships a link page that answers questions, publishes
            shareable Encyclopedia and Newspaper editions, and roasts itself for screenshots.
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'roast') {
    return (
      <div className="rounded-xl border border-orange-400/25 bg-orange-400/[0.07] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-orange-100">Roast score</p>
          <p className="text-3xl font-bold text-orange-200">87</p>
        </div>
        <p className="mt-4 text-sm leading-6 text-karte-text">
          &ldquo;Built an AI link-in-bio, a personal Wikipedia, a tabloid, and a roast
          comic — somehow still fewer features than a Notion doc with delusions of grandeur.&rdquo;
        </p>
        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-orange-200/70">
          Shareable roast · same memory sources
        </p>
      </div>
    );
  }

  return null;
}

type HomeProfileDemoProps = {
  autoCycle?: boolean;
};

export function HomeProfileDemo({ autoCycle = true }: HomeProfileDemoProps = {}) {
  const [mode, setMode] = useState<DemoMode>('chat');
  const [activePromptId, setActivePromptId] = useState(CHAT_PROMPTS[0].id);
  const [paused, setPaused] = useState(false);
  const [locked, setLocked] = useState(false);
  const activePrompt =
    CHAT_PROMPTS.find((prompt) => prompt.id === activePromptId) ?? CHAT_PROMPTS[0];

  useEffect(() => {
    if (!autoCycle || paused || locked) return;
    const id = window.setInterval(() => {
      setMode((m) => {
        const i = MODE_CYCLE.indexOf(m);
        return MODE_CYCLE[(i + 1) % MODE_CYCLE.length];
      });
      setActivePromptId((pid) => {
        const i = CHAT_PROMPTS.findIndex((p) => p.id === pid);
        return CHAT_PROMPTS[(i + 1) % CHAT_PROMPTS.length].id;
      });
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [autoCycle, paused, locked]);

  const cycleActive = autoCycle && !paused && !locked;

  return (
    <div
      className="relative overflow-hidden rounded-[28px] border border-karte-border-emphasis bg-[#181817]/95 p-4 shadow-2xl shadow-black/40 sm:p-5"
      data-testid="home-profile-demo"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-4 border-b border-karte-border-strong pb-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 text-lg font-bold text-gray-950 sm:h-16 sm:w-16 sm:text-xl">
          {DEMO_PROFILE.initials}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-cyan-200">
            {DEMO_PROFILE.handle}
          </p>
          <p className="mt-1 truncate text-xl font-semibold text-karte-text sm:text-2xl">
            {DEMO_PROFILE.name}
          </p>
          <p className="mt-1 text-sm text-karte-text-3">{DEMO_PROFILE.tagline}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setMode(tab.id);
              setLocked(true);
            }}
            aria-pressed={mode === tab.id}
            className={`relative rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
              mode === tab.id
                ? 'bg-cyan-300 text-gray-950'
                : 'border border-karte-border-strong bg-white/[0.03] text-karte-text-2 hover:bg-white/[0.06] hover:text-karte-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-karte-text-4">
          <span className={`h-1.5 w-1.5 rounded-full ${cycleActive ? 'animate-pulse bg-cyan-300' : 'bg-gray-600'}`} />
          {locked ? 'Locked' : cycleActive ? 'Auto' : 'Paused'}
        </span>
      </div>

      <div className="mt-4 min-h-[220px] rounded-2xl border border-karte-border-strong bg-black/25 p-4">
        {mode === 'chat' ? (
          <div className="flex h-full flex-col">
            <div className="space-y-3">
              <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-cyan-300/15 px-3 py-2 text-sm text-cyan-50">
                {activePrompt.userMessage}
              </div>
              <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-karte-border-strong bg-white/[0.04] px-3 py-2 text-sm leading-6 text-karte-text">
                {activePrompt.assistantMessage}
                <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-cyan-200/75">
                  Grounded in {activePrompt.source}
                </p>
              </div>
            </div>

            <div className="mt-auto space-y-2 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
                Try a question
              </p>
              <div className="flex flex-wrap gap-2">
                {CHAT_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => {
                      setMode('chat');
                      setActivePromptId(prompt.id);
                    }}
                    aria-pressed={activePromptId === prompt.id}
                    className={`rounded-xl px-3 py-2 text-left text-xs leading-5 transition sm:text-sm ${
                      activePromptId === prompt.id
                        ? 'border border-cyan-300/50 bg-cyan-300/10 text-cyan-50'
                        : 'border border-karte-border-strong bg-white/[0.03] text-karte-text-2 hover:border-karte-border-emphasis hover:text-karte-text'
                    }`}
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ModePreview mode={mode} />
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-karte-border-strong pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-karte-text-4">
          Same memory powers chat, shareable modes, and the public profile.
        </p>
        <Link
          href={`/${DEMO_PROFILE.slug}`}
          className="inline-flex items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
        >
          Open live profile
        </Link>
      </div>

      {/* auto-cycle progress bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] overflow-hidden">
        <div
          key={`${mode}-${cycleActive ? 'on' : 'off'}`}
          className={`h-full origin-left bg-cyan-300/80 ${
            cycleActive ? 'animate-[progress-fill_4500ms_linear_forwards]' : 'w-0'
          }`}
        />
      </div>
    </div>
  );
}
