# Architecture Decision Records

Short, dated records of decisions that are non-obvious from the code alone.
Each ADR: context → decision → consequences. Append-only; supersede with a
new ADR that links back, never rewrite history.

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-edge-worker-over-middleware.md) | Edge worker over Next.js middleware/proxy | Accepted |
| [0002](0002-durable-rate-limiter.md) | Durable `RateLimiterDO` over in-memory limiter | Accepted |
| [0003](0003-notify-not-forward-email.md) | Notify-not-forward for inbound email | Accepted |
| [0004](0004-static-assets-incremental-cache.md) | Static-assets incremental cache for OpenNext | Accepted |
| [0005](0005-react-compiler-no-memo.md) | React Compiler ON, no manual memoization | Accepted |

## When to add an ADR

Add one when a decision is non-obvious, has real trade-offs, or future-you
will be tempted to undo it without remembering why. Don't add ADRs for
trivial choices discoverable from code.
