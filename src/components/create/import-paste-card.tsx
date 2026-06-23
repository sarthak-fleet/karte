'use client';

import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useState } from 'react';

import {
  type ImportedLinkItem,
  ImportedLinkPreview,
} from '@/components/create/imported-link-preview';
import { hostnameFromUrl } from '@/lib/hostname';

const PENDING_IMPORT_STORAGE_KEY = 'karte_pending_import';

interface PendingImportPayload {
  sourceUrl: string;
  links: ImportedLinkItem[];
  importedAt: string;
}

function isLikelyUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

function normalizeSubmittedUrl(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function ImportPasteCard() {
  const router = useRouter();
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [importedLinks, setImportedLinks] = useState<ImportedLinkItem[]>([]);
  const [normalizedSource, setNormalizedSource] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setErrorMessage('');
    setImportedLinks([]);
    setNormalizedSource(null);

    if (!isLikelyUrl(sourceUrl)) {
      setErrorMessage('Enter a valid URL — e.g. https://linktr.ee/yourname.');
      return;
    }

    const normalized = normalizeSubmittedUrl(sourceUrl);

    try {
      posthog.capture('import_preview_submitted', {
        sourceHost: hostnameFromUrl(normalized),
      });
    } catch {
      // Never break a user flow on analytics.
    }

    setLoading(true);
    try {
      const res = await fetch('/api/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: normalized }),
      });

      let data: { links?: ImportedLinkItem[]; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // ignore — handled below
      }

      if (res.status === 429) {
        setErrorMessage('Too many tries — wait a minute and retry.');
        return;
      }

      if (!res.ok) {
        setErrorMessage(
          data.error ||
            (res.status >= 500
              ? 'We couldn’t reach that page. Try a different URL.'
              : 'That URL didn’t look importable. Try a Linktree, Beacons, Bio.link or Carrd link.'),
        );
        return;
      }

      const nextLinks = Array.isArray(data.links)
        ? data.links.filter(
            (item): item is ImportedLinkItem =>
              !!item &&
              typeof item.title === 'string' &&
              typeof item.url === 'string',
          )
        : [];

      if (nextLinks.length === 0) {
        setErrorMessage(
          'We didn’t find any links on that page. Try a Linktree, Beacons, Bio.link or Carrd URL.',
        );
        return;
      }

      setImportedLinks(nextLinks);
      setNormalizedSource(normalized);

      try {
        posthog.capture('import_preview_rendered', {
          sourceHost: hostnameFromUrl(normalized),
          linkCount: nextLinks.length,
        });
      } catch {
        // ignore
      }
    } catch {
      setErrorMessage(
        'Couldn’t reach the import service. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClaim() {
    if (importedLinks.length === 0 || !normalizedSource) return;

    const payload: PendingImportPayload = {
      sourceUrl: normalizedSource,
      links: importedLinks,
      importedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(
        PENDING_IMPORT_STORAGE_KEY,
        JSON.stringify(payload),
      );
    } catch {
      // localStorage may be blocked; the funnel still works without carry-over.
    }

    try {
      posthog.capture('import_funnel_signup_clicked', {
        sourceHost: hostnameFromUrl(normalizedSource),
        linkCount: importedLinks.length,
      });
    } catch {
      // ignore
    }

    router.push('/login?next=/welcome');
  }

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span className="text-karte-accent/80">·</span> Fast lane
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.02em] text-karte-text sm:text-3xl">
            Already have a link page?{' '}
            <span
              className="font-normal italic text-karte-accent-soft"
              style={{ fontFamily: 'var(--font-instrument-serif), serif' }}
            >
              Import it in 3 seconds.
            </span>
          </h2>
          <p className="mt-3 max-w-xl text-[14px] leading-[1.6] text-karte-text-3">
            Paste your Linktree, Beacons, Bio.link or Carrd URL. We&apos;ll pull
            your links and show you exactly how they&apos;ll look on Karte.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://linktr.ee/yourname"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-white/[0.10] bg-black/30 px-4 py-3 text-[15px] text-karte-text placeholder-karte-text-4 outline-none transition focus:border-karte-accent/40 focus:bg-black/40"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-karte-accent px-5 py-3 text-[15px] font-semibold text-zinc-950 transition hover:bg-karte-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Importing…' : 'Import & Preview'}
        </button>
      </form>

      {errorMessage ? (
        <p className="mt-4 text-sm text-rose-300/90" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {importedLinks.length > 0 ? (
        <div className="mt-8 space-y-6">
          <ImportedLinkPreview
            links={importedLinks}
            sourceUrl={normalizedSource}
          />

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-karte-text-3">
              Looks good? Sign in to claim your Karte page and bring these links
              along.
            </p>
            <button
              type="button"
              onClick={handleClaim}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-medium text-zinc-950 transition-all duration-200 ease-[var(--karte-ease)] hover:bg-zinc-100 sm:w-auto"
            >
              Claim your Karte page
              <span className="transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5">
                →
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
