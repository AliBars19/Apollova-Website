// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only protect /dashboard and /upload pages
  const protectedPaths = ['/dashboard', '/upload'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // If not a protected path, allow access
  if (!isProtectedPath) {
    return NextResponse.next();
  }
  
  // Check if user has site access cookie
  const siteAccessCookie = request.cookies.get('site_access');
  
  console.log(`[Middleware] Path: ${pathname}`);
  console.log(`[Middleware] Cookie present: ${!!siteAccessCookie}`);
  console.log(`[Middleware] Cookie value: ${siteAccessCookie?.value}`);
  
  // If no cookie or cookie value is not 'true', redirect to gate
  if (!siteAccessCookie || siteAccessCookie.value !== 'true') {
    console.log(`[Middleware] Redirecting to /gate`);
    const response = NextResponse.redirect(new URL('/gate', request.url));
    
    // Store the intended destination
    response.cookies.set('redirect_after_gate', pathname, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 5, // 5 minutes
    });
    
    return response;
  }
  
  console.log(`[Middleware] Access granted`);
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/upload/:path*'],
};
