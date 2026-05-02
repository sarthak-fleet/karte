'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type RevampBlock = {
  type: string;
  title: string;
  content: string;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
};

type RevampPlan = {
  themePresetId: string;
  headline: string;
  rationale: string;
  emphasis: string[];
  blocks: RevampBlock[];
};

const STARTER_PROMPTS = [
  'Make this more impressive for investors and startup people.',
  'Make this feel like a polished personal website for recruiting.',
  'Make this more creator-ish and shareable without looking unserious.',
  'Make writing and product thinking more central.',
];

export function ProfileRevampAssistant({
  pageId,
  currentTheme,
}: {
  pageId: string;
  currentTheme: string;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(STARTER_PROMPTS[0]);
  const [plan, setPlan] = useState<RevampPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');

  async function requestRevamp(apply: boolean) {
    if (!prompt.trim()) {
      setMessage('Describe what the revamp should optimize for.');
      return;
    }

    if (apply) {
      setApplying(true);
    } else {
      setLoading(true);
    }
    setMessage('');

    try {
      const response = await fetch(`/api/pages/${pageId}/revamp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, plan, apply }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to revamp profile');
      }

      setPlan(data.plan);
      setMessage(apply ? 'Revamp applied. Your public page has been updated.' : 'Revamp plan generated.');
      if (apply) router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to revamp profile');
    } finally {
      setLoading(false);
      setApplying(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-cyan-200">
          AI Layout Assistant
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white">Profile Revamp</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400">
          Describe the visitor, vibe, or outcome you want. The assistant returns
          a constrained profile plan: theme, emphasis order, and safe reusable
          blocks it can add to your public page.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Revamp brief</h2>
              <p className="mt-1 text-xs text-gray-500">
                Current theme: {currentTheme}
              </p>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={8}
            className="mt-5 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-gray-600 focus:border-white/35"
            placeholder="Make this page more founder-focused. Lead with links and chat, make writing visible, keep roast lower."
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPrompt(item)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-gray-300 transition hover:border-white/25 hover:text-white"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => requestRevamp(false)}
              disabled={loading || applying}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-gray-100 disabled:opacity-50"
            >
              {loading ? 'Thinking...' : 'Generate Plan'}
            </button>
            <button
              type="button"
              onClick={() => requestRevamp(true)}
              disabled={!plan || loading || applying}
              className="rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15 disabled:opacity-50"
            >
              {applying ? 'Applying...' : 'Apply Revamp'}
            </button>
          </div>

          {message && (
            <p className="mt-4 text-sm text-gray-300">{message}</p>
          )}
        </section>

        <section className="rounded-2xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur-xl">
          {!plan ? (
            <div className="flex min-h-80 flex-col justify-center rounded-xl border border-dashed border-white/15 bg-black/20 p-6 text-center">
              <h2 className="text-lg font-semibold text-white">No plan yet</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Generate a plan first. Applying it will update the theme and
                replace only previous AI Revamp blocks.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-cyan-200">
                    {plan.themePresetId}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {plan.headline}
                  </h2>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-gray-300">
                {plan.rationale}
              </p>

              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-gray-500">
                  Emphasis
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {plan.emphasis.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-gray-300"
                    >
                      {index + 1}. {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {plan.blocks.map((block, index) => (
                  <article
                    key={`${block.title}-${index}`}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-300">
                        {block.type}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-white">
                      {block.title}
                    </h3>
                    <p className="mt-2 line-clamp-4 text-sm leading-6 text-gray-400">
                      {block.content}
                    </p>
                    {block.buttonLabel && block.buttonUrl && (
                      <p className="mt-3 text-xs text-cyan-200">
                        Button: {block.buttonLabel}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
