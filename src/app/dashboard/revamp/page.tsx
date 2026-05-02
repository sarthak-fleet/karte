import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { ProfileRevampAssistant } from '@/components/dashboard/profile-revamp-assistant';
import { db, ensureProjectsTable } from '@/db';
import { pages } from '@/db/schema';
import { getSession } from '@/lib/auth-server';
import { resolveThemeConfig } from '@/lib/themes';

export default async function RevampPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  await ensureProjectsTable();

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
  });

  if (!page) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold text-white">Profile Revamp</h1>
        <p className="text-sm text-gray-400">
          Create a profile first from the Appearance tab.
        </p>
      </div>
    );
  }

  const theme = resolveThemeConfig(page.themeConfig);

  return (
    <ProfileRevampAssistant
      pageId={page.id}
      currentTheme={theme.label}
    />
  );
}
