#!/usr/bin/env node
/**
 * Audit harness for the link importer. Mirrors the production parser shapes
 * in `src/lib/link-import/` and exercises them against real URLs so we can
 * spot regressions before deploying.
 *
 * Usage:
 *   node scripts/test-import.mjs                       # run the default battery
 *   node scripts/test-import.mjs https://linktr.ee/x   # run on a custom URL
 */

const USER_AGENT = 'Mozilla/5.0 (compatible; KarteImporter/1.0)';
const FETCH_TIMEOUT_MS = 8000;
const MAX_TITLE_LENGTH = 100;
const MAX_IMPORT_LINKS = 30;

const BLOCKED_LABELS = new Set([
  'cookie', 'cookies', 'privacy', 'privacy policy', 'terms',
  'terms of service', 'sign in', 'log in', 'login', 'sign up',
  'get started', 'report',
]);

const BLOCKED_ASSET_HOSTS = new Set([
  'fonts.gstatic.com',
  'fonts.googleapis.com',
  'schema.org',
  'www.w3.org',
  'w3.org',
]);

const ASSET_EXTENSIONS = new Set([
  '.css', '.js', '.mjs', '.woff', '.woff2', '.ttf', '.otf',
  '.webp', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.map',
]);

const ASSET_HOST_SUFFIXES = ['.youtube-nocookie.com'];

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&nbsp;/g, ' ');
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function dedupeAdjacentWords(value) {
  const tokens = value.split(/\s+/).filter(Boolean);
  const out = [];
  for (const t of tokens) {
    if (out.length && out[out.length - 1].toLowerCase() === t.toLowerCase()) continue;
    out.push(t);
  }
  return out.join(' ');
}

function titleFromUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname.split('/').filter(Boolean).slice(-1)[0]?.replace(/[-_]+/g, ' ');
    return (path || host).slice(0, MAX_TITLE_LENGTH);
  } catch {
    return 'Imported link';
  }
}

function cleanTitle(value, url) {
  const stripped = stripTags(value).replace(/\s+/g, ' ').replace(/^↗\s*/, '').trim();
  const title = dedupeAdjacentWords(stripped);
  if (!title || BLOCKED_LABELS.has(title.toLowerCase())) return titleFromUrl(url);
  return title.slice(0, MAX_TITLE_LENGTH);
}

function isBlockedUrl(urlStr) {
  try {
    const { hostname } = new URL(urlStr);
    const h = hostname.toLowerCase();
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true;
    if (h.includes('metadata') || h.includes('internal')) return true;
    const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
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

function isAssetUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    const h = u.hostname.toLowerCase();
    if (BLOCKED_ASSET_HOSTS.has(h)) return true;
    if (ASSET_HOST_SUFFIXES.some((s) => h.endsWith(s))) return true;
    const p = u.pathname.toLowerCase();
    const dot = p.lastIndexOf('.');
    if (dot >= 0 && ASSET_EXTENSIONS.has(p.slice(dot))) return true;
    return false;
  } catch { return false; }
}

function normalizeUrl(rawUrl, sourceUrl) {
  try {
    const url = new URL(decodeEntities(rawUrl), sourceUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (isBlockedUrl(url.toString())) return null;
    if (isAssetUrl(url.toString())) return null;
    for (const p of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']) {
      url.searchParams.delete(p);
    }
    return url.toString();
  } catch { return null; }
}

function isUsefulLink(item, sourceHost) {
  try {
    const h = new URL(item.url).hostname.replace(/^www\./, '');
    const label = item.title.toLowerCase();
    if (h === sourceHost || h.endsWith(`.${sourceHost}`)) return false;
    if (BLOCKED_LABELS.has(label)) return false;
    if (label.length < 2) return false;
    return true;
  } catch { return false; }
}

function registrableDomain(hostname) {
  const parts = hostname.toLowerCase().replace(/^www\./, '').split('.');
  if (parts.length <= 2) return parts.join('.');
  return parts.slice(-2).join('.');
}

async function fetchSource(url, { allowCrossDomainRedirect = false, accept = 'text/html,application/xhtml+xml' } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: accept, 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });
    if (res.status === 403) {
      throw new Error('This page blocks automated imports. Try copying your links manually.');
    }
    if (!res.ok) throw new Error(`Import source returned ${res.status}`);
    if (!allowCrossDomainRedirect) {
      const inputHost = new URL(url).hostname;
      const finalHost = new URL(res.url).hostname;
      if (registrableDomain(inputHost) !== registrableDomain(finalHost)) {
        throw new Error('This page redirects to a different domain — refusing import.');
      }
    }
    return { body: await res.text(), finalUrl: res.url };
  } finally { clearTimeout(timeout); }
}

// --- generic ---
function extractFromAnchors(html, sourceUrl) {
  const sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, '');
  const items = [];
  const seen = new Set();
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] ?? '';
    const body = m[2] ?? '';
    const href = attrs.match(/\shref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    const url = normalizeUrl(href, sourceUrl);
    if (!url || seen.has(url)) continue;
    const aria = attrs.match(/\saria-label\s*=\s*["']([^"']+)["']/i)?.[1] ?? '';
    const item = { title: cleanTitle(aria || body, url), url };
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
  const matches = html.match(/https?:\\?\/\\?\/[^"',<>\s)]+/gi) ?? [];
  for (const raw of matches) {
    const url = normalizeUrl(raw.replace(/\\\//g, '/'), sourceUrl);
    if (!url || seen.has(url)) continue;
    const item = { title: titleFromUrl(url), url };
    if (!isUsefulLink(item, sourceHost)) continue;
    seen.add(url);
    items.push(item);
    if (items.length >= MAX_IMPORT_LINKS) break;
  }
  return items;
}

function genericParse(html, sourceUrl) {
  const anchors = extractFromAnchors(html, sourceUrl);
  if (anchors.length > 0) return anchors;
  return extractFromJsonLd(html, sourceUrl);
}

// --- linktree ---
function linktreeParse(html, sourceUrl) {
  const m = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (!m) return genericParse(html, sourceUrl);
  let json;
  try { json = JSON.parse(m[1]); } catch { return genericParse(html, sourceUrl); }
  const links = json?.props?.pageProps?.account?.links;
  if (!Array.isArray(links)) return genericParse(html, sourceUrl);
  const sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, '');
  const out = [];
  for (const entry of links) {
    if (!entry?.url) continue;
    const url = normalizeUrl(entry.url, sourceUrl);
    if (!url) continue;
    const item = { title: cleanTitle(entry.title || '', url), url };
    if (!isUsefulLink(item, sourceHost)) continue;
    out.push(item);
    if (out.length >= MAX_IMPORT_LINKS) break;
  }
  return out.length ? out : genericParse(html, sourceUrl);
}

// --- stan ---
function stanParse(html, sourceUrl) {
  const m = /window\.__NUXT__\s*=\s*([\s\S]*?)<\/script>/i.exec(html);
  if (!m) return [];
  const sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, '');
  const found = (m[1].match(/https?:(?:\\u002F\\u002F|\/\/)[^"'\\<>\s)]+/gi) ?? []).map((s) => s.replace(/\\u002F/gi, '/'));
  const seen = new Set();
  const out = [];
  for (const raw of found) {
    const url = normalizeUrl(raw, sourceUrl);
    if (!url || seen.has(url)) continue;
    const item = { title: cleanTitle('', url), url };
    if (!isUsefulLink(item, sourceHost)) continue;
    seen.add(url);
    out.push(item);
    if (out.length >= MAX_IMPORT_LINKS) break;
  }
  return out;
}

// --- linkin-bio ---
async function linkinBioParse(_html, sourceUrl) {
  const slug = new URL(sourceUrl).pathname.split('/').filter(Boolean)[0];
  if (!slug) return [];
  const { body } = await fetchSource(
    `https://api-prod.linkin.bio/api/v2/pages?nickname=${encodeURIComponent(slug)}`,
    { allowCrossDomainRedirect: true, accept: 'application/json' },
  );
  let parsed; try { parsed = JSON.parse(body); } catch { return []; }
  const page = parsed?.linkinbio_page;
  if (!page) return [];
  const sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, '');
  const seen = new Set();
  const out = [];
  function push(url, title) {
    const n = url ? normalizeUrl(url, sourceUrl) : null;
    if (!n || seen.has(n)) return;
    const item = { title: cleanTitle(title || '', n), url: n };
    if (!isUsefulLink(item, sourceHost)) return;
    seen.add(n);
    out.push(item);
  }
  for (const block of page.linkinbio_blocks ?? []) {
    if (out.length >= MAX_IMPORT_LINKS) break;
    const d = block.block_data || {};
    if (d.enabled === false) continue;
    if (block.block_type === 'button_list') {
      for (const b of d.buttons || []) {
        if (b.enabled === false) continue;
        push(b.url, b.title || b.label);
        if (out.length >= MAX_IMPORT_LINKS) break;
      }
    } else if (block.block_type === 'social_link_list') {
      for (const s of d.social_links || []) {
        if (s.enabled === false) continue;
        const t = s.platform ? s.platform.charAt(0).toUpperCase() + s.platform.slice(1) : '';
        push(s.url, t);
        if (out.length >= MAX_IMPORT_LINKS) break;
      }
    } else if (typeof d.url === 'string') {
      push(d.url, d.title || d.label);
    }
  }
  return out;
}

// --- orchestration ---
function pickParser(url) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'linktr.ee' || host.endsWith('.linktr.ee')) return ['linktree', linktreeParse, false];
    if (host === 'linkin.bio' || host.endsWith('.linkin.bio')) return ['linkin-bio', linkinBioParse, true];
    if (host === 'stan.store' || host.endsWith('.stan.store')) return ['stan', stanParse, false];
  } catch {}
  return ['generic', genericParse, false];
}

async function parseSource(url) {
  const [name, parse, fetchesOwn] = pickParser(url);
  if (fetchesOwn) return { parser: name, links: await parse('', url) };
  const { body } = await fetchSource(url);
  return { parser: name, links: await parse(body, url) };
}

// --- main ---
const DEFAULTS = [
  'https://linktr.ee/MrBeast',
  'https://carrd.co',
  'https://solo.to/anuel',
  'https://linkin.bio/latermedia',
  'https://stan.store/abigailpeugh',
  'https://bento.me/maitelang',
];

async function main() {
  const args = process.argv.slice(2);
  const urls = args.length ? args : DEFAULTS;
  for (const url of urls) {
    process.stdout.write(`\n[${url}]\n`);
    try {
      const { parser, links } = await parseSource(url);
      process.stdout.write(`  parser=${parser} count=${links.length}\n`);
      for (const link of links.slice(0, 8)) {
        process.stdout.write(`  - ${link.title}  →  ${link.url}\n`);
      }
      if (links.length > 8) process.stdout.write(`  ... +${links.length - 8} more\n`);
    } catch (err) {
      process.stdout.write(`  ERROR: ${err.message}\n`);
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
