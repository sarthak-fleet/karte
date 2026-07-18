# Rate limiter — durable sliding window

`src/lib/rate-limit.ts` is backed by the `RateLimiterDO` Durable Object
(`rate-limiter-do.mjs`), exported from `worker.mjs` and bound as
`RATE_LIMITER_DO` in `wrangler.jsonc`.

## Why durable

A previous in-memory limiter reset on every deploy and wasn't shared across
isolates, so counts survived neither deploys nor concurrent isolates. The
Durable Object holds the sliding window in DO storage, so:

- counts survive deploys,
- counts are shared across all isolates,
- the same 20 req/min per-IP default semantics are preserved.

All `rateLimit(...)` callers were updated to `await` (the call is now async).

## Fail-open behavior

The limiter **fails open** to a per-isolate in-memory fallback when:

- the DO binding is missing (local dev, where `RATE_LIMITER_DO` isn't wired), or
- the DO errors, or
- the DO call times out.

This means a DO outage never takes the app down — it just weakens limiting to
per-isolate in-memory. Acceptable; tightening is a deliberate future decision
(see `docs/current/project-status.md` deferred items).

## Configuration

- Default: 20 req/min per IP.
- AI generate endpoints use tighter owner-auth + per-endpoint caps (see
  `docs/knowledge/audits/security-audit-2026-03-28.md`).
- The legacy `unsafe` native ratelimit binding was removed when the DO shipped
  (2026-07-03).

## Decision record

`docs/architecture/decisions/0002-durable-rate-limiter.md`.
