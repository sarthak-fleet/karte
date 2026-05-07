import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { contactSubmissions, pages } from '@/db/schema';
import { recordEvent } from '@/lib/analytics-server';
import { getSession } from '@/lib/auth-server';
import { rateLimit } from '@/lib/rate-limit';
import {
  isValidEmail,
  MAX_CONTACT_MESSAGE_LENGTH,
  MAX_CONTACT_NAME_LENGTH,
} from '@/lib/validation';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { ok } = rateLimit(`contact:${ip}:${slug}`);
  if (!ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const visitorId = typeof body.visitorId === 'string' ? body.visitorId.trim() : null;
  const sectionId = typeof body.sectionId === 'string' ? body.sectionId.trim() : null;
  const senderType = body.senderType === 'anonymous' ? 'anonymous' : 'email';

  if (!message || (senderType === 'email' && (!name || !email))) {
    return NextResponse.json(
      { error: 'name, email, and message are required' },
      { status: 400 },
    );
  }

  if (name.length > MAX_CONTACT_NAME_LENGTH) {
    return NextResponse.json(
      { error: 'Name too long (max 100 chars)' },
      { status: 400 },
    );
  }

  if (senderType === 'email' && !isValidEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  if (message.length > MAX_CONTACT_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: 'Message too long (max 2000 chars)' },
      { status: 400 },
    );
  }

  await ensureProjectsTable();

  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.published, true)));

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const isDmWidgetSubmission = !sectionId;
  let verifiedSender: { name: string; email: string } | null = null;

  if (isDmWidgetSubmission) {
    if (page.dmMode === 'off') {
      return NextResponse.json({ error: 'Direct messages are disabled' }, { status: 403 });
    }

    if (page.dmMode === 'email') {
      if (senderType !== 'email') {
        return NextResponse.json(
          { error: 'An email address is required for this profile' },
          { status: 400 },
        );
      }

      try {
        const session = await getSession();
        if (session?.user?.email) {
          verifiedSender = {
            name: session.user.name || name,
            email: session.user.email,
          };
        }
      } catch {
        verifiedSender = null;
      }

      if (!verifiedSender) {
        return NextResponse.json(
          { error: 'Sign in to send an email-verified direct message' },
          { status: 401 },
        );
      }
    }
  }

  const submissionName =
    senderType === 'anonymous' ? 'Anonymous' : verifiedSender?.name ?? name;
  const submissionEmail =
    senderType === 'anonymous' ? '' : verifiedSender?.email ?? email;

  const [submission] = await db
    .insert(contactSubmissions)
    .values({
      pageId: page.id,
      sectionId,
      visitorId,
      name: submissionName,
      email: submissionEmail,
      senderType,
      message,
    })
    .returning();

  await recordEvent({
    slug,
    pageId: page.id,
    visitorId,
    eventType: isDmWidgetSubmission ? 'dm_submit' : 'contact_submit',
    resourceType: isDmWidgetSubmission ? 'dm' : 'contact',
    resourceId: sectionId,
    resourceLabel: submissionName,
    metadata: {
      email: senderType === 'anonymous' ? null : submissionEmail,
      sectionId,
      senderType,
      verified: Boolean(verifiedSender),
    },
  });

  return NextResponse.json(submission, { status: 201 });
}
