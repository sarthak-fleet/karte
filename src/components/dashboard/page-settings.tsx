'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect, useRef, useState } from 'react';

import { ImageUploadField } from '@/components/dashboard/image-upload-field';
import { ProfilePreview } from '@/components/dashboard/profile-preview';
import { FormField, Input, Toggle } from '@/components/ui';
import type { DmMode } from '@/db/schema';
import { trackActivated, trackCoreAction } from '@/lib/analytics-events';
import {
  DEFAULT_THEME_PRESET,
  resolveThemeConfig,
  THEME_PRESETS,
  type ThemeConfig,
  type ThemePresetId,
} from '@/lib/themes';

// Mirrors the server-side RevampPlan shape from /api/pages/[id]/revamp.
// Kept inline since the route handler can't export non-handler symbols.
interface RevampPlan {
  themePresetId: string;
  customColors?: {
    gradientFrom: string;
    gradientTo: string;
    accentColor: string;
  };
  headline: string;
  rationale: string;
  emphasis: string[];
  blocks: Array<{
    type: string;
    title: string;
    content: string;
    buttonLabel?: string | null;
    buttonUrl?: string | null;
  }>;
  removeSectionIds: string[];
}

interface RemovedSectionPreview {
  id: string;
  title: string;
  type: string;
}

interface PageData {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  themeConfig?: ThemeConfig | null;
  published: boolean | null;
  dmMode: DmMode;
  location?: string | null;
  calendarUrl?: string | null;
  newsletterUrl?: string | null;
  tipUrl?: string | null;
  videoUrl?: string | null;
  petUrl?: string | null;
  petEnabled?: boolean | null;
}

interface PageSettingsProps {
  page: PageData | null;
  requireAuthToCreate?: boolean;
  loginHref?: string;
  // Pre-filled slug for new pages — e.g. ?slug=foo from the landing
  // card V claim form. Ignored when `page` is set (editing existing).
  initialSlug?: string;
}

const PAGE_DRAFT_STORAGE_KEY = 'karte:page-draft';
const DM_MODE_OPTIONS: Array<{
  value: DmMode;
  label: string;
  description: string;
}> = [
  {
    value: 'off',
    label: 'Off',
    description: 'Hide the public DM button.',
  },
  {
    value: 'anonymous',
    label: 'Anonymous',
    description: 'Visitors can send a message without sharing identity.',
  },
  {
    value: 'email',
    label: 'Email-verified',
    description: 'Visitors must be signed in with a verified email.',
  },
];

function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-');
}

function getInitials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'K'
  );
}

export function PageSettings({
  page,
  requireAuthToCreate = false,
  loginHref = '/login?next=/dashboard/appearance',
  initialSlug = '',
}: PageSettingsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = !!page;
  const shouldClaimOnLogin = !page && requireAuthToCreate;
  const draftLoadedRef = useRef(false);

  // Slug can arrive pre-filled either from a server prop (preferred —
  // /create reads ?slug= server-side so the initial render has the
  // value baked in) or from the client search params as a fallback.
  // For new (no `page`) flows only.
  const initialSlugFromQuery = !page
    ? sanitizeSlug(initialSlug || searchParams.get('slug') || '')
    : '';

  const [slug, setSlug] = useState(page?.slug ?? initialSlugFromQuery);
  const [displayName, setDisplayName] = useState(page?.displayName ?? '');
  const [bio, setBio] = useState(page?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(page?.avatarUrl ?? '');
  const [themePresetId, setThemePresetId] = useState<ThemePresetId>(
    (page?.themeConfig?.presetId as ThemePresetId | undefined) ??
      DEFAULT_THEME_PRESET.id,
  );
  const [published, setPublished] = useState(page?.published ?? false);
  const [dmMode, setDmMode] = useState<DmMode>(page?.dmMode ?? 'off');
  const [location, setLocation] = useState(page?.location ?? '');
  const [calendarUrl, setCalendarUrl] = useState(page?.calendarUrl ?? '');
  const [newsletterUrl, setNewsletterUrl] = useState(page?.newsletterUrl ?? '');
  const [tipUrl, setTipUrl] = useState(page?.tipUrl ?? '');
  const [videoUrl, setVideoUrl] = useState(page?.videoUrl ?? '');
  const [petUrl, setPetUrl] = useState(page?.petUrl ?? '');
  const [petEnabled, setPetEnabled] = useState(page?.petEnabled ?? true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiRunning, setAiRunning] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  // Two-step revamp flow: previewAiTheme generates a plan without
  // mutating; applyPendingPlan commits the previewed plan. Lets the
  // user inspect (and discard) before any DB write or theme swap.
  const [pendingPlan, setPendingPlan] = useState<RevampPlan | null>(null);
  const [pendingRemovals, setPendingRemovals] = useState<
    RemovedSectionPreview[]
  >([]);
  // Bumped on every successful save to force the live-preview iframe to
  // reload with fresh content. Cheap way to keep the preview honest
  // without manually wiring a postMessage channel.
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  async function previewAiTheme() {
    if (!page || !aiPrompt.trim()) {
      setAiMessage('Describe the vibe you want first.');
      return;
    }
    setAiRunning(true);
    setAiMessage('');
    setPendingPlan(null);
    setPendingRemovals([]);
    try {
      const res = await fetch(`/api/pages/${page.id}/revamp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, apply: false }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        plan?: RevampPlan;
        removedSections?: RemovedSectionPreview[];
      };
      if (!res.ok || !data.plan) {
        throw new Error(data.error || 'Failed to generate theme');
      }
      setPendingPlan(data.plan);
      setPendingRemovals(data.removedSections ?? []);
      setAiMessage(
        'Preview ready — review below, then Apply when you are happy.',
      );
    } catch (error) {
      setAiMessage(
        error instanceof Error ? error.message : 'Failed to generate theme',
      );
    } finally {
      setAiRunning(false);
    }
  }

  async function applyPendingPlan() {
    if (!page || !pendingPlan) return;
    setAiRunning(true);
    setAiMessage('');
    try {
      // Send the cached plan back so the server skips the AI call and
      // just commits — no second LLM round-trip.
      const res = await fetch(`/api/pages/${page.id}/revamp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: pendingPlan, apply: true }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        plan?: RevampPlan;
      };
      if (!res.ok) throw new Error(data.error || 'Failed to apply theme');
      const nextPresetId =
        data?.plan?.themePresetId ?? pendingPlan.themePresetId;
      if (typeof nextPresetId === 'string') {
        setThemePresetId(nextPresetId as ThemePresetId);
      }
      setAiMessage('Theme applied.');
      setPendingPlan(null);
      setPendingRemovals([]);
      setAiPrompt('');
      setPreviewRefreshKey((n) => n + 1);
      router.refresh();
    } catch (error) {
      setAiMessage(
        error instanceof Error ? error.message : 'Failed to apply theme',
      );
    } finally {
      setAiRunning(false);
    }
  }

  function discardPendingPlan() {
    setPendingPlan(null);
    setPendingRemovals([]);
    setAiMessage('');
  }
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState('');
  const isErrorMessage = /required|failed|taken|invalid|unauthorized/i.test(
    message,
  );
  const previewTheme = resolveThemeConfig({ presetId: themePresetId });
  const previewDisplayName = displayName.trim() || 'Your Name';
  const previewBio =
    bio.trim() || 'A short bio will show visitors what you are about.';
  const previewSlug = slug.trim() || 'your-name';
  const previewInitials = getInitials(previewDisplayName);

  useEffect(() => {
    if (typeof window === 'undefined' || draftLoadedRef.current) {
      return;
    }

    draftLoadedRef.current = true;

    if (page) {
      window.localStorage.removeItem(PAGE_DRAFT_STORAGE_KEY);
      return;
    }

    const storedDraft = window.localStorage.getItem(PAGE_DRAFT_STORAGE_KEY);
    if (!storedDraft) {
      return;
    }

    try {
      const draft = JSON.parse(storedDraft) as {
        slug?: string;
        displayName?: string;
        bio?: string;
        avatarUrl?: string;
        themePresetId?: ThemePresetId;
      };

      // Don't overwrite a slug that came in via ?slug= — the URL is
      // the most recent intent and overrides any older draft.
      if (typeof draft.slug === 'string' && !initialSlugFromQuery) {
        setSlug(draft.slug);
      }
      if (typeof draft.displayName === 'string') {
        setDisplayName(draft.displayName);
      }
      if (typeof draft.bio === 'string') {
        setBio(draft.bio);
      }
      if (typeof draft.avatarUrl === 'string') {
        setAvatarUrl(draft.avatarUrl);
      }
      if (typeof draft.themePresetId === 'string') {
        setThemePresetId(draft.themePresetId);
      }

      setMessage('Draft restored. Sign in to claim your username and save it.');
    } catch {
      window.localStorage.removeItem(PAGE_DRAFT_STORAGE_KEY);
    }
  }, [page]);

  function persistDraft() {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      PAGE_DRAFT_STORAGE_KEY,
      JSON.stringify({
        slug,
        displayName,
        bio,
        avatarUrl,
        themePresetId,
      }),
    );
  }

  async function handleSave() {
    if (!slug || !displayName) {
      setMessage('Slug and display name are required');
      return;
    }

    if (shouldClaimOnLogin) {
      persistDraft();
      setMessage('Redirecting to sign in so you can claim this username.');
      router.push(loginHref);
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const url = isEditing ? `/api/pages/${page.id}` : '/api/pages';
      const method = isEditing ? 'PUT' : 'POST';

      const body: Record<string, unknown> = {
        slug,
        displayName,
        bio,
        avatarUrl,
        themeConfig: { presetId: themePresetId },
        dmMode,
        location: location.trim() || null,
        calendarUrl: calendarUrl.trim() || null,
        newsletterUrl: newsletterUrl.trim() || null,
        tipUrl: tipUrl.trim() || null,
        videoUrl: videoUrl.trim() || null,
        petUrl: petUrl.trim() || null,
        petEnabled,
      };
      if (isEditing) {
        body.published = published;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || 'Failed to save');
        return;
      }

      if (!isEditing) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(PAGE_DRAFT_STORAGE_KEY);
        }
        posthog.capture('page_created', {
          slug,
          theme: themePresetId,
        });
        setMessage('Page created successfully');
        router.refresh();
      } else {
        // Owner-facing analytics — a profile going live is the core action,
        // and the first publish is the activation milestone.
        if (published && !page.published) {
          trackCoreAction('page_published');
          trackActivated();
        }
        setMessage('Saved successfully');
        setPreviewRefreshKey((n) => n + 1);
      }
    } catch {
      setMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-karte-text">
        {isEditing
          ? 'Appearance'
          : shouldClaimOnLogin
            ? 'Build Your Profile'
            : 'Create Your Page'}
      </h1>

      {isEditing && (
        <div className="mb-6 rounded-2xl border border-karte-accent/25 bg-gradient-to-br from-karte-accent/[0.10] via-karte-accent/[0.04] to-transparent p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-accent-soft">
            <span className="text-karte-accent/80">·</span> Prompt the design
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.01em] text-karte-text">
            Describe the vibe — we&apos;ll style your page
          </h2>
          <p className="mt-1.5 text-[12px] leading-[1.55] text-karte-text-3">
            Picks a theme preset and tweaks colors to match. Variant / layout
            generation (which widgets the AI picks for each link or project) is
            on the roadmap.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. dark editorial with warm gold accents"
              disabled={aiRunning || !!pendingPlan}
              className="min-w-0 flex-1 rounded-xl bg-white/[0.045] px-4 py-2.5 text-[14px] text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 ease-[var(--karte-ease)] hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={previewAiTheme}
              disabled={aiRunning || !aiPrompt.trim() || !!pendingPlan}
              className="shrink-0 rounded-xl bg-karte-accent px-5 py-2.5 text-[14px] font-semibold text-zinc-950 transition hover:bg-karte-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiRunning && !pendingPlan ? 'Generating…' : 'Preview'}
            </button>
          </div>
          {aiMessage && (
            <p
              className={`mt-2 text-[12px] ${aiMessage.toLowerCase().includes('failed') ? 'text-rose-300/90' : 'text-karte-text-3'}`}
            >
              {aiMessage}
            </p>
          )}

          {pendingPlan && (
            <RevampPreview
              plan={pendingPlan}
              removals={pendingRemovals}
              applying={aiRunning}
              onApply={applyPendingPlan}
              onDiscard={discardPendingPlan}
            />
          )}
        </div>
      )}

      {isEditing && page ? (
        <ProfilePreview slug={page.slug} refreshKey={previewRefreshKey} />
      ) : (
        <div className="rounded-2xl bg-white/[0.02] p-6">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-karte-text">
                Live preview
              </p>
              <p className="text-xs text-karte-text-4">
                Sketch of how your page will look. The real page appears here
                once you claim it.
              </p>
            </div>
            <span
              className="rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em]"
              style={{
                borderColor: `${previewTheme.accentColor}40`,
                color: previewTheme.accentColor,
              }}
            >
              {previewTheme.label}
            </span>
          </div>

          <div
            className="rounded-[28px] p-[1px]"
            style={{
              background: `linear-gradient(135deg, ${previewTheme.accentColor}66, ${previewTheme.gradientFrom}26)`,
            }}
          >
            <div
              className="relative overflow-hidden rounded-[27px] border border-karte-border-strong bg-karte-bg p-5 sm:p-8"
              style={{
                background: `linear-gradient(180deg, ${previewTheme.gradientFrom}1a 0%, ${previewTheme.gradientTo}1a 40%, #020617 100%)`,
              }}
            >
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                {avatarUrl.trim() ? (
                  <div
                    className="h-20 w-20 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${avatarUrl.trim()})` }}
                  />
                ) : (
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-karte-text"
                    style={{
                      background: `linear-gradient(135deg, ${previewTheme.gradientFrom}, ${previewTheme.gradientTo})`,
                    }}
                  >
                    {previewInitials}
                  </div>
                )}
                <div className="min-w-0">
                  <p
                    className="text-[11px] font-medium uppercase tracking-[0.32em]"
                    style={{ color: previewTheme.accentColor }}
                  >
                    karte.cc/{previewSlug}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-karte-text sm:text-3xl">
                    {previewDisplayName}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
                    {previewBio}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 rounded-2xl bg-white/[0.02] p-6">
        {/* Slug */}
        <div>
          <label
            htmlFor="slug"
            className="mb-2 block text-sm font-medium text-karte-text"
          >
            Page URL
          </label>
          <div className="flex items-center rounded-lg border border-karte-border-emphasis bg-white/5 backdrop-blur-sm transition focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20">
            <span className="pl-4 text-sm text-karte-text-3">karte.cc/</span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(sanitizeSlug(e.target.value))}
              placeholder="your-name"
              className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm text-karte-text placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label
            htmlFor="displayName"
            className="mb-2 block text-sm font-medium text-karte-text"
          >
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your Name"
            className="w-full rounded-lg border border-karte-border-emphasis bg-white/5 px-4 py-3 text-sm text-karte-text placeholder-gray-500 backdrop-blur-sm transition focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="mb-2 block text-sm font-medium text-karte-text"
          >
            Bio
          </label>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short bio about yourself..."
            className="w-full rounded-lg border border-karte-border-emphasis bg-white/5 px-4 py-3 text-sm text-karte-text placeholder-gray-500 backdrop-blur-sm transition focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>

        <div>
          <ImageUploadField
            pageId={page?.id}
            kind="avatar"
            label="Avatar Image"
            value={avatarUrl}
            onChange={setAvatarUrl}
            onUploadingChange={setUploadingAvatar}
            placeholder="https://example.com/avatar.jpg"
            helpText="Use a device upload for hosted storage, or paste a public image URL for your profile photo."
          />
        </div>

        <div>
          <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <label className="block text-sm font-medium text-karte-text">
              Theme
            </label>
            <span className="text-xs text-karte-text-4">
              Switch the look of your public page
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {THEME_PRESETS.map((preset) => {
              const isSelected = themePresetId === preset.id;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setThemePresetId(preset.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? 'border-white/50 bg-white/10'
                      : 'border-karte-border-emphasis bg-white/5 hover:border-white/30 hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: preset.gradientFrom }}
                    />
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: preset.gradientTo }}
                    />
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: preset.accentColor }}
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-karte-text">
                    {preset.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-karte-text-3">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Publish Toggle (edit mode only) */}
        {isEditing && (
          <>
            <div>
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-karte-text">
                    Personal DMs
                  </h3>
                  <p className="text-xs text-karte-text-3">
                    Choose how visitors can message you from the floating DM
                    button.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {DM_MODE_OPTIONS.map((option) => {
                  const isSelected = dmMode === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDmMode(option.value)}
                      className={`rounded-xl border p-4 text-left transition ${
                        isSelected
                          ? 'border-white/50 bg-white/10'
                          : 'border-karte-border-emphasis bg-white/5 hover:border-white/30 hover:bg-white/[0.08]'
                      }`}
                    >
                      <p className="text-sm font-semibold text-karte-text">
                        {option.label}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-karte-text-3">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-3">
                <h3 className="text-sm font-medium text-karte-text">
                  Quick actions
                </h3>
                <p className="text-xs text-karte-text-3">
                  Optional URLs that appear as pill CTAs on your public page.
                  Leave blank to hide.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Location" htmlFor="loc">
                  <Input
                    id="loc"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Bangalore, IN"
                  />
                </FormField>
                <FormField label="Booking link" htmlFor="cal">
                  <Input
                    id="cal"
                    type="url"
                    value={calendarUrl}
                    onChange={(e) => setCalendarUrl(e.target.value)}
                    placeholder="https://cal.com/you"
                  />
                </FormField>
                <FormField label="Newsletter link" htmlFor="news">
                  <Input
                    id="news"
                    type="url"
                    value={newsletterUrl}
                    onChange={(e) => setNewsletterUrl(e.target.value)}
                    placeholder="https://yoursubstack.substack.com"
                  />
                </FormField>
                <FormField label="Tip / Support link" htmlFor="tip">
                  <Input
                    id="tip"
                    type="url"
                    value={tipUrl}
                    onChange={(e) => setTipUrl(e.target.value)}
                    placeholder="https://ko-fi.com/you"
                  />
                </FormField>
                <FormField
                  label="Featured video"
                  htmlFor="video"
                  className="sm:col-span-2"
                  description="YouTube, Vimeo, or Loom — embeds at the top of your page."
                >
                  <Input
                    id="video"
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtu.be/…"
                  />
                </FormField>
              </div>
            </div>

            {/* Roaming pet */}
            <div>
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-karte-text">
                    Roaming pet
                  </h3>
                  <p className="text-xs text-karte-text-3">
                    A cartoon character that walks along the bottom of your
                    public page and pops up with AI-generated lines from your
                    wiki / newspaper / roast.
                  </p>
                </div>
                <Toggle checked={petEnabled} onChange={setPetEnabled} />
              </div>
              {petEnabled && (
                <div className="grid gap-3 sm:grid-cols-[1fr_72px]">
                  <FormField
                    label="Pet image URL"
                    htmlFor="pet"
                    description="Try DiceBear: e.g. https://api.dicebear.com/9.x/bottts/svg?seed=yourname"
                  >
                    <Input
                      id="pet"
                      type="url"
                      value={petUrl}
                      onChange={(e) => setPetUrl(e.target.value)}
                      placeholder="https://api.dicebear.com/9.x/bottts/svg?seed=…"
                    />
                  </FormField>
                  {petUrl.trim() && (
                    <div className="flex items-end justify-center pb-1">
                      <div
                        className="h-16 w-16 rounded-2xl bg-white/[0.025] bg-contain bg-center bg-no-repeat ring-1 ring-white/[0.08]"
                        style={{ backgroundImage: `url(${petUrl.trim()})` }}
                        title="Pet preview"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-karte-text">
                  Published
                </h3>
                <p className="text-xs text-karte-text-3">
                  Make your page visible to visitors
                </p>
              </div>
              <Toggle checked={published} onChange={setPublished} />
            </div>
          </>
        )}

        {/* Save / Create Button */}
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <button
            onClick={handleSave}
            disabled={saving || uploadingAvatar}
            className="w-full rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
          >
            {shouldClaimOnLogin
              ? 'Continue to Claim Username'
              : uploadingAvatar
                ? 'Uploading image...'
                : saving
                  ? 'Saving...'
                  : isEditing
                    ? 'Save'
                    : 'Create Page'}
          </button>
          {message && (
            <p
              className={`text-sm sm:max-w-sm ${
                isErrorMessage ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {message}
            </p>
          )}
        </div>

        {shouldClaimOnLogin && (
          <p className="text-sm text-karte-text-3">
            You can draft your profile now. We only ask you to sign in when you
            claim the username and save the page.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Revamp preview panel ────────────────────────────────────────────
// Renders the AI-generated plan in a non-destructive preview so the
// owner can read the headline, rationale, theme target, and the
// blocks that would be added before any DB write happens.
function RevampPreview({
  plan,
  removals,
  applying,
  onApply,
  onDiscard,
}: {
  plan: RevampPlan;
  removals: RemovedSectionPreview[];
  applying: boolean;
  onApply: () => void;
  onDiscard: () => void;
}) {
  const themeLabel =
    THEME_PRESETS.find((t) => t.id === plan.themePresetId)?.id ??
    plan.themePresetId;
  const swatch = plan.customColors?.accentColor;
  return (
    <div className="mt-5 rounded-xl border border-karte-accent/30 bg-black/30 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-accent-soft">
          · Preview
        </p>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-karte-text-4">
          Nothing saved yet
        </p>
      </div>
      <h3 className="mt-2 text-[15px] font-semibold leading-tight text-karte-text">
        {plan.headline}
      </h3>
      <p className="mt-1.5 text-[12.5px] leading-[1.55] text-karte-text-3">
        {plan.rationale}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
        <span className="rounded-full border border-white/[0.10] bg-white/[0.04] px-2.5 py-0.5 font-mono uppercase tracking-[0.14em] text-karte-text-3">
          Theme · {themeLabel}
        </span>
        {swatch && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] px-2.5 py-0.5 font-mono uppercase tracking-[0.14em] text-karte-text-3">
            <span
              aria-hidden="true"
              className="block h-2.5 w-2.5 rounded-full ring-1 ring-white/20"
              style={{ backgroundColor: swatch }}
            />
            {swatch}
          </span>
        )}
        {plan.emphasis.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/[0.10] bg-white/[0.02] px-2.5 py-0.5 text-karte-text-4"
          >
            {tag}
          </span>
        ))}
      </div>

      {removals.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-rose-300/75">
            {removals.length} will be removed
          </p>
          <ul className="mt-2 space-y-1.5">
            {removals.map((section) => (
              <li
                key={section.id}
                className="flex items-baseline justify-between gap-3 rounded-lg border border-rose-500/20 bg-rose-500/[0.05] px-3 py-2"
              >
                <p className="truncate text-[13px] font-medium text-karte-text/90 line-through decoration-rose-400/60">
                  {section.title}
                </p>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-rose-300/70">
                  {section.type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.blocks.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-karte-text-4">
            {plan.blocks.length} new{' '}
            {plan.blocks.length === 1 ? 'block' : 'blocks'}
          </p>
          <ul className="mt-2 space-y-2">
            {plan.blocks.map((block, i) => (
              <li
                key={i}
                className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[13px] font-medium text-karte-text">
                    {block.title}
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-karte-text-4">
                    {block.type}
                  </span>
                </div>
                <p className="mt-1 line-clamp-3 text-[12px] leading-[1.5] text-karte-text-3">
                  {block.content}
                </p>
                {block.type === 'cta' && block.buttonUrl && (
                  <p className="mt-2 truncate font-mono text-[11px] text-karte-accent-soft">
                    → {block.buttonLabel} · {block.buttonUrl}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onDiscard}
          disabled={applying}
          className="rounded-xl border border-white/[0.12] px-4 py-2 text-[13px] font-medium text-karte-text-3 transition hover:bg-white/[0.04] hover:text-karte-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={applying}
          className="rounded-xl bg-karte-accent px-5 py-2 text-[13px] font-semibold text-zinc-950 transition hover:bg-karte-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {applying ? 'Applying…' : 'Apply'}
        </button>
      </div>
    </div>
  );
}
