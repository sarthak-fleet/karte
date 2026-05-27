'use client';

import { useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'karte_pending_onboarding';

interface OnboardingLink {
  title: string;
  url: string;
  body?: string;
}
interface OnboardingProject {
  title: string;
  url: string;
  description: string;
  imageUrl?: string;
}
interface OnboardingState {
  displayName?: string;
  bio?: string;
  slug?: string;
  location?: string;
  calendarUrl?: string;
  newsletterUrl?: string;
  tipUrl?: string;
  videoUrl?: string;
  links?: OnboardingLink[];
  projects?: OnboardingProject[];
}

type Status = 'idle' | 'creating' | 'success' | 'error';

function slugifyName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  return base || 'me';
}

function readPending(): OnboardingState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: OnboardingState };
    if (!parsed?.state || typeof parsed.state !== 'object') return null;
    return parsed.state;
  } catch {
    return null;
  }
}

function clearPending() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Picks up the OnboardingChat handoff and offers a single click to
 * create the page on Karte. Renders only when `?onboarded=1` is on
 * the URL and there's a valid payload in localStorage.
 */
export function PendingOnboardingBanner() {
  const searchParams = useSearchParams();
  const flag = searchParams.get('onboarded') === '1';
  const [pending, setPending] = useState<OnboardingState | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!flag) return;
    setPending(readPending());
  }, [flag]);

  if (!flag || !pending) return null;

  async function handleCreate() {
    if (!pending || status === 'creating') return;
    setStatus('creating');
    setMessage('');
    try {
      const displayName = pending.displayName?.trim() || 'Your name';
      const slug = (pending.slug || slugifyName(displayName)).trim();

      const pageRes = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          displayName,
          bio: pending.bio ?? null,
          location: pending.location ?? null,
          calendarUrl: pending.calendarUrl ?? null,
          newsletterUrl: pending.newsletterUrl ?? null,
          tipUrl: pending.tipUrl ?? null,
          videoUrl: pending.videoUrl ?? null,
        }),
      });

      const pageData = (await pageRes.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
      };

      if (!pageRes.ok || !pageData.id) {
        throw new Error(
          pageData.error || `Page creation failed (${pageRes.status})`,
        );
      }

      const pageId = pageData.id;
      const addedCounts = { links: 0, projects: 0 };

      // Add links one at a time. The endpoint sorts by createdAt order
      // we POST, so iterating preserves user intent.
      if (pending.links?.length) {
        for (const link of pending.links) {
          try {
            const linkRes = await fetch(`/api/pages/${pageId}/links`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: link.title,
                url: link.url,
                body: link.body ?? null,
              }),
            });
            if (linkRes.ok) addedCounts.links++;
          } catch {
            // Skip individual failures — finish what we can.
          }
        }
      }

      if (pending.projects?.length) {
        for (const project of pending.projects) {
          try {
            const projRes = await fetch(`/api/pages/${pageId}/projects`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: project.title,
                url: project.url,
                description: project.description,
                imageUrl: project.imageUrl ?? null,
              }),
            });
            if (projRes.ok) addedCounts.projects++;
          } catch {
            // skip
          }
        }
      }

      setStatus('success');
      setMessage(
        `Page live at karte.cc/${slug}. Added ${addedCounts.links} link${addedCounts.links === 1 ? '' : 's'} and ${addedCounts.projects} project${addedCounts.projects === 1 ? '' : 's'}.`,
      );
      try {
        posthog.capture('onboarding_funnel_completed', {
          slug,
          linkCount: addedCounts.links,
          projectCount: addedCounts.projects,
        });
      } catch {
        // ignore
      }
      clearPending();
    } catch (err) {
      setStatus('error');
      setMessage(
        err instanceof Error
          ? err.message
          : 'Could not create your page. Try again from the form below.',
      );
    }
  }

  function handleDismiss() {
    clearPending();
    setPending(null);
  }

  return (
    <section
      className="mb-6 rounded-2xl border border-karte-accent/30 bg-karte-accent/[0.06] p-5"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-accent-soft">
            · From the onboarding chat
          </p>
          <p className="mt-2 text-sm text-karte-text">
            We&apos;ve got{' '}
            <strong className="font-semibold text-karte-text">
              {pending.displayName ?? 'your draft'}
            </strong>{' '}
            ready to publish. One click to create the page.
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
              onClick={handleCreate}
              disabled={status === 'creating'}
              className="inline-flex items-center justify-center rounded-full bg-karte-accent px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-karte-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'creating' ? 'Creating…' : 'Create my page'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full px-4 py-2 text-sm text-karte-text-3 transition hover:text-karte-text"
          >
            Done
          </button>
        )}
      </div>
    </section>
  );
}
