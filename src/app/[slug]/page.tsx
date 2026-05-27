import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// ChatWidget is a 722-line client bundle. Use dynamic() to code-split it
// into its own chunk so the initial JS payload on every profile page is
// smaller. The widget still renders server-side initially (it's a small
// fixed-position button until opened) — this is purely about bundle weight.
const ChatWidget = dynamic(
  () => import('@/components/public/chat-widget').then((m) => m.ChatWidget),
);

import { LinkCard } from '@/components/public/link-card';
import { OpenChatButton } from '@/components/public/open-chat-button';
import { PageSectionRenderer } from '@/components/public/page-section-renderer';
import { ProjectCard } from '@/components/public/project-card';
import { TrackableSection } from '@/components/public/trackable-section';
import { getProfileVariant } from '@/lib/profile-variants';
import { resolveThemeConfig } from '@/lib/themes';

import { getFullPageData } from './_lib/get-page-data';

// Force the page into the static-renderable pipeline so OpenNext's
// incremental cache + Next.js's framework-level Cache-Control headers
// actually apply. Without force-static, Next.js infers the page as
// dynamic and ships private/no-store headers regardless of revalidate.
export const dynamic = 'force-static';
export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getFullPageData(slug);
  if (!data) return {};

  const { page } = data;
  return {
    title: page.displayName,
    description:
      page.bio ?? `${page.displayName} on Karte — links, chat, and more.`,
    openGraph: {
      title: page.displayName,
      description: page.bio ?? undefined,
      ...(page.avatarUrl && { images: [page.avatarUrl] }),
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params;
  const data = await getFullPageData(slug);
  if (!data) notFound();

  const { page, links: pageLinks, projects: pageProjects, sections: publicSections, readyPages } = data;
  const theme = resolveThemeConfig(page.themeConfig);
  // Variant defaults to baseline. A/B-variant routing was previously driven
  // by ?variant= search params, which forced dynamic rendering and blocked
  // edge caching. Variants can come back via URL pattern (/[slug]/v/[id])
  // when re-enabled — see docs/perf-audit.md.
  const variant = getProfileVariant(undefined);

  const enabledPages = {
    encyclopedia: (page.encyclopediaEnabled ?? false) && readyPages.has('encyclopedia'),
    roast: (page.roastEnabled ?? false) && readyPages.has('roast'),
    newspaper: (page.newspaperEnabled ?? false) && readyPages.has('newspaper'),
  };
  const firstName = page.displayName.split(/\s+/)[0] || page.displayName;
  const initials = page.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const hasMessenger = (page.chatEnabled ?? false) || page.dmMode !== 'off';
  const hasChatPanel = hasMessenger;
  const modeCards = [
    {
      key: 'encyclopedia',
      title: 'Encyclopedia',
      href: `/${slug}/encyclopedia`,
      enabled: enabledPages.encyclopedia,
      description: `A structured, reference-style page for ${firstName}'s work, background, and public context.`,
      mark: 'Wiki',
      visual: 'wiki',
    },
    {
      key: 'newspaper',
      title: 'Newspaper',
      href: `/${slug}/newspaper`,
      enabled: enabledPages.newspaper,
      description: `A front-page treatment of what ${firstName} is building, shipping, and thinking about.`,
      mark: 'Times',
      visual: 'newspaper',
    },
    {
      key: 'roast',
      title: 'Roast Me',
      href: `/${slug}/roast`,
      enabled: enabledPages.roast,
      description: `A shareable, unserious critique of ${firstName}'s links, profile, and internet presence.`,
      mark: 'Roast',
      visual: 'roast',
    },
  ];
  const enabledModeCards = modeCards.filter((card) => card.enabled);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-karte-bg text-karte-text antialiased"
      style={{
        background: `radial-gradient(circle at 50% -16%, ${theme.accentColor}1f, transparent 36%), linear-gradient(180deg, #0a0a0a 0%, #0b0b0c 50%, #0a0a0a 100%)`,
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,#000_30%,transparent_75%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-16 pt-4 sm:px-6 sm:pt-8">
        <section className="overflow-hidden rounded-3xl border border-karte-border bg-karte-surface/85 backdrop-blur-xl">
          <div className={`grid gap-0 ${hasChatPanel ? 'lg:grid-cols-[1fr_360px]' : ''}`}>
            <div className="p-5 sm:p-10">
              <div className="flex items-center gap-3 sm:gap-4">
                {page.avatarUrl && (
                  <Image
                    src={page.avatarUrl}
                    alt={page.displayName}
                    width={84}
                    height={84}
                    sizes="84px"
                    className="h-16 w-16 rounded-2xl border border-karte-border object-cover sm:h-20 sm:w-20"
                  />
                )}
                {!page.avatarUrl && (
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-karte-border text-xl font-semibold text-zinc-950 sm:h-20 sm:w-20 sm:text-2xl"
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    {initials || firstName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
                    <span style={{ color: theme.accentColor }}>·</span>{' '}
                    {variant.eyebrow}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold leading-[1.05] tracking-[-0.02em] text-karte-text sm:text-5xl">
                    {page.displayName}
                  </h1>
                </div>
              </div>

              {page.bio && (
                <p className="mt-7 max-w-2xl text-[15px] leading-[1.65] tracking-[-0.005em] text-karte-text-3 sm:mt-8 sm:text-lg sm:leading-[1.55]">
                  {page.bio}
                </p>
              )}
            </div>

            {hasChatPanel && (
              <div className="border-t border-karte-border bg-white/[0.02] p-4 sm:p-5 lg:border-l lg:border-t-0">
                <div className="rounded-2xl border border-karte-border bg-karte-bg/60 p-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
                    <span style={{ color: theme.accentColor }}>·</span> Ask{' '}
                    {firstName}
                  </p>
                  {page.chatEnabled && (
                    <div className="mt-4 space-y-2.5">
                      <OpenChatButton
                        mode="chat"
                        prompt={variant.promptOne(firstName)}
                        autoSend
                        className="block w-full rounded-xl border border-karte-border bg-white/[0.03] px-4 py-3 text-left text-sm text-karte-text-3 transition-all duration-200 ease-[var(--karte-ease)] hover:border-white/15 hover:bg-white/[0.06] hover:text-karte-text"
                      >
                        {variant.promptOne(firstName)}
                      </OpenChatButton>
                      <OpenChatButton
                        mode="chat"
                        prompt={variant.promptTwo}
                        autoSend
                        className="block w-full rounded-xl border border-karte-border bg-white/[0.03] px-4 py-3 text-left text-sm text-karte-text-3 transition-all duration-200 ease-[var(--karte-ease)] hover:border-white/15 hover:bg-white/[0.06] hover:text-karte-text"
                      >
                        {variant.promptTwo}
                      </OpenChatButton>
                    </div>
                  )}
                  {hasMessenger && (
                    <OpenChatButton
                      mode={page.chatEnabled ? 'chat' : 'contact'}
                      className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold text-zinc-950 transition-all duration-200 ease-[var(--karte-ease)] hover:brightness-110"
                      style={{ backgroundColor: theme.accentColor }}
                    >
                      {page.chatEnabled ? variant.primaryCta : 'Send message'}
                    </OpenChatButton>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {pageLinks.length > 0 && (
          <section className="mt-5 w-full overflow-hidden rounded-3xl border border-karte-border bg-karte-surface/70 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-5">
              <p
                className="text-[11px] font-medium uppercase tracking-[0.22em]"
                style={{ color: theme.accentColor }}
              >
                <span className="opacity-80">·</span> Find Me Online
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.01em] text-karte-text sm:text-3xl">
                Links worth opening
              </h2>
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

        {enabledModeCards.length > 0 && (
          <section className="mt-5 grid gap-3 md:grid-cols-3">
            {enabledModeCards.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className="group min-h-64 rounded-3xl border border-karte-border bg-karte-surface/70 p-6 backdrop-blur-xl transition-all duration-200 ease-[var(--karte-ease)] hover:-translate-y-0.5 hover:border-white/15 hover:bg-karte-surface"
              >
                <div className="mb-6 h-28 overflow-hidden rounded-2xl border border-karte-border bg-black/30">
                  {card.visual === 'wiki' && (
                    <div className="grid h-full grid-cols-[72px_1fr] gap-3 p-4">
                      <div className="space-y-2 border-r border-white/10 pr-3">
                        <div className="h-2 w-10 rounded-full bg-white/45" />
                        <div className="h-2 w-8 rounded-full bg-white/20" />
                        <div className="h-2 w-11 rounded-full bg-white/20" />
                      </div>
                      <div>
                        <div className="h-3 w-32 rounded-full bg-white/70" />
                        <div className="mt-4 space-y-2">
                          <div className="h-2 rounded-full bg-white/25" />
                          <div className="h-2 w-11/12 rounded-full bg-white/18" />
                          <div className="h-2 w-8/12 rounded-full bg-white/18" />
                        </div>
                      </div>
                    </div>
                  )}
                  {card.visual === 'newspaper' && (
                    <div className="h-full bg-[#f4efe4] p-4 text-[#17130d]">
                      <div className="border-b border-[#17130d]/30 pb-2 text-center font-serif text-lg font-bold leading-none">
                        The Profile Times
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <div className="h-2 bg-[#17130d]/70" />
                          <div className="h-1.5 bg-[#17130d]/30" />
                          <div className="h-1.5 bg-[#17130d]/30" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-2 bg-[#17130d]/70" />
                          <div className="h-1.5 bg-[#17130d]/30" />
                          <div className="h-1.5 bg-[#17130d]/30" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-2 bg-[#17130d]/70" />
                          <div className="h-1.5 bg-[#17130d]/30" />
                          <div className="h-1.5 bg-[#17130d]/30" />
                        </div>
                      </div>
                    </div>
                  )}
                  {card.visual === 'roast' && (
                    <div className="relative h-full bg-[#170611] p-4">
                      <div
                        className="absolute left-4 top-4 rotate-[-4deg] border-2 bg-black px-3 py-2 text-xs font-black uppercase tracking-[0.18em]"
                        style={{
                          borderColor: theme.accentColor,
                          color: theme.accentColor,
                        }}
                      >
                        Public Vibe Inspection
                      </div>
                      <div
                        className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full border-4 text-xl font-black text-karte-text"
                        style={{ borderColor: theme.accentColor }}
                      >
                        82
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <div
                    className="rounded-full border border-karte-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
                    style={{ color: theme.accentColor }}
                  >
                    {card.mark}
                  </div>
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-[-0.01em] text-karte-text">
                  {card.title}
                </h2>
                <p className="mt-4 text-sm leading-[1.6] text-karte-text-3">
                  {card.description}
                </p>
              </Link>
            ))}
          </section>
        )}

        {pageProjects.length > 0 && (
          <section className="mt-10 w-full">
            <div className="mb-5">
              <p
                className="text-[11px] font-medium uppercase tracking-[0.22em]"
                style={{ color: theme.accentColor }}
              >
                <span className="opacity-80">·</span> Projects
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.01em] text-karte-text">
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
                className="text-[11px] font-medium uppercase tracking-[0.22em]"
                style={{ color: theme.accentColor }}
              >
                <span className="opacity-80">·</span> Sections
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.01em] text-karte-text">
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

        <p className="mt-auto pt-12 text-center text-xs text-karte-text-4">
          Powered by{' '}
          <Link
            href="/"
            className="font-medium text-karte-text-3 transition-colors duration-200 hover:text-karte-text"
          >
            Karte
          </Link>
        </p>
      </div>

      {(page.chatEnabled || page.dmMode !== 'off') && (
        <ChatWidget
          slug={slug}
          displayName={page.displayName}
          accentColor={theme.accentColor}
          position={theme.chatPosition}
          chatEnabled={page.chatEnabled ?? false}
          dmMode={page.dmMode}
        />
      )}
    </main>
  );
}
