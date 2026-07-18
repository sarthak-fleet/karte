# new-things — study queue

Short stubs for non-standard tech in this repo. 3–5 lines each. Fill `Why here:`
yourself after learning; never invent rationale.

## AI SDK streaming with delimiter protocol
- What: Streaming text response with JSON components after a marker delimiter — client splits on the marker
- Why here: TBD
- Gotcha (from code): `src/lib/ai-prompts.ts:10-22` — uses `<<<COMPONENTS>>>` marker to separate prose from JSON components; client splits on this literal
- Source: https://sdk.vercel.ai/docs/ai-sdk-core/streaming

## RAG-backed memory with timeout
- What: RAG search with `Promise.race` to prevent slow searches from blocking chat responses
- Why here: TBD
- Gotcha (from code): `src/app/api/chat/[slug]/route.ts:397-411` — `searchWithTimeout` races RAG search against a 500ms timeout, falls back to empty string on failure
- Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race

## Direct recall from conversation context
- What: Bypassing AI for simple factual queries about recent conversation using regex matching
- Why here: TBD
- Gotcha (from code): `src/app/api/chat/[slug]/route.ts:283-341` — `answerFromRecentConversation` handles color/clothing queries with regex against visitor messages before hitting the LLM
- Source: https://en.wikipedia.org/wiki/Intent_classification

## Jina Reader fallback for scraping
- What: Using Jina Reader API as a fallback when direct HTML scraping fails
- Why here: TBD
- Gotcha (from code): `src/lib/scraper.ts:104-112` — falls back to `https://r.jina.ai/http://` endpoint for cleaner text extraction when direct fetch produces poor results
- Source: https://jina.ai/reader

## Durable rate limiting (sliding window via Durable Object)
- What: Sliding window rate limiter backed by a `RateLimiterDO` Durable Object so counts survive deploys and are shared across isolates; fails open to in-memory when the DO is missing/errors
- Why here: TBD
- Gotcha (from code): `rate-limiter-do.mjs` + `src/lib/rate-limit.ts` — callers must `await rateLimit(...)` (async). Local dev falls back to per-isolate in-memory because the DO binding isn't wired
- Source: https://developers.cloudflare.com/durable-objects/
- See: `docs/architecture/rate-limiter.md`, ADR `docs/architecture/decisions/0002-durable-rate-limiter.md`

## React Compiler with no manual memoization
- What: Using React Compiler instead of manual `useMemo`/`useCallback` — the compiler handles memoization automatically
- Why here: TBD
- Gotcha (from code): `AGENTS.md:75` — "React Compiler ON — do NOT add manual `useMemo`/`useCallback`; compiler handles memoization"
- Source: https://react.dev/learn/react-compiler

## Astro landing overlay on Next.js
- What: Separate Astro build overlaid on Next.js static export — landing page is Astro, app is Next.js
- Why here: TBD
- Gotcha (from code): `package.json:21` — `cf:build` script runs Astro build and `run-overlay-astro-landing.mjs` to overlay the landing page onto the Next.js output
- Source: https://docs.astro.build/en/guides/integrations-guide/

## Better-auth with D1 adapter
- What: Using better-auth with Cloudflare D1 backing via Drizzle adapter
- Why here: TBD
- Gotcha (from code): `AGENTS.md:85-86` — auth state backed by Cloudflare D1 `linkchat-auth`, requires `BETTER_AUTH_URL` set to deployed origin
- Source: https://www.better-auth.com/docs/adapters/drizzle
