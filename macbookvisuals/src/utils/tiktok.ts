// src/lib/tiktok.ts
import { getValidTikTokToken } from './tokenManager';
import fs from 'fs';
import path from 'path';

export interface TikTokPublishResult {
  success: boolean;
  videoId?: string;
  publishId?: string;
  error?: string;
}

/**
 * Publishes a video to TikTok using the Content Posting API
 */
export async function publishToTikTok(
  videoPath: string,
  caption: string
): Promise<TikTokPublishResult> {
  try {
    console.log('Publishing to TikTok:', videoPath);

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidTikTokToken();

    // Read video file
    const videoBuffer = fs.readFileSync(videoPath);
    const videoSize = videoBuffer.length;

    console.log(`Video size: ${(videoSize / 1024 / 1024).toFixed(2)} MB`);

    // Step 1: Initialize upload
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title: caption,
          privacy_level: 'SELF_ONLY', // Use 'PUBLIC_TO_EVERYONE' for public
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: videoSize, // Upload in one chunk for simplicity
          total_chunk_count: 1,
        },
      }),
    });

    if (!initResponse.ok) {
      const errorData = await initResponse.text();
      console.error('TikTok init failed:', errorData);
      throw new Error(`TikTok init failed: ${errorData}`);
    }

    const initData = await initResponse.json();
    const uploadUrl = initData.data.upload_url;
    const publishId = initData.data.publish_id;

    console.log('Upload initialized, publish_id:', publishId);

    // Step 2: Upload video to the provided URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoSize.toString(),
      },
      body: videoBuffer,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      console.error('TikTok upload failed:', errorData);
      throw new Error(`TikTok upload failed: ${errorData}`);
    }

    console.log('Video uploaded successfully');

    // Step 3: Check publish status
    let attempts = 0;
    const maxAttempts = 20;
    let publishStatus = 'PROCESSING';
    let videoId = '';

    while (attempts < maxAttempts && publishStatus === 'PROCESSING') {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

      const statusResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          publish_id: publishId,
        }),
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        publishStatus = statusData.data.status;
        
        if (statusData.data.publicaly_available_post_id) {
          videoId = statusData.data.publicaly_available_post_id[0];
        }

        console.log(`Attempt ${attempts + 1}: Status = ${publishStatus}`);

        if (publishStatus === 'PUBLISH_COMPLETE') {
          console.log('✓ TikTok publish complete! Video ID:', videoId);
          return {
            success: true,
            videoId: videoId,
            publishId: publishId,
          };
        } else if (publishStatus === 'FAILED') {
          throw new Error('TikTok publish failed');
        }
      }

      attempts++;
    }

    // Timeout - still processing
    console.log('⏱ TikTok publish still processing after max attempts');
    return {
      success: false,
      publishId: publishId,
      error: 'Publish timeout - still processing',
    };

  } catch (error) {
    console.error('TikTok publish error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets TikTok user info (for testing authentication)
 */
export async function getTikTokUserInfo(): Promise<any> {
  try {
    const accessToken = await getValidTikTokToken();

    const response = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json();
    return data.data.user;
  } catch (error) {
    console.error('Error getting TikTok user info:', error);
    throw error;
  }
}