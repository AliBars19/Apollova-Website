import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// We test the exported functions by dynamically importing to control env/state.
// For tokenManager, the TOKENS_FILE is at process.cwd()/data/tokens.json.

describe('tokenManager', () => {
  let tmpDir: string;
  let tokensPath: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tokenmanager-'));
    fs.mkdirSync(path.join(tmpDir, 'data'), { recursive: true });
    tokensPath = path.join(tmpDir, 'data', 'tokens.json');
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    vi.resetModules();
  });

  it('loadTokens returns empty structure when file missing', async () => {
    const { loadTokens } = await import('../tokenManager');
    const tokens = loadTokens();
    expect(tokens.accounts).toBeDefined();
    expect(tokens.accounts.aurora).toBeDefined();
    expect(tokens.accounts.mono).toBeDefined();
    expect(tokens.accounts.onyx).toBeDefined();
  });

  it('loadTokens migrates from single-account format', async () => {
    const oldFormat = {
      youtube: { accessToken: 'yt_tok', refreshToken: 'yt_ref', expiresAt: '2025-01-01', tokenType: 'Bearer' },
    };
    fs.writeFileSync(tokensPath, JSON.stringify(oldFormat));

    const { loadTokens } = await import('../tokenManager');
    const tokens = loadTokens();
    expect(tokens.accounts.aurora.youtube?.accessToken).toBe('yt_tok');
  });

  it('loadTokens handles corrupt JSON', async () => {
    fs.writeFileSync(tokensPath, 'not valid json');
    const { loadTokens } = await import('../tokenManager');
    const tokens = loadTokens();
    expect(tokens.accounts).toBeDefined();
  });

  it('disconnectPlatform removes correct platform', async () => {
    const data = {
      accounts: {
        aurora: { youtube: { accessToken: 'tok', refreshToken: 'ref', expiresAt: '2025-01-01', tokenType: 'Bearer' } },
        mono: {},
        onyx: {},
      },
    };
    fs.writeFileSync(tokensPath, JSON.stringify(data));

    const { disconnectPlatform, loadTokens } = await import('../tokenManager');
    disconnectPlatform('aurora', 'youtube');
    const tokens = loadTokens();
    expect(tokens.accounts.aurora.youtube).toBeUndefined();
  });

  it('disconnectPlatform noop when already disconnected', async () => {
    const data = {
      accounts: { aurora: {}, mono: {}, onyx: {} },
    };
    fs.writeFileSync(tokensPath, JSON.stringify(data));

    const { disconnectPlatform, loadTokens } = await import('../tokenManager');
    disconnectPlatform('aurora', 'tiktok');
    const tokens = loadTokens();
    expect(tokens.accounts.aurora.tiktok).toBeUndefined();
  });
});
