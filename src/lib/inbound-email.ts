import 'server-only';

import { getCloudflareContext } from '@opennextjs/cloudflare';

// Notification sender for the slug@karte.cc inbound inbox. Mirrors the
// pattern in agent-email.ts but for "you got a message" notifications.
// The actual message body is NOT included — the owner reads it in
// /dashboard/email. This keeps the notification short and avoids
// forwarding potentially large/spammy content to the owner's real inbox.

type EmailSender = {
  send: (message: {
    to: string;
    from: { email: string; name?: string };
    subject: string;
    text: string;
    html?: string;
  }) => Promise<{ messageId?: string }>;
};

function getEmailBinding(): EmailSender | null {
  try {
    const { env } = getCloudflareContext();
    return (env as { EMAIL?: EmailSender }).EMAIL ?? null;
  } catch {
    return null;
  }
}

function getFromAddress() {
  const address = process.env.EMAIL_FROM_ADDRESS || 'noreply@karte.cc';
  const name = process.env.EMAIL_FROM_NAME || 'Karte';
  return { email: address, name };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendInboxNotification(args: {
  to: string;
  slug: string;
  fromAddress: string;
  fromName: string | null;
  subject: string | null;
  preview: string | null;
}): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://karte.cc';
  const from = getFromAddress();
  const inboxAddress = `${args.slug}@karte.cc`;
  const senderLabel = args.fromName
    ? `${args.fromName} <${args.fromAddress}>`
    : args.fromAddress;
  const subjectLine = args.subject
    ? `New message to ${inboxAddress}: "${args.subject}"`
    : `New message to ${inboxAddress}`;

  const previewSnippet = args.preview
    ? args.preview.slice(0, 200) + (args.preview.length > 200 ? '…' : '')
    : null;

  const text = [
    `You received a message at ${inboxAddress}.`,
    '',
    `From: ${senderLabel}`,
    args.subject ? `Subject: ${args.subject}` : '',
    previewSnippet ? `Preview: ${previewSnippet}` : '',
    '',
    `Read the full message at ${appUrl}/dashboard/email`,
    '',
    '— Karte',
  ]
    .filter(Boolean)
    .join('\n');

  const html = [
    `<p>You received a message at <strong>${escapeHtml(inboxAddress)}</strong>.</p>`,
    `<p>From: ${escapeHtml(senderLabel)}</p>`,
    args.subject ? `<p>Subject: ${escapeHtml(args.subject)}</p>` : '',
    previewSnippet
      ? `<p style="color:#666">Preview: ${escapeHtml(previewSnippet)}</p>`
      : '',
    `<p><a href="${appUrl}/dashboard/email">Read the full message</a></p>`,
    '<p style="color:#999;font-size:12px">— Karte</p>',
  ]
    .filter(Boolean)
    .join('');

  const sender = getEmailBinding();
  if (!sender) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('EMAIL binding is not configured');
    }
    console.info(`[inbound-email] notification for ${args.to}: ${subjectLine}`);
    return;
  }

  await sender.send({
    to: args.to,
    from,
    subject: subjectLine,
    text,
    html,
  });
}
