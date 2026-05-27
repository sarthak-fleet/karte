import type { ImportedLink, Parser } from '../types';
import {
  cleanTitle,
  dedupeLinks,
  getSourceHost,
  isUsefulLink,
  MAX_IMPORT_LINKS,
  normalizeUrl,
  titleFromUrl,
} from '../utils';

function extractFromAnchors(html: string, sourceUrl: string): ImportedLink[] {
  const sourceHost = getSourceHost(sourceUrl);
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
    const item: ImportedLink = { title, url };

    if (!isUsefulLink(item, sourceHost)) continue;

    seen.add(url);
    items.push(item);
    if (items.length >= MAX_IMPORT_LINKS) break;
  }

  return items;
}

function extractFromJsonLd(html: string, sourceUrl: string): ImportedLink[] {
  const sourceHost = getSourceHost(sourceUrl);
  const items: ImportedLink[] = [];
  const seen = new Set<string>();
  const urlPattern = /https?:\\?\/\\?\/[^"',<>\s)]+/gi;
  const matches = html.match(urlPattern) ?? [];

  for (const raw of matches) {
    const candidate = raw.replace(/\\\//g, '/');
    const url = normalizeUrl(candidate, sourceUrl);
    if (!url || seen.has(url)) continue;

    const item: ImportedLink = { title: titleFromUrl(url), url };
    if (!isUsefulLink(item, sourceHost)) continue;

    seen.add(url);
    items.push(item);
    if (items.length >= MAX_IMPORT_LINKS) break;
  }

  return items;
}

export const genericParser: Parser = {
  name: 'generic',
  matches: () => true,
  parse: async ({ html, sourceUrl }) => {
    // True fallback: only run JSON-LD scan when anchor extraction yields zero.
    // Previously these were merged unconditionally and the JSON-LD scan
    // polluted clean Linktree/Carrd/Solo.to imports with asset URLs.
    const anchors = extractFromAnchors(html, sourceUrl);
    if (anchors.length > 0) return dedupeLinks(anchors);

    return dedupeLinks(extractFromJsonLd(html, sourceUrl));
  },
};
