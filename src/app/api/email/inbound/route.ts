import { and, asc, eq, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { pages, receivedEmails, user } from '@/db/schema';
import { sendInboxNotification } from '@/lib/inbound-email';
import {
  createEmailBodyObjectKey,
  deleteEmailBodyFromR2,
  uploadEmailBodyToR2,
} from '@/lib/r2';

// Internal endpoint invoked by the standalone email-worker (email-worker/)
// after it parses an inbound MIME message addressed to slug@karte.cc.
// Authenticated via a shared secret header — NOT a user-facing route.
//
// Flow:
//   1. email-worker receives `email` event, parses with postal-mime
//   2. POSTs { to, from, fromName, subject, text, html } here
//   3. this route looks up the page by slug (left of @), checks
//      emailInboxEnabled, stores body in R2 + metadata in D1
//   4. sends a notification to the page owner's real email via the
//      EMAIL send binding (not message.forward — that requires
//      pre-verified destination addresses, which doesn't scale)
//
// Silent-drop semantics: if the page is missing or inbox disabled, we
// return 200 with { dropped: true } so the worker doesn't retry.

const MAX_STORED_PER_PAGE = 50;
const MAX_BODY_BYTES = 1_000_000; // 1 MB hard cap on stored body
const PREVIEW_LENGTH = 500;

function getInboundSecret(): string | null {
  const v = process.env.EMAIL_INBOUND_SECRET?.trim();
  return v ? v : null;
}

function extractSlug(toAddress: string): string | null {
  const at = toAddress.lastIndexOf('@');
  if (at <= 0) return null;
  const local = toAddress.slice(0, at).trim().toLowerCase();
  return local || null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: Request) {
  const secret = getInboundSecret();
  if (!secret) {
    return NextResponse.json(
      { error: 'EMAIL_INBOUND_SECRET not configured' },
      { status: 500 },
    );
  }

  const provided = req.headers.get('x-email-inbound-secret') ?? '';
  if (!timingSafeEqual(provided, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    to: string;
    from: string;
    fromName?: string | null;
    subject?: string | null;
    text?: string | null;
    html?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body?.to || !body?.from) {
    return NextResponse.json({ error: 'Missing to/from' }, { status: 400 });
  }

  const slug = extractSlug(body.to);
  if (!slug) {
    return NextResponse.json({ dropped: true, reason: 'bad-address' });
  }

  const page = await db.query.pages.findFirst({
    where: eq(pages.slug, slug),
    columns: {
      id: true,
      emailInboxEnabled: true,
      userId: true,
    },
  });

  if (!page?.emailInboxEnabled) {
    // Silent drop — don't make the worker retry. The email was already
    // forwarded (or not) by the worker before calling us; we just don't
    // store an inbox copy for pages that haven't opted in.
    return NextResponse.json({ dropped: true, reason: 'inbox-disabled' });
  }

  // Store the parsed { text, html } envelope in R2 as JSON. The email
  // worker already parsed the MIME with postal-mime, so we don't need to
  // re-parse here. Capped at MAX_BODY_BYTES total.
  const text = body.text ?? null;
  const html = body.html ?? null;
  const envelope = JSON.stringify({ text, html });
  let r2Key: string | null = null;
  if (envelope.length <= MAX_BODY_BYTES) {
    r2Key = createEmailBodyObjectKey(page.id);
    try {
      await uploadEmailBodyToR2({ objectKey: r2Key, body: envelope });
    } catch {
      // R2 write failed — still store the metadata row so the preview
      // surfaces. r2Key stays set; the read endpoint will 404 gracefully.
      r2Key = null;
    }
  }

  const textPreview = (body.text ?? '').slice(0, PREVIEW_LENGTH) || null;

  const [inserted] = await db
    .insert(receivedEmails)
    .values({
      pageId: page.id,
      fromAddress: body.from,
      fromName: body.fromName ?? null,
      subject: body.subject ?? null,
      textPreview,
      r2Key,
    })
    .returning({ id: receivedEmails.id });

  // Enforce the per-page cap: evict oldest non-deleted rows beyond 50.
  // Done after insert so the new row is never the one evicted. Per-row
  // updates (drizzle has no `in` helper on D1) — the evict set is small.
  const allRows = await db
    .select({ id: receivedEmails.id, r2Key: receivedEmails.r2Key })
    .from(receivedEmails)
    .where(
      and(
        eq(receivedEmails.pageId, page.id),
        ne(receivedEmails.status, 'deleted'),
      ),
    )
    .orderBy(asc(receivedEmails.receivedAt));

  if (allRows.length > MAX_STORED_PER_PAGE) {
    const toEvict = allRows.slice(0, allRows.length - MAX_STORED_PER_PAGE);
    for (const row of toEvict) {
      if (row.r2Key) {
        try {
          await deleteEmailBodyFromR2(row.r2Key);
        } catch {
          // non-fatal
        }
      }
      await db
        .update(receivedEmails)
        .set({ status: 'deleted', deletedAt: new Date() })
        .where(eq(receivedEmails.id, row.id));
    }
  }

  // Send a notification to the page owner's real email so they know a
  // message arrived. The actual content is read in /dashboard/email —
  // we don't forward the original body to avoid the verified-destination
  // requirement and to keep the owner's real inbox clean (one short
  // notification per message, not the full forwarded email).
  const [owner] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, page.userId))
    .limit(1);

  if (owner?.email) {
    try {
      await sendInboxNotification({
        to: owner.email,
        slug,
        fromAddress: body.from,
        fromName: body.fromName ?? null,
        subject: body.subject ?? null,
        preview: textPreview,
      });
    } catch (err) {
      // Notification failure is non-fatal — the message is already
      // stored and visible in the dashboard. Log and move on.
      console.error('[email-inbound] notification send failed', err);
    }
  }

  return NextResponse.json({ ok: true, id: inserted?.id });
}
