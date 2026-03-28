import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

let featureTablesReady: Promise<void> | null = null;

export async function ensureProjectsTable() {
  if (!featureTablesReady) {
    featureTablesReady = (async () => {
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
          message TEXT NOT NULL,
          createdAt INTEGER
        )
      `);

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
    })().catch((error) => {
      featureTablesReady = null;
      throw error;
    });
  }

  await featureTablesReady;
}

// Eagerly start migration on module load so columns exist before any query
ensureProjectsTable().catch(() => {});
