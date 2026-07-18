# Email inbox (slug@karte.cc)

Every page can opt into a `slug@karte.cc` inbound email address. Mail is
stored in-app for a read-only inbox view at `/dashboard/email`, and the
page owner gets a short notification in their real inbox pointing them
to the dashboard to read it.

## Architecture

```
sender ──SMTP──► Cloudflare Email Routing (karte.cc zone)
                    │ catch-all *@karte.cc ──► karte-email Worker
                    ▼
              email-worker/ (standalone Worker)
                1. Parse MIME with postal-mime (from, to, subject, text, html)
                2. POST parsed payload to /api/email/inbound (APP binding)
                    ▼
              Next.js app (linkchat Worker)
                - Look up page by slug (left of @)
                - If !emailInboxEnabled → silent drop (200, no retry)
                - Store { text, html } in R2 (IMAGES_BUCKET)
                - Insert receivedEmails row in D1 (preview + r2Key)
                - Enforce 50-msg-per-page cap (evict oldest)
                - Send notification to owner's real email via EMAIL binding
                    ▼
              /dashboard/email — list + read view (sanitized HTML)
```

Two Workers are involved:
- **`linkchat`** (main app, OpenNext) — holds D1 + R2 + send_email bindings,
  serves the dashboard and the `/api/email/inbound` route.
- **`karte-email`** (standalone, `email-worker/`) — handles the `email`
  event, parses MIME with `postal-mime`, and hands the parsed body to the
  app via the `APP` service binding.

## Why notify, not forward

`message.forward()` in Email Workers only works with **pre-verified
destination addresses** (max 200 per zone). Since each page owner has
their own real email (Google OAuth), we can't pre-verify all of them
ahead of time. Instead, the app sends a short notification via the
existing `EMAIL` send_email binding (the same one used for agent auth
codes) pointing the owner to `/dashboard/email` to read the full
message. This:

- Avoids the verified-destination friction (no per-user verification step)
- Avoids the 200-address zone limit
- Keeps the owner's real inbox clean (one short notification, not the
  full forwarded email — which could be spam or large)
- Uses the existing 3,000/month outbound email quota (Workers Paid plan)

The trade-off: the original sender's From header is not preserved in
the notification (it comes from `noreply@karte.cc`), and the owner has
to click through to the dashboard to read the actual content.

## Setup (one-time)

1. **Email Routing on the zone** (Cloudflare dashboard):
   - Email → Email Routing → Enable for `karte.cc`.
   - Add catch-all rule `*@karte.cc` → Worker `karte-email`.
   - Cloudflare auto-creates MX/SPF records. Verify DMARC is set
     (`_dmarc.karte.cc TXT "v=DMARC1; p=none;"` is fine for v1).

2. **Shared secret** — both Workers must agree on `EMAIL_INBOUND_SECRET`:
   ```bash
   # main app
   echo "<random-32-byte-hex>" | wrangler secret put EMAIL_INBOUND_SECRET --name linkchat
   # email worker (from email-worker/)
   echo "<same-value>" | wrangler secret put EMAIL_INBOUND_SECRET
   ```

3. **Apply the D1 migration**:
   ```bash
   wrangler d1 execute linkchat-auth --remote \
     --file=migrations/d1/009_email_inbox.sql
   ```

4. **Deploy the email worker** (from `email-worker/`):
   ```bash
   pnpm install
   pnpm deploy
   ```

5. **Redeploy the main app** so the new routes + schema are live:
   ```bash
   pnpm deploy:cf
   ```

## Per-page opt-in

Each page must enable the inbox in `/dashboard/email` (or via
`PUT /api/pages/{pageId}` with `emailInboxEnabled: true`). Mail for
slugs that haven't opted in is silently dropped — no bounce, no store,
no notification. This is the primary spam-control mechanism.

## Limits

- 50 stored messages per page (oldest evicted on overflow, R2 body deleted).
- 1 MB max body size; larger bodies are dropped (metadata row still created).
- 25 MiB max inbound message size (Cloudflare Email Routing hard limit).
- 3,000 outbound notification emails/month included on Workers Paid,
  then $0.35/1,000. Inbound routing is free and unlimited.
- HTML rendered in the dashboard is sanitized via `sanitize-html` (no
  scripts, no inline styles, no iframes).

## Cost

Covered by the existing $5/mo Workers Paid plan:
- Inbound Email Routing: free, unlimited.
- Email Worker requests: billed as regular Worker requests (within the
  10M/month included tier).
- Outbound notifications: 3,000/month included, then $0.35/1,000.
- R2 storage for bodies: ~$0.015/GB, well within free tier for text.
- D1: within existing free tier.

No new subscription required.

## Files

- `src/db/schema.ts` — `receivedEmails` table + `pages.emailInboxEnabled`
- `migrations/d1/009_email_inbox.sql` — D1 schema
- `src/app/api/email/inbound/route.ts` — worker → app store + notify
- `src/app/api/pages/[pageId]/emails/route.ts` — dashboard list
- `src/app/api/pages/[pageId]/emails/[emailId]/route.ts` — dashboard read/delete
- `src/app/dashboard/email/page.tsx` — dashboard inbox UI
- `src/components/dashboard/email-inbox.tsx` — client component
- `src/lib/inbound-email.ts` — notification sender (EMAIL binding)
- `src/lib/r2.ts` — private email body R2 helpers
- `email-worker/` — standalone inbound Worker

## Verifying it works

After completing the setup steps above:

1. Go to `/dashboard/email` and enable the inbox for your page.
2. Send a test email from an external account (e.g. Gmail) to
   `yourslug@karte.cc`.
3. Within a few seconds:
   - The message should appear in `/dashboard/email`.
   - A notification should arrive at your account email (the one you
     signed in with) with a link to read the full message.
4. Click the message in the dashboard to expand it and read the full
   body (sanitized HTML or plain text).
5. Click Delete to remove it (R2 body is also deleted).

If messages don't arrive:
- Check Cloudflare dashboard → Email → Email Routing → Logs for the
  catch-all rule. If the catch-all isn't firing, the MX records may not
  be set up.
- Check the `karte-email` Worker logs in Cloudflare dashboard →
  Workers & Pages → karte-email → Logs for parse errors or app POST
  failures.
- Check the main app Worker logs for `/api/email/inbound` errors.
- Verify `EMAIL_INBOUND_SECRET` matches on both Workers.
