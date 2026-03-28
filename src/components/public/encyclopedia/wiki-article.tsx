import type { EncyclopediaContent } from '@/lib/generated-page-types';
import { WikiInfobox } from './wiki-infobox';
import { WikiToc } from './wiki-toc';

interface WikiArticleProps {
  content: EncyclopediaContent;
  displayName: string;
  avatarUrl: string | null;
  accentColor: string;
}

function sectionId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function WikiArticle({ content, displayName, avatarUrl, accentColor }: WikiArticleProps) {
  return (
    <div
      className="mx-auto max-w-4xl px-4 py-6 sm:py-10"
      style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#202122',
        backgroundColor: '#ffffff',
      }}
    >
      <article>
        {/* Article title */}
        <header className="mb-4 border-b border-[#a7d7f9] pb-2">
          <h1
            className="text-[28px] font-normal leading-tight sm:text-[32px]"
            style={{
              fontFamily: 'Linux Libertine, Georgia, "Times New Roman", serif',
              color: '#000000',
            }}
          >
            {displayName}
          </h1>
        </header>

        {/* Tagline */}
        <p
          className="mb-5 text-xs italic"
          style={{ fontFamily: 'sans-serif', color: '#54595d' }}
        >
          From LinkChat Encyclopedia, the free profile
        </p>

        {/* Lead paragraph - slightly larger */}
        <p
          className="mb-5 text-[15px] leading-relaxed sm:text-base"
          style={{ color: '#202122' }}
        >
          <b>{displayName}</b> {content.leadParagraph}
        </p>

        {/* Infobox floated right (on desktop) */}
        <WikiInfobox
          infobox={content.infobox}
          displayName={displayName}
          avatarUrl={avatarUrl}
          accentColor={accentColor}
        />

        {/* Table of Contents */}
        <WikiToc sections={content.sections} accentColor={accentColor} />

        {/* Article sections */}
        <div className="clear-none">
          {content.sections.map((section, i) => (
            <section key={i} id={sectionId(section.heading)} className="mb-6">
              <div className="mb-2 flex items-baseline gap-3 border-b border-[#a2a9b1] pb-1">
                <h2
                  className="text-[22px] font-normal leading-snug"
                  style={{
                    fontFamily: 'Linux Libertine, Georgia, "Times New Roman", serif',
                    color: '#000000',
                  }}
                >
                  {section.heading}
                </h2>
                <span
                  className="cursor-default select-none text-xs"
                  style={{ fontFamily: 'sans-serif', color: '#3366cc' }}
                >
                  [edit]
                </span>
              </div>
              <div
                className="whitespace-pre-line text-sm leading-relaxed"
                style={{
                  color: '#202122',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                {section.content}
              </div>
            </section>
          ))}
        </div>

        {/* Categories */}
        {content.categories.length > 0 && (
          <footer className="mt-8 border border-dotted border-[#a2a9b1] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="mr-1 text-xs font-semibold"
                style={{ fontFamily: 'sans-serif', color: '#54595d' }}
              >
                Categories:
              </span>
              {content.categories.map((cat, i) => (
                <span
                  key={i}
                  className="text-xs"
                  style={{ fontFamily: 'sans-serif', color: '#3366cc' }}
                >
                  {cat}
                  {i < content.categories.length - 1 && (
                    <span className="ml-2 text-[#a2a9b1]">|</span>
                  )}
                </span>
              ))}
            </div>
          </footer>
        )}
      </article>
    </div>
  );
}
