import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { pages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PageSettings } from '@/components/dashboard/page-settings';

export default async function AppearancePage() {
  const session = await auth();
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
              published: page.published,
            }
          : null
      }
    />
  );
}
