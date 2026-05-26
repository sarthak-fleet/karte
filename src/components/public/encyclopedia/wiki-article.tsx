import sanitizeHtml from 'sanitize-html';

import type { EncyclopediaContent } from '@/lib/generated-page-types';

import { WikiInfobox } from './wiki-infobox';
import { WikiTocFromHtml } from './wiki-toc';

interface WikiArticleProps {
  content: EncyclopediaContent;
  displayName: string;
  avatarUrl: string | null;
  accentColor: string;
}

export function WikiArticle({ content, displayName, avatarUrl, accentColor }: WikiArticleProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 text-[#202122] sm:py-10">
      <article className="overflow-hidden border border-[#d8dee8] bg-white shadow-[0_28px_80px_-64px_rgba(15,23,42,0.7)]">
        <div className="border-b border-[#d8dee8] bg-[#f8fbff] px-4 py-3 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center border border-[#a2a9b1] bg-white text-lg"
                style={{ color: accentColor }}
              >
                W
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#54595d]">
                  Karte Encyclopedia
                </p>
                <p className="mt-0.5 text-xs text-[#72777d]">
                  Public profile article
                </p>
              </div>
            </div>
            <div className="flex gap-2 text-xs text-[#3366cc]">
              <span className="border border-[#d8dee8] bg-white px-3 py-1">Read</span>
              <span className="border border-[#d8dee8] bg-white px-3 py-1">View source</span>
            </div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[11rem_minmax(0,1fr)]">
          <aside className="hidden border-r border-[#eaecf0] bg-[#fbfbfb] px-4 py-6 text-xs text-[#54595d] lg:block">
            <p className="font-semibold uppercase tracking-[0.18em] text-[#202122]">
              Navigation
            </p>
            <div className="mt-4 space-y-2">
              {['Article', 'Contents', 'Infobox', 'Categories'].map((item) => (
                <p key={item} className="text-[#3366cc]">{item}</p>
              ))}
            </div>
          </aside>

          <div className="px-4 py-6 sm:px-8 sm:py-8">
            <header className="mb-4 border-b border-[#a7d7f9] pb-3">
              <p className="mb-2 text-xs text-[#54595d]">
                Article &gt; Profile &gt; {displayName}
              </p>
              <h1
                className="text-[32px] font-normal leading-tight sm:text-[42px]"
                style={{
                  fontFamily: 'Linux Libertine, Georgia, "Times New Roman", serif',
                  color: '#000000',
                }}
              >
                {displayName}
              </h1>
            </header>

            <p className="mb-5 border-l-4 border-[#a7d7f9] bg-[#f8f9fa] px-3 py-2 text-xs italic text-[#54595d]">
              From Karte Encyclopedia, a source-backed profile article generated from public profile memory.
            </p>

            <WikiInfobox
              infobox={content.infobox}
              displayName={displayName}
              avatarUrl={avatarUrl}
              accentColor={accentColor}
            />

            <WikiTocFromHtml html={content.markdown} accentColor={accentColor} />

            <div
              className="wiki-prose clear-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.markdown) }}
            />

            {content.categories.length > 0 && (
              <footer className="mt-8 border border-dotted border-[#a2a9b1] bg-[#f8f9fa] px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-xs font-semibold text-[#54595d]">
                    Categories:
                  </span>
                  {content.categories.map((cat, i) => (
                    <span key={i} className="text-xs text-[#3366cc]">
                      {cat}
                      {i < content.categories.length - 1 && (
                        <span className="ml-2 text-[#a2a9b1]">|</span>
                      )}
                    </span>
                  ))}
                </div>
              </footer>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
