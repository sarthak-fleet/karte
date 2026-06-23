#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@libsql/client';

function loadDotenv() {
  const envPath = resolve(process.cwd(), '.env.local');
  try {
    const text = readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('='))
        continue;
      const index = trimmed.indexOf('=');
      const key = trimmed.slice(0, index).trim();
      const value = trimmed
        .slice(index + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // .env.local is optional
  }
}

async function main() {
  loadDotenv();

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error('TURSO_DATABASE_URL is required');
  }

  const client = createClient({ url, authToken });
  await client.execute('DELETE FROM dailyStats');
  await client.execute('DELETE FROM dailyResourceStats');
  await client.execute('DELETE FROM dailyVisitorEvents');
  const eventsResult = await client.execute(
    'SELECT * FROM pageEvents ORDER BY createdAt ASC',
  );
  const events = eventsResult.rows;

  let count = 0;
  for (const event of events) {
    const {
      pageId,
      visitorId,
      eventType,
      resourceType,
      resourceId,
      resourceLabel,
      createdAt,
    } = event;

    // createdAt in DB is usually a timestamp (number) or ISO string
    const date = new Date(createdAt).toISOString().split('T')[0];

    // Duplicate visitor logic
    let isNewVisitor = false;
    if (visitorId) {
      try {
        await client.execute({
          sql: 'INSERT INTO dailyVisitorEvents (id, pageId, visitorId, date, eventType, resourceId) VALUES (?, ?, ?, ?, ?, ?)',
          args: [
            crypto.randomUUID(),
            pageId,
            visitorId,
            date,
            eventType,
            resourceId || null,
          ],
        });
        isNewVisitor = true;
      } catch {
        isNewVisitor = false;
      }
    }

    let effectiveEventType = eventType;
    if (eventType === 'contact_submit' && !resourceId) {
      effectiveEventType = 'dm_conversion';
    }

    if (resourceId && resourceType) {
      await client.execute({
        sql: `INSERT INTO dailyResourceStats (id, pageId, date, eventType, resourceType, resourceId, resourceLabel, count, visitors)
              VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
              ON CONFLICT(pageId, date, eventType, resourceId) DO UPDATE SET
                count = count + 1,
                visitors = visitors + ?,
                resourceLabel = COALESCE(?, resourceLabel)`,
        args: [
          crypto.randomUUID(),
          pageId,
          date,
          effectiveEventType,
          resourceType,
          resourceId,
          resourceLabel || null,
          isNewVisitor ? 1 : 0,
          isNewVisitor ? 1 : 0,
          resourceLabel || null,
        ],
      });
    } else {
      await client.execute({
        sql: `INSERT INTO dailyStats (id, pageId, date, eventType, count, visitors)
              VALUES (?, ?, ?, ?, 1, ?)
              ON CONFLICT(pageId, date, eventType) DO UPDATE SET
                count = count + 1,
                visitors = visitors + ?`,
        args: [
          crypto.randomUUID(),
          pageId,
          date,
          effectiveEventType,
          isNewVisitor ? 1 : 0,
          isNewVisitor ? 1 : 0,
        ],
      });
    }

    count++;
    if (count % 100 === 0) {
    }
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
