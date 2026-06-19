import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { pages } from '@/db/schema';
import { requireUser } from '@/lib/api-auth';
import { isThemePresetId, resolveThemeConfig } from '@/lib/themes';
import {
  isValidSlug,
  isValidUrl,
  MAX_BIO_LENGTH,
  MAX_TITLE_LENGTH,
} from '@/lib/validation';

export async function GET() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  await ensureProjectsTable();

  const userPages = await db
    .select()
    .from(pages)
    .where(eq(pages.userId, auth.userId));

  return NextResponse.json(userPages);
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  await ensureProjectsTable();

  const body = await req.json();
  const {
    slug,
    displayName,
    bio,
    avatarUrl,
    themeConfig,
    location,
    calendarUrl,
    newsletterUrl,
    tipUrl,
    videoUrl,
  } = body;

  if (!slug || !displayName) {
    return NextResponse.json(
      { error: 'slug and displayName are required' },
      { status: 400 },
    );
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: 'Slug must be 3-50 chars, lowercase alphanumeric and hyphens only' },
      { status: 400 },
    );
  }

  if (displayName.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      { error: 'Display name too long (max 100 chars)' },
      { status: 400 },
    );
  }

  if (bio && bio.length > MAX_BIO_LENGTH) {
    return NextResponse.json(
      { error: 'Bio too long (max 500 chars)' },
      { status: 400 },
    );
  }

  if (avatarUrl && (typeof avatarUrl !== 'string' || !isValidUrl(avatarUrl))) {
    return NextResponse.json(
      { error: 'Avatar URL must be a valid URL' },
      { status: 400 },
    );
  }

  let normalizedThemeConfig = resolveThemeConfig();
  if (themeConfig !== undefined && themeConfig !== null) {
    if (typeof themeConfig !== 'object' || Array.isArray(themeConfig)) {
      return NextResponse.json(
        { error: 'themeConfig must be an object' },
        { status: 400 },
      );
    }

    const presetId =
      typeof themeConfig.presetId === 'string' ? themeConfig.presetId : '';

    if (presetId && !isThemePresetId(presetId)) {
      return NextResponse.json(
        { error: 'Invalid theme preset' },
        { status: 400 },
      );
    }

    normalizedThemeConfig = resolveThemeConfig(
      presetId ? { presetId } : undefined,
    );
  }

  // Check slug uniqueness
  const existing = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, slug));

  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'Slug is already taken' },
      { status: 409 },
    );
  }

  // All quick-action URLs are optional + nullable. Trim + accept any
  // non-empty string — we render-time validate, not save-time, so visitors
  // never see a half-broken card.
  const optionalText = (value: unknown) =>
    typeof value === 'string' && value.trim() ? value.trim() : null;

  const [page] = await db
    .insert(pages)
    .values({
      userId: auth.userId,
      slug,
      displayName,
      bio: bio ?? null,
      avatarUrl: avatarUrl?.trim() || null,
      themeConfig: normalizedThemeConfig,
      location: optionalText(location),
      calendarUrl: optionalText(calendarUrl),
      newsletterUrl: optionalText(newsletterUrl),
      tipUrl: optionalText(tipUrl),
      videoUrl: optionalText(videoUrl),
    })
    .returning();

  return NextResponse.json(page, { status: 201 });
}
