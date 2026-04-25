import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPageBySlug, getGeneratedPage, getPageLinks, getPageProjects } from '../_lib/get-page-data';
import { resolveThemeConfig } from '@/lib/themes';
import { getSession } from '@/lib/auth-server';
import type { RoastContent } from '@/lib/generated-page-types';
import { RoastPageClient } from '@/components/public/roast/roast-page-client';

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

  // If no content generated and visitor isn't the owner, 404
  const session = await getSession().catch(() => null);
  const isOwner = session?.user?.id === page.userId;
  if (!existingRoast && !isOwner) notFound();

  const linkTitles = links.map((l) => l.title);
  const projectTitles = projects.map((p) => p.title);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-950 via-red-950/20 to-gray-950">
      {/* Ember glow blobs */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #dc2626 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-48 h-[500px] w-[500px] rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #ea580c 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/4 h-80 w-80 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
      />

      {/* Header bar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href={`/${slug}`}
            className="flex items-center gap-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
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
          <span className="text-xs tracking-wide text-gray-500">
            Powered by{' '}
            <span className="font-semibold text-gray-400">LinkChat</span>
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
