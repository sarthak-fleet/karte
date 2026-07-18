# Scripts inventory

All scripts live in `package.json` `scripts`. Helper scripts live in
`scripts/`.

## npm scripts

| Script | What it does |
| --- | --- |
| `dev` | `next dev` |
| `build` | `next build --webpack` |
| `start` | `next start` |
| `lint` | `biome check .` |
| `typecheck` | `tsc --noEmit` |
| `test` / `test:watch` / `test:coverage` | Vitest unit |
| `test:e2e` / `test:e2e:ui` | Playwright |
| `smoke:agent` | `node scripts/smoke-agent-api.mjs` |
| `smoke:profile-memory` | `node scripts/smoke-profile-memory.mjs` |
| `backfill:aggregates` | repopulate daily aggregates from `pageEvents` |
| `enrich:profile` | `node scripts/enrich-profile-from-links.mjs` |
| `preview` | opennextjs-cloudflare build + local preview |
| `cf:build` | full CF build pipeline (see `docs/operations/deploy.md`) |
| `deploy:cf` | `cf:build` + `opennextjs-cloudflare deploy` |
| `upload:cf` | `cf:build` + `opennextjs-cloudflare upload` |
| `format` / `format:check` | biome format |
| `check` | `biome check .` |
| `docs:check` | validate docs (links / frontmatter / placeholders) |

## `scripts/` directory

| File | Role |
| --- | --- |
| `backfill-aggregates.mjs` | Aggregate backfill from historical `pageEvents`. |
| `enrich-profile-from-links.mjs` | Auto-enrich a profile from its links. |
| `enrich-sarthak.mjs` | Owner-profile enrichment variant. |
| `extract-claude-design.mjs` | Extract design tokens from the Claude design deck. |
| `inline-critical-css.mjs` / `run-inline-critical-css.mjs` | Beasties critical-CSS inlining step in `cf:build`. |
| `overlay-astro-landing.mjs` / `run-overlay-astro-landing.mjs` | Overlay the Astro landing onto the Next.js output in `cf:build`. |
| `seed-agent-demo.mjs` / `seed-demos.mjs` | Demo data seeding. |
| `smoke-agent-api.mjs` / `smoke-profile-memory.mjs` | Smoke tests. |
| `test-import.mjs` | Import-path test harness. |
| `predeploy-agent-trust-cards.sh` | Pre-deploy hook for agent trust cards. |
| `docs-check.mjs` | Documentation validator (see `docs/operations/jobs.md`). |
