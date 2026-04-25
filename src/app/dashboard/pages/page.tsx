import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { db, ensureProjectsTable } from '@/db';
import { pages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PageToggles } from '@/components/dashboard/page-toggles';

export default async function DashboardPagesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  await ensureProjectsTable();

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
  });

  if (!page) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-2xl font-bold text-white">Pages</h1>
        <p className="text-gray-400">Create a profile first to manage pages.</p>
      </div>
    );
  }

  return (
    <PageToggles
      pageId={page.id}
      slug={page.slug}
      initialEncyclopedia={page.encyclopediaEnabled ?? false}
      initialRoast={page.roastEnabled ?? false}
      initialNewspaper={page.newspaperEnabled ?? false}
      initialPageSettings={page.pageSettings ?? {}}
    />
  );
}
