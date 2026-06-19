import { desc,eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { infoBlocks, users } from '@/db/schema';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';
import { ingestDocument } from '@/lib/saasmaker';
import { MAX_CONTENT_LENGTH } from '@/lib/validation';

const ALLOWED_INFO_BLOCK_TYPES = new Set(['text', 'resume', 'faq', 'current', 'voice', 'boundaries']);

function isValidInfoBlockType(type: string): boolean {
  return ALLOWED_INFO_BLOCK_TYPES.has(type);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { pageId } = await params;

  const page = await loadOwnedPage(pageId, auth.userId);

  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const blocks = await db.query.infoBlocks.findMany({
    where: eq(infoBlocks.pageId, pageId),
    orderBy: [infoBlocks.sortOrder],
  });

  return NextResponse.json(blocks);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { pageId } = await params;

  const page = await loadOwnedPage(pageId, auth.userId);

  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const { type, title, content } = body;

  if (!type || !content) {
    return NextResponse.json(
      { error: 'type and content are required' },
      { status: 400 },
    );
  }

  if (!isValidInfoBlockType(type)) {
    return NextResponse.json(
      { error: 'Invalid block type. Must be one of: text, resume, faq, current, voice, boundaries' },
      { status: 400 },
    );
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: 'Content too long (max 50,000 chars)' },
      { status: 400 },
    );
  }

  // Auto-determine sortOrder
  const existing = await db.query.infoBlocks.findMany({
    where: eq(infoBlocks.pageId, pageId),
    orderBy: [desc(infoBlocks.sortOrder)],
    limit: 1,
  });

  const nextSort = existing.length > 0 ? (existing[0].sortOrder ?? 0) + 1 : 0;

  const [block] = await db
    .insert(infoBlocks)
    .values({
      pageId,
      type,
      title: title || null,
      content,
      sortOrder: nextSort,
    })
    .returning();

  // Ingest into saas-maker if configured
  const [user] = await db.select().from(users).where(eq(users.id, auth.userId));
  if (user?.smIndexId) {
    try {
      const adminKey = process.env.SAASMAKER_ADMIN_KEY!;
      const doc = await ingestDocument(adminKey, user.smIndexId, content, {
        type,
        title: title || undefined,
        blockId: block.id,
      });
      await db.update(infoBlocks).set({ smDocumentId: doc.id }).where(eq(infoBlocks.id, block.id));
    } catch {
      console.error('Failed to ingest info block into saas-maker');
    }
  }

  return NextResponse.json(block, { status: 201 });
}
