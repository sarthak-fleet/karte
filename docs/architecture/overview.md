# Architecture overview

Karte is a Next.js 16 app deployed to Cloudflare Workers via OpenNext, with a
custom edge worker in front. Local dev runs plain Next.js against a local
SQLite file; production runs on Workers against Turso + D1 + R2.

## Request flow

```
Browser ──► Cloudflare edge
              │
              ▼
         worker.mjs  (custom entry, wraps OpenNext)
              │
              ├─ agent-edge.mjs        → /llms.txt, /llms-full.txt, /api/ai, /robots.txt (fleet GEO)
              ├─ worker-routing.mjs    → custom-hostname rewrite, profile cache headers,
              │                          dashboard/landing fast paths, auth-cookie bypass
              │
              ▼
         OpenNext handler (.open-next/worker.js)
              │
              ├─ Turso (libSQL)        → pages, links, projects, sections, infoBlocks,
              │                          conversations, messages, pageEvents, generatedPages,
              │                          creatorOpportunities, daily aggregates
              ├─ D1  (linkchat-auth)   → better-auth sessions / users
              ├─ R2 (linkchat-images)  → avatars, project images, inbound email bodies
              ├─ R2 (linkchat-cache)   → OpenNext incremental cache (static-assets)
              ├─ RAG_SERVICE binding   → shared Cloudflare `knowledgebase` worker (infoBlocks)
              ├─ free-ai gateway        → chat streaming SSE + AI mode generation
              └─ ANALYTICS binding      → Cloudflare Analytics Engine (visitor events)
```

## Two runtimes, one codebase

| | Local dev | Production |
| --- | --- | --- |
| Runtime | Node.js (Next.js) | Cloudflare Workers (OpenNext) |
| App DB | `file:local.db` (libSQL) | Turso (libSQL, wss://) |
| Auth DB | same local file | Cloudflare D1 `linkchat-auth` |
| Images | local / R2 if configured | R2 `linkchat-images` |
| Edge worker | not used | `worker.mjs` + `worker-routing.mjs` + `agent-edge.mjs` |
| Rate limiter | in-memory fallback | `RateLimiterDO` Durable Object |

## Key bindings (wrangler.jsonc)

- `DB` → D1 `linkchat-auth` (better-auth tables).
- `IMAGES_BUCKET` → R2 `linkchat-images`.
- `NEXT_INC_CACHE_R2_BUCKET` → R2 `linkchat-cache` (OpenNext incremental cache).
- `ANALYTICS` → Cloudflare Analytics Engine.
- `EMAIL` → `send_email` binding (transactional outbound: agent auth codes, inbox notifications).
- `RAG_SERVICE` → service binding to the shared `knowledgebase` worker.
- `WORKER_SELF_REFERENCE` → the worker itself (used by OpenNext's ISR revalidation queue).
- Durable Objects: `NEXT_CACHE_DO_QUEUE` (OpenNext ISR queue), `RATE_LIMITER_DO` (rate limiter).
- Smart Placement is enabled so the worker runs close to Turso and avoids a
  cross-region RTT on every server-component request.

## Deep dives

- Edge worker + routing: `docs/architecture/edge-worker.md`
- Data layer (Turso + D1 + R2 + schema + migrations): `docs/architecture/data.md`
- Rate limiter: `docs/architecture/rate-limiter.md`
- RAG / profile memory: `docs/architecture/rag-memory.md`
- Decisions: `docs/architecture/decisions/`
