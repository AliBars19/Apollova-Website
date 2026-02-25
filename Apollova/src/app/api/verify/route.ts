// src/app/api/verify/route.ts
// Called by Apollova.exe (every 24h) and Activator.jsx to confirm license is still valid
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { getDatabase, saveDatabase } from '@/lib/database';

function generateToken(licenseKey: string, hwFingerprint: string): string {
  const secret = process.env.HMAC_SECRET;
  if (!secret) throw new Error('HMAC_SECRET not configured');
  return createHmac('sha256', Buffer.from(secret, 'hex'))
    .update(`${licenseKey}:${hwFingerprint}`)
    .digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, hwFingerprint } = body;

    if (!licenseKey || !hwFingerprint) {
      return NextResponse.json({
        valid: false,
        error: 'Missing license key or hardware fingerprint'
      }, { status: 400 });
    }

    const db = await getDatabase();

    const stmt = db.prepare('SELECT * FROM licenses WHERE license_key = ?');
    stmt.bind([licenseKey]);

    if (!stmt.step()) {
      stmt.free();
      return NextResponse.json({
        valid: false,
        error: 'License not found.'
      }, { status: 404 });
    }

    const license = stmt.getAsObject() as any;
    stmt.free();

    if (license.revoked) {
      return NextResponse.json({
        valid: false,
        error: 'This license has been revoked.'
      }, { status: 403 });
    }

    if (!license.activated) {
      return NextResponse.json({
        valid: false,
        error: 'License not activated. Please activate first.'
      }, { status: 403 });
    }

    if (license.hw_fingerprint !== hwFingerprint) {
      return NextResponse.json({
        valid: false,
        error: 'Hardware mismatch. This license is registered to a different computer.'
      }, { status: 403 });
    }

    // All checks passed — update last_verified and return fresh token
    const now = new Date().toISOString();
    db.run('UPDATE licenses SET last_verified = ? WHERE id = ?', [now, license.id]);
    saveDatabase();

    const token = generateToken(licenseKey, hwFingerprint);

    return NextResponse.json({
      valid: true,
      message: 'License verified successfully.',
      customer_name: license.customer_name,
      token
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Server error. Please try again.'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/verify',
    method: 'POST',
    body: { licenseKey: 'XXXX-XXXX-XXXX-XXXX', hwFingerprint: 'sha256-hash' }
  });
}
