# ADR 0002 — Durable `RateLimiterDO` over in-memory limiter

Date: 2026-07-03. Status: Accepted.

## Context

The original rate limiter (`src/lib/rate-limit.ts`) was an in-memory sliding
window. It explicitly documented that it "resets on deploy" and is "not
distributed" — fine for a single isolate but wrong across the Cloudflare
Workers platform, where many isolates run concurrently and every deploy wipes
counts.

## Decision

Replace the in-memory limiter with a `RateLimiterDO` Durable Object
(`rate-limiter-do.mjs`), bound as `RATE_LIMITER_DO` and re-exported from
`worker.mjs`. Keep the same 20 req/min per-IP default. Make every caller
`await rateLimit(...)` (now async). Fail open to per-isolate in-memory when
the DO is missing (local dev) or errors/times out.

## Consequences

- Counts survive deploys and are shared across isolates.
- A DO outage degrades to weaker per-isolate limiting, never an outage.
- The stale `unsafe` native ratelimit binding was removed.
- Tighter per-endpoint caps remain a deliberate future decision, not a
  default — see `docs/current/project-status.md` deferred items.
- See `docs/architecture/rate-limiter.md`.
