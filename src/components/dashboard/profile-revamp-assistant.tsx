'use client';

import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useState } from 'react';

import { THEME_PRESETS } from '@/lib/themes';

type RevampBlock = {
  type: string;
  title: string;
  content: string;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
};

type CustomColors = {
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
};

type RevampPlan = {
  themePresetId: string;
  customColors?: CustomColors;
  headline: string;
  rationale: string;
  emphasis: string[];
  blocks: RevampBlock[];
};

const STARTER_PROMPTS = [
  'Dark luxury brand — deep navy and gold, clean and editorial.',
  'Vibrant neon hacker aesthetic — acid green on black.',
  'Soft pastel creative portfolio — lavender and blush tones.',
  'Bold founder page — strong red-orange gradient, investor-ready.',
  'Make this more impressive for investors and startup people.',
  'Make writing and product thinking more central.',
];

function ThemeSwatch({ plan }: { plan: RevampPlan }) {
  const preset = THEME_PRESETS.find((t) => t.id === plan.themePresetId) ?? THEME_PRESETS[0];
  const from = plan.customColors?.gradientFrom ?? preset.gradientFrom;
  const to = plan.customColors?.gradientTo ?? preset.gradientTo;
  const accent = plan.customColors?.accentColor ?? preset.accentColor;
  const isCustom = Boolean(plan.customColors);

  return (
    <div className="flex items-center gap-3">
      <div
        className="h-10 w-24 rounded-lg shadow-inner"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        title={`Gradient: ${from} → ${to}`}
      />
      <div
        className="h-10 w-6 rounded-lg"
        style={{ background: accent }}
        title={`Accent: ${accent}`}
      />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white">
          {isCustom ? 'Custom colors' : preset.label}
        </p>
        <p className="mt-0.5 text-[10px] text-gray-500">
          {isCustom ? `${from} → ${to}` : preset.description}
        </p>
      </div>
    </div>
  );
}

export function ProfileRevampAssistant({
  pageId,
  currentTheme,
}: {
  pageId: string;
  currentTheme: string;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [plan, setPlan] = useState<RevampPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');

  async function requestRevamp(apply: boolean) {
    if (!prompt.trim()) {
      setMessage('Describe the look or feel you want for your page.');
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

      posthog.capture(apply ? 'ai_profile_revamp_apply' : 'ai_profile_revamp_generate', {
        theme: data.plan?.themePresetId,
        hasCustomColors: Boolean(data.plan?.customColors),
      });

      setPlan(data.plan);
      setMessage(apply ? 'Revamp applied. Your public page has been updated.' : 'Design plan generated.');
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
          Generative UI
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white">Design your page</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400">
          Describe the look, feel, or vibe you want. The AI picks a theme, generates
          custom colors if needed, and adds layout blocks to your public page.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur-xl">
          <div>
            <h2 className="text-lg font-semibold text-white">Design prompt</h2>
            <p className="mt-1 text-xs text-gray-500">
              Current theme: {currentTheme}
            </p>
          </div>

          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={6}
            className="mt-5 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-gray-600 focus:border-white/35"
            placeholder="E.g. dark purple luxury brand with gold accents, minimal and editorial…"
          />

          <div className="mt-4">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gray-600">
              Starter prompts
            </p>
            <div className="flex flex-wrap gap-2">
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
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => requestRevamp(false)}
              disabled={loading || applying}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-gray-100 disabled:opacity-50"
            >
              {loading ? 'Generating…' : 'Generate Design'}
            </button>
            <button
              type="button"
              onClick={() => requestRevamp(true)}
              disabled={!plan || loading || applying}
              className="rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15 disabled:opacity-50"
            >
              {applying ? 'Applying…' : 'Apply to Page'}
            </button>
          </div>

          {message && (
            <p className={`mt-4 text-sm ${message.includes('applied') ? 'text-cyan-300' : 'text-gray-300'}`}>
              {message}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur-xl">
          {!plan ? (
            <div className="flex min-h-80 flex-col justify-center rounded-xl border border-dashed border-white/15 bg-black/20 p-6 text-center">
              <div className="mx-auto mb-4 flex gap-2">
                {THEME_PRESETS.slice(0, 5).map((preset) => (
                  <div
                    key={preset.id}
                    className="h-6 w-6 rounded-full"
                    style={{ background: `linear-gradient(135deg, ${preset.gradientFrom}, ${preset.gradientTo})` }}
                    title={preset.label}
                  />
                ))}
              </div>
              <h2 className="text-lg font-semibold text-white">No design yet</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Describe your style and generate a plan. You can preview the colors
                and blocks before applying to your live page.
              </p>
            </div>
          ) : (
            <div>
              <div className="border-b border-white/10 pb-5">
                <ThemeSwatch plan={plan} />
                <h2 className="mt-4 text-2xl font-semibold text-white">
                  {plan.headline}
                </h2>
              </div>

              <p className="mt-5 text-sm leading-7 text-gray-300">
                {plan.rationale}
              </p>

              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-gray-500">
                  Emphasis order
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
                    <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-300">
                      {block.type}
                    </span>
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
