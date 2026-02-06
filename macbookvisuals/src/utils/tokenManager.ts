// src/utils/tokenManager.ts
import fs from 'fs';
import path from 'path';

const TOKENS_FILE = path.join(process.cwd(), 'data', 'tokens.json');

// Account identifiers
export type AccountId = 'aurora' | 'nova';

export interface YouTubeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: string;
  channelName?: string;
}

export interface TikTokTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: string;
  openId?: string;
  username?: string;
}

export interface AccountTokens {
  youtube?: YouTubeTokens;
  tiktok?: TikTokTokens;
}

export interface AllTokens {
  // Multi-account structure
  accounts: {
    aurora: AccountTokens;
    nova: AccountTokens;
  };
  // Legacy single-account (for backwards compatibility)
  youtube?: YouTubeTokens;
  tiktok?: TikTokTokens;
}

/**
 * Initialize empty token structure
 */
function getEmptyTokens(): AllTokens {
  return {
    accounts: {
      aurora: {},
      nova: {},
    },
  };
}

/**
 * Load all tokens from file
 */
export function loadTokens(): AllTokens {
  if (!fs.existsSync(TOKENS_FILE)) {
    return getEmptyTokens();
  }

  try {
    const data = fs.readFileSync(TOKENS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Migrate old single-account format to multi-account
    if (!parsed.accounts) {
      const migrated: AllTokens = getEmptyTokens();
      // Put old tokens in 'aurora' account by default
      if (parsed.youtube) {
        migrated.accounts.aurora.youtube = parsed.youtube;
      }
      if (parsed.tiktok) {
        migrated.accounts.aurora.tiktok = parsed.tiktok;
      }
      // Save migrated format
      saveTokens(migrated);
      return migrated;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error loading tokens:', error);
    return getEmptyTokens();
  }
}

/**
 * Save tokens to file
 */
export function saveTokens(tokens: AllTokens): void {
  const dataDir = path.dirname(TOKENS_FILE);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
  console.log('Tokens saved successfully');
}

/**
 * Get tokens for a specific account
 */
export function getAccountTokens(accountId: AccountId): AccountTokens {
  const tokens = loadTokens();
  return tokens.accounts[accountId] || {};
}

/**
 * Save tokens for a specific account
 */
export function saveAccountTokens(accountId: AccountId, accountTokens: AccountTokens): void {
  const tokens = loadTokens();
  tokens.accounts[accountId] = {
    ...tokens.accounts[accountId],
    ...accountTokens,
  };
  saveTokens(tokens);
}

/**
 * Check if YouTube token is expired for an account
 */
export function isYouTubeTokenExpired(accountId: AccountId): boolean {
  const accountTokens = getAccountTokens(accountId);
  if (!accountTokens.youtube) return true;
  
  const expiresAt = new Date(accountTokens.youtube.expiresAt);
  const now = new Date();
  
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  return expiresAt.getTime() - now.getTime() < bufferTime;
}

/**
 * Check if TikTok token is expired for an account
 */
export function isTikTokTokenExpired(accountId: AccountId): boolean {
  const accountTokens = getAccountTokens(accountId);
  if (!accountTokens.tiktok) return true;
  
  const expiresAt = new Date(accountTokens.tiktok.expiresAt);
  const now = new Date();
  
  const bufferTime = 5 * 60 * 1000;
  return expiresAt.getTime() - now.getTime() < bufferTime;
}

/**
 * Refresh YouTube access token
 */
export async function refreshYouTubeToken(refreshToken: string): Promise<YouTubeTokens> {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('YouTube credentials not configured');
  }

  console.log('Refreshing YouTube access token...');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('YouTube token refresh failed:', errorData);
    throw new Error('Failed to refresh YouTube token');
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  return {
    accessToken: data.access_token,
    refreshToken: refreshToken,
    expiresAt: expiresAt,
    tokenType: data.token_type,
  };
}

/**
 * Get valid YouTube access token for an account (refreshes if needed)
 */
export async function getValidYouTubeToken(accountId: AccountId): Promise<string> {
  const accountTokens = getAccountTokens(accountId);

  if (!accountTokens.youtube) {
    throw new Error(`YouTube not authorized for ${accountId} account. Please authorize first.`);
  }

  if (isYouTubeTokenExpired(accountId)) {
    console.log(`YouTube token expired for ${accountId}, refreshing...`);
    
    const newTokens = await refreshYouTubeToken(accountTokens.youtube.refreshToken);
    
    // Preserve channel name
    newTokens.channelName = accountTokens.youtube.channelName;
    
    // Save updated tokens
    const tokens = loadTokens();
    tokens.accounts[accountId].youtube = newTokens;
    saveTokens(tokens);
    
    return newTokens.accessToken;
  }

  return accountTokens.youtube.accessToken;
}

/**
 * Refresh TikTok access token
 */
export async function refreshTikTokToken(refreshToken: string): Promise<TikTokTokens> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    throw new Error('TikTok credentials not configured');
  }

  console.log('Refreshing TikTok access token...');

  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('TikTok token refresh failed:', errorData);
    throw new Error('Failed to refresh TikTok token');
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: expiresAt,
    tokenType: data.token_type,
  };
}

/**
 * Get valid TikTok access token for an account (refreshes if needed)
 */
export async function getValidTikTokToken(accountId: AccountId): Promise<string> {
  const accountTokens = getAccountTokens(accountId);

  if (!accountTokens.tiktok) {
    throw new Error(`TikTok not authorized for ${accountId} account. Please authorize first.`);
  }

  if (isTikTokTokenExpired(accountId)) {
    console.log(`TikTok token expired for ${accountId}, refreshing...`);
    
    const newTokens = await refreshTikTokToken(accountTokens.tiktok.refreshToken);
    
    // Preserve openId and username
    newTokens.openId = accountTokens.tiktok.openId;
    newTokens.username = accountTokens.tiktok.username;
    
    // Save updated tokens
    const tokens = loadTokens();
    tokens.accounts[accountId].tiktok = newTokens;
    saveTokens(tokens);
    
    return newTokens.accessToken;
  }

  return accountTokens.tiktok.accessToken;
}

/**
 * Get connection status for all accounts
 */
export function getAllAccountsStatus(): {
  aurora: { youtube: boolean; tiktok: boolean };
  nova: { youtube: boolean; tiktok: boolean };
} {
  const tokens = loadTokens();
  
  return {
    aurora: {
      youtube: !!tokens.accounts.aurora?.youtube,
      tiktok: !!tokens.accounts.aurora?.tiktok,
    },
    nova: {
      youtube: !!tokens.accounts.nova?.youtube,
      tiktok: !!tokens.accounts.nova?.tiktok,
    },
  };
}

/**
 * Get account info (channel names, usernames)
 */
export function getAccountInfo(): {
  aurora: { youtubeName?: string; tiktokName?: string };
  nova: { youtubeName?: string; tiktokName?: string };
} {
  const tokens = loadTokens();
  
  return {
    aurora: {
      youtubeName: tokens.accounts.aurora?.youtube?.channelName,
      tiktokName: tokens.accounts.aurora?.tiktok?.username,
    },
    nova: {
      youtubeName: tokens.accounts.nova?.youtube?.channelName,
      tiktokName: tokens.accounts.nova?.tiktok?.username,
    },
  };
}

/**
 * Disconnect a platform from an account
 */
export function disconnectPlatform(accountId: AccountId, platform: 'youtube' | 'tiktok'): void {
  const tokens = loadTokens();
  if (tokens.accounts[accountId]) {
    delete tokens.accounts[accountId][platform];
    saveTokens(tokens);
  }
}
