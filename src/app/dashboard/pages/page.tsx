import { redirect } from 'next/navigation';

import { PageToggles } from '@/components/dashboard/page-toggles';
import { ensureProjectsTable } from '@/db';
import { getCurrentPage, getSession } from '@/lib/auth-server';

export default async function DashboardPagesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  await ensureProjectsTable();

  const page = await getCurrentPage(session.user.id);

  if (!page) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-2xl font-bold text-karte-text">Profile Modes</h1>
        <p className="text-karte-text-3">
          Create a profile first to manage generated modes.
        </p>
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
