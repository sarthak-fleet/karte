import { and, desc, eq, ne } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { EmailInbox } from '@/components/dashboard/email-inbox';
import { db } from '@/db';
import { receivedEmails } from '@/db/schema';
import { getCurrentPage, getSession } from '@/lib/auth-server';

export default async function EmailPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const page = await getCurrentPage(session.user.id);

  if (!page) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-karte-text">
            Email inbox
          </h1>
          <p className="text-sm text-karte-text-3">
            Create a page first to enable your slug@karte.cc address.
          </p>
        </div>
      </div>
    );
  }

  const messages = await db
    .select({
      id: receivedEmails.id,
      fromAddress: receivedEmails.fromAddress,
      fromName: receivedEmails.fromName,
      subject: receivedEmails.subject,
      textPreview: receivedEmails.textPreview,
      status: receivedEmails.status,
      receivedAt: receivedEmails.receivedAt,
      readAt: receivedEmails.readAt,
      hasBody: receivedEmails.r2Key,
    })
    .from(receivedEmails)
    .where(
      and(
        eq(receivedEmails.pageId, page.id),
        ne(receivedEmails.status, 'deleted'),
      ),
    )
    .orderBy(desc(receivedEmails.receivedAt));

  const unreadCount = messages.filter((m) => m.status === 'unread').length;
  const safeMessages = messages.map((m) => ({
    ...m,
    hasBody: Boolean(m.hasBody),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-karte-text">Email inbox</h1>
        <p className="text-sm text-karte-text-3">
          Mail sent to your slug@karte.cc address appears here and is forwarded
          to your real inbox.
        </p>
      </div>

      <EmailInbox
        pageId={page.id}
        slug={page.slug}
        emailInboxEnabled={page.emailInboxEnabled ?? false}
        unreadCount={unreadCount}
        initialMessages={safeMessages}
      />
    </div>
  );
}
