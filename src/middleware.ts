
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  const isLoggedIn = !!sessionCookie;

  // Pages accessible only to unauthenticated users
  const authRoutes = ['/', '/signup', '/forgot-password', '/reset-password'];
  
  // If user is logged in, and tries to access an auth route, redirect to dashboard
  if (isLoggedIn && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is NOT logged in and tries to access a protected dashboard route, redirect to login
  if (!isLoggedIn && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except for static files and internal Next.js paths
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
