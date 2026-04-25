import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { db, ensureProjectsTable } from '@/db';
import { pages, generatedPages } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { EncyclopediaEditor } from '@/components/dashboard/encyclopedia-editor';
import { normalizeEncyclopediaContent } from '@/lib/encyclopedia-compat';

export default async function DashboardEncyclopediaPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  await ensureProjectsTable();

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
  });

  if (!page) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-2xl font-bold text-white">Encyclopedia</h1>
        <p className="text-gray-400">Create a profile first to manage your encyclopedia.</p>
      </div>
    );
  }

  const [existing] = await db
    .select()
    .from(generatedPages)
    .where(
      and(
        eq(generatedPages.pageId, page.id),
        eq(generatedPages.type, 'encyclopedia'),
      ),
    )
    .limit(1);

  const content = normalizeEncyclopediaContent(existing?.content) ?? null;

  if (!content) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-2xl font-bold text-white">Encyclopedia</h1>
        <div className="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-gray-400">
            Generate your encyclopedia first from the{' '}
            <a href="/dashboard/pages" className="text-white underline underline-offset-2 transition hover:text-gray-300">
              Pages tab
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return <EncyclopediaEditor pageId={page.id} initialContent={content} />;
}
