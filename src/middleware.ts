
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  const isAuthPage = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/signup') || request.nextUrl.pathname.startsWith('/forgot-password') || request.nextUrl.pathname.startsWith('/reset-password');
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');

  // If user is logged in (has session cookie)
  if (sessionCookie) {
    // and they try to access an auth page, redirect to dashboard
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } 
  // If user is not logged in (no session cookie)
  else {
    // and they try to access a dashboard page, redirect to login
    if (isDashboardPage) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirected', 'true');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/', '/dashboard/:path*', '/signup', '/forgot-password', '/reset-password'],
};
