// src/app/api/auth/callback/tiktok/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loadTokens, saveTokens, AccountId } from '@/utils/tokenManager';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle user denial
  if (error) {
    console.error('TikTok OAuth error:', error);
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

  // Verify state for CSRF protection
  const savedState = request.cookies.get('tiktok_state')?.value;
  if (!savedState || savedState !== state) {
    console.error('State mismatch - possible CSRF attack');
    return NextResponse.json(
      { error: 'Invalid state parameter' },
      { status: 400 }
    );
  }

  // Parse account from state
  let account: AccountId = 'aurora';
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    if (stateData.account === 'aurora' || stateData.account === 'mono' || stateData.account === 'onyx') {
      account = stateData.account;
    }
  } catch (e) {
    console.error('Failed to parse state, defaulting to aurora');
  }

  // Get code_verifier from cookie
  const codeVerifier = request.cookies.get('tiktok_code_verifier')?.value;
  if (!codeVerifier) {
    console.error('Code verifier not found in cookies');
    return NextResponse.json(
      { error: 'Code verifier missing - try authorizing again' },
      { status: 400 }
    );
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    return NextResponse.json(
      { error: 'TikTok credentials not configured' },
      { status: 500 }
    );
  }

  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://macbookvisuals.com/api/auth/callback/tiktok'
    : 'http://localhost:3000/api/auth/callback/tiktok';

  try {
    console.log(`Exchanging code for TikTok tokens (account: ${account})...`);

    // Exchange authorization code for access token (with PKCE)
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange code for token');
    }

    const tokens = await tokenResponse.json();
    console.log('TikTok tokens received successfully');

    // Get username
    let username = '';
    try {
      const userResponse = await fetch(
        'https://open.tiktokapis.com/v2/user/info/?fields=display_name,username',
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      );
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.data && userData.data.user) {
          username = userData.data.user.username || userData.data.user.display_name || '';
          console.log(`TikTok username: ${username}`);
        }
      }
    } catch (e) {
      console.error('Failed to get TikTok username:', e);
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Prepare token data
    const tiktokTokenData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: expiresAt,
      tokenType: tokens.token_type,
      openId: tokens.open_id,
      username: username,
    };

    // Load existing tokens and update the specific account
    const allTokens = loadTokens();
    allTokens.accounts[account].tiktok = tiktokTokenData;
    saveTokens(allTokens);

    console.log(`TikTok tokens saved for account: ${account}`);

    // Create response and clear cookies
    const successUrl = process.env.NODE_ENV === 'production'
      ? `https://macbookvisuals.com/auth-success?platform=tiktok&account=${account}`
      : `http://localhost:3000/auth-success?platform=tiktok&account=${account}`;
    
    const response = NextResponse.redirect(successUrl);
    
    response.cookies.delete('tiktok_code_verifier');
    response.cookies.delete('tiktok_state');
    
    return response;
  } catch (error) {
    console.error('Error during TikTok OAuth:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete authorization',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
