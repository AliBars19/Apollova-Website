// src/app/api/scheduler/start/route.ts
import { NextResponse } from 'next/server';
import { startScheduler } from '@/utils/scheduler';

// Track if scheduler is already running
let schedulerRunning = false;

/**
 * GET /api/scheduler/start
 * Starts the background scheduler that checks for videos to publish
 */
export async function GET() {
  if (schedulerRunning) {
    return NextResponse.json({ 
      status: 'already_running',
      message: 'Scheduler is already running'
    });
  }

  try {
    startScheduler();
    schedulerRunning = true;
    
    return NextResponse.json({ 
      status: 'started',
      message: 'Scheduler started successfully',
      schedule: 'Checking every 5 minutes for videos to publish',
      dailySchedule: '12 videos from 11 AM to 11 PM (hourly)'
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