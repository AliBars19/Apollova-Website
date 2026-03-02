// src/app/api/scheduler/start/route.ts
import { NextResponse } from 'next/server';
import { startScheduler, isSchedulerRunning } from '@/utils/scheduler';

/**
 * GET /api/scheduler/start
 * Starts the background scheduler that checks for videos to publish.
 * Safe to call multiple times — startScheduler() is idempotent.
 */
export async function GET() {
  if (isSchedulerRunning()) {
    return NextResponse.json({
      status: 'already_running',
      message: 'Scheduler is already running'
    });
  }

  try {
    startScheduler();

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
