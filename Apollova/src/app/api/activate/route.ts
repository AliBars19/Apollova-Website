// src/app/api/activate/route.ts
// Called by Apollova.exe and Activator.jsx when user enters license key
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
        success: false,
        error: 'Missing license key or hardware fingerprint'
      }, { status: 400 });
    }

    const db = await getDatabase();

    const stmt = db.prepare('SELECT * FROM licenses WHERE license_key = ?');
    stmt.bind([licenseKey]);

    if (!stmt.step()) {
      stmt.free();
      return NextResponse.json({
        success: false,
        error: 'Invalid license key. Please check and try again.'
      }, { status: 404 });
    }

    const license = stmt.getAsObject() as any;
    stmt.free();

    if (license.revoked) {
      return NextResponse.json({
        success: false,
        error: 'This license has been revoked. Contact support for assistance.'
      }, { status: 403 });
    }

    // Already activated on a DIFFERENT machine
    if (license.activated && license.hw_fingerprint && license.hw_fingerprint !== hwFingerprint) {
      return NextResponse.json({
        success: false,
        error: 'This license is already activated on another computer. Contact support to reset.'
      }, { status: 403 });
    }

    const now = new Date().toISOString();
    const token = generateToken(licenseKey, hwFingerprint);

    if (license.activated && license.hw_fingerprint === hwFingerprint) {
      // Re-activation on same machine — refresh last_verified
      db.run('UPDATE licenses SET last_verified = ? WHERE id = ?', [now, license.id]);
      saveDatabase();
      return NextResponse.json({
        success: true,
        message: 'License already activated on this computer.',
        token
      });
    }

    // First-time activation — bind to this hardware
    db.run(`
      UPDATE licenses
      SET activated = 1, activation_date = ?, hw_fingerprint = ?, last_verified = ?
      WHERE id = ?
    `, [now, hwFingerprint, now, license.id]);
    saveDatabase();

    return NextResponse.json({
      success: true,
      message: 'License activated successfully!',
      token
    });

  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error. Please try again later.'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/activate',
    method: 'POST',
    body: { licenseKey: 'XXXX-XXXX-XXXX-XXXX', hwFingerprint: 'sha256-hash' }
  });
}
