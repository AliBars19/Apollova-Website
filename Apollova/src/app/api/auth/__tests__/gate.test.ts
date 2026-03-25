// src/app/api/auth/__tests__/gate.test.ts
//
// Integration tests for POST /api/auth/gate
//
// Strategy:
//   - The route module-level code throws if SITE_PASSWORD is not set,
//     so we must set the env var BEFORE the import executes.
//     vi.stubEnv cannot run before import, so we set process.env directly
//     in a vi.hoisted() block which runs before any top-level code.
//   - Mock @/utils/sessionToken so we can control the returned token value
//     without depending on HMAC internals.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Set SITE_PASSWORD before the route module is imported (it throws without it)
// ---------------------------------------------------------------------------

vi.hoisted(() => {
  process.env.SITE_PASSWORD = 'test-secret-password';
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/utils/sessionToken', () => ({
  createSessionToken: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Route + mock imports
// ---------------------------------------------------------------------------

import { POST } from '../gate/route';
import { createSessionToken } from '@/utils/sessionToken';

const mockCreateSessionToken = vi.mocked(createSessionToken);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CORRECT_PASSWORD = 'test-secret-password';

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/gate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SITE_PASSWORD = CORRECT_PASSWORD;
  mockCreateSessionToken.mockReturnValue('payload.signature');
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Correct password
// ---------------------------------------------------------------------------

describe('POST /api/auth/gate — correct password', () => {
  it('returns 200 with success:true when password is correct', async () => {
    const req = makeRequest({ password: CORRECT_PASSWORD });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('sets the site_access cookie on success', async () => {
    const req = makeRequest({ password: CORRECT_PASSWORD });
    const res = await POST(req);

    const setCookieHeader = res.headers.get('set-cookie');
    expect(setCookieHeader).toBeTruthy();
    expect(setCookieHeader).toContain('site_access');
  });

  it('cookie value contains the token returned by createSessionToken', async () => {
    mockCreateSessionToken.mockReturnValue('my-signed-token');

    const req = makeRequest({ password: CORRECT_PASSWORD });
    const res = await POST(req);

    const setCookieHeader = res.headers.get('set-cookie') ?? '';
    expect(setCookieHeader).toContain('my-signed-token');
  });

  it('calls createSessionToken exactly once on success', async () => {
    const req = makeRequest({ password: CORRECT_PASSWORD });
    await POST(req);

    expect(mockCreateSessionToken).toHaveBeenCalledOnce();
  });

  it('sets HttpOnly on the session cookie', async () => {
    const req = makeRequest({ password: CORRECT_PASSWORD });
    const res = await POST(req);

    const setCookieHeader = res.headers.get('set-cookie') ?? '';
    expect(setCookieHeader.toLowerCase()).toContain('httponly');
  });

  it('sets SameSite=Lax on the session cookie', async () => {
    const req = makeRequest({ password: CORRECT_PASSWORD });
    const res = await POST(req);

    const setCookieHeader = res.headers.get('set-cookie') ?? '';
    expect(setCookieHeader.toLowerCase()).toContain('samesite=lax');
  });
});

// ---------------------------------------------------------------------------
// Wrong password
// ---------------------------------------------------------------------------

describe('POST /api/auth/gate — wrong password', () => {
  it('returns 401 when password is incorrect', async () => {
    const req = makeRequest({ password: 'wrong-password' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/incorrect password/i);
  });

  it('does not set a session cookie on wrong password', async () => {
    const req = makeRequest({ password: 'wrong-password' });
    const res = await POST(req);

    const setCookieHeader = res.headers.get('set-cookie');
    // Either no cookie header, or it must not contain site_access
    if (setCookieHeader) {
      expect(setCookieHeader).not.toContain('site_access');
    } else {
      expect(setCookieHeader).toBeNull();
    }
  });

  it('does not call createSessionToken on wrong password', async () => {
    const req = makeRequest({ password: 'wrong-password' });
    await POST(req);

    expect(mockCreateSessionToken).not.toHaveBeenCalled();
  });

  it('returns 401 for an empty password string', async () => {
    const req = makeRequest({ password: '' });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Missing / malformed body
// ---------------------------------------------------------------------------

describe('POST /api/auth/gate — missing or malformed body', () => {
  it('returns 400 when request body is not valid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json{{{',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 401 when password field is absent from body', async () => {
    // Valid JSON but no password key — treated as undefined !== SITE_PASSWORD
    const req = makeRequest({});
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 401 when password field is null', async () => {
    const req = makeRequest({ password: null });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});
