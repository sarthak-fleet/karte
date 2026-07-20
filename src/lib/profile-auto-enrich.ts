import { and, asc, desc, eq } from 'drizzle-orm';

import { db, ensureProjectsTable } from '@/db';
import { infoBlocks, links, pages, projects, users } from '@/db/schema';
import { generate, resolveAiConfig } from '@/lib/ai-client';
import { type ScrapedPage, scrapeUrls } from '@/lib/scraper';

type LinkRecord = typeof links.$inferSelect;
type ProjectRecord = typeof projects.$inferSelect;
type PageRecord = typeof pages.$inferSelect;

type ProfileEnrichmentProject = {
  title: string;
  url: string;
  description: string;
};

type ProfileEnrichmentMemoryBlock = {
  id: string;
  type: 'text' | 'faq' | 'current' | 'boundaries';
  title: string;
  content: string;
};

export type ProfileEnrichmentPlan = {
  bio: string | null;
  projects: ProfileEnrichmentProject[];
  memoryBlocks: ProfileEnrichmentMemoryBlock[];
  sourceCount: number;
  skippedUrls: string[];
};

export type AutoEnrichOptions = {
  userId?: string;
  apply?: boolean;
  updateBio?: boolean;
  replaceExisting?: boolean;
  maxUrls?: number;
};

const AUTO_INFO_PREFIX = 'auto-enrich-links';
const MAX_BIO_LENGTH = 320;
const MAX_MEMORY_LENGTH = 2600;

function cleanText(value: unknown, fallback = '', max = 900) {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, max);
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1];

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start)
    return text.slice(start, end + 1);

  return text;
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    parsed.hash = '';
    const normalized = parsed.toString().replace(/\/+$/, '');
    return normalized.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function stableIdForUrl(url: string) {
  let hash = 2166136261;
  for (let index = 0; index < url.length; index += 1) {
    hash ^= url.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function sourceUrls(
  pageLinks: LinkRecord[],
  pageProjects: ProjectRecord[],
  maxUrls: number,
) {
  const urls = [
    ...pageLinks
      .filter((link) => link.enabled !== false)
      .map((link) => link.url),
    ...pageProjects
      .filter((project) => project.enabled !== false)
      .map((project) => project.url),
  ];
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const url of urls) {
    const key = normalizeUrl(url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(url);
    if (unique.length >= maxUrls) break;
  }

  return unique;
}

function normalizePlan(
  value: unknown,
  sourceCount: number,
  skippedUrls: string[],
): ProfileEnrichmentPlan {
  const source =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  const rawProjects = Array.isArray(source.projects) ? source.projects : [];
  const rawMemoryBlocks = Array.isArray(source.memoryBlocks)
    ? source.memoryBlocks
    : [];

  const projectsPlan = rawProjects
    .map((raw): ProfileEnrichmentProject | null => {
      if (!raw || typeof raw !== 'object') return null;
      const item = raw as Record<string, unknown>;
      const url = cleanText(item.url, '', 2048);
      if (!/^https?:\/\//.test(url)) return null;

      return {
        title: cleanText(item.title, 'Untitled project', 100),
        url,
        description: cleanText(
          item.description,
          'A public project found from attached profile links.',
          500,
        ),
      };
    })
    .filter((item): item is ProfileEnrichmentProject => Boolean(item))
    .slice(0, 8);

  const memoryBlocks = rawMemoryBlocks
    .map((raw, index): ProfileEnrichmentMemoryBlock | null => {
      if (!raw || typeof raw !== 'object') return null;
      const item = raw as Record<string, unknown>;
      const type = cleanText(item.type, 'text', 20);
      if (!['text', 'faq', 'current', 'boundaries'].includes(type)) return null;

      return {
        id: `${AUTO_INFO_PREFIX}-${index + 1}`,
        type: type as ProfileEnrichmentMemoryBlock['type'],
        title: cleanText(item.title, 'Public link summary', 100),
        content: cleanText(item.content, '', MAX_MEMORY_LENGTH),
      };
    })
    .filter((item): item is ProfileEnrichmentMemoryBlock =>
      Boolean(item?.content),
    )
    .slice(0, 5);

  return {
    bio: cleanText(source.bio, '', MAX_BIO_LENGTH) || null,
    projects: projectsPlan,
    memoryBlocks,
    sourceCount,
    skippedUrls,
  };
}

function fallbackPlan(opts: {
  page: PageRecord;
  pageLinks: LinkRecord[];
  pageProjects: ProjectRecord[];
  scraped: ScrapedPage[];
  skippedUrls: string[];
}): ProfileEnrichmentPlan {
  const scrapedLines = opts.scraped.map((source) => {
    const title = source.title || source.url;
    const summary = [source.description, source.content]
      .filter(Boolean)
      .join(' ')
      .slice(0, 520);
    return `- ${title} (${source.url}): ${summary}`;
  });

  const projectCandidates = opts.scraped
    .filter((source) => source.title && /^https?:\/\//.test(source.url))
    .slice(0, 6)
    .map((source) => ({
      title: source.title.slice(0, 100),
      url: source.url,
      description: cleanText(
        [source.description, source.content].filter(Boolean).join(' '),
        'A public project or profile page found from attached links.',
        500,
      ),
    }));

  const attachedLinks = opts.pageLinks
    .filter((link) => link.enabled !== false)
    .map((link) => `${link.title}: ${link.url}`)
    .join('\n');

  return {
    bio: opts.page.bio
      ? null
      : `${opts.page.displayName} maintains a public profile built from attached links, projects, and public web context.`.slice(
          0,
          MAX_BIO_LENGTH,
        ),
    projects: projectCandidates,
    memoryBlocks: [
      {
        id: `${AUTO_INFO_PREFIX}-overview`,
        type: 'text',
        title: 'Auto-enriched public link context',
        content: [
          'Public context discovered from attached links:',
          scrapedLines.join('\n') ||
            'No readable public page text was available from the attached links.',
          attachedLinks ? `\nAttached profile links:\n${attachedLinks}` : '',
        ]
          .filter(Boolean)
          .join('\n')
          .slice(0, MAX_MEMORY_LENGTH),
      },
      {
        id: `${AUTO_INFO_PREFIX}-boundaries`,
        type: 'boundaries',
        title: 'Auto-enrichment boundaries',
        content: [
          'Use only the attached public links, project descriptions, and readable public scrape results as evidence.',
          'Do not infer private work, employers, education, awards, personal history, or facts from login-only pages.',
          opts.skippedUrls.length
            ? `Unreadable or skipped URLs: ${opts.skippedUrls.join(', ')}`
            : '',
        ]
          .filter(Boolean)
          .join(' '),
      },
    ],
    sourceCount: opts.scraped.length,
    skippedUrls: opts.skippedUrls,
  };
}

async function generatePlan(opts: {
  page: PageRecord;
  pageLinks: LinkRecord[];
  pageProjects: ProjectRecord[];
  scraped: ScrapedPage[];
}) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, opts.page.userId),
  });
  const aiConfig = resolveAiConfig(user);
  if (!aiConfig) {
    return fallbackPlan({ ...opts, skippedUrls: [] });
  }

  const result = await generate(aiConfig, {
    system: `You enrich Karte profiles from public linked sources.
Return only valid JSON. Use only the supplied links, projects, and scraped source cards.
Do not invent education, employers, awards, dates, locations, private contact details, or claims not present in the sources.
Prefer concrete projects and chat-useful memory. Keep wording concise and commercially polished.`,
    prompt: JSON.stringify({
      page: {
        displayName: opts.page.displayName,
        bio: opts.page.bio,
      },
      links: opts.pageLinks.map((link) => ({
        title: link.title,
        url: link.url,
      })),
      existingProjects: opts.pageProjects.map((project) => ({
        title: project.title,
        url: project.url,
        description: project.description,
      })),
      scrapedSources: opts.scraped.map((source) => ({
        url: source.url,
        title: source.title,
        description: source.description,
        content: source.content.slice(0, 1800),
      })),
      requiredJsonShape: {
        bio: 'Optional concise public bio, or null if current bio is better.',
        projects: [
          {
            title: 'Project or public destination name',
            url: 'https://example.com',
            description: 'Specific source-backed description under 500 chars',
          },
        ],
        memoryBlocks: [
          {
            type: 'text',
            title: 'Public work map',
            content:
              'Source-backed profile memory for chat and generated pages',
          },
          {
            type: 'boundaries',
            title: 'Evidence boundaries',
            content: 'What the assistant must not infer',
          },
        ],
      },
    }),
  });

  return normalizePlan(
    JSON.parse(extractJson(result)),
    opts.scraped.length,
    [],
  );
}

async function buildProfileEnrichmentPlan(
  pageId: string,
  options: AutoEnrichOptions = {},
): Promise<{
  page: PageRecord;
  plan: ProfileEnrichmentPlan;
  sources: ScrapedPage[];
}> {
  await ensureProjectsTable();

  const page = await db.query.pages.findFirst({
    where: options.userId
      ? and(eq(pages.id, pageId), eq(pages.userId, options.userId))
      : eq(pages.id, pageId),
  });

  if (!page) throw new Error('PAGE_NOT_FOUND');

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

  const urls = sourceUrls(pageLinks, pageProjects, options.maxUrls ?? 12);
  const scraped = await scrapeUrls(urls, {
    maxUrls: options.maxUrls ?? 12,
    timeoutMs: 8000,
    maxContentLength: 1800,
    useReaderFallback: true,
  });
  const scrapedUrlSet = new Set(
    scraped.map((source) => normalizeUrl(source.url)),
  );
  const skippedUrls = urls.filter(
    (url) => !scrapedUrlSet.has(normalizeUrl(url)),
  );

  let plan: ProfileEnrichmentPlan;
  try {
    plan = await generatePlan({ page, pageLinks, pageProjects, scraped });
    plan = {
      ...plan,
      sourceCount: scraped.length,
      skippedUrls,
      memoryBlocks:
        plan.memoryBlocks.length > 0
          ? plan.memoryBlocks
          : fallbackPlan({
              page,
              pageLinks,
              pageProjects,
              scraped,
              skippedUrls,
            }).memoryBlocks,
    };
  } catch {
    plan = fallbackPlan({
      page,
      pageLinks,
      pageProjects,
      scraped,
      skippedUrls,
    });
  }

  return { page, plan, sources: scraped };
}

async function applyProfileEnrichmentPlan(
  pageId: string,
  plan: ProfileEnrichmentPlan,
  options: Pick<AutoEnrichOptions, 'updateBio' | 'replaceExisting'> = {},
) {
  await ensureProjectsTable();

  const existingProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.pageId, pageId))
    .orderBy(asc(projects.sortOrder));
  const existingByUrl = new Map(
    existingProjects.map((project) => [normalizeUrl(project.url), project]),
  );
  const [maxProject] = await db
    .select({ sortOrder: projects.sortOrder })
    .from(projects)
    .where(eq(projects.pageId, pageId))
    .orderBy(desc(projects.sortOrder))
    .limit(1);
  let nextProjectOrder = (maxProject?.sortOrder ?? -1) + 1;

  const [maxBlock] = await db
    .select({ sortOrder: infoBlocks.sortOrder })
    .from(infoBlocks)
    .where(eq(infoBlocks.pageId, pageId))
    .orderBy(desc(infoBlocks.sortOrder))
    .limit(1);
  let nextBlockOrder = (maxBlock?.sortOrder ?? -1) + 1;

  const applied = {
    bioUpdated: false,
    projectsInserted: 0,
    projectsUpdated: 0,
    memoryBlocksUpserted: 0,
  };

  // D1 rejects drizzle's BEGIN/COMMIT transactions. This is a
  // background enrichment with branching + counter updates that
  // doesn't map cleanly to db.batch(), so we run the ops sequentially
  // without atomicity. A mid-run failure leaves partial state — that's
  // acceptable here because the function re-runs on the next enrich
  // cycle and individual operations are idempotent (onConflictDoUpdate).
  if (options.updateBio && plan.bio) {
    await db
      .update(pages)
      .set({ bio: plan.bio, updatedAt: new Date() })
      .where(eq(pages.id, pageId));
    applied.bioUpdated = true;
  }

  for (const project of plan.projects) {
    const existing = existingByUrl.get(normalizeUrl(project.url));
    if (existing) {
      if (options.replaceExisting) {
        await db
          .update(projects)
          .set({
            title: project.title,
            description: project.description,
            enabled: true,
          })
          .where(
            and(eq(projects.id, existing.id), eq(projects.pageId, pageId)),
          );
        applied.projectsUpdated += 1;
      }
      continue;
    }

    await db
      .insert(projects)
      .values({
        id: `auto-project-${stableIdForUrl(`${pageId}:${project.url}`)}`,
        pageId,
        title: project.title,
        url: project.url,
        description: project.description,
        sortOrder: nextProjectOrder,
        enabled: true,
      })
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          title: project.title,
          description: project.description,
          enabled: true,
        },
      });
    nextProjectOrder += 1;
    applied.projectsInserted += 1;
  }

  for (const block of plan.memoryBlocks) {
    const idBase = block.id.startsWith(AUTO_INFO_PREFIX)
      ? block.id
      : `${AUTO_INFO_PREFIX}-${stableIdForUrl(block.title)}`;
    const id = `${idBase}-${stableIdForUrl(pageId)}`;
    await db
      .insert(infoBlocks)
      .values({
        id,
        pageId,
        type: block.type,
        title: block.title,
        content: block.content,
        sortOrder: nextBlockOrder,
      })
      .onConflictDoUpdate({
        target: infoBlocks.id,
        set: {
          type: block.type,
          title: block.title,
          content: block.content,
        },
      });
    nextBlockOrder += 1;
    applied.memoryBlocksUpserted += 1;
  }

  await db
    .update(pages)
    .set({
      scrapedContent: {
        data: [],
        scrapedAt: Date.now(),
      },
      updatedAt: new Date(),
    })
    .where(eq(pages.id, pageId));

  return applied;
}

export async function autoEnrichProfileFromLinks(
  pageId: string,
  options: AutoEnrichOptions = {},
) {
  const result = await buildProfileEnrichmentPlan(pageId, options);
  const applied = options.apply
    ? await applyProfileEnrichmentPlan(pageId, result.plan, options)
    : null;

  if (options.apply) {
    await db
      .update(pages)
      .set({
        scrapedContent: {
          data: result.sources,
          scrapedAt: Date.now(),
        },
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId));
  }

  return {
    ...result,
    applied,
  };
}
