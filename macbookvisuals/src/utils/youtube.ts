// src/lib/youtube.ts
import { getValidYouTubeToken } from './tokenManager';
import fs from 'fs';

export interface YouTubePublishResult {
  success: boolean;
  videoId?: string;
  error?: string;
}

/**
 * Publishes a video to YouTube using the Data API v3
 */
export async function publishToYouTube(
  videoPath: string,
  title: string,
  description: string,
  tags: string[],
  categoryId: string = '10', // Music
  privacyStatus: 'public' | 'private' | 'unlisted' = 'public'
): Promise<YouTubePublishResult> {
  try {
    console.log('Publishing to YouTube:', videoPath);

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidYouTubeToken();

    // Read video file
    const videoBuffer = fs.readFileSync(videoPath);
    const videoSize = videoBuffer.length;

    console.log(`Video size: ${(videoSize / 1024 / 1024).toFixed(2)} MB`);

    // Prepare metadata
    const metadata = {
      snippet: {
        title: title,
        description: description,
        tags: tags,
        categoryId: categoryId,
      },
      status: {
        privacyStatus: privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    };

    // Create boundary for multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    // Build multipart body
    const metadataText = JSON.stringify(metadata);
    
    const multipartBody = Buffer.concat([
      Buffer.from(delimiter),
      Buffer.from('Content-Type: application/json; charset=UTF-8\r\n\r\n'),
      Buffer.from(metadataText),
      Buffer.from(delimiter),
      Buffer.from('Content-Type: video/mp4\r\n\r\n'),
      videoBuffer,
      Buffer.from(closeDelimiter),
    ]);

    // Upload to YouTube
    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': multipartBody.length.toString(),
        },
        body: multipartBody,
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      console.error('YouTube upload failed:', errorData);
      throw new Error(`YouTube upload failed: ${errorData}`);
    }

    const responseData = await uploadResponse.json();
    const videoId = responseData.id;

    console.log('✓ YouTube publish complete! Video ID:', videoId);

    return {
      success: true,
      videoId: videoId,
    };

  } catch (error) {
    console.error('YouTube publish error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets YouTube channel info (for testing authentication)
 */
export async function getYouTubeChannelInfo(): Promise<any> {
  try {
    const accessToken = await getValidYouTubeToken();

    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get channel info');
    }

    const data = await response.json();
    return data.items[0];
  } catch (error) {
    console.error('Error getting YouTube channel info:', error);
    throw error;
  }
}