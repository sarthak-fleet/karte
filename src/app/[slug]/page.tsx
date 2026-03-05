import { notFound } from 'next/navigation';
import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/db';
import { pages, links } from '@/db/schema';
import { GlassCard } from '@/components/public/glass-card';
import { LinkCard } from '@/components/public/link-card';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

async function getPage(slug: string) {
  const result = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.published, true)))
    .limit(1);

  return result[0] ?? null;
}

async function getLinks(pageId: string) {
  return db
    .select()
    .from(links)
    .where(and(eq(links.pageId, pageId), eq(links.enabled, true)))
    .orderBy(asc(links.sortOrder));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) return { title: 'Not Found' };

  return {
    title: page.displayName,
    description: page.bio ?? `${page.displayName}'s links`,
    openGraph: {
      title: page.displayName,
      description: page.bio ?? `${page.displayName}'s links`,
      ...(page.avatarUrl && { images: [page.avatarUrl] }),
    },
  };
}

export default async function PublicPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) notFound();

  const pageLinks = await getLinks(page.id);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gray-950">
      {/* Animated gradient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-purple-600/30 blur-[128px]" />
        <div className="absolute top-1/3 -right-40 h-80 w-80 animate-pulse rounded-full bg-blue-600/30 blur-[128px] [animation-delay:2s]" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 animate-pulse rounded-full bg-pink-600/30 blur-[128px] [animation-delay:4s]" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center px-4 py-16">
        {/* Profile card */}
        <GlassCard className="w-full p-8 text-center">
          {page.avatarUrl && (
            <img
              src={page.avatarUrl}
              alt={page.displayName}
              className="mx-auto mb-4 h-24 w-24 rounded-full border-2 border-white/20 object-cover"
            />
          )}
          <h1 className="text-2xl font-bold text-white">{page.displayName}</h1>
          {page.bio && (
            <p className="mt-2 text-sm text-white/70">{page.bio}</p>
          )}
        </GlassCard>

        {/* Links */}
        {pageLinks.length > 0 && (
          <div className="mt-8 flex w-full flex-col gap-3">
            {pageLinks.map((link) => (
              <LinkCard
                key={link.id}
                title={link.title}
                url={link.url}
                icon={link.icon}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="mt-auto pt-12 text-xs text-white/30">
          Powered by{' '}
          <span className="font-medium text-white/50">LinkChat</span>
        </p>
      </div>
    </main>
  );
}
