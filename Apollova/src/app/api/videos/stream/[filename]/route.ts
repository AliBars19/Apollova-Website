// src/app/api/videos/stream/[filename]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join, resolve, basename } from 'path';

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const decodedFilename = decodeURIComponent(filename);

    // Sanitize: strip any directory components to prevent path traversal
    const safeName = basename(decodedFilename);

    // Resolve and verify the path stays inside the uploads directory
    const videoPath = resolve(UPLOADS_DIR, safeName);
    if (!videoPath.startsWith(resolve(UPLOADS_DIR))) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const videoBuffer = await readFile(videoPath);

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.length.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Video stream error:', error);
    return NextResponse.json(
      { error: 'Video not found' },
      { status: 404 }
    );
  }
}
