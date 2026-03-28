# Security Audit — 2026-03-28

## Critical

- [ ] **AI generate endpoints have no auth — anyone can burn credits**
  - `src/app/api/pages/[pageId]/generate/roast/route.ts`
  - `src/app/api/pages/[pageId]/generate/encyclopedia/route.ts`
  - `src/app/api/pages/[pageId]/generate/newspaper/route.ts`
  - Rate limit is 20 req/min per IP — far too permissive for AI endpoints that cost real money.
  - Fix: tighten to 3 req/hour per IP per endpoint.

## High

- [ ] **AUTH_SECRET empty in .env.local**
  - `src/lib/auth.ts` — NextAuth will use a weak fallback or fail silently.
  - Fix: add startup validation that throws if AUTH_SECRET is not set.

- [ ] **SSRF in scraper — no private IP blocking**
  - `src/lib/scraper.ts:40` — `fetch(fullUrl)` will follow any URL, including `http://169.254.169.254` (cloud metadata), `http://127.0.0.1`, and private ranges.
  - Fix: resolve hostname, block RFC 1918 / link-local / loopback before fetching.

- [ ] **Wildcard image proxy in next.config.ts**
  - `next.config.ts:7-16` — `hostname: '**'` for both http and https allows proxying images from any origin, enabling abuse as an open proxy.
  - Fix: restrict to known domains (Google profile images, R2 bucket, GitHub avatars).

## Medium

- [ ] **ensureProjectsTable().catch(() => {}) swallows migration errors at module load**
  - `src/db/index.ts:145` — if the eager migration fails, the error is silently swallowed. The inner catch on L135 resets the promise so retries work, but the module-level call on L145 hides the initial failure.
  - Fix: log the error before swallowing so migration failures are visible.

## Low / Informational

- [ ] **Rate limit is in-memory only** — `src/lib/rate-limit.ts` resets on every deploy/restart. Acceptable for now, but note it provides no protection across multiple instances.

- [ ] **.env.local not committed** — verified via `git log`. `.gitignore` correctly excludes `.env*` except `.env.example`. No secrets in git history.

- [ ] **`allowDangerousEmailAccountLinking: true`** in `src/lib/auth.ts:15` — allows linking accounts by email without verification. Acceptable if Google is the only provider, but would become a vulnerability if more providers are added.

- [ ] **Deployment config (wrangler.jsonc) is clean** — no secrets, no overly permissive bindings.

- [ ] **No dead code or orphaned files found** — codebase is clean.
