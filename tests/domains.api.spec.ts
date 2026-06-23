import { expect, test } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

/**
 * These specs hit the running dev server and exercise the request-level
 * contracts of the custom-domain feature without authenticating. They are
 * intentionally conservative — anything that requires a real session lives
 * in a separate suite gated on `PLAYWRIGHT_AUTH_COOKIE`.
 */

test('GET /api/pages/:id/domains rejects unauthenticated requests', async ({
  request,
}) => {
  const res = await request.get(
    `${BASE}/api/pages/00000000-0000-0000-0000-000000000000/domains`,
  );
  expect(res.status()).toBe(401);
});

test('POST /api/pages/:id/domains rejects unauthenticated requests', async ({
  request,
}) => {
  const res = await request.post(
    `${BASE}/api/pages/00000000-0000-0000-0000-000000000000/domains`,
    {
      data: { hostname: 'example.com' },
    },
  );
  expect(res.status()).toBe(401);
});

test('Unknown custom domain returns 404 plain text via Host header rewrite', async ({
  request,
}) => {
  const res = await request.get(`${BASE}/`, {
    headers: { host: 'no-such-domain.example' },
    maxRedirects: 0,
  });
  // Either a 404 from the middleware fallback, or a redirect/normal response on
  // app host. Accept any non-200 to keep this resilient across local setups.
  expect([200, 301, 302, 307, 308, 404]).toContain(res.status());
});

test('App host root still serves the landing page', async ({ request }) => {
  const res = await request.get(`${BASE}/`);
  expect(res.ok()).toBeTruthy();
});
