// src/utils/scheduler.ts
import cron, { type ScheduledTask } from 'node-cron';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import type { Video, AccountId } from '@/app/types';
import { readJsonFile, withLockedJsonFile } from '@/utils/fileUtils';

const DATA_FILE = path.join(process.cwd(), 'data', 'videos.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

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
// How long to keep failed/partial videos before auto-cleanup (hours)
const STALE_VIDEO_MAX_AGE_HOURS = 12;

/**
 * Remove failed/partial videos older than STALE_VIDEO_MAX_AGE_HOURS.
 * Deletes both the JSON record and the video file on disk.
 */
async function cleanupStaleVideos(now: Date) {
  const cutoff = new Date(now.getTime() - STALE_VIDEO_MAX_AGE_HOURS * 60 * 60 * 1000);

  const removedNames: string[] = [];

  await withLockedJsonFile<Video[]>(DATA_FILE, [], (videos) => {
    const stale = videos.filter((v) => {
      if (v.status !== 'failed' && v.status !== 'partial') return false;
      const uploaded = new Date(v.uploadedAt);
      return uploaded < cutoff;
    });

    if (stale.length === 0) return videos;

    for (const v of stale) {
      removedNames.push(v.filename);
    }

    const staleIds = new Set(stale.map((v) => v.id));
    return videos.filter((v) => !staleIds.has(v.id));
  });

  // Delete video files outside the lock
  for (const filename of removedNames) {
    try {
      const safeName = path.basename(filename);
      const filePath = path.resolve(UPLOADS_DIR, safeName);
      if (filePath.startsWith(path.resolve(UPLOADS_DIR))) {
        await fsPromises.unlink(filePath);
      }
    } catch {
      // File already gone — fine
    }
  }

  if (removedNames.length > 0) {
    console.log(`🧹 Cleaned up ${removedNames.length} stale video(s) older than ${STALE_VIDEO_MAX_AGE_HOURS}h: ${removedNames.map(f => path.basename(f, '.mp4')).join(', ')}`);
  }
}

/**
 * Remove orphaned .mp4 files on disk that are not tracked in videos.json.
 * Uses the timestamp prefix in filenames (e.g. 1774860708304_Song.mp4)
 * to determine age — only deletes files older than STALE_VIDEO_MAX_AGE_HOURS.
 */
async function cleanupOrphanedFiles(now: Date) {
  const cutoffMs = now.getTime() - STALE_VIDEO_MAX_AGE_HOURS * 60 * 60 * 1000;

  // Read tracked filenames under lock
  const tracked = new Set<string>();
  await withLockedJsonFile<Video[]>(DATA_FILE, [], (videos) => {
    for (const v of videos) {
      tracked.add(v.filename);
    }
    return videos;
  });

  let files: string[];
  try {
    files = await fsPromises.readdir(UPLOADS_DIR);
  } catch {
    return; // uploads dir doesn't exist yet
  }

  const removed: string[] = [];
  for (const file of files) {
    if (!file.endsWith('.mp4')) continue;
    if (tracked.has(file)) continue;

    // Extract timestamp prefix from filename (digits before first underscore)
    const tsMatch = file.match(/^(\d+)_/);
    if (tsMatch) {
      const fileTimestamp = Number(tsMatch[1]);
      if (fileTimestamp >= cutoffMs) continue; // too recent, skip
    }

    // Safe deletion with path containment check
    try {
      const safeName = path.basename(file);
      const filePath = path.resolve(UPLOADS_DIR, safeName);
      if (filePath.startsWith(path.resolve(UPLOADS_DIR))) {
        await fsPromises.unlink(filePath);
        removed.push(safeName);
      }
    } catch {
      // File already gone — fine
    }
  }

  if (removed.length > 0) {
    console.log(`🧹 Cleaned up ${removed.length} orphaned file(s): ${removed.map(f => path.basename(f, '.mp4')).join(', ')}`);
  }
}

async function checkAndPublishScheduledVideos() {
  const now = new Date();
  const timestamp = now.toISOString();

  console.log(`[${timestamp}] Checking for scheduled videos...`);

  // ── Cleanup stale failed/partial videos older than 12 hours ──
  await cleanupStaleVideos(now);

  // ── Cleanup orphaned files on disk not tracked in videos.json ──
  await cleanupOrphanedFiles(now);

  // Check if we're in the publishing window
  if (!isWithinPublishingWindow()) {
    const currentHour = now.getUTCHours();
    console.log(`Outside publishing window (current: ${currentHour}:00 UTC, window: ${PUBLISH_START_HOUR}:00-${PUBLISH_END_HOUR}:00 UTC)`);
    return;
  }

  // Load all videos
  const videos: Video[] = await readJsonFile<Video[]>(DATA_FILE, []);
  if (videos.length === 0) {
    console.log('No videos found');
    return;
  }

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
    const currentVideos: Video[] = await readJsonFile<Video[]>(DATA_FILE, []);
    
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
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.SITE_PASSWORD || '',
        },
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
 * Singleton guard — prevents multiple cron jobs from being created.
 * Uses globalThis to survive Next.js module re-bundling (which can create
 * separate module instances, each with their own module-scoped variables).
 */
const globalRef = globalThis as typeof globalThis & { __schedulerTask?: ScheduledTask | null };

/**
 * Starts the scheduler (idempotent — safe to call multiple times).
 * - Checks every 5 minutes for videos to publish
 * - Only publishes during 11am-10pm UTC window
 * - Max 1 video per account per hour
 */
export function startScheduler() {
  if (globalRef.__schedulerTask) {
    console.log('[scheduler] Already running — skipping duplicate start');
    return;
  }

  globalRef.__schedulerTask = cron.schedule('*/5 * * * *', async () => {
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
 * Whether the scheduler is currently running.
 */
export function isSchedulerRunning(): boolean {
  return globalRef.__schedulerTask !== null;
}

/**
 * For testing: manually trigger the scheduler check
 */
export async function triggerSchedulerCheck() {
  await checkAndPublishScheduledVideos();
}
