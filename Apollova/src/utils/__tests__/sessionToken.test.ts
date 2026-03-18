import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('createSessionToken', () => {
  beforeEach(() => {
    vi.stubEnv('SITE_PASSWORD', 'test_secret_123');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns payload.signature format', async () => {
    const { createSessionToken } = await import('../sessionToken');
    const token = createSessionToken();
    expect(token).toContain('.');
    const parts = token.split('.');
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it('payload decodes to JSON with granted and iat', async () => {
    const { createSessionToken } = await import('../sessionToken');
    const token = createSessionToken();
    const [payload] = token.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    expect(decoded.granted).toBe(true);
    expect(typeof decoded.iat).toBe('number');
  });

  it('iat is near Date.now()', async () => {
    const { createSessionToken } = await import('../sessionToken');
    const before = Date.now();
    const token = createSessionToken();
    const after = Date.now();
    const [payload] = token.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    expect(decoded.iat).toBeGreaterThanOrEqual(before);
    expect(decoded.iat).toBeLessThanOrEqual(after);
  });

  it('throws without SITE_PASSWORD', async () => {
    vi.stubEnv('SITE_PASSWORD', '');
    // Need to re-import to pick up the empty env
    const mod = await import('../sessionToken');
    expect(() => mod.createSessionToken()).toThrow('SITE_PASSWORD');
  });
});
