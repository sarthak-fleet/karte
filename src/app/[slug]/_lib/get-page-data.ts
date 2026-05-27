import { and, asc,eq } from 'drizzle-orm';
import { cache } from 'react';

import { db, ensureProjectsTable } from '@/db';
import { generatedPages,infoBlocks, links, pages, pageSections, projects, users } from '@/db/schema';

/**
 * Single query to load everything needed for a public profile page.
 * Returns page + user + links + projects + sections + readyPageTypes in one call.
 */
export const getFullPageData = cache(async (slug: string) => {
  // ensureProjectsTable runs eagerly on module load (db/index.ts)
  // Just await the existing promise without re-triggering
  await ensureProjectsTable();

  // 1. Get page + user in one query via join
  const pageRows = await db
    .select()
    .from(pages)
    .innerJoin(users, eq(users.id, pages.userId))
    .where(and(eq(pages.slug, slug), eq(pages.published, true)))
    .limit(1);

  const row = pageRows[0];
  if (!row) return null;

  const page = row.pages;
  const user = row.user;

  // 2. Fetch remaining data in parallel (3 queries instead of 5)
  const [pageLinks, pageProjects, publicSections, readyGeneratedPages] = await Promise.all([
    db.select().from(links)
      .where(and(eq(links.pageId, page.id), eq(links.enabled, true)))
      .orderBy(asc(links.sortOrder)),
    db.select().from(projects)
      .where(and(eq(projects.pageId, page.id), eq(projects.enabled, true)))
      .orderBy(asc(projects.sortOrder)),
    db.select().from(pageSections)
      .where(and(eq(pageSections.pageId, page.id), eq(pageSections.enabled, true)))
      .orderBy(asc(pageSections.sortOrder)),
    db.select({ type: generatedPages.type, content: generatedPages.content })
      .from(generatedPages)
      .where(and(eq(generatedPages.pageId, page.id), eq(generatedPages.status, 'ready'))),
  ]);

  // Pre-extract a one-line preview from each ready mode so the profile
  // page can surface real generated copy in the mode cards (much better
  // than the placeholder mock thumbs).
  const modePreviews: Record<string, string> = {};
  for (const row of readyGeneratedPages) {
    const preview = extractPreview(row.type, row.content);
    if (preview) modePreviews[row.type] = preview;
  }

  return {
    page,
    user,
    links: pageLinks,
    projects: pageProjects,
    sections: publicSections,
    readyPages: new Set(readyGeneratedPages.map((r) => r.type)),
    modePreviews,
  };
});

/**
 * Mode-specific preview extractor. Each generated mode stores its content
 * in a different shape (encyclopedia: markdown HTML; newspaper: structured
 * front-page; roast: long string), so the preview pulls the right field
 * per type and trims to ~140 chars.
 */
function extractPreview(type: string, content: unknown): string {
  if (!content || typeof content !== 'object') return '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = content as any;
  let text = '';
  if (type === 'encyclopedia') {
    const html = typeof c.markdown === 'string' ? c.markdown : '';
    text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  } else if (type === 'newspaper') {
    const headline =
      typeof c?.leadStory?.headline === 'string' ? c.leadStory.headline : '';
    const sub =
      typeof c?.leadStory?.subheadline === 'string'
        ? c.leadStory.subheadline
        : '';
    text = [headline, sub].filter(Boolean).join(' — ').trim();
  } else if (type === 'roast') {
    text = typeof c.roast === 'string' ? c.roast : '';
  }
  if (!text) return '';
  return text.length > 180 ? `${text.slice(0, 178).trimEnd()}…` : text;
}

// Keep individual helpers for sub-pages that don't need everything
export const getPageBySlug = cache(async (slug: string) => {
  await ensureProjectsTable();
  const result = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.published, true)))
    .limit(1);
  return result[0] ?? null;
});

export const getPageUser = cache(async (userId: string) => {
  const result = await db.select().from(users).where(eq(users.id, userId));
  return result[0] ?? null;
});

export const getPageLinks = cache(async (pageId: string) => {
  return db.select().from(links)
    .where(and(eq(links.pageId, pageId), eq(links.enabled, true)))
    .orderBy(asc(links.sortOrder));
});

export const getPageProjects = cache(async (pageId: string) => {
  return db.select().from(projects)
    .where(and(eq(projects.pageId, pageId), eq(projects.enabled, true)))
    .orderBy(asc(projects.sortOrder));
});

export const getPageSections = cache(async (pageId: string) => {
  return db.select().from(pageSections)
    .where(and(eq(pageSections.pageId, pageId), eq(pageSections.enabled, true)))
    .orderBy(asc(pageSections.sortOrder));
});

export const getPageInfoBlocks = cache(async (pageId: string) => {
  return db.select().from(infoBlocks)
    .where(eq(infoBlocks.pageId, pageId))
    .orderBy(asc(infoBlocks.sortOrder));
});

export const getGeneratedPage = cache(async (pageId: string, type: string) => {
  const result = await db.select().from(generatedPages)
    .where(and(eq(generatedPages.pageId, pageId), eq(generatedPages.type, type)))
    .limit(1);
  return result[0] ?? null;
});

export const getReadyPages = cache(async (pageId: string) => {
  const results = await db
    .select({ type: generatedPages.type })
    .from(generatedPages)
    .where(and(eq(generatedPages.pageId, pageId), eq(generatedPages.status, 'ready')));
  return new Set(results.map((r) => r.type));
});
