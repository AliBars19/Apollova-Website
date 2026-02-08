// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { AccountId } from '@/utils/tokenManager';
import { parseFilename, generateCaption } from '@/utils/fileParser';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const DATA_DIR = path.join(process.cwd(), 'data');
const VIDEOS_FILE = path.join(DATA_DIR, 'videos.json');

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
  };
  youtube: {
    title: string;
    description: string;
    tags: string[];
    category: string;
    privacy: string;
    status: string;
  };
}

async function readVideos(): Promise<Video[]> {
  try {
    const data = await fs.readFile(VIDEOS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeVideos(videos: Video[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(VIDEOS_FILE, JSON.stringify(videos, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File | null;
    const account = (formData.get('account') as AccountId) || 'aurora';

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Validate account
    if (account !== 'aurora' && account !== 'nova') {
      return NextResponse.json(
        { error: 'Invalid account. Must be "aurora" or "nova"' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${originalName}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filepath, buffer);

    // Parse title and artist from original filename
    const { title, artist } = parseFilename(file.name);
    
    // Generate caption automatically
    const caption = generateCaption(title, artist);
    
    // Generate YouTube description
    const description = `${title} by ${artist}\n\n#Shorts #Music #${artist.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    // Generate tags
    const tags = [
      title.replace(/[^a-zA-Z0-9 ]/g, ''),
      artist.replace(/[^a-zA-Z0-9 ]/g, ''),
      'music',
      'shorts',
      'lyrics',
      'viral'
    ].filter(Boolean);

    // Create video metadata
    const videoId = `vid_${timestamp}`;
    const video: Video = {
      id: videoId,
      filename: filename,
      url: `/uploads/${filename}`,
      uploadedAt: new Date().toISOString(),
      status: 'draft',
      account: account,
      tiktok: {
        caption: caption,
        status: 'pending',
      },
      youtube: {
        title: `${title} - ${artist} #shorts`,
        description: description,
        tags: tags,
        category: '10', // Music
        privacy: 'public',
        status: 'pending',
      },
    };

    // Save to videos.json
    const videos = await readVideos();
    videos.push(video);
    await writeVideos(videos);

    console.log(`Video uploaded: ${filename} (account: ${account})`);
    console.log(`  Title: ${title}`);
    console.log(`  Artist: ${artist}`);
    console.log(`  Caption: ${caption}`);

    return NextResponse.json({
      success: true,
      video: video,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}