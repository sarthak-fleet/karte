# agents.md — linkchat

## Purpose
Link-in-bio platform with AI-enhanced profile modes — chat, encyclopedia, roast, and newspaper — deployed on Cloudflare via OpenNext.

## Stack
- Framework: Next.js 16 (App Router, React 19, React Compiler ON)
- Language: TypeScript (strict)
- Styling: Tailwind CSS v4 (dark theme, glassmorphism)
- DB: Turso (libSQL) via Drizzle ORM — schema at `src/db/schema.ts`
- Auth: NextAuth v5 beta (Google provider + Drizzle adapter)
- Testing: Playwright configured (minimal tests)
- Deploy: Cloudflare Workers via `@opennextjs/cloudflare` (`pnpm deploy:cf`)
- Package manager: pnpm

## Repo structure
```
src/
  app/
    page.tsx              # Landing page
    login/                # Sign-in
    create/               # Page creation wizard
    dashboard/            # Auth dashboard (links, projects, sections, appearance, analytics)
    [slug]/               # Public profile page (SSR)
    api/
      auth/               # NextAuth handler
      pages/              # CRUD (pages, links, projects, infoBlocks, sections, chat config)
      chat/[slug]/        # Public chat (streaming SSE) + conversations + messages
      contact/[slug]/     # Public contact form
      track/[slug]/       # Analytics event tracking
      settings/ai-key/    # AI API key management
      uploads/images/     # R2 image upload
  components/
    dashboard/            # Dashboard UI
    public/               # Public-facing components (glass-card, link-card, chat-widget)
    ui/                   # Shared primitives
  db/
    schema.ts             # Full Drizzle schema (users, pages, links, projects, infoBlocks,
                          # pageSections, conversations, messages, pageEvents, generatedPages)
    index.ts              # Drizzle client (Turso)
  lib/
    auth.ts               # NextAuth v5 config
    ai-prompts.ts         # AI prompts for encyclopedia/roast/newspaper generation
    themes.ts             # Theme presets
    scraper.ts            # URL scraping (Jina Reader)
    r2.ts                 # CF R2 client (avatar/image uploads via @aws-sdk/client-s3)
    rate-limit.ts         # In-memory sliding window limiter (20 req/min/IP)
  middleware.ts           # Auth guards for /dashboard/*
drizzle.config.ts         # Drizzle Kit config (Turso dialect)
wrangler.jsonc            # Cloudflare Worker config (OpenNext output)
open-next.config.ts       # OpenNext CF config
```

## Key commands
```bash
pnpm dev              # next dev (localhost:3000)
pnpm build            # next build
pnpm lint             # eslint

# Cloudflare deployment
pnpm deploy:cf        # opennextjs-cloudflare build + deploy to CF Workers
pnpm preview          # opennextjs-cloudflare build + local preview

# Drizzle DB
pnpm drizzle-kit generate   # generate migration from schema
pnpm drizzle-kit push       # push schema to Turso (dev shortcut)
pnpm drizzle-kit studio     # Drizzle Studio UI
```

## Architecture notes
- **React Compiler ON** — do NOT add manual `useMemo`/`useCallback`; compiler handles memoization.
- **Dual deploy**: local dev uses standard Next.js with `file:local.db`. Production deploys to CF Workers via OpenNext.
- **Generated content lifecycle**: `pending → generating → ready | error`. Cached in `generatedPages` table.
- **Rate limiter is in-memory** — resets on deploy. Not distributed.
- **No proper DB migrations**: some tables use runtime `CREATE TABLE IF NOT EXISTS`. Use `drizzle-kit push` for dev; verify migration strategy before prod schema changes.
- **SaasMaker RAG**: each user has `smProjectId`/`smApiKey`/`smIndexId`. `infoBlocks` synced to SaasMaker as documents (`smDocumentId`).
- **R2 storage**: avatar/project images in CF R2. Requires `CLOUDFLARE_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
- **`@saas-maker/ai`** referenced via local file path — will break on other machines.
- Env vars: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, R2 vars, `SAASMAKER_API_URL`, `SAASMAKER_ADMIN_KEY`, `NEXT_PUBLIC_APP_URL`.
- Husky pre-push hook configured.
- **Auth fix (2026-04-25)**: `AUTH_URL` secret was missing from CF Workers deployment, causing `UntrustedHost` errors in Auth.js v5. Added `AUTH_URL=https://linkchat.sarthakagrawal927.workers.dev` via `wrangler secret put`. Auth flow now correctly redirects to Google OAuth.
- **Known issue — `AUTH_GOOGLE_ID` empty**: The CF secret `AUTH_GOOGLE_ID` is set but contains an empty string (visible in OAuth redirect as `client_id=`). Google OAuth app credentials were never configured for this deployment. Requires creating/configuring a Google Cloud Console OAuth app with redirect URI `https://linkchat.sarthakagrawal927.workers.dev/api/auth/callback/google`, then running `echo "<client_id>" | wrangler secret put AUTH_GOOGLE_ID --name linkchat` and same for `AUTH_GOOGLE_SECRET`.
- **DB migration warning**: `ensureProjectsTable()` logs `[unenv] https.request is not implemented yet!` on cold start. Non-fatal — error is caught and app continues. Root cause: libsql `@libsql/client/web` uses WebSocket (wss://) for Turso but the initial handshake may touch https internally. Doesn't affect DB reads/writes once connected. Investigate upgrading `@libsql/client` if this causes issues.

## Active context


<claude-mem-context>
# Memory Context

# [linkchat] recent context, 2026-05-02 1:57pm GMT+5:30

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 26 obs (7,236t read) | 53,035t work | 86% savings

### May 2, 2026
451 1:43p 🔵 linkchat CI run 25038129519 failed with empty jobs array
454 1:44p 🔵 linkchat has two workflows: ci.yml (always failing) vs Deploy to Cloudflare Workers (always succeeding)
456 " 🔵 linkchat CI failure root cause — missing @saas-maker/eslint-config package
472 1:49p 🔵 linkchat CI lint failures — 4 errors identified
474 " 🔵 linkchat novel-editor.tsx lint false positive — standard SSR hydration pattern
476 " 🔴 linkchat — replaced raw `<a>` tags with Next.js `<Link />` in dashboard pages
477 1:50p 🔴 linkchat — all 4 lint errors fixed to unblock CI
480 " 🔵 linkchat — 2 lint errors blocking CI
482 1:51p 🔵 linkchat lint errors — root causes identified: Date.now in render + setState in effect
485 " 🔵 linkchat lint error — Date.now violation in src/app/dashboard/layout.tsx line 124
486 " 🔵 linkchat lint error — setState in effect at src/components/dashboard/novel-editor.tsx line 106
495 1:53p 🔴 linkchat CI — missing @saas-maker/eslint-config dep + lint errors fixed
496 " 🔵 linkchat CI still failing after fix — saas-maker upstream CI broken at pnpm build:db
498 " 🔵 linkchat CI — actual failures are Cloudflare Workers build + deploy job, not lint/ci.yml
501 1:54p 🔵 linkchat ci.yml run 25247801515 has zero jobs — workflow cancelled or skipped before job creation
502 " 🔵 linkchat uses saas-maker foundry-ci.yml reusable workflow — runs lint, typecheck, tests via pnpm
503 " 🔵 linkchat — both ci.yml and Deploy to Cloudflare Workers failing on every push across all recent runs
507 1:55p 🔵 saas-maker repo is private — npm packages from it require auth token in CI
509 " 🔵 linkchat ci.yml calls reusable workflow from private saas-maker repo — likely cause of zero-job CI runs
510 " 🔴 linkchat ci.yml — inlined workflow steps, removed private saas-maker reusable workflow reference
511 " ✅ linkchat ci.yml inline fix committed and pushed — commit 7d95cbb
512 1:56p 🔵 linkchat CI run now shows in_progress with jobs — inline fix resolved zero-job failure
513 " 🔵 linkchat CI run 25247855146 completed/failure — jobs ran but a step failed
514 " 🔵 linkchat CI build-and-test job failing — need step-level logs to identify failing step
515 " 🔵 linkchat CI fails at "Run Lint" step — pnpm install succeeds, typecheck/tests skipped
519 1:57p 🔵 linkchat lint — 0 errors, 11 warnings only

Access 53k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>