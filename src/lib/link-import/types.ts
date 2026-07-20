export type ImportedLink = {
  title: string;
  url: string;
  thumbnail?: string;
};

type ParseContext = {
  /**
   * HTML body of `sourceUrl`. Some parsers ignore this and fetch their own
   * data (e.g. Linkin.bio hits a separate JSON API), in which case the
   * orchestrator may pass an empty string.
   */
  html: string;
  sourceUrl: string;
};

export type Parser = {
  /** Stable identifier used in logs / tests. */
  name: string;
  /** Does this parser claim the given URL? */
  matches: (url: string) => boolean;
  /** True when the parser fetches its own data and the orchestrator
   *  should skip the upfront HTML fetch + redirect-host guard. */
  fetchesItsOwnData?: boolean;
  /** Parse a profile page into normalized links. */
  parse: (ctx: ParseContext) => Promise<ImportedLink[]>;
};

export class ImportError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = 'ImportError';
    this.status = status;
  }
}
