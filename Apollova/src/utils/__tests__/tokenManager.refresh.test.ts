// src/utils/__tests__/tokenManager.refresh.test.ts
// Expands coverage for tokenManager.ts beyond the existing tokenManager.test.ts.
// Tests: getValidYouTubeToken, getValidTikTokToken, refresh logic,
// failure handling, getAllAccountsStatus, saveTokens atomic write,
// getAccountInfo.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeYouTubeTokens(overrides: Partial<{
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: string;
  channelName: string;
}> = {}) {
  return {
    accessToken: 'yt_access_current',
    refreshToken: 'yt_refresh_token',
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1h from now — valid
    tokenType: 'Bearer',
    channelName: 'Aurora Music',
    ...overrides,
  };
}

function makeTikTokTokens(overrides: Partial<{
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: string;
  openId: string;
  username: string;
}> = {}) {
  return {
    accessToken: 'tt_access_current',
    refreshToken: 'tt_refresh_token',
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    tokenType: 'Bearer',
    openId: 'open_id_123',
    username: 'aurora_tiktok',
    ...overrides,
  };
}

function makeFullTokenFile(accountId: 'aurora' | 'mono' | 'onyx', platform: 'youtube' | 'tiktok', tokenData: object) {
  return {
    accounts: {
      aurora: accountId === 'aurora' ? { [platform]: tokenData } : {},
      mono: accountId === 'mono' ? { [platform]: tokenData } : {},
      onyx: accountId === 'onyx' ? { [platform]: tokenData } : {},
    },
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('getValidYouTubeToken', () => {
  let tmpDir: string;
  let tokensPath: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yt-token-'));
    fs.mkdirSync(path.join(tmpDir, 'data'), { recursive: true });
    tokensPath = path.join(tmpDir, 'data', 'tokens.json');
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns existing token when it is not expired', async () => {
    const ytTokens = makeYouTubeTokens(); // expires 1h from now
    fs.writeFileSync(tokensPath, JSON.stringify(makeFullTokenFile('aurora', 'youtube', ytTokens)));

    const { getValidYouTubeToken } = await import('../tokenManager');
    const token = await getValidYouTubeToken('aurora');

    expect(token).toBe('yt_access_current');
  });

  it('refreshes token when it is within the 5-minute expiry buffer', async () => {
    vi.stubEnv('YOUTUBE_CLIENT_ID', 'client_id');
    vi.stubEnv('YOUTUBE_CLIENT_SECRET', 'client_secret');

    // Token expires in 4 minutes — within 5-min buffer → expired
    const expiringSoon = makeYouTubeTokens({
      expiresAt: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
      accessToken: 'old_access',
      refreshToken: 'old_refresh',
    });
    fs.writeFileSync(tokensPath, JSON.stringify(makeFullTokenFile('aurora', 'youtube', expiringSoon)));

    const newExpiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new_yt_access',
        token_type: 'Bearer',
        expires_in: 3600,
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { getValidYouTubeToken } = await import('../tokenManager');
    const token = await getValidYouTubeToken('aurora');

    expect(token).toBe('new_yt_access');
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    expect(opts.method).toBe('POST');

    // Verify the new token was persisted
    const saved = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    expect(saved.accounts.aurora.youtube.accessToken).toBe('new_yt_access');
  });

  it('preserves channelName after refresh', async () => {
    vi.stubEnv('YOUTUBE_CLIENT_ID', 'client_id');
    vi.stubEnv('YOUTUBE_CLIENT_SECRET', 'client_secret');

    const expiringSoon = makeYouTubeTokens({
      expiresAt: new Date(Date.now() + 1 * 60 * 1000).toISOString(),
      channelName: 'Aurora Music',
    });
    fs.writeFileSync(tokensPath, JSON.stringify(makeFullTokenFile('aurora', 'youtube', expiringSoon)));

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'refreshed_token',
        token_type: 'Bearer',
        expires_in: 3600,
      }),
    }));

    const { getValidYouTubeToken } = await import('../tokenManager');
    await getValidYouTubeToken('aurora');

    const saved = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    expect(saved.accounts.aurora.youtube.channelName).toBe('Aurora Music');
  });

  it('throws when YouTube not authorized for account', async () => {
    fs.writeFileSync(tokensPath, JSON.stringify({
      accounts: { aurora: {}, mono: {}, onyx: {} },
    }));

    const { getValidYouTubeToken } = await import('../tokenManager');
    await expect(getValidYouTubeToken('mono')).rejects.toThrow(
      'YouTube not authorized for mono account'
    );
  });

  it('throws immediately on invalid_grant error (no retry)', async () => {
    vi.stubEnv('YOUTUBE_CLIENT_ID', 'client_id');
    vi.stubEnv('YOUTUBE_CLIENT_SECRET', 'client_secret');

    const expiredToken = makeYouTubeTokens({
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    fs.writeFileSync(tokensPath, JSON.stringify(makeFullTokenFile('aurora', 'youtube', expiredToken)));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => '{"error":"invalid_grant","error_description":"Token has been expired"}',
    });
    vi.stubGlobal('fetch', mockFetch);

    const { getValidYouTubeToken } = await import('../tokenManager');
    await expect(getValidYouTubeToken('aurora')).rejects.toThrow('invalid');

    // Should stop after first failure (invalid_grant is permanent)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries up to 3 times on transient failures', async () => {
    vi.stubEnv('YOUTUBE_CLIENT_ID', 'client_id');
    vi.stubEnv('YOUTUBE_CLIENT_SECRET', 'client_secret');

    const expiredToken = makeYouTubeTokens({
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    fs.writeFileSync(tokensPath, JSON.stringify(makeFullTokenFile('aurora', 'youtube', expiredToken)));

    // Stub setTimeout to resolve immediately so retries don't take real time
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(
      (fn: TimerHandler) => {
        if (typeof fn === 'function') fn();
        return 0 as unknown as ReturnType<typeof setTimeout>;
      }
    );

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, text: async () => 'Server Error 500' }) // attempt 1
      .mockResolvedValueOnce({ ok: false, text: async () => 'Server Error 500' }) // attempt 2
      .mockResolvedValueOnce({                                                     // attempt 3
        ok: true,
        json: async () => ({ access_token: 'final_token', token_type: 'Bearer', expires_in: 3600 }),
      });
    vi.stubGlobal('fetch', mockFetch);

    const { getValidYouTubeToken } = await import('../tokenManager');
    const token = await getValidYouTubeToken('aurora');

    expect(token).toBe('final_token');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('throws after all 3 retries exhausted', async () => {
    vi.stubEnv('YOUTUBE_CLIENT_ID', 'client_id');
    vi.stubEnv('YOUTUBE_CLIENT_SECRET', 'client_secret');

    const expiredToken = makeYouTubeTokens({
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    fs.writeFileSync(tokensPath, JSON.stringify(makeFullTokenFile('aurora', 'youtube', expiredToken)));

    // Stub setTimeout to resolve immediately so retries don't take real time
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(
      (fn: TimerHandler) => {
        if (typeof fn === 'function') fn();
        return 0 as unknown as ReturnType<typeof setTimeout>;
      }
    );

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'Service Unavailable',
    });
    vi.stubGlobal('fetch', mockFetch);

    const { getValidYouTubeToken } = await import('../tokenManager');
    await expect(getValidYouTubeToken('aurora')).rejects.toThrow();

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('throws when YOUTUBE_CLIENT_ID is missing', async () => {
    vi.stubEnv('YOUTUBE_CLIENT_ID', '');
    vi.stubEnv('YOUTUBE_CLIENT_SECRET', 'secret');

    const expiredToken = makeYouTubeTokens({
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    fs.writeFileSync(tokensPath, JSON.stringify(makeFullTokenFile('aurora', 'youtube', expiredToken)));

    const { getValidYouTubeToken } = await import('../tokenManager');
    await expect(getValidYouTubeToken('aurora')).rejects.toThrow('YouTube credentials not configured');
  });

  it('works for mono and onyx accounts independently', async () => {
    const monoTokens = makeYouTubeTokens({ accessToken: 'mono_token' });
    const onyxTokens = makeYouTubeTokens({ accessToken: 'onyx_token' });

    fs.writeFileSync(tokensPath, JSON.stringify({
      accounts: {
        aurora: {},
        mono: { youtube: monoTokens },
        onyx: { youtube: onyxTokens },
      },
    }));

    const { getValidYouTubeToken } = await import('../tokenManager');
    expect(await getValidYouTubeToken('mono')).toBe('mono_token');
    expect(await getValidYouTubeToken('onyx')).toBe('onyx_token');
  });
});

// ---------------------------------------------------------------------------
// getValidTikTokToken
// ---------------------------------------------------------------------------

describe('getValidTikTokToken', () => {
  let tmpDir: string;
  let tokensPath: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-token-'));
    fs.mkdirSync(path.join(tmpDir, 'data'), { recursive: true });
    tokensPath = path.join(tmpDir, 'data', 'tokens.json');
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns existing token when not expired', async () => {
    const ttTokens = makeTikTokTokens();
    fs.writeFileSync(tokensPath, JSON.stringify(makeFullTokenFile('aurora', 'tiktok', ttTokens)));

    const { getValidTikTokToken } = await import('../tokenManager');
    const token = await getValidTikTokToken('aurora');

    expect(token).toBe('tt_access_current');
  });

  it('refreshes token when it is within the 5-minute expiry buffer', async () => {
    vi.stubEnv('TIKTOK_CLIENT_KEY', 'tk_key');
    vi.stubEnv('TIKTOK_CLIENT_SECRET', 'tk_secret');

    const expiringSoon = makeTikTokTokens({
      expiresAt: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
      accessToken: 'old_tt_access',
      refreshToken: 'old_tt_refresh',
    });
    fs.writeFileSync(tokensPath, JSON.stringify(makeFullTokenFile('aurora', 'tiktok', expiringSoon)));

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new_tt_access',
        refresh_token: 'new_tt_refresh',
        token_type: 'Bearer',
        expires_in: 86400,
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { getValidTikTokToken } = await import('../tokenManager');
    const token = await getValidTikTokToken('aurora');

    expect(token).toBe('new_tt_access');
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://open.tiktokapis.com/v2/oauth/token/');

    // Token was persisted with the new refresh token
    const saved = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    expect(saved.accounts.aurora.tiktok.accessToken).toBe('new_tt_access');
    expect(saved.accounts.aurora.tiktok.refreshToken).toBe('new_tt_refresh');
  });

  it('preserves openId and username after refresh', async () => {
    vi.stubEnv('TIKTOK_CLIENT_KEY', 'tk_key');
    vi.stubEnv('TIKTOK_CLIENT_SECRET', 'tk_secret');

    const expiringSoon = makeTikTokTokens({
      expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      openId: 'my_open_id',
      username: 'my_username',
    });
    fs.writeFileSync(tokensPath, JSON.stringify(makeFullTokenFile('aurora', 'tiktok', expiringSoon)));

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'refreshed',
        refresh_token: 'new_refresh',
        token_type: 'Bearer',
        expires_in: 86400,
      }),
    }));

    const { getValidTikTokToken } = await import('../tokenManager');
    await getValidTikTokToken('aurora');

    const saved = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    expect(saved.accounts.aurora.tiktok.openId).toBe('my_open_id');
    expect(saved.accounts.aurora.tiktok.username).toBe('my_username');
  });

  it('throws when TikTok not authorized for account', async () => {
    fs.writeFileSync(tokensPath, JSON.stringify({
      accounts: { aurora: {}, mono: {}, onyx: {} },
    }));

    const { getValidTikTokToken } = await import('../tokenManager');
    await expect(getValidTikTokToken('onyx')).rejects.toThrow(
      'TikTok not authorized for onyx account'
    );
  });

  it('throws when refresh fails', async () => {
    vi.stubEnv('TIKTOK_CLIENT_KEY', 'tk_key');
    vi.stubEnv('TIKTOK_CLIENT_SECRET', 'tk_secret');

    const expiredToken = makeTikTokTokens({
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    fs.writeFileSync(tokensPath, JSON.stringify(makeFullTokenFile('mono', 'tiktok', expiredToken)));

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => 'Token revoked',
    }));

    const { getValidTikTokToken } = await import('../tokenManager');
    await expect(getValidTikTokToken('mono')).rejects.toThrow('Failed to refresh TikTok token');
  });

  it('throws when TIKTOK_CLIENT_KEY is missing', async () => {
    vi.stubEnv('TIKTOK_CLIENT_KEY', '');
    vi.stubEnv('TIKTOK_CLIENT_SECRET', 'secret');

    const expiredToken = makeTikTokTokens({
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    fs.writeFileSync(tokensPath, JSON.stringify(makeFullTokenFile('aurora', 'tiktok', expiredToken)));

    const { getValidTikTokToken } = await import('../tokenManager');
    await expect(getValidTikTokToken('aurora')).rejects.toThrow('TikTok credentials not configured');
  });
});

// ---------------------------------------------------------------------------
// getAllAccountsStatus
// ---------------------------------------------------------------------------

describe('getAllAccountsStatus', () => {
  let tmpDir: string;
  let tokensPath: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'status-test-'));
    fs.mkdirSync(path.join(tmpDir, 'data'), { recursive: true });
    tokensPath = path.join(tmpDir, 'data', 'tokens.json');
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    vi.resetModules();
  });

  it('returns all false when no tokens exist', async () => {
    // No tokens.json file at all
    const { getAllAccountsStatus } = await import('../tokenManager');
    const status = getAllAccountsStatus();

    expect(status.aurora.youtube).toBe(false);
    expect(status.aurora.tiktok).toBe(false);
    expect(status.mono.youtube).toBe(false);
    expect(status.mono.tiktok).toBe(false);
    expect(status.onyx.youtube).toBe(false);
    expect(status.onyx.tiktok).toBe(false);
  });

  it('returns true only for connected platforms', async () => {
    fs.writeFileSync(tokensPath, JSON.stringify({
      accounts: {
        aurora: {
          youtube: makeYouTubeTokens(),
          tiktok: makeTikTokTokens(),
        },
        mono: {
          youtube: makeYouTubeTokens(),
        },
        onyx: {},
      },
    }));

    const { getAllAccountsStatus } = await import('../tokenManager');
    const status = getAllAccountsStatus();

    expect(status.aurora.youtube).toBe(true);
    expect(status.aurora.tiktok).toBe(true);
    expect(status.mono.youtube).toBe(true);
    expect(status.mono.tiktok).toBe(false);
    expect(status.onyx.youtube).toBe(false);
    expect(status.onyx.tiktok).toBe(false);
  });

  it('returns false for an account that has a null/empty entry', async () => {
    fs.writeFileSync(tokensPath, JSON.stringify({
      accounts: {
        aurora: { youtube: null },
        mono: {},
        onyx: {},
      },
    }));

    const { getAllAccountsStatus } = await import('../tokenManager');
    const status = getAllAccountsStatus();

    expect(status.aurora.youtube).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// saveTokens — atomic write verification
// ---------------------------------------------------------------------------

describe('saveTokens', () => {
  let tmpDir: string;
  let tokensPath: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'savetok-'));
    fs.mkdirSync(path.join(tmpDir, 'data'), { recursive: true });
    tokensPath = path.join(tmpDir, 'data', 'tokens.json');
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    vi.resetModules();
  });

  it('writes valid JSON to the tokens file', async () => {
    const { saveTokens } = await import('../tokenManager');

    const tokens = {
      accounts: {
        aurora: { youtube: makeYouTubeTokens() },
        mono: {},
        onyx: {},
      },
    };

    saveTokens(tokens);

    const saved = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    expect(saved.accounts.aurora.youtube.accessToken).toBe('yt_access_current');
  });

  it('creates the data directory if it does not exist', async () => {
    // Remove the data dir
    fs.rmdirSync(path.join(tmpDir, 'data'));

    const { saveTokens } = await import('../tokenManager');
    const tokens = { accounts: { aurora: {}, mono: {}, onyx: {} } };

    // Should not throw
    expect(() => saveTokens(tokens)).not.toThrow();
    expect(fs.existsSync(tokensPath)).toBe(true);
  });

  it('overwrites existing tokens correctly', async () => {
    const initial = { accounts: { aurora: { youtube: makeYouTubeTokens({ accessToken: 'old' }) }, mono: {}, onyx: {} } };
    fs.writeFileSync(tokensPath, JSON.stringify(initial));

    const { saveTokens } = await import('../tokenManager');
    const updated = { accounts: { aurora: { youtube: makeYouTubeTokens({ accessToken: 'new' }) }, mono: {}, onyx: {} } };
    saveTokens(updated);

    const saved = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    expect(saved.accounts.aurora.youtube.accessToken).toBe('new');
  });

  it('does not leave temp files behind after a write', async () => {
    const { saveTokens } = await import('../tokenManager');
    saveTokens({ accounts: { aurora: {}, mono: {}, onyx: {} } });

    const dataDir = path.join(tmpDir, 'data');
    const files = fs.readdirSync(dataDir);
    const tmpFiles = files.filter((f) => f.includes('.tmp.'));
    expect(tmpFiles).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getAccountInfo
// ---------------------------------------------------------------------------

describe('getAccountInfo', () => {
  let tmpDir: string;
  let tokensPath: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'acctinfo-'));
    fs.mkdirSync(path.join(tmpDir, 'data'), { recursive: true });
    tokensPath = path.join(tmpDir, 'data', 'tokens.json');
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    vi.resetModules();
  });

  it('returns channel name and username for connected accounts', async () => {
    fs.writeFileSync(tokensPath, JSON.stringify({
      accounts: {
        aurora: {
          youtube: makeYouTubeTokens({ channelName: 'Aurora Music' }),
          tiktok: makeTikTokTokens({ username: 'aurora.beats' }),
        },
        mono: {
          youtube: makeYouTubeTokens({ channelName: 'Mono Vibes' }),
        },
        onyx: {},
      },
    }));

    const { getAccountInfo } = await import('../tokenManager');
    const info = getAccountInfo();

    expect(info.aurora.youtubeName).toBe('Aurora Music');
    expect(info.aurora.tiktokName).toBe('aurora.beats');
    expect(info.mono.youtubeName).toBe('Mono Vibes');
    expect(info.mono.tiktokName).toBeUndefined();
    expect(info.onyx.youtubeName).toBeUndefined();
    expect(info.onyx.tiktokName).toBeUndefined();
  });

  it('returns undefined names when no tokens file exists', async () => {
    const { getAccountInfo } = await import('../tokenManager');
    const info = getAccountInfo();

    expect(info.aurora.youtubeName).toBeUndefined();
    expect(info.aurora.tiktokName).toBeUndefined();
  });
});
