'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type NavItem = {
  label: string;
  href: string;
  /** Featured items get a subtle accent treatment so the AI surfaces feel
   * like product capabilities, not buried buttons. */
  featured?: boolean;
};
type NavGroup = { label: string | null; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [{ label: 'Home', href: '/dashboard' }],
  },
  {
    label: 'Data',
    items: [
      { label: 'Links', href: '/dashboard/links' },
      { label: 'Projects', href: '/dashboard/projects' },
      { label: 'Timeline', href: '/dashboard/timeline' },
      { label: 'Sections', href: '/dashboard/sections' },
      { label: 'Memory', href: '/dashboard/memory' },
      { label: 'Components', href: '/dashboard/components' },
    ],
  },
  {
    label: 'Design',
    items: [
      { label: 'Appearance', href: '/dashboard/appearance' },
      { label: 'Widgets', href: '/dashboard/widgets' },
    ],
  },
  {
    label: 'Inbound',
    items: [
      { label: 'Chats', href: '/dashboard/chats' },
      { label: 'Inbox', href: '/dashboard/inbox' },
      { label: 'Email', href: '/dashboard/email' },
      { label: 'Leads', href: '/dashboard/leads' },
      {
        label: 'Opportunities',
        href: '/dashboard/opportunities',
        featured: true,
      },
    ],
  },
  {
    label: 'Settings & analytics',
    items: [
      { label: 'Analytics', href: '/dashboard/analytics' },
      { label: 'Domains', href: '/dashboard/domains' },
    ],
  },
];

const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);

export function Sidebar({ slug }: { slug?: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const activeItem = [...allNavItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
  const pageTitle = activeItem?.label ?? 'Dashboard';

  function renderNav({
    mobile = false,
    onNavigate,
  }: {
    mobile?: boolean;
    onNavigate?: () => void;
  }) {
    return (
      <nav className={`flex-1 space-y-5 ${mobile ? 'px-3 pb-4' : 'px-3'}`}>
        {navGroups.map((group, gi) => (
          <div key={group.label ?? `g-${gi}`} className="space-y-0.5">
            {group.label && (
              <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-600">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const baseClass =
                'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors duration-200 ease-[var(--karte-ease)]';
              const stateClass = item.featured
                ? isActive
                  ? 'bg-karte-accent/[0.12] text-karte-text'
                  : 'text-karte-text-2 hover:bg-karte-accent/[0.08] hover:text-karte-text'
                : isActive
                  ? 'bg-white/[0.06] text-karte-text'
                  : 'text-karte-text-3 hover:bg-white/[0.03] hover:text-karte-text';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  // Default prefetch: Next.js warms dynamic routes on
                  // hover/focus, not viewport. Hover-warming makes nav
                  // feel instant while avoiding the eager DB hits we
                  // were seeing with prefetch={true}.
                  className={`${baseClass} ${stateClass}`}
                >
                  <span>{item.label}</span>
                  {item.featured && (
                    <span
                      aria-hidden="true"
                      className="text-[10px] text-karte-accent/80"
                    >
                      ✨
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    );
  }

  // Bottom-pinned "Your live page" CTA. Rendered as a sibling of the
  // scrollable nav rather than inside it, so it stays anchored to the
  // sidebar's bottom edge regardless of nav length.
  function renderViewPageCta({
    mobile = false,
    onNavigate,
  }: {
    mobile?: boolean;
    onNavigate?: () => void;
  }) {
    if (!slug) return null;
    return (
      <div
        className={`border-t border-karte-border ${mobile ? 'px-4 py-4' : 'px-3 py-4'}`}
      >
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="group block rounded-2xl border border-karte-accent/25 bg-gradient-to-br from-karte-accent/[0.10] via-karte-accent/[0.04] to-transparent p-4 transition-all duration-200 ease-[var(--karte-ease)] hover:-translate-y-0.5 hover:border-karte-accent/45 hover:from-karte-accent/[0.16]"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-accent/80">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-karte-accent opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-karte-accent" />
              </span>
              Your live page
            </span>
          </p>
          <p className="mt-2 truncate font-mono text-[13px] font-medium text-karte-text">
            karte.cc/{slug}
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-karte-text-3 transition-colors duration-200 group-hover:text-karte-accent">
            Open in new tab
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              ↗
            </span>
          </p>
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-40 -mx-5 mb-6 border-b border-karte-border bg-karte-bg/85 px-5 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
              <span className="text-karte-accent/80">·</span> Karte
            </p>
            <p className="mt-0.5 truncate text-[15px] font-semibold tracking-[-0.005em] text-karte-text">
              {pageTitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {slug && (
              <a
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/[0.08] bg-transparent px-3 py-1.5 text-[12px] font-medium text-karte-text-2 transition-all duration-200 ease-[var(--karte-ease)] hover:border-karte-border-emphasis hover:bg-white/[0.04]"
              >
                View
              </a>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-transparent px-3 py-1.5 text-[12px] font-medium text-karte-text-2 transition-all duration-200 ease-[var(--karte-ease)] hover:border-karte-border-emphasis hover:bg-white/[0.04]"
              aria-label="Open dashboard menu"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 4h10M2 7h10M2 10h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Menu
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close dashboard menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[86vw] max-w-xs flex-col border-r border-karte-border bg-karte-bg">
            <div className="flex items-center justify-between border-b border-karte-border px-5 py-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                onClick={() => setMobileOpen(false)}
              >
                <BrandMark />
                <span
                  className="text-[17px] font-normal italic tracking-[-0.01em] text-karte-text"
                  style={{ fontFamily: 'var(--font-instrument-serif), serif' }}
                >
                  Karte
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-karte-text-2 transition-all duration-200 hover:border-karte-border-emphasis hover:bg-white/[0.04]"
                aria-label="Close dashboard menu"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {renderNav({
                mobile: true,
                onNavigate: () => setMobileOpen(false),
              })}
            </div>
            {renderViewPageCta({
              mobile: true,
              onNavigate: () => setMobileOpen(false),
            })}
          </aside>
        </div>
      )}

      <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-karte-border bg-karte-bg lg:flex">
        <div className="px-5 py-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-90"
          >
            <BrandMark />
            <span
              className="text-[19px] font-normal italic tracking-[-0.01em] text-karte-text"
              style={{ fontFamily: 'var(--font-instrument-serif), serif' }}
            >
              Karte
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">{renderNav({})}</div>
        {renderViewPageCta({})}
      </aside>
    </>
  );
}

function BrandMark() {
  // Gold-foil diamond — matches the landing-deck corner ornament
  // and the favicon. Same SVG geometry as src/app/icon.svg.
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      fill="none"
      className="h-[22px] w-[22px]"
    >
      <defs>
        <linearGradient id="brand-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6e5b8" />
          <stop offset="55%" stopColor="#c4a46b" />
          <stop offset="100%" stopColor="#8a6b34" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill="#0a0805" />
      <rect
        x="2.5"
        y="2.5"
        width="27"
        height="27"
        rx="4"
        fill="none"
        stroke="#c4a46b"
        strokeOpacity="0.35"
        strokeWidth="0.6"
      />
      <path d="M16 7 L25 16 L16 25 L7 16 Z" fill="url(#brand-gold)" />
    </svg>
  );
}
