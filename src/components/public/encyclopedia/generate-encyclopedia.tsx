'use client';

import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useState } from 'react';

import { captureActionFailure } from '@/lib/foundry-monitoring';

interface GenerateEncyclopediaProps {
  pageId: string;
  slug: string;
  accentColor: string;
}

export function GenerateEncyclopedia({
  pageId,
  slug,
  accentColor,
}: GenerateEncyclopediaProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/pages/${pageId}/generate/encyclopedia`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: 'Something went wrong' }));
        throw new Error(data.error || 'Failed to generate encyclopedia');
      }

      posthog.capture('profile_mode_generated', {
        mode: 'encyclopedia',
      });

      router.refresh();
    } catch (err) {
      captureActionFailure(err, { action: 'generate_encyclopedia' });
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Try again in a moment.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[64vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-300 bg-white text-gray-950 shadow-[0_24px_80px_-50px_rgba(0,0,0,0.7)]">
          <div className="grid border-b border-gray-200 bg-[#f8f9fa] sm:grid-cols-[1fr_220px]">
            <div className="px-5 py-5 sm:px-7">
              <p className="text-xs uppercase tracking-[0.24em] text-karte-text-4">
                Karte Encyclopedia
              </p>
              <h1 className="mt-2 font-serif text-3xl text-gray-950 sm:text-4xl">
                Assembling the article
              </h1>
            </div>
            <div className="border-t border-gray-200 px-5 py-5 sm:border-l sm:border-t-0">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full w-2/3 animate-pulse rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-karte-text-4">
                Checking sources
              </p>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:grid-cols-[1fr_220px] sm:p-7">
            <div>
              <div className="h-7 w-8/12 animate-pulse rounded bg-gray-300" />
              <div className="mt-5 space-y-3">
                <div className="h-3 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-11/12 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-9/12 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {['Summary', 'Work', 'Projects', 'Context'].map((label) => (
                  <div
                    key={label}
                    className="rounded-lg border border-gray-200 bg-[#f8f9fa] p-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-karte-text-4">
                      {label}
                    </p>
                    <div className="mt-3 h-2 animate-pulse rounded bg-gray-300" />
                    <div className="mt-2 h-2 w-2/3 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-[#f8f9fa] p-4">
              <div className="h-24 animate-pulse rounded-lg bg-gray-200" />
              <div className="mt-4 space-y-2">
                <div className="h-2 rounded-full bg-gray-300" />
                <div className="h-2 w-10/12 rounded-full bg-gray-300" />
                <div className="h-2 w-7/12 rounded-full bg-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[64vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-[0_24px_80px_-50px_rgba(0,0,0,0.7)]">
        <div className="border-b border-gray-200 bg-[#f8f9fa] px-5 py-4 sm:px-7">
          <p className="text-xs uppercase tracking-[0.24em] text-karte-text-4">
            Karte Encyclopedia
          </p>
          <h1 className="mt-2 font-serif text-3xl text-gray-950">
            {slug}&apos;s article is not published yet
          </h1>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-[1fr_220px] sm:p-7">
          <div>
            <p className="text-sm leading-6 text-karte-text-4">
              Generate a reference-style profile page with summary, background,
              projects, and source-backed context.
            </p>

            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-950 bg-karte-bg px-5 py-3 text-sm font-semibold text-karte-text transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Drafting article
                </>
              ) : (
                'Generate encyclopedia'
              )}
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-[#f8f9fa] p-4">
            <div className="h-3 w-28 rounded-full bg-karte-bg/70" />
            <div className="mt-5 space-y-2">
              <div
                className={`h-2 rounded-full bg-gray-300 ${loading ? 'animate-pulse' : ''}`}
              />
              <div
                className={`h-2 w-10/12 rounded-full bg-gray-300 ${loading ? 'animate-pulse' : ''}`}
              />
              <div
                className={`h-2 w-8/12 rounded-full bg-gray-300 ${loading ? 'animate-pulse' : ''}`}
              />
            </div>
            <div
              className={`mt-5 h-20 rounded-lg border border-gray-200 bg-white ${loading ? 'animate-pulse' : ''}`}
              style={{ boxShadow: `inset 4px 0 0 ${accentColor}` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
