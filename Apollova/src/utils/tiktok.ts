// src/utils/tiktok.ts
import { getValidTikTokToken, AccountId } from './tokenManager';
import { proxyFetch } from './proxyFetch';
import fs from 'fs';

// ── Photo Slideshow ─────────────────────────────────────────────────────────

interface PhotoSlideshowOptions {
  caption: string;
  privacyLevel?: string;
  photoImages: string[];    // public HTTPS URLs to PNG/JPEG images
  coverIndex?: number;
  disableComment?: boolean;
  autoAddMusic?: boolean;
}

interface PhotoPublishResult {
  publish_id: string;
  status: string;
}

/**
 * Upload a photo slideshow to TikTok Inbox as a draft.
 *
 * Uses /v2/post/publish/content/init/ with:
 *   media_type: PHOTO
 *   post_mode: MEDIA_UPLOAD  → slides land in app Inbox, user taps Post
 *
 * Privacy defaults to SELF_ONLY (required pre-audit).
 * After TikTok audit approval, pass privacyLevel: 'PUBLIC_TO_EVERYONE'.
 */
export async function uploadPhotoSlideshow(
  options: PhotoSlideshowOptions,
  accountId: AccountId = 'aurora'
): Promise<PhotoPublishResult> {
  const {
    caption,
    privacyLevel = 'SELF_ONLY',
    photoImages,
    coverIndex = 0,
    disableComment = false,
    autoAddMusic = true,
  } = options;

  if (!photoImages || photoImages.length === 0) {
    throw new Error('No photo images provided');
  }
  if (photoImages.length > 35) {
    throw new Error(`TikTok max 35 images, got ${photoImages.length}`);
  }

  const accessToken = await getValidTikTokToken(accountId);

  const body = {
    post_info: {
      title: caption.slice(0, 150),
      description: caption.slice(0, 2200),
      privacy_level: privacyLevel,
      disable_comment: disableComment,
      auto_add_music: autoAddMusic,
    },
    source_info: {
      source: 'PULL_FROM_URL',
      photo_cover_index: coverIndex,
      photo_images: photoImages,
    },
    post_mode: 'MEDIA_UPLOAD',
    media_type: 'PHOTO',
  };

  console.log(`[TikTok] Uploading photo slideshow to ${accountId} (${photoImages.length} images)`);

  const response = await proxyFetch(
    'https://open.tiktokapis.com/v2/post/publish/content/init/',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TikTok photo init failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const publish_id: string = data?.data?.publish_id;

  if (!publish_id) {
    throw new Error(`TikTok returned no publish_id: ${JSON.stringify(data)}`);
  }

  console.log(`[TikTok] Photo slideshow queued → publish_id=${publish_id}`);
  return { publish_id, status: 'PROCESSING_UPLOAD' };
}

/**
 * Poll the publish status for a given publish_id.
 * Returns current status string (e.g. PROCESSING_UPLOAD, PUBLISH_COMPLETE, FAILED).
 */
export async function getPublishStatus(
  publish_id: string,
  accountId: AccountId = 'aurora'
): Promise<{ publish_id: string; status: string; post_id?: string }> {
  const accessToken = await getValidTikTokToken(accountId);

  const response = await proxyFetch(
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Status fetch failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const statusData = data?.data;

  return {
    publish_id,
    status: statusData?.status || 'UNKNOWN',
    post_id: statusData?.publicaly_available_post_id?.[0],
  };
}

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

    // Math.floor per TikTok docs — last chunk uploads remainder bytes
    const totalChunkCount = Math.floor(videoSize / CHUNK_SIZE) || 1;
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

    const initResponse = await proxyFetch(
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

      const uploadResponse = await proxyFetch(upload_url, {
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
        const statusResponse = await proxyFetch(
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

