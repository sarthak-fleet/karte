import type { ImportedLink, Parser } from '../types';
import {
  cleanTitle,
  dedupeLinks,
  getSourceHost,
  isUsefulLink,
  MAX_IMPORT_LINKS,
  normalizeUrl,
} from '../utils';

/**
 * Stan.store ships a Nuxt SPA. The inline `window.__NUXT__` payload is an IIFE
 * — a compressed function expression that we cannot safely JSON-parse without
 * executing JavaScript (which we will not do server-side). There is no
 * documented public API, and `__NEXT_DATA__` / `__INITIAL_STATE__` are not
 * used.
 *
 * Best-effort strategy: harvest the unicode-escaped URL string literals that
 * Nuxt emits inside the payload (`"https://example.com/..."`)
 * and run them through the same dedupe + asset-filter pipeline as the rest of
 * the importer. Titles are inferred from URL slugs.
 *
 * If we ever need higher-fidelity titles, the only real fix is a headless
 * browser. Filing as future work in `src/lib/link-import/index.ts`.
 */

const NUXT_ASSIGNMENT_RE = /window\.__NUXT__\s*=\s*([\s\S]*?)<\/script>/i;
const ESCAPED_URL_RE = /https?:(?:\\u002F\\u002F|\/\/)[^"'\\<>\s)]+/gi;

function decodeNuxtEscapes(raw: string): string {
  return raw.replace(/\\u002F/gi, '/');
}

export const stanParser: Parser = {
  name: 'stan',
  matches: (url) => {
    try {
      const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
      return host === 'stan.store' || host.endsWith('.stan.store');
    } catch {
      return false;
    }
  },
  parse: async (ctx) => {
    const match = NUXT_ASSIGNMENT_RE.exec(ctx.html);
    if (!match) return [];

    const sourceHost = getSourceHost(ctx.sourceUrl);
    const payload = match[1] ?? '';
    const found = payload.match(ESCAPED_URL_RE) ?? [];
    const out: ImportedLink[] = [];

    for (const raw of found) {
      const decoded = decodeNuxtEscapes(raw);
      const normalized = normalizeUrl(decoded, ctx.sourceUrl);
      if (!normalized) continue;

      const item: ImportedLink = {
        title: cleanTitle('', normalized),
        url: normalized,
      };
      if (!isUsefulLink(item, sourceHost)) continue;
      out.push(item);
      if (out.length >= MAX_IMPORT_LINKS * 2) break;
    }

    return dedupeLinks(out);
  },
};
