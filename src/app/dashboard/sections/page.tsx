import { asc,eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { SectionEditor } from '@/components/dashboard/section-editor';
import { db, ensureProjectsTable } from '@/db';
import { pages, pageSections } from '@/db/schema';
import { getSession } from '@/lib/auth-server';

export default async function SectionsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  await ensureProjectsTable();

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
  });

  if (!page) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-white">Blocks & Blogs</h1>
        <p className="text-sm text-gray-400">
          Create a page first from the Appearance tab.
        </p>
      </div>
    );
  }

  const sections = await db
    .select()
    .from(pageSections)
    .where(eq(pageSections.pageId, page.id))
    .orderBy(asc(pageSections.sortOrder));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Blocks & Blogs</h1>
      <p className="mb-6 text-sm text-gray-400">
        Build and reorder structured content blocks, including blog posts, for the public page.
      </p>
      <SectionEditor pageId={page.id} initialSections={sections} />
    </div>
  );
}
