import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';
import { createIndex } from '@/lib/knowledgebase';

export async function ensureProfileMemoryIndex(
  userId: string,
): Promise<string> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error('User not found');
  if (user.smIndexId) return user.smIndexId;

  const index = await createIndex(`linkchat-${userId}`);
  await db
    .update(users)
    .set({ smIndexId: index.id })
    .where(eq(users.id, userId));
  return index.id;
}
