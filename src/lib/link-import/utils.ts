import { MAX_TITLE_LENGTH } from '@/lib/validation';

import type { ImportedLink } from './types';

export const MAX_IMPORT_LINKS = 30;
export const FETCH_TIMEOUT_MS = 8000;

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

// Hostnames that are never user content (CDNs, schema namespaces, etc.).
const BLOCKED_ASSET_HOSTS = new Set([
  'fonts.gstatic.com',
  'fonts.googleapis.com',
  'schema.org',
  'www.w3.org',
  'w3.org',
]);

const BLOCKED_ASSET_HOST_SUFFIXES = ['.youtube-nocookie.com'];

const ASSET_EXTENSIONS = new Set([
  '.css',
  '.js',
  '.mjs',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.webp',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.map',
]);

export function isBlockedUrl(urlStr: string): boolean {
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
    ) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

function isAssetUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();
    if (BLOCKED_ASSET_HOSTS.has(host)) return true;
    if (BLOCKED_ASSET_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix)))
      return true;

    const pathname = url.pathname.toLowerCase();
    const dot = pathname.lastIndexOf('.');
    if (dot >= 0) {
      const ext = pathname.slice(dot);
      if (ASSET_EXTENSIONS.has(ext)) return true;
    }

    return false;
  } catch {
    return false;
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
  return decodeEntities(
    value
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

export function titleFromUrl(url: string) {
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

/**
 * Collapse adjacent identical tokens (case-insensitive). Linktree/Carrd pages
 * commonly produce `"Twitter Twitter"` because the aria-label and visible text
 * carry the same word — strip the duplicate so we get a clean title.
 */
function dedupeAdjacentWords(value: string): string {
  const tokens = value.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const token of tokens) {
    const prev = out[out.length - 1];
    if (prev && prev.toLowerCase() === token.toLowerCase()) continue;
    out.push(token);
  }
  return out.join(' ');
}

export function cleanTitle(value: string, url: string) {
  const stripped = stripTags(value)
    .replace(/\s+/g, ' ')
    .replace(/^↗\s*/, '')
    .trim();

  const title = dedupeAdjacentWords(stripped);

  if (!title || BLOCKED_LABELS.has(title.toLowerCase())) {
    return titleFromUrl(url);
  }

  return title.slice(0, MAX_TITLE_LENGTH);
}

export function normalizeUrl(rawUrl: string, sourceUrl: string): string | null {
  try {
    const url = new URL(decodeEntities(rawUrl), sourceUrl);

    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (isBlockedUrl(url.toString())) return null;
    if (isAssetUrl(url.toString())) return null;

    for (const param of [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
    ]) {
      url.searchParams.delete(param);
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function isUsefulLink(item: ImportedLink, sourceHost: string) {
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

export function getSourceHost(sourceUrl: string): string {
  return new URL(sourceUrl).hostname.replace(/^www\./, '');
}

/**
 * Approximate the registrable domain by taking the last two labels of the
 * hostname (e.g. `foo.linktr.ee` → `linktr.ee`, `linktr.ee` → `linktr.ee`).
 * Good enough for redirect-host guarding without bundling a PSL.
 */
export function registrableDomain(hostname: string): string {
  const parts = hostname
    .toLowerCase()
    .replace(/^www\./, '')
    .split('.');
  if (parts.length <= 2) return parts.join('.');
  return parts.slice(-2).join('.');
}

export function dedupeLinks(input: ImportedLink[]): ImportedLink[] {
  const seen = new Set<string>();
  const out: ImportedLink[] = [];
  for (const item of input) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    out.push(item);
    if (out.length >= MAX_IMPORT_LINKS) break;
  }
  return out;
}
