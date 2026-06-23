import 'server-only';

import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { pages } from '@/db/schema';
import { getSession } from '@/lib/auth-server';

type SessionUser = NonNullable<Awaited<ReturnType<typeof getSession>>>['user'];

/**
 * Resolves the authenticated user, or a ready-to-return 401 response.
 * Centralizes the `getSession()` → `{ error: 'Unauthorized' }` guard that
 * every protected route handler repeats.
 *
 *   const auth = await requireUser();
 *   if ('error' in auth) return auth.error;
 *   // use auth.userId / auth.user
 */
export async function requireUser(): Promise<
  { user: SessionUser; userId: string } | { error: NextResponse }
> {
  const session = await getSession();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { user: session.user, userId: session.user.id };
}

/**
 * Returns the page identified by `pageId` only if it is owned by `userId`,
 * otherwise `null`. Callers keep their own not-found semantics (some routes
 * answer 403, some 404) — this only unifies the ownership query.
 */
export async function loadOwnedPage(pageId: string, userId: string) {
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, userId)));
  return page ?? null;
}
