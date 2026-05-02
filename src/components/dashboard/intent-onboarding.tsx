'use client';

import { useState } from 'react';

import { Button, Card } from '@/components/ui';
import type { PageSettings } from '@/db/schema';

type VisitorIntent = NonNullable<PageSettings['visitorIntent']>;

type IntentOption = {
  value: VisitorIntent;
  label: string;
  description: string;
  checklist: string[];
};

const INTENT_OPTIONS: IntentOption[] = [
  {
    value: 'explore',
    label: 'Explore my work',
    description: 'Lead with projects, links, and proof.',
    checklist: ['Add links', 'Add projects', 'Generate encyclopedia'],
  },
  {
    value: 'ask',
    label: 'Ask me questions',
    description: 'Make AI chat the primary experience.',
    checklist: ['Add memory', 'Enable AI chat', 'Add profile modes'],
  },
  {
    value: 'reach',
    label: 'Reach out',
    description: 'Optimize for high-quality inbound messages.',
    checklist: ['Enable DMs', 'Review Inbox', 'Publish profile'],
  },
  {
    value: 'vibe',
    label: 'Get the vibe',
    description: 'Use generated modes as shareable identity surfaces.',
    checklist: ['Enable newspaper', 'Enable roast', 'Share profile'],
  },
];

type IntentOnboardingProps = {
  pageId: string;
  initialPageSettings: PageSettings;
};

export function IntentOnboarding({
  pageId,
  initialPageSettings,
}: IntentOnboardingProps) {
  const [selectedIntent, setSelectedIntent] = useState<VisitorIntent>(
    initialPageSettings.visitorIntent ?? 'ask',
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const selectedOption =
    INTENT_OPTIONS.find((option) => option.value === selectedIntent)
    ?? INTENT_OPTIONS[1];

  async function handleSave() {
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch(`/api/pages/${pageId}/page-toggles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageSettings: {
            ...initialPageSettings,
            visitorIntent: selectedIntent,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || 'Failed to save intent');
        return;
      }

      setMessage('Intent saved');
    } catch {
      setMessage('Failed to save intent');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-300/80">
          Setup Focus
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          What should visitors do here?
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Pick the primary job for your profile. The checklist below adapts to
          that goal.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {INTENT_OPTIONS.map((option) => {
          const isSelected = selectedIntent === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedIntent(option.value)}
              className={`rounded-xl border p-4 text-left transition ${
                isSelected
                  ? 'border-cyan-300/60 bg-cyan-300/10'
                  : 'border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]'
              }`}
            >
              <p className="text-sm font-semibold text-white">{option.label}</p>
              <p className="mt-1 text-xs leading-5 text-gray-400">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-medium text-white">
          Suggested next steps for {selectedOption.label.toLowerCase()}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {selectedOption.checklist.map((item) => (
            <div
              key={item}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-gray-300"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? 'Saving...' : 'Save Focus'}
        </Button>
        {message && (
          <p
            className={`text-sm ${
              message.includes('saved') ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </Card>
  );
}
