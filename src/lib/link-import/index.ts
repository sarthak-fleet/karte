import { fetchSource } from './fetch';
import { genericParser } from './parsers/generic';
import { linkinBioParser } from './parsers/linkin-bio';
import { linktreeParser } from './parsers/linktree';
import { stanParser } from './parsers/stan';
import type { ImportedLink, Parser } from './types';

// TODO(headless): Beacons + Bio.link 403 us behind CF bot challenge. Needs a
// headless browser strategy (Browserless / Cloudflare Browser Rendering /
// Playwright on a worker) to retrieve the actual page HTML. Out of scope for
// this PR — the fetch wrapper now returns a friendly error on 403.

const PARSERS: Parser[] = [linktreeParser, linkinBioParser, stanParser];

export type ParseSourceResult = {
  parser: string;
  links: ImportedLink[];
};

function selectParser(sourceUrl: string): Parser {
  for (const parser of PARSERS) {
    if (parser.matches(sourceUrl)) return parser;
  }
  return genericParser;
}

/**
 * Parse a public profile/link-in-bio URL into a list of importable links.
 *
 * Behaviour:
 *  - Platform-specific parsers run first (Linktree, Linkin.bio, Stan.store).
 *  - The generic anchor+JSON-LD extractor runs as a fallback. JSON-LD is only
 *    used when anchor extraction returns zero.
 *  - HTTP-level errors (timeout / 403 / wrong content-type / cross-domain
 *    redirect) raise `ImportError` with a user-facing message.
 */
export async function parseSource(sourceUrl: string): Promise<ParseSourceResult> {
  const parser = selectParser(sourceUrl);

  if (parser.fetchesItsOwnData) {
    const links = await parser.parse({ html: '', sourceUrl });
    return { parser: parser.name, links };
  }

  const { body } = await fetchSource(sourceUrl);
  const links = await parser.parse({ html: body, sourceUrl });
  return { parser: parser.name, links };
}

export type { ImportedLink, Parser } from './types';
export { ImportError } from './types';
export { isBlockedUrl, MAX_IMPORT_LINKS } from './utils';
