import { and, eq } from 'drizzle-orm';

import { db, ensureProjectsTable } from '@/db';
import { pageDomains } from '@/db/schema';

import { getAppHost, isAppHost, normalizeHostname } from './hostname';

export { getAppHost, isAppHost, normalizeHostname };

const HOST_CACHE_TTL_MS = 60_000;

type CachedHost = { slug: string | null; expiresAt: number };
const hostCache = new Map<string, CachedHost>();

export function invalidateHostCache(host?: string) {
  if (!host) {
    hostCache.clear();
    return;
  }
  const normalized = normalizeHostname(host);
  if (normalized) hostCache.delete(normalized);
}

/**
 * Check whether a hostname is already attached to a different page.
 * Returns the conflicting pageId or null.
 */
export async function findConflictingDomain(hostname: string): Promise<{
  pageId: string;
  status: string;
} | null> {
  const normalized = normalizeHostname(hostname);
  if (!normalized) return null;
  await ensureProjectsTable();
  const rows = await db
    .select({ pageId: pageDomains.pageId, status: pageDomains.status })
    .from(pageDomains)
    .where(eq(pageDomains.hostname, normalized))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Set a single domain as primary; demotes any other primary on the same page
 * inside the same query batch.
 */
export async function setPrimaryDomain(pageId: string, domainId: string) {
  await ensureProjectsTable();
  await db
    .update(pageDomains)
    .set({ isPrimary: false, updatedAt: new Date() })
    .where(eq(pageDomains.pageId, pageId));
  await db
    .update(pageDomains)
    .set({ isPrimary: true, updatedAt: new Date() })
    .where(and(eq(pageDomains.id, domainId), eq(pageDomains.pageId, pageId)));
  invalidateHostCache();
}
