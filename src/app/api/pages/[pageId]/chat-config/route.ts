import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { db } from '@/db';
import { pages } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { isChatPosition, resolveThemeConfig } from '@/lib/themes';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId } = await params;

  const page = await db.query.pages.findFirst({
    where: and(eq(pages.id, pageId), eq(pages.userId, session.user.id)),
  });

  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const { chatEnabled, chatSystemPrompt, chatPosition } = body;

  if (
    chatPosition !== undefined &&
    chatPosition !== null &&
    chatPosition !== '' &&
    (typeof chatPosition !== 'string' || !isChatPosition(chatPosition))
  ) {
    return NextResponse.json(
      { error: 'Invalid chat position' },
      { status: 400 },
    );
  }

  const nextThemeConfig = resolveThemeConfig({
    ...page.themeConfig,
    ...(chatPosition ? { chatPosition } : {}),
  });

  const [updated] = await db
    .update(pages)
    .set({
      chatEnabled: chatEnabled ?? page.chatEnabled,
      chatSystemPrompt:
        chatSystemPrompt !== undefined
          ? chatSystemPrompt
          : page.chatSystemPrompt,
      themeConfig: nextThemeConfig,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, pageId))
    .returning();

  return NextResponse.json(updated);
}
