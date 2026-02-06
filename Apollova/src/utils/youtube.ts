// src/utils/youtube.ts
import { getValidYouTubeToken, AccountId } from './tokenManager';
import fs from 'fs';

interface YouTubeUploadResult {
  success: boolean;
  videoId?: string;
  error?: string;
}

/**
 * Publish video to YouTube using a specific account
 */
export async function publishToYouTube(
  videoPath: string,
  title: string,
  description: string,
  tags: string[],
  category: string = '10', // Music category
  privacy: 'public' | 'private' | 'unlisted' = 'public',
  accountId: AccountId = 'aurora'
): Promise<YouTubeUploadResult> {
  try {
    console.log(`Publishing to YouTube (account: ${accountId})...`);
    
    // Get valid access token for the specific account
    const accessToken = await getValidYouTubeToken(accountId);

    // Read video file
    const videoBuffer = fs.readFileSync(videoPath);
    const videoSize = videoBuffer.length;

    console.log(`Video size: ${(videoSize / 1024 / 1024).toFixed(2)} MB`);

    // Step 1: Initialize resumable upload
    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'video/mp4',
          'X-Upload-Content-Length': videoSize.toString(),
        },
        body: JSON.stringify({
          snippet: {
            title: title,
            description: description,
            tags: tags,
            categoryId: category,
          },
          status: {
            privacyStatus: privacy,
            selfDeclaredMadeForKids: false,
          },
        }),
      }
    );

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error('YouTube init failed:', errorText);
      throw new Error(`Failed to initialize upload: ${initResponse.status}`);
    }

    // Get the upload URL from the response headers
    const uploadUrl = initResponse.headers.get('location');
    if (!uploadUrl) {
      throw new Error('No upload URL received from YouTube');
    }

    console.log('Upload initialized, uploading video...');

    // Step 2: Upload the video
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoSize.toString(),
      },
      body: videoBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('YouTube upload failed:', errorText);
      throw new Error(`Failed to upload video: ${uploadResponse.status}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('YouTube upload successful! Video ID:', uploadResult.id);

    return {
      success: true,
      videoId: uploadResult.id,
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
 * Get YouTube channel info for an account
 */
export async function getYouTubeChannelInfo(accountId: AccountId): Promise<{
  channelId?: string;
  channelTitle?: string;
  subscriberCount?: string;
} | null> {
  try {
    const accessToken = await getValidYouTubeToken(accountId);
    
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      return {
        channelId: channel.id,
        channelTitle: channel.snippet.title,
        subscriberCount: channel.statistics.subscriberCount,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to get YouTube channel info:', error);
    return null;
  }
}
