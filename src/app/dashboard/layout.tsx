import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { DashboardTracker } from '@/components/dashboard/dashboard-tracker';
import { NavProgress } from '@/components/dashboard/nav-progress';
import { Sidebar } from '@/components/dashboard/sidebar';
import { appDbExecute, db, ensureProjectsTable } from '@/db';
import { users } from '@/db/schema';
import { getCurrentPage, getSession } from '@/lib/auth-server';

// Migration/sync logic moved into syncUserOnce(). It runs:
//   - The very first time a user opens the dashboard after sign-up, OR
//   - If a legacy/duplicate user row needs cleanup
// After the first successful sync, subsequent dashboard navigations skip all
// of it and the layout only does 2 DB round-trips (user existence check +
// page slug fetch, parallelized into 1 RTT).
//
// Previously this ran 6-8 sequential RTTs on every page load — visibly
// laggy even with one user in the database.

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  // Run the Turso DDL bootstrap in parallel with the user/page lookups —
  // these queries only touch `users.id` and `pages.slug`, both of which exist
  // in the base Drizzle schema and don't depend on the runtime ALTERs.
  // Saves the cold-start Turso RTT from being in series with the lookups.
  // getCurrentPage returns the full page row so child pages re-call it and
  // reuse this via React.cache.
  const [, appUser, page] = await Promise.all([
    ensureProjectsTable(),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { id: true },
    }),
    getCurrentPage(session.user.id),
  ]);

  // SLOW PATH: first time this user has hit the dashboard, or a sync was
  // forced. Runs the migration logic once, then the next nav is on the fast
  // path.
  if (!appUser) {
    await syncUserOnce({
      userId: session.user.id,
      email: session.user.email!,
      name: session.user.name ?? '',
      image: session.user.image ?? null,
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-karte-text antialiased lg:flex">
      <NavProgress />
      <DashboardTracker />
      <Sidebar slug={page?.slug} />
      <main className="min-w-0 flex-1 px-5 pb-10 pt-4 sm:px-8 lg:h-screen lg:overflow-y-auto lg:p-10">
        {children}
      </main>
    </div>
  );
}

// One-shot sync to reconcile auth user → app user across both databases.
// Picks up legacy rows from older schemas, dedupes by email, then writes a
// clean row to both Turso (app db) and D1 (better-auth db).
async function syncUserOnce(params: {
  userId: string;
  email: string;
  name: string;
  image: string | null;
}) {
  const { userId, email, name, image } = params;
  const now = new Date();

  const [existingUserByEmail, legacyUserByEmail] = await Promise.all([
    appDbExecute(
      `SELECT id, smProjectId, smApiKey, smIndexId, aiEndpointUrl, aiApiKey, aiModel
       FROM "user"
       WHERE email = ?
       LIMIT 1`,
      [email],
    ),
    appDbExecute(
      `SELECT id, smProjectId, smApiKey, smIndexId, aiEndpointUrl, aiApiKey, aiModel
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email],
    ).catch(() => ({ rows: [] })),
  ]);

  const existingUser = existingUserByEmail.rows[0] as
    | {
        id?: string;
        smProjectId?: string | null;
        smApiKey?: string | null;
        smIndexId?: string | null;
        aiEndpointUrl?: string | null;
        aiApiKey?: string | null;
        aiModel?: string | null;
      }
    | undefined;
  const existingUserId = existingUser?.id;
  if (typeof existingUserId === 'string' && existingUserId !== userId) {
    await appDbExecute('UPDATE pages SET userId = ? WHERE userId = ?', [
      userId,
      existingUserId,
    ]);
    await appDbExecute('DELETE FROM "user" WHERE id = ?', [existingUserId]);
  }

  const legacyUser = legacyUserByEmail.rows[0] as
    | {
        id?: string;
        smProjectId?: string | null;
        smApiKey?: string | null;
        smIndexId?: string | null;
        aiEndpointUrl?: string | null;
        aiApiKey?: string | null;
        aiModel?: string | null;
      }
    | undefined;
  const appUserSettings = {
    smProjectId: legacyUser?.smProjectId ?? existingUser?.smProjectId ?? null,
    smApiKey: legacyUser?.smApiKey ?? existingUser?.smApiKey ?? null,
    smIndexId: legacyUser?.smIndexId ?? existingUser?.smIndexId ?? null,
    aiEndpointUrl: legacyUser?.aiEndpointUrl ?? existingUser?.aiEndpointUrl ?? null,
    aiApiKey: legacyUser?.aiApiKey ?? existingUser?.aiApiKey ?? null,
    aiModel: legacyUser?.aiModel ?? existingUser?.aiModel ?? null,
  };

  await db
    .insert(users)
    .values({
      id: userId,
      email,
      name,
      image,
      ...appUserSettings,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name,
        image,
        ...appUserSettings,
        updatedAt: now,
      },
    });

  await appDbExecute(
    `INSERT INTO users (
       id, name, email, emailVerified, image, smProjectId, smApiKey, smIndexId,
       createdAt, aiEndpointUrl, aiApiKey, aiModel
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       email = excluded.email,
       image = excluded.image,
       smProjectId = excluded.smProjectId,
       smApiKey = excluded.smApiKey,
       smIndexId = excluded.smIndexId,
       aiEndpointUrl = excluded.aiEndpointUrl,
       aiApiKey = excluded.aiApiKey,
       aiModel = excluded.aiModel`,
    [
      userId,
      name,
      email,
      1,
      image,
      appUserSettings.smProjectId,
      appUserSettings.smApiKey,
      appUserSettings.smIndexId,
      Date.now(),
      appUserSettings.aiEndpointUrl,
      appUserSettings.aiApiKey,
      appUserSettings.aiModel,
    ],
  ).catch(() => null);

  if (legacyUser?.id && legacyUser.id !== userId) {
    await appDbExecute('UPDATE pages SET userId = ? WHERE userId = ?', [
      userId,
      legacyUser.id,
    ]);
  }
}
