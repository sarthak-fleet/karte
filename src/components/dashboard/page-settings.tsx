'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PageData {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  published: boolean | null;
}

interface PageSettingsProps {
  page: PageData | null;
}

function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-');
}

export function PageSettings({ page }: PageSettingsProps) {
  const router = useRouter();
  const isEditing = !!page;

  const [slug, setSlug] = useState(page?.slug ?? '');
  const [displayName, setDisplayName] = useState(page?.displayName ?? '');
  const [bio, setBio] = useState(page?.bio ?? '');
  const [published, setPublished] = useState(page?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSave() {
    if (!slug || !displayName) {
      setMessage('Slug and display name are required');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const url = isEditing ? `/api/pages/${page.id}` : '/api/pages';
      const method = isEditing ? 'PUT' : 'POST';

      const body: Record<string, unknown> = { slug, displayName, bio };
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
        setMessage('Page created successfully');
        router.refresh();
      } else {
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
        {isEditing ? 'Appearance' : 'Create Your Page'}
      </h1>

      <div className="space-y-6 rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
        {/* Slug */}
        <div>
          <label
            htmlFor="slug"
            className="mb-2 block text-sm font-medium text-white"
          >
            Page URL
          </label>
          <div className="flex items-center rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm transition focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20">
            <span className="pl-4 text-sm text-gray-400">linkchat.com/</span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(sanitizeSlug(e.target.value))}
              placeholder="your-name"
              className="flex-1 bg-transparent px-1 py-3 text-sm text-white placeholder-gray-500 focus:outline-none"
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

        {/* Publish Toggle (edit mode only) */}
        {isEditing && (
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
        )}

        {/* Save / Create Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-100 disabled:opacity-50"
          >
            {saving
              ? 'Saving...'
              : isEditing
                ? 'Save'
                : 'Create Page'}
          </button>
          {message && (
            <p
              className={`text-sm ${
                message.includes('success')
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
