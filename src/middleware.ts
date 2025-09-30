
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware protects dashboard routes from unauthenticated access.
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');

  // If the user is trying to access the dashboard without a session, redirect to login
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If the user has a session and is trying to access the login page, redirect to dashboard
  if (sessionCookie && (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/forgot-password')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all dashboard routes, but also the root and auth pages to handle redirection for logged-in users.
  matcher: ['/dashboard/:path*', '/', '/signup', '/forgot-password', '/reset-password'],
};
