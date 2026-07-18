# ADR 0003 — Notify, not forward, for inbound email

Date: 2026-07 (email inbox feature). Status: Accepted.

## Context

Each page can opt into `slug@karte.cc`. Mail arrives via Cloudflare Email
Routing → the standalone `karte-email` worker. The natural "just forward it
to the owner's real inbox" path is blocked: `message.forward()` in Email
Workers only works with **pre-verified destination addresses** (max 200 per
zone). Each page owner has their own Google OAuth email, which can't be
pre-verified ahead of time.

## Decision

Don't forward. The app stores the parsed body in R2 + metadata in D1
(`receivedEmails`) and sends a **short notification** via the existing `EMAIL`
`send_email` binding pointing the owner to `/dashboard/email` to read the full
message.

## Consequences

- No per-user verified-destination friction; no 200-address zone limit.
- Owner's real inbox stays clean (one short notification, not potentially
  large/spam forwarded mail).
- Uses the existing 3,000/month outbound email quota (Workers Paid).
- Trade-off: the original sender's `From` is not preserved in the
  notification (it comes from `noreply@karte.cc`), and the owner must click
  through to the dashboard to read the actual content.
- See `docs/product/email-inbox.md`.
