'use client';

import { Playfair_Display } from 'next/font/google';
import { useRef } from 'react';

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
    <nav className="border-y border-stone-900 bg-[#f7f1df]">
      <div className="flex items-center justify-center gap-0 overflow-x-auto">
        {categories.map((cat, i) => (
          <span
            key={i}
            className="cursor-default whitespace-nowrap border-l border-stone-300 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-800 first:border-l-0 sm:px-5"
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
      <span className="mb-2 inline-block border-b border-stone-900 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900">
        {index === 0 ? 'Feature' : index === 1 ? 'Profile' : 'Spotlight'}
      </span>
      <h3
        className="mb-2 text-xl font-black leading-[1.02] text-stone-950 transition-colors group-hover:text-stone-700 sm:text-2xl"
        style={playfair.style}
      >
        {headline}
      </h3>
      {paragraphs.map((para, j) => (
        <p
          key={j}
          className="mt-2 text-[13px] leading-relaxed text-stone-700"
        >
          {para.length > 150 ? para.slice(0, 150) + '...' : para}
        </p>
      ))}
      <span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
        Continued on profile
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
        <div className="mb-3 border-y-2 border-stone-900 py-2 text-center">
          <h4 className="text-xs font-black uppercase tracking-[0.24em] text-stone-950">
            Index
          </h4>
        </div>
        <ol className="space-y-2.5">
          {facts.map((fact, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center bg-stone-900 text-[10px] font-bold text-[#f7f1df]">
                {i + 1}
              </span>
              <span className="text-[13px] leading-snug text-stone-700">
                {fact}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Mood / Weather widget */}
      <div className="border-2 border-stone-900 bg-[#fffaf0] p-4">
        <div className="mb-2 border-b border-stone-900 pb-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-stone-900">
            Forecast
          </span>
        </div>
        <p className="text-[13px] leading-relaxed text-stone-700 italic">
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
    <div className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-5">
      <div ref={newspaperRef}>
        <div
          className="border border-stone-900 shadow-[0_40px_90px_-70px_rgba(0,0,0,0.9)]"
          style={{ backgroundColor: '#f7f1df' }}
        >
          <div className="px-4 pt-4 sm:px-8 sm:pt-6">
            <div className="flex items-center justify-between border-y border-stone-900 py-2 text-[10px] uppercase tracking-[0.18em] text-stone-700 sm:text-xs">
              <p>{content.dateline}</p>
              <p>LinkChat Edition</p>
              <p>Vol. I</p>
            </div>
            <div className="py-4 text-center">
              <h1
                className="text-5xl font-black leading-none tracking-[-0.03em] text-stone-950 sm:text-7xl md:text-8xl"
                style={playfair.style}
              >
                {content.mastheadName}
              </h1>
              <p className="mx-auto mt-2 max-w-2xl text-xs uppercase tracking-[0.24em] text-stone-600">
                All the profile that is fit to print
              </p>
            </div>
          </div>

          <CategoryNav categories={categories} />

          <div className="border-b-2 border-stone-900 px-4 py-6 sm:px-8 sm:py-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="flex-1">
                <span className="mb-3 inline-block border border-stone-900 px-2 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-stone-900">
                  Main Story
                </span>
                <h2
                  className="mb-3 text-4xl font-black leading-[0.95] tracking-[-0.03em] text-stone-950 sm:text-5xl md:text-6xl"
                  style={playfair.style}
                >
                  {content.leadStory.headline}
                </h2>

                <p
                  className="mb-5 border-y border-stone-300 py-3 text-lg leading-snug text-stone-700 italic sm:text-xl"
                  style={playfair.style}
                >
                  {content.leadStory.subheadline}
                </p>

                {leadParagraphs.length > 0 && (
                  <p className="mb-3 text-[16px] leading-relaxed text-stone-900 first-letter:float-left first-letter:mr-2 first-letter:text-6xl first-letter:font-black first-letter:leading-[0.85] sm:text-[17px]">
                    {leadParagraphs[0]}
                  </p>
                )}

                {leadParagraphs.slice(1).map((para, i) => (
                  <p
                    key={i}
                    className="mt-2.5 text-[13px] leading-relaxed text-stone-700 sm:text-sm"
                  >
                    {para}
                  </p>
                ))}
              </div>

              {avatarUrl && (
                <figure className="border border-stone-900 bg-[#fffaf0] p-2">
                  <div className="overflow-hidden border border-stone-300">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-72 w-full object-cover grayscale"
                    />
                  </div>
                  <figcaption className="mt-2 text-[10px] uppercase tracking-[0.12em] text-stone-500">
                    {displayName} | Photo: LinkChat
                  </figcaption>
                </figure>
              )}
            </div>

            {content.leadStory.pullQuote && (
              <div className="mt-6 border-y-2 border-stone-900 py-4 text-center">
                <blockquote
                  className="mx-auto max-w-3xl text-2xl font-bold leading-snug text-stone-950 italic sm:text-3xl"
                  style={playfair.style}
                >
                  “{content.leadStory.pullQuote}”
                </blockquote>
              </div>
            )}
          </div>

          <div className="px-4 py-6 sm:px-8 sm:py-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="space-y-5 md:col-span-4">
                {content.secondaryStories.slice(0, 2).map((story, i) => (
                  <div key={i}>
                    {i > 0 && (
                      <hr className="mb-5 border-t border-stone-300" />
                    )}
                    <StoryCard
                      headline={story.headline}
                      body={story.body}
                      index={i}
                    />
                  </div>
                ))}
              </div>

              <div className="border-stone-300 md:col-span-4 md:border-x md:px-6">
                {content.secondaryStories.length > 2 ? (
                  <StoryCard
                    headline={content.secondaryStories[2].headline}
                    body={content.secondaryStories[2].body}
                    index={2}
                  />
                ) : content.secondaryStories.length > 1 ? (
                  /* If only 2 secondary stories, show an expanded version of the second */
                  <div>
                    <span className="mb-2 inline-block border-b border-stone-900 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900">
                      In Depth
                    </span>
                    <h3
                      className="mb-2 text-xl font-black leading-snug text-stone-950 sm:text-2xl"
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
                          className="mt-1.5 text-[13px] leading-relaxed text-stone-700"
                        >
                          {para}
                        </p>
                      ))}
                  </div>
                ) : (
                  /* Fallback: use lead story continuation */
                  <div>
                    <span className="mb-2 inline-block border-b border-stone-900 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900">
                      Analysis
                    </span>
                    <h3
                      className="mb-2 text-xl font-black leading-snug text-stone-950 sm:text-2xl"
                      style={playfair.style}
                    >
                      The Full Story
                    </h3>
                    {leadParagraphs.slice(1, 4).map((para, j) => (
                      <p
                        key={j}
                        className="mt-1.5 text-[13px] leading-relaxed text-stone-700"
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-4">
                <TrendingSidebar
                  facts={content.sidebar.facts}
                  mood={content.sidebar.mood}
                />
              </div>
            </div>
          </div>

          <div className="border-t-2 border-stone-900 bg-[#efe5c8] px-4 py-5 sm:px-8 sm:py-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {content.fakeAds.map((ad, i) => (
                <div
                  key={i}
                  className="border border-stone-900 bg-[#f7f1df] px-4 py-3 text-center"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                    Advertisement
                  </p>
                  <p
                    className="mt-1 text-xs font-bold leading-snug text-stone-800 italic"
                    style={playfair.style}
                  >
                    {ad}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-stone-900 bg-stone-950 px-5 py-3 sm:px-8">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-stone-400">
                Published by LinkChat
              </p>
              <p
                className="text-[10px] tracking-wider text-stone-400 italic"
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
