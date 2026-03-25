// src/app/api/auth/__tests__/status.test.ts
//
// Integration tests for GET /api/auth/status
//
// Strategy:
//   - Mock getAllAccountsStatus and getAccountInfo from tokenManager.
//   - Verify that the response correctly aggregates connection state
//     across all three accounts (aurora, mono, onyx) for both platforms.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/utils/tokenManager', () => ({
  getAllAccountsStatus: vi.fn(),
  getAccountInfo: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Route + mock imports
// ---------------------------------------------------------------------------

import { GET } from '../status/route';
import { getAllAccountsStatus, getAccountInfo } from '@/utils/tokenManager';

const mockGetAllAccountsStatus = vi.mocked(getAllAccountsStatus);
const mockGetAccountInfo = vi.mocked(getAccountInfo);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function allDisconnected() {
  return {
    aurora: { youtube: false, tiktok: false },
    mono:   { youtube: false, tiktok: false },
    onyx:   { youtube: false, tiktok: false },
  };
}

function allConnected() {
  return {
    aurora: { youtube: true,  tiktok: true  },
    mono:   { youtube: true,  tiktok: true  },
    onyx:   { youtube: true,  tiktok: true  },
  };
}

function emptyAccountInfo() {
  return {
    aurora: {},
    mono:   {},
    onyx:   {},
  };
}

function namedAccountInfo() {
  return {
    aurora: { youtubeName: 'Aurora YT', tiktokName: 'aurora_tt' },
    mono:   { youtubeName: 'Mono YT',   tiktokName: 'mono_tt'   },
    onyx:   { youtubeName: 'Onyx YT',   tiktokName: 'onyx_tt'   },
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAllAccountsStatus.mockReturnValue(allDisconnected());
  mockGetAccountInfo.mockReturnValue(emptyAccountInfo());
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Response structure
// ---------------------------------------------------------------------------

describe('GET /api/auth/status — response structure', () => {
  it('returns 200', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('response includes authenticated, accounts, and platforms fields', async () => {
    const res = await GET();
    const body = await res.json();

    expect(body).toHaveProperty('authenticated');
    expect(body).toHaveProperty('accounts');
    expect(body).toHaveProperty('platforms');
  });

  it('accounts object has aurora, mono, onyx keys', async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.accounts).toHaveProperty('aurora');
    expect(body.accounts).toHaveProperty('mono');
    expect(body.accounts).toHaveProperty('onyx');
  });

  it('each account has youtube and tiktok boolean fields', async () => {
    const res = await GET();
    const body = await res.json();

    for (const acct of ['aurora', 'mono', 'onyx'] as const) {
      expect(typeof body.accounts[acct].youtube).toBe('boolean');
      expect(typeof body.accounts[acct].tiktok).toBe('boolean');
    }
  });
});

// ---------------------------------------------------------------------------
// No tokens — all false
// ---------------------------------------------------------------------------

describe('GET /api/auth/status — all disconnected', () => {
  it('returns authenticated=false when no account has any token', async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.authenticated).toBe(false);
  });

  it('returns all account connection flags as false', async () => {
    const res = await GET();
    const body = await res.json();

    for (const acct of ['aurora', 'mono', 'onyx'] as const) {
      expect(body.accounts[acct].youtube).toBe(false);
      expect(body.accounts[acct].tiktok).toBe(false);
    }
  });

  it('returns platforms.youtube=false and platforms.tiktok=false', async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.platforms.youtube).toBe(false);
    expect(body.platforms.tiktok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Single account connected
// ---------------------------------------------------------------------------

describe('GET /api/auth/status — single account connected', () => {
  it('returns authenticated=true when aurora YouTube is connected', async () => {
    mockGetAllAccountsStatus.mockReturnValue({
      aurora: { youtube: true,  tiktok: false },
      mono:   { youtube: false, tiktok: false },
      onyx:   { youtube: false, tiktok: false },
    });

    const res = await GET();
    const body = await res.json();

    expect(body.authenticated).toBe(true);
    expect(body.accounts.aurora.youtube).toBe(true);
    expect(body.platforms.youtube).toBe(true);
  });

  it('returns authenticated=true when mono TikTok is connected', async () => {
    mockGetAllAccountsStatus.mockReturnValue({
      aurora: { youtube: false, tiktok: false },
      mono:   { youtube: false, tiktok: true  },
      onyx:   { youtube: false, tiktok: false },
    });

    const res = await GET();
    const body = await res.json();

    expect(body.authenticated).toBe(true);
    expect(body.accounts.mono.tiktok).toBe(true);
    expect(body.platforms.tiktok).toBe(true);
  });

  it('returns platforms.youtube=false when only TikTok is connected', async () => {
    mockGetAllAccountsStatus.mockReturnValue({
      aurora: { youtube: false, tiktok: true  },
      mono:   { youtube: false, tiktok: false },
      onyx:   { youtube: false, tiktok: false },
    });

    const res = await GET();
    const body = await res.json();

    expect(body.platforms.youtube).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// All accounts fully connected
// ---------------------------------------------------------------------------

describe('GET /api/auth/status — all connected', () => {
  it('returns authenticated=true when all accounts are connected', async () => {
    mockGetAllAccountsStatus.mockReturnValue(allConnected());

    const res = await GET();
    const body = await res.json();

    expect(body.authenticated).toBe(true);
  });

  it('returns all account flags as true', async () => {
    mockGetAllAccountsStatus.mockReturnValue(allConnected());

    const res = await GET();
    const body = await res.json();

    for (const acct of ['aurora', 'mono', 'onyx'] as const) {
      expect(body.accounts[acct].youtube).toBe(true);
      expect(body.accounts[acct].tiktok).toBe(true);
    }
  });

  it('returns platforms.youtube=true and platforms.tiktok=true', async () => {
    mockGetAllAccountsStatus.mockReturnValue(allConnected());

    const res = await GET();
    const body = await res.json();

    expect(body.platforms.youtube).toBe(true);
    expect(body.platforms.tiktok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Account names (falls back to defaults when missing)
// ---------------------------------------------------------------------------

describe('GET /api/auth/status — account name fields', () => {
  it('uses channel/username names from getAccountInfo when available', async () => {
    mockGetAccountInfo.mockReturnValue(namedAccountInfo());

    const res = await GET();
    const body = await res.json();

    expect(body.accounts.aurora.youtubeName).toBe('Aurora YT');
    expect(body.accounts.aurora.tiktokName).toBe('aurora_tt');
    expect(body.accounts.mono.youtubeName).toBe('Mono YT');
    expect(body.accounts.onyx.tiktokName).toBe('onyx_tt');
  });

  it('falls back to default names when getAccountInfo returns empty objects', async () => {
    mockGetAccountInfo.mockReturnValue(emptyAccountInfo());

    const res = await GET();
    const body = await res.json();

    expect(body.accounts.aurora.youtubeName).toBe('Aurora YouTube');
    expect(body.accounts.aurora.tiktokName).toBe('Aurora TikTok');
    expect(body.accounts.mono.youtubeName).toBe('Mono YouTube');
    expect(body.accounts.onyx.tiktokName).toBe('Onyx TikTok');
  });
});

// ---------------------------------------------------------------------------
// Error fallback
// ---------------------------------------------------------------------------

describe('GET /api/auth/status — error fallback', () => {
  it('returns a safe disconnected response when getAllAccountsStatus throws', async () => {
    mockGetAllAccountsStatus.mockImplementation(() => {
      throw new Error('Token file corrupted');
    });

    const res = await GET();
    const body = await res.json();

    // Should not throw — returns safe defaults
    expect(res.status).toBe(200);
    expect(body.authenticated).toBe(false);
    expect(body.platforms.youtube).toBe(false);
    expect(body.platforms.tiktok).toBe(false);
  });
});
