
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');

  // If there's no session cookie and the user is trying to access a protected route
  if (!sessionCookie && request.nextUrl.pathname.startsWith('/dashboard')) {
    // Redirect them to the login page
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirected', 'true');
    return NextResponse.redirect(loginUrl);
  }
  
  // If the user is logged in and tries to access the login page, redirect to dashboard
  if (sessionCookie && (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/signup'))) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/', '/dashboard/:path*', '/signup'],
};
