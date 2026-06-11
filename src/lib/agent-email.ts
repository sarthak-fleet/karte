import 'server-only';

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendAgentAuthCode(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Karte <noreply@karte.cc>';

  if (!apiKey) {
    console.info(`[agent-auth] sign-in code for ${email}: ${code}`);
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `${code} is your Karte agent sign-in code`,
      text: [
        `Your Karte agent sign-in code is ${code}.`,
        'It expires in 10 minutes.',
        '',
        'Enter this code in the sign-in form on the page where you requested it.',
        '',
        'If you did not request this, you can ignore this email.',
      ].join('\n'),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Failed to send sign-in email (${response.status}): ${body}`);
  }
}
