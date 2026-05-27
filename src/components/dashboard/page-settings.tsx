'use client';

import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect, useRef, useState } from 'react';

import { ImageUploadField } from '@/components/dashboard/image-upload-field';
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
}

interface PageSettingsProps {
  page: PageData | null;
  requireAuthToCreate?: boolean;
  loginHref?: string;
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
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'K';
}

export function PageSettings({
  page,
  requireAuthToCreate = false,
  loginHref = '/login?next=/dashboard/appearance',
}: PageSettingsProps) {
  const router = useRouter();
  const isEditing = !!page;
  const shouldClaimOnLogin = !page && requireAuthToCreate;
  const draftLoadedRef = useRef(false);

  const [slug, setSlug] = useState(page?.slug ?? '');
  const [displayName, setDisplayName] = useState(page?.displayName ?? '');
  const [bio, setBio] = useState(page?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(page?.avatarUrl ?? '');
  const [themePresetId, setThemePresetId] = useState<ThemePresetId>(
    (page?.themeConfig?.presetId as ThemePresetId | undefined)
      ?? DEFAULT_THEME_PRESET.id,
  );
  const [published, setPublished] = useState(page?.published ?? false);
  const [dmMode, setDmMode] = useState<DmMode>(page?.dmMode ?? 'off');
  const [location, setLocation] = useState(page?.location ?? '');
  const [calendarUrl, setCalendarUrl] = useState(page?.calendarUrl ?? '');
  const [newsletterUrl, setNewsletterUrl] = useState(page?.newsletterUrl ?? '');
  const [tipUrl, setTipUrl] = useState(page?.tipUrl ?? '');
  const [videoUrl, setVideoUrl] = useState(page?.videoUrl ?? '');
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

      if (typeof draft.slug === 'string') {
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

      <div className="space-y-6 rounded-2xl bg-white/[0.02] p-6">
          <div>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-karte-text">Live Preview</p>
              <p className="text-xs text-karte-text-4">
                This updates as you shape the page.
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
              boxShadow: `0 24px 80px -48px ${previewTheme.accentColor}`,
            }}
          >
            <div
              className="relative overflow-hidden rounded-[27px] border border-karte-border-strong bg-karte-bg p-5 sm:p-8"
              style={{
                background: `linear-gradient(180deg, ${previewTheme.gradientFrom}1a 0%, ${previewTheme.gradientTo}1a 40%, #020617 100%)`,
              }}
            >
              <div
                className="pointer-events-none absolute -top-16 -left-16 h-36 w-36 rounded-full blur-3xl"
                style={{ backgroundColor: `${previewTheme.gradientFrom}52` }}
              />
              <div
                className="pointer-events-none absolute -right-12 bottom-0 h-32 w-32 rounded-full blur-3xl"
                style={{ backgroundColor: `${previewTheme.gradientTo}42` }}
              />

              <div className="relative">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  {avatarUrl.trim() ? (
                    <div
                      className="h-20 w-20 rounded-full border border-karte-border-emphasis bg-cover bg-center  shadow-black/20"
                      style={{ backgroundImage: `url(${avatarUrl.trim()})` }}
                    />
                  ) : (
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-full border border-karte-border-emphasis text-2xl font-semibold text-karte-text  shadow-black/20"
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

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {['Primary Link', 'Newsletter', 'Portfolio'].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl bg-white/[0.045] px-4 py-3 text-center text-sm font-medium text-karte-text backdrop-blur-lg"
                      style={{
                        boxShadow: `inset 0 0 0 1px ${previewTheme.accentColor}1a`,
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div
                  className="mt-6 rounded-2xl border border-white/12 bg-white/[0.04] p-4"
                  style={{ borderColor: `${previewTheme.accentColor}1f` }}
                >
                  <p
                    className="text-[11px] font-medium uppercase tracking-[0.28em]"
                    style={{ color: previewTheme.accentColor }}
                  >
                    Next Up
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    After you claim the username, you can add projects, blogs,
                    custom sections, links, and chat settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                  <h3 className="text-sm font-medium text-karte-text">Personal DMs</h3>
                  <p className="text-xs text-karte-text-3">
                    Choose how visitors can message you from the floating DM button.
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

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-karte-text">Published</h3>
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
