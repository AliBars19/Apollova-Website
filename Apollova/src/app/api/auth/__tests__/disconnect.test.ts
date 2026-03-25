// src/app/api/auth/__tests__/disconnect.test.ts
//
// Integration tests for POST /api/auth/disconnect
//
// Strategy:
//   - Mock disconnectPlatform from tokenManager to avoid real file I/O.
//   - Test validation (account, platform), happy path, and error path.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/utils/tokenManager', () => ({
  disconnectPlatform: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Route + mock imports
// ---------------------------------------------------------------------------

import { POST } from '../disconnect/route';
import { disconnectPlatform } from '@/utils/tokenManager';

const mockDisconnectPlatform = vi.mocked(disconnectPlatform);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/disconnect', {
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
  mockDisconnectPlatform.mockReturnValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('POST /api/auth/disconnect — happy path', () => {
  it('returns success:true when disconnecting youtube from aurora', async () => {
    const req = makeRequest({ account: 'aurora', platform: 'youtube' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns a descriptive message confirming what was disconnected', async () => {
    const req = makeRequest({ account: 'mono', platform: 'tiktok' });
    const res = await POST(req);
    const body = await res.json();

    expect(body.message).toMatch(/tiktok/i);
    expect(body.message).toMatch(/mono/i);
  });

  it('calls disconnectPlatform with the correct account and platform', async () => {
    const req = makeRequest({ account: 'onyx', platform: 'youtube' });
    await POST(req);

    expect(mockDisconnectPlatform).toHaveBeenCalledOnce();
    expect(mockDisconnectPlatform).toHaveBeenCalledWith('onyx', 'youtube');
  });

  it.each([
    ['aurora', 'youtube'],
    ['aurora', 'tiktok'],
    ['mono',   'youtube'],
    ['mono',   'tiktok'],
    ['onyx',   'youtube'],
    ['onyx',   'tiktok'],
  ] as const)(
    'succeeds for account="%s" platform="%s"',
    async (account, platform) => {
      const req = makeRequest({ account, platform });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockDisconnectPlatform).toHaveBeenCalledWith(account, platform);
    }
  );
});

// ---------------------------------------------------------------------------
// Invalid account
// ---------------------------------------------------------------------------

describe('POST /api/auth/disconnect — invalid account', () => {
  it('returns 400 for an unrecognised account value', async () => {
    const req = makeRequest({ account: 'badaccount', platform: 'youtube' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/invalid account/i);
  });

  it('returns 400 when account is missing', async () => {
    const req = makeRequest({ platform: 'youtube' });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when account is an empty string', async () => {
    const req = makeRequest({ account: '', platform: 'youtube' });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when account is null', async () => {
    const req = makeRequest({ account: null, platform: 'youtube' });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('does not call disconnectPlatform when account is invalid', async () => {
    const req = makeRequest({ account: 'bad', platform: 'youtube' });
    await POST(req);

    expect(mockDisconnectPlatform).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Invalid platform
// ---------------------------------------------------------------------------

describe('POST /api/auth/disconnect — invalid platform', () => {
  it('returns 400 for an unrecognised platform value', async () => {
    const req = makeRequest({ account: 'aurora', platform: 'instagram' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/invalid platform/i);
  });

  it('returns 400 when platform is missing', async () => {
    const req = makeRequest({ account: 'aurora' });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when platform is an empty string', async () => {
    const req = makeRequest({ account: 'aurora', platform: '' });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('does not call disconnectPlatform when platform is invalid', async () => {
    const req = makeRequest({ account: 'aurora', platform: 'snapchat' });
    await POST(req);

    expect(mockDisconnectPlatform).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Error path
// ---------------------------------------------------------------------------

describe('POST /api/auth/disconnect — error path', () => {
  it('returns 500 when disconnectPlatform throws', async () => {
    mockDisconnectPlatform.mockImplementation(() => {
      throw new Error('File write error');
    });

    const req = makeRequest({ account: 'aurora', platform: 'youtube' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/failed to disconnect/i);
  });

  it('returns 500 when request body is invalid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json{{',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
