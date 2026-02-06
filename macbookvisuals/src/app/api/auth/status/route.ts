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
      accountsStatus.nova.youtube ||
      accountsStatus.nova.tiktok;

    return NextResponse.json({
      authenticated,
      accounts: {
        aurora: {
          youtube: accountsStatus.aurora.youtube,
          tiktok: accountsStatus.aurora.tiktok,
          youtubeName: accountInfo.aurora.youtubeName || 'Aurora YouTube',
          tiktokName: accountInfo.aurora.tiktokName || 'Aurora TikTok',
        },
        nova: {
          youtube: accountsStatus.nova.youtube,
          tiktok: accountsStatus.nova.tiktok,
          youtubeName: accountInfo.nova.youtubeName || 'Nova YouTube',
          tiktokName: accountInfo.nova.tiktokName || 'Nova TikTok',
        },
      },
      // Legacy format for backwards compatibility
      platforms: {
        youtube: accountsStatus.aurora.youtube || accountsStatus.nova.youtube,
        tiktok: accountsStatus.aurora.tiktok || accountsStatus.nova.tiktok,
      },
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json({
      authenticated: false,
      accounts: {
        aurora: { youtube: false, tiktok: false },
        nova: { youtube: false, tiktok: false },
      },
      platforms: { youtube: false, tiktok: false },
    });
  }
}
