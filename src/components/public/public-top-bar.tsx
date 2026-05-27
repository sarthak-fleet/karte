import { eq } from 'drizzle-orm';
import Image from 'next/image';
import Link from 'next/link';

import { db } from '@/db';
import { pages } from '@/db/schema';
import { getSession } from '@/lib/auth-server';

type PublicTopBarProps = {
  accentColor?: string;
  current?: 'home' | 'create' | 'login' | 'profile';
  variant?: 'default' | 'minimal';
};

function getInitials(value: string | null | undefined) {
  return (
    value
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'K'
  );
}

export async function PublicTopBar({
  accentColor = '#ffffff',
  current = 'home',
  variant = 'default',
}: PublicTopBarProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let session: any = null;
  let userPage: { slug: string } | null = null;

  try {
    session = await getSession() as typeof session;
    if (session?.user?.id) {
      userPage = await db.query.pages.findFirst({
        where: eq(pages.userId, session.user.id),
        columns: { slug: true },
      }) ?? null;
    }
  } catch {
    // Auth failed — show anonymous UI
  }

  if (variant === 'minimal') {
    return (
      <nav className="sticky top-0 z-30 border-b border-white/[0.04] bg-karte-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity duration-200 ease-[var(--karte-ease)] hover:opacity-90"
          >
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
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-karte-text">
              Karte
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {session?.user ? (
              <>
                {userPage?.slug && current !== 'profile' && (
                  <Link
                    href={`/${userPage.slug}`}
                    className="hidden text-[13px] font-medium text-karte-text-3 transition-colors duration-200 hover:text-karte-text sm:inline-flex"
                  >
                    My profile
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-zinc-950 transition-all duration-200 ease-[var(--karte-ease)] hover:bg-zinc-100"
                >
                  Dashboard
                  <span className="transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[13px] font-medium text-karte-text-3 transition-colors duration-200 hover:text-karte-text"
                >
                  Log in
                </Link>
                <Link
                  href="/create"
                  className="group inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-zinc-950 transition-all duration-200 ease-[var(--karte-ease)] hover:bg-zinc-100"
                >
                  Claim your name
                  <span className="transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <div className="relative z-20 mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
      <div
        className="flex items-center justify-between gap-3 rounded-[28px] border bg-black/20 px-4 py-3 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.95)] backdrop-blur-2xl sm:px-5"
        style={{ borderColor: `${accentColor}26` }}
      >
        <Link href="/" className="min-w-0 transition hover:opacity-85">
          <span className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold text-karte-text"
              style={{
                borderColor: `${accentColor}40`,
                backgroundColor: `${accentColor}14`,
              }}
            >
              K
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-karte-text sm:text-base">Karte</span>
              <span className="hidden text-xs text-karte-text/45 md:block">
                Your digital card on the open web
              </span>
            </span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {session?.user ? (
            <>
              {userPage?.slug && current !== 'profile' && (
                <Link
                  href={`/${userPage.slug}`}
                  className="rounded-full border border-karte-border-emphasis bg-white/5 px-3 py-2 text-xs font-medium text-karte-text transition hover:bg-white/10 sm:text-sm"
                >
                  My Profile
                </Link>
              )}
              <Link
                href="/dashboard"
                className="rounded-full border border-karte-border-emphasis bg-white/5 px-3 py-2 text-xs font-medium text-karte-text transition hover:bg-white/10 sm:text-sm"
              >
                Dashboard
              </Link>
              <div
                className="flex items-center gap-2 rounded-full border px-2 py-1.5 text-karte-text"
                style={{ borderColor: `${accentColor}40`, backgroundColor: `${accentColor}12` }}
              >
                {session?.user?.image ? (
                  <Image
                    src={session?.user?.image}
                    alt={session?.user?.name ?? 'Account'}
                    width={28}
                    height={28}
                    sizes="28px"
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{ backgroundColor: `${accentColor}2a` }}
                  >
                    {getInitials(session?.user?.name)}
                  </div>
                )}
                <span className="hidden max-w-28 truncate text-sm font-medium sm:block">
                  {session?.user?.name ?? 'Account'}
                </span>
              </div>
            </>
          ) : (
            <>
              {current !== 'create' && (
                <Link
                  href="/create"
                  className="rounded-full border border-karte-border-emphasis bg-white/5 px-3 py-2 text-xs font-medium text-karte-text transition hover:bg-white/10 sm:text-sm"
                >
                  Start Profile
                </Link>
              )}
              {current !== 'login' && (
                <Link
                  href="/login"
                  className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-100 sm:text-sm"
                >
                  Log In
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
