# linkchat — project status record

Last updated: 2026-07-13.

> **Living status** (objective, active work, blockers, unresolved questions,
> next steps) lives in [`../../STATUS.md`](../../STATUS.md). This file is the
> **durable record**: thesis, dependencies, timeline, product/feature
> inventory.

## Why/What

**Thesis:** Personal page with a public inbound assistant — creators publish a shareable page at **karte.cc**; visitors browse links, ask questions, send contact/email inbounds, and arrive with enough context for a cleaner handoff.

**In scope:** Profile builder, public SSR profiles, streaming chat, contact/email inbox, lead capture, generated content lifecycle, dashboard CRUD, RAG-backed memory, analytics hooks, Astro landing overlay, agent API v1.

**Out / parked:** Social network features, enterprise CRM/team management, stricter production rate limits without endpoint-specific evidence, broad monetization beyond creator conversion.

## Dependencies

### External

- **Deploy:** Cloudflare Workers `linkchat` via `@opennextjs/cloudflare` — production `https://karte.cc/`.
- **App DB:** Turso (libSQL) + Drizzle.
- **Auth DB:** Cloudflare D1 `linkchat-auth` + better-auth.
- **Auth provider:** Google OAuth via better-auth.
- **Storage:** R2 `linkchat-images` (avatars, project images).
- **AI:** free-ai gateway via `@ai-sdk/openai-compatible`.
- **Analytics:** PostHog + Cloudflare Analytics Engine (`ANALYTICS` binding).
- **CI/CD:** `.github/workflows/deploy.yml` — auto-deploy on push to `main`.
- **Env (required):** `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AUTH_GOOGLE_*`, `TURSO_*`, `NEXT_PUBLIC_APP_URL`, `LINKCHAT_DEFAULT_AI_API_KEY`.
- **Env (optional):** R2 credentials, `RAG_SERVICE_URL`.
- **Env (RAG):** `RAG_SERVICE_KEY` is required for profile-memory indexing/search.

### Internal fleet

- **RAG_SERVICE:** service binding + `RAG_SERVICE_KEY`; `infoBlocks` sync to the shared Cloudflare `knowledgebase` Worker.
- **Legacy SaaS Maker RAG:** removed as a fallback for profile-memory create/ingest/delete/search.
- **Landing overlay:** `landing-astro/` built and overlaid via local `scripts/run-overlay-astro-landing.mjs` in `cf:build`.

### Stack & commands

| Concern | Service |
| --- | --- |
| App | Next.js 16 (App Router, React 19, React Compiler ON) |
| Deploy | Cloudflare Workers `linkchat` via `@opennextjs/cloudflare` |
| App DB | Turso (libSQL) + Drizzle |
| Auth DB | Cloudflare D1 `linkchat-auth` + better-auth |
| Auth provider | Google OAuth via better-auth |
| Storage | R2 `linkchat-images` |
| AI | free-ai gateway via `@ai-sdk/openai-compatible` |
| RAG | `RAG_SERVICE` service binding + `RAG_SERVICE_KEY` |
| Analytics | PostHog + Cloudflare Analytics Engine |

```bash
pnpm install
cp .env.example .env.local
pnpm drizzle-kit push
pnpm dev                    # :3000
pnpm build | pnpm lint | pnpm typecheck
pnpm test                   # Vitest unit (hostname, scraper, …)
pnpm test:e2e               # Playwright (expects dev on :3000)
pnpm preview | pnpm deploy:cf | pnpm upload:cf
pnpm cf:build               # Next + Astro landing overlay + OpenNext populateCache
pnpm drizzle-kit generate | studio
pnpm backfill:aggregates | pnpm enrich:profile
pnpm smoke:agent
```

```
Browser → Cloudflare Worker (OpenNext) → Turso (pages, links, chat, projects)
                                      → D1 (better-auth sessions)
                                      → R2 (images)
                                      → RAG_SERVICE (infoBlocks sync)
                                      → free-ai gateway (chat streaming SSE)
```

- **Dual deploy:** local `file:local.db`; production Turso + D1 on Workers.
- **Generated content:** state machine `pending → generating → ready | error`.
- **Rate limiter:** durable sliding-window via `RateLimiterDO` Durable Object (`rate-limiter-do.mjs` + `src/lib/rate-limit.ts`); counts survive deploys and are shared across isolates. Fails open to per-isolate in-memory fallback when the DO is missing (local dev) or errors/times out. Same 20 req/min default semantics.
- **SSRF-safe scraping:** `src/lib/scraper.ts` blocks loopback/RFC1918/link-local before fetch.

## Timeline

- **2026-07-13** — Added the approval-first Creator Opportunity Desk: owners can turn manual, timeline, contact, email, or chat signals into bounded AI-assisted partnership briefs, edit and approve drafts, then copy or open verified recipients in their own mail client. Karte does not send messages.
- **2026-07-09** — Repositioned the landing and product thesis around Karte as a public inbound assistant, contrasting against static page builders with chat, email, leads, and cleaner handoffs.
- **2026-07-09** — Built out the inbound-agent product loop beyond landing copy: inbound email now feeds Lead Radar, dashboard setup includes chat/DM/email activation, and email inbox copy matches the notify-not-forward architecture.
- **2026-07-03** — Replaced in-memory rate limiter with durable `RateLimiterDO` Durable Object; counts now survive deploys. Removed stale `unsafe` native ratelimit binding. All `rateLimit` callers updated to `await` (now async).
- **2026-07-02** — Added global try/catch error handler to OpenNext worker (`worker.mjs`).
- **2026-05-25/26:** Active-AI UI tasks from loop marked done (homepage CTA, mobile first-message, guest preview, share-link loop).
- **Production smoke:** karte.cc and workers.dev origin 200 (Workers version `b45ab8bf-4cce-4941-92b1-2e4b5ebf8769`).
- **Security audit:** critical/high findings fixed; remaining items low-risk operational.

## Products

| Product | Route / surface | Role |
| --- | --- | --- |
| Public profile | `/[slug]` | SSR link-in-bio page |
| AI profile modes | `/[slug]/encyclopedia`, `/roast`, `/newspaper` | Generated content modes |
| Streaming chat | `/api/chat/[slug]` | Public SSE chat |
| Creator dashboard | `/dashboard/*` | Links, appearance, memory, analytics, domains |
| Opportunity Desk | `/dashboard/opportunities` | Owner-reviewed creator partnership signals and drafts |
| Agent API v1 | `/api/v1/agents/[slug]` | Read/publish for external agents |
| Landing | `/` | Astro overlay on production build |
| Onboarding | `/create`, `/welcome`, `/login` | Page creation and auth entry |

## Features (shipped)

### Public surfaces

- `/` — landing (Astro overlay on production build).
- `/login` — Google sign-in.
- `/create` — page creation wizard.
- `/[slug]` — public profile SSR.
- `/[slug]/encyclopedia`, `/[slug]/roast`, `/[slug]/newspaper` — AI profile modes.
- `/about`, `/privacy`, `/terms`.
- `/welcome` — onboarding entry.
- `/api/chat/[slug]` — public streaming chat (SSE).
- `/api/contact/[slug]` — contact form.
- `/api/track/[slug]` — analytics events.
- `/api/og` — OG image generation.

### Dashboard (auth gated)

- `/dashboard` — hub.
- `/dashboard/links`, `/sections`, `/appearance`, `/widgets`, `/components`.
- `/dashboard/projects`, `/encyclopedia`, `/memory`, `/chats`, `/inbox`, `/leads`.
- `/dashboard/analytics`, `/timeline`, `/experiments`, `/domains`.
- `/dashboard/leads` — lead radar across direct messages, inbound email, chat transcripts, and tracked profile activity.
- `/dashboard/opportunities` — page-owned creator opportunity signals, explicit AI brief generation, review, approval, copy, and user-controlled mail handoff.

### API routes (representative)

- `/api/auth/*` — better-auth handler.
- `/api/pages/*` — CRUD pages, links, sections, projects, domains, chat-config, conversations, timeline, enrich, revamp, generated-status.
- `/api/pages/[pageId]/generate/{encyclopedia,roast,newspaper}` — AI generation.
- `/api/pages/[pageId]/opportunities/*` — owner-only opportunity lifecycle and explicit, rate-limited brief generation.
- `/api/chat/[slug]/messages`, `/conversations` — chat persistence.
- `/api/uploads/images` — R2 avatar/project uploads.
- `/api/settings/ai-key` — per-page AI key override.
- `/api/v1/agents/[slug]` — agent API surface (read/publish).
- `/api/auth/agent/{request-code,verify-code}` — agent device auth.
- `/api/onboarding/chat`, `/api/demo-chat`, `/api/import/preview`, `/api/agent-waitlist`.

### Integrations & quality

- Shared Cloudflare RAG integration is wired locally and build-verified; `infoBlocks`
  sync when `RAG_SERVICE_KEY` is configured after deploy.
- React Compiler enabled — no hand-written `useMemo`/`useCallback`.

## Todo / Planned / Deferred / Blocked

> Moved to [`../../STATUS.md`](../../STATUS.md) (living status). The items
> below are retained only as a historical snapshot of the 2026-07-13 state.

### Planned (snapshot 2026-07-13)

1. ~~Make profile creation/editing resilient across guest, authenticated, and returning-user flows.~~ **Paused** at current validated flow.
2. ~~Make memory/data connection zero-config.~~ **Paused** at current Knowledgebase-backed ingest.
3. ~~Creator-facing analytics depth.~~ **Paused** with existing dashboard hooks retained.
4. Harden rate limiting beyond the durable sliding-window limiter when traffic or abuse evidence justifies stricter per-endpoint caps.
5. Keep AI-generated content reviewable and traceable for profile owners.
6. Wire richer PostHog funnels for mode usage (chat vs encyclopedia vs roast vs newspaper).

### Deferred (snapshot 2026-07-13)

- Broad social-network features — stay centered on public profile conversion.
- Enterprise team management and CRM-style workflows.
- Stricter production rate limits without endpoint-specific evidence (durable limiter is in place; tighter caps need approval + traffic data).
- Paid tiers / billing — not active in current scope.

### Blocked (snapshot 2026-07-13)

- E2E tests assume local dev server — not run in CI by default without documented harness.

### Closure

- **Personal-use support (2026-07-10):** Keep Karte available for direct use. No roadmap expansion; accept only maintenance, reliability, or personally requested workflow fixes.
