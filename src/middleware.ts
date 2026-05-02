import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

function hasSessionCookie(request: NextRequest) {
  return (
    request.cookies.has('better-auth.session_token') ||
    request.cookies.has('__Secure-better-auth.session_token') ||
    request.cookies.has('better-auth-session_token') ||
    request.cookies.has('__Secure-better-auth-session_token')
  );
}

export async function middleware(request: NextRequest) {
  if (!hasSessionCookie(request)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
