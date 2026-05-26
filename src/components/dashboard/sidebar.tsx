'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type NavItem = { label: string; href: string };
type NavGroup = { label: string | null; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [{ label: 'Home', href: '/dashboard' }],
  },
  {
    label: 'Build',
    items: [
      { label: 'Links', href: '/dashboard/links' },
      { label: 'Projects', href: '/dashboard/projects' },
      { label: 'Sections', href: '/dashboard/sections' },
      { label: 'Modes', href: '/dashboard/pages' },
      { label: 'Encyclopedia', href: '/dashboard/encyclopedia' },
      { label: 'AI Revamp', href: '/dashboard/revamp' },
    ],
  },
  {
    label: 'Engage',
    items: [
      { label: 'Chat', href: '/dashboard/memory' },
      { label: 'Inbox', href: '/dashboard/inbox' },
      { label: 'Chats', href: '/dashboard/chats' },
      { label: 'Leads', href: '/dashboard/leads' },
    ],
  },
  {
    label: 'Analyze',
    items: [
      { label: 'Analytics', href: '/dashboard/analytics' },
      { label: 'Experiments', href: '/dashboard/experiments' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Appearance', href: '/dashboard/appearance' },
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
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const pageTitle = activeItem?.label ?? 'Dashboard';

  function renderNav({
    mobile = false,
    onNavigate,
  }: {
    mobile?: boolean;
    onNavigate?: () => void;
  }) {
    return (
      <>
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
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`block rounded-lg px-3 py-2 text-[14px] font-medium transition-colors duration-200 ease-[var(--karte-ease)] ${
                      isActive
                        ? 'bg-white/[0.06] text-karte-text'
                        : 'text-karte-text-3 hover:bg-white/[0.03] hover:text-karte-text'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {slug && (
          <div className={`border-t border-karte-border ${mobile ? 'px-4 py-4' : 'px-3 py-4'}`}>
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-2 rounded-lg border border-karte-border bg-white/[0.02] px-3 py-2 text-[13px] font-medium text-karte-text-2 transition-all duration-200 ease-[var(--karte-ease)] hover:border-white/15 hover:bg-white/[0.05] hover:text-karte-text"
            >
              View page
              <span className="text-karte-text-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-karte-accent">
                ↗
              </span>
            </a>
          </div>
        )}
      </>
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
                className="rounded-full border border-white/[0.08] bg-transparent px-3 py-1.5 text-[12px] font-medium text-karte-text-2 transition-all duration-200 ease-[var(--karte-ease)] hover:border-white/20 hover:bg-white/[0.04]"
              >
                View
              </a>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-transparent px-3 py-1.5 text-[12px] font-medium text-karte-text-2 transition-all duration-200 ease-[var(--karte-ease)] hover:border-white/20 hover:bg-white/[0.04]"
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
                <span className="text-[15px] font-semibold tracking-[-0.01em] text-karte-text">
                  Karte
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-karte-text-2 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.04]"
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
            <span className="text-[16px] font-semibold tracking-[-0.01em] text-karte-text">
              Karte
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">{renderNav({})}</div>
      </aside>
    </>
  );
}

function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      fill="none"
      className="h-[22px] w-[22px]"
    >
      <rect width="32" height="32" rx="7" fill="#0a0a0a" />
      <path
        d="M8 7 h16 a4 4 0 0 1 4 4 v9 a4 4 0 0 1 -4 4 h-9 l-4 4 v-4 h-3 a4 4 0 0 1 -4 -4 v-9 a4 4 0 0 1 4 -4 Z"
        fill="#67e8f9"
      />
      <circle cx="13" cy="15.5" r="1.25" fill="#0a0a0a" />
      <circle cx="16.5" cy="15.5" r="1.25" fill="#0a0a0a" />
      <circle cx="20" cy="15.5" r="1.25" fill="#0a0a0a" />
    </svg>
  );
}
