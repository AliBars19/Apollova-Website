// src/app/api/verify/route.ts
// This endpoint is called by After Effects to verify license is still valid
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, hwFingerprint } = body;

    // Validate input
    if (!licenseKey || !hwFingerprint) {
      return NextResponse.json({
        valid: false,
        error: 'Missing license key or hardware fingerprint'
      }, { status: 400 });
    }

    const db = getDatabase();

    // Find license by key
    const license = db.prepare(`
      SELECT * FROM licenses WHERE license_key = ?
    `).get(licenseKey) as any;

    // License not found
    if (!license) {
      return NextResponse.json({
        valid: false,
        error: 'License not found.'
      }, { status: 404 });
    }

    // License is revoked
    if (license.revoked) {
      return NextResponse.json({
        valid: false,
        error: 'This license has been revoked.'
      }, { status: 403 });
    }

    // License not activated yet
    if (!license.activated) {
      return NextResponse.json({
        valid: false,
        error: 'License not activated. Please activate first.'
      }, { status: 403 });
    }

    // Hardware fingerprint mismatch
    if (license.hw_fingerprint !== hwFingerprint) {
      return NextResponse.json({
        valid: false,
        error: 'Hardware mismatch. This license is registered to a different computer.'
      }, { status: 403 });
    }

    // All checks passed - update last verified timestamp
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE licenses SET last_verified = ? WHERE id = ?
    `).run(now, license.id);

    return NextResponse.json({
      valid: true,
      message: 'License verified successfully.',
      customer_name: license.customer_name
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Server error. Please try again.'
    }, { status: 500 });
  }
}

// GET for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/verify',
    method: 'POST',
    description: 'Verify an activated license',
    body: {
      licenseKey: 'XXXX-XXXX-XXXX-XXXX',
      hwFingerprint: 'hardware-fingerprint-hash'
    }
  });
}