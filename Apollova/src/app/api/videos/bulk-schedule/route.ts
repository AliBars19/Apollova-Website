// src/app/api/videos/bulk-schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { generateDailySchedule, getNextAvailableSlot } from '@/utils/schedulerHelper';

const DATA_DIR = path.join(process.cwd(), 'data');
const VIDEOS_FILE = path.join(DATA_DIR, 'videos.json');

interface Video {
  id: string;
  filename: string;
  status: string;
  scheduledAt?: string;
  [key: string]: any;
}

async function readVideos(): Promise<Video[]> {
  try {
    const data = await fs.readFile(VIDEOS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeVideos(videos: Video[]) {
  await fs.writeFile(VIDEOS_FILE, JSON.stringify(videos, null, 2));
}

/**
 * POST /api/videos/bulk-schedule
 * 
 * Schedules multiple videos across 12 hourly slots (11 AM - 11 PM)
 * 
 * Body options:
 * - videoIds: string[] - Specific videos to schedule
 * - scheduleAll: boolean - Schedule all draft videos
 * - startDate: string (optional) - Date to start scheduling (default: today)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoIds, scheduleAll, startDate } = body;

    const videos = await readVideos();
    
    // Determine which videos to schedule
    let videosToSchedule: Video[];
    
    if (scheduleAll) {
      // Schedule all draft videos
      videosToSchedule = videos.filter(v => v.status === 'draft');
      console.log(`Scheduling all ${videosToSchedule.length} draft videos`);
    } else if (videoIds && Array.isArray(videoIds)) {
      // Schedule specific videos
      videosToSchedule = videos.filter(v => videoIds.includes(v.id));
      console.log(`Scheduling ${videosToSchedule.length} specific videos`);
    } else {
      return NextResponse.json(
        { error: 'Must provide either videoIds array or scheduleAll: true' },
        { status: 400 }
      );
    }

    if (videosToSchedule.length === 0) {
      return NextResponse.json(
        { error: 'No videos to schedule' },
        { status: 400 }
      );
    }

    // Generate schedule starting from specified date or today
    const baseDate = startDate ? new Date(startDate) : new Date();
    let currentDate = new Date(baseDate);
    let scheduleForDay = generateDailySchedule(currentDate);
    let dayIndex = 0;
    let slotIndex = 0;

    // Skip past time slots for today
    if (startDate === undefined || baseDate.toDateString() === new Date().toDateString()) {
      const now = new Date();
      scheduleForDay = scheduleForDay.filter(slot => new Date(slot) > now);
      
      if (scheduleForDay.length === 0) {
        // No slots left today, move to tomorrow
        currentDate.setDate(currentDate.getDate() + 1);
        scheduleForDay = generateDailySchedule(currentDate);
      }
    }

    const scheduledVideos: Array<{ videoId: string; filename: string; scheduledAt: string }> = [];

    // Assign each video to a time slot
    for (const video of videosToSchedule) {
      if (slotIndex >= scheduleForDay.length) {
        // Move to next day
        dayIndex++;
        currentDate = new Date(baseDate);
        currentDate.setDate(currentDate.getDate() + dayIndex);
        scheduleForDay = generateDailySchedule(currentDate);
        slotIndex = 0;
      }

      const scheduledTime = scheduleForDay[slotIndex];
      
      // Update video
      const videoIndex = videos.findIndex(v => v.id === video.id);
      if (videoIndex !== -1) {
        videos[videoIndex].scheduledAt = scheduledTime;
        videos[videoIndex].status = 'scheduled';
        
        scheduledVideos.push({
          videoId: video.id,
          filename: video.filename,
          scheduledAt: scheduledTime,
        });

        console.log(`✓ Scheduled: ${video.filename} at ${scheduledTime}`);
      }

      slotIndex++;
    }

    // Save updated videos
    await writeVideos(videos);

    const summary = {
      totalScheduled: scheduledVideos.length,
      startDate: baseDate.toISOString(),
      daysUsed: Math.ceil(scheduledVideos.length / 12),
      schedule: scheduledVideos,
    };

    console.log('========================================');
    console.log('BULK SCHEDULE SUMMARY');
    console.log(`Total videos: ${summary.totalScheduled}`);
    console.log(`Days used: ${summary.daysUsed}`);
    console.log(`Start date: ${summary.startDate}`);
    console.log('========================================');

    return NextResponse.json({
      success: true,
      message: `Successfully scheduled ${scheduledVideos.length} videos`,
      summary,
    });

  } catch (error) {
    console.error('Bulk schedule error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/videos/bulk-schedule
 * 
 * Get scheduling information and available slots
 */
export async function GET() {
  try {
    const videos = await readVideos();
    const draftVideos = videos.filter(v => v.status === 'draft');
    const scheduledVideos = videos.filter(v => v.status === 'scheduled');

    const nextSlot = getNextAvailableSlot();
    const todaySchedule = generateDailySchedule();
    const now = new Date();
    const availableSlotsToday = todaySchedule.filter(slot => new Date(slot) > now).length;

    return NextResponse.json({
      draftCount: draftVideos.length,
      scheduledCount: scheduledVideos.length,
      nextAvailableSlot: nextSlot,
      availableSlotsToday,
      slotsPerDay: 12,
      scheduleRange: '11 AM - 11 PM (hourly)',
    });

  } catch (error) {
    console.error('Get schedule info error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}