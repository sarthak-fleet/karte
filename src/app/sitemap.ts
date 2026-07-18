import { eq } from 'drizzle-orm';
import type { MetadataRoute } from 'next';

import { db } from '@/db';
import { pages } from '@/db/schema';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const siteUrl = 'https://karte.cc';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/create`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/skill.md`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/llms.txt`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/index.md`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  let profileRoutes: MetadataRoute.Sitemap = [];
  try {
    const published = await db
      .select({
        slug: pages.slug,
        updatedAt: pages.updatedAt,
        encyclopediaEnabled: pages.encyclopediaEnabled,
        roastEnabled: pages.roastEnabled,
        newspaperEnabled: pages.newspaperEnabled,
      })
      .from(pages)
      .where(eq(pages.published, true))
      .limit(50_000);

    profileRoutes = published.flatMap((p) => {
      const lastModified =
        p.updatedAt instanceof Date
          ? p.updatedAt
          : p.updatedAt
            ? new Date(p.updatedAt)
            : now;
      const base = `${siteUrl}/${p.slug}`;
      const entries: MetadataRoute.Sitemap = [
        {
          url: base,
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.7,
        },
      ];
      if (p.encyclopediaEnabled) {
        entries.push({
          url: `${base}/encyclopedia`,
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.55,
        });
      }
      if (p.roastEnabled) {
        entries.push({
          url: `${base}/roast`,
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.5,
        });
      }
      if (p.newspaperEnabled) {
        entries.push({
          url: `${base}/newspaper`,
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.5,
        });
      }
      // Machine-readable agent manifest
      entries.push({
        url: `${base}/agent.json`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.4,
      });
      return entries;
    });
  } catch {
    /* D1 offline at build — static-only fallback */
  }

  return [...staticRoutes, ...profileRoutes];
}
