import 'server-only';
import { headers } from 'next/headers';
import { auth } from './auth';

/**
 * Returns the current session from server context
 * (RSC, Route Handlers, Server Actions). Server-only.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
