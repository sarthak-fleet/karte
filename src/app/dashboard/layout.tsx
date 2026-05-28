import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { DashboardTracker } from '@/components/dashboard/dashboard-tracker';
import { NavProgress } from '@/components/dashboard/nav-progress';
import { Sidebar } from '@/components/dashboard/sidebar';
import { db } from '@/db';
import { user as userTable } from '@/db/schema';
import { getCurrentPage, getSession } from '@/lib/auth-server';

// Single-DB era: better-auth and app data both live on D1, so the `user`
// row created by better-auth on sign-in IS the same row the app reads from.
// The old cross-DB syncUserOnce() reconciliation is gone — we just confirm
// the row carries the Karte-specific columns and fetch the page slug.

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const [appUser, page] = await Promise.all([
    db.query.user.findFirst({
      where: eq(userTable.id, session.user.id),
      columns: { id: true },
    }),
    getCurrentPage(session.user.id),
  ]);

  // First time this user hits the dashboard? better-auth would have inserted
  // the row on sign-in callback, so this only fires for legacy sessions that
  // existed before the D1 migration. Cheap insert; no cross-DB dance.
  if (!appUser) {
    await db
      .insert(userTable)
      .values({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name ?? '',
        image: session.user.image ?? null,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing({ target: userTable.id });
  }

  return (
    <div
      data-onyx-brand
      className="min-h-screen bg-[#0a0a0a] text-karte-text antialiased lg:flex"
    >
      <NavProgress />
      <DashboardTracker />
      <Sidebar slug={page?.slug} />
      <main className="min-w-0 flex-1 px-5 pb-10 pt-4 sm:px-8 lg:h-screen lg:overflow-y-auto lg:p-10">
        {children}
      </main>
    </div>
  );
}
