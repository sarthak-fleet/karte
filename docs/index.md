---
title: Karte docs
description: Local-first knowledge system for the Karte (linkchat) product.
---

# Karte docs

Local-first knowledge system for **Karte** (`linkchat`) — a link-in-bio
platform with AI-enhanced profile modes, deployed on Cloudflare Workers via
OpenNext. Product: <https://karte.cc>.

> **Source of truth:** the Markdown in this `docs/` tree. Blume is only the
> presentation/search layer (`blume.config.ts`). Code and executable config
> remain authoritative for implementation details and schedules.

## Start here

- **Agent bootloader:** [`../../AGENTS.md`](../../AGENTS.md) — purpose, commands, critical constraints.
- **Current status:** [`../../STATUS.md`](../../STATUS.md) — objective, active work, blockers, next steps.
- **Detailed status record:** [`current/project-status.md`](current/project-status.md) — timeline, products, feature inventory, dependencies.

## Product

- [`product/surfaces.md`](product/surfaces.md) — full route + surface inventory.
- [`product/ai-modes.md`](product/ai-modes.md) — encyclopedia / roast / newspaper generation.
- [`product/opportunity-desk.md`](product/opportunity-desk.md) — creator partnership signals + AI briefs.
- [`product/email-inbox.md`](product/email-inbox.md) — `slug@karte.cc` inbound email.
- [`product/custom-domains.md`](product/custom-domains.md) — custom hostnames (and the known 522 limit).
- [`product/analytics.md`](product/analytics.md) — event map, visitor identity, daily aggregates.

## Architecture

- [`architecture/overview.md`](architecture/overview.md) — request flow, two runtimes, bindings.
- [`architecture/edge-worker.md`](architecture/edge-worker.md) — `worker.mjs` + routing + agent edge.
- [`architecture/data.md`](architecture/data.md) — Turso + D1 + R2 + schema + migrations.
- [`architecture/rate-limiter.md`](architecture/rate-limiter.md) — durable `RateLimiterDO`.
- [`architecture/rag-memory.md`](architecture/rag-memory.md) — knowledgebase RAG + profile memory.
- [`architecture/decisions/`](architecture/decisions/README.md) — ADRs.

## Development

- [`development/setup.md`](development/setup.md) — local setup + commands.
- [`development/conventions.md`](development/conventions.md) — code style + "don't reintroduce" list.
- [`development/testing.md`](development/testing.md) — Vitest + Playwright + smoke scripts.
- [`development/scripts.md`](development/scripts.md) — npm scripts + `scripts/` inventory.

## Operations

- [`operations/deploy.md`](operations/deploy.md) — `cf:build` pipeline, Astro overlay, Blume.
- [`operations/env-and-secrets.md`](operations/env-and-secrets.md) — env + bindings + secrets reference.
- [`operations/observability.md`](operations/observability.md) — logs, timing, analytics.
- [`operations/jobs.md`](operations/jobs.md) — CI workflows + cron.
- [`operations/runbooks/`](operations/runbooks/README.md) — operational quick-reference.

## Knowledge

- [`knowledge/learnings/new-things.md`](knowledge/learnings/new-things.md) — study queue for non-standard tech.
- [`knowledge/failed-approaches/custom-domains-saas-522.md`](knowledge/failed-approaches/custom-domains-saas-522.md) — CF-for-SaaS on a bare Worker.
- [`knowledge/audits/`](knowledge/audits/) — security, perf, UI audits.

## Archive

Historical / superseded material, kept for git rename history and context.
Not part of the active canonical set.

- [`archive/PROJECT_RECOMMENDATION_CONTEXT.md`](archive/PROJECT_RECOMMENDATION_CONTEXT.md) — Starboard recommendation audit.
- [`archive/analytics-migration.md`](archive/analytics-migration.md) — original analytics migration plan.
- [`archive/plans/`](archive/plans/) — historical design artifacts.
- [`archive/research/`](archive/research/) — original feature research (encyclopedia, roast, newspaper, UI).
- [`archive/marketing/`](archive/marketing/) — marketing copy iterations.

## Maintenance

- Docs validation: `pnpm docs:check` (see `operations/jobs.md`). Runs in CI.
- Adding a doc: place it in the right category above, link it from this index,
  and keep pages 150–300 lines (split long catch-alls).
- One canonical home per fact; link instead of restating. See
  `../../AGENTS.md` "Documentation maintenance".
