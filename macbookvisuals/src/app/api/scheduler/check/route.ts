// src/app/api/scheduler/check/route.ts
import { NextResponse } from 'next/server';
import { triggerSchedulerCheck } from '@/utils/scheduler';

/**
 * GET /api/scheduler/check
 * Manually triggers a check for scheduled videos (useful for testing)
 */
export async function GET() {
  try {
    console.log('Manual scheduler check triggered');
    await triggerSchedulerCheck();
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Scheduler check completed'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}