// src/app/api/licenses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/database';

// GET /api/licenses/[id] - Get single license
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();

    const stmt = db.prepare('SELECT * FROM licenses WHERE id = ?');
    stmt.bind([id]);
    
    if (!stmt.step()) {
      stmt.free();
      return NextResponse.json(
        { success: false, error: 'License not found' },
        { status: 404 }
      );
    }
    
    const license = stmt.getAsObject();
    stmt.free();

    return NextResponse.json({
      success: true,
      license: {
        ...license,
        activated: Boolean(license.activated),
        revoked: Boolean(license.revoked),
      }
    });
  } catch (error) {
    console.error('Error fetching license:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch license' },
      { status: 500 }
    );
  }
}

// PATCH /api/licenses/[id] - Update license (revoke, edit notes, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const body = await request.json();

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

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (body.revoked !== undefined) {
      updates.push('revoked = ?');
      values.push(body.revoked ? 1 : 0);
    }

    if (body.notes !== undefined) {
      updates.push('notes = ?');
      values.push(body.notes);
    }

    if (body.customer_name !== undefined) {
      updates.push('customer_name = ?');
      values.push(body.customer_name);
    }

    if (body.customer_email !== undefined) {
      updates.push('customer_email = ?');
      values.push(body.customer_email);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(id);
    db.run(`UPDATE licenses SET ${updates.join(', ')} WHERE id = ?`, values);
    saveDatabase();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating license:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update license' },
      { status: 500 }
    );
  }
}

// DELETE /api/licenses/[id] - Delete license (use with caution)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();

    // Check if exists first
    const checkStmt = db.prepare('SELECT id FROM licenses WHERE id = ?');
    checkStmt.bind([id]);
    if (!checkStmt.step()) {
      checkStmt.free();
      return NextResponse.json(
        { success: false, error: 'License not found' },
        { status: 404 }
      );
    }
    checkStmt.free();

    db.run('DELETE FROM licenses WHERE id = ?', [id]);
    saveDatabase();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting license:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete license' },
      { status: 500 }
    );
  }
}
