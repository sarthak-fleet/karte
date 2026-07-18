# ADR 0001 — Edge worker over Next.js middleware/proxy

Date: 2026-05 (consolidated from existing notes). Status: Accepted.

## Context

Karte needs request-time guards that run before the app: dashboard redirects,
custom-domain rewrites, landing fast path, profile cache headers, and
agent-indexing surfaces (`llms.txt`, `/api/ai`, `robots.txt`).

Next.js middleware (`middleware.ts`) was the natural home historically. In
Next 16, middleware moved to `proxy.ts` and runs on the **Node.js runtime**.
The Cloudflare OpenNext adapter does not support a Node.js-runtime proxy.

## Decision

Implement all pre-app guards in a custom Worker entry (`worker.mjs`) plus
`worker-routing.mjs` and `agent-edge.mjs`, which run on the Workers runtime
before the OpenNext handler.

## Consequences

- Guards work on Cloudflare Workers as intended.
- **Do not reintroduce `middleware.ts` / `proxy.ts`** for these guards — it
  will not run on the OpenNext adapter.
- Logic that could live in middleware (e.g. host rewrite) lives in plain JS
  modules instead; test accordingly.
- See `docs/architecture/edge-worker.md` for the file map.
