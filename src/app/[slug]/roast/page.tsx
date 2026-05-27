import Link from 'next/link';
import { notFound } from 'next/navigation';

import { RoastPageClient } from '@/components/public/roast/roast-page-client';
import { getSession } from '@/lib/auth-server';
import type { RoastContent } from '@/lib/generated-page-types';
import { resolveThemeConfig } from '@/lib/themes';

import { getGeneratedPage, getPageBySlug, getPageLinks, getPageProjects } from '../_lib/get-page-data';

export default async function RoastPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await getPageBySlug(slug);
  if (!page) notFound();
  if (!page.roastEnabled) notFound();

  const theme = resolveThemeConfig(page.themeConfig as any);

  const [generatedPage, links, projects] = await Promise.all([
    getGeneratedPage(page.id, 'roast'),
    getPageLinks(page.id),
    getPageProjects(page.id),
  ]);

  const existingRoast =
    generatedPage?.status === 'ready' && generatedPage.content
      ? (generatedPage.content as unknown as RoastContent)
      : null;

  const session = await getSession().catch(() => null);
  const isOwner = session?.user?.id === page.userId;

  // Show the generating-in-progress state to visitors so they don't see
  // a 404 while a background generation is in flight. Owner sees the
  // editor flow (which can also show a busy state).
  const isGenerating = generatedPage?.status === 'generating';
  if (!existingRoast && !isOwner && isGenerating) {
    return (
      <main className="grid min-h-screen place-items-center bg-karte-bg px-6 py-16 text-karte-text antialiased">
        <div className="max-w-md text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span className="text-karte-accent/80">·</span> Generating
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.02em]">
            The roast is being written.
          </h1>
          <p className="mt-4 text-[15px] leading-[1.65] text-karte-text-3">
            {page.displayName} just turned this surface on. The page will
            appear here in a moment — usually under 30 seconds. Refresh to
            check.
          </p>
          <Link
            href={`/${slug}`}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-karte-border bg-white/[0.03] px-5 py-2 text-[13px] font-medium text-karte-text-2 transition-all duration-200 ease-[var(--karte-ease)] hover:border-karte-border-emphasis hover:bg-white/[0.06] hover:text-karte-text"
          >
            ← Back to profile
          </Link>
        </div>
      </main>
    );
  }

  // If no content and visitor isn't the owner, 404
  if (!existingRoast && !isOwner) notFound();

  const linkTitles = links.map((l) => l.title);
  const projectTitles = projects.map((p) => p.title);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#12020b] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.08) 75%, transparent 75%, transparent)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{
          background:
            'linear-gradient(110deg, rgba(255,0,128,0.34), transparent 38%, rgba(0,255,213,0.2) 66%, rgba(255,242,0,0.2))',
        }}
      />

      {/* Header bar */}
      <header className="sticky top-0 z-50 border-b-4 border-[#f9ff00] bg-[#12020b]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href={`/${slug}`}
            className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#f9ff00] transition-colors hover:text-white"
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
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {page.displayName}
          </Link>
          <span className="rotate-1 border border-[#00ffd5] px-2 py-1 text-xs font-black tracking-wide text-[#00ffd5]">
            Karte Roast Lab
          </span>
        </div>
      </header>

      {/* Roast content */}
      <div className="relative z-10">
        <RoastPageClient
          slug={slug}
          pageId={page.id}
          displayName={page.displayName}
          accentColor={theme.accentColor}
          existingRoast={existingRoast}
          linkTitles={linkTitles}
          projectTitles={projectTitles}
        />
      </div>
    </div>
  );
}
