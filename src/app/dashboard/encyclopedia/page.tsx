import { and, eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { EncyclopediaEditor } from '@/components/dashboard/encyclopedia-editor';
import { db, ensureProjectsTable } from '@/db';
import { generatedPages } from '@/db/schema';
import { getCurrentPage, getSession } from '@/lib/auth-server';
import { normalizeEncyclopediaContent } from '@/lib/encyclopedia-compat';

export default async function DashboardEncyclopediaPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  await ensureProjectsTable();

  const page = await getCurrentPage(session.user.id);

  if (!page) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-2xl font-bold text-karte-text">
          Encyclopedia
        </h1>
        <p className="text-karte-text-3">
          Create a profile first to manage your encyclopedia.
        </p>
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
        <h1 className="mb-4 text-2xl font-bold text-karte-text">
          Encyclopedia
        </h1>
        <div className="rounded-2xl bg-white/[0.02] p-6">
          <p className="text-karte-text-3">
            Generate your encyclopedia first from the{' '}
            <Link
              href="/dashboard/pages"
              className="text-karte-text underline underline-offset-2 transition hover:text-karte-text-2"
            >
              Pages tab
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return <EncyclopediaEditor pageId={page.id} initialContent={content} />;
}
