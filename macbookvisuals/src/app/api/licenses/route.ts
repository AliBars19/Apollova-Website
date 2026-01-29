// src/app/api/licenses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, generateLicenseKey, generateId } from '@/lib/database';

// GET /api/licenses - List all licenses
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    
    const licenses = db.prepare(`
      SELECT 
        id,
        license_key,
        customer_email,
        customer_name,
        purchase_date,
        price_paid,
        activated,
        activation_date,
        hw_fingerprint,
        last_verified,
        revoked,
        notes,
        created_at
      FROM licenses 
      ORDER BY created_at DESC
    `).all();

    // Convert SQLite integers to booleans
    const formattedLicenses = licenses.map((license: any) => ({
      ...license,
      activated: Boolean(license.activated),
      revoked: Boolean(license.revoked),
    }));

    return NextResponse.json({ 
      success: true, 
      licenses: formattedLicenses 
    });
  } catch (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch licenses' },
      { status: 500 }
    );
  }
}

// POST /api/licenses - Create new license
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, customer_email, price_paid, notes } = body;

    // Validate required fields
    if (!customer_name || !customer_email || price_paid === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const id = generateId();
    const licenseKey = generateLicenseKey();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO licenses (
        id,
        license_key,
        customer_email,
        customer_name,
        purchase_date,
        price_paid,
        activated,
        revoked,
        notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).run(
      id,
      licenseKey,
      customer_email,
      customer_name,
      now,
      price_paid,
      notes || '',
      now
    );

    return NextResponse.json({
      success: true,
      license: {
        id,
        license_key: licenseKey,
        customer_email,
        customer_name,
        purchase_date: now,
        price_paid,
        activated: false,
        revoked: false,
        notes: notes || '',
      }
    });
  } catch (error) {
    console.error('Error creating license:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create license' },
      { status: 500 }
    );
  }
}