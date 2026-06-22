import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { requireUser } from '@/lib/api-auth';
import { createIndex } from '@/lib/knowledgebase';

export async function GET() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const [user] = await db
    .select({
      smApiKey: users.smApiKey,
      aiEndpointUrl: users.aiEndpointUrl,
      aiApiKey: users.aiApiKey,
      aiModel: users.aiModel,
    })
    .from(users)
    .where(eq(users.id, auth.userId));

  return NextResponse.json({
    hasKey: !!user?.smApiKey,
    hasAiConfig: !!(user?.aiEndpointUrl && user?.aiApiKey && user?.aiModel),
    aiEndpointUrl: user?.aiEndpointUrl || '',
    aiModel: user?.aiModel || '',
    // Never return the actual keys, only presence flags
  });
}

export async function PUT(req: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const body = await req.json();
  const { aiKey, aiEndpointUrl, aiApiKey, aiModel } = body;

  const [user] = await db.select().from(users).where(eq(users.id, auth.userId));
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updates: Record<string, string | null> = {};

  // Handle profile-memory key setup. The stored sm* column names are legacy;
  // RAG indexing now goes only through the shared knowledgebase Worker.
  if (aiKey !== undefined) {
    if (!aiKey?.trim()) {
      return NextResponse.json({ error: 'AI key is required' }, { status: 400 });
    }

    let indexId = user.smIndexId;
    if (!indexId) {
      try {
        const index = await createIndex(`linkchat-${auth.userId}`);
        indexId = index.id;
      } catch {
        return NextResponse.json({ error: 'Failed to initialize chat index' }, { status: 502 });
      }
    }

    updates.smApiKey = aiKey.trim();
    updates.smIndexId = indexId;
  }

  // Handle custom AI endpoint config
  if (aiEndpointUrl !== undefined || aiApiKey !== undefined || aiModel !== undefined) {
    if (aiEndpointUrl !== undefined) updates.aiEndpointUrl = aiEndpointUrl?.trim() || null;
    if (aiApiKey !== undefined) updates.aiApiKey = aiApiKey?.trim() || null;
    if (aiModel !== undefined) updates.aiModel = aiModel?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  await db
    .update(users)
    .set(updates)
    .where(eq(users.id, auth.userId));

  return NextResponse.json({ success: true });
}
