# Local setup

## Prerequisites

- Node.js 22+ (Blume docs tooling wants 22.12+; the app CI uses 22).
- pnpm 10+ (`packageManager` is pinned in `package.json`).
- A Turso database (or use `file:local.db` for dev).

## First run

```bash
pnpm install
cp .env.example .env.local        # then fill in the values
pnpm drizzle-kit push             # apply schema to your Turso DB (or local file)
pnpm dev                          # http://localhost:3000
```

## Required env vars

See `docs/operations/env-and-secrets.md` for the full reference. The minimum
for a working local app:

- `BETTER_AUTH_SECRET` — `openssl rand -base64 32`
- `BETTER_AUTH_URL` — e.g. `http://localhost:3000`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth client
- `TURSO_DATABASE_URL` — `libsql://...` or `file:local.db`
- `TURSO_AUTH_TOKEN` — required for remote Turso, not for `file:local.db`
- `NEXT_PUBLIC_APP_URL` — public origin used in links + emails
- `LINKCHAT_DEFAULT_AI_API_KEY` — fallback AI key for chat
- `RAG_SERVICE_KEY` — required for profile-memory indexing/search

## Common commands

```bash
pnpm dev                # next dev
pnpm build              # next build --webpack
pnpm lint               # biome check .
pnpm typecheck          # tsc --noEmit
pnpm test               # vitest run
pnpm test:e2e           # playwright (assumes pnpm dev on :3000)
pnpm preview            # opennextjs-cloudflare build + local preview
pnpm docs:check         # validate docs (links, frontmatter, placeholders)
```

Full command list: `docs/development/scripts.md`. Deploy: `docs/operations/deploy.md`.
