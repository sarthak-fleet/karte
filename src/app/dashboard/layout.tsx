import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { Sidebar } from '@/components/dashboard/sidebar';
import { appDbExecute, db, ensureProjectsTable } from '@/db';
import { pages, users } from '@/db/schema';
import { getSession } from '@/lib/auth-server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  await ensureProjectsTable();
  const now = new Date();
  const email = session.user.email!;

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
  if (typeof existingUserId === 'string' && existingUserId !== session.user.id) {
    await appDbExecute('UPDATE pages SET userId = ? WHERE userId = ?', [
      session.user.id,
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
      id: session.user.id,
      email,
      name: session.user.name ?? '',
      image: session.user.image ?? null,
      ...appUserSettings,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name: session.user.name ?? '',
        image: session.user.image ?? null,
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
      session.user.id,
      session.user.name ?? '',
      email,
      1,
      session.user.image ?? null,
      appUserSettings.smProjectId,
      appUserSettings.smApiKey,
      appUserSettings.smIndexId,
      Date.now(), // eslint-disable-line react-hooks/purity
      appUserSettings.aiEndpointUrl,
      appUserSettings.aiApiKey,
      appUserSettings.aiModel,
    ],
  ).catch(() => null);

  if (legacyUser?.id && legacyUser.id !== session.user.id) {
    await appDbExecute('UPDATE pages SET userId = ? WHERE userId = ?', [
      session.user.id,
      legacyUser.id,
    ]);
  }

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
    columns: { slug: true },
  });

  return (
    <div className="min-h-screen bg-gray-950 lg:flex">
      <Sidebar slug={page?.slug} />
      <main className="min-w-0 flex-1 px-4 pb-8 pt-4 sm:px-6 lg:h-screen lg:overflow-y-auto lg:p-8">
        {children}
      </main>
    </div>
  );
}
