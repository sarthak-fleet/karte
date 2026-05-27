'use client';

import posthog from 'posthog-js';
import { useCallback, useRef,useState } from 'react';

import {
  Badge,
  Button,
  Card,
  Input,
  Label,
} from '@/components/ui';
import { trackCoreAction } from '@/lib/analytics-events';
import type { EncyclopediaContent } from '@/lib/generated-page-types';

import { NovelEditor } from './novel-editor';

interface EncyclopediaEditorProps {
  pageId: string;
  initialContent: EncyclopediaContent | null;
}

function emptyContent(): EncyclopediaContent {
  return {
    markdown: '',
    infobox: {},
    categories: [],
  };
}

export function EncyclopediaEditor({
  pageId,
  initialContent,
}: EncyclopediaEditorProps) {
  const [content, setContent] = useState<EncyclopediaContent>(
    initialContent ?? emptyContent(),
  );
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [categoryInput, setCategoryInput] = useState('');

  // Track the latest markdown from the editor via ref to avoid re-renders
  const markdownRef = useRef(content.markdown);

  const handleEditorUpdate = useCallback((html: string) => {
    markdownRef.current = html;
    setContent((c) => ({ ...c, markdown: html }));
  }, []);

  // ── Infobox helpers ─────────────────────────────────────────────────

  const infoboxEntries = Object.entries(content.infobox);

  function setInfoboxKey(oldKey: string, newKey: string) {
    setContent((c) => {
      const entries = Object.entries(c.infobox);
      const updated = entries.map(([k, v]) =>
        k === oldKey ? [newKey, v] : [k, v],
      );
      return { ...c, infobox: Object.fromEntries(updated) };
    });
  }

  function setInfoboxValue(key: string, value: string) {
    setContent((c) => ({
      ...c,
      infobox: { ...c.infobox, [key]: value },
    }));
  }

  function addInfoboxRow() {
    setContent((c) => ({
      ...c,
      infobox: { ...c.infobox, '': '' },
    }));
  }

  function removeInfoboxRow(key: string) {
    setContent((c) => {
      const copy = { ...c.infobox };
      delete copy[key];
      return { ...c, infobox: copy };
    });
  }

  // ── Categories helpers ──────────────────────────────────────────────

  function addCategory() {
    const trimmed = categoryInput.trim();
    if (!trimmed) return;
    const newCats = trimmed
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c && !content.categories.includes(c));
    if (newCats.length === 0) return;
    setContent((c) => ({
      ...c,
      categories: [...c.categories, ...newCats],
    }));
    setCategoryInput('');
  }

  function removeCategory(cat: string) {
    setContent((c) => ({
      ...c,
      categories: c.categories.filter((x) => x !== cat),
    }));
  }

  // ── Save ────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setMessage('');

    // Use the latest markdown from the ref
    const toSave = { ...content, markdown: markdownRef.current };

    try {
      const res = await fetch(`/api/pages/${pageId}/encyclopedia-content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
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

  // ── Regenerate ──────────────────────────────────────────────────────

  async function handleRegenerate() {
    if (!confirm('This will replace all your edits with a fresh AI generation. Continue?')) {
      return;
    }

    setRegenerating(true);
    setMessage('');

    try {
      const res = await fetch(`/api/pages/${pageId}/generate/encyclopedia`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || 'Failed to regenerate');
        return;
      }

      const newContent: EncyclopediaContent = await res.json();
      posthog.capture('profile_mode_generated', {
        mode: 'encyclopedia',
      });
      // Owner-facing analytics — generating a shareable mode is a core action.
      trackCoreAction('mode_generated');
      setContent(newContent);
      markdownRef.current = newContent.markdown;
      setMessage('Regenerated successfully');
    } catch {
      setMessage('Failed to regenerate');
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-karte-text">
        Encyclopedia Editor
      </h1>

      <div className="space-y-6">
        {/* Article Body (Novel Editor) */}
        <Card>
          <div className="mb-3">
            <h3 className="text-sm font-medium text-karte-text">Article Body</h3>
            <p className="mb-2 text-xs text-karte-text-3">
              Write your encyclopedia article. Use / for slash commands (headings, lists, quotes).
              Select text for formatting options.
            </p>
          </div>
          <NovelEditor
            key={`editor-${content.markdown.length === 0 ? 'empty' : 'loaded'}-${regenerating ? 'regen' : 'stable'}`}
            initialContent={content.markdown || undefined}
            onUpdate={handleEditorUpdate}
          />
        </Card>

        {/* Infobox */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-karte-text">Infobox</h3>
              <p className="mb-2 text-xs text-karte-text-3">
                Key facts displayed in the sidebar info panel
              </p>
            </div>
            <Button variant="secondary" size="sm" type="button" onClick={addInfoboxRow}>
              + Add Row
            </Button>
          </div>

          {infoboxEntries.length === 0 && (
            <p className="text-xs text-karte-text-4">
              No entries yet. Click &quot;+ Add Row&quot; to start.
            </p>
          )}

          <div className="space-y-3">
            {infoboxEntries.map(([key, value], i) => (
              <div key={i} className="flex items-start gap-2">
                <Input
                  type="text"
                  value={key}
                  onChange={(e) => setInfoboxKey(key, e.target.value)}
                  placeholder="Label"
                  className="flex-[2]"
                />
                <Input
                  type="text"
                  value={value}
                  onChange={(e) => setInfoboxValue(key, e.target.value)}
                  placeholder="Value"
                  className="flex-[3]"
                />
                <button
                  type="button"
                  onClick={() => removeInfoboxRow(key)}
                  className="mt-1.5 shrink-0 rounded-lg p-2 text-karte-text-3 transition hover:bg-red-500/10 hover:text-red-400"
                  aria-label={`Remove ${key}`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Categories */}
        <Card>
          <Label htmlFor="categoryInput">Categories</Label>
          <p className="mb-2 text-xs text-karte-text-3">
            Tags for the article. Type and press Enter or click Add. Comma-separated values also work.
          </p>

          {content.categories.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {content.categories.map((cat) => (
                <Badge
                  key={cat}
                  className="bg-white/10 text-karte-text"
                  onRemove={() => removeCategory(cat)}
                  removeLabel={`Remove category ${cat}`}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              id="categoryInput"
              type="text"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCategory();
                }
              }}
              placeholder="e.g. Software Engineer, Open Source"
              className="flex-1"
            />
            <Button variant="secondary" size="sm" type="button" onClick={addCategory}>
              Add
            </Button>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Button
            onClick={handleSave}
            disabled={saving || regenerating}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleRegenerate}
            disabled={saving || regenerating}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate with AI'}
          </Button>
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
