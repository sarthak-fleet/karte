# Code conventions

## Language + framework

- TypeScript (strict). Next.js 16 App Router, React 19.
- Path alias `@/*` → `./src/*` (see `tsconfig.json`).
- Tailwind CSS v4, dark theme, glassmorphism, `karte-*` design tokens.

## React Compiler

React Compiler is **ON** (`babel-plugin-react-compiler`).

- Do **not** add manual `useMemo` / `useCallback`. The compiler memoizes.
- ADR: `docs/architecture/decisions/0005-react-compiler-no-memo.md`.

## Lint + format

- Biome (`biome.json`) is the linter/formatter. `pnpm lint` = `biome check .`,
  `pnpm format` = `biome format --write .`.
- CI runs `pnpm lint` and fails on errors. Keep imports sorted
  (`simple-import-sort`-style ordering is enforced by Biome's import
  organization) — unsorted imports have broken CI before.

## Imports

- Use `next/link` (`<Link />`) for internal navigation, not raw `<a>` tags.
  (Raw `<a>` tags were a past CI lint failure across dashboard pages.)

## Don't reintroduce

- `middleware.ts` / `proxy.ts` for edge guards — not supported by the
  Cloudflare OpenNext adapter. Use `worker.mjs` / `worker-routing.mjs` /
  `agent-edge.mjs` (ADR 0001).
- SaaS Maker RAG as a profile-memory fallback — removed; only the shared
  `knowledgebase` Worker is used (`docs/architecture/rag-memory.md`).
- The legacy `unsafe` native ratelimit binding — replaced by `RateLimiterDO`
  (ADR 0002).
- Manual `useMemo` / `useCallback` (ADR 0005).

## SSR hydration

Standard SSR hydration patterns (e.g. gating client-only state on a mount
flag) are legitimate and have triggered lint false positives before — don't
"fix" them by removing the mount guard.

## Error handling

Handle errors at the right boundary; don't wrap every line in try/catch.
Match the style of neighboring code. The worker entry has a global try/catch
(`worker.mjs`) so unhandled errors never crash the Worker silently.
