import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { links, pages } from '@/db/schema';
import { getSession } from '@/lib/auth-server';
import { isValidUrl, MAX_TITLE_LENGTH } from '@/lib/validation';

type ImportedLink = {
  title: string;
  url: string;
};

const MAX_IMPORT_LINKS = 30;
const FETCH_TIMEOUT_MS = 8000;
const BLOCKED_LABELS = new Set([
  'cookie',
  'cookies',
  'privacy',
  'privacy policy',
  'terms',
  'terms of service',
  'sign in',
  'log in',
  'login',
  'sign up',
  'get started',
  'report',
]);

function isBlockedUrl(urlStr: string): boolean {
  try {
    const { hostname } = new URL(urlStr);
    const lower = hostname.toLowerCase();

    if (lower === 'localhost' || lower.endsWith('.local') || lower.endsWith('.internal')) return true;
    if (lower.includes('metadata') || lower.includes('internal')) return true;

    const ipv4 = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) {
      const [, a, b] = ipv4.map(Number);
      if (a === 127 || a === 10 || a === 0) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 169 && b === 254) return true;
    }

    if (lower === '[::1]' || lower.startsWith('[fe80:') || lower.startsWith('[fc') || lower.startsWith('[fd')) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&nbsp;/g, ' ');
}

function stripTags(value: string) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function titleFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname
      .split('/')
      .filter(Boolean)
      .slice(-1)[0]
      ?.replace(/[-_]+/g, ' ');
    return (path || host).slice(0, MAX_TITLE_LENGTH);
  } catch {
    return 'Imported link';
  }
}

function cleanTitle(value: string, url: string) {
  const title = stripTags(value)
    .replace(/\s+/g, ' ')
    .replace(/^↗\s*/, '')
    .trim();

  if (!title || BLOCKED_LABELS.has(title.toLowerCase())) {
    return titleFromUrl(url);
  }

  return title.slice(0, MAX_TITLE_LENGTH);
}

function normalizeUrl(rawUrl: string, sourceUrl: string) {
  try {
    const url = new URL(decodeEntities(rawUrl), sourceUrl);

    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (isBlockedUrl(url.toString())) return null;

    for (const param of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      url.searchParams.delete(param);
    }

    return url.toString();
  } catch {
    return null;
  }
}

function isUsefulLink(item: ImportedLink, sourceHost: string) {
  try {
    const parsed = new URL(item.url);
    const host = parsed.hostname.replace(/^www\./, '');
    const label = item.title.toLowerCase();

    if (host === sourceHost || host.endsWith(`.${sourceHost}`)) return false;
    if (BLOCKED_LABELS.has(label)) return false;
    if (label.length < 2) return false;

    return true;
  } catch {
    return false;
  }
}

function extractFromAnchors(html: string, sourceUrl: string) {
  const sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, '');
  const items: ImportedLink[] = [];
  const seen = new Set<string>();
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html)) !== null) {
    const attrs = match[1] ?? '';
    const body = match[2] ?? '';
    const hrefMatch = attrs.match(/\shref\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch?.[1]) continue;

    const url = normalizeUrl(hrefMatch[1], sourceUrl);
    if (!url || seen.has(url)) continue;

    const aria = attrs.match(/\saria-label\s*=\s*["']([^"']+)["']/i)?.[1] ?? '';
    const title = cleanTitle(aria || body, url);
    const item = { title, url };

    if (!isUsefulLink(item, sourceHost)) continue;

    seen.add(url);
    items.push(item);
    if (items.length >= MAX_IMPORT_LINKS) break;
  }

  return items;
}

function extractFromJsonLd(html: string, sourceUrl: string) {
  const sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, '');
  const items: ImportedLink[] = [];
  const seen = new Set<string>();
  const urlPattern = /https?:\\?\/\\?\/[^"',<>\s)]+/gi;
  const matches = html.match(urlPattern) ?? [];

  for (const raw of matches) {
    const candidate = raw.replace(/\\\//g, '/');
    const url = normalizeUrl(candidate, sourceUrl);
    if (!url || seen.has(url)) continue;

    const item = { title: titleFromUrl(url), url };
    if (!isUsefulLink(item, sourceHost)) continue;

    seen.add(url);
    items.push(item);
    if (items.length >= MAX_IMPORT_LINKS) break;
  }

  return items;
}

function mergeImportedLinks(primary: ImportedLink[], fallback: ImportedLink[]) {
  const seen = new Set<string>();
  const merged: ImportedLink[] = [];

  for (const item of [...primary, ...fallback]) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    merged.push(item);
    if (merged.length >= MAX_IMPORT_LINKS) break;
  }

  return merged;
}

async function fetchSource(sourceUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; LinkChatImporter/1.0)',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Import source returned ${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) {
      throw new Error('Import source must be an HTML page');
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyOwnership(pageId: string, userId: string) {
  const [page] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, userId)));

  return page ?? null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId } = await params;
  const page = await verifyOwnership(pageId, session.user.id);
  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const mode = body.mode === 'import' ? 'import' : 'preview';

  if (mode === 'preview') {
    const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : '';
    if (!isValidUrl(sourceUrl) || isBlockedUrl(sourceUrl)) {
      return NextResponse.json({ error: 'Enter a valid public URL' }, { status: 400 });
    }

    try {
      const html = await fetchSource(sourceUrl);
      const importedLinks = mergeImportedLinks(
        extractFromAnchors(html, sourceUrl),
        extractFromJsonLd(html, sourceUrl),
      );

      return NextResponse.json({ links: importedLinks });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to import links' },
        { status: 502 },
      );
    }
  }

  const incomingLinks: unknown[] = Array.isArray(body.links) ? body.links : [];
  const importedLinks = incomingLinks
    .map((item): ImportedLink | null => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const title = typeof record.title === 'string' ? record.title.trim().slice(0, MAX_TITLE_LENGTH) : '';
      const url = typeof record.url === 'string' ? record.url.trim() : '';
      if (!title || !isValidUrl(url) || isBlockedUrl(url)) return null;
      return { title, url };
    })
    .filter((item): item is ImportedLink => Boolean(item))
    .slice(0, MAX_IMPORT_LINKS);

  if (importedLinks.length === 0) {
    return NextResponse.json({ error: 'No valid links selected' }, { status: 400 });
  }

  const existingLinks = await db
    .select({ url: links.url })
    .from(links)
    .where(eq(links.pageId, pageId));
  const existingUrls = new Set(existingLinks.map((item) => item.url));

  const [maxLink] = await db
    .select({ sortOrder: links.sortOrder })
    .from(links)
    .where(eq(links.pageId, pageId))
    .orderBy(desc(links.sortOrder))
    .limit(1);

  const startOrder = (maxLink?.sortOrder ?? -1) + 1;
  const values = importedLinks
    .filter((item) => !existingUrls.has(item.url))
    .map((item, index) => ({
      pageId,
      title: item.title,
      url: item.url,
      sortOrder: startOrder + index,
      enabled: true,
    }));

  if (values.length === 0) {
    return NextResponse.json({ imported: [], skipped: importedLinks.length });
  }

  const inserted = await db.insert(links).values(values).returning();

  return NextResponse.json({
    imported: inserted,
    skipped: importedLinks.length - inserted.length,
  });
}
