import { MAX_TITLE_LENGTH } from '@/lib/validation';

import { fetchSource } from '../fetch';
import { ImportError, type ImportedLink, type Parser } from '../types';
import {
  cleanTitle,
  dedupeLinks,
  getSourceHost,
  isUsefulLink,
  MAX_IMPORT_LINKS,
  normalizeUrl,
} from '../utils';

/**
 * Linkin.bio (acquired by Later) is an Ember SPA — the HTML returned at
 * `linkin.bio/<slug>` is a shell with no link content. The Ember app fetches
 * page data from `https://api-prod.linkin.bio/api/v2/pages?nickname=<slug>`
 * (verified by reading their bundled `services/data.js`). The endpoint returns
 * the page, its blocks, and social-link lists in JSON.
 *
 * Relevant block shapes we extract from:
 *  - `block_type: "button_list"`  → `block_data.buttons[] { url, title, enabled }`
 *  - `block_type: "social_link_list"` → `block_data.social_links[] { url, platform, enabled }`
 *  - `block_type: "link"` / `"button"` → `block_data.url`, `block_data.title|label`
 */

const API_PREFIX = 'https://api-prod.linkin.bio/api/v2';

type LinkinbioBlockData = {
  url?: string;
  title?: string;
  label?: string;
  enabled?: boolean;
  buttons?: Array<{
    url?: string;
    title?: string;
    label?: string;
    enabled?: boolean;
  }>;
  social_links?: Array<{ url?: string; platform?: string; enabled?: boolean }>;
};

type LinkinbioBlock = {
  block_type?: string;
  block_data?: LinkinbioBlockData;
};

type LinkinbioPage = {
  linkinbio_blocks?: LinkinbioBlock[];
  social_profiles?: Array<{ default_link?: string; name?: string }>;
};

function platformTitle(platform: string | undefined): string {
  if (!platform) return '';
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

function pushBlock(
  out: ImportedLink[],
  seen: Set<string>,
  rawUrl: string | undefined,
  rawTitle: string,
  sourceUrl: string,
  sourceHost: string,
) {
  if (!rawUrl) return;
  const normalized = normalizeUrl(rawUrl, sourceUrl);
  if (!normalized || seen.has(normalized)) return;

  const item: ImportedLink = {
    title: cleanTitle(rawTitle, normalized).slice(0, MAX_TITLE_LENGTH),
    url: normalized,
  };
  if (!isUsefulLink(item, sourceHost)) return;
  seen.add(normalized);
  out.push(item);
}

function extractFromPage(
  page: LinkinbioPage,
  sourceUrl: string,
): ImportedLink[] {
  const sourceHost = getSourceHost(sourceUrl);
  const out: ImportedLink[] = [];
  const seen = new Set<string>();

  for (const block of page.linkinbio_blocks ?? []) {
    if (out.length >= MAX_IMPORT_LINKS) break;
    const data = block.block_data ?? {};
    if (data.enabled === false) continue;

    switch (block.block_type) {
      case 'button_list': {
        for (const btn of data.buttons ?? []) {
          if (btn.enabled === false) continue;
          pushBlock(
            out,
            seen,
            btn.url,
            btn.title ?? btn.label ?? '',
            sourceUrl,
            sourceHost,
          );
          if (out.length >= MAX_IMPORT_LINKS) break;
        }
        break;
      }
      case 'social_link_list': {
        for (const social of data.social_links ?? []) {
          if (social.enabled === false) continue;
          pushBlock(
            out,
            seen,
            social.url,
            platformTitle(social.platform),
            sourceUrl,
            sourceHost,
          );
          if (out.length >= MAX_IMPORT_LINKS) break;
        }
        break;
      }
      default: {
        // Fallback for "link", "button", and any future singular blocks.
        if (typeof data.url === 'string') {
          pushBlock(
            out,
            seen,
            data.url,
            data.title ?? data.label ?? '',
            sourceUrl,
            sourceHost,
          );
        }
      }
    }
  }

  return dedupeLinks(out);
}

function slugFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts[0] ?? null;
  } catch {
    return null;
  }
}

export const linkinBioParser: Parser = {
  name: 'linkin-bio',
  fetchesItsOwnData: true,
  matches: (url) => {
    try {
      const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
      return host === 'linkin.bio' || host.endsWith('.linkin.bio');
    } catch {
      return false;
    }
  },
  parse: async ({ sourceUrl }) => {
    const slug = slugFromUrl(sourceUrl);
    if (!slug) return [];

    const apiUrl = `${API_PREFIX}/pages?nickname=${encodeURIComponent(slug)}`;
    let body: string;
    try {
      const result = await fetchSource(apiUrl, {
        accept: 'application/json',
        allowAnyContentType: true,
        allowCrossDomainRedirect: true,
      });
      body = result.body;
    } catch (err) {
      if (err instanceof ImportError && /404/.test(err.message)) {
        throw new ImportError(
          'Linkin.bio profile not found — check the URL.',
          404,
        );
      }
      throw err;
    }

    let parsed: { linkinbio_page?: LinkinbioPage } | undefined;
    try {
      parsed = JSON.parse(body);
    } catch {
      return [];
    }

    const page = parsed?.linkinbio_page;
    if (!page) return [];

    return extractFromPage(page, sourceUrl);
  },
};
