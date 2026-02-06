// src/app/api/auth/tiktok/authorise/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  return { codeVerifier, codeChallenge };
}

/**
 * GET /api/auth/tiktok/authorise?account=aurora|nova
 * Redirects user to TikTok OAuth consent screen
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const account = searchParams.get('account') || 'aurora';
  
  // Validate account
  if (account !== 'aurora' && account !== 'nova') {
    return NextResponse.json(
      { error: 'Invalid account. Must be "aurora" or "nova"' },
      { status: 400 }
    );
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  
  if (!clientKey) {
    return NextResponse.json(
      { error: 'TikTok Client Key not configured' },
      { status: 500 }
    );
  }

  // OAuth scopes needed for video uploads
  const scopes = [
    'user.info.basic',
    'video.upload',
    'video.publish'
  ].join(',');

  // Redirect URI (must match what's in TikTok Developer Portal)
  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://macbookvisuals.com/api/auth/callback/tiktok'
    : 'http://localhost:3000/api/auth/callback/tiktok';

  // Generate PKCE values
  const { codeVerifier, codeChallenge } = generatePKCE();
  
  // Generate random state that includes account info
  const stateData = JSON.stringify({ 
    account, 
    csrf: crypto.randomBytes(16).toString('base64url') 
  });
  const state = Buffer.from(stateData).toString('base64url');

  // Build TikTok OAuth URL
  const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
  authUrl.searchParams.set('client_key', clientKey);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  console.log(`Redirecting to TikTok OAuth for account: ${account}`);

  // Create response with redirect
  const response = NextResponse.redirect(authUrl.toString());
  
  // Store code_verifier in cookie
  response.cookies.set('tiktok_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  });
  
  // Store state in cookie for CSRF protection
  response.cookies.set('tiktok_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
  });

  return response;
}
