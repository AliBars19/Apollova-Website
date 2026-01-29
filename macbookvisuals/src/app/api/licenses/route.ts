// src/app/api/licenses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, generateLicenseKey, generateId, saveDatabase } from '@/lib/database';

// GET /api/licenses - List all licenses
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    
    const stmt = db.prepare(`
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
    `);

    const licenses: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      licenses.push({
        ...row,
        activated: Boolean(row.activated),
        revoked: Boolean(row.revoked),
      });
    }
    stmt.free();

    return NextResponse.json({ 
      success: true, 
      licenses 
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

    const db = await getDatabase();
    const id = generateId();
    const licenseKey = generateLicenseKey();
    const now = new Date().toISOString();

    db.run(`
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
    `, [id, licenseKey, customer_email, customer_name, now, price_paid, notes || '', now]);

    saveDatabase();

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
