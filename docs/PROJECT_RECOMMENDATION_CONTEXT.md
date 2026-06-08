# Project Recommendation Context

Generated: 2026-06-06T21:14:19.573Z

This file is a CodeVetter Repo Unpacked-inspired audit written for Starboard recommendations. It is intentionally local, evidence-oriented, and safe to commit: it records product context, feature areas, stack inventory, and recommendation guidance without secrets or environment values.

## Project Identity

- Slug: `linkchat`
- Registry description: Real-time chat application built with Next.js.
- Product grouping: `public-ready`
- Source path: `linkchat`

## Product Context

Real-time chat application built with Next.js.

LinkChat is a link-in-bio platform with AI-enhanced public profile modes. The active product is a Cloudflare-hosted profile builder where users create a shareable page and visitors can browse links or interact through profile modes such as chat, encyclopedia, roast, and newspaper.

linkchat Link-in-bio platform with AI-enhanced profile modes — chat, encyclopedia, roast, and newspaper — deployed on Cloudflare via OpenNext. Deployment & External Services Concern Service --------- --------- Hosting Cloudflare Workers linkchat via @opennextjs/cloudflare Database Turso libSQL for app data; Cloudflare D1 linkchat-auth for better-auth tables Auth better-auth + Google OAuth File storage Cloudflare R2 linkchat-images for avatars / project images Analytics PostHog product analytics ; Cloudflare Analytics Engine ANALYTICS binding AI free-ai gateway OpenAI-compatible via @ai-sdk/openai-compatible CI/CD GitHub Actions .github/workflows/deploy.yml — auto-deploy on push to main Stack

## Feature Map

- **Cloudflare and deploy**: Workers, Pages, edge runtime, queues, storage, and deploy automation. Keywords: cloudflare, worker, workers, pages, edge, deploy, wrangler, queue.
- **UI workflows**: Dashboards, tables, forms, component systems, charts, and user workflows. Keywords: ui, ux, dashboard, table, component, react, next, tailwind.
- **AI agents**: Agents, tool use, workflows, orchestration, RAG, evals, and model integration. Keywords: ai, agent, agents, llm, rag, embedding, eval, model.
- **Auth and identity**: Auth, OAuth, sessions, users, permissions, and account flows. Keywords: auth, oauth, identity, session, user, permission, login, nextauth.
- **Database and storage**: SQL, document storage, migrations, cache, queues, vectors, and persistence. Keywords: database, db, sql, sqlite, postgres, turso, libsql, drizzle.
- **Repo intelligence**: Repository understanding, metadata enrichment, code review, and evidence reports. Keywords: review, static, analysis, diff, history, evidence, verification.
- **Content and media**: Content production, video, reels, documents, markdown, and publishing workflows. Keywords: content, media, video, reel, markdown, document, publish, editor.

## Runtime Surfaces and Entrypoints

- `src/app/.well-known/security.txt/route.ts`
- `src/app/[slug]/data.json/route.ts`
- `src/app/[slug]/encyclopedia/page.tsx`
- `src/app/[slug]/layout.tsx`
- `src/app/[slug]/newspaper/page.tsx`
- `src/app/[slug]/page.tsx`
- `src/app/[slug]/roast/page.tsx`
- `src/app/[slug]/vcard/route.ts`
- `src/app/about/page.tsx`
- `src/app/api/agent-waitlist/route.ts`
- `src/app/api/ai/models/route.ts`
- `src/app/api/auth/[...all]/route.ts`
- `src/app/api/chat/[slug]/route.ts`
- `src/app/api/contact/[slug]/route.ts`
- `src/app/api/demo-chat/route.ts`
- `src/app/api/import/preview/route.ts`
- `src/app/api/og/route.tsx`
- `src/app/api/onboarding/chat/route.ts`
- `src/app/api/pages/[pageId]/route.ts`
- `src/app/api/pages/route.ts`
- `src/app/api/settings/ai-key/route.ts`
- `src/app/api/track/[slug]/route.ts`
- `src/app/api/uploads/images/route.ts`
- `src/app/api/welcome/route.ts`
- `src/app/create/page.tsx`
- `src/app/dashboard/analytics/page.tsx`
- `src/app/dashboard/appearance/page.tsx`
- `src/app/dashboard/chats/page.tsx`
- `src/app/dashboard/components/page.tsx`
- `src/app/dashboard/domains/page.tsx`
- `src/app/dashboard/encyclopedia/page.tsx`
- `src/app/dashboard/experiments/page.tsx`
- `src/app/dashboard/inbox/page.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/leads/page.tsx`
- `src/app/dashboard/links/page.tsx`
- `src/app/dashboard/memory/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/projects/page.tsx`
- `src/app/dashboard/sections/page.tsx`
- `src/app/dashboard/timeline/page.tsx`
- `src/app/dashboard/widgets/page.tsx`

## Current Stack

- Languages: `Astro`, `TypeScript`
- Frameworks/tools: `Astro`, `Cloudflare Workers`, `Drizzle`, `Next.js`, `OpenNext Cloudflare`, `Playwright`, `React`, `Tailwind CSS`
- Config files:
- `drizzle.config.ts`
- `landing-astro/astro.config.mjs`
- `landing-astro/wrangler.toml`
- `next.config.ts`
- `playwright.config.ts`
- `wrangler.jsonc`

## OSS Already In Use

Direct dependencies:
- `@ai-sdk/openai-compatible`
- `@astrojs/sitemap`
- `@aws-sdk/client-s3`
- `@better-fetch/fetch`
- `@dnd-kit/core`
- `@dnd-kit/modifiers`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`
- `@fontsource-variable/inter`
- `@fontsource-variable/playfair-display`
- `@libsql/client`
- `@opennextjs/cloudflare`
- `@saas-maker/changelog-widget`
- `@saas-maker/feedback`
- `@saas-maker/sdk`
- `@saas-maker/testimonials`
- `@types/sanitize-html`
- `ai`
- `astro`
- `better-auth`
- `drizzle-orm`
- `html-to-image`
- `motion`
- `next`
- `novel`
- `posthog-js`
- `react`
- `react-dom`
- `react-markdown`
- `remark-gfm`
- `sanitize-html`
- `zod`

Development dependencies:
- `@playwright/test`
- `@saas-maker/eslint-config`
- `@tailwindcss/postcss`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `babel-plugin-react-compiler`
- `beasties`
- `critters`
- `dotenv`
- `drizzle-kit`
- `eslint`
- `eslint-config-next`
- `lightningcss`
- `tailwindcss`
- `typescript`
- `wrangler`

Package scripts:
- `astro`
- `backfill:aggregates`
- `build`
- `cf:build`
- `deploy:cf`
- `dev`
- `enrich:profile`
- `lint`
- `preview`
- `start`
- `test`
- `test:e2e`
- `test:e2e:ui`
- `typecheck`
- `upload:cf`

## Testing and Quality Signals

- `playwright.config.ts`
- `tests/chat-room.unit.test.mjs`
- `tests/domains.api.spec.ts`
- `tests/example.spec.ts`
- `tests/hostname.unit.test.mjs`
- `tests/landing-mobile.spec.ts`
- `tests/scraper.unit.test.mjs`

## Recommendation Guidance

Good matches:
- Repos that strengthen cloudflare and deploy without replacing already-installed libraries.
- Repos that strengthen ui workflows without replacing already-installed libraries.
- Repos that strengthen ai agents without replacing already-installed libraries.
- Repos that strengthen auth and identity without replacing already-installed libraries.
- Repos that strengthen database and storage without replacing already-installed libraries.
- Repos that strengthen repo intelligence without replacing already-installed libraries.
- Repos that strengthen content and media without replacing already-installed libraries.
- Tools with concrete support for src, page.tsx, dashboard, route.ts, api, cloudflare, profile, slug.
- Implementation repos, SDKs, CLIs, testing utilities, adapters, and focused libraries are higher value than generic awesome lists.

Avoid recommending:
- Do not recommend packages already listed under direct or development dependencies unless the task is migration research.
- Do not recommend broad framework replacements unless the project context explicitly calls for a rewrite.
- Downrank curated lists, archived repos, stale demos, and generic UI kits that do not map to the feature catalog.

## Evidence Read

Primary docs and handoff files:
- `AGENTS.md`
- `PROJECT_STATUS.md`
- `README.md`
- `docs/ANALYTICS_MIGRATION.md`
- `docs/README.md`
- `docs/analytics.md`
- `docs/custom-domains.md`
- `docs/perf-audit.md`
- `docs/ui-audit.md`

Package manifests:
- `.pages-deploy/server-functions/default/package.json`
- `landing-astro/package.json`
- `package.json`

Inventory notes:
- Files scanned: 381
- This pass uses deterministic repo inventory plus local documentation/source-path evidence. It does not claim a full manual line-by-line review of every source file.

## Confidence

Confidence: **high**

Why:
- PROJECT_STATUS.md present
- README.md present
- 42 entrypoint/runtime files identified
- package dependencies inventoried
- 7 test/quality files identified

Refresh command:

```bash
cd /Users/sarthak/Desktop/fleet/starboard
pnpm fleet:audit-recommendation-context
pnpm fleet:extract-projects
```
