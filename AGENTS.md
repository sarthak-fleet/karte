# agents.md — linkchat

## Shared Fleet Standard

Also read and follow the shared fleet-level agent standard at `../AGENTS.md`. Treat this repository as owned product code: protect production stability, keep changes scoped, verify work, and record durable follow-up tasks when something remains incomplete or blocked.

## Purpose
Link-in-bio platform with AI-enhanced profile modes — chat, encyclopedia, roast, and newspaper — deployed on Cloudflare via OpenNext.

## Stack
- Framework: Next.js 16 (App Router, React 19, React Compiler ON)
- Language: TypeScript (strict)
- Styling: Tailwind CSS v4 (dark theme, glassmorphism)
- DB: Turso (libSQL) via Drizzle ORM for app data — schema at `src/db/schema.ts`; Cloudflare D1 `linkchat-auth` for better-auth
- Auth: better-auth (Google provider + Drizzle adapter)
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
      auth/               # better-auth handler
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
    auth.ts               # better-auth config (D1-backed adapter)
    ai-prompts.ts         # AI prompts for encyclopedia/roast/newspaper generation
    themes.ts             # Theme presets
    scraper.ts            # URL scraping (Jina Reader)
    r2.ts                 # CF R2 client (avatar/image uploads via @aws-sdk/client-s3)
    rate-limit.ts         # Durable sliding-window limiter (RateLimiterDO, 20 req/min/IP); fails open to in-memory
  middleware.ts           # Auth guards for /dashboard/*
drizzle.config.ts         # Drizzle Kit config (Turso dialect)
wrangler.jsonc            # Cloudflare Worker config (OpenNext output)
open-next.config.ts       # OpenNext CF config
```

## Key commands
```bash
pnpm dev              # next dev (localhost:3000)
pnpm build            # next build
pnpm lint             # biome check

# Cloudflare deployment
pnpm deploy:cf        # cf:build + deploy to CF Workers
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
- **Rate limiter is durable** — `RateLimiterDO` Durable Object backs `src/lib/rate-limit.ts`; counts survive deploys and are shared across isolates. Fails open to per-isolate in-memory fallback when the DO is missing (local dev) or errors/times out.
- **No proper DB migrations**: some tables use runtime `CREATE TABLE IF NOT EXISTS`. Use `drizzle-kit push` for dev; verify migration strategy before prod schema changes.
- **Knowledgebase RAG**: profile `infoBlocks` use the shared Cloudflare `knowledgebase` Worker through the `RAG_SERVICE` service binding and `RAG_SERVICE_KEY`; legacy SaasMaker RAG is no longer a fallback. Existing user fields `smProjectId`/`smApiKey`/`smIndexId` and `smDocumentId` remain as compatibility linkage columns.
- **R2 storage**: avatar/project images in CF R2. Requires `CLOUDFLARE_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
- **Visitor Identity**: Uses a dual-storage approach for anonymous tracking. A first-party cookie `lc_vid` (2-year expiry, SameSite=Lax, Secure in prod) provides long-term stability, while `localStorage` (`linkchat_visitor_id`) serves as a fallback and mirror for client-side persistence. Managed via `src/lib/visitor-id.ts` and `/api/track/[slug]`. See `docs/analytics.md` for details.
- Env vars: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, R2 vars, `RAG_SERVICE_KEY`, optional `RAG_SERVICE_URL`, `NEXT_PUBLIC_APP_URL`.
- Husky pre-push hook configured.
- **Auth (better-auth)**: Auth uses better-auth with the Google provider. `BETTER_AUTH_URL` must be set to the deployed origin (`https://linkchat.sarthakagrawal927.workers.dev`) along with `BETTER_AUTH_SECRET` via `wrangler secret put`, otherwise auth redirects/callbacks fail. better-auth state is backed by Cloudflare D1 `linkchat-auth`.
- **Google OAuth setup**: Requires a Google Cloud Console OAuth app with redirect URI `https://linkchat.sarthakagrawal927.workers.dev/api/auth/callback/google`. Set credentials with `echo "<client_id>" | wrangler secret put GOOGLE_CLIENT_ID --name linkchat` and same for `GOOGLE_CLIENT_SECRET`.
- **DB migration warning**: `ensureProjectsTable()` logs `[unenv] https.request is not implemented yet!` on cold start. Non-fatal — error is caught and app continues. Root cause: libsql `@libsql/client/web` uses WebSocket (wss://) for Turso but the initial handshake may touch https internally. Doesn't affect DB reads/writes once connected. Investigate upgrading `@libsql/client` if this causes issues.

<!-- FLEET-GUIDANCE:START -->

## Fleet Guidance

### Adding Tasks
- Add durable work items in SaaS Maker Cockpit Tasks when the task affects product behavior, deployment, user feedback, or fleet maintenance.
- Include the project slug, a concise title, acceptance criteria, priority/status, and links to relevant code, issues, traces, or dashboards.
- If task discovery starts locally in an editor or agent session, mirror the durable next step back into SaaS Maker before handoff.

### Using SaaS Maker
- Treat SaaS Maker as the system of record for project metadata, feedback, tasks, analytics, testimonials, changelog, and fleet visibility.
- Prefer API-first workflows through `fnd api`, the SDK, or widgets instead of one-off scripts when interacting with SaaS Maker features.
- Keep this agent file aligned with the project record when operating rules, integrations, or deployment conventions change.

### Free AI First
- Prefer free/local AI paths for routine development and analysis: the `free-ai` gateway, local models, provider free tiers, and cached context.
- Escalate to paid models only when complexity, correctness risk, or missing capability justifies the cost.
- Note any paid-AI use in the task or handoff when it materially affects cost, reproducibility, or future maintenance.

<!-- FLEET-GUIDANCE:END -->

## Active context


<claude-mem-context>
# Memory Context

# [linkchat] recent context, 2026-05-02 2:35pm GMT+5:30

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 41 obs (11,555t read) | 123,524t work | 91% savings

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
522 1:58p 🔵 linkchat CI run 25247855146 — pnpm install succeeds, 933 packages
523 " 🔵 linkchat CI lint failure root cause — `--if-present` passed to ESLint
524 " 🔴 linkchat ci.yml — fix `--if-present` flag position for pnpm run
525 " 🔴 linkchat ci.yml fix committed and pushed — commit 2337897
529 2:00p 🔴 linkchat CI — pnpm --if-present flag position bug fixed
530 " 🔴 linkchat CI — private reusable workflow replaced with inline pnpm+node setup
531 " 🔵 linkchat CI — lint still fails after --if-present fix; simple-import-sort errors across multiple files
532 2:01p 🔵 linkchat — large volume of uncommitted local work discovered
533 " 🟣 linkchat — new API routes and dashboard features staged for commit
534 " 🔵 linkchat lint passes locally — 0 errors, 11 warnings, exit code 0
536 2:02p 🔵 linkchat CI fails on lint step after --if-present fix
538 2:03p 🔵 linkchat CI lint root cause — simple-import-sort/imports error
540 " 🔵 linkchat CI lint — exact files with ESLint warnings identified
543 " 🔵 linkchat CI lint root cause — tests/example.spec.ts unsorted imports
546 2:04p 🔴 linkchat CI — fix import sort order in tests/example.spec.ts

Access 124k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>
