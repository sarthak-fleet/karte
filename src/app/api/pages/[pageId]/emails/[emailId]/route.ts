import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { receivedEmails } from '@/db/schema';
import { loadOwnedPage } from '@/lib/api-auth';
import { getSession } from '@/lib/auth-server';
import { deleteEmailBodyFromR2, getEmailBodyFromR2 } from '@/lib/r2';

// Fetches the full body for a single email (dashboard message view).
// Marks the email as read on first fetch.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; emailId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId, emailId } = await params;
  const page = await loadOwnedPage(pageId, session.user.id);
  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [row] = await db
    .select()
    .from(receivedEmails)
    .where(
      and(eq(receivedEmails.id, emailId), eq(receivedEmails.pageId, pageId)),
    )
    .limit(1);

  if (!row || row.status === 'deleted') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Mark read on open if not already.
  if (row.status === 'unread') {
    await db
      .update(receivedEmails)
      .set({ status: 'read', readAt: new Date() })
      .where(eq(receivedEmails.id, emailId));
  }

  let text: string | null = null;
  let html: string | null = null;
  if (row.r2Key) {
    const bytes = await getEmailBodyFromR2(row.r2Key);
    if (bytes) {
      try {
        const envelope = JSON.parse(new TextDecoder().decode(bytes)) as {
          text?: string | null;
          html?: string | null;
        };
        text = envelope.text ?? null;
        html = envelope.html ?? null;
      } catch {
        // Corrupt or legacy envelope — fall back to raw text.
        text = new TextDecoder().decode(bytes);
      }
    }
  }

  return NextResponse.json({
    id: row.id,
    fromAddress: row.fromAddress,
    fromName: row.fromName,
    subject: row.subject,
    textPreview: row.textPreview,
    receivedAt: row.receivedAt,
    status: row.status === 'unread' ? 'read' : row.status,
    text,
    html,
  });
}

// Soft-deletes an email + removes its R2 body.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; emailId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId, emailId } = await params;
  const page = await loadOwnedPage(pageId, session.user.id);
  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [row] = await db
    .select({ id: receivedEmails.id, r2Key: receivedEmails.r2Key })
    .from(receivedEmails)
    .where(
      and(eq(receivedEmails.id, emailId), eq(receivedEmails.pageId, pageId)),
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (row.r2Key) {
    try {
      await deleteEmailBodyFromR2(row.r2Key);
    } catch {
      // non-fatal
    }
  }

  await db
    .update(receivedEmails)
    .set({ status: 'deleted', deletedAt: new Date(), r2Key: null })
    .where(eq(receivedEmails.id, emailId));

  return NextResponse.json({ ok: true });
}
