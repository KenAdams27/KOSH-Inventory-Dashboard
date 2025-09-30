
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware protects dashboard routes from unauthenticated access.
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password';
  const isDashboardPage = pathname.startsWith('/dashboard');

  // If user has no session cookie and is trying to access a protected dashboard page
  if (!sessionCookie && isDashboardPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user has a session cookie and is trying to access an auth page
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all dashboard routes, and all auth-related pages.
  matcher: ['/dashboard/:path*', '/', '/signup', '/forgot-password', '/reset-password'],
};
