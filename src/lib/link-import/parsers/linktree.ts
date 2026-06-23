import { MAX_TITLE_LENGTH } from '@/lib/validation';

import type { ImportedLink, Parser } from '../types';
import {
  cleanTitle,
  dedupeLinks,
  getSourceHost,
  isUsefulLink,
  MAX_IMPORT_LINKS,
  normalizeUrl,
} from '../utils';
import { genericParser } from './generic';

/**
 * Linktree's real content lives in `<script id="__NEXT_DATA__" type="application/json">`
 * under `props.pageProps.account.links[]`. Each entry has `title`, `url`, and
 * sometimes `modifiers.thumbnailUrl`. Anchor scraping picks up navigation
 * chrome and is much noisier — prefer the JSON blob.
 */

type LinktreeLink = {
  title?: string;
  url?: string;
  type?: string;
  modifiers?: { thumbnailUrl?: string | null };
};

const NEXT_DATA_RE = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i;

function pickLinktreeLinks(json: unknown): LinktreeLink[] {
  if (!json || typeof json !== 'object') return [];
  const root = json as Record<string, unknown>;
  const props = root.props as Record<string, unknown> | undefined;
  const pageProps = props?.pageProps as Record<string, unknown> | undefined;
  const account = pageProps?.account as Record<string, unknown> | undefined;
  const candidates: LinktreeLink[] = [];

  for (const key of ['links', 'pinnedLinks']) {
    const value = account?.[key];
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry && typeof entry === 'object')
          candidates.push(entry as LinktreeLink);
      }
    }
  }

  return candidates;
}

export const linktreeParser: Parser = {
  name: 'linktree',
  matches: (url) => {
    try {
      const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
      return host === 'linktr.ee' || host.endsWith('.linktr.ee');
    } catch {
      return false;
    }
  },
  parse: async (ctx) => {
    const match = NEXT_DATA_RE.exec(ctx.html);
    if (!match) {
      return genericParser.parse(ctx);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(match[1] ?? 'null');
    } catch {
      return genericParser.parse(ctx);
    }

    const sourceHost = getSourceHost(ctx.sourceUrl);
    const out: ImportedLink[] = [];
    for (const entry of pickLinktreeLinks(parsed)) {
      if (!entry.url || typeof entry.url !== 'string') continue;
      const normalized = normalizeUrl(entry.url, ctx.sourceUrl);
      if (!normalized) continue;

      const rawTitle = typeof entry.title === 'string' ? entry.title : '';
      const title = cleanTitle(rawTitle, normalized).slice(0, MAX_TITLE_LENGTH);
      const thumbnail = entry.modifiers?.thumbnailUrl ?? undefined;

      const item: ImportedLink = thumbnail
        ? { title, url: normalized, thumbnail }
        : { title, url: normalized };
      if (!isUsefulLink(item, sourceHost)) continue;
      out.push(item);
      if (out.length >= MAX_IMPORT_LINKS) break;
    }

    const deduped = dedupeLinks(out);
    if (deduped.length > 0) return deduped;

    return genericParser.parse(ctx);
  },
};
