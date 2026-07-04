/**
 * karte-email — inbound email Worker for *@karte.cc catch-all.
 *
 * Flow per inbound message:
 *   1. Read the raw MIME bytes from message.raw.
 *   2. Parse with postal-mime (from, to, subject, text, html).
 *   3. POST parsed payload to APP service binding at /api/email/inbound.
 *      The app looks up the page by slug, checks emailInboxEnabled,
 *      stores the body in R2 + metadata in D1, and sends a notification
 *      to the page owner's real email via the EMAIL send binding.
 *
 * Why no message.forward(): Cloudflare's message.forward() only works
 * with pre-verified destination addresses (max 200 per zone). Since each
 * page owner has their own real email (Google OAuth), we can't pre-verify
 * all of them. Instead, the app sends a notification via the EMAIL send
 * binding pointing the owner to /dashboard/email to read the message.
 *
 * Silent-drop: if the app returns { dropped: true } (page missing or
 * inbox disabled), we accept it and move on — no retry, no bounce.
 */

import PostalMime from 'postal-mime';

interface AppEnv {
  APP: Fetcher;
  EMAIL_INBOUND_SECRET: string;
}

interface InboundEmailMessage {
  from: string;
  to: string;
  headers: Headers;
  raw: ReadableStream;
  rawSize: number;
  setReject(reason: string): void;
}

export default {
  async email(message: InboundEmailMessage, env: AppEnv): Promise<void> {
    const secret = env.EMAIL_INBOUND_SECRET?.trim();
    if (!secret) {
      console.error('[karte-email] EMAIL_INBOUND_SECRET not set — dropping');
      message.setReject('server misconfigured');
      return;
    }

    // Read the raw MIME bytes (single-use stream — buffer first).
    let rawBytes: Uint8Array;
    try {
      const buf = await new Response(message.raw).arrayBuffer();
      rawBytes = new Uint8Array(buf);
    } catch (err) {
      console.error('[karte-email] failed to read raw stream', err);
      message.setReject('could not read message');
      return;
    }

    // Parse with postal-mime. Falls back to envelope headers if parse fails.
    let parsed: {
      from?: { address?: string; name?: string } | null;
      to?: Array<{ address?: string; name?: string }> | null;
      subject?: string;
      text?: string;
      html?: string;
    } = {};
    try {
      parsed = await PostalMime.parse(rawBytes);
    } catch (err) {
      console.warn(
        '[karte-email] postal-mime parse failed, using envelope',
        err,
      );
    }

    const fromAddress =
      parsed.from?.address ?? extractAddress(message.from) ?? message.from;
    const fromName = parsed.from?.name ?? null;
    const toAddress =
      parsed.to?.[0]?.address ?? extractAddress(message.to) ?? message.to;
    const subject = parsed.subject ?? message.headers.get('subject') ?? null;
    const text = parsed.text ?? null;
    const html = parsed.html ?? null;

    const inboundUrl = 'https://linkchat.internal/api/email/inbound';
    try {
      const res = await env.APP.fetch(inboundUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-email-inbound-secret': secret,
        },
        body: JSON.stringify({
          to: toAddress,
          from: fromAddress,
          fromName,
          subject,
          text,
          html,
        }),
      });

      if (!res.ok) {
        console.error(
          `[karte-email] app rejected inbound: ${res.status} ${await res.text().catch(() => '')}`,
        );
        // Don't reject the email — a 4xx/5xx here usually means a transient
        // app issue. Rejecting would generate a bounce to the sender.
      }
    } catch (err) {
      console.error('[karte-email] failed to reach app inbound', err);
    }
  },
} satisfies ExportedHandler<AppEnv>;

function extractAddress(header: string): string | null {
  // "Name <addr@x>" → "addr@x"
  const match = header.match(/<([^>]+)>/);
  return match ? match[1] : null;
}
