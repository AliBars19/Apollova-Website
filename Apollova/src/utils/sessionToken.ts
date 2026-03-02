// src/utils/sessionToken.ts
// HMAC-signed session tokens to replace the forgeable "true" cookie value.
// Uses SITE_PASSWORD as the signing key so no extra env var is needed.

import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'site_access';

function getSecret(): string {
  const secret = process.env.SITE_PASSWORD;
  if (!secret) throw new Error('SITE_PASSWORD env var is required');
  return secret;
}

/**
 * Create a signed session token.
 * Format: "payload.signature" where payload = base64(JSON) and signature = HMAC-SHA256.
 */
export function createSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ granted: true, iat: Date.now() })
  ).toString('base64url');

  const sig = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

/**
 * Verify a session token. Returns true if valid.
 */
export function verifySessionToken(token: string): boolean {
  if (!token || !token.includes('.')) return false;

  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return false;

    const expectedSig = createHmac('sha256', getSecret()).update(payload).digest('base64url');

    // Timing-safe comparison
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length) return false;

    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
