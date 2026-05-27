import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getAppHost, isAppHost, resolveSlugForHost } from '@/lib/page-domains';

const SESSION_COOKIES = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
  'better-auth-session_token',
  '__Secure-better-auth-session_token',
];

function hasSessionCookie(request: NextRequest) {
  return SESSION_COOKIES.some((c) => request.cookies.has(c));
}

const PUBLIC_PASSTHROUGH_PREFIXES = [
  '/api/',
  '/_next/',
  '/favicon',
  '/robots',
  '/sitemap',
  '/login',
];

function shouldPassThrough(pathname: string): boolean {
  return PUBLIC_PASSTHROUGH_PREFIXES.some((p) => pathname.startsWith(p));
}

function alreadyRewritten(request: NextRequest): boolean {
  return request.headers.has('x-karte-domain-slug');
}

// Reserved top-level path segments. Anything else with a single segment is
// treated as a profile slug (e.g. /sarthak, /mike). Used to identify
// cacheable profile paths.
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

function isCacheableProfilePath(pathname: string): boolean {
  if (pathname === '/') return false;
  const first = pathname.split('/')[1];
  if (!first || RESERVED_FIRST_SEGMENTS.has(first)) return false;
  // Cache only the profile root, not /[slug]/encyclopedia|newspaper|roast|vcard
  // since those have owner-dependent rendering or different content.
  const segments = pathname.split('/').filter(Boolean);
  return segments.length === 1;
}

export async function middleware(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').split(',')[0]?.trim() ?? '';
  const appHost = getAppHost();
  const onAppHost = isAppHost(host, appHost);

  // Custom-domain host routing — runs before auth so dashboard is unreachable
  // from a custom domain.
  if (
    !onAppHost &&
    !shouldPassThrough(request.nextUrl.pathname) &&
    !alreadyRewritten(request)
  ) {
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      return new NextResponse('Not found', { status: 404 });
    }

    const slug = await resolveSlugForHost(host);
    if (!slug) {
      return new NextResponse('This domain is not connected to a published page.', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    const url = request.nextUrl.clone();
    const rest = url.pathname === '/' ? '' : url.pathname;
    url.pathname = `/${slug}${rest}`;
    const res = NextResponse.rewrite(url);
    res.headers.set('x-karte-domain-slug', slug);
    return res;
  }

  if (request.nextUrl.pathname.startsWith('/dashboard') && !hasSessionCookie(request)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const response = NextResponse.next();

  // Edge-cache profile pages so repeat visits hit CF's CDN, not the worker.
  // 60s fresh + 5 min stale-while-revalidate keeps content close to current
  // while protecting the worker from traffic spikes. Skip caching when:
  //   - The visitor is signed in (might see owner-only chrome eventually)
  //   - The URL has a chat-invite room id (per-room content)
  //   - The URL has a variant flag (preview rendering)
  if (
    request.method === 'GET' &&
    isCacheableProfilePath(request.nextUrl.pathname) &&
    !hasSessionCookie(request) &&
    !request.nextUrl.searchParams.has('room') &&
    !request.nextUrl.searchParams.has('variant')
  ) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300',
    );
    // Also set CDN-Cache-Control for Cloudflare specifically — it respects
    // this even when Cache-Control might be overridden downstream.
    response.headers.set(
      'CDN-Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300',
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next internals + API auth callbacks (handled separately) so the
    // middleware never wraps RSC payload requests for those.
    '/((?!_next/static|_next/image|api/auth).*)',
  ],
};
