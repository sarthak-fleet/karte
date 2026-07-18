# AGENTS.md — Karte (linkchat)

Agent bootloader. Read this first, then `STATUS.md` and `docs/` for depth.

Also follow the shared fleet-level standard at `../AGENTS.md`. Treat this
repository as owned product code: protect production stability, keep changes
scoped, verify work, and record durable follow-up tasks when something is
incomplete or blocked.

## Purpose

Link-in-bio platform with AI-enhanced profile modes — chat, encyclopedia,
roast, newspaper — deployed on Cloudflare Workers via OpenNext. Product:
<https://karte.cc>. Currently in **maintenance / personal-use mode** (see
`STATUS.md`).

## Status + docs

- **Living status:** `STATUS.md` — objective, active work, blockers, unresolved questions, next steps.
- **Docs hub:** `docs/index.md` — full navigation. Start there for any non-trivial question.
- **Detailed status record:** `docs/current/project-status.md` — timeline, products, feature inventory.
- Markdown in `docs/` is the **source of truth**. Blume (`blume.config.ts`) is only the presentation/search layer.

## Stack

- Next.js 16 (App Router, React 19, **React Compiler ON**), TypeScript (strict)
- Tailwind CSS v4 (dark theme, glassmorphism, `karte-*` tokens)
- Turso (libSQL) + Drizzle for app data; Cloudflare D1 `linkchat-auth` for better-auth
- better-auth (Google provider + Drizzle adapter)
- Cloudflare Workers via `@opennextjs/cloudflare`; custom edge entry `worker.mjs`
- R2 (`linkchat-images`, `linkchat-cache`), Analytics Engine, `knowledgebase` RAG service binding
- Package manager: pnpm. Lint/format: Biome. Tests: Vitest + Playwright.

## Key commands

```bash
pnpm install
pnpm dev                 # next dev :3000
pnpm build               # next build --webpack
pnpm lint                # biome check .
pnpm typecheck           # tsc --noEmit
pnpm test                # vitest run
pnpm test:e2e            # playwright (needs pnpm dev on :3000)

pnpm cf:build            # full CF build (Next + critical CSS + OpenNext + Astro overlay)
pnpm deploy:cf           # cf:build + deploy to CF Workers
pnpm preview             # opennextjs-cloudflare build + local preview

pnpm drizzle-kit push     # dev schema shortcut
pnpm drizzle-kit generate # generate migration from schema
pnpm docs:check           # validate docs (links / frontmatter / placeholders)
```

## Critical constraints (don't violate)

- **No `middleware.ts` / `proxy.ts`** for edge guards — Next 16 proxy runs on
  Node.js, unsupported by the Cloudflare OpenNext adapter. Use `worker.mjs` /
  `worker-routing.mjs` / `agent-edge.mjs`. (ADR 0001)
- **No manual `useMemo` / `useCallback`** — React Compiler is ON. (ADR 0005)
- **No SaaS Maker RAG** as a profile-memory fallback — only the shared
  `knowledgebase` Worker. `sm*` columns are compatibility linkage only.
  (`docs/architecture/rag-memory.md`)
- **No legacy `unsafe` native ratelimit binding** — use `RateLimiterDO`.
  `rateLimit(...)` is async; callers must `await`. (ADR 0002)
- **`<Link />`, not raw `<a>`**, for internal navigation.
- **Verify migration strategy before any prod schema change.** There is no
  single coherent migration pipeline; some tables use runtime
  `CREATE TABLE IF NOT EXISTS`. (`docs/architecture/data.md`)
- **Don't commit secrets.** `.env*` is gitignored except `.env.example`;
  production secrets via `wrangler secret put`. (`docs/operations/env-and-secrets.md`)
- **Don't bypass the Husky pre-push hook.**
- **Deploy is manual** (`workflow_dispatch`), not on push to `main`.
  (`docs/operations/jobs.md`)

## Documentation maintenance

- **One canonical home per fact.** Link instead of restating. Don't leave two
  homes for the same fact.
- **Pages 150–300 lines.** Split long catch-alls into focused per-topic pages.
- **Don't duplicate facts easily discoverable from code.** Document *why*
  systems work, non-obvious constraints, operational procedures, decisions,
  and reusable failed approaches.
- **Don't invent information.** Mark unresolved questions explicitly (see
  `STATUS.md` → "Unresolved questions").
- **No empty folders or placeholder docs.** Every doc must have useful content.
- **Preserve history.** Prefer `git mv` and `docs/archive/<name>.md` over
  deletion when consolidating.
- **Validate before committing docs:** `pnpm docs:check`. Runs in CI
  (`.github/workflows/docs.yml`).
- When adding a doc, place it in the right category under `docs/` and link it
  from `docs/index.md`.

## Where to look

| Need | Go |
| --- | --- |
| Current objective / blockers / next steps | `STATUS.md` |
| Full route + surface inventory | `docs/product/surfaces.md` |
| How a request flows / bindings | `docs/architecture/overview.md` |
| Edge worker / routing / agent edges | `docs/architecture/edge-worker.md` |
| DB / R2 / schema / migrations | `docs/architecture/data.md` |
| Env + secrets + bindings | `docs/operations/env-and-secrets.md` |
| Deploy pipeline | `docs/operations/deploy.md` |
| Decisions (ADRs) | `docs/architecture/decisions/` |
| Audits (security / perf / UI) | `docs/knowledge/audits/` |
| Failed approaches | `docs/knowledge/failed-approaches/` |
| Runbooks | `docs/operations/runbooks/` |

<!-- FLEET-GUIDANCE:START -->

## Fleet Guidance

### Adding Tasks
- Add durable work items in SaaS Maker Cockpit Tasks when the task affects product behavior, deployment, user feedback, or fleet maintenance.
- Include the project slug, a concise title, acceptance criteria, priority/status, and links to relevant code, issues, traces, or dashboards.
- If task discovery starts locally in an editor or agent session, mirror the durable next step back into SaaS Maker before handoff.

### Using SaaS Maker
- Treat SaaS Maker as the system of record for project metadata, feedback, tasks, analytics, testimonials, changelog, and fleet visibility.
- Prefer API-first workflows through `fnd api`, the SDK, or widgets instead of one-off scripts when interacting with SaaS Maker features.
- Keep this agent file aligned with the project record when operating rules, integrations, or deployment conventions change.

### Free AI First
- Prefer free/local AI paths for routine development and analysis: the `free-ai` gateway, local models, provider free tiers, and cached context.
- Escalate to paid models only when complexity, correctness risk, or missing capability justifies the cost.
- Note any paid-AI use in the task or handoff when it materially affects cost, reproducibility, or future maintenance.

<!-- FLEET-GUIDANCE:END -->
