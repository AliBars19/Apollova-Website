// src/app/api/videos/[id]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { Video } from '@/app/types';
import { publishToTikTok } from '@/utils/tiktok';
import { publishToYouTube } from '@/utils/youtube';

const DATA_FILE = path.join(process.cwd(), 'data', 'videos.json');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * POST /api/videos/:id/publish
 * Publishes video to both TikTok and YouTube
 */
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!fs.existsSync(DATA_FILE)) {
    return NextResponse.json({ error: 'No videos data' }, { status: 404 });
  }

  const videos: Video[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const video = videos.find((v) => v.id === id);

  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  console.log('========================================');
  console.log('PUBLISH requested for:', video.filename);
  console.log('TikTok caption:', video.tiktok.caption);
  console.log('YouTube title:', video.youtube.title);
  console.log('========================================');

  // Get video file path
  const videoPath = path.join(UPLOAD_DIR, video.filename);

  if (!fs.existsSync(videoPath)) {
    return NextResponse.json(
      { error: 'Video file not found' },
      { status: 404 }
    );
  }

  // Update status to "publishing"
  video.status = 'publishing';
  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2));

  // Track results
  let tiktokSuccess = false;
  let youtubeSuccess = false;

  // Publish to TikTok
  try {
    console.log('\n📱 Publishing to TikTok...');
    const tiktokResult = await publishToTikTok(
      videoPath,
      video.tiktok.caption
    );

    if (tiktokResult.success) {
      console.log('✓ TikTok publish succeeded');
      video.tiktok.status = 'published';
      video.tiktok.videoId = tiktokResult.videoId;
      video.tiktok.publishedAt = new Date().toISOString();
      tiktokSuccess = true;
    } else {
      console.log('✗ TikTok publish failed:', tiktokResult.error);
      video.tiktok.status = 'failed';
      video.tiktok.error = tiktokResult.error;
    }
  } catch (error) {
    console.error('TikTok publish error:', error);
    video.tiktok.status = 'failed';
    video.tiktok.error = error instanceof Error ? error.message : 'Unknown error';
  }

  // Publish to YouTube
  try {
    console.log('\n📺 Publishing to YouTube...');
    const youtubeResult = await publishToYouTube(
      videoPath,
      video.youtube.title,
      video.youtube.description,
      video.youtube.tags,
      video.youtube.category,
      video.youtube.privacy
    );

    if (youtubeResult.success) {
      console.log('✓ YouTube publish succeeded');
      video.youtube.status = 'published';
      video.youtube.videoId = youtubeResult.videoId;
      video.youtube.publishedAt = new Date().toISOString();
      youtubeSuccess = true;
    } else {
      console.log('✗ YouTube publish failed:', youtubeResult.error);
      video.youtube.status = 'failed';
      video.youtube.error = youtubeResult.error;
    }
  } catch (error) {
    console.error('YouTube publish error:', error);
    video.youtube.status = 'failed';
    video.youtube.error = error instanceof Error ? error.message : 'Unknown error';
  }

  // Update overall video status
  if (tiktokSuccess && youtubeSuccess) {
    video.status = 'published';
    console.log('\n✓✓ Both platforms published successfully!');
  } else if (tiktokSuccess || youtubeSuccess) {
    video.status = 'published'; // Partial success
    console.log('\n⚠ Partial success - one platform failed');
  } else {
    video.status = 'failed';
    console.log('\n✗✗ Both platforms failed');
  }

  // Save updated video data
  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2));

  console.log('========================================\n');

  return NextResponse.json({
    ok: true,
    video,
    results: {
      tiktok: {
        success: tiktokSuccess,
        videoId: video.tiktok.videoId,
        error: video.tiktok.error,
      },
      youtube: {
        success: youtubeSuccess,
        videoId: video.youtube.videoId,
        error: video.youtube.error,
      },
    },
    message: tiktokSuccess && youtubeSuccess
      ? 'Published to both platforms successfully'
      : tiktokSuccess || youtubeSuccess
      ? 'Published to one platform (check errors for failed platform)'
      : 'Failed to publish to both platforms',
  });
}