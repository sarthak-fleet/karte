import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { pages, projects } from '@/db/schema';
import { requireUser } from '@/lib/api-auth';
import {
  isValidUrl,
  MAX_PROJECT_DESCRIPTION_LENGTH,
  MAX_PROJECT_URL_LENGTH,
  MAX_TITLE_LENGTH,
} from '@/lib/validation';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  await ensureProjectsTable();

  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, auth.userId)));

  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pageProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.pageId, pageId))
    .orderBy(projects.sortOrder);

  return NextResponse.json(pageProjects);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  await ensureProjectsTable();

  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, auth.userId)));

  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const imageUrl =
    typeof body.imageUrl === 'string' && body.imageUrl.trim()
      ? body.imageUrl.trim()
      : null;
  const description =
    typeof body.description === 'string' ? body.description.trim() : '';

  if (!title || !url || !description) {
    return NextResponse.json(
      { error: 'title, url, and description are required' },
      { status: 400 },
    );
  }

  if (!isValidUrl(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (url.length > MAX_PROJECT_URL_LENGTH) {
    return NextResponse.json(
      { error: 'URL too long (max 2048 chars)' },
      { status: 400 },
    );
  }

  if (imageUrl && !isValidUrl(imageUrl)) {
    return NextResponse.json(
      { error: 'Image URL must be a valid URL' },
      { status: 400 },
    );
  }

  if (imageUrl && imageUrl.length > MAX_PROJECT_URL_LENGTH) {
    return NextResponse.json(
      { error: 'Image URL too long (max 2048 chars)' },
      { status: 400 },
    );
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      { error: 'Title too long (max 100 chars)' },
      { status: 400 },
    );
  }

  if (description.length > MAX_PROJECT_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      { error: 'Description too long (max 500 chars)' },
      { status: 400 },
    );
  }

  const [maxProject] = await db
    .select({ sortOrder: projects.sortOrder })
    .from(projects)
    .where(eq(projects.pageId, pageId))
    .orderBy(desc(projects.sortOrder))
    .limit(1);

  const nextOrder = (maxProject?.sortOrder ?? -1) + 1;

  const [project] = await db
    .insert(projects)
    .values({
      pageId,
      title,
      url,
      imageUrl,
      description,
      sortOrder: nextOrder,
    })
    .returning();

  return NextResponse.json(project, { status: 201 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  await ensureProjectsTable();

  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, auth.userId)));

  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const orderedProjectIds = Array.isArray(body.orderedProjectIds)
    ? body.orderedProjectIds.filter(
        (id: unknown): id is string => typeof id === 'string',
      )
    : [];

  if (orderedProjectIds.length === 0) {
    return NextResponse.json(
      { error: 'orderedProjectIds is required' },
      { status: 400 },
    );
  }

  const currentProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.pageId, pageId));

  const currentIds = currentProjects.map((project) => project.id).sort();
  const nextIds = [...new Set(orderedProjectIds)].sort();

  if (
    currentIds.length !== nextIds.length ||
    currentIds.some((id, index) => id !== nextIds[index])
  ) {
    return NextResponse.json(
      { error: 'orderedProjectIds must contain all project ids exactly once' },
      { status: 400 },
    );
  }

  // D1 rejects drizzle's BEGIN/COMMIT transactions — use an atomic
  // batch of per-row UPDATEs instead.
  const updates = orderedProjectIds.map((id: string, index: number) =>
    db
      .update(projects)
      .set({ sortOrder: index })
      .where(and(eq(projects.id, id), eq(projects.pageId, pageId))),
  );
  if (updates.length > 0) {
    await db.batch(updates as [(typeof updates)[number], ...typeof updates]);
  }

  const reorderedProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.pageId, pageId))
    .orderBy(projects.sortOrder);

  return NextResponse.json(reorderedProjects);
}
