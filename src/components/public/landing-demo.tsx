'use client';

import Link from 'next/link';
import { useState } from 'react';

import { TypedText } from '@/components/public/typed-text';

type DemoMode = 'chat' | 'encyclopedia' | 'newspaper' | 'roast';

const MODE_TABS: { id: DemoMode; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'encyclopedia', label: 'Encyclopedia' },
  { id: 'newspaper', label: 'Newspaper' },
  { id: 'roast', label: 'Roast' },
];

const CHAT_PROMPTS = [
  {
    id: 'building',
    label: 'What is Sarthak building?',
    user: 'What is Sarthak building?',
    assistant:
      'Karte is the main bet — digital cards with chat, Encyclopedia, Newspaper, and Roast modes grounded in your memory. Also shipping fleet tooling and AI product experiments.',
    source: 'Projects + bio',
  },
  {
    id: 'reach',
    label: 'Should I reach out?',
    user: 'Should I reach out?',
    assistant:
      'Start with the active projects and what kind of collaboration fits. For a real reply, send a verified DM through the profile — chat answers from public memory, not private inbox.',
    source: 'Boundaries + FAQs',
  },
  {
    id: 'roast',
    label: 'Roast this profile',
    user: 'Roast this profile',
    assistant:
      'Built an AI link-in-bio, a personal Wikipedia, a tabloid, and a roast comic — somehow still fewer features than a Notion doc with delusions of grandeur.',
    source: 'Projects + tone',
  },
];

export function LandingDemo() {
  const [mode, setMode] = useState<DemoMode>('chat');
  const [activePromptId, setActivePromptId] = useState(CHAT_PROMPTS[0].id);

  const activePrompt = CHAT_PROMPTS.find((p) => p.id === activePromptId) ?? CHAT_PROMPTS[0];

  const handleMode = (newMode: DemoMode) => {
    setMode(newMode);
  };

  const handlePrompt = (id: string) => {
    setMode('chat');
    setActivePromptId(id);
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-karte-border bg-karte-surface/60 p-5 sm:p-6"
      data-testid="landing-demo"
    >
      {/* Identity header — pure tokens */}
      <div className="flex items-center gap-4 border-b border-karte-border pb-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-karte-accent/30 bg-karte-accent/[0.08] text-[17px] font-semibold text-karte-text">
          SA
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span>kar te.cc/sarthak</span>
            <span className="inline-block h-px w-3 bg-karte-border" />
            <span>Live memory</span>
          </div>
          <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.01em] text-karte-text">
            Sarthak Agrawal
          </p>
          <p className="text-[13px] text-karte-text-3">Builder, researcher, product person.</p>
        </div>
      </div>

      {/* Mode tabs — elegant, token-driven */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-karte-border pb-4">
        {MODE_TABS.map((tab) => {
          const isActive = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleMode(tab.id)}
              aria-pressed={isActive}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-[var(--karte-ease)] ${
                isActive
                  ? 'bg-white text-zinc-950'
                  : 'border border-karte-border bg-transparent text-karte-text-2 hover:border-karte-border-strong hover:text-karte-text'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
        <span className="ml-auto hidden text-[10px] font-medium uppercase tracking-[0.18em] text-karte-text-4 sm:inline">
          One memory · four surfaces
        </span>
      </div>

      {/* Preview pane — beautiful, contained, token-first */}
      <div className="mt-5 min-h-[218px] rounded-2xl border border-karte-border bg-black/[0.02] p-5">
        {mode === 'chat' && (
          <div className="flex h-full flex-col">
            <div className="space-y-4">
              {/* User bubble — subtle */}
              <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-md bg-white/[0.06] px-4 py-2.5 text-[14px] leading-tight text-karte-text-2">
                {activePrompt.user}
              </div>

              {/* Assistant — the star, feels written */}
              <div className="max-w-[94%] rounded-2xl rounded-tl-md border border-karte-border bg-karte-surface p-4 text-[15px] leading-[1.65] text-karte-text">
                <TypedText
                  text={activePrompt.assistant}
                  speed={18}
                  cursor
                  cursorColor="var(--karte-accent)"
                />
                <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.2em] text-karte-text-4">
                  Grounded in {activePrompt.source}
                </p>
              </div>
            </div>

            {/* Prompt chips */}
            <div className="mt-auto pt-6">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
                Try a question
              </p>
              <div className="flex flex-wrap gap-2">
                {CHAT_PROMPTS.map((prompt) => {
                  const isActivePrompt = prompt.id === activePromptId;
                  return (
                    <button
                      key={prompt.id}
                      type="button"
                      onClick={() => handlePrompt(prompt.id)}
                      aria-pressed={isActivePrompt}
                      className={`rounded-xl border px-3 py-2 text-left text-sm leading-tight transition-all duration-200 ease-[var(--karte-ease)] ${
                        isActivePrompt
                          ? 'border-karte-accent/60 bg-karte-accent/[0.06] text-karte-text'
                          : 'border-karte-border bg-transparent text-karte-text-3 hover:border-karte-border-strong hover:text-karte-text-2'
                      }`}
                    >
                      {prompt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {mode === 'encyclopedia' && (
          <div className="prose prose-sm max-w-none text-karte-text">
            <p className="font-medium text-karte-text">
              <span className="font-semibold">Sarthak Agrawal</span> is a builder and product
              person whose work spans AI tooling and the open-web profile category.
            </p>
            <p className="mt-3 text-karte-text-2">
              Since 2024 he has shipped Karte — a digital card platform where visitors query a
              memory-backed profile instead of scrolling static links. The same sources power
              chat, encyclopedia, newspaper, and roast surfaces.
            </p>
            <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.2em] text-karte-text-4">
              Generated · citation-grade · editable
            </p>
          </div>
        )}

        {mode === 'newspaper' && (
          <div>
            <div className="flex items-baseline gap-2 border-b border-karte-border pb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
              <span>The Profile Times</span>
              <span className="text-karte-border">·</span>
              <span>Builder Edition</span>
            </div>
            <h4 className="mt-4 font-serif text-[21px] font-normal leading-[1.1] tracking-[-0.01em] text-karte-text">
              Karte turns your bio into a card people actually talk to.
            </h4>
            <p className="mt-3 text-[14px] leading-[1.65] text-karte-text-2">
              A new wave of personal profiles is replacing the static link page. They answer
              questions in their owners’ voice, generate encyclopedia entries, and roast
              themselves for sport — all from a single memory pool.
            </p>
            <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.18em] text-karte-text-4">
              By the Memory · Filed from karte.cc/sarthak
            </p>
          </div>
        )}

        {mode === 'roast' && (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
                Roast score
              </p>
              <p className="font-mono text-5xl font-semibold tabular-nums tracking-[-0.02em] text-karte-text">
                87
              </p>
            </div>
            <blockquote className="mt-4 border-l-2 border-karte-border pl-4 font-serif text-[17px] italic leading-tight tracking-[-0.005em] text-karte-text">
              “Built an AI link-in-bio, a personal Wikipedia, a tabloid, and a roast comic —
              somehow still fewer features than a Notion doc with delusions of grandeur.”
            </blockquote>
            <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.2em] text-karte-text-4">
              Same memory · different voice · built for screenshots
            </p>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-karte-border pt-4 sm:flex-row sm:items-center">
        <p className="text-[13px] leading-tight text-karte-text-3">
          Same memory powers the chat, the shareable surfaces, and the public profile.
        </p>
        <Link
          href="/sarthak"
          className="group inline-flex items-center gap-2 rounded-full border border-karte-border bg-transparent px-5 py-2 text-[13px] font-medium text-karte-text transition-all duration-200 ease-[var(--karte-ease)] hover:border-karte-border-strong hover:bg-white/[0.03]"
        >
          Open the live profile
          <span className="transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5">↗</span>
        </Link>
      </div>
    </div>
  );
}
