# Scheduled jobs + CI

Code/config is authoritative for schedules. This doc indexes what runs and
where to find it.

## GitHub Actions workflows (`.github/workflows/`)

| Workflow | Trigger | What | Source |
| --- | --- | --- | --- |
| `ci.yml` | push/PR to `main`/`master` | `pnpm lint`, `typecheck`, `test` | `ci.yml` |
| `deploy.yml` | `workflow_dispatch` (manual) | `pnpm cf:build` → `wrangler-action deploy` → curl smoke | `deploy.yml` |
| `weekly.yml` | cron `0 9 * * 1` (Mon 09:00 UTC) + `workflow_dispatch` | Runs available quality scripts (lint, typecheck, test, build) | `weekly.yml` |
| `docs.yml` | push/PR (docs + scripts + workflow changes) | `pnpm docs:check` (required) + Blume build (non-blocking) | `docs.yml` |

> The deploy workflow is **manual**. Pushing to `main` does not auto-deploy.

## Cron

The only scheduled cron is `weekly.yml`'s Monday quality check. There are no
application-level cron jobs (no `wrangler.jsonc` `triggers.crons`). Durable
Object alarms are used internally by `RateLimiterDO` for sliding-window
cleanup, not as scheduled jobs.

## Husky

A pre-push hook is configured (`.husky/`). Don't bypass it.
