import { type Client, createClient, type InArgs } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';

import * as schema from './schema';

let _client: Client | undefined;
function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

type DB = ReturnType<typeof drizzle<typeof schema>>;
let _db: DB | undefined;
function getDb(): DB {
  if (!_db) _db = drizzle(getClient(), { schema });
  return _db;
}

export const db = new Proxy({} as DB, {
  get(_, prop) {
    return Reflect.get(getDb() as object, prop);
  },
});

let featureTablesReady: Promise<void> | null = null;

// All idempotent DDL — runs in a single `client.migrate()` call (one RTT to
// Turso) instead of ~17 sequential `execute()` calls. After the first
// deployment these are all no-ops, but the round-trips themselves used to
// cost ~5-8s on every Cloudflare Worker cold start.
const IDEMPOTENT_DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY NOT NULL,
    pageId TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    imageUrl TEXT,
    description TEXT NOT NULL,
    sortOrder INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS pageSections (
    id TEXT PRIMARY KEY NOT NULL,
    pageId TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    buttonLabel TEXT,
    buttonUrl TEXT,
    sortOrder INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1
  )`,
  `CREATE INDEX IF NOT EXISTS page_sections_page_id_sort_order_idx
    ON pageSections (pageId, sortOrder)`,
  `CREATE TABLE IF NOT EXISTS contactSubmissions (
    id TEXT PRIMARY KEY NOT NULL,
    pageId TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    sectionId TEXT,
    visitorId TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    senderType TEXT NOT NULL DEFAULT 'email',
    status TEXT NOT NULL DEFAULT 'unread',
    message TEXT NOT NULL,
    createdAt INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS contact_submissions_page_id_created_at_idx
    ON contactSubmissions (pageId, createdAt)`,
  `CREATE TABLE IF NOT EXISTS pageEvents (
    id TEXT PRIMARY KEY NOT NULL,
    pageId TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    visitorId TEXT,
    eventType TEXT NOT NULL,
    resourceType TEXT,
    resourceId TEXT,
    resourceLabel TEXT,
    metadata TEXT,
    createdAt INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS page_events_page_id_event_type_created_at_idx
    ON pageEvents (pageId, eventType, createdAt)`,
  `CREATE INDEX IF NOT EXISTS projects_page_id_sort_order_idx
    ON projects (pageId, sortOrder)`,
  `CREATE TABLE IF NOT EXISTS dailyStats (
    id TEXT PRIMARY KEY NOT NULL,
    pageId TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    eventType TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    visitors INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS daily_stats_uniqueness_idx
    ON dailyStats (pageId, date, eventType)`,
  `CREATE TABLE IF NOT EXISTS dailyResourceStats (
    id TEXT PRIMARY KEY NOT NULL,
    pageId TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    eventType TEXT NOT NULL,
    resourceType TEXT NOT NULL,
    resourceId TEXT NOT NULL,
    resourceLabel TEXT,
    count INTEGER NOT NULL DEFAULT 0,
    visitors INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS daily_resource_stats_uniqueness_idx
    ON dailyResourceStats (pageId, date, eventType, resourceId)`,
  `CREATE TABLE IF NOT EXISTS dailyVisitorEvents (
    id TEXT PRIMARY KEY NOT NULL,
    pageId TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    visitorId TEXT NOT NULL,
    date TEXT NOT NULL,
    eventType TEXT NOT NULL,
    resourceId TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS daily_visitor_events_uniqueness_idx
    ON dailyVisitorEvents (pageId, visitorId, date, eventType, resourceId)`,
  `CREATE TABLE IF NOT EXISTS generatedPages (
    id TEXT PRIMARY KEY NOT NULL,
    pageId TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt INTEGER,
    updatedAt INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS generated_pages_page_id_type_idx
    ON generatedPages (pageId, type)`,
  `CREATE TABLE IF NOT EXISTS pageDomains (
    id TEXT PRIMARY KEY NOT NULL,
    pageId TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    hostname TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    isPrimary INTEGER NOT NULL DEFAULT 0,
    verification TEXT,
    errorMessage TEXT,
    lastCheckedAt INTEGER,
    createdAt INTEGER,
    updatedAt INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS page_domains_page_id_idx
    ON pageDomains (pageId)`,
];

// Conditional ALTER TABLE ADD COLUMN — SQLite has no IF NOT EXISTS for these,
// so we read existing column lists once via PRAGMA, then ADD only what's
// missing. The PRAGMAs run in parallel (one RTT), and any required ALTERs
// run in a single batch (one more RTT, usually zero in production).
type ColumnAddition = {
  table: string;
  column: string;
  type: string;
  /** Default clause, e.g. " NOT NULL DEFAULT 'off'". Empty string for none. */
  defaultClause?: string;
};

const REQUIRED_COLUMNS: ColumnAddition[] = [
  { table: 'projects', column: 'imageUrl', type: 'TEXT' },
  { table: 'contactSubmissions', column: 'senderType', type: 'TEXT', defaultClause: " NOT NULL DEFAULT 'email'" },
  { table: 'contactSubmissions', column: 'status', type: 'TEXT', defaultClause: " NOT NULL DEFAULT 'unread'" },
  { table: 'pages', column: 'encyclopediaEnabled', type: 'INTEGER', defaultClause: ' DEFAULT 0' },
  { table: 'pages', column: 'roastEnabled', type: 'INTEGER', defaultClause: ' DEFAULT 0' },
  { table: 'pages', column: 'newspaperEnabled', type: 'INTEGER', defaultClause: ' DEFAULT 0' },
  { table: 'pages', column: 'dmMode', type: 'TEXT', defaultClause: " NOT NULL DEFAULT 'off'" },
  { table: 'pages', column: 'pageSettings', type: 'TEXT' },
  { table: 'pages', column: 'scrapedContent', type: 'TEXT' },
  { table: '"user"', column: 'smProjectId', type: 'TEXT' },
  { table: '"user"', column: 'smApiKey', type: 'TEXT' },
  { table: '"user"', column: 'smIndexId', type: 'TEXT' },
  { table: '"user"', column: 'aiEndpointUrl', type: 'TEXT' },
  { table: '"user"', column: 'aiApiKey', type: 'TEXT' },
  { table: '"user"', column: 'aiModel', type: 'TEXT' },
  // Chat lead-capture gate: pre-existing conversations stay NULL ("no email
  // yet") and lazy-fill on the next message via the chat route.
  { table: 'conversations', column: 'visitorEmail', type: 'TEXT' },
];

export async function ensureProjectsTable() {
  if (!featureTablesReady) {
    featureTablesReady = (async () => {
      const client = getClient();

      // RTT 1: all idempotent CREATE TABLE / CREATE INDEX statements in one
      // batch. `migrate()` wraps in a transaction with foreign_keys=off, which
      // is the right shape for DDL.
      await client.migrate(IDEMPOTENT_DDL);

      // RTT 2: read column metadata for tables that we conditionally extend,
      // all in parallel.
      const tablesToInspect = Array.from(
        new Set(REQUIRED_COLUMNS.map((c) => c.table)),
      );
      const columnInfos = await Promise.all(
        tablesToInspect.map((table) =>
          client.execute(`PRAGMA table_info(${table})`).then((rs) => {
            const cols = new Set<string>();
            for (const row of rs.rows) {
              const name = (row as { name?: string }).name;
              if (name) cols.add(name);
            }
            return [table, cols] as const;
          }),
        ),
      );
      const existingColumns = new Map(columnInfos);

      // RTT 3 (often skipped in production): batch any missing ALTERs.
      const missingAlters: string[] = [];
      for (const col of REQUIRED_COLUMNS) {
        const cols = existingColumns.get(col.table);
        if (!cols || cols.has(col.column)) continue;
        missingAlters.push(
          `ALTER TABLE ${col.table} ADD COLUMN ${col.column} ${col.type}${col.defaultClause ?? ''}`,
        );
      }
      if (missingAlters.length > 0) {
        await client.migrate(missingAlters);
      }
    })().catch((error) => {
      featureTablesReady = null;
      throw error;
    });
  }

  await featureTablesReady;
}

export async function appDbExecute(sql: string, args: InArgs = []) {
  return getClient().execute(sql, args);
}

// Migration is triggered lazily at request time via ensureProjectsTable()
// (not at module load, so CI builds without env vars succeed)
