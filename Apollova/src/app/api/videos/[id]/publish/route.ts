// src/app/api/videos/[id]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { publishToYouTube } from '@/utils/youtube';
import { publishToTikTokCompliant } from '@/utils/tiktok';
import type { Video, VideoStatus, AccountId } from '@/app/types';
import { withLockedJsonFile } from '@/utils/fileUtils';

const DATA_DIR = path.join(process.cwd(), 'data');
const VIDEOS_FILE = path.join(DATA_DIR, 'videos.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// In-flight guard: prevents the same video being published concurrently
const publishingInFlight = new Set<string>();

/**
 * Snapshot of the video data needed for publishing.
 * Read under the mutex, then used outside it for the slow API calls.
 */
interface PublishSnapshot {
  accountId: AccountId;
  filename: string;
  videoPath: string;
  tiktokCaption: string;
  youtubeTitle: string;
  youtubeDescription: string;
  youtubeTags: string[];
  youtubeCategory: string;
  youtubePrivacy: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Reject if this video is already being published
  if (publishingInFlight.has(id)) {
    console.log(`⚠️  Video ${id} is already being published — rejecting duplicate request`);
    return NextResponse.json(
      { error: 'This video is already being published. Please wait.' },
      { status: 409 }
    );
  }
  publishingInFlight.add(id);

  try {

    const body = await request.json();
    const { platform, publishData, autoDeleteSettings } = body;

    console.log('========================================');
    console.log(`PUBLISH requested for video ID: ${id}`);
    console.log('Platform:', platform);
    console.log('========================================');

    // ── Step 1: Read video snapshot under the mutex (fast, no API calls) ──
    // Container pattern avoids TS narrowing issue with closure mutation
    const box: { snapshot: PublishSnapshot | null } = { snapshot: null };

    await withLockedJsonFile<Video[]>(VIDEOS_FILE, [], (videos) => {
      const video = videos.find((v) => v.id === id);
      if (!video) return videos;

      const tiktok = video.tiktok ?? { caption: '', status: 'pending' as const };
      const youtube = video.youtube ?? { title: '', description: '', tags: [] as string[], category: '10', privacy: 'public' as const, status: 'pending' as const };

      box.snapshot = {
        accountId: video.account || 'aurora',
        filename: video.filename,
        videoPath: path.join(UPLOADS_DIR, video.filename),
        tiktokCaption: tiktok.caption,
        youtubeTitle: youtube.title,
        youtubeDescription: youtube.description,
        youtubeTags: [...youtube.tags],
        youtubeCategory: youtube.category,
        youtubePrivacy: youtube.privacy,
      };

      // Mark as "publishing" — return new array with replaced element (immutable)
      return videos.map((v) =>
        v.id === id ? { ...v, status: 'publishing' as const, tiktok, youtube } : v
      );
    });

    if (!box.snapshot) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const snapshot = box.snapshot;
    const { accountId, videoPath } = snapshot;
    console.log(`Using account: ${accountId}`);
    console.log(`Video: ${snapshot.filename}`);

    // ── Step 2: Publish to platforms (slow, OUTSIDE the mutex) ──
    let tiktokSuccess = false;
    let youtubeSuccess = false;
    const results: Record<string, { success: boolean; videoId?: string; error?: string }> = {};

    // TikTok updates to apply later
    let tiktokUpdates: Partial<Video['tiktok']> = {};
    let youtubeUpdates: Partial<Video['youtube']> = {};

    if (platform === 'tiktok' || platform === 'both') {
      try {
        console.log(`📱 Publishing to TikTok (${accountId})...`);
        const tiktokResult = await publishToTikTokCompliant(videoPath, publishData, accountId);

        if (tiktokResult.success && tiktokResult.status === 'PUBLISH_COMPLETE') {
          console.log('✓ TikTok publish succeeded');
          tiktokUpdates = { status: 'published', videoId: tiktokResult.postId, publishId: tiktokResult.publishId, publishedAt: new Date().toISOString() };
          tiktokSuccess = true;
          results.tiktok = { success: true, videoId: tiktokResult.postId };
        } else {
          console.log('⚠️  TikTok publish incomplete:', tiktokResult.status);
          tiktokUpdates = { status: 'processing', publishId: tiktokResult.publishId, error: `Status: ${tiktokResult.status}` };
          results.tiktok = { success: false, error: `Status: ${tiktokResult.status}` };
        }
      } catch (error) {
        console.error('✗ TikTok publish failed:', error);
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        tiktokUpdates = { status: 'failed', error: errMsg };
        results.tiktok = { success: false, error: errMsg };
      }
    }

    if (platform === 'youtube' || platform === 'both') {
      try {
        console.log(`📺 Publishing to YouTube (${accountId})...`);
        const youtubeResult = await publishToYouTube(
          videoPath,
          snapshot.youtubeTitle,
          snapshot.youtubeDescription,
          snapshot.youtubeTags,
          snapshot.youtubeCategory,
          snapshot.youtubePrivacy as 'public' | 'private' | 'unlisted',
          accountId
        );

        if (youtubeResult.success) {
          console.log('✓ YouTube publish succeeded');
          youtubeUpdates = { status: 'published', videoId: youtubeResult.videoId, publishedAt: new Date().toISOString() };
          youtubeSuccess = true;
          results.youtube = { success: true, videoId: youtubeResult.videoId };
        } else {
          console.error('✗ YouTube publish failed:', youtubeResult.error);
          youtubeUpdates = { status: 'failed', error: youtubeResult.error || 'Unknown error' };
          results.youtube = { success: false, error: youtubeResult.error || 'Unknown error' };
        }
      } catch (error) {
        console.error('✗ YouTube publish failed:', error);
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        youtubeUpdates = { status: 'failed', error: errMsg };
        results.youtube = { success: false, error: errMsg };
      }
    }

    // Compute overall status
    let overallStatus: VideoStatus;
    if (platform === 'both') {
      if (tiktokSuccess && youtubeSuccess) overallStatus = 'published';
      else if (tiktokSuccess || youtubeSuccess) overallStatus = 'partial';
      else overallStatus = 'failed';
    } else if (platform === 'tiktok') {
      overallStatus = tiktokSuccess ? 'published' : 'failed';
    } else {
      overallStatus = youtubeSuccess ? 'published' : 'failed';
    }

    // ── Step 3: Apply results back under the mutex (reads FRESH data) ──
    let shouldClean = false;
    if (platform === 'both') {
      if (tiktokSuccess && youtubeSuccess) {
        shouldClean = true;
        console.log('🗑️  Both platforms successful - cleaning up...');
      } else if (autoDeleteSettings) {
        if (tiktokSuccess && !youtubeSuccess && autoDeleteSettings.allowDeletePartialTikTok) {
          shouldClean = true;
        } else if (!tiktokSuccess && youtubeSuccess && autoDeleteSettings.allowDeletePartialYouTube) {
          shouldClean = true;
        } else if (!tiktokSuccess && !youtubeSuccess && autoDeleteSettings.allowDeleteBothFailed) {
          shouldClean = true;
        }
      }
    }

    let cleaned = false;
    let updatedVideo: Video | null = null;

    await withLockedJsonFile<Video[]>(VIDEOS_FILE, [], (videos) => {
      const video = videos.find((v) => v.id === id);
      if (!video) return videos;

      // Apply platform results to the FRESH copy
      if (Object.keys(tiktokUpdates).length > 0) {
        video.tiktok = { ...video.tiktok, ...tiktokUpdates };
      }
      if (Object.keys(youtubeUpdates).length > 0) {
        video.youtube = { ...video.youtube, ...youtubeUpdates };
      }
      video.status = overallStatus;
      updatedVideo = { ...video };

      // Auto-cleanup: remove from the array if needed
      if (shouldClean) {
        return videos.filter((v) => v.id !== id);
      }

      return videos;
    });

    // Delete the video file AFTER the JSON is safely updated
    if (shouldClean) {
      try {
        // Path containment check — prevent path traversal via crafted filename
        const safeName = path.basename(snapshot.filename);
        const resolvedPath = path.resolve(UPLOADS_DIR, safeName);
        if (!resolvedPath.startsWith(path.resolve(UPLOADS_DIR) + path.sep) && resolvedPath !== path.resolve(UPLOADS_DIR, safeName)) {
          console.error('✗ Path traversal blocked:', snapshot.filename);
        } else {
          await fs.unlink(resolvedPath);
          console.log('✓ Video file deleted');
          cleaned = true;
        }
        console.log('✓ Metadata removed');
      } catch (error) {
        console.error('✗ File cleanup failed:', error);
      }
    }

    console.log('========================================');

    return NextResponse.json({
      success: true,
      video: updatedVideo,
      results,
      cleaned,
    });
  } catch (error) {
    console.error('Publish route error:', error);
    return NextResponse.json(
      { error: 'Publish failed — see server logs' },
      { status: 500 }
    );
  } finally {
    // Always release the in-flight lock
    publishingInFlight.delete(id);
  }
}
