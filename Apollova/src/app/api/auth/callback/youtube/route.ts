// src/app/api/auth/callback/youtube/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loadTokens, saveTokens, AccountId } from '@/utils/tokenManager';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state'); // Account ID passed from authorize

  // Validate account from state
  const account: AccountId = (state === 'aurora' || state === 'mono' || state === 'onyx') ? state : 'aurora';

  // Handle user denial
  if (error) {
    console.error('YouTube OAuth error:', error);
    return NextResponse.json(
      { error: 'Authorization denied by user' },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code provided' },
      { status: 400 }
    );
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'YouTube credentials not configured' },
      { status: 500 }
    );
  }

  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://macbookvisuals.com/api/auth/callback/youtube'
    : 'http://localhost:3000/api/auth/callback/youtube';

  try {
    console.log(`Exchanging code for YouTube tokens (account: ${account})...`);

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange code for token');
    }

    const tokens = await tokenResponse.json();
    console.log('YouTube tokens received successfully');

    // Get channel name
    let channelName = '';
    try {
      const channelResponse = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      );
      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        if (channelData.items && channelData.items.length > 0) {
          channelName = channelData.items[0].snippet.title;
          console.log(`Channel name: ${channelName}`);
        }
      }
    } catch (e) {
      console.error('Failed to get channel name:', e);
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Prepare token data
    const youtubeTokenData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: expiresAt,
      tokenType: tokens.token_type,
      channelName: channelName,
    };

    // Load existing tokens and update the specific account
    const allTokens = loadTokens();
    allTokens.accounts[account].youtube = youtubeTokenData;
    saveTokens(allTokens);

    console.log(`YouTube tokens saved for account: ${account}`);

    // Redirect to success page
    const successUrl = process.env.NODE_ENV === 'production'
      ? `https://macbookvisuals.com/auth-success?platform=youtube&account=${account}`
      : `http://localhost:3000/auth-success?platform=youtube&account=${account}`;

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('Error during YouTube OAuth:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete authorization',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
