'use client';

import { useEffect, useState } from 'react';

interface WikiTocProps {
  sections: { heading: string }[];
  accentColor: string;
}

function sectionId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function WikiToc({ sections, accentColor }: WikiTocProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const ids = sections.map((s) => sectionId(s.heading));
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

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

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <nav
      className="mb-6 w-fit border border-[#a2a9b1] bg-[#f8f9fa] px-4 py-3"
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
          {sections.map((section, i) => {
            const id = sectionId(section.heading);
            const isActive = activeId === id;

            return (
              <li key={id} className="leading-relaxed">
                <button
                  onClick={() => scrollTo(id)}
                  className="cursor-pointer border-none bg-transparent p-0 text-left text-sm transition-colors duration-100"
                  style={{
                    color: isActive ? '#202122' : '#3366cc',
                    fontWeight: isActive ? 700 : 400,
                    fontFamily: 'sans-serif',
                  }}
                >
                  <span className="mr-1.5 tabular-nums text-[#202122]">{i + 1}</span>
                  <span className={isActive ? '' : 'hover:underline'}>
                    {section.heading}
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
