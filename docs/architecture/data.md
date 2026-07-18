# Data layer

Two SQL databases plus R2 object storage. App data in Turso (libSQL/Drizzle),
auth data in Cloudflare D1, blobs in R2.

## Databases

| Store | Binding | Holds | Driver |
| --- | --- | --- | --- |
| Turso (libSQL) | `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | App data: pages, links, projects, sections, infoBlocks, conversations, messages, pageEvents, generatedPages, creatorOpportunities, daily aggregates, pageDomains, receivedEmails | `@libsql/client` via `src/db/index.ts` + Drizzle |
| Cloudflare D1 | `DB` (`linkchat-auth`) | better-auth tables (users, sessions, accounts, verification) | Drizzle D1 adapter |
| R2 `linkchat-images` | `IMAGES_BUCKET` | Avatars, project images, inbound email bodies | `@aws-sdk/client-s3` via `src/lib/r2.ts` |
| R2 `linkchat-cache` | `NEXT_INC_CACHE_R2_BUCKET` | OpenNext incremental cache (static-assets) | OpenNext |

## Schema

- Canonical schema: `src/db/schema.ts` (Drizzle, Turso dialect).
- Drizzle Kit config: `drizzle.config.ts`.
- The D1 auth schema is managed by better-auth's Drizzle adapter.

## Migrations

There is **no single coherent migration pipeline**. Two parallel histories
exist:

| Path | Scope |
| --- | --- |
| `migrations/0001_initial.sql`, `migrations/0002_personal_dms.sql` | Early Turso migrations (additive `ALTER TABLE`). |
| `migrations/d1/001_app_tables.sql` … `010_creator_opportunities.sql` | D1 app-table ports + new features (timeline, agent waitlist, agent trust cards, agent auth abuse, FK indexes, email inbox, creator opportunities). All idempotent `CREATE TABLE IF NOT EXISTS` / additive. |

### How to apply

- **Dev shortcut:** `pnpm drizzle-kit push` (reconciles schema against Turso).
- **D1:** `wrangler d1 execute linkchat-auth --remote --file=migrations/d1/<file>.sql`.
- Some tables are also created at runtime via `CREATE TABLE IF NOT EXISTS`
  (e.g. `ensureProjectsTable()`). This is intentional but means schema state
  must be verified before prod changes.

> **Constraint:** verify migration strategy before any prod schema change. Do
> not assume `drizzle-kit push` is safe for destructive changes.

## Known cold-start warning

`ensureProjectsTable()` logs `[unenv] https.request is not implemented yet!`
on cold start. **Non-fatal** — the error is caught and the app continues. Root
cause: `@libsql/client/web` uses wss:// for Turso but the initial handshake may
touch https internally. Doesn't affect DB reads/writes once connected.
Investigate upgrading `@libsql/client` if it ever causes real issues.

## R2

- Public base: `R2_PUBLIC_BASE_URL` (avatars / project images served from R2).
- Private helpers for inbound email bodies live in `src/lib/r2.ts` (separate
  from the public image helpers).
- Requires `CLOUDFLARE_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`,
  `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
