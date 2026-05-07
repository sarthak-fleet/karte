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

export async function ensureProjectsTable() {
  if (!featureTablesReady) {
    featureTablesReady = (async () => {
      const client = getClient();
      await client.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY NOT NULL,
          pageId TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          imageUrl TEXT,
          description TEXT NOT NULL,
          sortOrder INTEGER DEFAULT 0,
          enabled INTEGER DEFAULT 1
        )
      `);

      const columns = await client.execute('PRAGMA table_info(projects)');
      const hasImageUrl = columns.rows.some(
        (row) => (row as { name?: string }).name === 'imageUrl',
      );

      if (!hasImageUrl) {
        await client.execute('ALTER TABLE projects ADD COLUMN imageUrl TEXT');
      }

      await client.execute(`
        CREATE TABLE IF NOT EXISTS pageSections (
          id TEXT PRIMARY KEY NOT NULL,
          pageId TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT,
          buttonLabel TEXT,
          buttonUrl TEXT,
          sortOrder INTEGER DEFAULT 0,
          enabled INTEGER DEFAULT 1
        )
      `);

      await client.execute(`
        CREATE INDEX IF NOT EXISTS page_sections_page_id_sort_order_idx
        ON pageSections (pageId, sortOrder)
      `);

      await client.execute(`
        CREATE TABLE IF NOT EXISTS contactSubmissions (
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
        )
      `);

      const contactColumns = await client.execute('PRAGMA table_info(contactSubmissions)');
      const contactColNames = new Set(
        contactColumns.rows.map((r) => (r as { name?: string }).name),
      );

      if (!contactColNames.has('senderType')) {
        await client.execute(
          "ALTER TABLE contactSubmissions ADD COLUMN senderType TEXT NOT NULL DEFAULT 'email'",
        );
      }

      if (!contactColNames.has('status')) {
        await client.execute(
          "ALTER TABLE contactSubmissions ADD COLUMN status TEXT NOT NULL DEFAULT 'unread'",
        );
      }

      await client.execute(`
        CREATE INDEX IF NOT EXISTS contact_submissions_page_id_created_at_idx
        ON contactSubmissions (pageId, createdAt)
      `);

      await client.execute(`
        CREATE TABLE IF NOT EXISTS pageEvents (
          id TEXT PRIMARY KEY NOT NULL,
          pageId TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
          visitorId TEXT,
          eventType TEXT NOT NULL,
          resourceType TEXT,
          resourceId TEXT,
          resourceLabel TEXT,
          metadata TEXT,
          createdAt INTEGER
        )
      `);

      await client.execute(`
        CREATE INDEX IF NOT EXISTS page_events_page_id_event_type_created_at_idx
        ON pageEvents (pageId, eventType, createdAt)
      `);

      await client.execute(`
        CREATE INDEX IF NOT EXISTS projects_page_id_sort_order_idx
        ON projects (pageId, sortOrder)
      `);

      // Generated pages (AI content cache)
      await client.execute(`
        CREATE TABLE IF NOT EXISTS generatedPages (
          id TEXT PRIMARY KEY NOT NULL,
          pageId TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          content TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          createdAt INTEGER,
          updatedAt INTEGER
        )
      `);

      await client.execute(`
        CREATE INDEX IF NOT EXISTS generated_pages_page_id_type_idx
        ON generatedPages (pageId, type)
      `);

      // Add new page feature columns if missing
      const pageColumns = await client.execute('PRAGMA table_info(pages)');
      const pageColNames = new Set(pageColumns.rows.map((r) => (r as { name?: string }).name));

      for (const col of ['encyclopediaEnabled', 'roastEnabled', 'newspaperEnabled']) {
        if (!pageColNames.has(col)) {
          await client.execute(`ALTER TABLE pages ADD COLUMN ${col} INTEGER DEFAULT 0`);
        }
      }

      if (!pageColNames.has('dmMode')) {
        await client.execute("ALTER TABLE pages ADD COLUMN dmMode TEXT NOT NULL DEFAULT 'off'");
      }

      if (!pageColNames.has('pageSettings')) {
        await client.execute('ALTER TABLE pages ADD COLUMN pageSettings TEXT');
      }

      if (!pageColNames.has('scrapedContent')) {
        await client.execute('ALTER TABLE pages ADD COLUMN scrapedContent TEXT');
      }

      // Page Domains (custom hostname routing)
      await client.execute(`
        CREATE TABLE IF NOT EXISTS pageDomains (
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
        )
      `);

      await client.execute(`
        CREATE INDEX IF NOT EXISTS page_domains_page_id_idx
        ON pageDomains (pageId)
      `);

      // Add LinkChat-specific columns to the Better Auth user table if missing.
      const userColumns = await client.execute('PRAGMA table_info("user")');
      const userColNames = new Set(userColumns.rows.map((r) => (r as { name?: string }).name));

      for (const col of ['smProjectId', 'smApiKey', 'smIndexId', 'aiEndpointUrl', 'aiApiKey', 'aiModel']) {
        if (!userColNames.has(col)) {
          await client.execute(`ALTER TABLE "user" ADD COLUMN ${col} TEXT`);
        }
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
