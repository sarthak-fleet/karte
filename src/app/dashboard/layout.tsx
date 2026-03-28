import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/dashboard/sidebar';
import { db, ensureProjectsTable } from '@/db';
import { pages } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  await ensureProjectsTable();

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id!),
    columns: { slug: true },
  });

  return (
    <div className="min-h-screen bg-gray-950 lg:flex">
      <Sidebar slug={page?.slug} />
      <main className="min-w-0 flex-1 px-4 pb-8 pt-4 sm:px-6 lg:h-screen lg:overflow-y-auto lg:p-8">
        {children}
      </main>
    </div>
  );
}
