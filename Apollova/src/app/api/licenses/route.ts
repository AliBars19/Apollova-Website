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
        notes
      FROM licenses 
      ORDER BY purchase_date DESC
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

    return NextResponse.json({ licenses });
  } catch (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch licenses' },
      { status: 500 }
    );
  }
}

// POST /api/licenses - Create a new license
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, customer_email, price_paid, notes } = body;

    if (!customer_name || !customer_email || price_paid === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, customer_email, price_paid' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    const id = generateId();
    const license_key = generateLicenseKey();
    const purchase_date = new Date().toISOString();

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
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)
    `, [id, license_key, customer_email, customer_name, purchase_date, price_paid, notes || '']);

    saveDatabase();

    const license = {
      id,
      license_key,
      customer_email,
      customer_name,
      purchase_date,
      price_paid,
      activated: false,
      activation_date: null,
      hw_fingerprint: null,
      last_verified: null,
      revoked: false,
      notes: notes || '',
    };

    return NextResponse.json({ license }, { status: 201 });
  } catch (error) {
    console.error('Error creating license:', error);
    return NextResponse.json(
      { error: 'Failed to create license' },
      { status: 500 }
    );
  }
}