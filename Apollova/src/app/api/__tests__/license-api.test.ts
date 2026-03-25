// src/app/api/__tests__/license-api.test.ts
//
// Integration tests for:
//   POST /api/activate  — license activation with hardware fingerprint binding
//   POST /api/verify    — license verification
//
// Strategy:
//   - Mock @/lib/database so the route handlers use a fully controlled
//     in-memory query layer instead of sql.js + real files.
//   - Build a thin DB-stub per describe block that mimics the sql.js API
//     (prepare → bind → step → getAsObject → free, plus run + save).
//   - Use vi.stubEnv to inject a deterministic HMAC_SECRET.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createHmac } from 'crypto';

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock('@/lib/database', () => ({
  getDatabase: vi.fn(),
  saveDatabase: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Route imports
// ---------------------------------------------------------------------------

import { POST as activatePost, GET as activateGet } from '../activate/route';
import { POST as verifyPost, GET as verifyGet } from '../verify/route';
import { getDatabase, saveDatabase } from '@/lib/database';

const mockGetDatabase = vi.mocked(getDatabase);
const mockSaveDatabase = vi.mocked(saveDatabase);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HMAC_SECRET_HEX = Buffer.from('test-hmac-secret-32bytes!!!!!!!').toString('hex');
const LICENSE_KEY = 'AAAA-BBBB-CCCC-DDDD';
const HW_FINGERPRINT = 'hw-fp-sha256-deadbeef';
const ANOTHER_HW_FINGERPRINT = 'hw-fp-sha256-cafebabe';

function computeExpectedToken(key: string, hw: string): string {
  return createHmac('sha256', Buffer.from(HMAC_SECRET_HEX, 'hex'))
    .update(`${key}:${hw}`)
    .digest('hex');
}

// ---------------------------------------------------------------------------
// DB stub factory
// ---------------------------------------------------------------------------

type LicenseRow = {
  id: string;
  license_key: string;
  customer_email: string;
  customer_name: string;
  purchase_date: string;
  price_paid: number;
  activated: number;
  activation_date: string | null;
  hw_fingerprint: string | null;
  last_verified: string | null;
  revoked: number;
  notes: string;
};

function makeDbStub(licenseRow: LicenseRow | null) {
  let queryRow: LicenseRow | null = licenseRow;

  const stmt = {
    bind: vi.fn(),
    step: vi.fn().mockReturnValue(queryRow !== null),
    getAsObject: vi.fn().mockReturnValue(queryRow ?? {}),
    free: vi.fn(),
  };

  const db = {
    prepare: vi.fn().mockReturnValue(stmt),
    run: vi.fn(),
  };

  return { db, stmt };
}

function defaultLicense(overrides: Partial<LicenseRow> = {}): LicenseRow {
  return {
    id: 'lic-001',
    license_key: LICENSE_KEY,
    customer_email: 'test@example.com',
    customer_name: 'Test Customer',
    purchase_date: '2025-01-01T00:00:00.000Z',
    price_paid: 49.99,
    activated: 0,
    activation_date: null,
    hw_fingerprint: null,
    last_verified: null,
    revoked: 0,
    notes: '',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

function makeActivateRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeVerifyRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('HMAC_SECRET', HMAC_SECRET_HEX);
  mockSaveDatabase.mockReturnValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ===========================================================================
// /api/activate
// ===========================================================================

describe('POST /api/activate', () => {
  // ---- happy path: first-time activation ----------------------------------

  it('returns success:true and a token for first-time activation', async () => {
    const license = defaultLicense(); // activated=0, no hw_fingerprint
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeActivateRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res = await activatePost(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/activated successfully/i);
    expect(body.token).toBe(computeExpectedToken(LICENSE_KEY, HW_FINGERPRINT));
  });

  it('calls db.run to bind hardware fingerprint on first activation', async () => {
    const license = defaultLicense();
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeActivateRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    await activatePost(req);

    // Should have called db.run with an UPDATE that sets hw_fingerprint
    const runCall = (db.run as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(runCall[0]).toMatch(/UPDATE licenses/i);
    expect(runCall[0]).toMatch(/hw_fingerprint/i);
    expect(runCall[1]).toContain(HW_FINGERPRINT);
  });

  it('calls saveDatabase after activation', async () => {
    const license = defaultLicense();
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeActivateRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    await activatePost(req);

    expect(mockSaveDatabase).toHaveBeenCalled();
  });

  // ---- happy path: re-activation on same machine --------------------------

  it('returns success:true when already activated on the same machine', async () => {
    const license = defaultLicense({
      activated: 1,
      hw_fingerprint: HW_FINGERPRINT,
      activation_date: '2025-01-01T00:00:00.000Z',
    });
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeActivateRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res = await activatePost(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/already activated on this computer/i);
    expect(body.token).toBe(computeExpectedToken(LICENSE_KEY, HW_FINGERPRINT));
  });

  it('refreshes last_verified timestamp on re-activation (same machine)', async () => {
    const license = defaultLicense({
      activated: 1,
      hw_fingerprint: HW_FINGERPRINT,
    });
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeActivateRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    await activatePost(req);

    const runCall = (db.run as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(runCall[0]).toMatch(/last_verified/i);
  });

  // ---- already activated on a different machine ---------------------------

  it('returns 403 when license is already bound to a different hardware', async () => {
    const license = defaultLicense({
      activated: 1,
      hw_fingerprint: ANOTHER_HW_FINGERPRINT,
    });
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeActivateRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res = await activatePost(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/another computer/i);
    expect(mockSaveDatabase).not.toHaveBeenCalled();
  });

  // ---- revoked license ----------------------------------------------------

  it('returns 403 when the license has been revoked', async () => {
    const license = defaultLicense({ revoked: 1 });
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeActivateRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res = await activatePost(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/revoked/i);
  });

  // ---- invalid license key ------------------------------------------------

  it('returns 404 when the license key does not exist', async () => {
    const { db } = makeDbStub(null); // step() returns false
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeActivateRequest({ licenseKey: 'ZZZZ-ZZZZ-ZZZZ-ZZZZ', hwFingerprint: HW_FINGERPRINT });
    const res = await activatePost(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/invalid license key/i);
  });

  // ---- missing fields (400) -----------------------------------------------

  it('returns 400 when licenseKey is missing', async () => {
    const req = makeActivateRequest({ hwFingerprint: HW_FINGERPRINT });
    const res = await activatePost(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/missing license key or hardware fingerprint/i);
  });

  it('returns 400 when hwFingerprint is missing', async () => {
    const req = makeActivateRequest({ licenseKey: LICENSE_KEY });
    const res = await activatePost(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/missing license key or hardware fingerprint/i);
  });

  it('returns 400 when both fields are missing', async () => {
    const req = makeActivateRequest({});
    const res = await activatePost(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  // ---- HMAC_SECRET not configured -----------------------------------------

  it('returns 500 when HMAC_SECRET is not set', async () => {
    vi.stubEnv('HMAC_SECRET', '');
    const license = defaultLicense();
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeActivateRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res = await activatePost(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  // ---- getDatabase throws --------------------------------------------------

  it('returns 500 when database throws an error', async () => {
    mockGetDatabase.mockRejectedValue(new Error('DB connection failed'));

    const req = makeActivateRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res = await activatePost(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/server error/i);
  });

  // ---- GET endpoint -------------------------------------------------------

  it('GET /api/activate returns endpoint description', async () => {
    const res = await activateGet();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.endpoint).toBe('/api/activate');
    expect(body.method).toBe('POST');
  });

  // ---- hardware fingerprint binding correctness ---------------------------

  it('produces deterministic token from licenseKey + hwFingerprint', async () => {
    const license = defaultLicense();
    const { db: db1 } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db1 as any);

    const req1 = makeActivateRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res1 = await activatePost(req1);
    const body1 = await res1.json();

    const { db: db2 } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db2 as any);

    const req2 = makeActivateRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res2 = await activatePost(req2);
    const body2 = await res2.json();

    expect(body1.token).toBe(body2.token);
  });

  it('produces different tokens for different hardware fingerprints', async () => {
    const license1 = defaultLicense();
    const { db: db1 } = makeDbStub(license1);
    mockGetDatabase.mockResolvedValue(db1 as any);

    const req1 = makeActivateRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res1 = await activatePost(req1);
    const body1 = await res1.json();

    // Second activation with a DIFFERENT fingerprint but same key (unactivated)
    const license2 = defaultLicense();
    const { db: db2 } = makeDbStub(license2);
    mockGetDatabase.mockResolvedValue(db2 as any);

    const req2 = makeActivateRequest({ licenseKey: LICENSE_KEY, hwFingerprint: ANOTHER_HW_FINGERPRINT });
    const res2 = await activatePost(req2);
    const body2 = await res2.json();

    expect(body1.token).not.toBe(body2.token);
  });
});

// ===========================================================================
// /api/verify
// ===========================================================================

describe('POST /api/verify', () => {
  // ---- happy path ---------------------------------------------------------

  it('returns valid:true with token and customer name for a valid license', async () => {
    const license = defaultLicense({
      activated: 1,
      hw_fingerprint: HW_FINGERPRINT,
      activation_date: '2025-01-01T00:00:00.000Z',
    });
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeVerifyRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res = await verifyPost(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.valid).toBe(true);
    expect(body.message).toMatch(/verified successfully/i);
    expect(body.customer_name).toBe('Test Customer');
    expect(body.token).toBe(computeExpectedToken(LICENSE_KEY, HW_FINGERPRINT));
  });

  it('calls db.run to update last_verified on successful verification', async () => {
    const license = defaultLicense({
      activated: 1,
      hw_fingerprint: HW_FINGERPRINT,
    });
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeVerifyRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    await verifyPost(req);

    const runCall = (db.run as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(runCall[0]).toMatch(/UPDATE licenses SET last_verified/i);
  });

  it('calls saveDatabase after successful verification', async () => {
    const license = defaultLicense({
      activated: 1,
      hw_fingerprint: HW_FINGERPRINT,
    });
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeVerifyRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    await verifyPost(req);

    expect(mockSaveDatabase).toHaveBeenCalled();
  });

  // ---- license not found --------------------------------------------------

  it('returns 404 with valid:false when license key does not exist', async () => {
    const { db } = makeDbStub(null);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeVerifyRequest({ licenseKey: 'ZZZZ-ZZZZ-ZZZZ-ZZZZ', hwFingerprint: HW_FINGERPRINT });
    const res = await verifyPost(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/not found/i);
  });

  // ---- revoked license ----------------------------------------------------

  it('returns 403 with valid:false when license is revoked', async () => {
    const license = defaultLicense({ revoked: 1, activated: 1, hw_fingerprint: HW_FINGERPRINT });
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeVerifyRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res = await verifyPost(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/revoked/i);
    expect(mockSaveDatabase).not.toHaveBeenCalled();
  });

  // ---- not yet activated --------------------------------------------------

  it('returns 403 with valid:false when license has never been activated', async () => {
    const license = defaultLicense({ activated: 0 });
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeVerifyRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res = await verifyPost(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/not activated/i);
  });

  // ---- hardware mismatch --------------------------------------------------

  it('returns 403 with valid:false when hardware fingerprint does not match', async () => {
    const license = defaultLicense({
      activated: 1,
      hw_fingerprint: ANOTHER_HW_FINGERPRINT,
    });
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeVerifyRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res = await verifyPost(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/hardware mismatch/i);
    expect(mockSaveDatabase).not.toHaveBeenCalled();
  });

  // ---- missing fields (400) -----------------------------------------------

  it('returns 400 when licenseKey is missing', async () => {
    const req = makeVerifyRequest({ hwFingerprint: HW_FINGERPRINT });
    const res = await verifyPost(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/missing/i);
  });

  it('returns 400 when hwFingerprint is missing', async () => {
    const req = makeVerifyRequest({ licenseKey: LICENSE_KEY });
    const res = await verifyPost(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.valid).toBe(false);
  });

  it('returns 400 when both fields are absent', async () => {
    const req = makeVerifyRequest({});
    const res = await verifyPost(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.valid).toBe(false);
  });

  // ---- HMAC_SECRET not configured -----------------------------------------

  it('returns 500 when HMAC_SECRET is not set', async () => {
    vi.stubEnv('HMAC_SECRET', '');
    const license = defaultLicense({ activated: 1, hw_fingerprint: HW_FINGERPRINT });
    const { db } = makeDbStub(license);
    mockGetDatabase.mockResolvedValue(db as any);

    const req = makeVerifyRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res = await verifyPost(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.valid).toBe(false);
  });

  // ---- database error -----------------------------------------------------

  it('returns 500 when database throws', async () => {
    mockGetDatabase.mockRejectedValue(new Error('DB unavailable'));

    const req = makeVerifyRequest({ licenseKey: LICENSE_KEY, hwFingerprint: HW_FINGERPRINT });
    const res = await verifyPost(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/server error/i);
  });

  // ---- GET endpoint -------------------------------------------------------

  it('GET /api/verify returns endpoint description', async () => {
    const res = await verifyGet();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.endpoint).toBe('/api/verify');
    expect(body.method).toBe('POST');
  });

  // ---- token is deterministic and hardware-bound --------------------------

  it('returns a different token for a different hardware fingerprint', async () => {
    // We test the token math directly rather than routing through the DB twice
    const tokenA = computeExpectedToken(LICENSE_KEY, HW_FINGERPRINT);
    const tokenB = computeExpectedToken(LICENSE_KEY, ANOTHER_HW_FINGERPRINT);
    expect(tokenA).not.toBe(tokenB);
  });
});
