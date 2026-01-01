// src/lib/tiktok.ts
import { getValidTikTokToken } from './tokenManager';
import fs from 'fs';

export interface TikTokPublishResult {
  success: boolean;
  videoId?: string;
  publishId?: string;
  error?: string;
}

/**
 * Publishes a video to TikTok using Direct Post API
 * This is the API you have approved (video.publish scope)
 */
export async function publishToTikTok(
  videoPath: string,
  caption: string
): Promise<TikTokPublishResult> {
  try {
    console.log('Publishing to TikTok using Direct Post API:', videoPath);

    // Get valid access token
    const accessToken = await getValidTikTokToken();

    // Read video file
    const videoBuffer = fs.readFileSync(videoPath);
    const videoSize = videoBuffer.length;

    console.log(`Video size: ${(videoSize / 1024 / 1024).toFixed(2)} MB`);

    // TikTok file size limit
    if (videoSize > 287 * 1024 * 1024) {
      throw new Error('Video exceeds TikTok file size limit (287MB)');
    }

    // Step 1: Initialize Direct Post
    console.log('Initializing TikTok Direct Post...');
    
    const initBody = {
      post_info: {
        title: caption.substring(0, 150), // Max 150 chars
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'FILE_UPLOAD',
      },
      post_mode: 'DIRECT_POST', // This is the key difference!
      media_type: 'VIDEO',
    };

    console.log('Request:', JSON.stringify(initBody, null, 2));

    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(initBody),
    });

    const initText = await initResponse.text();
    console.log('Response status:', initResponse.status);
    console.log('Response:', initText);

    if (!initResponse.ok) {
      throw new Error(`TikTok Direct Post init failed: ${initText}`);
    }

    const initData = JSON.parse(initText);
    const publishId = initData.data.publish_id;
    const uploadUrl = initData.data.upload_url;

    console.log('✓ Direct Post initialized');
    console.log('Publish ID:', publishId);

    // Step 2: Upload video file
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
      const uploadError = await uploadResponse.text();
      console.error('Upload failed:', uploadError);
      throw new Error(`Video upload failed: ${uploadError}`);
    }

    console.log('✓ Video uploaded');

    // Step 3: Wait for processing and get video ID
    console.log('Waiting for TikTok to process video...');
    
    let attempts = 0;
    const maxAttempts = 40;
    let videoId = '';
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check status
      const statusResponse = await fetch(`https://open.tiktokapis.com/v2/post/publish/status/fetch/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publish_id: publishId,
        }),
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const status = statusData.data.status;
        
        console.log(`Check ${attempts + 1}/${maxAttempts}: ${status}`);

        if (status === 'PUBLISH_COMPLETE') {
          if (statusData.data.publicaly_available_post_id) {
            videoId = statusData.data.publicaly_available_post_id[0];
          }
          
          console.log('✓ Published! Video ID:', videoId);
          
          return {
            success: true,
            videoId: videoId,
            publishId: publishId,
          };
        } else if (status === 'FAILED') {
          const reason = statusData.data.fail_reason || 'Unknown';
          throw new Error(`Publish failed: ${reason}`);
        }
      }
      
      attempts++;
    }

    // Timeout
    return {
      success: false,
      publishId: publishId,
      error: 'Timeout waiting for publish',
    };

  } catch (error) {
    console.error('TikTok Direct Post error:', error);
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