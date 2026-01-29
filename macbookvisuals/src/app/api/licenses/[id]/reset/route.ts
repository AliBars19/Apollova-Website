// src/app/api/licenses/[id]/reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// POST /api/licenses/[id]/reset - Reset hardware binding
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const { id } = params;

    // Check license exists
    const existing = db.prepare('SELECT * FROM licenses WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'License not found' },
        { status: 404 }
      );
    }

    // Reset hardware binding - clear fingerprint and activation status
    db.prepare(`
      UPDATE licenses 
      SET 
        activated = 0,
        activation_date = NULL,
        hw_fingerprint = NULL,
        last_verified = NULL
      WHERE id = ?
    `).run(id);

    return NextResponse.json({ 
      success: true,
      message: 'Hardware binding reset. Customer can now activate on a new computer.'
    });
  } catch (error) {
    console.error('Error resetting hardware:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset hardware' },
      { status: 500 }
    );
  }
}