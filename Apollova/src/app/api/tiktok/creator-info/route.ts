// src/app/api/tiktok/creator-info/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getValidTikTokToken, AccountId } from '@/utils/tokenManager';

/**
 * GET /api/tiktok/creator-info?account=aurora|nova
 * Fetches TikTok creator information required for Direct Post compliance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const account = (searchParams.get('account') || 'aurora') as AccountId;

    // Validate account
    if (account !== 'aurora' && account !== 'mono') {
      return NextResponse.json(
        { error: 'Invalid account. Must be "aurora" or "mono"' },
        { status: 400 }
      );
    }

    const accessToken = await getValidTikTokToken(account);

    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Creator info failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch creator info', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      ok: true,
      account: account,
      creatorInfo: data.data.creator_info,
    });

  } catch (error) {
    console.error('Creator info error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}