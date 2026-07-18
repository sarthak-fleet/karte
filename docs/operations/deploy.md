# Deploy

Production: Cloudflare Worker `linkchat` via `@opennextjs/cloudflare`, serving
`https://karte.cc/`. CI auto-deploys on push to `main`
(`.github/workflows/deploy.yml`).

## Build pipeline (`cf:build`)

`pnpm cf:build` runs the full production build:

```
next build --webpack
  → node scripts/run-inline-critical-css.mjs        (Beasties inlines critical CSS)
  → opennextjs-cloudflare build --skipNextBuild
  → opennextjs-cloudflare populateCache local
  → pnpm --filter ./landing-astro build             (Astro landing)
  → node scripts/run-overlay-astro-landing.mjs      (overlay landing onto Next output)
```

`pnpm deploy:cf` = `cf:build` + `opennextjs-cloudflare deploy`.
`pnpm upload:cf` = `cf:build` + `opennextjs-cloudflare upload` (no deploy).

## Why the Astro overlay

The landing page is an Astro project (`landing-astro/`) overlaid onto the
Next.js static export during `cf:build`. The app stays Next.js; the landing
gets Astro's static HTML/CSS pipeline. The overlay script rewrites the
landing into the Next output so a single Worker serves both.

## OpenNext incremental cache

`open-next.config.ts` uses `staticAssetsIncrementalCache` backed by
`NEXT_INC_CACHE_R2_BUCKET` (R2 `linkchat-cache`). This is what makes the
Beasties-inlined CSS actually reach the browser — without it, runtime
re-render from `page.js` would discard the inlined CSS.
ADR: `docs/architecture/decisions/0004-static-assets-incremental-cache.md`.

## Secrets

Set via `wrangler secret put` (never committed). See
`docs/operations/env-and-secrets.md`.

## Deploy workflow

`.github/workflows/deploy.yml` (manual `workflow_dispatch`): checkout →
pnpm install → `pnpm cf:build` → `wrangler-action deploy` → curl smoke check
against the workers.dev origin.

> The deploy workflow is **manual** (`workflow_dispatch`). Pushing to `main`
> does not auto-deploy. Run it from the Actions UI when ready.

## After deploy

- Verify `https://karte.cc/` returns 200.
- For RAG features, confirm `RAG_SERVICE_KEY` is set and `infoBlocks` sync.
- For email inbox, confirm `EMAIL_INBOUND_SECRET` matches on both the
  `linkchat` and `karte-email` workers (`docs/product/email-inbox.md`).
- For custom domains, confirm `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID`
  are set (`docs/product/custom-domains.md`).

## Blume docs site (separate, optional)

The `docs/` tree is also publishable via Blume. Blume is the presentation
layer only — Markdown in `docs/` remains the source of truth.

```bash
npx blume dev       # local docs preview
npx blume build     # static build (output: .blume/dist by default)
```

Config: `blume.config.ts` (root). Blume is invoked via `npx`; it is **not**
a package dependency, so it does not affect the install/lockfile. Generated
output is gitignored (`.blume/`).
