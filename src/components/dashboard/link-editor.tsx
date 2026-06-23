'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import posthog from 'posthog-js';
import { useState } from 'react';

import { DragHandle } from '@/components/dashboard/drag-handle';

interface Link {
  id: string;
  pageId: string;
  title: string;
  url: string;
  icon: string | null;
  imageUrl: string | null;
  body: string | null;
  sortOrder: number | null;
  enabled: boolean | null;
}

type ImportedLink = {
  title: string;
  url: string;
};

function LinkCard({
  link,
  index,
  onRemove,
  onSave,
  isOverlay,
}: {
  link: Link;
  index: number;
  onRemove: (id: string) => void;
  onSave: (id: string, patch: Partial<Link>) => Promise<void>;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(link.title);
  const [editUrl, setEditUrl] = useState(link.url);
  const [editImage, setEditImage] = useState(link.imageUrl ?? '');
  const [editBody, setEditBody] = useState(link.body ?? '');
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setEditTitle(link.title);
    setEditUrl(link.url);
    setEditImage(link.imageUrl ?? '');
    setEditBody(link.body ?? '');
    setEditing(true);
  }

  async function saveEdit() {
    if (!editTitle.trim() || !editUrl.trim()) return;
    setSaving(true);
    try {
      await onSave(link.id, {
        title: editTitle.trim(),
        url: editUrl.trim(),
        imageUrl: editImage.trim() || null,
        body: editBody.trim() || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (isOverlay) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-white/30 bg-karte-bg/90 p-4  backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="text-white/60 cursor-grabbing">
            <DragHandle />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-karte-border-strong bg-white/5 px-2 py-0.5 text-[11px] font-medium text-karte-text-2">
                #{index + 1}
              </span>
              <p className="truncate font-medium text-karte-text">
                {link.title}
              </p>
            </div>
            <p className="truncate text-sm text-karte-text-3">{link.url}</p>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <button
            type="button"
            className="flex-1 rounded-lg border border-karte-border-emphasis px-3 py-1.5 text-sm text-red-400 transition sm:flex-none"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-karte-accent/30"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] font-medium text-karte-text-3">
            #{index + 1}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-karte-accent-soft">
            editing
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title"
            className="rounded-xl bg-white/[0.045] px-3.5 py-2 text-sm text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35"
          />
          <input
            type="url"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="https://example.com"
            className="rounded-xl bg-white/[0.045] px-3.5 py-2 text-sm text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35"
          />
          <input
            type="url"
            value={editImage}
            onChange={(e) => setEditImage(e.target.value)}
            placeholder="Image URL (optional)"
            className="rounded-xl bg-white/[0.045] px-3.5 py-2 text-sm text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35"
          />
          <input
            type="text"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            placeholder="One-line description (optional)"
            className="rounded-xl bg-white/[0.045] px-3.5 py-2 text-sm text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={saveEdit}
            disabled={saving || !editTitle.trim() || !editUrl.trim()}
            className="rounded-full bg-karte-accent px-4 py-1.5 text-[12px] font-semibold text-zinc-950 transition hover:bg-karte-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="rounded-full px-4 py-1.5 text-[12px] font-medium text-karte-text-3 transition-colors duration-150 hover:bg-white/[0.05] hover:text-karte-text disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-4 rounded-2xl bg-white/[0.025] p-4 transition-colors duration-200 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          className="text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <DragHandle />
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] font-medium text-karte-text-3">
              #{index + 1}
            </span>
            <p className="truncate font-medium text-karte-text">{link.title}</p>
          </div>
          <p className="truncate text-sm text-karte-text-3">{link.url}</p>
        </div>
      </div>
      <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
        <button
          type="button"
          onClick={startEdit}
          className="rounded-full px-3 py-1.5 text-[12px] font-medium text-karte-text-2 transition-colors duration-150 hover:bg-white/[0.05] hover:text-karte-text"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onRemove(link.id)}
          className="rounded-full px-3 py-1.5 text-[12px] font-medium text-karte-text-3 transition-colors duration-150 hover:bg-red-500/10 hover:text-red-300"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export function LinkEditor({
  pageId,
  initialLinks,
}: {
  pageId: string;
  initialLinks: Link[];
}) {
  const [links, setLinks] = useState<Link[]>(
    [...initialLinks].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
  );
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importedLinks, setImportedLinks] = useState<ImportedLink[]>([]);
  const [selectedImportUrls, setSelectedImportUrls] = useState<Set<string>>(
    new Set(),
  );
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeLink = activeId
    ? (links.find((l) => l.id === activeId) ?? null)
    : null;
  const activeIndex = activeId ? links.findIndex((l) => l.id === activeId) : -1;

  function normalizeLinks(items: Link[]) {
    return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async function persistOrder(nextLinks: Link[]) {
    const response = await fetch(`/api/pages/${pageId}/links`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderedLinkIds: nextLinks.map((link) => link.id),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to reorder links');
    }

    const updatedLinks = await response.json();
    setLinks(updatedLinks);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const previousLinks = [...links];
    const nextLinks = arrayMove(links, oldIndex, newIndex);
    setLinks(nextLinks);

    try {
      await persistOrder(nextLinks);
    } catch {
      setLinks(previousLinks);
      alert('Failed to reorder links');
    }
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          url,
          imageUrl: imageUrl.trim() || undefined,
          body: bodyText.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to add link');

      const newLink = await res.json();
      setLinks((prev) => normalizeLinks([...prev, newLink]));
      setTitle('');
      setUrl('');
      setImageUrl('');
      setBodyText('');
      setShowOptional(false);
    } catch {
      alert('Failed to add link');
    } finally {
      setLoading(false);
    }
  }

  async function removeLink(linkId: string) {
    try {
      const res = await fetch(`/api/pages/${pageId}/links/${linkId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete link');

      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch {
      alert('Failed to remove link');
    }
  }

  async function saveLink(linkId: string, patch: Partial<Link>) {
    const res = await fetch(`/api/pages/${pageId}/links/${linkId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to save link');
    }
    const updated = await res.json();
    setLinks((prev) =>
      prev.map((l) => (l.id === linkId ? { ...l, ...updated } : l)),
    );
  }

  async function previewImport(e: React.FormEvent) {
    e.preventDefault();
    if (!importUrl.trim()) return;

    setImportLoading(true);
    setImportMessage('');
    setImportedLinks([]);
    setSelectedImportUrls(new Set());

    try {
      const res = await fetch(`/api/pages/${pageId}/links/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'preview', sourceUrl: importUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to preview import');
      }

      posthog.capture('linktree_import_preview', {
        linkCount: Array.isArray(data.links) ? data.links.length : 0,
      });

      const nextLinks = Array.isArray(data.links)
        ? (data.links as ImportedLink[])
        : [];
      setImportedLinks(nextLinks);
      setSelectedImportUrls(new Set(nextLinks.map((item) => item.url)));
      setImportMessage(
        nextLinks.length
          ? `Found ${nextLinks.length} links. Review before importing.`
          : 'No importable links found on that page.',
      );
    } catch (error) {
      setImportMessage(
        error instanceof Error ? error.message : 'Failed to preview import',
      );
    } finally {
      setImportLoading(false);
    }
  }

  async function importSelectedLinks() {
    const selected = importedLinks.filter((item) =>
      selectedImportUrls.has(item.url),
    );
    if (selected.length === 0) {
      setImportMessage('Select at least one link to import.');
      return;
    }

    setImportLoading(true);
    setImportMessage('');

    try {
      const res = await fetch(`/api/pages/${pageId}/links/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'import', links: selected }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to import selected links');
      }

      posthog.capture('linktree_import_complete', {
        linkCount: Array.isArray(data.imported) ? data.imported.length : 0,
      });

      const inserted = Array.isArray(data.imported)
        ? (data.imported as Link[])
        : [];
      setLinks((prev) => normalizeLinks([...prev, ...inserted]));
      setImportedLinks([]);
      setSelectedImportUrls(new Set());
      setImportMessage(
        `Imported ${inserted.length} links${data.skipped ? `, skipped ${data.skipped} duplicates` : ''}.`,
      );
    } catch (error) {
      setImportMessage(
        error instanceof Error
          ? error.message
          : 'Failed to import selected links',
      );
    } finally {
      setImportLoading(false);
    }
  }

  function toggleImportUrl(url: string) {
    setSelectedImportUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white/[0.02] p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-cyan-200">
              Import
            </p>
            <h2 className="mt-2 text-lg font-semibold text-karte-text">
              Bring links from Linktree or another profile
            </h2>
          </div>
          <p className="text-xs text-karte-text-4">
            Preview first, then choose what to import.
          </p>
        </div>

        <form
          onSubmit={previewImport}
          className="mt-5 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="url"
            placeholder="https://linktr.ee/yourname"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-karte-border-emphasis bg-black/20 px-4 py-2 text-sm text-karte-text placeholder-gray-500 outline-none focus:border-white/40"
          />
          <button
            type="submit"
            disabled={importLoading}
            className="w-full rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15 disabled:opacity-50 sm:w-auto"
          >
            {importLoading ? 'Checking...' : 'Preview Import'}
          </button>
        </form>

        {importMessage && (
          <p className="mt-3 text-sm text-karte-text-2">{importMessage}</p>
        )}

        {importedLinks.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {importedLinks.map((item) => (
                <label
                  key={item.url}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-karte-border-strong bg-black/20 p-3 transition hover:bg-white/[0.04]"
                >
                  <input
                    type="checkbox"
                    checked={selectedImportUrls.has(item.url)}
                    onChange={() => toggleImportUrl(item.url)}
                    className="mt-1 h-4 w-4 accent-cyan-300"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-karte-text">
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-karte-text-4">
                      {item.url}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={importSelectedLinks}
              disabled={importLoading || selectedImportUrls.size === 0}
              className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-gray-950 transition hover:bg-gray-100 disabled:opacity-50"
            >
              Import {selectedImportUrls.size} Selected
            </button>
          </div>
        )}
      </section>

      <form onSubmit={addLink} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 rounded-lg bg-white/[0.045] px-4 py-2 text-sm text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 ease-[var(--karte-ease)] hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35"
            required
          />
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-lg bg-white/[0.045] px-4 py-2 text-sm text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 ease-[var(--karte-ease)] hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-6 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>

        {!showOptional ? (
          <button
            type="button"
            onClick={() => setShowOptional(true)}
            className="text-[12px] font-medium text-karte-text-3 transition-colors duration-150 hover:text-karte-text"
          >
            + Add image / description
          </button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="url"
              placeholder="Image URL (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="rounded-lg bg-white/[0.045] px-4 py-2 text-sm text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 ease-[var(--karte-ease)] hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35"
            />
            <input
              type="text"
              placeholder="One-line description (optional)"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="rounded-lg bg-white/[0.045] px-4 py-2 text-sm text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 ease-[var(--karte-ease)] hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35"
            />
          </div>
        )}
      </form>

      <hr className="border-karte-border" />

      {/* Links list */}
      {links.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.02] p-8 text-center">
          <p className="text-karte-text-3">
            No links yet. Add your first link above.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={links.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {links.map((link, index) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  index={index}
                  onRemove={removeLink}
                  onSave={saveLink}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeLink ? (
              <LinkCard
                link={activeLink}
                index={activeIndex}
                onRemove={() => {}}
                onSave={async () => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
