// src/utils/scheduler.ts
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import type { Video, AccountId } from '@/app/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'videos.json');

// Publishing window (24-hour format, UTC)
// 11:00 to 22:00 UTC = 11am to 10pm
const PUBLISH_START_HOUR = 11;
const PUBLISH_END_HOUR = 22;

// Max videos per account per hour (to prevent burst publishing)
const MAX_PER_ACCOUNT_PER_HOUR = 1;

// Get the base URL for API calls
function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://apollova.co.uk';
  }
  return 'http://localhost:3000';
}

/**
 * Check if current time is within the publishing window
 */
function isWithinPublishingWindow(): boolean {
  const now = new Date();
  const currentHour = now.getUTCHours();
  
  // Publishing allowed from 11:00 to 21:59 UTC (last publish at 22:00 would be 10pm)
  return currentHour >= PUBLISH_START_HOUR && currentHour < PUBLISH_END_HOUR;
}

/**
 * Get videos published in the current hour for a specific account
 */
function getPublishedThisHourCount(videos: Video[], accountId: AccountId): number {
  const now = new Date();
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);
  
  const hourEnd = new Date(hourStart);
  hourEnd.setHours(hourEnd.getHours() + 1);
  
  return videos.filter((video) => {
    if (video.account !== accountId) return false;
    if (video.status !== 'published' && video.status !== 'partial') return false;
    
    const publishedAt = video.tiktok?.publishedAt || video.youtube?.publishedAt;
    if (!publishedAt) return false;
    
    const publishDate = new Date(publishedAt);
    return publishDate >= hourStart && publishDate < hourEnd;
  }).length;
}

/**
 * Check if we can publish for this account this hour
 */
function canPublishThisHour(videos: Video[], accountId: AccountId): boolean {
  const publishedThisHour = getPublishedThisHourCount(videos, accountId);
  return publishedThisHour < MAX_PER_ACCOUNT_PER_HOUR;
}

/**
 * Checks for videos that need to be published
 * - Only publishes during the 11am-10pm window
 * - Max 1 video per account per hour
 * - Processes oldest scheduled videos first
 */
async function checkAndPublishScheduledVideos() {
  const now = new Date();
  const timestamp = now.toISOString();
  
  console.log(`[${timestamp}] Checking for scheduled videos...`);

  // Check if we're in the publishing window
  if (!isWithinPublishingWindow()) {
    const currentHour = now.getUTCHours();
    console.log(`Outside publishing window (current: ${currentHour}:00 UTC, window: ${PUBLISH_START_HOUR}:00-${PUBLISH_END_HOUR}:00 UTC)`);
    return;
  }

  if (!fs.existsSync(DATA_FILE)) {
    console.log('No videos.json file found');
    return;
  }

  // Load all videos
  const videos: Video[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  // Find videos that are scheduled (status = 'scheduled') and due (scheduledAt <= now)
  // Sort by scheduledAt (oldest first) to process backlog fairly
  const videosToPublish = videos
    .filter((video) => {
      if (video.status !== 'scheduled' || !video.scheduledAt) {
        return false;
      }
      const scheduledTime = new Date(video.scheduledAt);
      return scheduledTime <= now;
    })
    .sort((a, b) => {
      const timeA = new Date(a.scheduledAt!).getTime();
      const timeB = new Date(b.scheduledAt!).getTime();
      return timeA - timeB;
    });

  if (videosToPublish.length === 0) {
    console.log('No videos ready to publish');
    return;
  }

  console.log(`Found ${videosToPublish.length} video(s) ready to publish`);

  // Group by account
  const byAccount: Record<string, Video[]> = {};
  for (const video of videosToPublish) {
    const acc = video.account || 'aurora';
    if (!byAccount[acc]) byAccount[acc] = [];
    byAccount[acc].push(video);
  }

  console.log('Queue by account:', Object.fromEntries(
    Object.entries(byAccount).map(([k, v]) => [k, v.length])
  ));

  const baseUrl = getBaseUrl();
  const publishedAccounts: Set<string> = new Set();

  // Try to publish ONE video per account (respecting hourly limit)
  for (const [accountId, accountVideos] of Object.entries(byAccount)) {
    // Re-read videos to get latest state
    const currentVideos: Video[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    
    if (!canPublishThisHour(currentVideos, accountId as AccountId)) {
      console.log(`⏸️  ${accountId}: Already published this hour, skipping`);
      continue;
    }

    // Get the oldest video for this account
    const video = accountVideos[0];

    try {
      console.log(`📤 Publishing: ${video.filename} (account: ${accountId})`);
      
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
        publishedAccounts.add(accountId);
        
        console.log(`✓ Published: ${video.filename}`);
        
        if (data.cleaned) {
          console.log('  ✓ Auto-cleaned (both platforms successful)');
        }
        
        if (data.results?.youtube?.success) {
          console.log(`  ✓ YouTube: ${data.results.youtube.videoId || 'OK'}`);
        } else {
          console.log(`  ✗ YouTube: ${data.results?.youtube?.error || 'Failed'}`);
        }
        
        if (data.results?.tiktok?.success) {
          console.log(`  ✓ TikTok: ${data.results.tiktok.videoId || 'OK'}`);
        } else {
          console.log(`  ✗ TikTok: ${data.results?.tiktok?.error || 'Failed'}`);
        }
      } else {
        const errorText = await response.text();
        console.error(`✗ Failed: ${video.filename}`, errorText);
      }
    } catch (error) {
      console.error(`✗ Error publishing ${video.filename}:`, error);
    }
  }

  // Summary
  const remainingCount = videosToPublish.length - publishedAccounts.size;
  if (publishedAccounts.size > 0) {
    console.log(`Published to ${publishedAccounts.size} account(s): ${[...publishedAccounts].join(', ')}`);
  }
  if (remainingCount > 0) {
    console.log(`${remainingCount} video(s) remaining in queue for next hour`);
  }
}

/**
 * Starts the scheduler
 * - Checks every 5 minutes for videos to publish
 * - Only publishes during 11am-10pm UTC window
 * - Max 1 video per account per hour
 */
export function startScheduler() {
  // Check every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await checkAndPublishScheduledVideos();
  });

  const baseUrl = getBaseUrl();
  console.log('========================================');
  console.log('✓ Scheduler started!');
  console.log(`✓ Base URL: ${baseUrl}`);
  console.log('✓ Checking every 5 minutes');
  console.log(`✓ Publishing window: ${PUBLISH_START_HOUR}:00-${PUBLISH_END_HOUR}:00 UTC`);
  console.log(`✓ Rate limit: ${MAX_PER_ACCOUNT_PER_HOUR} video per account per hour`);
  console.log('✓ Accounts: aurora / mono / onyx');
  console.log('========================================');
}

/**
 * For testing: manually trigger the scheduler check
 */
export async function triggerSchedulerCheck() {
  await checkAndPublishScheduledVideos();
}
