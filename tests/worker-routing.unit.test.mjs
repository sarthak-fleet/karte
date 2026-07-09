import assert from 'node:assert/strict';
import { test } from 'vitest';

import {
  addProfileCacheHeaders,
  isAppHost,
  normalizeHostname,
  routeBeforeOpenNext,
} from '../worker-routing.mjs';

const env = { NEXT_PUBLIC_APP_URL: 'https://karte.cc' };

test('normalizes valid hostnames and rejects malformed hostnames', () => {
  assert.equal(normalizeHostname('https://www.Example.com/'), 'example.com');
  assert.equal(normalizeHostname('bad/host'), null);
  assert.equal(normalizeHostname('localhost:3000'), null);
});

test('recognizes app hosts without treating custom domains as app hosts', () => {
  assert.equal(isAppHost('karte.cc', 'karte.cc'), true);
  assert.equal(isAppHost('www.karte.cc', 'karte.cc'), true);
  assert.equal(isAppHost('linkchat.sarthakagrawal927.workers.dev', null), true);
  assert.equal(isAppHost('creator.example.com', 'karte.cc'), false);
});

test('redirects unauthenticated dashboard requests before OpenNext', async () => {
  const { response } = await routeBeforeOpenNext(
    new Request('https://karte.cc/dashboard', {
      headers: { host: 'karte.cc' },
    }),
    env,
  );

  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'https://karte.cc/login');
});

test('marks profile roots cacheable but not variant previews', async () => {
  const routed = await routeBeforeOpenNext(
    new Request('https://karte.cc/sarthak', { headers: { host: 'karte.cc' } }),
    env,
  );
  const variant = await routeBeforeOpenNext(
    new Request('https://karte.cc/sarthak?variant=hero', {
      headers: { host: 'karte.cc' },
    }),
    env,
  );

  assert.equal(routed.cacheProfile, true);
  assert.equal(variant.cacheProfile, false);
});

test('adds Cloudflare profile cache headers to proxied responses', () => {
  const response = addProfileCacheHeaders(new Response('ok'));

  assert.equal(
    response.headers.get('cache-control'),
    'public, s-maxage=60, stale-while-revalidate=300',
  );
  assert.equal(
    response.headers.get('cdn-cache-control'),
    'public, s-maxage=60, stale-while-revalidate=300',
  );
});

test('returns plain 404 for unknown custom domains', async () => {
  const { response } = await routeBeforeOpenNext(
    new Request('https://creator.example.com/', {
      headers: { host: 'creator.example.com' },
    }),
    env,
  );

  assert.equal(response.status, 404);
  assert.match(await response.text(), /not connected/i);
});
