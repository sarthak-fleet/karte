'use client';

import { useEffect, useState } from 'react';

import type {
  TimelineEventStatus,
  TimelineEventType,
} from '@/db/schema';
import {
  TIMELINE_TYPE_LABELS,
  TIMELINE_TYPE_OPTIONS,
} from '@/lib/timeline';

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  body: string | null;
  whereLabel: string | null;
  link: string | null;
  imageUrl: string | null;
  whenLabel: string;
  status: TimelineEventStatus;
}

interface TimelineEditorProps {
  pageId: string;
}

// Blank form state for "add new" — kept separate from edit state so
// the add form can stay open while the user pastes multiple events.
const BLANK_FORM = {
  type: 'shipped-project' as TimelineEventType,
  title: '',
  whenLabel: '',
  whereLabel: '',
  body: '',
  link: '',
};

// Shape returned by the AI paste-in importer.
interface ParsedImportEvent {
  type: TimelineEventType;
  title: string;
  body: string | null;
  whereLabel: string | null;
  whenLabel: string;
  link: string | null;
}

// Local-only state for the import preview list — each parsed event
// can be checked/unchecked + lightly edited before commit.
interface PreviewEvent extends ParsedImportEvent {
  localId: string;
  selected: boolean;
}

export function TimelineEditor({ pageId }: TimelineEditorProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<typeof BLANK_FORM>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Import flow state — separate from the manual add form so they
  // don't clobber each other.
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [preview, setPreview] = useState<PreviewEvent[]>([]);
  const [committing, setCommitting] = useState(false);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (importing) return;
    const text = importText.trim();
    if (!text) {
      setImportError('Paste some text first.');
      return;
    }
    setImporting(true);
    setImportError('');
    setPreview([]);

    try {
      const res = await fetch(`/api/pages/${pageId}/timeline/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        events?: ParsedImportEvent[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || 'Could not parse.');
      const parsed = data.events ?? [];
      if (parsed.length === 0) {
        setImportError("Couldn't find events in that text.");
        return;
      }
      setPreview(
        parsed.map((p, i) => ({
          ...p,
          localId: `import-${Date.now()}-${i}`,
          selected: true,
        })),
      );
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setImporting(false);
    }
  }

  async function handleCommitImport() {
    if (committing) return;
    const toCommit = preview.filter((p) => p.selected);
    if (toCommit.length === 0) {
      setImportError('Select at least one event.');
      return;
    }
    setCommitting(true);
    setImportError('');

    // POST each event serially so a partial failure doesn't lose user
    // intent. (Could parallel them but bulk-error UX gets messy.)
    const created: TimelineEvent[] = [];
    for (const p of toCommit) {
      try {
        const res = await fetch(`/api/pages/${pageId}/timeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: p.type,
            title: p.title,
            body: p.body,
            whereLabel: p.whereLabel,
            link: p.link,
            whenLabel: p.whenLabel,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { event: TimelineEvent };
          created.push(data.event);
        }
      } catch {
        // Individual failure: just keep going. We'll surface the count.
      }
    }

    if (created.length > 0) {
      setEvents((prev) =>
        [...prev, ...created].sort((a, b) =>
          b.whenLabel.localeCompare(a.whenLabel),
        ),
      );
    }

    setCommitting(false);
    if (created.length < toCommit.length) {
      setImportError(
        `Added ${created.length} of ${toCommit.length}. Re-try the ones that didn't save.`,
      );
      setPreview((prev) =>
        prev.filter(
          (p) =>
            !p.selected ||
            !created.find(
              (c) => c.title === p.title && c.whenLabel === p.whenLabel,
            ),
        ),
      );
    } else {
      // All committed — reset the import panel.
      setPreview([]);
      setImportText('');
      setImportOpen(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pages/${pageId}/timeline`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not load timeline.');
        const data = (await res.json()) as { events: TimelineEvent[] };
        if (!cancelled) setEvents(data.events);
      })
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!form.title.trim() || !form.whenLabel.trim()) {
      setError('Title and When are required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as {
        event?: TimelineEvent;
        error?: string;
      };
      if (!res.ok || !data.event) {
        throw new Error(data.error || 'Could not save.');
      }
      setEvents((prev) =>
        [...prev, data.event!].sort((a, b) =>
          b.whenLabel.localeCompare(a.whenLabel),
        ),
      );
      setForm(BLANK_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this event?')) return;
    const prev = events;
    setEvents(events.filter((e) => e.id !== id));
    const res = await fetch(`/api/pages/${pageId}/timeline/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      setEvents(prev);
      setError('Could not delete.');
    }
  }

  async function handleSaveEdit(id: string, patch: Partial<TimelineEvent>) {
    const res = await fetch(`/api/pages/${pageId}/timeline/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = (await res.json().catch(() => ({}))) as {
      event?: TimelineEvent;
      error?: string;
    };
    if (!res.ok || !data.event) {
      setError(data.error || 'Could not save.');
      return;
    }
    setEvents((prev) =>
      prev
        .map((e) => (e.id === id ? data.event! : e))
        .sort((a, b) => b.whenLabel.localeCompare(a.whenLabel)),
    );
    setEditingId(null);
  }

  return (
    <div className="space-y-8">
      {/* Paste-in importer — primary path for first-run bulk add. */}
      <section className="rounded-2xl border border-karte-accent/30 bg-karte-accent/[0.04] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-accent">
              ◆ Import from text
            </p>
            <p className="mt-2 max-w-md text-[13.5px] leading-[1.55] text-karte-text-3">
              Paste your LinkedIn experience section, a resume, or any
              career text. The AI splits it into structured events and
              you approve before they save.
            </p>
          </div>
          {!importOpen && (
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="shrink-0 rounded-full bg-karte-accent px-4 py-2 text-[13px] font-semibold text-zinc-950 transition hover:opacity-90"
            >
              Paste text →
            </button>
          )}
        </div>

        {importOpen && (
          <form onSubmit={handleImport} className="mt-5">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Paste here. Example:

Software Engineer · VaultWealth · Feb 2025 - Present
Backend services + AI infra for financial planning.

Senior Engineer · Front.Page · Jan 2022 - Jan 2025
Scaled real-time pipeline from 15k to 200k DAU. Built RAG support agents.`}
              rows={8}
              className="w-full rounded-xl border border-white/[0.10] bg-black/30 px-3 py-3 text-[13.5px] leading-[1.5] text-karte-text outline-none focus:border-karte-accent/40"
              disabled={importing}
            />
            {importError && (
              <p className="mt-2 text-[12.5px] text-rose-300/90" role="alert">
                {importError}
              </p>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setImportOpen(false);
                  setImportText('');
                  setImportError('');
                  setPreview([]);
                }}
                className="rounded-full border border-white/[0.10] px-4 py-2 text-[12.5px] text-karte-text-3 hover:text-karte-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={importing}
                className="rounded-full bg-karte-accent px-5 py-2 text-[13px] font-semibold text-zinc-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importing ? 'Parsing…' : 'Parse events'}
              </button>
            </div>
          </form>
        )}

        {/* Preview list — appears once the parse returns. */}
        {preview.length > 0 && (
          <div className="mt-5 border-t border-karte-accent/20 pt-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
              {preview.length} event{preview.length === 1 ? '' : 's'} found ·
              review before saving
            </p>
            <ul className="mt-3 space-y-2">
              {preview.map((p, idx) => (
                <li
                  key={p.localId}
                  className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3"
                >
                  <input
                    type="checkbox"
                    checked={p.selected}
                    onChange={(e) =>
                      setPreview((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, selected: e.target.checked } : x,
                        ),
                      )
                    }
                    className="mt-1 h-4 w-4 cursor-pointer accent-karte-accent"
                    aria-label={`Include ${p.title}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-karte-text-4">
                      {p.whenLabel}
                      <span className="mx-2 opacity-40">·</span>
                      <span className="text-karte-accent">
                        {TIMELINE_TYPE_LABELS[p.type]}
                      </span>
                    </p>
                    <p className="mt-1 text-[14px] font-semibold leading-tight text-karte-text">
                      {p.title}
                      {p.whereLabel && (
                        <span className="ml-2 text-[12.5px] font-normal text-karte-text-3">
                          @ {p.whereLabel}
                        </span>
                      )}
                    </p>
                    {p.body && (
                      <p className="mt-1 text-[12.5px] leading-[1.5] text-karte-text-3">
                        {p.body}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setPreview((prev) =>
                    prev.map((p) => ({ ...p, selected: !prev.every((x) => x.selected) })),
                  )
                }
                className="text-[12.5px] text-karte-text-3 hover:text-karte-text"
              >
                {preview.every((p) => p.selected) ? 'Unselect all' : 'Select all'}
              </button>
              <button
                type="button"
                onClick={handleCommitImport}
                disabled={committing}
                className="rounded-full bg-karte-accent px-5 py-2 text-[13px] font-semibold text-zinc-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {committing
                  ? 'Adding…'
                  : `Add ${preview.filter((p) => p.selected).length} event${preview.filter((p) => p.selected).length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Manual add form */}
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
          ◆ Add an event
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.18em] text-karte-text-4">
              Type
            </span>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((s) => ({ ...s, type: e.target.value as TimelineEventType }))
              }
              className="rounded-xl border border-white/[0.10] bg-black/30 px-3 py-2 text-[14px] text-karte-text outline-none focus:border-karte-accent/40"
            >
              {TIMELINE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.18em] text-karte-text-4">
              When
            </span>
            <input
              value={form.whenLabel}
              onChange={(e) => setForm((s) => ({ ...s, whenLabel: e.target.value }))}
              placeholder="March 2025"
              className="rounded-xl border border-white/[0.10] bg-black/30 px-3 py-2 text-[14px] text-karte-text outline-none focus:border-karte-accent/40"
            />
          </label>
        </div>

        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.18em] text-karte-text-4">
            Title
          </span>
          <input
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            placeholder="Shipped TinyGPT"
            className="rounded-xl border border-white/[0.10] bg-black/30 px-3 py-2 text-[14px] text-karte-text outline-none focus:border-karte-accent/40"
          />
        </label>

        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.18em] text-karte-text-4">
            Where (optional)
          </span>
          <input
            value={form.whereLabel}
            onChange={(e) => setForm((s) => ({ ...s, whereLabel: e.target.value }))}
            placeholder="VaultWealth · Stanford · Front.Page"
            className="rounded-xl border border-white/[0.10] bg-black/30 px-3 py-2 text-[14px] text-karte-text outline-none focus:border-karte-accent/40"
          />
        </label>

        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.18em] text-karte-text-4">
            Body (optional)
          </span>
          <textarea
            value={form.body}
            onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))}
            placeholder="One or two sentences about what happened."
            rows={2}
            className="rounded-xl border border-white/[0.10] bg-black/30 px-3 py-2 text-[14px] text-karte-text outline-none focus:border-karte-accent/40"
          />
        </label>

        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.18em] text-karte-text-4">
            Link (optional)
          </span>
          <input
            value={form.link}
            onChange={(e) => setForm((s) => ({ ...s, link: e.target.value }))}
            placeholder="https://github.com/sarthak-fleet/tinygpt"
            className="rounded-xl border border-white/[0.10] bg-black/30 px-3 py-2 text-[14px] text-karte-text outline-none focus:border-karte-accent/40"
          />
        </label>

        {error && (
          <p className="mt-3 text-[12px] text-rose-300/90" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-karte-accent px-5 py-2 text-[13px] font-semibold text-zinc-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add event'}
          </button>
        </div>
      </form>

      {/* List */}
      <section>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
          ◆ All events
          <span className="ml-2 text-karte-text-3">
            {loading ? '· loading…' : `· ${events.length}`}
          </span>
        </p>

        {!loading && events.length === 0 && (
          <p className="mt-4 text-[14px] text-karte-text-3">
            No events yet. Add your first one above — try one for each
            company you have worked at.
          </p>
        )}

        <ul className="mt-4 space-y-3">
          {events.map((event) =>
            editingId === event.id ? (
              <EditRow
                key={event.id}
                event={event}
                onCancel={() => setEditingId(null)}
                onSave={(patch) => handleSaveEdit(event.id, patch)}
              />
            ) : (
              <li
                key={event.id}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-karte-text-4">
                    {event.whenLabel}
                    <span className="mx-2 opacity-40">·</span>
                    <span className="text-karte-accent">
                      {TIMELINE_TYPE_LABELS[event.type]}
                    </span>
                    {event.status !== 'published' && (
                      <span className="ml-2 text-amber-300/80">
                        · {event.status}
                      </span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(event.id)}
                      className="text-[11.5px] text-karte-text-3 hover:text-karte-text"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(event.id)}
                      className="text-[11.5px] text-rose-300/80 hover:text-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-1.5 text-[15px] font-semibold leading-tight text-karte-text">
                  {event.title}
                  {event.whereLabel && (
                    <span className="ml-2 text-[13.5px] font-normal text-karte-text-3">
                      @ {event.whereLabel}
                    </span>
                  )}
                </p>
                {event.body && (
                  <p className="mt-1.5 text-[13.5px] leading-[1.55] text-karte-text-3">
                    {event.body}
                  </p>
                )}
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  );
}

function EditRow({
  event,
  onCancel,
  onSave,
}: {
  event: TimelineEvent;
  onCancel: () => void;
  onSave: (patch: Partial<TimelineEvent>) => void;
}) {
  const [draft, setDraft] = useState({
    type: event.type,
    title: event.title,
    whenLabel: event.whenLabel,
    whereLabel: event.whereLabel ?? '',
    body: event.body ?? '',
    link: event.link ?? '',
    status: event.status,
  });

  return (
    <li className="rounded-xl border border-karte-accent/30 bg-karte-accent/[0.04] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={draft.type}
          onChange={(e) =>
            setDraft({ ...draft, type: e.target.value as TimelineEventType })
          }
          className="rounded-xl border border-white/[0.10] bg-black/30 px-3 py-2 text-[13px] text-karte-text"
        >
          {TIMELINE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          value={draft.whenLabel}
          onChange={(e) => setDraft({ ...draft, whenLabel: e.target.value })}
          placeholder="When"
          className="rounded-xl border border-white/[0.10] bg-black/30 px-3 py-2 text-[13px] text-karte-text"
        />
      </div>
      <input
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        placeholder="Title"
        className="mt-3 w-full rounded-xl border border-white/[0.10] bg-black/30 px-3 py-2 text-[13px] text-karte-text"
      />
      <input
        value={draft.whereLabel}
        onChange={(e) => setDraft({ ...draft, whereLabel: e.target.value })}
        placeholder="Where"
        className="mt-3 w-full rounded-xl border border-white/[0.10] bg-black/30 px-3 py-2 text-[13px] text-karte-text"
      />
      <textarea
        value={draft.body}
        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        placeholder="Body"
        rows={2}
        className="mt-3 w-full rounded-xl border border-white/[0.10] bg-black/30 px-3 py-2 text-[13px] text-karte-text"
      />
      <input
        value={draft.link}
        onChange={(e) => setDraft({ ...draft, link: e.target.value })}
        placeholder="Link"
        className="mt-3 w-full rounded-xl border border-white/[0.10] bg-black/30 px-3 py-2 text-[13px] text-karte-text"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <select
          value={draft.status}
          onChange={(e) =>
            setDraft({ ...draft, status: e.target.value as TimelineEventStatus })
          }
          className="rounded-xl border border-white/[0.10] bg-black/30 px-3 py-1.5 text-[12px] text-karte-text-3"
        >
          <option value="published">Published</option>
          <option value="hidden">Hidden (in AI memory only)</option>
        </select>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/[0.10] px-4 py-1.5 text-[12px] text-karte-text-3 hover:text-karte-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="rounded-full bg-karte-accent px-4 py-1.5 text-[12px] font-semibold text-zinc-950 hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </li>
  );
}
