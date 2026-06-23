import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { requireUser } from '@/lib/api-auth';
import { ensureProfileMemoryIndex } from '@/lib/profile-memory-index';

export async function GET() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const [user] = await db
    .select({ smIndexId: users.smIndexId })
    .from(users)
    .where(eq(users.id, auth.userId));

  return NextResponse.json({
    hasIndex: Boolean(user?.smIndexId),
    indexId: user?.smIndexId ?? null,
  });
}

export async function POST() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  try {
    const indexId = await ensureProfileMemoryIndex(auth.userId);
    return NextResponse.json({ ok: true, hasIndex: true, indexId });
  } catch {
    return NextResponse.json(
      { error: 'Failed to initialize profile memory index' },
      { status: 502 },
    );
  }
}
