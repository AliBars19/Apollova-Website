// src/app/api/tiktok/__tests__/creator-info.test.ts
//
// Integration tests for GET /api/tiktok/creator-info
//
// Strategy:
//   - Mock getValidTikTokToken from tokenManager to avoid real token I/O.
//   - Mock global.fetch to control TikTok API responses.
//   - Test happy path, error from TikTok API, missing/invalid token, and
//     invalid account parameter.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/utils/tokenManager', () => ({
  getValidTikTokToken: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Route + mock imports
// ---------------------------------------------------------------------------

import { GET } from '../creator-info/route';
import { getValidTikTokToken } from '@/utils/tokenManager';

const mockGetValidTikTokToken = vi.mocked(getValidTikTokToken);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_ACCESS_TOKEN = 'tt-access-token-abc123';

const MOCK_CREATOR_INFO = {
  creator_avatar_url: 'https://example.com/avatar.jpg',
  creator_username: 'testcreator',
  creator_nickname: 'Test Creator',
  privacy_level_options: ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS'],
  comment_disabled: false,
  duet_disabled: false,
  stitch_disabled: false,
  max_video_post_duration_sec: 600,
};

function makeTikTokSuccessResponse(creatorInfo = MOCK_CREATOR_INFO) {
  return Promise.resolve({
    ok: true,
    json: async () => ({ data: { creator_info: creatorInfo } }),
    text: async () => JSON.stringify({ data: { creator_info: creatorInfo } }),
  } as Response);
}

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/tiktok/creator-info');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString());
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockGetValidTikTokToken.mockResolvedValue(MOCK_ACCESS_TOKEN);
  global.fetch = vi.fn().mockImplementation(() => makeTikTokSuccessResponse());
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('GET /api/tiktok/creator-info — happy path', () => {
  it('returns ok:true with creator info on success', async () => {
    const req = makeRequest({ account: 'aurora' });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.creatorInfo).toBeDefined();
  });

  it('returns the creator info from TikTok API', async () => {
    const req = makeRequest({ account: 'aurora' });
    const res = await GET(req);
    const body = await res.json();

    expect(body.creatorInfo.creator_username).toBe('testcreator');
    expect(body.creatorInfo.creator_nickname).toBe('Test Creator');
  });

  it('echoes back the account parameter in the response', async () => {
    const req = makeRequest({ account: 'mono' });
    const res = await GET(req);
    const body = await res.json();

    expect(body.account).toBe('mono');
  });

  it('defaults to aurora when account param is not provided', async () => {
    const req = makeRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.account).toBe('aurora');
  });

  it('calls getValidTikTokToken with the correct account', async () => {
    const req = makeRequest({ account: 'onyx' });
    await GET(req);

    expect(mockGetValidTikTokToken).toHaveBeenCalledWith('onyx');
  });

  it('sends the access token as Bearer Authorization header to TikTok', async () => {
    const req = makeRequest({ account: 'aurora' });
    await GET(req);

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const requestInit = fetchCall[1] as RequestInit;
    const headers = requestInit.headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Bearer ${MOCK_ACCESS_TOKEN}`);
  });

  it.each(['aurora', 'mono', 'onyx'] as const)(
    'succeeds for account "%s"',
    async (account) => {
      const req = makeRequest({ account });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockGetValidTikTokToken).toHaveBeenCalledWith(account);
    }
  );
});

// ---------------------------------------------------------------------------
// TikTok API error response
// ---------------------------------------------------------------------------

describe('GET /api/tiktok/creator-info — TikTok API errors', () => {
  it('returns the TikTok API status code when the API responds with an error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as Response);

    const req = makeRequest({ account: 'aurora' });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toMatch(/failed to fetch creator info/i);
  });

  it('includes details text from the TikTok error response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'scope_not_authorized',
    } as Response);

    const req = makeRequest({ account: 'aurora' });
    const res = await GET(req);
    const body = await res.json();

    expect(body.details).toContain('scope_not_authorized');
  });

  it('returns 500 when fetch throws a network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

    const req = makeRequest({ account: 'aurora' });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/Network timeout/);
  });
});

// ---------------------------------------------------------------------------
// Token not connected
// ---------------------------------------------------------------------------

describe('GET /api/tiktok/creator-info — not connected', () => {
  it('returns 500 when TikTok is not authorized for the account', async () => {
    mockGetValidTikTokToken.mockRejectedValue(
      new Error('TikTok not authorized for aurora account. Please authorize first.')
    );

    const req = makeRequest({ account: 'aurora' });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/not authorized/i);
  });
});

// ---------------------------------------------------------------------------
// Invalid account
// ---------------------------------------------------------------------------

describe('GET /api/tiktok/creator-info — invalid account', () => {
  it('returns 400 for an unrecognised account value', async () => {
    const req = makeRequest({ account: 'badaccount' });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/invalid account/i);
  });

  it('does not call getValidTikTokToken when account is invalid', async () => {
    const req = makeRequest({ account: 'unknown' });
    await GET(req);

    expect(mockGetValidTikTokToken).not.toHaveBeenCalled();
  });
});
