import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';

import * as schema from './schema';

// Single D1 database for both auth (better-auth) and app data. The Turso →
// D1 migration eliminated the dual-DB sync and cut per-query latency from
// 200-400ms (Turso HTTP/WSS) to 5-15ms (D1 native binding).
type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  all(): Promise<{ results?: unknown[] }>;
};

type D1Database = {
  prepare(query: string): D1PreparedStatement;
};

function getD1(): D1Database {
  const { env } = getCloudflareContext();
  return (env as { DB: D1Database }).DB;
}

type DB = ReturnType<typeof drizzle<typeof schema>>;
let _db: DB | undefined;
function getDb(): DB {
  if (!_db) _db = drizzle(getD1(), { schema, logger: false });
  return _db;
}

export const db = new Proxy({} as DB, {
  get(_, prop) {
    return Reflect.get(getDb() as object, prop);
  },
});

/**
 * No-op on D1 — schema is applied via `migrations/d1/*.sql` at deploy time
 * (run by hand with `wrangler d1 execute --remote --file=...`). Kept as a
 * stable export so existing callers (page routes, dashboard) don't break.
 */
export async function ensureProjectsTable() {
  // intentional no-op
}
