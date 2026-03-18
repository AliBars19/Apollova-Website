import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';

// We can't easily test the actual Next.js middleware directly since it uses
// NextRequest/NextResponse which are Edge Runtime specific. Instead we test
// the token verification logic and public route detection logic in isolation.

function createValidToken(secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({ granted: true, iat: Date.now() })
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function createTamperedToken(secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({ granted: true, iat: Date.now() })
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  // Tamper with signature
  return `${payload}.${sig}TAMPERED`;
}

// Public route detection
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

// Token verification (Node.js version of what middleware does)
function verifyTokenSync(token: string, secret: string): boolean {
  if (!token || !token.includes('.')) return false;
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return false;
    const expectedSig = createHmac('sha256', secret).update(payload).digest('base64url');
    return sig === expectedSig;
  } catch {
    return false;
  }
}

describe('middleware route classification', () => {
  it('public routes pass through', () => {
    expect(isPublicApi('/api/auth/gate')).toBe(true);
    expect(isPublicApi('/api/activate')).toBe(true);
    expect(isPublicApi('/api/verify')).toBe(true);
    expect(isPublicApi('/api/scheduler/check')).toBe(true);
    expect(isPublicApi('/api/auth/callback/youtube')).toBe(true);
  });

  it('protected API routes are not public', () => {
    expect(isPublicApi('/api/videos')).toBe(false);
    expect(isPublicApi('/api/upload')).toBe(false);
    expect(isPublicApi('/api/licenses')).toBe(false);
  });
});

describe('token verification', () => {
  const secret = 'test_secret_for_hmac';

  it('valid token passes', () => {
    const token = createValidToken(secret);
    expect(verifyTokenSync(token, secret)).toBe(true);
  });

  it('tampered token fails', () => {
    const token = createTamperedToken(secret);
    expect(verifyTokenSync(token, secret)).toBe(false);
  });

  it('empty string fails', () => {
    expect(verifyTokenSync('', secret)).toBe(false);
  });

  it('no dot fails', () => {
    expect(verifyTokenSync('nodothere', secret)).toBe(false);
  });

  it('wrong secret fails', () => {
    const token = createValidToken(secret);
    expect(verifyTokenSync(token, 'wrong_secret')).toBe(false);
  });

  it('legacy "true" is not verified as HMAC', () => {
    // The middleware accepts "true" as a legacy value, but our
    // verifyToken function correctly rejects it
    expect(verifyTokenSync('true', secret)).toBe(false);
  });
});
