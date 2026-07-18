# ADR 0004 — Static-assets incremental cache for OpenNext

Date: 2026-05 (consolidated). Status: Accepted.

## Context

OpenNext on Cloudflare supports several incremental-cache overrides. The app
is effectively fully prerendered for the surfaces that matter, and the build
inlines critical CSS via Beasties into the prerendered HTML.

If OpenNext re-renders from `page.js` at runtime (no incremental cache), the
Beasties-modified HTML — with its inlined critical CSS — is lost, because the
runtime re-renders the React tree from scratch.

## Decision

Use `staticAssetsIncrementalCache` from
`@opennextjs/cloudflare` (configured in `open-next.config.ts`) backed by the
`NEXT_INC_CACHE_R2_BUCKET` R2 bucket. OpenNext serves prerendered HTML from
the assets binding instead of re-rendering.

## Consequences

- Inlined critical CSS actually reaches the browser.
- A `DOQueueHandler` Durable Object + `WORKER_SELF_REFERENCE` service binding
  are required for background ISR revalidation (configured in `wrangler.jsonc`).
- Not the right override if the app moves to heavy runtime revalidation —
  revisit then.
