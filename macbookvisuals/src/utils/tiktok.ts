// src/lib/tiktok.ts
import { getValidTikTokToken } from './tokenManager';
import fs from 'fs';

export interface TikTokPublishResult {
  success: boolean;
  videoId?: string;
  publishId?: string;
  error?: string;
}

export async function publishToTikTok(
  videoPath: string,
  caption: string
): Promise<TikTokPublishResult> {
  try {
    console.log('Publishing to TikTok:', videoPath);

    const accessToken = await getValidTikTokToken();
    const videoBuffer = fs.readFileSync(videoPath);
    const videoSize = videoBuffer.length;

    console.log(`Video size: ${(videoSize / 1024 / 1024).toFixed(2)} MB`);

    if (videoSize > 287 * 1024 * 1024) {
      throw new Error('Video exceeds 287MB limit');
    }

    // Chunk parameters - upload entire file as one chunk
    const chunkSize = 17000000;
    const totalChunkCount = 7;

    console.log('Initializing upload...');
    console.log(`Chunk size: ${chunkSize}, Total chunks: ${totalChunkCount}`);

    // Step 1: Initialize upload - CORRECT ENDPOINT
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: chunkSize,
          total_chunk_count: totalChunkCount,
        },
      }),
    });

    const initText = await initResponse.text();
    console.log('Init response status:', initResponse.status);
    console.log('Init response:', initText);

    if (!initResponse.ok) {
      throw new Error(`Init failed: ${initText}`);
    }

    const initData = JSON.parse(initText);
    const uploadUrl = initData.data.upload_url;
    const publishId = initData.data.publish_id;

    console.log('✓ Upload initialized');
    console.log('Publish ID:', publishId);

    // Step 2: Upload video
    console.log('Uploading video...');
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoSize.toString(),
      },
      body: videoBuffer,
    });

    console.log('Upload status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    console.log('✓ Video uploaded');

    // Step 3: Publish with post info
    console.log('Publishing with caption...');
    
    const publishResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/publish/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        publish_id: publishId,
        post_info: {
          title: caption.substring(0, 150),
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
      }),
    });

    const publishText = await publishResponse.text();
    console.log('Publish status:', publishResponse.status);
    console.log('Publish response:', publishText);

    if (!publishResponse.ok) {
      throw new Error(`Publish failed: ${publishText}`);
    }

    const publishData = JSON.parse(publishText);
    
    console.log('✓ Published to TikTok!');

    // Wait for processing
    console.log('Checking status...');
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));

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
        const status = statusData.data.status;

        console.log(`Attempt ${attempts + 1}: ${status}`);

        if (status === 'PUBLISH_COMPLETE') {
          const videoId = statusData.data.publicaly_available_post_id?.[0] || publishId;
          console.log('✓ TikTok publish complete! Video ID:', videoId);
          
          return {
            success: true,
            videoId: videoId,
            publishId: publishId,
          };
        } else if (status === 'FAILED') {
          throw new Error(`Publish failed: ${statusData.data.fail_reason || 'Unknown'}`);
        }
      }

      attempts++;
    }

    return {
      success: false,
      publishId: publishId,
      error: 'Timeout waiting for publish',
    };

  } catch (error) {
    console.error('TikTok error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets TikTok user info
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