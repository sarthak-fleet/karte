import { ImportError } from './types';
import { FETCH_TIMEOUT_MS, registrableDomain } from './utils';

const USER_AGENT = 'Mozilla/5.0 (compatible; KarteImporter/1.0)';

export type FetchSourceOptions = {
  /**
   * Skip the redirect-host guard. The guard rejects cross-registrable-domain
   * redirects (e.g. bento.me → linktr.ee). Platform parsers that intentionally
   * call third-party APIs (e.g. api-prod.linkin.bio) should pass `true`.
   */
  allowCrossDomainRedirect?: boolean;
  /** Optional override for the Accept header (e.g. JSON for APIs). */
  accept?: string;
  /** If true, do not require a `text/html` content-type. */
  allowAnyContentType?: boolean;
};

export type FetchSourceResult = {
  body: string;
  finalUrl: string;
};

export async function fetchSource(
  sourceUrl: string,
  opts: FetchSourceOptions = {},
): Promise<FetchSourceResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        Accept: opts.accept ?? 'text/html,application/xhtml+xml',
        'User-Agent': USER_AGENT,
      },
      redirect: 'follow',
    });

    if (response.status === 403) {
      throw new ImportError(
        'This page blocks automated imports. Try copying your links manually.',
        502,
      );
    }

    if (!response.ok) {
      throw new ImportError(`Import source returned ${response.status}`, 502);
    }

    if (!opts.allowCrossDomainRedirect) {
      try {
        const inputHost = new URL(sourceUrl).hostname;
        const finalHost = new URL(response.url).hostname;
        if (registrableDomain(inputHost) !== registrableDomain(finalHost)) {
          throw new ImportError(
            'This page redirects to a different domain — refusing import.',
            400,
          );
        }
      } catch (err) {
        if (err instanceof ImportError) throw err;
        // If URL parsing on response.url somehow fails, fall through.
      }
    }

    if (!opts.allowAnyContentType) {
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('text/html')) {
        throw new ImportError('Import source must be an HTML page', 400);
      }
    }

    const body = await response.text();
    return { body, finalUrl: response.url };
  } catch (err) {
    if (err instanceof ImportError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ImportError('Import source timed out', 504);
    }
    throw new ImportError(
      err instanceof Error ? err.message : 'Failed to fetch import source',
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
