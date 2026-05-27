import 'server-only';

import { headers } from 'next/headers';
import { connection } from 'next/server';
import { cache } from 'react';

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
