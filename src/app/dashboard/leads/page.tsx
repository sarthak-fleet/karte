import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth-server';
import { db, ensureProjectsTable } from '@/db';
import { pages, contactSubmissions } from '@/db/schema';

export default async function LeadsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
  });

  if (!page) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-white">Leads</h1>
        <p className="text-sm text-gray-400">
          Create a page first to receive contact submissions.
        </p>
      </div>
    );
  }

  await ensureProjectsTable();

  const leads = await db
    .select()
    .from(contactSubmissions)
    .where(eq(contactSubmissions.pageId, page.id))
    .orderBy(desc(contactSubmissions.createdAt));

  function formatCreatedAt(value: typeof leads[number]['createdAt']) {
    if (!value) {
      return 'Just now';
    }

    return value instanceof Date
      ? value.toLocaleString()
      : new Date(value).toLocaleString();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-white">Leads</h1>
        <p className="text-sm text-gray-400">
          Contact submissions from your public profile.
        </p>
      </div>

      <div className="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">Total submissions</p>
            <p className="text-3xl font-bold text-white">{leads.length}</p>
          </div>
          <p className="text-xs text-gray-500">
            Page: <span className="text-white/80">/{page.slug}</span>
          </p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-white/20 bg-white/5 p-8 text-center backdrop-blur-xl">
          <p className="text-gray-400">
            No leads yet. Once the contact form is submitted, messages will show here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-2xl border border-white/20 bg-white/5 p-5 backdrop-blur-xl"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{lead.name}</p>
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-sm text-blue-300 hover:text-blue-200"
                  >
                    {lead.email}
                  </a>
                </div>
                <p className="text-xs text-gray-500">
                  {formatCreatedAt(lead.createdAt)}
                </p>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-300">
                {lead.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
