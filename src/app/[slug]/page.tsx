import type { Metadata } from 'next';
import { Instrument_Serif } from 'next/font/google';
import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AnimatedReveal } from '@/components/public/animated-reveal';
import { LayoutRenderer } from '@/components/public/layout-renderer';
import { PageSectionRenderer } from '@/components/public/page-section-renderer';
import { ProfileHero } from '@/components/public/profile-hero';
import { TrackableSection } from '@/components/public/trackable-section';
import { VideoEmbed } from '@/components/public/video-embed';
import type { LinkCardData, ProjectCardData } from '@/components/public/widgets';
import { getProfileVariant } from '@/lib/profile-variants';
import { resolveThemeConfig } from '@/lib/themes';

import { getFullPageData } from './_lib/get-page-data';

// ChatWidget is a 700+ line client bundle — code-split it so initial JS
// stays small. Still renders server-side initially as a fixed button.
const ChatWidget = nextDynamic(
  () => import('@/components/public/chat-widget').then((m) => m.ChatWidget),
);

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic' });

// Force into the static-renderable pipeline so the OpenNext incremental
// cache + Next.js Cache-Control headers actually apply.
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

  const {
    page,
    links: pageLinks,
    projects: pageProjects,
    sections: publicSections,
    readyPages,
    modePreviews,
  } = data;
  const theme = resolveThemeConfig(page.themeConfig);
  const variant = getProfileVariant(undefined);

  const enabledPages = {
    encyclopedia: (page.encyclopediaEnabled ?? false) && readyPages.has('encyclopedia'),
    roast: (page.roastEnabled ?? false) && readyPages.has('roast'),
    newspaper: (page.newspaperEnabled ?? false) && readyPages.has('newspaper'),
  };
  const firstName = page.displayName.split(/\s+/)[0] || page.displayName;
  const hasMessenger = (page.chatEnabled ?? false) || page.dmMode !== 'off';

  const modeCards = [
    {
      key: 'encyclopedia',
      title: 'Encyclopedia',
      href: `/${slug}/encyclopedia`,
      enabled: enabledPages.encyclopedia,
      tagline: 'Reference entry',
      fallback: `Wikipedia-style page covering ${firstName}'s work, background, and public context.`,
      mark: 'Wiki',
    },
    {
      key: 'newspaper',
      title: 'Newspaper',
      href: `/${slug}/newspaper`,
      enabled: enabledPages.newspaper,
      tagline: 'Front page edition',
      fallback: `A daily-paper treatment of what ${firstName} is building, shipping, and thinking about.`,
      mark: 'Times',
    },
    {
      key: 'roast',
      title: 'Roast Me',
      href: `/${slug}/roast`,
      enabled: enabledPages.roast,
      tagline: 'Shareable critique',
      fallback: `Unserious takedown of ${firstName}'s links, projects, and internet presence.`,
      mark: 'Roast',
    },
  ] as const;
  const enabledModeCards = modeCards
    .filter((card) => card.enabled)
    .map((card) => ({
      ...card,
      preview: modePreviews?.[card.key] || card.fallback,
    }));

  // Map DB rows → variant data shapes consumed by the renderer.
  const linkData: LinkCardData[] = pageLinks.map((l) => ({
    id: l.id,
    title: l.title,
    url: l.url,
    icon: l.icon,
    imageUrl: l.imageUrl,
    body: l.body,
  }));
  const projectData: ProjectCardData[] = pageProjects.map((p) => ({
    id: p.id,
    title: p.title,
    url: p.url,
    description: p.description,
    imageUrl: p.imageUrl,
  }));

  return (
    <main
      className="relative min-h-screen overflow-x-hidden bg-karte-bg text-karte-text antialiased"
      style={{
        background: `radial-gradient(circle at 0% 0%, ${theme.accentColor}1a, transparent 45%), radial-gradient(circle at 100% 100%, ${theme.accentColor}10, transparent 50%), linear-gradient(180deg, #0a0a0a 0%, #0b0b0c 50%, #0a0a0a 100%)`,
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_top,#000_30%,transparent_75%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-8 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
          <ProfileHero
            displayName={page.displayName}
            bio={page.bio}
            avatarUrl={page.avatarUrl}
            location={page.location}
            accentColor={theme.accentColor}
            serifFontVar={serif.style.fontFamily}
            chatEnabled={page.chatEnabled ?? false}
            hasMessenger={hasMessenger}
            primaryChatCta={
              page.chatEnabled ? variant.primaryCta : 'Send a message'
            }
            calendarUrl={page.calendarUrl}
            newsletterUrl={page.newsletterUrl}
            tipUrl={page.tipUrl}
          />

          {/* Right column — scrolling content stream */}
          <div className="space-y-10 lg:py-12">
            {page.videoUrl && (
              <AnimatedReveal>
                <VideoEmbed url={page.videoUrl} accentColor={theme.accentColor} />
              </AnimatedReveal>
            )}

            {(linkData.length > 0 || projectData.length > 0) && (
              <LayoutRenderer
                links={linkData}
                projects={projectData}
                accentColor={theme.accentColor}
                slug={slug}
              />
            )}

            {enabledModeCards.length > 0 && (
              <AnimatedReveal as="section">
                <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
                  <span style={{ color: theme.accentColor }}>·</span> Generated by AI from {firstName}&apos;s sources
                </p>
                <div className="space-y-3">
                  {enabledModeCards.map((card) => (
                    <Link
                      key={card.key}
                      href={card.href}
                      className="group block overflow-hidden rounded-3xl border border-karte-border bg-karte-surface/70 p-5 backdrop-blur-xl transition-all duration-200 ease-[var(--karte-ease)] hover:-translate-y-0.5 hover:border-white/15 hover:bg-karte-surface"
                      style={{
                        borderColor: `${theme.accentColor}1f`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em]"
                            style={{
                              color: theme.accentColor,
                              backgroundColor: `${theme.accentColor}14`,
                            }}
                          >
                            {card.mark}
                          </span>
                          <span className="text-[11px] text-karte-text-4">
                            {card.tagline}
                          </span>
                        </div>
                        <span
                          aria-hidden="true"
                          className="text-karte-text-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        >
                          →
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold tracking-[-0.01em] text-karte-text">
                        {card.title}
                      </h3>
                      <p
                        className="mt-2 line-clamp-3 text-[13.5px] leading-[1.55] text-karte-text-3"
                        style={
                          card.key === 'roast'
                            ? { fontStyle: 'italic' }
                            : undefined
                        }
                      >
                        {card.key === 'newspaper' && card.preview && (
                          <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.18em] text-karte-text-4">
                            HEADLINE ·
                          </span>
                        )}
                        {card.preview}
                      </p>
                    </Link>
                  ))}
                </div>
              </AnimatedReveal>
            )}

            {publicSections.length > 0 && (
              <section className="space-y-4">
                {publicSections.map((section, i) => (
                  <AnimatedReveal key={section.id} delay={Math.min(i * 60, 240)}>
                    <TrackableSection
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
                  </AnimatedReveal>
                ))}
              </section>
            )}

            <p className="pt-8 text-[12px] text-karte-text-4">
              Powered by{' '}
              <Link
                href="/"
                className="font-medium text-karte-text-3 transition-colors duration-200 hover:text-karte-text"
              >
                Karte
              </Link>
            </p>
          </div>
        </div>
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
