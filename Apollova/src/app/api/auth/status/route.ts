// src/app/api/auth/status/route.ts
import { NextResponse } from 'next/server';
import { getAllAccountsStatus, getAccountInfo } from '@/utils/tokenManager';

/**
 * GET /api/auth/status
 * Check auth status for all accounts
 */
export async function GET() {
  try {
    const accountsStatus = getAllAccountsStatus();
    const accountInfo = getAccountInfo();
    
    // Check if at least one platform is connected on any account
    const authenticated = 
      accountsStatus.aurora.youtube || 
      accountsStatus.aurora.tiktok ||
      accountsStatus.mono.youtube ||
      accountsStatus.mono.tiktok ||
      accountsStatus.onyx.youtube ||
      accountsStatus.onyx.tiktok;

    return NextResponse.json({
      authenticated,
      accounts: {
        aurora: {
          youtube: accountsStatus.aurora.youtube,
          tiktok: accountsStatus.aurora.tiktok,
          youtubeName: accountInfo.aurora.youtubeName || 'Aurora YouTube',
          tiktokName: accountInfo.aurora.tiktokName || 'Aurora TikTok',
        },
        mono: {
          youtube: accountsStatus.mono.youtube,
          tiktok: accountsStatus.mono.tiktok,
          youtubeName: accountInfo.mono.youtubeName || 'Mono YouTube',
          tiktokName: accountInfo.mono.tiktokName || 'Mono TikTok',
        },
        onyx: {
          youtube: accountsStatus.onyx.youtube,
          tiktok: accountsStatus.onyx.tiktok,
          youtubeName: accountInfo.onyx.youtubeName || 'Onyx YouTube',
          tiktokName: accountInfo.onyx.tiktokName || 'Onyx TikTok',
        },
      },
      // Legacy format for backwards compatibility
      platforms: {
        youtube: accountsStatus.aurora.youtube || accountsStatus.mono.youtube || accountsStatus.onyx.youtube,
        tiktok: accountsStatus.aurora.tiktok || accountsStatus.mono.tiktok || accountsStatus.onyx.tiktok,
      },
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json({
      authenticated: false,
      accounts: {
        aurora: { youtube: false, tiktok: false },
        mono: { youtube: false, tiktok: false },
        onyx: { youtube: false, tiktok: false },
      },
      platforms: { youtube: false, tiktok: false },
    });
  }
}
