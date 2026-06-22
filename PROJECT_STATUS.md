# linkchat — PROJECT STATUS

Last updated: 2026-06-22

## Why/What

**Thesis:** Link-in-bio platform with AI-enhanced public profile modes — creators publish a shareable page at **karte.cc**; visitors browse links or interact through chat, encyclopedia, roast, and newspaper modes.

**In scope:** Profile builder, public SSR profiles, streaming chat, generated content lifecycle, dashboard CRUD, RAG-backed memory, analytics hooks, Astro landing overlay, agent API v1.

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
pnpm test                   # node:test unit (hostname, scraper, …)
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
- **Rate limiter:** in-memory (`src/lib/rate-limit.ts`) — resets on deploy.
- **SSRF-safe scraping:** `src/lib/scraper.ts` blocks loopback/RFC1918/link-local before fetch.

## Timeline

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

### API routes (representative)

- `/api/auth/*` — better-auth handler.
- `/api/pages/*` — CRUD pages, links, sections, projects, domains, chat-config, conversations, timeline, enrich, revamp, generated-status.
- `/api/pages/[pageId]/generate/{encyclopedia,roast,newspaper}` — AI generation.
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

### Planned

1. Make profile creation/editing resilient across guest, authenticated, and returning-user flows.
2. Make memory/data connection zero-config: a creator should be able to say "I am sending data your way" through upload, paste, URL, email/webhook, or API, and Karte should infer structure, ingest through Knowledgebase, show status, and make chat use it automatically without exposing indexes, embeddings, or RAG mechanics.
3. Creator-facing analytics for link clicks, chat interactions, and profile-mode usage (dashboard analytics exists — deepen product metrics).
4. Harden rate limiting beyond in-memory when traffic or abuse evidence justifies it (fleet rule: explicit approval + endpoint evidence).
5. Keep AI-generated content reviewable and traceable for profile owners.
6. Wire richer PostHog funnels for mode usage (chat vs encyclopedia vs roast vs newspaper).

### Deferred

- Broad social-network features — stay centered on public profile conversion.
- Enterprise team management and CRM-style workflows.
- Stricter production rate limits without endpoint-specific evidence.
- Paid tiers / billing — not active in current scope.

### Blocked

- In-memory rate limiter resets on every deploy — not durable across Worker instances.
- E2E tests assume local dev server — not run in CI by default without documented harness.
- Production URL: `https://karte.cc/`; deploy via push to `main` or `pnpm deploy:cf`.
- Documented env matrix in README; never commit secrets.
- `AGENTS.md` holds extended architecture notes for agents.
