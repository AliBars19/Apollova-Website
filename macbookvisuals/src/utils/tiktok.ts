// src/utils/tiktok.ts
import { getValidTikTokToken } from './tokenManager';
import fs from 'fs';

export interface TikTokPublishResult {
  success: boolean;
  videoId?: string;
  publishId?: string;
  error?: string;
}

export interface TikTokPublishOptions {
  title: string;
  privacyLevel: string;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  commercialContent: {
    enabled: boolean;
    yourBrand: boolean;
    brandedContent: boolean;
  };
}

/**
 * Publishes video to TikTok with full Direct Post API compliance
 */
export async function publishToTikTokCompliant(
  videoPath: string,
  options: TikTokPublishOptions
): Promise<TikTokPublishResult> {
  try {
    console.log('Publishing to TikTok (compliant):', videoPath);
    console.log('Options:', options);

    const accessToken = await getValidTikTokToken();
    const videoBuffer = fs.readFileSync(videoPath);
    const videoSize = videoBuffer.length;

    console.log(`Video size: ${(videoSize / 1024 / 1024).toFixed(2)} MB`);

    if (videoSize > 287 * 1024 * 1024) {
      throw new Error('Video exceeds 287MB limit');
    }

    const CHUNK_SIZE = 10 * 1024 * 1024;
    const totalChunkCount = Math.floor(videoSize / CHUNK_SIZE);

    console.log(`Chunks: ${totalChunkCount}`);

    // Build post_info with all compliance fields
    const postInfo: any = {
      title: options.title.substring(0, 150),
      privacy_level: options.privacyLevel,
      disable_comment: options.disableComment,
      disable_duet: options.disableDuet,
      disable_stitch: options.disableStitch,
    };

    // Add commercial content disclosure if enabled
    if (options.commercialContent.enabled) {
      if (options.commercialContent.yourBrand && options.commercialContent.brandedContent) {
        postInfo.brand_content_toggle = true;
        postInfo.brand_organic_toggle = true;
      } else if (options.commercialContent.brandedContent) {
        postInfo.brand_content_toggle = true;
      } else if (options.commercialContent.yourBrand) {
        postInfo.brand_organic_toggle = true;
      }
    }

    // Step 1: Initialize upload
    console.log('Initializing upload...');
    
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: postInfo,
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: CHUNK_SIZE,
          total_chunk_count: totalChunkCount,
        },
      }),
    });

    const initText = await initResponse.text();
    console.log('Init status:', initResponse.status);

    if (!initResponse.ok) {
      throw new Error(`Init failed: ${initText}`);
    }

    const initData = JSON.parse(initText);
    const uploadUrl = initData.data.upload_url;
    const publishId = initData.data.publish_id;

    console.log('✓ Upload initialized, ID:', publishId);

    // Step 2: Upload chunks
    for (let i = 0; i < totalChunkCount; i++) {
      const start = i * CHUNK_SIZE;
      const end = (i === totalChunkCount - 1) ? videoSize : (i + 1) * CHUNK_SIZE;
      const chunk = videoBuffer.slice(start, end);

      console.log(`Uploading chunk ${i + 1}/${totalChunkCount}...`);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Range': `bytes ${start}-${end - 1}/${videoSize}`,
          'Content-Length': chunk.length.toString(),
        },
        body: chunk,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Chunk ${i + 1} failed: ${uploadResponse.status}`);
      }

      console.log(`✓ Chunk ${i + 1}/${totalChunkCount} uploaded`);
    }

    console.log('✓ All chunks uploaded');

    // Step 3: Check status
    console.log('Checking publish status...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));

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
      
      console.log('Status:', status);

      if (status === 'PUBLISH_COMPLETE') {
        const videoId = statusData.data.publicaly_available_post_id?.[0] || publishId;
        console.log('✓ Published directly! Video ID:', videoId);
        
        return {
          success: true,
          videoId: videoId,
          publishId: publishId,
        };
      }
    }

    // Default: uploaded (may be in drafts)
    console.log('✓ Video uploaded with compliance data');
    console.log('📱 Check TikTok app for status');

    return {
      success: true,
      publishId: publishId,
      videoId: publishId,
    };

  } catch (error) {
    console.error('TikTok upload error:', error);
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