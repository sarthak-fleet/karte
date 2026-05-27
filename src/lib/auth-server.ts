import 'server-only';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { connection } from 'next/server';
import { cache } from 'react';

import { db } from '@/db';
import { pages } from '@/db/schema';

import { createAuth, ensureAuthTables } from './auth';

/**
 * Returns the current session from server context
 * (RSC, Route Handlers, Server Actions). Server-only.
 *
 * Wrapped in React.cache() so multiple calls within a single request
 * (e.g., dashboard layout + dashboard page) share the same D1 lookup
 * instead of hitting better-auth's getSession() repeatedly. ~1 RTT
 * savings per dashboard navigation.
 */
export const getSession = cache(async () => {
  await connection();
  await ensureAuthTables();
  return createAuth().api.getSession({ headers: await headers() });
});

/**
 * Returns the current user's page row (or undefined). React.cached so the
 * dashboard layout's slug-fetch and each child page's page lookup
 * deduplicate to one Turso roundtrip per navigation. Previously every
 * dashboard nav cost 2 separate page queries.
 */
export const getCurrentPage = cache(async (userId: string) => {
  return db.query.pages.findFirst({
    where: eq(pages.userId, userId),
  });
});
