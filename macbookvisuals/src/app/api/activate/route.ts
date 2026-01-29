// src/app/api/activate/route.ts
// This endpoint is called by the After Effects ExtendScript when user enters license key
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, hwFingerprint } = body;

    // Validate input
    if (!licenseKey || !hwFingerprint) {
      return NextResponse.json({
        success: false,
        error: 'Missing license key or hardware fingerprint'
      }, { status: 400 });
    }

    const db = await getDatabase();

    // Find license by key
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

    // License is revoked
    if (license.revoked) {
      return NextResponse.json({
        success: false,
        error: 'This license has been revoked. Contact support for assistance.'
      }, { status: 403 });
    }

    // License already activated on DIFFERENT hardware
    if (license.activated && license.hw_fingerprint && license.hw_fingerprint !== hwFingerprint) {
      return NextResponse.json({
        success: false,
        error: 'This license is already activated on another computer. Contact support to reset.'
      }, { status: 403 });
    }

    // License already activated on SAME hardware - just return success
    if (license.activated && license.hw_fingerprint === hwFingerprint) {
      // Update last verified
      db.run('UPDATE licenses SET last_verified = ? WHERE id = ?', 
        [new Date().toISOString(), license.id]);
      saveDatabase();

      return NextResponse.json({
        success: true,
        message: 'License already activated on this computer.'
      });
    }

    // First-time activation - bind to this hardware
    const now = new Date().toISOString();
    db.run(`
      UPDATE licenses 
      SET 
        activated = 1,
        activation_date = ?,
        hw_fingerprint = ?,
        last_verified = ?
      WHERE id = ?
    `, [now, hwFingerprint, now, license.id]);
    
    saveDatabase();

    return NextResponse.json({
      success: true,
      message: 'License activated successfully!'
    });

  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error. Please try again later.'
    }, { status: 500 });
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/activate',
    method: 'POST',
    description: 'Activate a license key',
    body: {
      licenseKey: 'XXXX-XXXX-XXXX-XXXX',
      hwFingerprint: 'hardware-fingerprint-hash'
    }
  });
}
