import { strict as assert } from 'node:assert';
import { test } from 'vitest';

// Re-implementation mirror of pure helpers from src/lib/scraper.ts. Kept
// identical so this test runs without a TS compile step. If src/lib/scraper.ts
// changes, mirror here.

function isBlockedUrl(urlStr) {
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
      if (a === 127) return true;
      if (a === 10) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 169 && b === 254) return true;
      if (a === 0) return true;
    }

    if (
      lower === '[::1]' ||
      lower.startsWith('[fe80:') ||
      lower.startsWith('[fc') ||
      lower.startsWith('[fd')
    )
      return true;

    return false;
  } catch {
    return true;
  }
}

function decodeEntities(text) {
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

function extractDomain(url) {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    return new URL(fullUrl).hostname;
  } catch {
    return url;
  }
}

function hasUsefulContent(page) {
  const content =
    `${page.title} ${page.description} ${page.content}`.toLowerCase();
  const isShell =
    content.includes('enable javascript') ||
    content.includes('just a moment') ||
    content.includes('sign in') ||
    content.includes('log in') ||
    content.includes('abs.twimg.com') ||
    content.includes('responsive-web/client-web');
  if (isShell) return false;
  return page.content.length > 220;
}

test('isBlockedUrl blocks loopback IPv4', () => {
  assert.equal(isBlockedUrl('http://127.0.0.1/whoami'), true);
  assert.equal(isBlockedUrl('http://127.0.0.55:8080'), true);
});

test('isBlockedUrl blocks RFC1918 ranges', () => {
  assert.equal(isBlockedUrl('http://10.0.0.5'), true);
  assert.equal(isBlockedUrl('http://172.16.0.1'), true);
  assert.equal(isBlockedUrl('http://172.31.255.255'), true);
  assert.equal(isBlockedUrl('http://192.168.1.1'), true);
});

test('isBlockedUrl allows public IPv4 (rare but pinpointed)', () => {
  assert.equal(isBlockedUrl('http://172.32.0.1'), false);
  assert.equal(isBlockedUrl('http://8.8.8.8'), false);
});

test('isBlockedUrl blocks link-local and metadata-ish hostnames', () => {
  assert.equal(isBlockedUrl('http://169.254.169.254'), true);
  assert.equal(isBlockedUrl('http://metadata.google.internal'), true);
  assert.equal(isBlockedUrl('http://my.internal.host'), true);
});

test('isBlockedUrl blocks IPv6 loopback + link-local', () => {
  assert.equal(isBlockedUrl('http://[::1]/'), true);
  assert.equal(isBlockedUrl('http://[fe80::1]/'), true);
  assert.equal(isBlockedUrl('http://[fc00::1]/'), true);
});

test('isBlockedUrl blocks localhost variants', () => {
  assert.equal(isBlockedUrl('http://localhost:3000'), true);
  assert.equal(isBlockedUrl('http://app.local/'), true);
  assert.equal(isBlockedUrl('http://thing.internal/'), true);
});

test('isBlockedUrl rejects malformed URLs', () => {
  assert.equal(isBlockedUrl('not a url'), true);
  assert.equal(isBlockedUrl(''), true);
});

test('isBlockedUrl allows ordinary public hosts', () => {
  assert.equal(isBlockedUrl('https://example.com/'), false);
  assert.equal(isBlockedUrl('https://github.com/foo/bar'), false);
});

test('decodeEntities handles named and numeric entities', () => {
  assert.equal(decodeEntities('Tom &amp; Jerry'), 'Tom & Jerry');
  assert.equal(decodeEntities('5 &lt; 10'), '5 < 10');
  assert.equal(decodeEntities('&#39;quoted&#39;'), "'quoted'");
  assert.equal(decodeEntities('hello&nbsp;world'), 'hello world');
  assert.equal(decodeEntities('&#65;&#66;'), 'AB');
});

test('decodeEntities leaves unknown entities alone', () => {
  assert.equal(decodeEntities('keep &foo; intact'), 'keep &foo; intact');
});

test('extractDomain accepts full and bare URLs', () => {
  assert.equal(extractDomain('https://github.com/foo'), 'github.com');
  assert.equal(extractDomain('github.com/foo'), 'github.com');
  assert.equal(extractDomain('not-a-url'), 'not-a-url');
});

test('hasUsefulContent rejects login-wall + JS-required shells', () => {
  assert.equal(
    hasUsefulContent({
      title: 'Sign in',
      description: '',
      content: 'Sign in to continue',
    }),
    false,
  );
  assert.equal(
    hasUsefulContent({
      title: 'JS required',
      description: '',
      content: 'Please enable JavaScript',
    }),
    false,
  );
  assert.equal(
    hasUsefulContent({
      title: 'Just a moment...',
      description: '',
      content: 'cf challenge',
    }),
    false,
  );
});

test('hasUsefulContent requires >220 chars of body text', () => {
  const short = { title: 'Page', description: '', content: 'short body' };
  assert.equal(hasUsefulContent(short), false);
  const long = {
    title: 'Page',
    description: '',
    content: 'a'.repeat(221),
  };
  assert.equal(hasUsefulContent(long), true);
});
