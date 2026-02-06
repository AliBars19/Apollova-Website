// src/app/api/videos/stream/[filename]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const decodedFilename = decodeURIComponent(filename);
    const videoPath = join(process.cwd(), 'public', 'uploads', decodedFilename);
    
    console.log('Streaming video:', videoPath);
    
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
      { error: 'Video not found', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 404 }
    );
  }
}