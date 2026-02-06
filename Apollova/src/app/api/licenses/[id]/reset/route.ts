// src/app/api/licenses/[id]/reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/database';

// POST /api/licenses/[id]/reset - Reset hardware binding
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();

    // Check license exists
    const checkStmt = db.prepare('SELECT * FROM licenses WHERE id = ?');
    checkStmt.bind([id]);
    if (!checkStmt.step()) {
      checkStmt.free();
      return NextResponse.json(
        { success: false, error: 'License not found' },
        { status: 404 }
      );
    }
    checkStmt.free();

    // Reset hardware binding - clear fingerprint and activation status
    db.run(`
      UPDATE licenses 
      SET 
        activated = 0,
        activation_date = NULL,
        hw_fingerprint = NULL,
        last_verified = NULL
      WHERE id = ?
    `, [id]);
    
    saveDatabase();

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
