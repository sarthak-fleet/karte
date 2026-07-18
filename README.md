# linkchat

**Product:** [karte.cc](https://karte.cc)


Link-in-bio platform with AI-enhanced profile modes — chat, encyclopedia, roast, and newspaper — deployed on Cloudflare via OpenNext.

## Deployment & External Services

| Concern | Service |
|---------|---------|
| Hosting | Cloudflare Workers (`linkchat`) via `@opennextjs/cloudflare` |
| Database | Turso (libSQL) for app data; Cloudflare D1 (`linkchat-auth`) for better-auth tables |
| Auth | better-auth + Google OAuth |
| File storage | Cloudflare R2 (`linkchat-images`) for avatars / project images |
| Analytics | PostHog (product analytics); Cloudflare Analytics Engine (`ANALYTICS` binding) |
| AI | free-ai gateway (OpenAI-compatible) via `@ai-sdk/openai-compatible` |
| CI/CD | GitHub Actions (`.github/workflows/deploy.yml`) — auto-deploy on push to `main` |

## Stack

- **Framework**: Next.js 16 (App Router, React 19, React Compiler ON)
- **DB**: Turso (libSQL) via Drizzle ORM; D1 for auth tables
- **Auth**: better-auth + Google provider via Drizzle adapter
- **AI**: `@ai-sdk/openai-compatible`, OpenAI-style gateway
- **Storage**: Cloudflare R2 for avatars / project images
- **Deploy**: Cloudflare Workers via `@opennextjs/cloudflare`

See `AGENTS.md` for the agent bootloader, `STATUS.md` for current status, and
`docs/index.md` for the full documentation hub.

## Getting started

```bash
pnpm install
cp .env.example .env.local           # then fill in the values below
pnpm drizzle-kit push                 # apply schema to your Turso DB
pnpm dev                              # http://localhost:3000
```

## Environment

| Variable                  | Required | Purpose                                        |
| ------------------------- | -------- | ---------------------------------------------- |
| `BETTER_AUTH_SECRET`      | Yes      | `openssl rand -base64 32`                      |
| `BETTER_AUTH_URL`         | Yes      | e.g. `http://localhost:3000`                   |
| `AUTH_GOOGLE_ID`          | Yes      | Google OAuth client id                         |
| `AUTH_GOOGLE_SECRET`      | Yes      | Google OAuth client secret                     |
| `TURSO_DATABASE_URL`      | Yes      | `libsql://...` (or `file:local.db` for dev)    |
| `TURSO_AUTH_TOKEN`        | Turso    | `turso db tokens create <db>`                  |
| `NEXT_PUBLIC_APP_URL`     | Yes      | Public origin used in links + emails           |
| `LINKCHAT_DEFAULT_AI_API_KEY`         | Yes (chat) | Fallback AI API key for chat            |
| `LINKCHAT_DEFAULT_AI_ENDPOINT_URL`    | No       | Defaults to the free-ai-gateway worker         |
| `LINKCHAT_DEFAULT_AI_MODEL`           | No       | Defaults to `workers-ai-llama-3.3-70b`         |
| `CLOUDFLARE_ACCOUNT_ID`               | R2       | For avatar / project image uploads             |
| `R2_BUCKET_NAME`                      | R2       | R2 bucket name                                 |
| `R2_PUBLIC_BASE_URL`                  | R2       | Public R2 base URL                             |
| `R2_ACCESS_KEY_ID`                    | R2       | R2 credential                                  |
| `R2_SECRET_ACCESS_KEY`                | R2       | R2 credential                                  |
| `RAG_SERVICE_KEY`                     | Required for RAG | Cloudflare knowledgebase RAG service key for profile memory search |
| `RAG_SERVICE_URL`                     | Optional | Fallback public RAG service URL when the service binding is unavailable |

## Commands

```bash
pnpm dev                  # next dev
pnpm build                # next build
pnpm lint                 # biome check .
pnpm test                 # Vitest unit tests (hostname, scraper, ...)
pnpm test:e2e             # playwright (assumes pnpm dev on :3000)
pnpm preview              # opennextjs-cloudflare build + local preview
pnpm deploy:cf            # cf:build + deploy to CF Workers

pnpm drizzle-kit generate   # generate migration from schema
pnpm drizzle-kit push       # push schema (dev shortcut)
pnpm drizzle-kit studio     # Drizzle Studio UI
```

## Routes

| Route                               | Description                              |
| ----------------------------------- | ---------------------------------------- |
| `/`                                 | Landing                                  |
| `/login`                            | better-auth Google sign-in               |
| `/create`                           | Page creation wizard                     |
| `/dashboard/*`                      | Auth dashboard (auth gated)              |
| `/[slug]`                           | Public profile page (SSR)                |
| `/api/auth/*`                       | better-auth handler                      |
| `/api/pages/*`                      | CRUD: pages, links, projects, sections   |
| `/api/chat/[slug]`                  | Public chat (streaming SSE)              |
| `/api/contact/[slug]`               | Public contact form                      |
| `/api/track/[slug]`                 | Analytics events                         |

## Architecture highlights

- **React Compiler ON** — don't hand-write `useMemo`/`useCallback`.
- **Dual deploy** — local uses `file:local.db`; production uses Turso + D1 on CF Workers.
- **Generated content** lifecycle: `pending → generating → ready | error`.
- **Rate limiter is durable** — `RateLimiterDO` Durable Object backs `src/lib/rate-limit.ts`; counts survive deploys and are shared across isolates. Fails open to in-memory when the DO is missing (local dev) or errors.
- **Edge worker** — `worker.mjs` + `worker-routing.mjs` + `agent-edge.mjs` handle routing, cache headers, and agent indexing before OpenNext (no `middleware.ts`/`proxy.ts`).
- **Knowledgebase RAG** — `infoBlocks` sync only to the shared Cloudflare `knowledgebase` Worker through `RAG_SERVICE` + `RAG_SERVICE_KEY`; legacy SaasMaker RAG is no longer a fallback.
- **SSRF-safe scraping** — `src/lib/scraper.ts` blocks loopback / RFC 1918 / link-local addresses before fetching.

Full architecture docs: `docs/architecture/`.

## Deploy

```bash
pnpm deploy:cf
```

<!-- ACTIVE-AI-TASK-LOG:START -->
## Active AI Task Log

This section is maintained by the SaaS Maker Active-AI product/design loop so future agents do not reopen duplicate UI tasks.

- Business lane: P0 Can make money
- Rule: do not create another broad "improve the UI" task unless the acceptance criteria differ materially from the tasks listed here.
- Source of truth for task status: SaaS Maker task board. README entries are durable context only.

| Task | Status | Priority | Last known note |
| --- | --- | --- | --- |
| `3fcb5888` linkchat: full product revamp pass | done | high | 2026-05-26 — hero subtext sharpened; profile right panel hidden when no chat/DM; disabled mode cards no longer shown; top bar "LC"→"K" brand fix |
| `e01c6bf1` linkchat: add mobile first-message prompt | done | medium | 2026-05-26 — empty-state CTA + starter prompts, larger mobile composer, animated send button on first message |
| `4e106b44` linkchat: add room safety and expiry proof | done | high | 2026-05-26 |
| `e2d78f91` Karte: prove the share-link card loop before signup | done | high | 2026-05-26 |
| `787f89c6` linkchat: add guest join preview state | done | high | 2026-05-26 |
| `8f82f522` linkchat: review and ship local homepage UI change | done | high | 2026-05-25 18:51:20 |
| `04c40ddb` linkchat: homepage needs 3-second value + obvious CTA + mode demo | done | high | 2026-05-25 17:07:41 |
<!-- ACTIVE-AI-TASK-LOG:END -->
