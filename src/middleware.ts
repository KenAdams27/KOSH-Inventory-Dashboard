
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // This middleware is currently disabled and performs no actions.
  // It simply passes the request through.
  return NextResponse.next();
}

export const config = {
  // Match all routes except for static files and internal Next.js paths
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
