import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { ProjectEditor } from '@/components/dashboard/project-editor';
import { db, ensureProjectsTable } from '@/db';
import { projects } from '@/db/schema';
import { getCurrentPage, getSession } from '@/lib/auth-server';

export default async function ProjectsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const page = await getCurrentPage(session.user.id);

  if (!page) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-karte-text">Projects</h1>
        <p className="text-sm text-karte-text-3">
          Create a page first from the Appearance tab.
        </p>
      </div>
    );
  }

  await ensureProjectsTable();

  const pageProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.pageId, page.id))
    .orderBy(projects.sortOrder);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-karte-text">Projects</h1>
      <p className="mb-6 text-sm text-karte-text-3">
        Showcase work with a title, link, image, and description. Drag to reorder.
      </p>
      <ProjectEditor pageId={page.id} initialProjects={pageProjects} />
    </div>
  );
}
