# Observability

## Worker observability

`wrangler.jsonc` enables Worker observability at `head_sampling_rate: 0.1`
(10% of requests). View logs in the Cloudflare dashboard → Workers & Pages →
`linkchat` → Logs. CPU limit is 30s (`limits.cpu_ms`).

## Request timing

`worker.mjs` wraps the fetch handler with `withTiming()` (`timing.mjs`).
Client-side API timing uses the Resource Timing API (`src/lib/api-timing.ts`,
`src/lib/vitals.ts`).

## Analytics

Two analytics streams, kept separate:

- **Internal product analytics (PostHog):** activation, retention, feature
  usage for authenticated users. No PII / no private content; users
  identified by DB ID. `docs/product/analytics.md`.
- **Visitor analytics (Cloudflare Analytics Engine `ANALYTICS` binding + DB
  aggregates):** page views, outbound clicks, section views, chat/DM events.
  Raw events to Analytics Engine + DB; daily aggregates for dashboard totals.
  `docs/product/analytics.md`.

## Debugging a deploy

- Check Worker logs (Cloudflare dashboard) for runtime errors.
- `curl -w "@curl-format.txt" -o /dev/null -s "https://karte.cc/<route>"`
  for TTFB breakdown (see `docs/knowledge/audits/perf-audit.md`).
- Cloudflare Workers Analytics dashboard for p50/p95/p99 latencies — don't
  rely on cold local timing.
- For custom-domain 522s, see `docs/product/custom-domains.md` (known
  platform limitation).
- For inbound email, check Email Routing logs + `karte-email` worker logs +
  `/api/email/inbound` (`docs/product/email-inbox.md`).
