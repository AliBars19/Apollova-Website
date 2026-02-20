// src/utils/scheduler.ts
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import type { Video, AccountId } from '@/app/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'videos.json');

// Rate limiting: max videos to publish per scheduler run
const MAX_VIDEOS_PER_RUN = 1;

// Delay between publishing videos (in milliseconds)
const DELAY_BETWEEN_PUBLISHES = 60000; // 1 minute

// Daily limit per account
const DAILY_LIMIT_PER_ACCOUNT = 12;

// Get the base URL for API calls
function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://apollova.co.uk';
  }
  return 'http://localhost:3000';
}

/**
 * Get count of videos published today for a specific account
 */
function getPublishedTodayCount(videos: Video[], accountId: AccountId): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return videos.filter((video) => {
    if (video.account !== accountId) return false;
    if (video.status !== 'published' && video.status !== 'partial') return false;
    
    // Check if published today (look at tiktok or youtube publishedAt)
    const publishedAt = video.tiktok?.publishedAt || video.youtube?.publishedAt;
    if (!publishedAt) return false;
    
    const publishDate = new Date(publishedAt);
    publishDate.setHours(0, 0, 0, 0);
    
    return publishDate.getTime() === today.getTime();
  }).length;
}

/**
 * Check if we can publish more videos for a given account today
 */
function canPublishForAccount(videos: Video[], accountId: AccountId): boolean {
  const publishedToday = getPublishedTodayCount(videos, accountId);
  const canPublish = publishedToday < DAILY_LIMIT_PER_ACCOUNT;
  
  if (!canPublish) {
    console.log(`⚠️ Account ${accountId} has reached daily limit (${publishedToday}/${DAILY_LIMIT_PER_ACCOUNT})`);
  }
  
  return canPublish;
}

/**
 * Checks for videos that need to be published based on their scheduledAt time
 * RATE LIMITED: Only publishes 1 video per run to prevent mass publishing
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

  // Find videos scheduled for now or earlier, sorted by scheduledAt (oldest first)
  const videosToPublish = videos
    .filter((video) => {
      if (video.status !== 'scheduled' || !video.scheduledAt) {
        return false;
      }

      const scheduledTime = new Date(video.scheduledAt);
      return scheduledTime <= now;
    })
    .sort((a, b) => {
      // Sort by scheduled time (oldest first)
      const timeA = new Date(a.scheduledAt!).getTime();
      const timeB = new Date(b.scheduledAt!).getTime();
      return timeA - timeB;
    });

  if (videosToPublish.length === 0) {
    console.log('No videos ready to publish');
    return;
  }

  console.log(`Found ${videosToPublish.length} videos ready to publish`);

  // Group by account to check daily limits
  const accountCounts: Record<string, number> = {};
  for (const video of videosToPublish) {
    const acc = video.account || 'aurora';
    accountCounts[acc] = (accountCounts[acc] || 0) + 1;
  }
  
  console.log('Videos per account:', accountCounts);

  const baseUrl = getBaseUrl();
  let publishedCount = 0;

  // Publish only MAX_VIDEOS_PER_RUN video(s) per scheduler run
  for (const video of videosToPublish) {
    if (publishedCount >= MAX_VIDEOS_PER_RUN) {
      console.log(`Rate limit reached (${MAX_VIDEOS_PER_RUN}/run). Remaining videos will be published in next check.`);
      break;
    }

    const accountId = (video.account || 'aurora') as AccountId;
    
    // Check daily limit for this account
    // Re-read videos to get latest state
    const currentVideos: Video[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (!canPublishForAccount(currentVideos, accountId)) {
      console.log(`Skipping ${video.filename} - account ${accountId} at daily limit`);
      continue;
    }

    try {
      console.log(`Publishing: ${video.filename} to account: ${accountId}`);
      
      // Call the publish API endpoint with "both" platform
      const response = await fetch(`${baseUrl}/api/videos/${video.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'both',
          publishData: {
            videoId: video.id,
            title: video.tiktok.caption || video.youtube.title,
            privacyLevel: 'PUBLIC_TO_EVERYONE',
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
        publishedCount++;
        
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

      // Delay before next publish (even if we hit the rate limit, this ensures spacing)
      if (publishedCount < MAX_VIDEOS_PER_RUN && videosToPublish.indexOf(video) < videosToPublish.length - 1) {
        console.log(`Waiting ${DELAY_BETWEEN_PUBLISHES / 1000}s before next publish...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_PUBLISHES));
      }
    } catch (error) {
      console.error(`Error publishing ${video.filename}:`, error);
    }
  }

  if (publishedCount > 0) {
    const remaining = videosToPublish.length - publishedCount;
    console.log(`Published ${publishedCount} video(s) this run. ${remaining} video(s) remaining in queue.`);
  }
}

/**
 * Starts the scheduler that checks every 5 minutes for videos to publish
 * With rate limiting: publishes max 1 video per 5-minute check
 * This means max 12 videos/hour if all past-due (which aligns with TikTok limits)
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
  console.log(`✓ Rate limit: ${MAX_VIDEOS_PER_RUN} video(s) per check`);
  console.log(`✓ Daily limit: ${DAILY_LIMIT_PER_ACCOUNT} videos per account`);
  console.log('✓ Will publish to BOTH platforms (YouTube + TikTok)');
  console.log('✓ Uses account from video metadata (aurora/mono/onyx)');
  console.log('========================================');
}

/**
 * For testing: manually trigger the scheduler check
 */
export async function triggerSchedulerCheck() {
  await checkAndPublishScheduledVideos();
}
