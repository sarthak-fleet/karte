import Link from 'next/link';
import type { ReactNode } from 'react';

// Shown to visitors (never the owner) while a profile mode is still being
// generated in the background, so they see a themed "almost ready" screen
// instead of a 404. Each mode keeps its own visual treatment via `variant`.
type Variant = 'roast' | 'encyclopedia' | 'newspaper';

const STYLES: Record<
  Variant,
  {
    main: string;
    eyebrow: string;
    eyebrowContent: ReactNode;
    heading: string;
    headingText: string;
    body: string;
    noun: string;
    link: string;
  }
> = {
  roast: {
    main: 'grid min-h-screen place-items-center bg-karte-bg px-6 py-16 text-karte-text antialiased',
    eyebrow:
      'text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4',
    eyebrowContent: (
      <>
        <span className="text-karte-accent/80">·</span> Generating
      </>
    ),
    heading: 'mt-5 text-3xl font-semibold tracking-[-0.02em]',
    headingText: 'The roast is being written.',
    body: 'mt-4 text-[15px] leading-[1.65] text-karte-text-3',
    noun: 'page',
    link: 'mt-8 inline-flex items-center gap-2 rounded-full border border-karte-border bg-white/[0.03] px-5 py-2 text-[13px] font-medium text-karte-text-2 transition-all duration-200 ease-[var(--karte-ease)] hover:border-karte-border-emphasis hover:bg-white/[0.06] hover:text-karte-text',
  },
  encyclopedia: {
    main: 'grid min-h-screen place-items-center bg-[#f8f9fa] px-6 py-16 text-gray-800',
    eyebrow:
      'text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500',
    eyebrowContent: 'Generating',
    heading: 'mt-4 font-serif text-3xl text-gray-900',
    headingText: 'The encyclopedia entry is being written.',
    body: 'mt-4 text-[15px] leading-[1.65] text-gray-600',
    noun: 'page',
    link: 'mt-8 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-100',
  },
  newspaper: {
    main: 'grid min-h-screen place-items-center bg-[#f5f0e1] px-6 py-16 text-[#17130d]',
    eyebrow: 'font-serif text-xs font-bold uppercase tracking-[0.22em]',
    eyebrowContent: 'Going to press',
    heading: 'mt-5 font-serif text-3xl font-bold leading-tight',
    headingText: 'The front page is being typeset.',
    body: 'mt-4 text-[15px] leading-[1.65] text-[#17130d]/70',
    noun: 'edition',
    link: 'mt-8 inline-flex items-center gap-2 rounded-full border border-[#17130d]/20 bg-white px-5 py-2 text-[13px] font-medium text-[#17130d] transition-colors hover:bg-[#17130d]/[0.04]',
  },
};

export function GeneratingPlaceholder({
  variant,
  slug,
  displayName,
}: {
  variant: Variant;
  slug: string;
  displayName: string;
}) {
  const s = STYLES[variant];
  return (
    <main className={s.main}>
      <div className="max-w-md text-center">
        <p className={s.eyebrow}>{s.eyebrowContent}</p>
        <h1 className={s.heading}>{s.headingText}</h1>
        <p className={s.body}>
          {displayName} just turned this surface on. The {s.noun} will appear
          here in a moment — usually under 30 seconds. Refresh to check.
        </p>
        <Link href={`/${slug}`} className={s.link}>
          ← Back to profile
        </Link>
      </div>
    </main>
  );
}
