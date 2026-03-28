'use client';

import { useRef } from 'react';
import { Playfair_Display } from 'next/font/google';
import type { NewspaperContent } from '@/lib/generated-page-types';
import { ShareControls } from './share-controls';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
});

interface NewspaperFrontPageProps {
  content: NewspaperContent;
  displayName: string;
  avatarUrl: string | null;
  slug: string;
  accentColor: string;
}

/** Derive category labels from content to populate the nav bar */
function deriveCategories(content: NewspaperContent): string[] {
  const cats = ['Profile', 'Career', 'Projects', 'Life'];
  // If there are secondary stories, try to pull a few unique words for variety
  if (content.secondaryStories.length > 0) {
    const extraCats = ['Updates', 'Spotlight', 'Features', 'Insights'];
    // Replace last categories if we have enough stories
    for (let i = 0; i < Math.min(content.secondaryStories.length, 2); i++) {
      cats[cats.length - 1 - i] = extraCats[i];
    }
  }
  return cats;
}

function CategoryNav({ categories }: { categories: string[] }) {
  return (
    <nav className="border-b-2 border-gray-900 bg-gray-900">
      <div className="flex items-center gap-0 overflow-x-auto">
        {categories.map((cat, i) => (
          <span
            key={i}
            className="cursor-default whitespace-nowrap px-4 py-2.5 text-xs font-semibold tracking-wider text-gray-200 uppercase transition-colors hover:bg-gray-800 hover:text-white sm:px-5 sm:text-[13px]"
          >
            {cat}
          </span>
        ))}
      </div>
    </nav>
  );
}

function StoryCard({
  headline,
  body,
  index,
}: {
  headline: string;
  body: string;
  index: number;
}) {
  const paragraphs = body
    .split('\n')
    .filter((p) => p.trim())
    .slice(0, 2);

  return (
    <article className="group">
      {/* Category label */}
      <span className="mb-1.5 inline-block text-[10px] font-bold tracking-widest text-red-600 uppercase">
        {index === 0 ? 'Feature' : index === 1 ? 'Profile' : 'Spotlight'}
      </span>
      <h3
        className="mb-2 text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-red-700 sm:text-xl"
        style={playfair.style}
      >
        {headline}
      </h3>
      {paragraphs.map((para, j) => (
        <p
          key={j}
          className="mt-1 text-[13px] leading-relaxed text-gray-600"
        >
          {para.length > 150 ? para.slice(0, 150) + '...' : para}
        </p>
      ))}
      <span className="mt-2 inline-block text-xs font-semibold text-red-600 uppercase">
        Read more &rarr;
      </span>
    </article>
  );
}

function TrendingSidebar({
  facts,
  mood,
}: {
  facts: string[];
  mood: string;
}) {
  return (
    <aside className="space-y-5">
      {/* Trending / Quick Facts */}
      <div>
        <div className="mb-3 flex items-center gap-2 border-b-2 border-red-600 pb-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" />
          <h4 className="text-xs font-black tracking-widest text-gray-900 uppercase">
            Trending Now
          </h4>
        </div>
        <ol className="space-y-2.5">
          {facts.map((fact, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-gray-900 text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <span className="text-[13px] leading-snug text-gray-700">
                {fact}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Mood / Weather widget */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <svg
            className="h-5 w-5 text-amber-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs font-bold tracking-wider text-gray-800 uppercase">
            Today&apos;s Forecast
          </span>
        </div>
        <p className="text-[13px] leading-relaxed text-gray-700 italic">
          {mood}
        </p>
      </div>
    </aside>
  );
}

export function NewspaperFrontPage({
  content,
  displayName,
  avatarUrl,
  slug,
  accentColor,
}: NewspaperFrontPageProps) {
  const newspaperRef = useRef<HTMLDivElement>(null);
  const categories = deriveCategories(content);

  const leadParagraphs = content.leadStory.body
    .split('\n')
    .filter((p) => p.trim().length > 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Newspaper container */}
      <div ref={newspaperRef}>
        <div
          className="overflow-hidden rounded-xl shadow-2xl"
          style={{ backgroundColor: '#faf9f6' }}
        >
          {/* ============================================= */}
          {/* CATEGORY NAV BAR                              */}
          {/* ============================================= */}
          <CategoryNav categories={categories} />

          {/* ============================================= */}
          {/* MASTHEAD                                      */}
          {/* ============================================= */}
          <div className="border-b border-gray-200 px-5 pt-5 pb-4 sm:px-8 sm:pt-6">
            {/* Thin red line accent at very top */}
            <div className="mb-4 h-0.5 bg-red-600" />

            {/* Masthead row */}
            <div className="flex items-end justify-between">
              <p className="text-[10px] tracking-wider text-gray-400 uppercase sm:text-xs">
                {content.dateline}
              </p>
              <h1
                className="text-center text-3xl font-black tracking-tight text-gray-900 sm:text-4xl md:text-5xl"
                style={playfair.style}
              >
                {content.mastheadName}
              </h1>
              <p className="text-[10px] tracking-wider text-gray-400 uppercase sm:text-xs">
                Vol. I
              </p>
            </div>

            {/* Bottom rule */}
            <div className="mt-3 h-px bg-gray-200" />
            <div className="mt-0.5 h-[2px] bg-gray-900" />
          </div>

          {/* ============================================= */}
          {/* HERO LEAD STORY                               */}
          {/* ============================================= */}
          <div className="border-b border-gray-200 px-5 py-6 sm:px-8 sm:py-8">
            {/* Breaking badge */}
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded bg-red-600 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white uppercase">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                Main Story
              </span>
            </div>

            {/* Hero layout: text + avatar */}
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {/* Text content */}
              <div className="flex-1">
                <h2
                  className="mb-2 text-2xl font-black leading-tight tracking-tight text-gray-900 sm:text-3xl md:text-4xl"
                  style={playfair.style}
                >
                  {content.leadStory.headline}
                </h2>

                <p
                  className="mb-4 text-base leading-snug text-gray-500 italic sm:text-lg"
                  style={playfair.style}
                >
                  {content.leadStory.subheadline}
                </p>

                {/* Lead paragraph (larger text) */}
                {leadParagraphs.length > 0 && (
                  <p className="mb-3 text-[15px] leading-relaxed text-gray-800 sm:text-base">
                    {leadParagraphs[0]}
                  </p>
                )}

                {/* Remaining paragraphs */}
                {leadParagraphs.slice(1).map((para, i) => (
                  <p
                    key={i}
                    className="mt-2.5 text-[13px] leading-relaxed text-gray-600 sm:text-sm"
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* Avatar as "article image" */}
              {avatarUrl && (
                <div className="flex-shrink-0 md:w-56 lg:w-64">
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-48 w-full object-cover md:h-56 lg:h-64"
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-gray-400 italic">
                    {displayName} | Photo: LinkChat
                  </p>
                </div>
              )}
            </div>

            {/* Pull quote */}
            {content.leadStory.pullQuote && (
              <div className="mt-6 border-l-4 border-red-600 bg-gray-50 py-4 pl-5 pr-4">
                <blockquote
                  className="text-lg font-bold leading-snug text-gray-800 italic sm:text-xl"
                  style={playfair.style}
                >
                  &ldquo;{content.leadStory.pullQuote}&rdquo;
                </blockquote>
              </div>
            )}
          </div>

          {/* ============================================= */}
          {/* 3-COLUMN GRID: Stories + Trending             */}
          {/* ============================================= */}
          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {/* LEFT COLUMN: Secondary stories */}
              <div className="space-y-5 md:col-span-4">
                {content.secondaryStories.slice(0, 2).map((story, i) => (
                  <div key={i}>
                    {i > 0 && (
                      <hr className="mb-5 border-t border-gray-200" />
                    )}
                    <StoryCard
                      headline={story.headline}
                      body={story.body}
                      index={i}
                    />
                  </div>
                ))}
              </div>

              {/* CENTER COLUMN: Third story or extended lead */}
              <div className="border-gray-200 md:col-span-4 md:border-x md:px-6">
                {content.secondaryStories.length > 2 ? (
                  <StoryCard
                    headline={content.secondaryStories[2].headline}
                    body={content.secondaryStories[2].body}
                    index={2}
                  />
                ) : content.secondaryStories.length > 1 ? (
                  /* If only 2 secondary stories, show an expanded version of the second */
                  <div>
                    <span className="mb-1.5 inline-block text-[10px] font-bold tracking-widest text-red-600 uppercase">
                      In Depth
                    </span>
                    <h3
                      className="mb-2 text-lg font-bold leading-snug text-gray-900 sm:text-xl"
                      style={playfair.style}
                    >
                      More on {displayName}
                    </h3>
                    {content.secondaryStories[1].body
                      .split('\n')
                      .filter((p) => p.trim())
                      .map((para, j) => (
                        <p
                          key={j}
                          className="mt-1.5 text-[13px] leading-relaxed text-gray-600"
                        >
                          {para}
                        </p>
                      ))}
                  </div>
                ) : (
                  /* Fallback: use lead story continuation */
                  <div>
                    <span className="mb-1.5 inline-block text-[10px] font-bold tracking-widest text-red-600 uppercase">
                      Analysis
                    </span>
                    <h3
                      className="mb-2 text-lg font-bold leading-snug text-gray-900 sm:text-xl"
                      style={playfair.style}
                    >
                      The Full Story
                    </h3>
                    {leadParagraphs.slice(1, 4).map((para, j) => (
                      <p
                        key={j}
                        className="mt-1.5 text-[13px] leading-relaxed text-gray-600"
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Trending sidebar */}
              <div className="md:col-span-4">
                <TrendingSidebar
                  facts={content.sidebar.facts}
                  mood={content.sidebar.mood}
                />
              </div>
            </div>
          </div>

          {/* ============================================= */}
          {/* FAKE ADS                                      */}
          {/* ============================================= */}
          <div className="border-t border-gray-200 bg-gray-50 px-5 py-5 sm:px-8 sm:py-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {content.fakeAds.map((ad, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center transition-shadow hover:shadow-sm"
                >
                  <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                    Sponsored
                  </p>
                  <p
                    className="mt-1 text-xs font-bold leading-snug text-gray-700 italic"
                    style={playfair.style}
                  >
                    {ad}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================= */}
          {/* FOOTER                                        */}
          {/* ============================================= */}
          <div className="border-t border-gray-900 bg-gray-900 px-5 py-3 sm:px-8">
            <div className="flex items-center justify-between">
              <p className="text-[10px] tracking-widest text-gray-500 uppercase">
                Published by LinkChat
              </p>
              <p
                className="text-[10px] tracking-wider text-gray-500 italic"
                style={playfair.style}
              >
                A Personal Newspaper Experience
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Share controls (outside the newspaper) */}
      <ShareControls
        slug={slug}
        accentColor={accentColor}
        newspaperRef={newspaperRef}
      />
    </div>
  );
}
