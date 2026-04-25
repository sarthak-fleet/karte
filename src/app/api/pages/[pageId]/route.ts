import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { db } from '@/db';
import { pages } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { isValidSlug, isValidUrl, MAX_BIO_LENGTH } from '@/lib/validation';
import { isThemePresetId, resolveThemeConfig } from '@/lib/themes';

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
  const { slug, displayName, bio, avatarUrl, published, themeConfig } = body;

  if (slug && !isValidSlug(slug)) {
    return NextResponse.json(
      { error: 'Slug must be 3-50 chars, lowercase alphanumeric and hyphens only' },
      { status: 400 },
    );
  }

  if (bio && bio.length > MAX_BIO_LENGTH) {
    return NextResponse.json(
      { error: 'Bio too long (max 500 chars)' },
      { status: 400 },
    );
  }

  if (avatarUrl !== undefined && avatarUrl !== null && avatarUrl !== '') {
    if (typeof avatarUrl !== 'string' || !isValidUrl(avatarUrl)) {
      return NextResponse.json(
        { error: 'Avatar URL must be a valid URL' },
        { status: 400 },
      );
    }
  }

  let normalizedThemeConfig = page.themeConfig ?? resolveThemeConfig();
  if (themeConfig !== undefined) {
    if (themeConfig !== null && (typeof themeConfig !== 'object' || Array.isArray(themeConfig))) {
      return NextResponse.json(
        { error: 'themeConfig must be an object' },
        { status: 400 },
      );
    }

    if (themeConfig === null) {
      normalizedThemeConfig = resolveThemeConfig();
    } else {
      const presetId =
        typeof themeConfig.presetId === 'string' ? themeConfig.presetId : '';

      if (presetId && !isThemePresetId(presetId)) {
        return NextResponse.json(
          { error: 'Invalid theme preset' },
          { status: 400 },
        );
      }

      normalizedThemeConfig = resolveThemeConfig(
        presetId ? { presetId } : page.themeConfig,
      );
    }
  }

  // Validate slug uniqueness if changed
  if (slug && slug !== page.slug) {
    const existing = await db.query.pages.findFirst({
      where: eq(pages.slug, slug),
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Slug is already taken' },
        { status: 409 },
      );
    }
  }

  const [updated] = await db
    .update(pages)
    .set({
      slug: slug ?? page.slug,
      displayName: displayName ?? page.displayName,
      bio: bio !== undefined ? bio : page.bio,
      avatarUrl: avatarUrl !== undefined ? avatarUrl?.trim() || null : page.avatarUrl,
      themeConfig: normalizedThemeConfig,
      published: published !== undefined ? published : page.published,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, pageId))
    .returning();

  return NextResponse.json(updated);
}
