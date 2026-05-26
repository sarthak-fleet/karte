const DEFAULT_MAX_URLS = 10;
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_CONTENT_LENGTH = 500;

export type ScrapeOptions = {
  maxUrls?: number;
  timeoutMs?: number;
  maxContentLength?: number;
  useReaderFallback?: boolean;
};

function isBlockedUrl(urlStr: string): boolean {
  try {
    const { hostname } = new URL(urlStr);
    const lower = hostname.toLowerCase();

    if (lower === 'localhost' || lower.endsWith('.local') || lower.endsWith('.internal'))
      return true;
    if (lower.includes('metadata') || lower.includes('internal'))
      return true;

    // Check if hostname is an IP address
    const ipv4 = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) {
      const [, a, b] = ipv4.map(Number);
      if (a === 127) return true;                          // 127.0.0.0/8
      if (a === 10) return true;                           // 10.0.0.0/8
      if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
      if (a === 192 && b === 168) return true;             // 192.168.0.0/16
      if (a === 169 && b === 254) return true;             // 169.254.0.0/16
      if (a === 0) return true;                            // 0.0.0.0/8
    }

    // IPv6 loopback / link-local
    if (lower === '[::1]' || lower.startsWith('[fe80:') || lower.startsWith('[fc') || lower.startsWith('[fd'))
      return true;

    return false;
  } catch {
    return true;
  }
}

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
export async function scrapeUrls(
  urls: string[],
  options: ScrapeOptions = {},
): Promise<ScrapedPage[]> {
  const unique = [...new Set(urls.filter(Boolean))].slice(
    0,
    options.maxUrls ?? DEFAULT_MAX_URLS,
  );
  if (unique.length === 0) return [];

  const results = await Promise.allSettled(
    unique.map((url) => scrapeSingleUrl(url, options))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<ScrapedPage | null> =>
        r.status === 'fulfilled' && r.value !== null
    )
    .map((r) => r.value!);
}

async function scrapeSingleUrl(
  url: string,
  options: ScrapeOptions,
): Promise<ScrapedPage | null> {
  try {
    // Ensure the URL has a protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    if (isBlockedUrl(fullUrl)) return null;

    const html = await fetchText(fullUrl, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const extracted = html ? pageFromHtml(url, html, options.maxContentLength) : null;
    if (extracted && hasUsefulContent(extracted)) return extracted;

    if (options.useReaderFallback) {
      const readerText = await fetchReaderText(fullUrl, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      if (readerText) {
        return pageFromReader(url, readerText, options.maxContentLength);
      }
    }

    return extracted;
  } catch {
    // Timeout, network error, etc. — skip silently
    return null;
  }
}

async function fetchText(url: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; KarteBot/1.0; +https://karte.cc)',
        Accept: 'text/html,application/xhtml+xml,text/plain',
      },
      redirect: 'follow',
    });

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return null;
    }

    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchReaderText(url: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const readerUrl = `https://r.jina.ai/http://r.jina.ai/http://${url}`;

  try {
    const res = await fetch(readerUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; KarteBot/1.0; +https://karte.cc)',
        Accept: 'text/plain,text/markdown',
      },
      redirect: 'follow',
    });

    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function pageFromHtml(
  url: string,
  html: string,
  maxContentLength = DEFAULT_MAX_CONTENT_LENGTH,
): ScrapedPage {
  return {
    url,
    title: extractTitle(html),
    description: extractMetaDescription(html),
    content: extractBodyText(html).slice(0, maxContentLength),
  };
}

function pageFromReader(
  url: string,
  text: string,
  maxContentLength = DEFAULT_MAX_CONTENT_LENGTH,
): ScrapedPage {
  const titleMatch = text.match(/^Title:\s*(.+)$/im);
  const descriptionMatch = text.match(/^Description:\s*(.+)$/im);
  const cleaned = text
    .replace(/^Title:\s*.+$/gim, ' ')
    .replace(/^URL Source:\s*.+$/gim, ' ')
    .replace(/^Markdown Content:\s*/gim, ' ')
    .replace(/^Description:\s*.+$/gim, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    url,
    title: titleMatch?.[1]?.trim() ?? '',
    description: descriptionMatch?.[1]?.trim() ?? '',
    content: cleaned.slice(0, maxContentLength),
  };
}

function hasUsefulContent(page: ScrapedPage): boolean {
  const content = `${page.title} ${page.description} ${page.content}`.toLowerCase();
  const isShell = (
    content.includes('enable javascript') ||
    content.includes('just a moment') ||
    content.includes('sign in') ||
    content.includes('log in') ||
    content.includes('abs.twimg.com') ||
    content.includes('responsive-web/client-web')
  );
  if (isShell) return false;
  return page.content.length > 220;
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
