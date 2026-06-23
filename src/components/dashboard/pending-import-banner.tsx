'use client';

import { useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';

import { hostnameFromUrl } from '@/lib/hostname';

const PENDING_IMPORT_STORAGE_KEY = 'karte_pending_import';

interface PendingImportLink {
  title: string;
  url: string;
}

interface PendingImportPayload {
  sourceUrl: string;
  links: PendingImportLink[];
  importedAt: string;
}

type Status = 'idle' | 'importing' | 'success' | 'error';

function readPendingImport(): PendingImportPayload | null {
  try {
    const raw = window.localStorage.getItem(PENDING_IMPORT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingImportPayload>;
    if (
      !parsed ||
      typeof parsed.sourceUrl !== 'string' ||
      !Array.isArray(parsed.links) ||
      typeof parsed.importedAt !== 'string'
    ) {
      return null;
    }
    const cleanLinks = parsed.links.filter(
      (item): item is PendingImportLink =>
        !!item &&
        typeof (item as PendingImportLink).title === 'string' &&
        typeof (item as PendingImportLink).url === 'string',
    );
    if (cleanLinks.length === 0) return null;
    return {
      sourceUrl: parsed.sourceUrl,
      links: cleanLinks,
      importedAt: parsed.importedAt,
    };
  } catch {
    return null;
  }
}

function clearPendingImport() {
  try {
    window.localStorage.removeItem(PENDING_IMPORT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Banner shown on /dashboard/appearance after a visitor signed up from
 * /create with an in-flight import. Reads `karte_pending_import` from
 * localStorage and offers a one-click bulk import to the user's page.
 *
 * Renders nothing unless `?imported=1` is in the URL and localStorage has
 * a valid payload.
 */
export function PendingImportBanner() {
  const searchParams = useSearchParams();
  const importedFlag = searchParams.get('imported') === '1';

  const [pending, setPending] = useState<PendingImportPayload | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    if (!importedFlag) return;
    const payload = readPendingImport();
    if (payload) {
      setPending(payload);
    }
  }, [importedFlag]);

  if (!importedFlag || !pending) return null;

  async function handleImport() {
    if (!pending || status === 'importing') return;

    setStatus('importing');
    setMessage('');

    try {
      const pagesRes = await fetch('/api/pages');
      if (!pagesRes.ok) {
        throw new Error(
          'We couldn’t find your Karte page yet. Save your profile first.',
        );
      }
      const pagesData = (await pagesRes.json()) as Array<{ id: string }>;
      const pageId = Array.isArray(pagesData) ? pagesData[0]?.id : undefined;

      if (!pageId) {
        setStatus('error');
        setMessage(
          'Save your profile first — then come back to import your links.',
        );
        return;
      }

      const res = await fetch(`/api/pages/${pageId}/links/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'import', links: pending.links }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        imported?: unknown[];
        skipped?: number;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Failed to import links');
      }

      const count = Array.isArray(data.imported) ? data.imported.length : 0;
      setImportedCount(count);
      setStatus('success');
      setMessage(
        count > 0
          ? `Imported ${count} link${count === 1 ? '' : 's'}${
              data.skipped
                ? ` (skipped ${data.skipped} duplicate${data.skipped === 1 ? '' : 's'})`
                : ''
            }. Refresh the Links tab to see them.`
          : 'These links were already on your page — nothing to add.',
      );

      try {
        posthog.capture('import_funnel_completed', {
          sourceHost: hostnameFromUrl(pending.sourceUrl, pending.sourceUrl),
          linkCount: count,
        });
      } catch {
        // ignore
      }

      clearPendingImport();
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong importing your links.',
      );
    }
  }

  function handleDismiss() {
    clearPendingImport();
    setPending(null);
  }

  const sourceHost = hostnameFromUrl(pending.sourceUrl, pending.sourceUrl);

  return (
    <section
      className="mb-6 rounded-2xl border border-karte-accent/30 bg-karte-accent/[0.06] p-5"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-accent-soft">
            · Carry-over
          </p>
          <p className="mt-2 text-sm text-karte-text">
            We saved{' '}
            <strong className="font-semibold text-karte-text">
              {pending.links.length} link{pending.links.length === 1 ? '' : 's'}
            </strong>{' '}
            from{' '}
            <span className="font-medium text-karte-text">{sourceHost}</span>.
            Import them to your new Karte page now?
          </p>
          {message ? (
            <p
              className={`mt-2 text-xs ${
                status === 'error' ? 'text-rose-300/90' : 'text-karte-text-3'
              }`}
            >
              {message}
            </p>
          ) : null}
        </div>

        {status !== 'success' ? (
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full px-4 py-2 text-sm text-karte-text-3 transition hover:text-karte-text"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={status === 'importing'}
              className="inline-flex items-center justify-center rounded-full bg-karte-accent px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-karte-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'importing'
                ? 'Importing…'
                : `Import ${pending.links.length} link${pending.links.length === 1 ? '' : 's'}`}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full px-4 py-2 text-sm text-karte-text-3 transition hover:text-karte-text"
          >
            {importedCount > 0 ? 'Done' : 'Dismiss'}
          </button>
        )}
      </div>
    </section>
  );
}
