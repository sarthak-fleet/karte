import { cache } from 'react';
import { eq, and, asc } from 'drizzle-orm';
import { db, ensureProjectsTable } from '@/db';
import { pages, links, projects, pageSections, users, infoBlocks, generatedPages } from '@/db/schema';

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
  return db
    .select()
    .from(links)
    .where(and(eq(links.pageId, pageId), eq(links.enabled, true)))
    .orderBy(asc(links.sortOrder));
});

export const getPageProjects = cache(async (pageId: string) => {
  await ensureProjectsTable();
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.pageId, pageId), eq(projects.enabled, true)))
    .orderBy(asc(projects.sortOrder));
});

export const getPageSections = cache(async (pageId: string) => {
  await ensureProjectsTable();
  return db
    .select()
    .from(pageSections)
    .where(and(eq(pageSections.pageId, pageId), eq(pageSections.enabled, true)))
    .orderBy(asc(pageSections.sortOrder));
});

export const getPageInfoBlocks = cache(async (pageId: string) => {
  return db
    .select()
    .from(infoBlocks)
    .where(eq(infoBlocks.pageId, pageId))
    .orderBy(asc(infoBlocks.sortOrder));
});

export const getGeneratedPage = cache(async (pageId: string, type: string) => {
  await ensureProjectsTable();
  const result = await db
    .select()
    .from(generatedPages)
    .where(and(eq(generatedPages.pageId, pageId), eq(generatedPages.type, type)))
    .limit(1);
  return result[0] ?? null;
});
