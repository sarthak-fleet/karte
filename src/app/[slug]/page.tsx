import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq, and, asc } from 'drizzle-orm';
import { db, ensureProjectsTable } from '@/db';
import { pages, links, pageSections, projects, users } from '@/db/schema';
import { GlassCard } from '@/components/public/glass-card';
import { LinkCard } from '@/components/public/link-card';
import { ProjectCard } from '@/components/public/project-card';
import { ChatWidget } from '@/components/public/chat-widget';
import { PageSectionRenderer } from '@/components/public/page-section-renderer';
import { TrackableSection } from '@/components/public/trackable-section';
import { resolveThemeConfig } from '@/lib/themes';
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

async function getProjects(pageId: string) {
  await ensureProjectsTable();

  return db
    .select()
    .from(projects)
    .where(and(eq(projects.pageId, pageId), eq(projects.enabled, true)))
    .orderBy(asc(projects.sortOrder));
}

async function getSections(pageId: string) {
  await ensureProjectsTable();

  return db
    .select()
    .from(pageSections)
    .where(and(eq(pageSections.pageId, pageId), eq(pageSections.enabled, true)))
    .orderBy(asc(pageSections.sortOrder));
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

  const [pageLinks, pageProjects, publicSections, user] = await Promise.all([
    getLinks(page.id),
    getProjects(page.id),
    getSections(page.id),
    db
      .select()
      .from(users)
      .where(eq(users.id, page.userId))
      .then((rows) => rows[0]),
  ]);
  const theme = resolveThemeConfig(page.themeConfig);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-gray-950"
      style={{
        background: `linear-gradient(180deg, ${theme.gradientFrom}18 0%, ${theme.gradientTo}1c 42%, #020617 100%)`,
      }}
    >
      {/* Animated gradient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="absolute -top-40 -left-40 h-80 w-80 animate-pulse rounded-full blur-[128px]"
          style={{ backgroundColor: `${theme.gradientFrom}4d` }}
        />
        <div
          className="absolute top-1/3 -right-40 h-80 w-80 animate-pulse rounded-full blur-[128px] [animation-delay:2s]"
          style={{ backgroundColor: `${theme.gradientTo}42` }}
        />
        <div
          className="absolute -bottom-40 left-1/3 h-80 w-80 animate-pulse rounded-full blur-[128px] [animation-delay:4s]"
          style={{ backgroundColor: `${theme.accentColor}38` }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-16 sm:px-6">
        {/* Profile card */}
        <div
          className="rounded-[28px] p-[1px]"
          style={{
            background: `linear-gradient(135deg, ${theme.accentColor}66, ${theme.gradientFrom}26)`,
            boxShadow: `0 30px 90px -50px ${theme.accentColor}`,
          }}
        >
          <GlassCard className="w-full p-8 text-center sm:p-10">
            <div className="mx-auto max-w-2xl">
              {page.avatarUrl && (
                <Image
                  src={page.avatarUrl}
                  alt={page.displayName}
                  width={96}
                  height={96}
                  sizes="96px"
                  className="mx-auto mb-5 h-24 w-24 rounded-full border-2 border-white/20 object-cover shadow-lg shadow-black/30"
                />
              )}
              <p
                className="text-[11px] font-medium uppercase tracking-[0.32em]"
                style={{ color: theme.accentColor }}
              >
                Personal Profile
              </p>
              <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                {page.displayName}
              </h1>
              {page.bio && (
                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
                  {page.bio}
                </p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Links */}
        {pageLinks.length > 0 && (
          <section className="mt-8 w-full">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p
                  className="text-[11px] font-medium uppercase tracking-[0.32em]"
                  style={{ color: theme.accentColor }}
                >
                  Links
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Find Me Online
                </h2>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {pageLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  id={link.id}
                  title={link.title}
                  url={link.url}
                  icon={link.icon}
                  accentColor={theme.accentColor}
                />
              ))}
            </div>
          </section>
        )}

        {pageProjects.length > 0 && (
          <section className="mt-10 w-full">
            <div className="mb-5">
              <p
                className="text-[11px] font-medium uppercase tracking-[0.32em]"
                style={{ color: theme.accentColor }}
              >
                Projects
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Things I&apos;ve Built
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {pageProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  title={project.title}
                  url={project.url}
                  imageUrl={project.imageUrl}
                  description={project.description}
                  accentColor={theme.accentColor}
                />
              ))}
            </div>
          </section>
        )}

        {publicSections.length > 0 && (
          <section className="mt-10 w-full">
            <div className="mb-5">
              <p
                className="text-[11px] font-medium uppercase tracking-[0.32em]"
                style={{ color: theme.accentColor }}
              >
                Sections
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                More to Explore
              </h2>
            </div>

            <div className="space-y-4">
              {publicSections.map((section) => (
                <TrackableSection
                  key={section.id}
                  slug={slug}
                  sectionId={section.id}
                  sectionType={section.type}
                  sectionTitle={section.title}
                >
                  <PageSectionRenderer
                    slug={slug}
                    section={section}
                    accentColor={theme.accentColor}
                  />
                </TrackableSection>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <p className="mt-auto pt-12 text-center text-xs text-white/30">
          Powered by{' '}
          <Link href="/" className="font-medium text-white/50 transition-colors hover:text-white">
            LinkChat
          </Link>
        </p>
      </div>

      {page.chatEnabled && (
        <ChatWidget
          slug={slug}
          displayName={page.displayName}
          accentColor={theme.accentColor}
          position={theme.chatPosition}
        />
      )}
      {user?.smProjectId && (
        <script
          defer
          src="https://unpkg.com/@saas-maker/analytics-sdk"
          data-project={user.smProjectId}
        />
      )}
    </main>
  );
}
