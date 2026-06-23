import { asc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { links, pages, projects } from '@/db/schema';
import type { ScrapedCache } from '@/lib/scraper';
import { formatScrapedContent, isCacheValid, scrapeUrls } from '@/lib/scraper';

/**
 * Get scraped content for a page's links and projects.
 * Uses a 24h cache stored on the pages table; re-scrapes if stale or missing.
 * Never throws — returns empty string on failure.
 */
export async function getScrapedContext(
  pageId: string,
  page: { scrapedContent: ScrapedCache | null },
): Promise<string> {
  try {
    // Check cache first
    const cached = page.scrapedContent;
    if (isCacheValid(cached)) {
      return formatScrapedContent(cached.data);
    }

    // Fetch links and projects for scraping
    const [pageLinks, pageProjects] = await Promise.all([
      db
        .select()
        .from(links)
        .where(eq(links.pageId, pageId))
        .orderBy(asc(links.sortOrder)),
      db
        .select()
        .from(projects)
        .where(eq(projects.pageId, pageId))
        .orderBy(asc(projects.sortOrder)),
    ]);

    const allUrls = [
      ...pageLinks.filter((l) => l.enabled).map((l) => l.url),
      ...pageProjects.filter((p) => p.enabled).map((p) => p.url),
    ];

    if (allUrls.length === 0) return '';

    const scraped = await scrapeUrls(allUrls);
    if (scraped.length === 0) return '';

    // Cache the result
    const cache: ScrapedCache = { data: scraped, scrapedAt: Date.now() };
    await db
      .update(pages)
      .set({ scrapedContent: cache })
      .where(eq(pages.id, pageId))
      .catch(() => {}); // Don't fail if cache write fails

    return formatScrapedContent(scraped);
  } catch {
    // Never block generation if scraping fails
    return '';
  }
}
