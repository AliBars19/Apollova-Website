// src/app/api/videos/[id]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { publishToYouTube } from '@/utils/youtube';
import { publishToTikTokCompliant } from '@/utils/tiktok';
import { AccountId } from '@/utils/tokenManager';

const DATA_DIR = path.join(process.cwd(), 'data');
const VIDEOS_FILE = path.join(DATA_DIR, 'videos.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

interface Video {
  id: string;
  filename: string;
  url: string;
  uploadedAt: string;
  status: string;
  scheduledAt?: string;
  account: AccountId;
  tiktok: {
    caption: string;
    status: string;
    publishId?: string;
    videoId?: string;
    publishedAt?: string;
    error?: string;
  };
  youtube: {
    title: string;
    description: string;
    tags: string[];
    category: string;
    privacy: string;
    status: string;
    videoId?: string;
    publishedAt?: string;
    error?: string;
  };
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { platform, publishData } = body;

    console.log('========================================');
    console.log(`PUBLISH requested for video ID: ${id}`);
    console.log('Platform:', platform);
    console.log('========================================');

    const videos = await readVideos();
    const video = videos.find((v) => v.id === id);

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Get account from video (defaults to 'aurora' for backwards compatibility)
    const accountId: AccountId = video.account || 'aurora';
    console.log(`Using account: ${accountId}`);

    const videoPath = path.join(UPLOADS_DIR, video.filename);
    console.log(`Video: ${video.filename}`);

    let tiktokSuccess = false;
    let youtubeSuccess = false;
    const results: any = {};

    // TikTok Publishing
    if (platform === 'tiktok' || platform === 'both') {
      try {
        console.log(`📱 Publishing to TikTok (${accountId})...`);
        const tiktokResult = await publishToTikTokCompliant(videoPath, publishData, accountId);

        if (tiktokResult.success && tiktokResult.status === 'PUBLISH_COMPLETE') {
          console.log('✓ TikTok publish succeeded');
          video.tiktok.status = 'published';
          video.tiktok.videoId = tiktokResult.postId;
          video.tiktok.publishId = tiktokResult.publishId;
          video.tiktok.publishedAt = new Date().toISOString();
          tiktokSuccess = true;
          results.tiktok = { success: true, videoId: tiktokResult.postId };
        } else {
          console.log('⚠️  TikTok publish incomplete:', tiktokResult.status);
          video.tiktok.status = 'processing';
          video.tiktok.publishId = tiktokResult.publishId;
          video.tiktok.error = `Status: ${tiktokResult.status}`;
          results.tiktok = { success: false, error: `Status: ${tiktokResult.status}` };
        }
      } catch (error) {
        console.error('✗ TikTok publish failed:', error);
        video.tiktok.status = 'failed';
        video.tiktok.error = error instanceof Error ? error.message : 'Unknown error';
        results.tiktok = { success: false, error: video.tiktok.error };
      }
    }

    // YouTube Publishing
    if (platform === 'youtube' || platform === 'both') {
      try {
        console.log(`📺 Publishing to YouTube (${accountId})...`);
        const youtubeResult = await publishToYouTube(
          videoPath,
          video.youtube.title,
          video.youtube.description,
          video.youtube.tags,
          video.youtube.category,
          video.youtube.privacy as 'public' | 'private' | 'unlisted',
          accountId
        );

        if (youtubeResult.success) {
          console.log('✓ YouTube publish succeeded');
          video.youtube.status = 'published';
          video.youtube.videoId = youtubeResult.videoId;
          video.youtube.publishedAt = new Date().toISOString();
          youtubeSuccess = true;
          results.youtube = { success: true, videoId: youtubeResult.videoId };
        } else {
          console.error('✗ YouTube publish failed:', youtubeResult.error);
          video.youtube.status = 'failed';
          video.youtube.error = youtubeResult.error || 'Unknown error';
          results.youtube = { success: false, error: video.youtube.error };
        }
      } catch (error) {
        console.error('✗ YouTube publish failed:', error);
        video.youtube.status = 'failed';
        video.youtube.error = error instanceof Error ? error.message : 'Unknown error';
        results.youtube = { success: false, error: video.youtube.error };
      }
    }

    // Update overall video status
    if (platform === 'both') {
      if (tiktokSuccess && youtubeSuccess) {
        video.status = 'published';
      } else if (tiktokSuccess || youtubeSuccess) {
        video.status = 'partial';
      } else {
        video.status = 'failed';
      }
    } else if (platform === 'tiktok') {
      video.status = tiktokSuccess ? 'published' : 'failed';
    } else if (platform === 'youtube') {
      video.status = youtubeSuccess ? 'published' : 'failed';
    }

    // Save updated metadata
    await writeVideos(videos);

    // Auto-cleanup if both platforms succeeded
    let cleaned = false;
    if (platform === 'both' && tiktokSuccess && youtubeSuccess) {
      console.log('🗑️  Both platforms successful - cleaning up...');
      try {
        await fs.unlink(videoPath);
        console.log('✓ Video file deleted');

        const updatedVideos = videos.filter((v) => v.id !== id);
        await writeVideos(updatedVideos);
        console.log('✓ Metadata removed');
        cleaned = true;
      } catch (error) {
        console.error('✗ Cleanup failed:', error);
      }
    }

    console.log('========================================');

    return NextResponse.json({
      success: true,
      video,
      results,
      cleaned,
    });
  } catch (error) {
    console.error('Publish route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
