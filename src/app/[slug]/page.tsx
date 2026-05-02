import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ChatWidget } from '@/components/public/chat-widget';
import { LinkCard } from '@/components/public/link-card';
import { OpenChatButton } from '@/components/public/open-chat-button';
import { PageSectionRenderer } from '@/components/public/page-section-renderer';
import { ProjectCard } from '@/components/public/project-card';
import { TrackableSection } from '@/components/public/trackable-section';
import { resolveThemeConfig } from '@/lib/themes';

import { getFullPageData } from './_lib/get-page-data';

type Props = { params: Promise<{ slug: string }> };

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params;
  const data = await getFullPageData(slug);
  if (!data) notFound();

  const { page, links: pageLinks, projects: pageProjects, sections: publicSections, readyPages } = data;
  const theme = resolveThemeConfig(page.themeConfig);

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
  const modeCards = [
    {
      key: 'encyclopedia',
      title: 'Encyclopedia',
      href: `/${slug}/encyclopedia`,
      enabled: enabledPages.encyclopedia,
      accent: '#f4ead8',
      description: `A structured, reference-style page for ${firstName}'s work, background, and public context.`,
      mark: 'Wiki',
      visual: 'wiki',
    },
    {
      key: 'newspaper',
      title: 'Newspaper',
      href: `/${slug}/newspaper`,
      enabled: enabledPages.newspaper,
      accent: '#f2c879',
      description: `A front-page treatment of what ${firstName} is building, shipping, and thinking about.`,
      mark: 'Times',
      visual: 'newspaper',
    },
    {
      key: 'roast',
      title: 'Roast Me',
      href: `/${slug}/roast`,
      enabled: enabledPages.roast,
      accent: '#f08b5f',
      description: `A shareable, unserious critique of ${firstName}'s links, profile, and internet presence.`,
      mark: 'Roast',
      visual: 'roast',
    },
  ];

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#070709] text-white"
      style={{
        background: `radial-gradient(circle at 50% -16%, ${theme.accentColor}22, transparent 32%), radial-gradient(circle at 14% 18%, ${theme.gradientFrom}10, transparent 24%), radial-gradient(circle at 86% 24%, ${theme.gradientTo}10, transparent 26%), linear-gradient(180deg, #090909 0%, #111111 42%, #070707 100%)`,
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(242,200,121,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f2c879]/55 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-16 pt-4 sm:px-6 sm:pt-8">
        <section
          className="overflow-hidden rounded-[28px] border border-[#f2c879]/18 bg-[#121212]/92 backdrop-blur-2xl sm:rounded-[32px]"
          style={{ boxShadow: `0 40px 140px -72px ${theme.accentColor}` }}
        >
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-5 sm:p-10">
              <div className="flex items-center gap-3 sm:gap-4">
                {page.avatarUrl && (
                  <Image
                    src={page.avatarUrl}
                    alt={page.displayName}
                    width={84}
                    height={84}
                    sizes="84px"
                    className="h-16 w-16 rounded-2xl border border-white/15 object-cover shadow-2xl shadow-black/50 sm:h-20 sm:w-20"
                  />
                )}
                {!page.avatarUrl && (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#f2c879]/25 bg-[#f2c879] text-xl font-semibold text-[#17120a] shadow-2xl shadow-black/50 sm:h-20 sm:w-20 sm:text-2xl">
                    {initials || firstName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/45">
                    Personal site
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold leading-none text-white sm:text-5xl">
                    {page.displayName}
                  </h1>
                </div>
              </div>

              {page.bio && (
                <p className="mt-7 max-w-2xl text-base leading-7 text-white/70 sm:mt-8 sm:text-xl sm:leading-8">
                  {page.bio}
                </p>
              )}

              <div className="mt-7 sm:mt-9" />
            </div>

            <div className="border-t border-[#f2c879]/12 bg-white/[0.025] p-4 sm:p-5 lg:border-l lg:border-t-0">
              <div className="rounded-[24px] border border-[#f2c879]/14 bg-black/35 p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/45">
                  Ask the profile
                </p>
                <div className="mt-4 rounded-2xl border border-[#f2c879]/14 bg-white/[0.045] px-4 py-3 text-sm text-white/58">
                  What is {firstName} building?
                </div>
                <div className="mt-3 rounded-2xl border border-[#f2c879]/14 bg-white/[0.045] px-4 py-3 text-sm text-white/58">
                  What should I know before reaching out?
                </div>
                {hasMessenger && (
                  <OpenChatButton
                    mode={page.chatEnabled ? 'chat' : 'contact'}
                    className="mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-[#17120a] transition hover:brightness-110"
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    {page.chatEnabled ? 'Start chat' : 'Send message'}
                  </OpenChatButton>
                )}
              </div>
            </div>
          </div>
        </section>

        {pageLinks.length > 0 && (
          <section
            className="mt-5 w-full overflow-hidden rounded-[28px] border border-[#f2c879]/18 bg-[#151515]/82 p-4 backdrop-blur-xl sm:p-6"
            style={{ boxShadow: `0 28px 95px -62px ${theme.accentColor}` }}
          >
            <div className="mb-5">
              <div>
                <p
                  className="text-[11px] font-medium uppercase tracking-[0.32em]"
                  style={{ color: theme.accentColor }}
                >
                  Find Me Online
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                  Links worth opening
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

        <section className="mt-5 grid gap-3 md:grid-cols-3">
          {modeCards.map((card) => {
            const content = (
              <>
                <div className="mb-6 h-28 overflow-hidden rounded-2xl border border-white/10 bg-black/28">
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
                      <div className="absolute left-4 top-4 rotate-[-4deg] border-2 border-[#f2c879] bg-black px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#f2c879] shadow-[6px_6px_0_#f08b5f]">
                        Public Vibe Inspection
                      </div>
                      <div className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#f08b5f] text-xl font-black text-white shadow-[0_0_30px_rgba(240,139,95,0.32)]">
                        82
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <div
                    className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
                    style={{ color: card.accent }}
                  >
                    {card.mark}
                  </div>
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-white">{card.title}</h2>
                <p className="mt-4 text-sm leading-6 text-white/60">{card.description}</p>
                {!card.enabled && (
                  <p className="mt-7 text-sm font-semibold text-white/38">
                    Not ready yet
                  </p>
                )}
              </>
            );

            return card.enabled ? (
              <Link
                key={card.key}
                href={card.href}
                className="group min-h-64 rounded-[28px] border border-[#f2c879]/14 bg-[#141414]/84 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#f2c879]/30 hover:bg-[#191813]"
              >
                {content}
              </Link>
            ) : (
              <div
                key={card.key}
                className="min-h-64 rounded-[28px] border border-[#f2c879]/10 bg-[#141414]/74 p-6 opacity-55 backdrop-blur-xl"
              >
                {content}
              </div>
            );
          })}
        </section>

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
          <Link
            href="/"
            className="font-medium text-white/50 transition-colors hover:text-white"
          >
            LinkChat
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
