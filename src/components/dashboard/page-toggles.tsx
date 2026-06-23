'use client';

import posthog from 'posthog-js';
import { useState } from 'react';

import {
  Button,
  Card,
  FormField,
  Input,
  Select,
  Textarea,
  Toggle,
} from '@/components/ui';
import type { PageSettings } from '@/db/schema';
import { trackCoreAction } from '@/lib/analytics-events';

interface PageTogglesProps {
  pageId: string;
  slug: string;
  initialEncyclopedia: boolean;
  initialRoast: boolean;
  initialNewspaper: boolean;
  initialPageSettings: PageSettings;
}

const PAGE_FEATURES = [
  {
    key: 'encyclopediaEnabled' as const,
    label: 'Encyclopedia',
    description:
      'A Wikipedia-style profile mode generated from your memory and page data',
    path: 'encyclopedia',
    settingsKey: 'encyclopedia' as const,
  },
  {
    key: 'roastEnabled' as const,
    label: 'Roast Me',
    description: 'A sharper, shareable profile mode that captures your vibe',
    path: 'roast',
    settingsKey: 'roast' as const,
  },
  {
    key: 'newspaperEnabled' as const,
    label: 'Newspaper',
    description:
      'A front-page profile mode that turns your story into headlines',
    path: 'newspaper',
    settingsKey: 'newspaper' as const,
  },
] as const;

const ROAST_TONES = ['Savage', 'Friendly', 'Sarcastic'] as const;
const NEWSPAPER_TONES = ['Prestigious', 'Tabloid', 'Local'] as const;
const ENCYCLOPEDIA_STYLES = ['Formal Wikipedia', 'Casual', 'Academic'] as const;
type GeneratedModeSettingsKey = 'roast' | 'newspaper' | 'encyclopedia';

export function PageToggles({
  pageId,
  slug,
  initialEncyclopedia,
  initialRoast,
  initialNewspaper,
  initialPageSettings,
}: PageTogglesProps) {
  const [toggles, setToggles] = useState({
    encyclopediaEnabled: initialEncyclopedia,
    roastEnabled: initialRoast,
    newspaperEnabled: initialNewspaper,
  });
  const [pageSettings, setPageSettings] =
    useState<PageSettings>(initialPageSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [expandedSettings, setExpandedSettings] = useState<Set<string>>(
    new Set(),
  );

  function toggleSettingsPanel(key: string) {
    setExpandedSettings((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function updatePageSetting(
    type: GeneratedModeSettingsKey,
    field: string,
    value: string,
  ) {
    setPageSettings((prev) => ({
      ...prev,
      [type]: {
        ...(prev[type] || {}),
        [field]: value,
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/pages/${pageId}/page-toggles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...toggles, pageSettings }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || 'Failed to save');
        return;
      }
      setMessage('Saved successfully');
    } catch {
      setMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate(type: string) {
    setGenerating(type);
    try {
      const res = await fetch(`/api/pages/${pageId}/generate/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || `Failed to generate ${type}`);
        return;
      }
      posthog.capture('profile_mode_generated', {
        mode: type,
        source: 'dashboard_toggles',
      });
      // Owner-facing analytics — generating a shareable mode is a core action.
      trackCoreAction('mode_generated');
      setMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} generated!`);
    } catch {
      setMessage(`Failed to generate ${type}`);
    } finally {
      setGenerating(null);
    }
  }

  function renderSettings(featureKey: string) {
    if (featureKey === 'roast') {
      const settings = pageSettings.roast || {};
      return (
        <div className="space-y-4">
          <FormField label="Tone">
            <Select
              value={settings.tone || 'Savage'}
              onChange={(e) =>
                updatePageSetting('roast', 'tone', e.target.value)
              }
            >
              {ROAST_TONES.map((tone) => (
                <option key={tone} value={tone} className="bg-karte-bg">
                  {tone}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Extra Context">
            <Textarea
              rows={3}
              value={settings.context || ''}
              onChange={(e) =>
                updatePageSetting('roast', 'context', e.target.value)
              }
              placeholder="Add details the AI should know about you for a better roast"
            />
          </FormField>
        </div>
      );
    }

    if (featureKey === 'newspaper') {
      const settings = pageSettings.newspaper || {};
      return (
        <div className="space-y-4">
          <FormField label="Newspaper Name">
            <Input
              type="text"
              value={settings.name || ''}
              onChange={(e) =>
                updatePageSetting('newspaper', 'name', e.target.value)
              }
              placeholder="Leave empty for AI to generate one"
            />
          </FormField>
          <FormField label="Tone">
            <Select
              value={settings.tone || 'Prestigious'}
              onChange={(e) =>
                updatePageSetting('newspaper', 'tone', e.target.value)
              }
            >
              {NEWSPAPER_TONES.map((tone) => (
                <option key={tone} value={tone} className="bg-karte-bg">
                  {tone}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Extra Context">
            <Textarea
              rows={3}
              value={settings.context || ''}
              onChange={(e) =>
                updatePageSetting('newspaper', 'context', e.target.value)
              }
              placeholder="Add details the AI should use when writing the newspaper"
            />
          </FormField>
        </div>
      );
    }

    if (featureKey === 'encyclopedia') {
      const settings = pageSettings.encyclopedia || {};
      return (
        <div className="space-y-4">
          <FormField label="Writing Style">
            <Select
              value={settings.style || 'Formal Wikipedia'}
              onChange={(e) =>
                updatePageSetting('encyclopedia', 'style', e.target.value)
              }
            >
              {ENCYCLOPEDIA_STYLES.map((style) => (
                <option key={style} value={style} className="bg-karte-bg">
                  {style}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Extra Context">
            <Textarea
              rows={3}
              value={settings.context || ''}
              onChange={(e) =>
                updatePageSetting('encyclopedia', 'context', e.target.value)
              }
              placeholder="Add details the AI should include in the encyclopedia article"
            />
          </FormField>
        </div>
      );
    }

    return null;
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-karte-text">
          Modes
        </h2>
        <p className="mt-1 text-sm text-karte-text-3">
          Enable the alternate ways visitors can experience your identity. Each
          mode is accessible at{' '}
          <code className="text-karte-text-4">/{slug}/&lt;mode&gt;</code>
        </p>
      </div>

      <div className="space-y-4">
        {PAGE_FEATURES.map((feature) => {
          const enabled = toggles[feature.key];
          const isExpanded = expandedSettings.has(feature.settingsKey);

          return (
            <Card key={feature.key}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-karte-text">
                    {feature.label}
                  </h3>
                  <p className="mt-1 text-xs text-karte-text-3">
                    {feature.description}
                  </p>
                </div>
                <Toggle
                  checked={enabled}
                  onChange={(checked) =>
                    setToggles((prev) => ({ ...prev, [feature.key]: checked }))
                  }
                />
              </div>

              {enabled && (
                <>
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-karte-border-strong pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => handleGenerate(feature.path)}
                      disabled={generating === feature.path}
                      className="text-xs"
                    >
                      {generating === feature.path
                        ? 'Generating...'
                        : 'Generate Content'}
                    </Button>
                    <a
                      href={`/${slug}/${feature.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-karte-border-emphasis bg-white/5 px-4 py-2 text-xs font-medium text-karte-text transition hover:bg-white/10"
                    >
                      Preview
                    </a>
                    <Button
                      variant="ghost"
                      onClick={() => toggleSettingsPanel(feature.settingsKey)}
                      className="ml-auto text-xs"
                    >
                      {isExpanded ? 'Hide Settings' : 'Configure'}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 rounded-xl bg-white/[0.02] p-4">
                      {renderSettings(feature.settingsKey)}
                    </div>
                  )}
                </>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
        {message && (
          <p
            className={`text-sm ${
              message.includes('success') || message.includes('generated')
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </>
  );
}
