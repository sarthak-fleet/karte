import { strict as assert } from 'node:assert';
import { test } from 'node:test';

// Re-implementation mirror of src/lib/hostname.ts kept identical so this test
// runs without a TS compile step. If src/lib/hostname.ts changes, mirror here.

const HOSTNAME_RE = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/;

function normalizeHostname(input) {
  if (typeof input !== 'string') return null;
  let host = input.trim().toLowerCase();
  if (!host) return null;

  if (host.startsWith('http://') || host.startsWith('https://')) {
    try {
      host = new URL(host).hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  if (host.endsWith('.')) host = host.slice(0, -1);
  if (host.startsWith('www.')) host = host.slice(4);

  if (host.includes('/') || host.includes(':')) return null;

  if (host.length > 253) return null;
  if (!HOSTNAME_RE.test(host)) return null;
  return host;
}

function isAppHost(host, appHost) {
  if (!host) return false;
  const normalized = host.toLowerCase().split(':')[0];
  if (normalized === 'localhost') return true;
  if (normalized === '127.0.0.1' || normalized === '0.0.0.0') return true;
  if (normalized.endsWith('.workers.dev')) return true;
  if (normalized.endsWith('.vercel.app')) return true;
  if (appHost) {
    const app = appHost.toLowerCase().split(':')[0];
    if (normalized === app) return true;
    const apex = app.startsWith('www.') ? app.slice(4) : app;
    if (normalized === apex || normalized === `www.${apex}`) return true;
  }
  return false;
}

function getDnsInstructions(hostname) {
  const isApex = hostname.split('.').length === 2;
  if (isApex) {
    return [
      { type: 'A', name: '@', value: '76.76.21.21' },
      { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' },
    ];
  }
  const sub = hostname.split('.').slice(0, -2).join('.') || '@';
  return [{ type: 'CNAME', name: sub, value: 'cname.vercel-dns.com' }];
}

test('normalizeHostname accepts apex domains', () => {
  assert.equal(normalizeHostname('example.com'), 'example.com');
  assert.equal(normalizeHostname('  Example.COM '), 'example.com');
});

test('normalizeHostname strips www prefix and trailing dot', () => {
  assert.equal(normalizeHostname('www.example.com'), 'example.com');
  assert.equal(normalizeHostname('example.com.'), 'example.com');
});

test('normalizeHostname extracts host from URL', () => {
  assert.equal(normalizeHostname('https://example.com/path'), 'example.com');
  assert.equal(normalizeHostname('http://sub.example.co.uk'), 'sub.example.co.uk');
});

test('normalizeHostname rejects ports, paths, and bad input', () => {
  assert.equal(normalizeHostname(''), null);
  assert.equal(normalizeHostname('   '), null);
  assert.equal(normalizeHostname('example.com:8080'), null);
  assert.equal(normalizeHostname('example.com/x'), null);
  assert.equal(normalizeHostname('not a host'), null);
  assert.equal(normalizeHostname('-leading.com'), null);
  assert.equal(normalizeHostname('a'.repeat(254) + '.com'), null);
  assert.equal(normalizeHostname(null), null);
  assert.equal(normalizeHostname(123), null);
});

test('normalizeHostname accepts subdomains', () => {
  assert.equal(normalizeHostname('blog.example.com'), 'blog.example.com');
  assert.equal(normalizeHostname('a.b.c.example.com'), 'a.b.c.example.com');
});

test('isAppHost matches localhost and platform hosts', () => {
  assert.equal(isAppHost('localhost', null), true);
  assert.equal(isAppHost('localhost:3000', null), true);
  assert.equal(isAppHost('127.0.0.1', null), true);
  assert.equal(isAppHost('linkchat.sarthakagrawal927.workers.dev', null), true);
  assert.equal(isAppHost('myapp.vercel.app', null), true);
});

test('isAppHost matches configured NEXT_PUBLIC_APP_URL apex and www', () => {
  assert.equal(isAppHost('linkchat.app', 'linkchat.app'), true);
  assert.equal(isAppHost('www.linkchat.app', 'linkchat.app'), true);
  assert.equal(isAppHost('linkchat.app', 'www.linkchat.app'), true);
});

test('isAppHost rejects unrelated custom domains', () => {
  assert.equal(isAppHost('example.com', 'linkchat.app'), false);
  assert.equal(isAppHost('', 'linkchat.app'), false);
});

test('getDnsInstructions returns A + CNAME for apex', () => {
  const recs = getDnsInstructions('example.com');
  assert.equal(recs.length, 2);
  assert.equal(recs[0].type, 'A');
  assert.equal(recs[1].type, 'CNAME');
  assert.equal(recs[1].name, 'www');
});

test('getDnsInstructions returns single CNAME for subdomain', () => {
  const recs = getDnsInstructions('blog.example.com');
  assert.equal(recs.length, 1);
  assert.equal(recs[0].type, 'CNAME');
  assert.equal(recs[0].name, 'blog');
});
