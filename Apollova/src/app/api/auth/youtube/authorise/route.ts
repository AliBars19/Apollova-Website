// src/app/api/auth/youtube/authorise/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const account = searchParams.get('account') || 'aurora';
  
  // Validate account
  if (account !== 'aurora' && account !== 'mono' && account !== 'onyx') {
    return NextResponse.json(
      { error: 'Invalid account. Must be "aurora", "mono", or "onyx"' },
      { status: 400 }
    );
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'YouTube Client ID not configured' },
      { status: 500 }
    );
  }

  // OAuth scopes needed for YouTube uploads
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.readonly', // To get channel name
  ].join(' ');

  // Redirect URI (must match what's in Google Cloud Console)
  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://macbookvisuals.com/api/auth/callback/youtube'
    : 'http://localhost:3000/api/auth/callback/youtube';

  // Build Google OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', account); // Pass account in state parameter

  console.log(`Redirecting to YouTube OAuth for account: ${account}`);

  return NextResponse.redirect(authUrl.toString());
}
