#!/usr/bin/env node
// Run our importer extractor against arbitrary URLs and print what we'd
// import. Mirrors src/app/api/pages/[pageId]/links/import/route.ts so we
// can audit real competitor profiles without standing up a worker.
//
// Usage:  node scripts/test-import.mjs <url> [<url> ...]
// Output: per-URL JSON block — { url, status, count, links: [{ title, url }] }

const MAX_IMPORT_LINKS = 30;
const FETCH_TIMEOUT_MS = 8000;
const MAX_TITLE_LENGTH = 80;

const BLOCKED_LABELS = new Set([
  'cookie', 'cookies', 'privacy', 'privacy policy',
  'terms', 'terms of service', 'sign in', 'log in', 'login',
  'sign up', 'get started', 'report',
]);

function isBlockedUrl(urlStr) {
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
    return false;
  } catch { return true; }
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'").replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&nbsp;/g, ' ');
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function titleFromUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname.split('/').filter(Boolean).slice(-1)[0]?.replace(/[-_]+/g, ' ');
    return (path || host).slice(0, MAX_TITLE_LENGTH);
  } catch { return 'Imported link'; }
}

function cleanTitle(value, url) {
  const title = stripTags(value).replace(/\s+/g, ' ').replace(/^↗\s*/, '').trim();
  if (!title || BLOCKED_LABELS.has(title.toLowerCase())) return titleFromUrl(url);
  return title.slice(0, MAX_TITLE_LENGTH);
}

function normalizeUrl(rawUrl, sourceUrl) {
  try {
    const url = new URL(decodeEntities(rawUrl), sourceUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (isBlockedUrl(url.toString())) return null;
    for (const p of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']) {
      url.searchParams.delete(p);
    }
    return url.toString();
  } catch { return null; }
}

function isUsefulLink(item, sourceHost) {
  try {
    const parsed = new URL(item.url);
    const host = parsed.hostname.replace(/^www\./, '');
    const label = item.title.toLowerCase();
    if (host === sourceHost || host.endsWith(`.${sourceHost}`)) return false;
    if (BLOCKED_LABELS.has(label)) return false;
    if (label.length < 2) return false;
    return true;
  } catch { return false; }
}

function extractFromAnchors(html, sourceUrl) {
  const sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, '');
  const items = [];
  const seen = new Set();
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
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

function extractFromJsonLd(html, sourceUrl) {
  const sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, '');
  const items = [];
  const seen = new Set();
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

function mergeImportedLinks(primary, fallback) {
  const seen = new Set();
  const merged = [];
  for (const item of [...primary, ...fallback]) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    merged.push(item);
    if (merged.length >= MAX_IMPORT_LINKS) break;
  }
  return merged;
}

async function fetchSource(sourceUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; KarteImporter/1.0)',
      },
      redirect: 'follow',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally { clearTimeout(timeout); }
}

async function testUrl(url) {
  try {
    const html = await fetchSource(url);
    const primary = extractFromAnchors(html, url);
    const fallback = extractFromJsonLd(html, url);
    const merged = mergeImportedLinks(primary, fallback);
    return {
      url,
      status: 'ok',
      htmlBytes: html.length,
      anchorsFound: primary.length,
      jsonLdFound: fallback.length,
      count: merged.length,
      links: merged,
    };
  } catch (err) {
    return { url, status: 'error', error: err.message };
  }
}

async function main() {
  const urls = process.argv.slice(2);
  if (urls.length === 0) {
    console.error('Usage: node scripts/test-import.mjs <url> [<url> ...]');
    process.exit(1);
  }
  const results = await Promise.all(urls.map(testUrl));
  for (const r of results) {
    console.log('\n' + '='.repeat(72));
    console.log(r.url);
    console.log('='.repeat(72));
    if (r.status === 'error') {
      console.log(`ERROR: ${r.error}`);
      continue;
    }
    console.log(`html=${r.htmlBytes}B  anchors=${r.anchorsFound}  jsonld=${r.jsonLdFound}  merged=${r.count}`);
    for (const link of r.links) {
      console.log(`  • ${link.title}  →  ${link.url}`);
    }
  }
}

main();
