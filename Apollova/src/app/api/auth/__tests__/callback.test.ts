// src/app/api/auth/__tests__/callback.test.ts
//
// Integration tests for:
//   GET /api/auth/callback/youtube  (YouTube OAuth callback)
//   GET /api/auth/callback/tiktok   (TikTok OAuth callback with PKCE)
//
// Both routes:
//   - Are GET handlers (no auth guard per middleware.test.ts public routes list)
//   - Call external token-endpoint URLs via fetch
//   - Call loadTokens() / saveTokens() from tokenManager
//   - Redirect to /auth-success on success, return JSON errors on failure

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/utils/tokenManager', () => ({
  loadTokens: vi.fn(),
  saveTokens: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Route imports
// ---------------------------------------------------------------------------

import { GET as youtubeCallback } from '../callback/youtube/route';
import { GET as tiktokCallback } from '../callback/tiktok/route';
import { loadTokens, saveTokens } from '@/utils/tokenManager';

const mockLoadTokens = vi.mocked(loadTokens);
const mockSaveTokens = vi.mocked(saveTokens);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = 'http://localhost:3000';

function emptyTokenStore() {
  return {
    accounts: {
      aurora: {},
      mono: {},
      onyx: {},
    },
  };
}

function makeYouTubeCallbackRequest(params: Record<string, string>): NextRequest {
  const url = new URL(`${BASE_URL}/api/auth/callback/youtube`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString());
}

function makeTikTokState(account: string, codeVerifier: string): string {
  return Buffer.from(JSON.stringify({ account, cv: codeVerifier })).toString('base64url');
}

function makeTikTokCallbackRequest(params: Record<string, string>): NextRequest {
  const url = new URL(`${BASE_URL}/api/auth/callback/tiktok`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString());
}

// ---------------------------------------------------------------------------
// YouTube callback tests
// ---------------------------------------------------------------------------

describe('GET /api/auth/callback/youtube', () => {
  const VALID_CODE = 'auth-code-abc123';
  const MOCK_TOKENS = {
    access_token: 'yt-access-tok',
    refresh_token: 'yt-refresh-tok',
    expires_in: 3600,
    token_type: 'Bearer',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('YOUTUBE_CLIENT_ID', 'test-yt-client-id');
    vi.stubEnv('YOUTUBE_CLIENT_SECRET', 'test-yt-client-secret');
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', BASE_URL);

    mockLoadTokens.mockReturnValue(emptyTokenStore());
    mockSaveTokens.mockReturnValue(undefined);

    // Default global fetch: token exchange succeeds, channel call succeeds
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://oauth2.googleapis.com/token') {
        return Promise.resolve({
          ok: true,
          json: async () => MOCK_TOKENS,
          text: async () => JSON.stringify(MOCK_TOKENS),
        } as Response);
      }
      if (url.includes('googleapis.com/youtube/v3/channels')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [{ snippet: { title: 'Test Channel' } }],
          }),
        } as Response);
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  // ---- happy path ---------------------------------------------------------

  it('redirects to /auth-success when code exchange succeeds', async () => {
    const req = makeYouTubeCallbackRequest({ code: VALID_CODE, state: 'aurora' });
    const res = await youtubeCallback(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/auth-success');
    expect(location).toContain('platform=youtube');
    expect(location).toContain('account=aurora');
  });

  it('saves tokens to the correct account from state param', async () => {
    const req = makeYouTubeCallbackRequest({ code: VALID_CODE, state: 'mono' });
    await youtubeCallback(req);

    expect(mockSaveTokens).toHaveBeenCalledOnce();
    const savedTokens = mockSaveTokens.mock.calls[0][0];
    expect(savedTokens.accounts.mono.youtube).toBeDefined();
    expect(savedTokens.accounts.mono.youtube?.accessToken).toBe('yt-access-tok');
    expect(savedTokens.accounts.mono.youtube?.refreshToken).toBe('yt-refresh-tok');
  });

  it('stores channel name when channel API call succeeds', async () => {
    const req = makeYouTubeCallbackRequest({ code: VALID_CODE, state: 'aurora' });
    await youtubeCallback(req);

    const savedTokens = mockSaveTokens.mock.calls[0][0];
    expect(savedTokens.accounts.aurora.youtube?.channelName).toBe('Test Channel');
  });

  it('still saves tokens even when channel name fetch fails', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://oauth2.googleapis.com/token') {
        return Promise.resolve({
          ok: true,
          json: async () => MOCK_TOKENS,
        } as Response);
      }
      // Channel call fails
      return Promise.reject(new Error('Channel API unavailable'));
    });

    const req = makeYouTubeCallbackRequest({ code: VALID_CODE, state: 'aurora' });
    const res = await youtubeCallback(req);

    // Should still redirect successfully
    expect(res.status).toBe(307);
    expect(mockSaveTokens).toHaveBeenCalledOnce();
  });

  it('defaults to aurora account when state is an unrecognised value', async () => {
    const req = makeYouTubeCallbackRequest({ code: VALID_CODE, state: 'unknown_account' });
    await youtubeCallback(req);

    const savedTokens = mockSaveTokens.mock.calls[0][0];
    expect(savedTokens.accounts.aurora.youtube).toBeDefined();
  });

  it('defaults to aurora account when state param is absent', async () => {
    const req = makeYouTubeCallbackRequest({ code: VALID_CODE });
    await youtubeCallback(req);

    const savedTokens = mockSaveTokens.mock.calls[0][0];
    expect(savedTokens.accounts.aurora.youtube).toBeDefined();
  });

  it('calculates expiresAt from expires_in', async () => {
    const before = Date.now();
    const req = makeYouTubeCallbackRequest({ code: VALID_CODE, state: 'aurora' });
    await youtubeCallback(req);
    const after = Date.now();

    const savedTokens = mockSaveTokens.mock.calls[0][0];
    const expiresAt = new Date(savedTokens.accounts.aurora.youtube!.expiresAt).getTime();
    // Should be ~3600 seconds from now
    expect(expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000);
    expect(expiresAt).toBeLessThanOrEqual(after + 3600 * 1000);
  });

  // ---- error param ---------------------------------------------------------

  it('returns 400 with error message when error param is present', async () => {
    const req = makeYouTubeCallbackRequest({ error: 'access_denied', state: 'aurora' });
    const res = await youtubeCallback(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/denied/i);
    expect(mockSaveTokens).not.toHaveBeenCalled();
  });

  // ---- missing code --------------------------------------------------------

  it('returns 400 when code param is absent', async () => {
    const req = makeYouTubeCallbackRequest({ state: 'aurora' });
    const res = await youtubeCallback(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/no authorization code/i);
    expect(mockSaveTokens).not.toHaveBeenCalled();
  });

  // ---- missing env credentials --------------------------------------------

  it('returns 500 when YOUTUBE_CLIENT_ID is not configured', async () => {
    vi.stubEnv('YOUTUBE_CLIENT_ID', '');
    const req = makeYouTubeCallbackRequest({ code: VALID_CODE, state: 'aurora' });
    const res = await youtubeCallback(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/not configured/i);
  });

  it('returns 500 when YOUTUBE_CLIENT_SECRET is not configured', async () => {
    vi.stubEnv('YOUTUBE_CLIENT_SECRET', '');
    const req = makeYouTubeCallbackRequest({ code: VALID_CODE, state: 'aurora' });
    const res = await youtubeCallback(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/not configured/i);
  });

  // ---- token exchange failure ----------------------------------------------

  it('returns 500 when Google token exchange fails (non-ok response)', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => 'invalid_client',
    } as Response);

    const req = makeYouTubeCallbackRequest({ code: VALID_CODE, state: 'aurora' });
    const res = await youtubeCallback(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/failed to complete/i);
    expect(mockSaveTokens).not.toHaveBeenCalled();
  });

  it('returns 500 when fetch itself throws (network error)', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const req = makeYouTubeCallbackRequest({ code: VALID_CODE, state: 'aurora' });
    const res = await youtubeCallback(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(mockSaveTokens).not.toHaveBeenCalled();
  });

  // ---- all three valid account values -------------------------------------

  it.each(['aurora', 'mono', 'onyx'] as const)(
    'saves tokens for account "%s" from state',
    async (account) => {
      const req = makeYouTubeCallbackRequest({ code: VALID_CODE, state: account });
      await youtubeCallback(req);

      const savedTokens = mockSaveTokens.mock.calls[0][0];
      expect(savedTokens.accounts[account].youtube).toBeDefined();
    }
  );
});

// ---------------------------------------------------------------------------
// TikTok callback tests
// ---------------------------------------------------------------------------

describe('GET /api/auth/callback/tiktok', () => {
  const VALID_CODE = 'tt-auth-code-xyz';
  const CODE_VERIFIER = 'test-pkce-code-verifier-abc123def456';
  const MOCK_TOKENS = {
    access_token: 'tt-access-tok',
    refresh_token: 'tt-refresh-tok',
    expires_in: 86400,
    token_type: 'Bearer',
    open_id: 'tt-open-id-001',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('TIKTOK_CLIENT_KEY', 'test-tt-client-key');
    vi.stubEnv('TIKTOK_CLIENT_SECRET', 'test-tt-client-secret');
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', BASE_URL);

    mockLoadTokens.mockReturnValue(emptyTokenStore());
    mockSaveTokens.mockReturnValue(undefined);

    // Default global fetch: token exchange + user info both succeed
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://open.tiktokapis.com/v2/oauth/token/') {
        return Promise.resolve({
          ok: true,
          json: async () => MOCK_TOKENS,
        } as Response);
      }
      if (url.includes('open.tiktokapis.com/v2/user/info')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: { user: { username: 'testuser', display_name: 'Test User' } },
          }),
        } as Response);
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  // ---- happy path ---------------------------------------------------------

  it('redirects to /auth-success when code + valid state succeed', async () => {
    const state = makeTikTokState('aurora', CODE_VERIFIER);
    const req = makeTikTokCallbackRequest({ code: VALID_CODE, state });
    const res = await tiktokCallback(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/auth-success');
    expect(location).toContain('platform=tiktok');
    expect(location).toContain('account=aurora');
  });

  it('saves tokens to the correct account parsed from state', async () => {
    const state = makeTikTokState('onyx', CODE_VERIFIER);
    const req = makeTikTokCallbackRequest({ code: VALID_CODE, state });
    await tiktokCallback(req);

    expect(mockSaveTokens).toHaveBeenCalledOnce();
    const savedTokens = mockSaveTokens.mock.calls[0][0];
    expect(savedTokens.accounts.onyx.tiktok).toBeDefined();
    expect(savedTokens.accounts.onyx.tiktok?.accessToken).toBe('tt-access-tok');
    expect(savedTokens.accounts.onyx.tiktok?.openId).toBe('tt-open-id-001');
  });

  it('includes username in saved token data', async () => {
    const state = makeTikTokState('aurora', CODE_VERIFIER);
    const req = makeTikTokCallbackRequest({ code: VALID_CODE, state });
    await tiktokCallback(req);

    const savedTokens = mockSaveTokens.mock.calls[0][0];
    expect(savedTokens.accounts.aurora.tiktok?.username).toBe('testuser');
  });

  it('sends code_verifier in the token exchange request (PKCE)', async () => {
    const state = makeTikTokState('aurora', CODE_VERIFIER);
    const req = makeTikTokCallbackRequest({ code: VALID_CODE, state });
    await tiktokCallback(req);

    const fetchCall = vi.mocked(global.fetch).mock.calls.find(
      ([url]) => (url as string) === 'https://open.tiktokapis.com/v2/oauth/token/'
    );
    expect(fetchCall).toBeDefined();
    const bodyString = (fetchCall![1] as RequestInit).body?.toString() ?? '';
    expect(bodyString).toContain(`code_verifier=${CODE_VERIFIER}`);
  });

  it('still saves tokens even when user-info fetch fails', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://open.tiktokapis.com/v2/oauth/token/') {
        return Promise.resolve({
          ok: true,
          json: async () => MOCK_TOKENS,
        } as Response);
      }
      return Promise.reject(new Error('User API unavailable'));
    });

    const state = makeTikTokState('aurora', CODE_VERIFIER);
    const req = makeTikTokCallbackRequest({ code: VALID_CODE, state });
    const res = await tiktokCallback(req);

    expect(res.status).toBe(307);
    expect(mockSaveTokens).toHaveBeenCalledOnce();
  });

  it.each(['aurora', 'mono', 'onyx'] as const)(
    'handles account "%s" from state correctly',
    async (account) => {
      const state = makeTikTokState(account, CODE_VERIFIER);
      const req = makeTikTokCallbackRequest({ code: VALID_CODE, state });
      await tiktokCallback(req);

      const savedTokens = mockSaveTokens.mock.calls[0][0];
      expect(savedTokens.accounts[account].tiktok).toBeDefined();
    }
  );

  // ---- error param --------------------------------------------------------

  it('returns 400 when error param is present', async () => {
    const req = makeTikTokCallbackRequest({ error: 'access_denied' });
    const res = await tiktokCallback(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/denied/i);
    expect(mockSaveTokens).not.toHaveBeenCalled();
  });

  // ---- missing code / state -----------------------------------------------

  it('returns 400 when code is missing', async () => {
    const state = makeTikTokState('aurora', CODE_VERIFIER);
    const req = makeTikTokCallbackRequest({ state });
    const res = await tiktokCallback(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/no authorization code or state/i);
  });

  it('returns 400 when state is missing', async () => {
    const req = makeTikTokCallbackRequest({ code: VALID_CODE });
    const res = await tiktokCallback(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/no authorization code or state/i);
  });

  // ---- invalid state (PKCE verification) ---------------------------------

  it('returns 400 when state is not valid base64url JSON', async () => {
    const req = makeTikTokCallbackRequest({ code: VALID_CODE, state: 'not-valid-base64url!!!!' });
    const res = await tiktokCallback(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/invalid state/i);
  });

  it('returns 400 when state JSON is missing code_verifier (cv field)', async () => {
    // Valid base64url JSON but no cv field
    const stateWithoutCv = Buffer.from(JSON.stringify({ account: 'aurora' })).toString('base64url');
    const req = makeTikTokCallbackRequest({ code: VALID_CODE, state: stateWithoutCv });
    const res = await tiktokCallback(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/code verifier missing/i);
  });

  it('defaults account to aurora when state has unrecognised account value', async () => {
    const stateWithBadAccount = Buffer.from(
      JSON.stringify({ account: 'badaccount', cv: CODE_VERIFIER })
    ).toString('base64url');
    const req = makeTikTokCallbackRequest({ code: VALID_CODE, state: stateWithBadAccount });
    await tiktokCallback(req);

    const savedTokens = mockSaveTokens.mock.calls[0][0];
    expect(savedTokens.accounts.aurora.tiktok).toBeDefined();
  });

  // ---- missing env credentials --------------------------------------------

  it('returns 500 when TIKTOK_CLIENT_KEY is not configured', async () => {
    vi.stubEnv('TIKTOK_CLIENT_KEY', '');
    const state = makeTikTokState('aurora', CODE_VERIFIER);
    const req = makeTikTokCallbackRequest({ code: VALID_CODE, state });
    const res = await tiktokCallback(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/not configured/i);
  });

  it('returns 500 when TIKTOK_CLIENT_SECRET is not configured', async () => {
    vi.stubEnv('TIKTOK_CLIENT_SECRET', '');
    const state = makeTikTokState('aurora', CODE_VERIFIER);
    const req = makeTikTokCallbackRequest({ code: VALID_CODE, state });
    const res = await tiktokCallback(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/not configured/i);
  });

  // ---- token exchange failure ---------------------------------------------

  it('returns 500 when TikTok token exchange returns non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => 'invalid_grant',
    } as Response);

    const state = makeTikTokState('aurora', CODE_VERIFIER);
    const req = makeTikTokCallbackRequest({ code: VALID_CODE, state });
    const res = await tiktokCallback(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/failed to complete/i);
    expect(mockSaveTokens).not.toHaveBeenCalled();
  });

  it('returns 500 when fetch itself throws (network error)', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network timeout'));

    const state = makeTikTokState('aurora', CODE_VERIFIER);
    const req = makeTikTokCallbackRequest({ code: VALID_CODE, state });
    const res = await tiktokCallback(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(mockSaveTokens).not.toHaveBeenCalled();
  });
});
