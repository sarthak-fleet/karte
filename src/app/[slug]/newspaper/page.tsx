import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPageBySlug, getGeneratedPage } from '../_lib/get-page-data';
import { resolveThemeConfig } from '@/lib/themes';
import { auth } from '@/lib/auth';
import type { NewspaperContent } from '@/lib/generated-page-types';
import { NewspaperFrontPage } from '@/components/public/newspaper/newspaper-front-page';
import { GenerateNewspaper } from '@/components/public/newspaper/generate-newspaper';

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
              <span className="font-semibold text-gray-300">LinkChat</span>
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
  const session = await auth().catch(() => null);
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
            <span className="font-semibold text-gray-300">LinkChat</span>
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
