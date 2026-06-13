import { and, asc, desc, eq } from 'drizzle-orm';
import { cache } from 'react';

import { db, ensureProjectsTable } from '@/db';
import { generatedPages,infoBlocks, links, pages, pageSections, projects, timelineEvents, users } from '@/db/schema';

// CF Edge cache for resolved profile data. Owner edits propagate in
// ~60s — short enough to feel live, long enough to absorb the bulk of
// repeat traffic to a popular slug. Bump suffix to invalidate after
// schema / shape changes.
const PROFILE_CACHE_TTL_SECONDS = 60;
const profileCacheUrl = (slug: string) =>
  `https://internal-cache/profile/${encodeURIComponent(slug)}:v2`;

// JSON.stringify drops `Set` instances. We round-trip ready page types
// as an array and reconstruct the Set on read.
type CachedPageData = Omit<
  NonNullable<Awaited<ReturnType<typeof loadFullPageData>>>,
  'readyPages'
> & { readyPages: string[] };

/**
 * Single query to load everything needed for a public profile page.
 * Returns page + user + links + projects + sections + readyPageTypes in one call.
 */
export const getFullPageData = cache(async (slug: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const edgeCache = (globalThis as any).caches?.default as Cache | undefined;
  const cacheUrl = profileCacheUrl(slug);

  if (edgeCache) {
    try {
      const cached = await edgeCache.match(cacheUrl);
      if (cached) {
        const parsed = (await cached.json()) as CachedPageData;
        return {
          ...parsed,
          readyPages: new Set(parsed.readyPages),
        };
      }
    } catch {
      // Cache read failure — fall through to DB.
    }
  }

  const data = await loadFullPageData(slug);
  if (!data) return null;

  if (edgeCache) {
    try {
      const serializable: CachedPageData = {
        ...data,
        readyPages: Array.from(data.readyPages),
      };
      const response = new Response(JSON.stringify(serializable), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${PROFILE_CACHE_TTL_SECONDS}, s-maxage=${PROFILE_CACHE_TTL_SECONDS}`,
        },
      });
      void edgeCache.put(cacheUrl, response);
    } catch {
      // Non-fatal: serving fresh data without storing the cache entry.
    }
  }

  return data;
});

async function loadFullPageData(slug: string) {
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

  // 2. Fetch remaining data in parallel
  const [pageLinks, pageProjects, publicSections, readyGeneratedPages, publicTimeline] = await Promise.all([
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
    // Only 'published' timeline events render publicly. 'hidden' still
    // feeds AI memory (separate query in buildProfileMemory).
    db.select().from(timelineEvents)
      .where(and(eq(timelineEvents.pageId, page.id), eq(timelineEvents.status, 'published')))
      .orderBy(desc(timelineEvents.sortDate)),
  ]);

  // Pre-extract typed previews for each ready mode. The profile page
  // uses these to render proper mini-page previews (Wikipedia tabs +
  // body, newspaper masthead + headline + lede, roast quote) instead
  // of one-line placeholders.
  const modePreviews: Record<string, string> = {};
  const modeContent: ModeContent = {};
  for (const row of readyGeneratedPages) {
    const preview = extractPreview(row.type, row.content);
    if (preview) modePreviews[row.type] = preview;
    const structured = extractStructured(row.type, row.content);
    if (structured) modeContent[row.type as keyof ModeContent] = structured;
  }

  return {
    page,
    user,
    links: pageLinks,
    projects: pageProjects,
    sections: publicSections,
    timeline: publicTimeline,
    readyPages: new Set(readyGeneratedPages.map((r) => r.type)),
    modePreviews,
    modeContent,
  };
}

export interface ModeContent {
  encyclopedia?: {
    body: string;
    topics: string[];
  };
  newspaper?: {
    mastheadName: string;
    dateline: string;
    headline: string;
    subheadline: string;
    body: string;
  };
  roast?: {
    quote: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractStructured(type: string, content: unknown): any {
  if (!content || typeof content !== 'object') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = content as any;

  if (type === 'encyclopedia') {
    const html = typeof c.markdown === 'string' ? c.markdown : '';
    // Plain-text body — first paragraph, trimmed.
    const stripped = html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const body = truncate(stripped, 240);
    // Topic chips — pull <h2> headings from the HTML, max 4.
    const topics: string[] = [];
    const h2Re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
    let m;
    while ((m = h2Re.exec(html)) !== null && topics.length < 4) {
      const t = m[1].replace(/<[^>]+>/g, '').trim();
      if (t) topics.push(t);
    }
    return body ? { body, topics } : null;
  }

  if (type === 'newspaper') {
    // New multi-page schema stores stories under c.pages[0].leadStory;
    // legacy single-page content put it at c.leadStory. Prefer the new
    // shape but fall back so old cached content still previews.
    const lead =
      (Array.isArray(c?.pages) && c.pages[0]?.leadStory) || c?.leadStory;
    return {
      mastheadName: typeof c.mastheadName === 'string' ? c.mastheadName : '',
      dateline: typeof c.dateline === 'string' ? c.dateline : '',
      headline: typeof lead?.headline === 'string' ? lead.headline : '',
      subheadline:
        typeof lead?.subheadline === 'string' ? lead.subheadline : '',
      body: typeof lead?.body === 'string' ? truncate(lead.body, 200) : '',
    };
  }

  if (type === 'roast') {
    const text = typeof c.roast === 'string' ? c.roast : '';
    // First two sentences make the strongest pull-quote.
    const first =
      text
        .split(/(?<=[.!?])\s+/)
        .slice(0, 2)
        .join(' ')
        .trim() || text;
    return { quote: truncate(first, 240) };
  }

  return null;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const slice = s.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`;
}

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
    const lead =
      (Array.isArray(c?.pages) && c.pages[0]?.leadStory) || c?.leadStory;
    const headline =
      typeof lead?.headline === 'string' ? lead.headline : '';
    const sub =
      typeof lead?.subheadline === 'string' ? lead.subheadline : '';
    text = [headline, sub].filter(Boolean).join(' — ').trim();
  } else if (type === 'roast') {
    text = typeof c.roast === 'string' ? c.roast : '';
  }
  if (!text) return '';
  // Keep previews short — a tantalizing single line, not a paragraph.
  // Cut at a word boundary near the limit so we don't slice mid-word.
  const MAX = 110;
  if (text.length <= MAX) return text;
  const slice = text.slice(0, MAX);
  const lastSpace = slice.lastIndexOf(' ');
  return `${(lastSpace > 60 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`;
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
