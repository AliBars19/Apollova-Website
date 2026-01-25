// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SITE_PASSWORD = process.env.SITE_PASSWORD || '***Besiktas1903***'; // Change this!

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }
  
  // Check if user has entered site password
  const sitePasswordCookie = request.cookies.get('site_access');
  
  // If no site password cookie and not on password gate page, redirect to gate
  if (!sitePasswordCookie && pathname !== '/gate') {
    return NextResponse.redirect(new URL('/gate', request.url));
  }
  
  // If on gate page but already has access, redirect to home
  if (pathname === '/gate' && sitePasswordCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};