import 'server-only';

import { getCloudflareContext } from '@opennextjs/cloudflare';

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

export async function sendAgentAuthCode(
  email: string,
  code: string,
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://karte.cc';
  const from = getFromAddress();
  const subject = `${code} is your Karte agent sign-in code`;
  const text = [
    `Your Karte agent sign-in code is ${code}.`,
    'It expires in 10 minutes.',
    '',
    `Verify at ${appUrl}/api/auth/agent/verify-code`,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n');
  const html = [
    `<p>Your Karte agent sign-in code is <strong>${code}</strong>.</p>`,
    '<p>It expires in 10 minutes.</p>',
    `<p>Verify at <a href="${appUrl}/api/auth/agent/verify-code">${appUrl}/api/auth/agent/verify-code</a></p>`,
    '<p>If you did not request this, you can ignore this email.</p>',
  ].join('');

  const sender = getEmailBinding();
  if (!sender) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('EMAIL binding is not configured');
    }
    console.info(`[agent-auth] sign-in code for ${email}: ${code}`);
    return;
  }

  await sender.send({
    to: email,
    from,
    subject,
    text,
    html,
  });
}
