import { and, desc, eq, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { receivedEmails } from '@/db/schema';
import { loadOwnedPage } from '@/lib/api-auth';
import { getSession } from '@/lib/auth-server';

// Lists non-deleted received emails for a page (dashboard inbox view).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId } = await params;
  const page = await loadOwnedPage(pageId, session.user.id);
  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rows = await db
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
        eq(receivedEmails.pageId, pageId),
        ne(receivedEmails.status, 'deleted'),
      ),
    )
    .orderBy(desc(receivedEmails.receivedAt));

  // hasBody comes back as the r2Key string (truthy) or null. Normalize to
  // a boolean so the client doesn't see the private R2 key.
  const safe = rows.map((r) => ({ ...r, hasBody: Boolean(r.hasBody) }));

  return NextResponse.json({ messages: safe });
}
