# Codebase Review — Linkchat (linkchat)

**Date**: 2026-05-27  
**Reviewer**: Grok (concise mode)

## Purpose
Link-in-bio SaaS (karte.cc) with AI profile modes (chat, encyclopedia, roast, newspaper) plus leads, analytics, and custom domains. Deployed exclusively on Cloudflare Workers via OpenNext; primary data in Turso (Drizzle), auth in D1.

## Stack & Structure
- Next.js 16 (App Router, React 19 + Compiler enabled), TypeScript strict, Tailwind v4 (dark glassmorphism theme).
- DB: Turso/libSQL (app schema) + Cloudflare D1 (better-auth); runtime "ensure*" migrations + CREATE TABLE IF NOT EXISTS.
- Auth: better-auth + Google OAuth (D1 adapter); middleware guards + custom-domain Host rewrites.
- AI: free-ai gateway (`@ai-sdk/openai-compatible`); SaasMaker RAG sync for infoBlocks.
- Storage/Analytics: R2 (images), PostHog (product), CF Analytics Engine + daily aggregate tables (pageEvents).
- Deploy: `@opennextjs/cloudflare`; pnpm; GitHub Actions (ci.yml + deploy.yml); wrangler.jsonc with RATE_LIMITER + ANALYTICS bindings (unused in code).
- Key paths: `src/app/[slug]` (public SSR), `src/app/dashboard/*` (editors), `src/app/api/pages/[pageId]/generate/*`, `src/lib/*` (scraper, ai-client, aggregates, page-domains), large client editors (300-700 LOC).

## Strengths
- Recent, high-quality audits (perf-audit.md 2026-05-27, ui-audit.md 2026-05-27) with concrete prioritized fixes and measurement guidance.
- Multiple AUDIT.md (2026-03-28) items addressed: AI generate endpoints now rate-limited to 3/hr/IP; image remotePatterns restricted; chat-widget dynamic-imported; SSRF blocking and scraper hardening present.
- Thoughtful data patterns: React `cache()`, Promise.all parallelization in hot paths (`getFullPageData`, analytics, dashboard layout), generatedPages lifecycle (`pending→generating→ready|error`), visitor ID (cookie + localStorage) with privacy constraints.
- Clean separation of concerns, minimal dead code, error boundaries, and low console usage; schema well-factored with aggregates for durable analytics.
- Custom domains implementation is complete end-to-end (CF SaaS API + middleware rewrite + verification UI) and thoroughly documented.
- React Compiler respected (no manual memoization) and dual-env (local file:local.db vs prod Turso/D1) handled cleanly.

## Risks & Tech Debt
- Zero `<Suspense>` usage in the entire tree (grep confirmed); every route (especially `/[slug]` and `/dashboard/analytics`) blocks fully on data fetches despite recent parallelization wins.
- AI generate routes (`/api/pages/[pageId]/generate/{encyclopedia,roast,newspaper}`) perform no session or page ownership check — only pageId lookup + IP rate limit. Callable by anyone who knows an ID.
- In-memory rate limiter (`src/lib/rate-limit.ts`) only; CF `RATE_LIMITER` binding and better-auth rateLimit are both disabled/unused. Resets on every Worker cold start/deploy.
- Dashboard data duplication: repeated `getSession()` + page lookups across layout and child pages (perf-audit #3/5); no hoisted React cache or context.
- Custom domains: tenant hostnames verify and appear in UI but return 522 (documented platform limitation in custom-domains.md); feature partially ships.
- Migration fragility: multiple lazy `ensure*` + PRAGMA/ALTER TABLE at request time in `db/index.ts`; history of swallowed errors and libsql WebSocket quirks; no proper Drizzle migrations for prod.
- Large client surfaces remain (chat-widget 722 LOC even when dynamic; many dashboard editors); UI audit shows most dashboard + public mode pages still pre-token (174+ `text-white`, hardcoded colors, etc.).
- External dep risk: `@saas-maker/eslint-config` (and prior `@saas-maker/ai` local path) caused repeated CI failures; dual DB + SaasMaker sync adds operational surface.

## Top Recommendations
1. **Highest leverage**: Add `<Suspense>` + skeletons to public profile (`/[slug]`) and analytics page immediately (perf-audit #1/2); pair with lazy chat-widget load.
2. **Security**: Add explicit owner auth (`session.user.id === page.userId`) to all `generate/*` and other page-mutating APIs under `/api/pages/[pageId]`.
3. **Perf**: Hoist repeated session/page queries from dashboard layout (React `cache()` or headers) and parallelize remaining dashboard page awaits (perf-audit #3/5).
4. **Reliability**: Adopt the existing RATE_LIMITER binding (or a durable alternative) for AI/contact paths; surface clear "not yet serving" state for custom domain tenants in UI.
5. **Maintainability**: Prioritize UI audit public surfaces (encyclopedia/newspaper/roast pages + chat-widget + login/create) for token migration before broader dashboard work; formalize a migration strategy before next schema change.

(References: AGENTS.md, AUDIT.md, perf-audit.md, ui-audit.md — 4 total.)

Raw capture for later curation. All analysis static. No secrets read or commands executed.