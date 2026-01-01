// src/app/api/videos/[id]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { Video } from '@/app/types';
import { publishToTikTokCompliant } from '@/utils/tiktok';
import { publishToYouTube } from '@/utils/youtube';

const DATA_FILE = path.join(process.cwd(), 'data', 'videos.json');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * POST /api/videos/:id/publish
 * Publishes video with full TikTok compliance support
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();

  if (!fs.existsSync(DATA_FILE)) {
    return NextResponse.json({ error: 'No videos data' }, { status: 404 });
  }

  let videos: Video[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const video = videos.find((v) => v.id === id);

  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  console.log('========================================');
  console.log('PUBLISH requested for:', video.filename);
  console.log('Platform:', body.platform || 'both');
  console.log('========================================');

  const videoPath = path.join(UPLOAD_DIR, video.filename);

  if (!fs.existsSync(videoPath)) {
    return NextResponse.json(
      { error: 'Video file not found' },
      { status: 404 }
    );
  }

  video.status = 'publishing';
  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2));

  let tiktokSuccess = false;
  let youtubeSuccess = false;

  // Publish to TikTok with compliance data
  if (!body.platform || body.platform === 'tiktok' || body.platform === 'both') {
    try {
      console.log('\n📱 Publishing to TikTok with compliance data...');
      const tiktokResult = await publishToTikTokCompliant(
        videoPath,
        body.publishData || {
          title: video.tiktok.caption,
          privacyLevel: 'PUBLIC_TO_EVERYONE',
          disableComment: false,
          disableDuet: false,
          disableStitch: false,
          commercialContent: {
            enabled: false,
            yourBrand: false,
            brandedContent: false,
          },
        }
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
  }

  // Publish to YouTube
  if (!body.platform || body.platform === 'youtube' || body.platform === 'both') {
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
  }

  // Update overall video status
  const platformsAttempted = body.platform === 'tiktok' || body.platform === 'youtube' ? 1 : 2;
  const platformsSucceeded = (tiktokSuccess ? 1 : 0) + (youtubeSuccess ? 1 : 0);

  if (platformsSucceeded === platformsAttempted) {
    video.status = 'published';
    console.log('\n✓ All platforms published successfully!');
  } else if (platformsSucceeded > 0) {
    video.status = 'published';
    console.log('\n⚠ Partial success');
  } else {
    video.status = 'failed';
    console.log('\n✗ All platforms failed');
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2));

  // Auto-cleanup if both succeeded
  let cleanupPerformed = false;
  
  if (tiktokSuccess && youtubeSuccess && platformsAttempted === 2) {
    try {
      console.log('\n🗑️  Both platforms successful - cleaning up...');
      
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
        console.log('✓ Video file deleted');
      }

      videos = videos.filter((v) => v.id !== id);
      fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2));
      console.log('✓ Metadata removed');
      
      cleanupPerformed = true;
      
    } catch (cleanupError) {
      console.error('⚠️  Cleanup failed:', cleanupError);
    }
  }

  console.log('========================================\n');

  return NextResponse.json({
    ok: true,
    video: cleanupPerformed ? null : video,
    cleaned: cleanupPerformed,
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
  });
}