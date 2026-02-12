// src/utils/scheduler.ts
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import type { Video, AccountId } from '@/app/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'videos.json');

// Get the base URL for API calls
function getBaseUrl(): string {
  // In production, use the actual domain
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://macbookvisuals.com';
  }
  return 'http://localhost:3000';
}

/**
 * Checks for videos that need to be published based on their scheduledAt time
 */
async function checkAndPublishScheduledVideos() {
  const now = new Date();
  const timestamp = now.toISOString();
  
  console.log(`[${timestamp}] Checking for scheduled videos...`);

  if (!fs.existsSync(DATA_FILE)) {
    console.log('No videos.json file found');
    return;
  }

  // Load all videos
  const videos: Video[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  // Find videos scheduled for now or earlier
  const videosToPublish = videos.filter((video) => {
    if (video.status !== 'scheduled' || !video.scheduledAt) {
      return false;
    }

    const scheduledTime = new Date(video.scheduledAt);
    const shouldPublish = scheduledTime <= now;

    if (shouldPublish) {
      console.log(`Found video to publish: ${video.filename} (scheduled for ${video.scheduledAt}, account: ${video.account || 'aurora'})`);
    }

    return shouldPublish;
  });

  if (videosToPublish.length === 0) {
    console.log('No videos ready to publish');
    return;
  }

  const baseUrl = getBaseUrl();

  // Publish each video
  for (const video of videosToPublish) {
    try {
      console.log(`Publishing: ${video.filename} to account: ${video.account || 'aurora'}`);
      
      // Call the publish API endpoint with "both" platform
      const response = await fetch(`${baseUrl}/api/videos/${video.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'both', // Publish to both TikTok and YouTube
          publishData: {
            videoId: video.id,
            title: video.tiktok.caption || video.youtube.title,
            privacyLevel: 'PUBLIC_TO_EVERYONE', // Public on TikTok
            disableComment: false,
            disableDuet: false,
            disableStitch: false,
            commercialContent: {
              enabled: false,
              yourBrand: false,
              brandedContent: false,
            },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✓ Successfully published: ${video.filename}`);
        
        if (data.cleaned) {
          console.log('✓ Video auto-cleaned (both platforms successful)');
        }
        
        // Log results
        if (data.results?.tiktok?.success) {
          console.log(`  ✓ TikTok: ${data.results.tiktok.videoId || 'Published'}`);
        } else {
          console.log(`  ✗ TikTok: ${data.results?.tiktok?.error || 'Failed'}`);
        }
        
        if (data.results?.youtube?.success) {
          console.log(`  ✓ YouTube: ${data.results.youtube.videoId || 'Published'}`);
        } else {
          console.log(`  ✗ YouTube: ${data.results?.youtube?.error || 'Failed'}`);
        }
      } else {
        const errorText = await response.text();
        console.error(`✗ Failed to publish: ${video.filename}`, errorText);
      }
    } catch (error) {
      console.error(`Error publishing ${video.filename}:`, error);
    }
  }
}

/**
 * Starts the scheduler that checks every 5 minutes for videos to publish
 * This ensures videos are published within 5 minutes of their scheduled time
 */
export function startScheduler() {
  // Check every 5 minutes (at :00, :05, :10, :15, :20, etc.)
  cron.schedule('*/5 * * * *', async () => {
    await checkAndPublishScheduledVideos();
  });

  const baseUrl = getBaseUrl();
  console.log('========================================');
  console.log('✓ Scheduler started!');
  console.log(`✓ Using base URL: ${baseUrl}`);
  console.log('✓ Checking for scheduled videos every 5 minutes');
  console.log('✓ Will publish to BOTH platforms (YouTube + TikTok)');
    console.log('✓ Uses account from video metadata (aurora/mono)');
  console.log('========================================');
}

/**
 * For testing: manually trigger the scheduler check
 */
export async function triggerSchedulerCheck() {
  await checkAndPublishScheduledVideos();
}