'use client';

import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect, useRef, useState } from 'react';

import { ImageUploadField } from '@/components/dashboard/image-upload-field';
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
    .join('') || 'LC';
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
      <h1 className="mb-6 text-2xl font-bold text-white">
        {isEditing
          ? 'Appearance'
          : shouldClaimOnLogin
            ? 'Build Your Profile'
            : 'Create Your Page'}
      </h1>

      <div className="space-y-6 rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
          <div>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white">Live Preview</p>
              <p className="text-xs text-gray-500">
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
              className="relative overflow-hidden rounded-[27px] border border-white/10 bg-gray-950 p-5 sm:p-8"
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
                      className="h-20 w-20 rounded-full border border-white/20 bg-cover bg-center shadow-lg shadow-black/20"
                      style={{ backgroundImage: `url(${avatarUrl.trim()})` }}
                    />
                  ) : (
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 text-2xl font-semibold text-white shadow-lg shadow-black/20"
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
                    <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
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
                      className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm font-medium text-white/90 backdrop-blur-lg"
                      style={{
                        borderColor: `${previewTheme.accentColor}2a`,
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
            className="mb-2 block text-sm font-medium text-white"
          >
            Page URL
          </label>
          <div className="flex items-center rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm transition focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20">
            <span className="pl-4 text-sm text-gray-400">karte.cc/</span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(sanitizeSlug(e.target.value))}
              placeholder="your-name"
              className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label
            htmlFor="displayName"
            className="mb-2 block text-sm font-medium text-white"
          >
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your Name"
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="mb-2 block text-sm font-medium text-white"
          >
            Bio
          </label>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short bio about yourself..."
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
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
            <label className="block text-sm font-medium text-white">
              Theme
            </label>
            <span className="text-xs text-gray-500">
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
                      : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/[0.08]'
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
                  <p className="mt-3 text-sm font-semibold text-white">
                    {preset.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
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
                  <h3 className="text-sm font-medium text-white">Personal DMs</h3>
                  <p className="text-xs text-gray-400">
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
                          : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/[0.08]'
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">
                        {option.label}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-400">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">Published</h3>
                <p className="text-xs text-gray-400">
                  Make your page visible to visitors
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={published}
                onClick={() => setPublished(!published)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-gray-950 ${
                  published ? 'bg-blue-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg transition-transform duration-200 ${
                    published ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
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
          <p className="text-sm text-gray-400">
            You can draft your profile now. We only ask you to sign in when you
            claim the username and save the page.
          </p>
        )}
      </div>
    </div>
  );
}
