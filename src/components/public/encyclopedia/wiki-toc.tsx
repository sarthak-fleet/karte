'use client';

import { useEffect, useMemo, useState } from 'react';

interface TocEntry {
  text: string;
  id: string;
}

function sectionId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extract h2 headings from raw HTML string for the table of contents.
 * Works on both server and client by using a regex approach.
 */
function extractHeadings(html: string): TocEntry[] {
  const headings: TocEntry[] = [];
  const regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    // Strip any nested HTML tags from heading text
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text) {
      headings.push({ text, id: sectionId(text) });
    }
  }
  return headings;
}

// ── WikiTocFromHtml ─────────────────────────────────────────────────────────

interface WikiTocFromHtmlProps {
  html: string;
  accentColor: string;
}

export function WikiTocFromHtml({ html, accentColor }: WikiTocFromHtmlProps) {
  const headings = useMemo(() => extractHeadings(html), [html]);
  const [activeId, setActiveId] = useState<string>('');
  const [collapsed, setCollapsed] = useState(false);

  // Add IDs to actual DOM h2 elements so scroll-to works
  useEffect(() => {
    const container = document.querySelector('.wiki-prose');
    if (!container) return;
    const h2s = container.querySelectorAll('h2');
    h2s.forEach((el) => {
      const text = el.textContent?.trim() ?? '';
      el.id = sectionId(text);
    });
  }, [html]);

  useEffect(() => {
    const ids = headings.map((h) => h.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    elements.forEach((el) => {
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (headings.length === 0) return null;

  return (
    <nav
      className="mb-6 w-full border border-[#a2a9b1] bg-[#f8f9fa] px-4 py-3 shadow-sm sm:w-fit"
      style={{ fontFamily: 'sans-serif', fontSize: '14px' }}
    >
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-[#202122]">Contents</p>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="cursor-pointer border-none bg-transparent p-0 text-xs text-[#3366cc] hover:underline"
        >
          [{collapsed ? 'show' : 'hide'}]
        </button>
      </div>

      {!collapsed && (
        <ol className="m-0 list-none space-y-0.5 pl-0">
          {headings.map((heading, i) => {
            const isActive = activeId === heading.id;

            return (
              <li key={heading.id} className="leading-relaxed">
                <button
                  onClick={() => scrollTo(heading.id)}
                  className="cursor-pointer border-none bg-transparent p-0 text-left text-sm transition-colors duration-100"
                  style={{
                    color: isActive ? '#202122' : '#3366cc',
                    fontWeight: isActive ? 700 : 400,
                    fontFamily: 'sans-serif',
                  }}
                >
                  <span className="mr-1.5 tabular-nums text-[#202122]">
                    {i + 1}
                  </span>
                  <span className={isActive ? '' : 'hover:underline'}>
                    {heading.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}
