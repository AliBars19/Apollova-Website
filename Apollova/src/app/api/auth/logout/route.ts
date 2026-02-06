// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const tokensPath = path.join(process.cwd(), 'data', 'tokens.json');
    
    if (fs.existsSync(tokensPath)) {
      // Delete the tokens file
      fs.unlinkSync(tokensPath);
      console.log('User logged out - tokens cleared');
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to logout',
      },
      { status: 500 }
    );
  }
}