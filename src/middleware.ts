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

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next internals + API auth callbacks (handled separately) so the
    // middleware never wraps RSC payload requests for those.
    '/((?!_next/static|_next/image|api/auth).*)',
  ],
};
