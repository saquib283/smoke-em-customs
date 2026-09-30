/**
 * Next.js 16 Proxy — Route protection & redirects.
 * Protects /admin/* routes behind authentication and handles legacy login redirects.
 * Architecture §14
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle /login and /en/login redirects
  if (pathname === '/login' || pathname === '/en/login') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Allow the login page and auth API
  if (pathname === '/admin/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Check for session token across all Auth.js and NextAuth cookie keys
  const sessionToken =
    request.cookies.get('authjs.session-token') ??
    request.cookies.get('__Secure-authjs.session-token') ??
    request.cookies.get('next-auth.session-token') ??
    request.cookies.get('__Secure-next-auth.session-token');

  if (pathname.startsWith('/admin') && !sessionToken) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/en/login'],
};
