const CACHE_CONTROL =
  'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';
const PROFILE_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';

const AUTH_COOKIE_FRAGMENTS = ['session_token', 'session-token'];
const HOST_CACHE_TTL_MS = 60_000;

const PUBLIC_PASSTHROUGH_PREFIXES = [
  '/api/',
  '/_next/',
  '/favicon',
  '/robots',
  '/sitemap',
  '/login',
];

const RESERVED_FIRST_SEGMENTS = new Set([
  'api',
  '_next',
  'dashboard',
  'login',
  'create',
  'about',
  'privacy',
  'terms',
  'favicon.ico',
  'icon.svg',
  'robots.txt',
  'sitemap.xml',
  'opengraph-image',
  'manifest.webmanifest',
]);

const KARTE_APP_HOSTS = new Set(['karte.cc', 'www.karte.cc']);
const HOSTNAME_RE =
  /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/;

const hostCache = new Map();

export function hasAuthCookie(request) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return false;
  return AUTH_COOKIE_FRAGMENTS.some((fragment) => cookie.includes(fragment));
}

export function requestHost(request) {
  return (request.headers.get('host') ?? '').split(',')[0]?.trim() ?? '';
}

export function normalizeHostname(input) {
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

export function getAppHost(env) {
  const raw = env?.NEXT_PUBLIC_APP_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isAppHost(host, appHost) {
  if (!host) return false;
  const normalized = host.toLowerCase().split(':')[0];
  if (normalized === 'localhost') return true;
  if (normalized === '127.0.0.1' || normalized === '0.0.0.0') return true;
  if (normalized.endsWith('.workers.dev')) return true;
  if (normalized.endsWith('.vercel.app')) return true;
  if (KARTE_APP_HOSTS.has(normalized)) return true;
  if (appHost) {
    const app = appHost.toLowerCase().split(':')[0];
    if (normalized === app) return true;
    const apex = app.startsWith('www.') ? app.slice(4) : app;
    if (normalized === apex || normalized === `www.${apex}`) return true;
  }
  return false;
}

function shouldPassThrough(pathname) {
  return PUBLIC_PASSTHROUGH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}

function isCacheableProfilePath(pathname) {
  if (pathname === '/') return false;
  const first = pathname.split('/')[1];
  if (!first || RESERVED_FIRST_SEGMENTS.has(first)) return false;
  return pathname.split('/').filter(Boolean).length === 1;
}

export function addProfileCacheHeaders(response) {
  const next = new Response(response.body, response);
  next.headers.set('Cache-Control', PROFILE_CACHE_CONTROL);
  next.headers.set('CDN-Cache-Control', PROFILE_CACHE_CONTROL);
  return next;
}

export async function resolveSlugForHost(env, host) {
  const normalized = normalizeHostname(host);
  if (!normalized || !env?.DB) return null;

  const now = Date.now();
  const cached = hostCache.get(normalized);
  if (cached && cached.expiresAt > now) return cached.slug;

  const row = await env.DB.prepare(
    `
      SELECT pages.slug AS slug, pages.published AS published, pageDomains.status AS status
      FROM pageDomains
      INNER JOIN pages ON pages.id = pageDomains.pageId
      WHERE pageDomains.hostname = ?
      LIMIT 1
    `,
  )
    .bind(normalized)
    .first();

  const slug =
    row && row.status === 'verified' && row.published ? row.slug : null;
  hostCache.set(normalized, { slug, expiresAt: now + HOST_CACHE_TTL_MS });
  return slug;
}

export async function routeBeforeOpenNext(request, env) {
  const url = new URL(request.url);
  const host = requestHost(request);
  const onAppHost = isAppHost(host, getAppHost(env));
  const signedIn = hasAuthCookie(request);

  if (!onAppHost && !shouldPassThrough(url.pathname)) {
    if (url.pathname.startsWith('/dashboard')) {
      return { response: new Response('Not found', { status: 404 }) };
    }

    const slug = await resolveSlugForHost(env, host);
    if (!slug) {
      return {
        response: new Response(
          'This domain is not connected to a published page.',
          {
            status: 404,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
          },
        ),
      };
    }

    const rewritten = new URL(request.url);
    const rest = rewritten.pathname === '/' ? '' : rewritten.pathname;
    rewritten.pathname = `/${slug}${rest}`;
    const headers = new Headers(request.headers);
    headers.set('x-karte-domain-slug', slug);
    return {
      request: new Request(rewritten, {
        body: request.body,
        cf: request.cf,
        headers,
        method: request.method,
        redirect: request.redirect,
      }),
    };
  }

  if (url.pathname.startsWith('/dashboard') && !signedIn) {
    return { response: Response.redirect(new URL('/login', request.url), 307) };
  }

  return {
    request,
    cacheProfile:
      request.method === 'GET' &&
      isCacheableProfilePath(url.pathname) &&
      !signedIn &&
      !url.searchParams.has('room') &&
      !url.searchParams.has('variant'),
  };
}

export { CACHE_CONTROL };
