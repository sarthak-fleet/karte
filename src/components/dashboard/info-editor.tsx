'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type InfoBlock = {
  id: string;
  pageId: string;
  type: string;
  title: string | null;
  content: string;
  sortOrder: number | null;
};

const BLOCK_TYPES = [
  { value: 'text', label: 'About / Bio' },
  { value: 'resume', label: 'Resume / Experience' },
  { value: 'faq', label: 'FAQ' },
  { value: 'current', label: 'Current Focus' },
  { value: 'voice', label: 'Voice / Style' },
  { value: 'boundaries', label: 'Boundaries' },
];

function typeBadgeColor(type: string) {
  switch (type) {
    case 'text':
      return 'bg-blue-500/20 text-blue-300';
    case 'resume':
      return 'bg-green-500/20 text-green-300';
    case 'faq':
      return 'bg-purple-500/20 text-purple-300';
    case 'current':
      return 'bg-cyan-500/20 text-cyan-300';
    case 'voice':
      return 'bg-amber-500/20 text-amber-300';
    case 'boundaries':
      return 'bg-rose-500/20 text-rose-300';
    default:
      return 'bg-gray-500/20 text-gray-300';
  }
}

function typeLabel(type: string) {
  return BLOCK_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function InfoEditor({
  pageId,
  initialBlocks,
}: {
  pageId: string;
  initialBlocks: InfoBlock[];
}) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<InfoBlock[]>(initialBlocks);
  const [type, setType] = useState('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function addBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/pages/${pageId}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        title: title.trim() || undefined,
        content: content.trim(),
      }),
    });

    if (res.ok) {
      const block = await res.json();
      setBlocks((prev) => [...prev, block]);
      setTitle('');
      setContent('');
      router.refresh();
    }

    setLoading(false);
  }

  async function removeBlock(blockId: string) {
    const res = await fetch(`/api/pages/${pageId}/info/${blockId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Existing blocks */}
      {blocks.length > 0 && (
        <div className="space-y-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
            >
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeColor(block.type)}`}
                  >
                    {typeLabel(block.type)}
                  </span>
                  {block.title && (
                    <span className="text-sm font-medium text-white">
                      {block.title}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeBlock(block.id)}
                  className="rounded-lg px-3 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
                >
                  Remove
                </button>
              </div>
              <p className="line-clamp-3 text-sm text-gray-400">
                {block.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <form
        onSubmit={addBlock}
        className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
      >
        <h3 className="text-sm font-semibold text-white">
          Add Profile Memory
        </h3>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          >
            {BLOCK_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-gray-900">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Work Experience"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-white/30"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add source-backed details the chat and profile modes can use..."
            rows={5}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-white/30"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </form>
    </div>
  );
}
