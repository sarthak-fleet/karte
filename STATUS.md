# STATUS — Karte (linkchat)

Last updated: 2026-07-18. This is the **living** short view. Durable record
(timeline, products, feature inventory, dependencies) lives at
[`docs/current/project-status.md`](docs/current/project-status.md).

## Objective

Keep Karte available for direct personal use as a public inbound assistant:
creators publish a shareable page at `karte.cc`; visitors browse links, ask
questions, send contact/email inbounds, and arrive with enough context for a
cleaner handoff.

> **Closure (2026-07-10):** No roadmap expansion. Accept only maintenance,
> reliability, or personally requested workflow fixes.

## Active work

- None in flight. Repo is in maintenance mode.

## Blockers

- **E2E tests assume a local dev server** — not run in CI by default (no
  documented CI harness for Playwright).
- **Custom domains serve 522** — verified hostnames don't serve traffic to a
  bare Worker (CF-for-SaaS limitation). Gated behind
  `CUSTOM_DOMAINS_LIVE = false`. Migration options in
  [`docs/knowledge/failed-approaches/custom-domains-saas-522.md`](docs/knowledge/failed-approaches/custom-domains-saas-522.md).

## Unresolved questions

- Should aggregates move from Turso to D1? Schema is compatible; decision
  pending traffic/operational evidence
  ([`docs/product/analytics.md`](docs/product/analytics.md)).
- Upgrade `@libsql/client` to silence the cold-start
  `[unenv] https.request is not implemented yet!` warning? Non-fatal today
  ([`docs/architecture/data.md`](docs/architecture/data.md)).
- Migrate custom domains to Workers for Platforms (or another architecture)
  to actually serve tenant hostnames?

## Next steps (if/when work resumes)

1. Harden rate limiting beyond the durable sliding-window limiter **only when
   traffic or abuse evidence justifies stricter per-endpoint caps**.
2. Keep AI-generated content reviewable and traceable for profile owners.
3. Wire richer PostHog funnels for mode usage (chat vs encyclopedia vs roast
   vs newspaper).
4. Public-profile TTFB (~1.3s) — quick wins documented in
   [`docs/knowledge/audits/perf-audit.md`](docs/knowledge/audits/perf-audit.md)
   (lazy-load chat-widget, add `<Suspense>`).

## Deferred (explicitly out of scope)

- Broad social-network features.
- Enterprise team management / CRM workflows.
- Stricter production rate limits without endpoint-specific evidence.
- Paid tiers / billing.

## Recent timeline (short)

- **2026-07-13** — Creator Opportunity Desk shipped (approval-first partnership briefs).
- **2026-07-09** — Repositioned as a public inbound assistant; inbound email feeds Lead Radar.
- **2026-07-03** — Durable `RateLimiterDO` replaced in-memory limiter.
- **2026-07-02** — Global try/catch added to OpenNext worker.

Full timeline: [`docs/current/project-status.md`](docs/current/project-status.md).
