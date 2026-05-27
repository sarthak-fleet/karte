import Link from 'next/link';
import { notFound } from 'next/navigation';

import { GenerateEncyclopedia } from '@/components/public/encyclopedia/generate-encyclopedia';
import { WikiArticle } from '@/components/public/encyclopedia/wiki-article';
import { getSession } from '@/lib/auth-server';
import { normalizeEncyclopediaContent } from '@/lib/encyclopedia-compat';
import { resolveThemeConfig } from '@/lib/themes';

import { getGeneratedPage,getPageBySlug } from '../_lib/get-page-data';

export default async function EncyclopediaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await getPageBySlug(slug);
  if (!page) notFound();
  if (!page.encyclopediaEnabled) notFound();

  const theme = resolveThemeConfig(page.themeConfig as any);
  const generatedPage = await getGeneratedPage(page.id, 'encyclopedia');

  // Visitors see a generating-in-progress placeholder rather than 404 while
  // background generation finishes.
  if (
    generatedPage?.status === 'generating' &&
    !generatedPage.content
  ) {
    const session = await getSession().catch(() => null);
    const isOwner = session?.user?.id === page.userId;
    if (!isOwner) {
      return (
        <main className="grid min-h-screen place-items-center bg-[#f8f9fa] px-6 py-16 text-gray-800">
          <div className="max-w-md text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500">
              Generating
            </p>
            <h1 className="mt-4 font-serif text-3xl text-gray-900">
              The encyclopedia entry is being written.
            </h1>
            <p className="mt-4 text-[15px] leading-[1.65] text-gray-600">
              {page.displayName} just turned this surface on. The page will
              appear here in a moment — usually under 30 seconds. Refresh to
              check.
            </p>
            <Link
              href={`/${slug}`}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              ← Back to profile
            </Link>
          </div>
        </main>
      );
    }
  }

  if (generatedPage?.status === 'ready' && generatedPage.content) {
    const content = normalizeEncyclopediaContent(generatedPage.content);
    if (!content) notFound();

    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        {/* Wikipedia-style header */}
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-600"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                <span className="text-sm font-semibold text-gray-800">
                  Karte Encyclopedia
                </span>
              </div>
              <span className="hidden text-xs text-gray-400 sm:inline">
                &mdash; {page.displayName}
              </span>
            </div>
            <Link
              href={`/${slug}`}
              className="flex items-center gap-1.5 text-sm text-blue-600 transition-colors hover:text-blue-800"
            >
              Back to profile
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </header>

        {/* Article content */}
        <WikiArticle
          content={content}
          displayName={page.displayName}
          avatarUrl={page.avatarUrl ?? null}
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
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Wikipedia-style header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span className="text-sm font-semibold text-gray-800">
                Karte Encyclopedia
              </span>
            </div>
            <span className="hidden text-xs text-gray-400 sm:inline">
              &mdash; {page.displayName}
            </span>
          </div>
          <Link
            href={`/${slug}`}
            className="flex items-center gap-1.5 text-sm text-blue-600 transition-colors hover:text-blue-800"
          >
            Back to profile
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </header>

      <GenerateEncyclopedia
        pageId={page.id}
        slug={slug}
        accentColor={theme.accentColor}
      />
    </div>
  );
}
