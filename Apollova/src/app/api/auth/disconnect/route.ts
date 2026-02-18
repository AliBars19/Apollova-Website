// src/app/api/auth/disconnect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { disconnectPlatform, AccountId } from '@/utils/tokenManager';

/**
 * POST /api/auth/disconnect
 * Disconnect a specific platform from a specific account
 * Body: { account: 'aurora' | 'mono' | 'onyx', platform: 'youtube' | 'tiktok' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account, platform } = body;

    // Validate account
    if (!account || !['aurora', 'mono', 'onyx'].includes(account)) {
      return NextResponse.json(
        { error: 'Invalid account. Must be "aurora", "mono", or "onyx"' },
        { status: 400 }
      );
    }

    // Validate platform
    if (!platform || !['youtube', 'tiktok'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be "youtube" or "tiktok"' },
        { status: 400 }
      );
    }

    // Disconnect the platform
    disconnectPlatform(account as AccountId, platform as 'youtube' | 'tiktok');

    console.log(`Disconnected ${platform} from ${account} account`);

    return NextResponse.json({
      success: true,
      message: `${platform} disconnected from ${account} account`,
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to disconnect platform',
      },
      { status: 500 }
    );
  }
}
