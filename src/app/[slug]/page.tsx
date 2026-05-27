import type { Metadata } from 'next';
import { Instrument_Serif } from 'next/font/google';
import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AnimatedReveal } from '@/components/public/animated-reveal';
import { LayoutRenderer } from '@/components/public/layout-renderer';
import { PageSectionRenderer } from '@/components/public/page-section-renderer';
import { ProfileHero } from '@/components/public/profile-hero';
import { RoamingCharacter } from '@/components/public/roaming-character';
import { TrackableSection } from '@/components/public/trackable-section';
import { VideoEmbed } from '@/components/public/video-embed';
import type { ProjectCardData } from '@/components/public/widgets';
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
    modeContent,
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
      title: `The ${firstName} Wiki`,
      href: `/${slug}/encyclopedia`,
      enabled: enabledPages.encyclopedia,
      cta: 'Read the entry',
      hint: 'A reference-style page with citations, written by AI.',
      mark: 'Wiki',
    },
    {
      key: 'newspaper',
      title: `The ${firstName} Times`,
      href: `/${slug}/newspaper`,
      enabled: enabledPages.newspaper,
      cta: 'Read today’s edition',
      hint: 'A daily-paper front page — what they’re shipping right now.',
      mark: 'Press',
    },
    {
      key: 'roast',
      title: `Roast ${firstName}`,
      href: `/${slug}/roast`,
      enabled: enabledPages.roast,
      cta: 'Read the roast',
      hint: 'An unserious AI takedown of the whole profile.',
      mark: 'Roast',
    },
  ] as const;
  const enabledModeCards = modeCards
    .filter((card) => card.enabled)
    .map((card) => ({
      ...card,
      preview: modePreviews?.[card.key] || '',
    }));

  // The aha moment — speech bubble next to the avatar that types
  // through real AI-generated lines. Prefer the newspaper headline
  // (shortest + most quotable), then the wiki first sentence, then
  // the roast hook. Falls back to a friendly greeting + bio if none
  // are ready. Each line is plain text, <= 180 chars.
  const greetingLines: string[] = [];
  const newspaperPreview = modePreviews?.newspaper;
  if (newspaperPreview) {
    const headline = newspaperPreview.split('—')[0]?.trim();
    if (headline) greetingLines.push(`📰 ${headline}`);
  }
  const wikiPreview = modePreviews?.encyclopedia;
  if (wikiPreview) {
    const firstSentence = wikiPreview.split(/(?<=[.!?])\s+/)[0] ?? '';
    if (firstSentence) greetingLines.push(firstSentence);
  }
  const roastPreview = modePreviews?.roast;
  if (roastPreview) {
    const firstClause = roastPreview.split(/[.—]/)[0]?.trim();
    if (firstClause) greetingLines.push(`🔥 ${firstClause}.`);
  }
  if (greetingLines.length === 0) {
    greetingLines.push(`Hey, I'm ${firstName}.`);
    if (page.bio) greetingLines.push(page.bio);
  }

  // Social links live in the hero column as icon-only chips (identity,
  // not content). Projects stay in the right-column stream alongside
  // the AI mode cards (content, with visual weight).
  const socialLinks = pageLinks.map((l) => ({
    id: l.id,
    title: l.title,
    url: l.url,
    icon: l.icon,
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
      className="relative min-h-screen overflow-x-clip bg-karte-bg text-karte-text antialiased"
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
            socialLinks={socialLinks}
          />

          {/* Right column — scrolling content stream */}
          <div className="space-y-10 lg:py-12">
            {page.videoUrl && (
              <AnimatedReveal>
                <VideoEmbed url={page.videoUrl} accentColor={theme.accentColor} />
              </AnimatedReveal>
            )}

            {projectData.length > 0 && (
              <section>
                <AnimatedReveal>
                  <div className="mb-5">
                    <p
                      className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4"
                    >
                      <span style={{ color: theme.accentColor }}>·</span> Projects
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.015em] text-karte-text sm:text-[28px]">
                      Things {firstName} is building
                    </h2>
                    <p className="mt-1.5 text-[14px] leading-[1.55] text-karte-text-3">
                      {projectData.length} {projectData.length === 1 ? 'project' : 'projects'} — each one is a separate landing page, links out below.
                    </p>
                  </div>
                </AnimatedReveal>
                <LayoutRenderer
                  links={[]}
                  projects={projectData}
                  accentColor={theme.accentColor}
                  slug={slug}
                />
              </section>
            )}

            {enabledModeCards.length > 0 && (
              <AnimatedReveal as="section">
                <div className="mb-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
                    <span style={{ color: theme.accentColor }}>·</span> AI surfaces
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.015em] text-karte-text sm:text-[28px]">
                    Three takes, same source
                  </h2>
                  <p className="mt-1.5 text-[14px] leading-[1.55] text-karte-text-3">
                    Each card is the actual opening of a full AI-written page about {firstName}. Click in.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {enabledModeCards.map((card) => {
                    // ── ENCYCLOPEDIA — compact wiki feel ──
                    if (card.key === 'encyclopedia') {
                      return (
                        <Link
                          key={card.key}
                          href={card.href}
                          className="group relative flex flex-col overflow-hidden rounded-2xl border border-karte-border-strong bg-[#0d0f12] transition-all duration-200 ease-[var(--karte-ease)] hover:-translate-y-0.5 hover:border-white/20"
                        >
                          <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 pt-3 pb-2 text-[9px] font-medium uppercase tracking-[0.2em]">
                            <span className="border-b-2 border-[#6ea8fe] pb-[5px] -mb-[7px] text-[#6ea8fe]">
                              Article
                            </span>
                            <span className="text-karte-text-4">Talk</span>
                            <span className="text-karte-text-4">History</span>
                          </div>
                          <div className="flex flex-1 flex-col px-4 py-3.5">
                            <h3
                              className="text-[17px] leading-tight text-karte-text"
                              style={{ fontFamily: serif.style.fontFamily }}
                            >
                              {card.title}
                            </h3>
                            {card.preview && (
                              <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.5] text-karte-text-3">
                                {card.preview}
                              </p>
                            )}
                            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[#6ea8fe] underline decoration-[#6ea8fe]/40 underline-offset-2 transition-colors duration-200 group-hover:decoration-[#6ea8fe]">
                              {card.cta}
                              <span aria-hidden="true" className="no-underline transition-transform duration-200 group-hover:translate-x-0.5">
                                →
                              </span>
                            </span>
                          </div>
                        </Link>
                      );
                    }

                    // ── NEWSPAPER — compact broadsheet feel ──
                    if (card.key === 'newspaper') {
                      const paper = modeContent?.newspaper;
                      return (
                        <Link
                          key={card.key}
                          href={card.href}
                          className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#f4efe4] text-[#17130d] transition-all duration-200 ease-[var(--karte-ease)] hover:-translate-y-0.5"
                          style={{
                            boxShadow:
                              'inset 0 0 0 1px rgba(23,19,13,0.12), 0 8px 24px -16px rgba(0,0,0,0.5)',
                          }}
                        >
                          <div className="flex items-center justify-between border-b-[3px] border-double border-[#17130d]/55 px-4 pt-2.5 pb-1.5 text-[8px] font-medium uppercase tracking-[0.22em] text-[#17130d]/70">
                            <span>VOL. I</span>
                            <span>{paper?.dateline?.split(',')[0] || 'Latest'}</span>
                          </div>
                          <div className="flex flex-1 flex-col px-4 py-3">
                            <h3
                              className="text-center text-[18px] font-bold leading-[0.98] tracking-[-0.005em]"
                              style={{
                                fontFamily: serif.style.fontFamily,
                                fontStyle: 'normal',
                              }}
                            >
                              {paper?.mastheadName || card.title}
                            </h3>
                            {card.preview && (
                              <p
                                className="mt-2.5 line-clamp-2 text-[12px] font-bold uppercase leading-[1.25] tracking-[-0.005em]"
                                style={{ fontFamily: serif.style.fontFamily, fontStyle: 'normal' }}
                              >
                                {paper?.headline || card.preview}
                              </p>
                            )}
                            <span className="mt-3 inline-flex items-center gap-1 self-start border-b border-[#17130d]/30 pb-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#17130d] transition-colors duration-200 group-hover:border-[#17130d]">
                              {card.cta}
                              <span aria-hidden="true" className="border-none transition-transform duration-200 group-hover:translate-x-0.5">
                                →
                              </span>
                            </span>
                          </div>
                        </Link>
                      );
                    }

                    // ── ROAST — compact spotlight ──
                    return (
                      <Link
                        key={card.key}
                        href={card.href}
                        className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#170611] p-4 transition-all duration-200 ease-[var(--karte-ease)] hover:-translate-y-0.5"
                      >
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -top-12 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-[#ff4d6d]/30 blur-3xl"
                        />
                        <div className="relative">
                          <div className="inline-block rotate-[-3deg] border-2 border-[#ff4d6d] bg-black px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#ff4d6d]">
                            🔥 Roast
                          </div>
                          <h3 className="mt-3 text-[17px] font-bold tracking-[-0.015em] text-white">
                            {card.title}
                          </h3>
                          {card.preview && (
                            <p className="mt-1.5 line-clamp-2 text-[12px] italic leading-[1.5] text-white/80">
                              &ldquo;{card.preview}&rdquo;
                            </p>
                          )}
                          <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff4d6d] transition-colors duration-200 group-hover:text-[#ff8aa3]">
                            {card.cta}
                            <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
                              →
                            </span>
                          </span>
                        </div>
                      </Link>
                    );
                  })}
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

            <div className="mt-4 flex justify-center pt-8">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 rounded-full border border-karte-border bg-white/[0.02] px-3 py-1.5 text-[11px] font-medium text-karte-text-4 transition-all duration-200 ease-[var(--karte-ease)] hover:border-white/15 hover:bg-white/[0.04] hover:text-karte-text-3"
              >
                <span className="font-mono uppercase tracking-[0.18em]">
                  built on
                </span>
                <span
                  className="text-karte-text-3 transition-colors duration-200 group-hover:text-karte-text"
                  style={{ fontFamily: serif.style.fontFamily, fontStyle: 'italic' }}
                >
                  Karte
                </span>
                <span
                  aria-hidden="true"
                  className="text-karte-text-4 transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  ↗
                </span>
              </Link>
            </div>
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

      {/* Codex-pets style mascot — the user's avatar (or a future
          custom cartoon character — pages.petUrl is on the roadmap)
          walks along the bottom of the viewport and pops up with
          AI-generated lines every 6-14 seconds. Click → opens chat. */}
      <RoamingCharacter
        avatarUrl={page.avatarUrl}
        displayName={page.displayName}
        accentColor={theme.accentColor}
        lines={greetingLines}
      />
    </main>
  );
}
