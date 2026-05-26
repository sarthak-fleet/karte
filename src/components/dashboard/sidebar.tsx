'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Links', href: '/dashboard/links' },
  { label: 'Projects', href: '/dashboard/projects' },
  { label: 'Profile Modes', href: '/dashboard/pages' },
  { label: 'AI Revamp', href: '/dashboard/revamp' },
  { label: 'AI Chat', href: '/dashboard/memory' },
  { label: 'Inbox', href: '/dashboard/inbox' },
  { label: 'Lead Radar', href: '/dashboard/leads' },
  { label: 'Analytics', href: '/dashboard/analytics' },
  { label: 'Experiments', href: '/dashboard/experiments' },
  { label: 'Chats', href: '/dashboard/chats' },
  { label: 'Blocks & Blogs', href: '/dashboard/sections' },
  { label: 'Appearance', href: '/dashboard/appearance' },
  { label: 'Domains', href: '/dashboard/domains' },
  { label: 'Encyclopedia', href: '/dashboard/encyclopedia' },
];

export function Sidebar({ slug }: { slug?: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const activeItem = [...navItems]
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
        <nav className={`flex-1 space-y-1 ${mobile ? 'px-4 pb-4' : 'px-3'}`}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {slug && (
          <div className={`border-t border-white/10 ${mobile ? 'px-4 py-4' : 'px-3 py-4'}`}>
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg bg-white/5 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-white/10"
            >
              View Page
            </a>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-40 -mx-4 mb-6 border-b border-white/10 bg-gray-950/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gray-500">
              Karte
            </p>
            <p className="truncate text-sm font-semibold text-white">
              {pageTitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {slug && (
              <a
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              >
                View Page
              </a>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              aria-label="Open dashboard menu"
            >
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
            className="absolute inset-0 bg-gray-950/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[85vw] max-w-xs flex-col border-r border-white/10 bg-gray-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <Link
                href="/dashboard"
                className="text-lg font-bold text-white"
                onClick={() => setMobileOpen(false)}
              >
                Karte
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                aria-label="Close dashboard menu"
              >
                Close
              </button>
            </div>

            {renderNav({ mobile: true, onNavigate: () => setMobileOpen(false) })}
          </aside>
        </div>
      )}

      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-gray-950 lg:flex">
        <div className="px-6 py-6">
          <Link href="/dashboard" className="text-xl font-bold text-white">
            Karte
          </Link>
        </div>

        {renderNav({})}
      </aside>
    </>
  );
}
