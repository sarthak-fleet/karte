'use client';

import { toPng } from 'html-to-image';
import { type RefObject, useState } from 'react';

interface ShareControlsProps {
  slug: string;
  accentColor: string;
  newspaperRef: RefObject<HTMLDivElement | null>;
}

const btnClass =
  'inline-flex items-center gap-2 rounded-xl border border-karte-border-emphasis bg-white/5 px-4 py-2.5 text-sm font-medium text-karte-text transition hover:bg-white/10 active:scale-95 disabled:opacity-50';

export function ShareControls({
  slug,
  accentColor,
  newspaperRef,
}: ShareControlsProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleDownload() {
    if (!newspaperRef.current || downloading) return;
    setDownloading(true);

    try {
      const dataUrl = await toPng(newspaperRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#030712',
      });

      const link = document.createElement('a');
      link.download = `${slug}-newspaper.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download newspaper:', err);
    } finally {
      setDownloading(false);
    }
  }

  function handleShareX() {
    const url = `${window.location.origin}/${slug}/newspaper`;
    const text = 'Check out my personal newspaper!';
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/${slug}/newspaper`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pt-8">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={btnClass}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        {downloading ? 'Saving...' : 'Download'}
      </button>

      <button onClick={handleShareX} className={btnClass}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Share on X
      </button>

      <button onClick={handleCopyLink} className={btnClass}>
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
          />
        </svg>
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  );
}
