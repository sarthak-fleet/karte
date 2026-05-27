import Link from 'next/link';
import { notFound } from 'next/navigation';

import { GenerateNewspaper } from '@/components/public/newspaper/generate-newspaper';
import { NewspaperFrontPage } from '@/components/public/newspaper/newspaper-front-page';
import { getSession } from '@/lib/auth-server';
import type { NewspaperContent } from '@/lib/generated-page-types';
import { resolveThemeConfig } from '@/lib/themes';

import { getGeneratedPage,getPageBySlug } from '../_lib/get-page-data';

export default async function NewspaperPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await getPageBySlug(slug);
  if (!page) notFound();
  if (!page.newspaperEnabled) notFound();

  const theme = resolveThemeConfig(page.themeConfig as any);
  const generatedPage = await getGeneratedPage(page.id, 'newspaper');

  const existingNewspaper =
    generatedPage?.status === 'ready' && generatedPage.content
      ? (generatedPage.content as unknown as NewspaperContent)
      : null;

  // Generating-in-progress placeholder for visitors so they don't hit 404
  // while a background generation finishes.
  if (
    !existingNewspaper &&
    generatedPage?.status === 'generating'
  ) {
    const session = await getSession().catch(() => null);
    const isOwner = session?.user?.id === page.userId;
    if (!isOwner) {
      return (
        <main className="grid min-h-screen place-items-center bg-[#f5f0e1] px-6 py-16 text-[#17130d]">
          <div className="max-w-md text-center">
            <p className="font-serif text-xs font-bold uppercase tracking-[0.22em]">
              Going to press
            </p>
            <h1 className="mt-5 font-serif text-3xl font-bold leading-tight">
              The front page is being typeset.
            </h1>
            <p className="mt-4 text-[15px] leading-[1.65] text-[#17130d]/70">
              {page.displayName} just turned this surface on. The edition will
              appear here in a moment — usually under 30 seconds. Refresh to
              check.
            </p>
            <Link
              href={`/${slug}`}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#17130d]/20 bg-white px-5 py-2 text-[13px] font-medium text-[#17130d] transition-colors hover:bg-[#17130d]/[0.04]"
            >
              ← Back to profile
            </Link>
          </div>
        </main>
      );
    }
  }

  if (existingNewspaper) {
    return (
      <div className="min-h-screen bg-[#f5f0e1]">
        {/* Header bar */}
        <header className="sticky top-0 z-50 border-b border-gray-800/10 bg-gray-900">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
            <Link
              href={`/${slug}`}
              className="flex items-center gap-2 text-sm font-medium text-gray-200 transition-colors hover:text-white"
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
            <span className="text-xs tracking-wide text-gray-400">
              Powered by{' '}
              <span className="font-semibold text-gray-300">Karte</span>
            </span>
          </div>
        </header>

        {/* Newspaper content */}
        <NewspaperFrontPage
          content={existingNewspaper}
          displayName={page.displayName}
          avatarUrl={page.avatarUrl ?? null}
          slug={slug}
          accentColor={theme.accentColor}
        />
      </div>
    );
  }

  // Only show generate UI to the page owner
  const session = await getSession().catch(() => null);
  const isOwner = session?.user?.id === page.userId;
  if (!isOwner) notFound();

  return (
    <div className="min-h-screen bg-[#f5f0e1]">
      {/* Header bar */}
      <header className="sticky top-0 z-50 border-b border-gray-800/10 bg-gray-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href={`/${slug}`}
            className="flex items-center gap-2 text-sm font-medium text-gray-200 transition-colors hover:text-white"
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
          <span className="text-xs tracking-wide text-gray-400">
            Powered by{' '}
            <span className="font-semibold text-gray-300">Karte</span>
          </span>
        </div>
      </header>

      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <GenerateNewspaper
          pageId={page.id}
          slug={slug}
          accentColor={theme.accentColor}
        />
      </div>
    </div>
  );
}
