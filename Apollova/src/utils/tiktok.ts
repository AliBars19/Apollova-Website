// src/utils/tiktok.ts
import { getValidTikTokToken, AccountId } from './tokenManager';
import fs from 'fs';

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

interface TikTokPublishOptions {
  videoId: string;
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

export async function publishToTikTokCompliant(
  videoPath: string,
  options: TikTokPublishOptions,
  accountId: AccountId = 'aurora'
) {
  console.log(`Publishing to TikTok (account: ${accountId}):`, videoPath);
  console.log('Options:', options);

  try {
    const accessToken = await getValidTikTokToken(accountId);
    const videoBuffer = fs.readFileSync(videoPath);
    const videoSize = videoBuffer.length;

    console.log(`Video size: ${(videoSize / (1024 * 1024)).toFixed(2)} MB`);

    // Calculate chunks (Math.floor per TikTok docs)
    const totalChunkCount = Math.floor(videoSize / CHUNK_SIZE);
    console.log(`Chunks: ${totalChunkCount}`);

    // Step 1: Initialize upload
    console.log('Initializing upload...');
    
    const postInfo: any = {
      title: options.title,
      privacy_level: options.privacyLevel,
      disable_comment: options.disableComment,
      disable_duet: options.disableDuet,
      disable_stitch: options.disableStitch,
      video_cover_timestamp_ms: 1000,
    };

    // Add commercial content flags if enabled
    if (options.commercialContent.enabled) {
      if (options.commercialContent.yourBrand) {
        postInfo.brand_content_toggle = true;
      }
      if (options.commercialContent.brandedContent) {
        postInfo.brand_organic_toggle = true;
      }
    }

    const initResponse = await fetch(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
      }
    );

    console.log('Init status:', initResponse.status);

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error('Init failed:', errorText);
      throw new Error(`Init failed: ${errorText}`);
    }

    const initData = await initResponse.json();
    const { publish_id, upload_url } = initData.data;

    console.log(`✓ Upload initialized, ID: ${publish_id}`);

    // Step 2: Upload chunks
    for (let i = 0; i < totalChunkCount; i++) {
      const start = i * CHUNK_SIZE;
      const end = (i === totalChunkCount - 1) ? videoSize : (i + 1) * CHUNK_SIZE;
      const chunk = videoBuffer.slice(start, end);

      console.log(`Uploading chunk ${i + 1}/${totalChunkCount}...`);

      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${start}-${end - 1}/${videoSize}`,
          'Content-Length': chunk.length.toString(),
          'Content-Type': 'video/mp4',
        },
        body: chunk,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Chunk ${i + 1} upload failed: ${uploadResponse.status}`);
      }

      console.log(`✓ Chunk ${i + 1}/${totalChunkCount} uploaded`);
    }

    console.log('✓ All chunks uploaded');

    // Step 3: Poll for publish status until PUBLISH_COMPLETE
    console.log('Waiting for TikTok to process and publish...');
    
    const maxAttempts = 60; // 5 minutes max (5s intervals)
    let attempts = 0;
    let finalStatus = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      try {
        const statusResponse = await fetch(
          'https://open.tiktokapis.com/v2/post/publish/status/fetch/',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({ publish_id }),
          }
        );

        if (!statusResponse.ok) {
          console.error('Status check failed:', statusResponse.status);
          continue;
        }

        const statusData = await statusResponse.json();
        const status = statusData.data?.status;
        
        console.log(`[${attempts}/${maxAttempts}] Status: ${status}`);

        if (status === 'PUBLISH_COMPLETE') {
          finalStatus = statusData.data;
          console.log('✓ Video published successfully!');
          
          if (finalStatus.publicaly_available_post_id?.[0]) {
            console.log(`✓ Post ID: ${finalStatus.publicaly_available_post_id[0]}`);
          }
          
          break;
        } else if (status === 'FAILED') {
          const failReason = statusData.data?.fail_reason || 'Unknown error';
          throw new Error(`Publish failed: ${failReason}`);
        }

        // Continue polling for: PROCESSING_UPLOAD, PROCESSING_DOWNLOAD, PROCESSING_TRANSCODE, etc.
        
      } catch (error) {
        console.error('Status check error:', error);
        // Continue polling even if one check fails
      }
    }

    if (!finalStatus || finalStatus.status !== 'PUBLISH_COMPLETE') {
      console.warn('⚠️  Publish status check timed out - video may still be processing');
      console.warn('Check TikTok app manually to verify publish status');
    }

    return {
      success: true,
      publishId: publish_id,
      status: finalStatus?.status || 'UNKNOWN',
      postId: finalStatus?.publicaly_available_post_id?.[0],
    };

  } catch (error) {
    console.error('TikTok publish error:', error);
    throw error;
  }
}

/**
 * Get TikTok user info for an account
 */
export async function getTikTokUserInfo(accountId: AccountId): Promise<{
  openId?: string;
  username?: string;
  displayName?: string;
} | null> {
  try {
    const accessToken = await getValidTikTokToken(accountId);
    
    const response = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,username,display_name',
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
    if (data.data && data.data.user) {
      return {
        openId: data.data.user.open_id,
        username: data.data.user.username,
        displayName: data.data.user.display_name,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to get TikTok user info:', error);
    return null;
  }
}
