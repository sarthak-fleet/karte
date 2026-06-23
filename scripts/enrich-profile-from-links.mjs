#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@libsql/client';

const DEFAULT_MAX_URLS = 12;
const TIMEOUT_MS = 8000;
const MAX_CONTENT_LENGTH = 1800;

function loadDotenv() {
  const envPath = resolve(process.cwd(), '.env.local');
  try {
    const text = readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('='))
        continue;
      const index = trimmed.indexOf('=');
      const key = trimmed.slice(0, index).trim();
      const value = trimmed
        .slice(index + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // .env.local is optional; real deployments usually provide env directly.
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    apply: false,
    updateBio: false,
    replaceExisting: true,
    maxUrls: DEFAULT_MAX_URLS,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--apply') parsed.apply = true;
    else if (arg === '--update-bio') parsed.updateBio = true;
    else if (arg === '--no-replace-existing') parsed.replaceExisting = false;
    else if (arg === '--slug') parsed.slug = args[(index += 1)];
    else if (arg === '--page-id') parsed.pageId = args[(index += 1)];
    else if (arg === '--max-urls')
      parsed.maxUrls = Math.min(
        Number(args[(index += 1)]) || DEFAULT_MAX_URLS,
        20,
      );
    else if (arg === '--help') parsed.help = true;
  }

  return parsed;
}

function usage() {}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '').toLowerCase();
  } catch {
    return String(url || '')
      .trim()
      .toLowerCase();
  }
}

function stableIdFor(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function isBlockedUrl(urlStr) {
  try {
    const { hostname } = new URL(urlStr);
    const lower = hostname.toLowerCase();
    if (
      lower === 'localhost' ||
      lower.endsWith('.local') ||
      lower.endsWith('.internal')
    )
      return true;
    if (lower.includes('metadata') || lower.includes('internal')) return true;

    const ipv4 = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) {
      const [, a, b] = ipv4.map(Number);
      if (a === 127 || a === 10 || a === 0) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 169 && b === 254) return true;
    }

    if (
      lower === '[::1]' ||
      lower.startsWith('[fe80:') ||
      lower.startsWith('[fc') ||
      lower.startsWith('[fd')
    )
      return true;
    return false;
  } catch {
    return true;
  }
}

async function fetchWithTimeout(url, headers) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers,
      redirect: 'follow',
    });
    if (!res.ok) return null;
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function decodeEntities(text) {
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

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1].trim()) : '';
}

function extractDescription(html) {
  const match =
    html.match(
      /<meta\s+[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([\s\S]*?)["'][^>]*\/?>/i,
    ) ||
    html.match(
      /<meta\s+[^>]*content\s*=\s*["']([\s\S]*?)["'][^>]*name\s*=\s*["']description["'][^>]*\/?>/i,
    );
  return match ? decodeEntities(match[1].trim()) : '';
}

function extractBody(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<header[\s\S]*?<\/header>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function pageFromReader(url, text) {
  const title = text.match(/^Title:\s*(.+)$/im)?.[1]?.trim() || '';
  const description = text.match(/^Description:\s*(.+)$/im)?.[1]?.trim() || '';
  const content = text
    .replace(/^Title:\s*.+$/gim, ' ')
    .replace(/^URL Source:\s*.+$/gim, ' ')
    .replace(/^Markdown Content:\s*/gim, ' ')
    .replace(/^Description:\s*.+$/gim, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    url,
    title,
    description,
    content: content.slice(0, MAX_CONTENT_LENGTH),
  };
}

function hasUsefulContent(page) {
  const content =
    `${page.title} ${page.description} ${page.content}`.toLowerCase();
  const isShell =
    content.includes('enable javascript') ||
    content.includes('just a moment') ||
    content.includes('sign in') ||
    content.includes('log in') ||
    content.includes('abs.twimg.com') ||
    content.includes('responsive-web/client-web');
  if (isShell) return false;
  return page.content.length > 220;
}

async function scrapeOne(url) {
  const fullUrl = url.startsWith('http') ? url : `https://${url}`;
  if (isBlockedUrl(fullUrl)) return null;

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (compatible; LinkChatBot/1.0; +https://linkchat.dev)',
    Accept: 'text/html,application/xhtml+xml,text/plain',
  };
  const htmlRes = await fetchWithTimeout(fullUrl, headers);
  if (htmlRes) {
    const contentType = htmlRes.headers.get('content-type') || '';
    if (
      contentType.includes('text/html') ||
      contentType.includes('text/plain')
    ) {
      const html = await htmlRes.text();
      const page = {
        url,
        title: extractTitle(html),
        description: extractDescription(html),
        content: extractBody(html).slice(0, MAX_CONTENT_LENGTH),
      };
      if (hasUsefulContent(page)) return page;
    }
  }

  const readerRes = await fetchWithTimeout(
    `https://r.jina.ai/http://r.jina.ai/http://${fullUrl}`,
    {
      'User-Agent':
        'Mozilla/5.0 (compatible; LinkChatBot/1.0; +https://linkchat.dev)',
      Accept: 'text/plain,text/markdown',
    },
  );
  if (!readerRes) return null;
  return pageFromReader(url, await readerRes.text());
}

function sourceUrls(links, projects, maxUrls) {
  const seen = new Set();
  const urls = [];
  for (const item of [...links, ...projects]) {
    if (item.enabled === 0) continue;
    const url = item.url;
    const key = normalizeUrl(url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    urls.push(url);
    if (urls.length >= maxUrls) break;
  }
  return urls;
}

function buildPlan(page, links, scraped, skippedUrls) {
  const projects = scraped
    .filter((source) => source.title && /^https?:\/\//.test(source.url))
    .slice(0, 8)
    .map((source) => ({
      title: source.title.slice(0, 100),
      url: source.url,
      description:
        [source.description, source.content]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 500) ||
        'A public project or profile page found from attached links.',
    }));

  const scrapedLines = scraped.map((source) => {
    const title = source.title || source.url;
    const summary = [source.description, source.content]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 520);
    return `- ${title} (${source.url}): ${summary}`;
  });

  return {
    bio: page.bio
      ? null
      : `${page.displayName} maintains a public profile built from attached links, projects, and public web context.`.slice(
          0,
          320,
        ),
    projects,
    memoryBlocks: [
      {
        id: `auto-enrich-links-overview-${stableIdFor(page.id)}`,
        type: 'text',
        title: 'Auto-enriched public link context',
        content: [
          'Public context discovered from attached links:',
          scrapedLines.join('\n') ||
            'No readable public page text was available from the attached links.',
          links.length
            ? `\nAttached profile links:\n${links.map((link) => `${link.title}: ${link.url}`).join('\n')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n')
          .slice(0, 2600),
      },
      {
        id: `auto-enrich-links-boundaries-${stableIdFor(page.id)}`,
        type: 'boundaries',
        title: 'Auto-enrichment boundaries',
        content: [
          'Use only attached public links, project descriptions, and readable public scrape results as evidence.',
          'Do not infer private work, employers, education, awards, personal history, or facts from login-only pages.',
          skippedUrls.length
            ? `Unreadable or skipped URLs: ${skippedUrls.join(', ')}`
            : '',
        ]
          .filter(Boolean)
          .join(' '),
      },
    ],
    sourceCount: scraped.length,
    skippedUrls,
  };
}

async function main() {
  loadDotenv();
  const args = parseArgs();
  if (args.help || (!args.slug && !args.pageId)) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL is required');
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const pageQuery = args.pageId
    ? await client.execute({
        sql: 'SELECT * FROM pages WHERE id = ?',
        args: [args.pageId],
      })
    : await client.execute({
        sql: 'SELECT * FROM pages WHERE slug = ?',
        args: [args.slug],
      });
  const page = pageQuery.rows[0];
  if (!page) throw new Error('Page not found');

  const [linksResult, projectsResult] = await Promise.all([
    client.execute({
      sql: 'SELECT * FROM links WHERE pageId = ? ORDER BY sortOrder ASC',
      args: [page.id],
    }),
    client.execute({
      sql: 'SELECT * FROM projects WHERE pageId = ? ORDER BY sortOrder ASC',
      args: [page.id],
    }),
  ]);

  const urls = sourceUrls(linksResult.rows, projectsResult.rows, args.maxUrls);
  const scrapedSettled = await Promise.allSettled(
    urls.map((url) => scrapeOne(url)),
  );
  const scraped = scrapedSettled
    .filter((result) => result.status === 'fulfilled' && result.value)
    .map((result) => result.value);
  const scrapedSet = new Set(scraped.map((source) => normalizeUrl(source.url)));
  const skippedUrls = urls.filter((url) => !scrapedSet.has(normalizeUrl(url)));
  const plan = buildPlan(page, linksResult.rows, scraped, skippedUrls);

  if (args.apply) {
    const existingProjectUrls = new Map(
      projectsResult.rows.map((project) => [
        normalizeUrl(project.url),
        project,
      ]),
    );
    const maxProjectOrder = projectsResult.rows.reduce(
      (max, project) => Math.max(max, Number(project.sortOrder ?? -1)),
      -1,
    );
    let nextProjectOrder = maxProjectOrder + 1;

    for (const project of plan.projects) {
      const existing = existingProjectUrls.get(normalizeUrl(project.url));
      if (existing) {
        if (args.replaceExisting) {
          await client.execute({
            sql: 'UPDATE projects SET title = ?, description = ?, enabled = 1 WHERE id = ? AND pageId = ?',
            args: [project.title, project.description, existing.id, page.id],
          });
        }
        continue;
      }

      await client.execute({
        sql: 'INSERT OR REPLACE INTO projects (id, pageId, title, url, description, sortOrder, enabled) VALUES (?, ?, ?, ?, ?, ?, 1)',
        args: [
          `auto-project-${stableIdFor(`${page.id}:${project.url}`)}`,
          page.id,
          project.title,
          project.url,
          project.description,
          nextProjectOrder,
        ],
      });
      nextProjectOrder += 1;
    }

    const maxBlockResult = await client.execute({
      sql: 'SELECT MAX(sortOrder) AS maxSort FROM infoBlocks WHERE pageId = ?',
      args: [page.id],
    });
    let nextBlockOrder = Number(maxBlockResult.rows[0]?.maxSort ?? -1) + 1;

    for (const block of plan.memoryBlocks) {
      await client.execute({
        sql: `INSERT INTO infoBlocks (id, pageId, type, title, content, sortOrder)
              VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET type = excluded.type, title = excluded.title, content = excluded.content`,
        args: [
          block.id,
          page.id,
          block.type,
          block.title,
          block.content,
          nextBlockOrder,
        ],
      });
      nextBlockOrder += 1;
    }

    if (args.updateBio && plan.bio) {
      await client.execute({
        sql: 'UPDATE pages SET bio = ?, updatedAt = ? WHERE id = ?',
        args: [plan.bio, Date.now(), page.id],
      });
    }

    await client.execute({
      sql: 'UPDATE pages SET scrapedContent = ?, updatedAt = ? WHERE id = ?',
      args: [
        JSON.stringify({ data: scraped, scrapedAt: Date.now() }),
        Date.now(),
        page.id,
      ],
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
