import Image from 'next/image';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth-server';
import { db } from '@/db';
import { pages } from '@/db/schema';

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
      .join('') || 'LC'
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
      <nav className="relative z-20 mx-auto w-full max-w-5xl px-5 pt-6 sm:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-white transition hover:opacity-80">
            LinkChat
          </Link>

          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                {userPage?.slug && current !== 'profile' && (
                  <Link
                    href={`/${userPage.slug}`}
                    className="text-sm font-medium text-slate-400 transition hover:text-white"
                  >
                    My Profile
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-gray-950 transition hover:bg-cyan-300"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-400 transition hover:text-white"
                >
                  Log In
                </Link>
                <Link
                  href="/create"
                  className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-gray-950 transition hover:bg-cyan-300"
                >
                  Start Free
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xs font-semibold text-white"
              style={{
                borderColor: `${accentColor}40`,
                backgroundColor: `${accentColor}14`,
              }}
            >
              LC
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white sm:text-base">LinkChat</span>
              <span className="hidden text-xs text-white/45 md:block">
                Profiles with projects, proof, and AI chat
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
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10 sm:text-sm"
                >
                  My Profile
                </Link>
              )}
              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10 sm:text-sm"
              >
                Dashboard
              </Link>
              <div
                className="flex items-center gap-2 rounded-full border px-2 py-1.5 text-white"
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
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10 sm:text-sm"
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
