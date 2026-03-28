const MAX_URLS = 10;
const TIMEOUT_MS = 5000;
const MAX_CONTENT_LENGTH = 500;

export interface ScrapedPage {
  url: string;
  title: string;
  description: string;
  content: string;
}

/**
 * Scrape an array of URLs, extracting title, meta description, and body text.
 * Limits to 10 URLs, 5s timeout each. Failures are silently skipped.
 */
export async function scrapeUrls(urls: string[]): Promise<ScrapedPage[]> {
  const unique = [...new Set(urls.filter(Boolean))].slice(0, MAX_URLS);
  if (unique.length === 0) return [];

  const results = await Promise.allSettled(
    unique.map((url) => scrapeSingleUrl(url))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<ScrapedPage | null> =>
        r.status === 'fulfilled' && r.value !== null
    )
    .map((r) => r.value!);
}

async function scrapeSingleUrl(url: string): Promise<ScrapedPage | null> {
  try {
    // Ensure the URL has a protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(fullUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LinkChatBot/1.0; +https://linkchat.dev)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return null;
    }

    const html = await res.text();

    return {
      url,
      title: extractTitle(html),
      description: extractMetaDescription(html),
      content: extractBodyText(html).slice(0, MAX_CONTENT_LENGTH),
    };
  } catch {
    // Timeout, network error, etc. — skip silently
    return null;
  }
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1].trim()) : '';
}

function extractMetaDescription(html: string): string {
  const match = html.match(
    /<meta\s+[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([\s\S]*?)["'][^>]*\/?>/i
  );
  if (match) return decodeEntities(match[1].trim());

  // Try reversed attribute order: content before name
  const match2 = html.match(
    /<meta\s+[^>]*content\s*=\s*["']([\s\S]*?)["'][^>]*name\s*=\s*["']description["'][^>]*\/?>/i
  );
  return match2 ? decodeEntities(match2[1].trim()) : '';
}

function extractBodyText(html: string): string {
  // Remove script, style, and noscript blocks
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = decodeEntities(text);

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

function decodeEntities(text: string): string {
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

/**
 * Format scraped pages into a context string for AI prompts.
 */
export function formatScrapedContent(scraped: ScrapedPage[]): string {
  if (scraped.length === 0) return '';

  const lines = scraped.map((s) => {
    const domain = extractDomain(s.url);
    const parts = [s.title, s.description, s.content].filter(Boolean);
    const summary = parts.join(' — ').slice(0, 600);
    return `- ${domain}: "${summary}"`;
  });

  return `Scraped content from their links and projects:\n${lines.join('\n')}`;
}

function extractDomain(url: string): string {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    return new URL(fullUrl).hostname;
  } catch {
    return url;
  }
}

// ── Cache helpers ──────────────────────────────────────────────────

export interface ScrapedCache {
  data: ScrapedPage[];
  scrapedAt: number; // epoch ms
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function isCacheValid(cache: ScrapedCache | null): cache is ScrapedCache {
  if (!cache || !cache.scrapedAt || !Array.isArray(cache.data)) return false;
  return Date.now() - cache.scrapedAt < CACHE_TTL_MS;
}
