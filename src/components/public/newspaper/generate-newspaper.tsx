'use client';

import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useState } from 'react';

import { captureActionFailure } from '@/lib/foundry-monitoring';

interface GenerateNewspaperProps {
  pageId: string;
  slug: string;
  accentColor: string;
}

export function GenerateNewspaper({ pageId, slug, accentColor }: GenerateNewspaperProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/pages/${pageId}/generate/newspaper`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(data.error || 'Failed to generate newspaper');
      }

      posthog.capture('profile_mode_generated', {
        mode: 'newspaper',
      });

      router.refresh();
    } catch (err) {
      captureActionFailure(err, { action: 'generate_newspaper' });
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Try again in a moment.',
      );
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-3xl border border-[#1c1a14]/30 bg-[#f7f0df] p-5 text-[#17130d] shadow-[0_28px_90px_-55px_rgba(0,0,0,0.75)] sm:p-8">
        <style jsx>{`
          @keyframes karte-news-flip {
            0% {
              transform: perspective(820px) rotateY(0deg) translateX(0);
              opacity: 0.3;
            }
            18% {
              opacity: 1;
            }
            52% {
              transform: perspective(820px) rotateY(-178deg) translateX(-12px);
              opacity: 0.92;
            }
            100% {
              transform: perspective(820px) rotateY(-178deg) translateX(-12px);
              opacity: 0;
            }
          }

          @keyframes karte-ink-pass {
            0% {
              transform: translateX(-110%);
            }
            100% {
              transform: translateX(110%);
            }
          }

          .news-flip-sheet {
            animation: karte-news-flip 1.85s ease-in-out infinite;
            backface-visibility: hidden;
            transform-origin: left center;
          }

          .news-flip-sheet:nth-child(2) {
            animation-delay: 0.38s;
          }

          .news-flip-sheet:nth-child(3) {
            animation-delay: 0.76s;
          }

          .ink-pass::after {
            animation: karte-ink-pass 1.45s ease-in-out infinite;
          }
        `}</style>
        <div className="border-b-2 border-[#17130d] pb-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em]">Special Edition</p>
          <h2 className="mt-2 font-serif text-4xl font-black leading-none sm:text-5xl">
            The Profile Times
          </h2>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-[#17130d]/55">
            Sending the front page to press
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_250px]">
          <div>
            <div className="relative h-40 overflow-hidden border-y-2 border-[#17130d] bg-[#efe2c4] p-4 shadow-[inset_0_0_0_1px_rgba(23,19,13,0.08)]">
              <div className="absolute inset-x-4 top-4 border-b border-[#17130d]/35 pb-2 text-center font-serif text-2xl font-black">
                The Profile Times
              </div>
              <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="space-y-1.5">
                    <div className="h-2 bg-[#17130d]/75" />
                    <div className="h-1.5 bg-[#17130d]/25" />
                    <div className="h-1.5 w-3/4 bg-[#17130d]/25" />
                  </div>
                ))}
              </div>

              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="news-flip-sheet absolute inset-y-0 left-0 w-[54%] border-r border-[#17130d]/25 bg-[#f7f0df] shadow-[12px_0_28px_rgba(23,19,13,0.18)]"
                >
                  <div className="h-full p-4">
                    <div className="h-3 w-24 bg-[#17130d]/75" />
                    <div className="mt-4 space-y-2">
                      <div className="h-2 bg-[#17130d]/28" />
                      <div className="h-2 w-10/12 bg-[#17130d]/22" />
                      <div className="h-2 w-8/12 bg-[#17130d]/22" />
                    </div>
                    <div className="mt-5 h-12 border border-[#17130d]/15 bg-[#17130d]/8" />
                  </div>
                </div>
              ))}
            </div>

            <div className="ink-pass relative mt-5 h-10 w-11/12 overflow-hidden bg-[#17130d]/80 after:absolute after:inset-y-0 after:w-1/3 after:bg-[#f7f0df]/28" />
            <div className="ink-pass relative mt-3 h-10 w-8/12 overflow-hidden bg-[#17130d]/70 after:absolute after:inset-y-0 after:w-1/3 after:bg-[#f7f0df]/25" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="border-t border-[#17130d]/30 pt-3">
                  <div className="h-3 w-2/3 animate-pulse bg-[#17130d]/65" />
                  <div className="mt-3 space-y-2">
                    <div className="h-2 animate-pulse bg-[#17130d]/25" />
                    <div className="h-2 w-11/12 animate-pulse bg-[#17130d]/25" />
                    <div className="h-2 w-8/12 animate-pulse bg-[#17130d]/25" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-l border-[#17130d]/20 pl-4">
            <div
              className="h-32 animate-pulse border border-[#17130d]/20 bg-[#17130d]/10"
              style={{ boxShadow: `inset 0 -5px 0 ${accentColor}` }}
            />
            <div className="mt-5 space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#17130d]/55">
                Writing headlines
              </p>
              <div className="h-2 overflow-hidden bg-[#17130d]/15">
                <div className="h-full w-2/3 animate-pulse bg-[#17130d]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl border border-[#1c1a14]/30 bg-[#f7f0df] p-5 text-[#17130d] shadow-[0_28px_90px_-55px_rgba(0,0,0,0.75)] sm:p-8">
      <div className="border-b-2 border-[#17130d] pb-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em]">Special Edition</p>
        <h2 className="mt-2 font-serif text-4xl font-black leading-none sm:text-5xl">
          The Profile Times
        </h2>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_220px]">
        <div>
          <h3 className="font-serif text-2xl font-bold">
            Your front page has not gone to press
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#17130d]/70">
            Generate a newspaper-style profile with headlines, columns, and a
            shareable editorial angle.
          </p>

          {error && (
            <p className="mt-5 border border-red-900/30 bg-red-100 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-[#17130d] px-6 py-3 text-sm font-bold text-[#f7f0df] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending to press
              </>
            ) : (
              'Print front page'
            )}
          </button>
        </div>

        <div className="border-l border-[#17130d]/20 pl-4">
          <div className="h-4 w-32 bg-[#17130d]/80" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
                <div className={`h-2 bg-[#17130d]/60 ${loading ? 'animate-pulse' : ''}`} />
                <div className={`h-1.5 bg-[#17130d]/25 ${loading ? 'animate-pulse' : ''}`} />
                <div className={`h-1.5 w-3/4 bg-[#17130d]/25 ${loading ? 'animate-pulse' : ''}`} />
              </div>
            ))}
          </div>
          <div
            className={`mt-5 h-20 border border-[#17130d]/20 bg-[#17130d]/10 ${loading ? 'animate-pulse' : ''}`}
            style={{ boxShadow: `inset 0 -4px 0 ${accentColor}` }}
          />
        </div>
      </div>
    </div>
  );
}
