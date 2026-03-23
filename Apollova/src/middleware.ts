// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// API routes that do NOT require the site_access cookie.
const PUBLIC_API_PREFIXES = [
  '/api/auth/gate',
  '/api/auth/youtube/authorise',
  '/api/auth/tiktok/authorise',
  '/api/auth/callback/',
  '/api/activate',
  '/api/verify',
  '/api/scheduler/',
];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Verify HMAC-signed session token using Web Crypto API (Edge-compatible).
 * Token format: "base64url_payload.base64url_signature"
 */
async function verifyToken(token: string): Promise<boolean> {
  if (!token || !token.includes('.')) return false;

  const secret = process.env.SITE_PASSWORD;
  if (!secret) return false;

  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(expectedSig)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // Constant-time-ish comparison (equal length strings)
    if (sig.length !== expectedB64.length) return false;
    let match = 0;
    for (let i = 0; i < sig.length; i++) {
      match |= sig.charCodeAt(i) ^ expectedB64.charCodeAt(i);
    }
    return match === 0;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected page routes
  const protectedPages = ['/dashboard', '/upload', '/licenses'];
  const isProtectedPage = protectedPages.some((p) => pathname.startsWith(p));

  // Protected API routes
  const isProtectedApi = pathname.startsWith('/api/') && !isPublicApi(pathname);

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  // Allow internal server-to-server calls (e.g. scheduler → publish endpoint)
  const internalSecret = request.headers.get('x-internal-secret');
  if (internalSecret && internalSecret === process.env.SITE_PASSWORD) {
    return NextResponse.next();
  }

  // Check session token
  const cookie = request.cookies.get('site_access');
  const tokenValue = cookie?.value || '';

  // Support both new signed tokens and legacy "true" during transition
  const hasAccess = tokenValue === 'true' || await verifyToken(tokenValue);

  if (!hasAccess) {
    if (isProtectedApi) {
      return NextResponse.json(
        { error: 'Unauthorized — please log in via /gate' },
        { status: 401 }
      );
    }

    const response = NextResponse.redirect(new URL('/gate', request.url));
    // Only allow redirect back to known protected paths (prevent open redirect)
    const safeRedirect = protectedPages.some((p) => pathname.startsWith(p))
      ? pathname
      : '/dashboard';
    response.cookies.set('redirect_after_gate', safeRedirect, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 5,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/upload/:path*', '/licenses/:path*', '/api/:path*'],
};
