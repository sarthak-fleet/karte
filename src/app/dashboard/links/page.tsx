import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { LinkEditor } from '@/components/dashboard/link-editor';
import { db } from '@/db';
import { links,pages } from '@/db/schema';
import { getSession } from '@/lib/auth-server';

export default async function LinksPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
  });

  if (!page) redirect('/dashboard');

  const pageLinks = await db
    .select()
    .from(links)
    .where(eq(links.pageId, page.id))
    .orderBy(links.sortOrder);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Manage Links</h1>
      <LinkEditor pageId={page.id} initialLinks={pageLinks} />
    </div>
  );
}
