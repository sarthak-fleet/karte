# ADR 0005 — React Compiler ON, no manual memoization

Date: 2026-05 (consolidated). Status: Accepted.

## Context

The app runs React 19 with the React Compiler (`babel-plugin-react-compiler`)
enabled. The compiler automatically memoizes components and hooks based on
their inputs.

## Decision

Do **not** hand-write `useMemo` / `useCallback`. Let the compiler handle
memoization.

## Consequences

- Less boilerplate; the compiler covers more cases than manual memoization
  typically would.
- Adding manual `useMemo`/`useCallback` can fight the compiler and add noise.
- Discipline required: write pure components and stable identities where the
  compiler expects them; don't rely on reference-equality tricks the compiler
  can't see through.
- See `docs/development/conventions.md`.
