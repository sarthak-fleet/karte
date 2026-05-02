import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { getSession } from '@/lib/auth-server';
import { createIndex } from '@/lib/saasmaker';

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select({
      smApiKey: users.smApiKey,
      aiEndpointUrl: users.aiEndpointUrl,
      aiApiKey: users.aiApiKey,
      aiModel: users.aiModel,
    })
    .from(users)
    .where(eq(users.id, session.user.id));

  return NextResponse.json({
    hasKey: !!user?.smApiKey,
    hasAiConfig: !!(user?.aiEndpointUrl && user?.aiApiKey && user?.aiModel),
    aiEndpointUrl: user?.aiEndpointUrl || '',
    aiModel: user?.aiModel || '',
    // Never return the actual keys, only presence flags
  });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { aiKey, aiEndpointUrl, aiApiKey, aiModel } = body;

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updates: Record<string, string | null> = {};

  // Handle SaaS Maker key (for RAG/chat document indexing)
  if (aiKey !== undefined) {
    if (!aiKey?.trim()) {
      return NextResponse.json({ error: 'AI key is required' }, { status: 400 });
    }

    let indexId = user.smIndexId;
    if (!indexId) {
      try {
        const adminKey = process.env.SAASMAKER_ADMIN_KEY!;
        const index = await createIndex(adminKey, `linkchat-${session.user.id}`);
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
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
