import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { InboxMessageList } from '@/components/dashboard/inbox-message-list';
import { db, ensureProjectsTable } from '@/db';
import { contactSubmissions,pages } from '@/db/schema';
import { getSession } from '@/lib/auth-server';

export default async function InboxPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  await ensureProjectsTable();

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
  });

  if (!page) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-white">Inbox</h1>
        <p className="text-sm text-gray-400">
          Create a page first to receive direct messages and contact submissions.
        </p>
      </div>
    );
  }

  const messages = await db
    .select()
    .from(contactSubmissions)
    .where(eq(contactSubmissions.pageId, page.id))
    .orderBy(desc(contactSubmissions.createdAt));

  const anonymousCount = messages.filter(
    (message) => message.senderType === 'anonymous',
  ).length;
  const verifiedCount = messages.length - anonymousCount;
  const unreadCount = messages.filter((message) => message.status === 'unread').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-white">Inbox</h1>
        <p className="text-sm text-gray-400">
          Direct messages and contact submissions from your public profile.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total messages', value: messages.length },
          { label: 'Unread', value: unreadCount },
          { label: 'Verified / Anonymous', value: `${verifiedCount} / ${anonymousCount}` },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl"
          >
            <p className="text-sm text-white/70">{metric.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/20 bg-white/5 p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white">Trust Settings</p>
            <p className="mt-1 text-xs leading-5 text-gray-400">
              DM mode is controlled in Appearance. Email-verified DMs use the
              visitor&apos;s signed-in account email; anonymous DMs store no
              email address.
            </p>
          </div>
          <Link
            href="/dashboard/appearance"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-white/10"
          >
            Configure DMs
          </Link>
        </div>
      </div>

      <InboxMessageList pageId={page.id} initialMessages={messages} />
    </div>
  );
}
