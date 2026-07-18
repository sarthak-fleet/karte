# Testing

## Unit tests — Vitest

```bash
pnpm test              # vitest run
pnpm test:watch        # watch mode
pnpm test:coverage     # with coverage
```

Config: `vitest.config.ts`. Existing unit tests cover hostname logic, the
scraper, and chat-room behavior (`tests/*.unit.test.mjs`).

## E2E tests — Playwright

```bash
pnpm test:e2e          # assumes pnpm dev is running on :3000
pnpm test:e2e:ui       # interactive UI mode
```

Config: `playwright.config.ts`. Tests are minimal (`tests/*.spec.ts`):
domains API, landing mobile, example smoke.

> **Blocked:** E2E tests assume a local dev server and are **not** run in CI
> by default (no documented CI harness for them). See
> `docs/current/project-status.md` blocked items.

## Smoke scripts

```bash
pnpm smoke:agent              # scripts/smoke-agent-api.mjs — agent API smoke
pnpm smoke:profile-memory     # scripts/smoke-profile-memory.mjs — RAG smoke
```

These hit a running target (local or deployed) and are not part of CI.

## CI

`.github/workflows/ci.yml` runs `pnpm lint`, `pnpm typecheck`, `pnpm test` on
push/PR to `main`/`master`. Docs checks run in
`.github/workflows/docs.yml` (`docs/operations/jobs.md`).
