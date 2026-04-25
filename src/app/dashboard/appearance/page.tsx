import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { db } from '@/db';
import { pages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PageSettings } from '@/components/dashboard/page-settings';

export default async function AppearancePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
  });

  return (
    <PageSettings
      page={
        page
          ? {
              id: page.id,
              slug: page.slug,
              displayName: page.displayName,
              bio: page.bio,
              avatarUrl: page.avatarUrl,
              themeConfig: page.themeConfig,
              published: page.published,
            }
          : null
      }
    />
  );
}
