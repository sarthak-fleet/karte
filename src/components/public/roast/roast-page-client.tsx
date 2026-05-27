'use client';

import posthog from 'posthog-js';
import { useCallback,useRef, useState } from 'react';

import { captureActionFailure } from '@/lib/foundry-monitoring';
import type { RoastContent } from '@/lib/generated-page-types';

import { RoastScoreCard } from './roast-score-card';
import { RoastSection } from './roast-section';

interface RoastPageClientProps {
  slug: string;
  pageId: string;
  displayName: string;
  accentColor: string;
  existingRoast: RoastContent | null;
  linkTitles: string[];
  projectTitles: string[];
}

export function RoastPageClient({
  slug,
  pageId,
  displayName,
  accentColor,
  existingRoast,
  linkTitles,
  projectTitles,
}: RoastPageClientProps) {
  const [roast, setRoast] = useState<RoastContent | null>(existingRoast);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pages/${pageId}/generate/roast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkTitles, projectTitles }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate roast');
      }
      const data: RoastContent = await res.json();
      posthog.capture('profile_mode_generated', {
        mode: 'roast',
      });
      setRoast(data);
    } catch (e) {
      captureActionFailure(e, { action: 'generate_roast' });
      setError(
        e instanceof Error
          ? e.message
          : 'Something went wrong. Try again in a moment.',
      );
    } finally {
      setLoading(false);
    }
  }, [pageId, linkTitles, projectTitles]);

  const handleDownload = useCallback(async () => {
    if (!captureRef.current || downloading) return;
    setDownloading(true);
    const { toPng } = await import('html-to-image');
    try {
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 2,
        quality: 1,
        cacheBust: true,
        backgroundColor: '#12020b',
      });
      const link = document.createElement('a');
      link.download = `${slug}-roast.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // silently fail
    } finally {
      setDownloading(false);
    }
  }, [downloading, slug]);

  const handleShareX = useCallback(() => {
    const url = `${window.location.origin}/${slug}/roast`;
    const text = `I just got roasted by AI on Karte. Vibe score: ${roast?.vibeScore}/100. Think you can handle it?`;
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  }, [slug, roast?.vibeScore]);

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/${slug}/roast`;
    await navigator.clipboard.writeText(url);
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl -rotate-1 border-4 border-[#f9ff00] bg-[#210815] p-5 shadow-[14px_14px_0_#00ffd5] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#00ffd5]">
                Karte Roast Lab
              </p>
              <h2 className="mt-3 text-2xl font-black uppercase leading-tight text-karte-text sm:text-4xl">
                Roasting {displayName}
              </h2>
            </div>
            <div className="flex h-16 w-16 shrink-0 animate-pulse items-center justify-center border-4 border-white bg-black text-2xl font-black text-[#f9ff00]">
              404
            </div>
          </div>

          <div className="mt-7 rotate-1 border-4 border-[#00ffd5] bg-black p-5 shadow-[8px_8px_0_#ff2aa3]">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#f9ff00]">
                Public Vibe Inspection
              </p>
              <div className="h-2 w-28 overflow-hidden bg-white/15">
                <div className="h-full w-2/3 animate-pulse bg-[#ff2aa3]" />
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-[132px_1fr]">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-[#00ffd5]/80 text-4xl font-black text-[#f9ff00] shadow-[0_0_35px_rgba(0,255,213,0.25)]">
                ??
              </div>
              <div className="space-y-4 pt-1">
                {[
                  ['Scanning links', 'bg-white/25'],
                  ['Measuring founder energy', 'bg-[#00ffd5]/40'],
                  ['Finding the funniest specific detail', 'bg-[#f9ff00]/50'],
                  ['Removing anything too mean', 'bg-[#ff2aa3]/45'],
                ].map(([label, color]) => (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                      <span>{label}</span>
                      <span>...</span>
                    </div>
                    <div className={`h-3 animate-pulse ${color}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {['Red flags', 'Best link', 'Bio autopsy'].map((label) => (
              <div key={label} className="rotate-1 border-2 border-white bg-[#ff2aa3] p-3 text-black shadow-[5px_5px_0_#f9ff00]">
                <p className="text-xs font-black uppercase tracking-[0.16em]">{label}</p>
                <div className="mt-3 h-2 animate-pulse bg-black/35" />
                <div className="mt-2 h-2 w-2/3 animate-pulse bg-black/25" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // No roast yet - show generate prompt
  if (!roast) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md -rotate-1 space-y-6 border-4 border-[#f9ff00] bg-[#210815] p-8 text-center shadow-[14px_14px_0_#00ffd5] sm:p-12">
          <div className="text-6xl">🔥</div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-[-0.02em] text-karte-text sm:text-4xl">
              {displayName}&apos;s Roast
            </h1>
            <p className="text-[#f9ff00]">An unserious audit of a very serious profile.</p>
          </div>

          {error && (
            <div className="border border-red-400 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            className="w-full border-2 border-white px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-black transition-all hover:translate-x-1 hover:translate-y-1 active:scale-[0.98]"
            style={{ backgroundColor: '#f9ff00', boxShadow: `8px 8px 0 ${accentColor}` }}
          >
            Generate Roast
          </button>

          <p className="text-xs text-white/50">
            AI-generated humor. Don&apos;t take it personally.
          </p>
        </div>
      </div>
    );
  }

  // Roast display
  return (
    <div className="w-full text-karte-text">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:py-16">
        <div ref={captureRef} className="space-y-8 bg-[#12020b] px-2 py-2 sm:px-6 sm:py-6">
          <div className="mx-auto max-w-4xl border-4 border-white bg-[#210815] px-5 py-8 text-center shadow-[16px_16px_0_#f9ff00]">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.32em] text-[#00ffd5]">
              Karte Roast Me
            </p>
            <h1
              className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl"
              style={{ textShadow: `5px 5px 0 ${accentColor}` }}
            >
              The Roast of {displayName}
            </h1>
            <p
              className="mt-5 inline-block -rotate-1 border-2 border-[#f9ff00] bg-black px-3 py-2 text-sm font-black uppercase tracking-[0.12em]"
              style={{
                color: '#f9ff00',
              }}
            >
              {roast.personalityType}
            </p>
          </div>

          <RoastScoreCard vibeScore={roast.vibeScore} accentColor={accentColor} />

          <div className="mx-auto max-w-3xl rotate-1 border-4 border-[#00ffd5] bg-black p-6 shadow-[12px_12px_0_#ff2aa3]">
            <p className="text-base font-medium leading-relaxed text-karte-text sm:text-lg">
              “{roast.roast}”
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <RoastSection
              emoji="🚩"
              title="Red Flags"
              content={roast.redFlags}
              accentColor={accentColor}
            />
            <RoastSection
              emoji="🏆"
              title="Best Link"
              content={`${roast.bestLink.title} — ${roast.bestLink.reason}`}
              accentColor={accentColor}
            />
            <RoastSection
              emoji="💀"
              title="Worst Link"
              content={`${roast.worstLink.title} — ${roast.worstLink.reason}`}
              accentColor={accentColor}
            />
            <RoastSection
              emoji="📱"
              title="Spirit Platform"
              content={roast.spiritPlatform}
              accentColor={accentColor}
            />
            <RoastSection
              emoji="⭐"
              title="Celebrity Match"
              content={roast.celebrityMatch}
              accentColor={accentColor}
            />
            <RoastSection
              emoji="🔬"
              title="Bio Autopsy"
              content={roast.bioAutopsy}
              accentColor={accentColor}
            />
            <RoastSection
              emoji="👀"
              title="First Impression"
              content={roast.firstImpression}
              accentColor={accentColor}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 border-2 border-white bg-black px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition-colors hover:bg-white hover:text-black"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloading ? 'Rendering...' : 'Download View'}
          </button>
          <button
            onClick={handleShareX}
            className="flex items-center gap-2 border-2 border-white px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition-all hover:translate-x-1 hover:translate-y-1 active:scale-[0.98]"
            style={{ backgroundColor: '#f9ff00', color: '#000', boxShadow: `6px 6px 0 ${accentColor}` }}
          >
            Share on X
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 border-2 border-white bg-[#210815] px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] transition-colors hover:bg-white hover:text-black"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            Copy Link
          </button>
        </div>

        <p className="pt-4 text-center text-xs text-white/45">
          AI-generated humor. Don&apos;t take it personally.
        </p>
      </div>
    </div>
  );
}
