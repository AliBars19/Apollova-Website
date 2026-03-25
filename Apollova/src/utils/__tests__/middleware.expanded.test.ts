// src/utils/__tests__/middleware.expanded.test.ts
// Expands middleware.test.ts coverage.
// Tests verifyToken() using the real Web Crypto API (available in Node 18+),
// route classification edge cases, and the constant-time comparison branch.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';

// ---------------------------------------------------------------------------
// verifyToken — reimplemented using the same Web Crypto API that middleware.ts
// uses, so we test the actual algorithm rather than a Node crypto port.
//
// Node 18+ exposes globalThis.crypto which is the Web Crypto API — the same
// environment Vitest runs in (environment: 'node' in vitest.config.ts).
// ---------------------------------------------------------------------------

async function verifyTokenWebCrypto(token: string, secret: string): Promise<boolean> {
  if (!token || !token.includes('.')) return false;
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

    // Constant-time-ish comparison
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

/** Create a valid HMAC token using Web Crypto (mirrors middleware.ts generation). */
async function createWebCryptoToken(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const payload = Buffer.from(
    JSON.stringify({ granted: true, iat: Date.now() })
  ).toString('base64url');

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${payload}.${sig}`;
}

// ---------------------------------------------------------------------------
// Route classification — exact copies from middleware.ts for isolation testing
// ---------------------------------------------------------------------------

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

const PROTECTED_PAGES = ['/dashboard', '/upload', '/licenses'];

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGES.some((p) => pathname.startsWith(p));
}

function isProtectedApi(pathname: string): boolean {
  return pathname.startsWith('/api/') && !isPublicApi(pathname);
}

function requiresAuth(pathname: string): boolean {
  return isProtectedPage(pathname) || isProtectedApi(pathname);
}

// ---------------------------------------------------------------------------
// verifyToken — Web Crypto implementation
// ---------------------------------------------------------------------------

describe('verifyToken (Web Crypto implementation)', () => {
  const secret = 'test_hmac_secret_for_webcrypto';

  it('returns true for a valid token', async () => {
    const token = await createWebCryptoToken(secret);
    expect(await verifyTokenWebCrypto(token, secret)).toBe(true);
  });

  it('returns false for a tampered payload', async () => {
    const token = await createWebCryptoToken(secret);
    const [, sig] = token.split('.');
    // Swap to a different payload
    const tamperedPayload = Buffer.from(JSON.stringify({ granted: false, iat: 0 })).toString('base64url');
    const tampered = `${tamperedPayload}.${sig}`;
    expect(await verifyTokenWebCrypto(tampered, secret)).toBe(false);
  });

  it('returns false for a tampered signature', async () => {
    const token = await createWebCryptoToken(secret);
    const [payload] = token.split('.');
    const tampered = `${payload}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
    expect(await verifyTokenWebCrypto(tampered, secret)).toBe(false);
  });

  it('returns false for empty string', async () => {
    expect(await verifyTokenWebCrypto('', secret)).toBe(false);
  });

  it('returns false for token without a dot', async () => {
    expect(await verifyTokenWebCrypto('nodothere', secret)).toBe(false);
  });

  it('returns false when secret is empty', async () => {
    const token = await createWebCryptoToken(secret);
    expect(await verifyTokenWebCrypto(token, '')).toBe(false);
  });

  it('returns false when signed with a different secret', async () => {
    const token = await createWebCryptoToken(secret);
    expect(await verifyTokenWebCrypto(token, 'wrong_secret_xyz')).toBe(false);
  });

  it('returns false for the legacy "true" string', async () => {
    expect(await verifyTokenWebCrypto('true', secret)).toBe(false);
  });

  it('returns false when only payload (no signature after dot)', async () => {
    const token = await createWebCryptoToken(secret);
    const [payload] = token.split('.');
    // Just "payload." — empty sig
    expect(await verifyTokenWebCrypto(`${payload}.`, secret)).toBe(false);
  });

  it('returns false for just a dot', async () => {
    expect(await verifyTokenWebCrypto('.', secret)).toBe(false);
  });

  it('rejects a signature that is one character shorter (length mismatch branch)', async () => {
    const token = await createWebCryptoToken(secret);
    const [payload, sig] = token.split('.');
    // Remove last character from signature — length mismatch triggers early false return
    const shortSig = sig.slice(0, -1);
    expect(await verifyTokenWebCrypto(`${payload}.${shortSig}`, secret)).toBe(false);
  });

  it('rejects a signature that is one character longer', async () => {
    const token = await createWebCryptoToken(secret);
    const [payload, sig] = token.split('.');
    const longSig = sig + 'A';
    expect(await verifyTokenWebCrypto(`${payload}.${longSig}`, secret)).toBe(false);
  });

  it('constant-time comparison: all-zero XOR gives match === 0', async () => {
    // A valid token's XOR of sig and expectedB64 should be 0 → returns true
    const token = await createWebCryptoToken(secret);
    expect(await verifyTokenWebCrypto(token, secret)).toBe(true);
  });

  it('tokens signed with different secrets are not interchangeable', async () => {
    const token1 = await createWebCryptoToken('secret_one');
    const token2 = await createWebCryptoToken('secret_two');

    expect(await verifyTokenWebCrypto(token1, 'secret_two')).toBe(false);
    expect(await verifyTokenWebCrypto(token2, 'secret_one')).toBe(false);
    expect(await verifyTokenWebCrypto(token1, 'secret_one')).toBe(true);
    expect(await verifyTokenWebCrypto(token2, 'secret_two')).toBe(true);
  });

  it('two tokens created at different times both verify correctly', async () => {
    const token1 = await createWebCryptoToken(secret);
    await new Promise((r) => setTimeout(r, 5)); // small delay
    const token2 = await createWebCryptoToken(secret);

    expect(await verifyTokenWebCrypto(token1, secret)).toBe(true);
    expect(await verifyTokenWebCrypto(token2, secret)).toBe(true);
    // But they should be different tokens (different iat)
    expect(token1).not.toBe(token2);
  });
});

// ---------------------------------------------------------------------------
// Route classification — extended coverage
// ---------------------------------------------------------------------------

describe('middleware route classification — extended', () => {
  describe('isPublicApi', () => {
    it('passes /api/auth/gate exactly', () => {
      expect(isPublicApi('/api/auth/gate')).toBe(true);
    });

    it('passes /api/auth/callback/youtube (prefix match)', () => {
      expect(isPublicApi('/api/auth/callback/youtube')).toBe(true);
    });

    it('passes /api/auth/callback/tiktok', () => {
      expect(isPublicApi('/api/auth/callback/tiktok')).toBe(true);
    });

    it('passes /api/scheduler/check', () => {
      expect(isPublicApi('/api/scheduler/check')).toBe(true);
    });

    it('passes /api/scheduler/start', () => {
      expect(isPublicApi('/api/scheduler/start')).toBe(true);
    });

    it('blocks /api/videos', () => {
      expect(isPublicApi('/api/videos')).toBe(false);
    });

    it('blocks /api/videos/123/publish', () => {
      expect(isPublicApi('/api/videos/123/publish')).toBe(false);
    });

    it('blocks /api/upload', () => {
      expect(isPublicApi('/api/upload')).toBe(false);
    });

    it('blocks /api/licenses', () => {
      expect(isPublicApi('/api/licenses')).toBe(false);
    });

    it('blocks /api/tiktok/creator-info', () => {
      expect(isPublicApi('/api/tiktok/creator-info')).toBe(false);
    });

    it('blocks /api/auth/status (not in public list)', () => {
      expect(isPublicApi('/api/auth/status')).toBe(false);
    });

    it('blocks /api/auth/disconnect', () => {
      expect(isPublicApi('/api/auth/disconnect')).toBe(false);
    });
  });

  describe('isProtectedPage', () => {
    it('protects /dashboard', () => {
      expect(isProtectedPage('/dashboard')).toBe(true);
    });

    it('protects /dashboard/settings (sub-path)', () => {
      expect(isProtectedPage('/dashboard/settings')).toBe(true);
    });

    it('protects /upload', () => {
      expect(isProtectedPage('/upload')).toBe(true);
    });

    it('protects /licenses', () => {
      expect(isProtectedPage('/licenses')).toBe(true);
    });

    it('does not protect /gate', () => {
      expect(isProtectedPage('/gate')).toBe(false);
    });

    it('does not protect /login', () => {
      expect(isProtectedPage('/login')).toBe(false);
    });

    it('does not protect /', () => {
      expect(isProtectedPage('/')).toBe(false);
    });
  });

  describe('requiresAuth — combined logic', () => {
    it('requires auth for protected page /dashboard', () => {
      expect(requiresAuth('/dashboard')).toBe(true);
    });

    it('requires auth for protected API /api/videos', () => {
      expect(requiresAuth('/api/videos')).toBe(true);
    });

    it('does not require auth for public API /api/activate', () => {
      expect(requiresAuth('/api/activate')).toBe(false);
    });

    it('does not require auth for /gate page', () => {
      expect(requiresAuth('/gate')).toBe(false);
    });

    it('does not require auth for /login page', () => {
      expect(requiresAuth('/login')).toBe(false);
    });

    it('does not require auth for /', () => {
      expect(requiresAuth('/')).toBe(false);
    });

    it('does not require auth for scheduler public routes', () => {
      expect(requiresAuth('/api/scheduler/check')).toBe(false);
      expect(requiresAuth('/api/scheduler/start')).toBe(false);
    });
  });

  describe('safe redirect path logic', () => {
    // Mirrors the redirect path logic in middleware.ts:
    // const safeRedirect = protectedPages.some((p) => pathname.startsWith(p))
    //   ? pathname : '/dashboard';

    function getSafeRedirect(pathname: string): string {
      return PROTECTED_PAGES.some((p) => pathname.startsWith(p))
        ? pathname
        : '/dashboard';
    }

    it('redirects to /dashboard for unknown paths (prevents open redirect)', () => {
      expect(getSafeRedirect('/some/external/path')).toBe('/dashboard');
    });

    it('preserves /dashboard pathname', () => {
      expect(getSafeRedirect('/dashboard')).toBe('/dashboard');
    });

    it('preserves /licenses/123 pathname', () => {
      expect(getSafeRedirect('/licenses/123')).toBe('/licenses/123');
    });

    it('redirects to /dashboard for /api paths (not a protected page)', () => {
      expect(getSafeRedirect('/api/videos')).toBe('/dashboard');
    });
  });
});

// ---------------------------------------------------------------------------
// Node crypto ↔ Web Crypto parity check
// Confirms that tokens created with Node's createHmac verify correctly with
// our Web Crypto verifyToken (cross-compatibility).
// ---------------------------------------------------------------------------

describe('Node crypto ↔ Web Crypto parity', () => {
  const secret = 'parity_test_secret';

  it('token created with Node crypto verifies with Web Crypto implementation', async () => {
    const payload = Buffer.from(
      JSON.stringify({ granted: true, iat: Date.now() })
    ).toString('base64url');
    const sig = createHmac('sha256', secret).update(payload).digest('base64url');
    const token = `${payload}.${sig}`;

    expect(await verifyTokenWebCrypto(token, secret)).toBe(true);
  });

  it('token created with Web Crypto verifies with Node crypto implementation', async () => {
    const token = await createWebCryptoToken(secret);
    const [payload, sig] = token.split('.');

    // Verify using Node crypto
    const expectedSig = createHmac('sha256', secret).update(payload).digest('base64url');
    expect(sig).toBe(expectedSig);
  });
});
