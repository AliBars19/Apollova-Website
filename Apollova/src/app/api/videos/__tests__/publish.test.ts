// src/app/api/videos/__tests__/publish.test.ts
//
// Integration tests for POST /api/videos/[id]/publish
//
// Strategy:
//   - vi.mock() the two publish utilities and the fileUtils I/O layer.
//   - withLockedJsonFile is backed by a per-test in-memory video store so
//     the read-modify-write cycle works the same way as production.
//   - Construct mock NextRequest objects using the standard URL + RequestInit API.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE the route import so vi.mock hoisting works
// ---------------------------------------------------------------------------

vi.mock('@/utils/youtube', () => ({
  publishToYouTube: vi.fn(),
}));

vi.mock('@/utils/tiktok', () => ({
  publishToTikTokCompliant: vi.fn(),
}));

// In-memory video store that withLockedJsonFile operates on
const { storeRef } = vi.hoisted(() => ({
  storeRef: { videos: [] as Record<string, unknown>[] },
}));

vi.mock('@/utils/fileUtils', () => ({
  withLockedJsonFile: vi.fn(async (
    _filePath: string,
    fallback: unknown[],
    updater: (current: unknown[]) => unknown[] | Promise<unknown[]>,
  ) => {
    const current = storeRef.videos.length > 0
      ? JSON.parse(JSON.stringify(storeRef.videos))
      : fallback;
    const updated = await updater(current);
    storeRef.videos = updated as Record<string, unknown>[];
    return updated;
  }),
}));

// fs/promises — the route uses `import fs from 'fs/promises'` and calls `fs.unlink`.
const { mockUnlinkFn } = vi.hoisted(() => ({ mockUnlinkFn: vi.fn() }));

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    ...actual,
    unlink: mockUnlinkFn,
    default: {
      ...actual,
      unlink: mockUnlinkFn,
    },
  };
});

// ---------------------------------------------------------------------------
// Import route handler + mocks after vi.mock declarations
// ---------------------------------------------------------------------------

import { POST } from '../[id]/publish/route';
import { publishToYouTube } from '@/utils/youtube';
import { publishToTikTokCompliant } from '@/utils/tiktok';
import { withLockedJsonFile } from '@/utils/fileUtils';

// Typed mock helpers
const mockPublishToYouTube = vi.mocked(publishToYouTube);
const mockPublishToTikTok = vi.mocked(publishToTikTokCompliant);
const mockWithLockedJsonFile = vi.mocked(withLockedJsonFile);
const mockUnlink = mockUnlinkFn;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeVideo(overrides: Record<string, unknown> = {}) {
  return {
    id: 'vid-001',
    filename: 'test-video.mp4',
    url: '/uploads/test-video.mp4',
    uploadedAt: '2025-01-01T00:00:00.000Z',
    status: 'scheduled',
    account: 'aurora',
    tiktok: {
      caption: 'Test caption #music',
      status: 'pending',
    },
    youtube: {
      title: 'Test Video',
      description: 'A test video',
      tags: ['music', 'test'],
      category: '10',
      privacy: 'public',
      status: 'pending',
    },
    ...overrides,
  };
}

function makeRequest(body: Record<string, unknown>, id = 'vid-001'): NextRequest {
  return new NextRequest(`http://localhost:3000/api/videos/${id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeParams(id = 'vid-001') {
  return { params: Promise.resolve({ id }) };
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  storeRef.videos = [];
  mockUnlink.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
  storeRef.videos = [];
});

// ---------------------------------------------------------------------------
// Happy path — YouTube only
// ---------------------------------------------------------------------------

describe('POST /api/videos/[id]/publish — YouTube only', () => {
  it('returns success with videoId when YouTube publish succeeds', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-abc123' });

    const req = makeRequest({ platform: 'youtube', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.results.youtube.success).toBe(true);
    expect(body.results.youtube.videoId).toBe('yt-abc123');
    expect(body.video.youtube.status).toBe('published');
    expect(body.video.status).toBe('published');
  });

  it('sets video status to failed when YouTube publish returns failure', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockResolvedValue({ success: false, error: 'Quota exceeded' });

    const req = makeRequest({ platform: 'youtube', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results.youtube.success).toBe(false);
    expect(body.results.youtube.error).toBe('Quota exceeded');
    expect(body.video.status).toBe('failed');
  });

  it('sets video status to failed when YouTube publish throws', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockRejectedValue(new Error('Network failure'));

    const req = makeRequest({ platform: 'youtube', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results.youtube.success).toBe(false);
    expect(body.results.youtube.error).toBe('Network failure');
    expect(body.video.status).toBe('failed');
  });
});

// ---------------------------------------------------------------------------
// Happy path — TikTok only
// ---------------------------------------------------------------------------

describe('POST /api/videos/[id]/publish — TikTok only', () => {
  it('returns success when TikTok publish succeeds with PUBLISH_COMPLETE', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToTikTok.mockResolvedValue({
      success: true,
      status: 'PUBLISH_COMPLETE',
      publishId: 'tt-pub-001',
      postId: 'tt-post-001',
    });

    const req = makeRequest({ platform: 'tiktok', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results.tiktok.success).toBe(true);
    expect(body.results.tiktok.videoId).toBe('tt-post-001');
    expect(body.video.tiktok.status).toBe('published');
    expect(body.video.status).toBe('published');
  });

  it('marks as processing when TikTok returns non-PUBLISH_COMPLETE status', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToTikTok.mockResolvedValue({
      success: true,
      status: 'PROCESSING_UPLOAD',
      publishId: 'tt-pub-002',
      postId: '',
    });

    const req = makeRequest({ platform: 'tiktok', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results.tiktok.success).toBe(false);
    expect(body.video.tiktok.status).toBe('processing');
    expect(body.video.status).toBe('failed');
  });

  it('sets status to failed when TikTok publish throws', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToTikTok.mockRejectedValue(new Error('TikTok API error'));

    const req = makeRequest({ platform: 'tiktok', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results.tiktok.success).toBe(false);
    expect(body.results.tiktok.error).toBe('TikTok API error');
    expect(body.video.status).toBe('failed');
  });
});

// ---------------------------------------------------------------------------
// Both platforms
// ---------------------------------------------------------------------------

describe('POST /api/videos/[id]/publish — both platforms', () => {
  it('sets status published when both platforms succeed', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-123' });
    mockPublishToTikTok.mockResolvedValue({
      success: true,
      status: 'PUBLISH_COMPLETE',
      publishId: 'tt-001',
      postId: 'tt-post-001',
    });

    const req = makeRequest({ platform: 'both', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(body.video.status).toBe('published');
    expect(body.results.youtube.success).toBe(true);
    expect(body.results.tiktok.success).toBe(true);
  });

  it('sets status partial when YouTube succeeds and TikTok fails', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-123' });
    mockPublishToTikTok.mockRejectedValue(new Error('TikTok down'));

    const req = makeRequest({ platform: 'both', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(body.video.status).toBe('partial');
    expect(body.results.youtube.success).toBe(true);
    expect(body.results.tiktok.success).toBe(false);
  });

  it('sets status partial when TikTok succeeds and YouTube fails', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockResolvedValue({ success: false, error: 'YT error' });
    mockPublishToTikTok.mockResolvedValue({
      success: true,
      status: 'PUBLISH_COMPLETE',
      publishId: 'tt-001',
      postId: 'tt-post-001',
    });

    const req = makeRequest({ platform: 'both', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(body.video.status).toBe('partial');
    expect(body.results.tiktok.success).toBe(true);
    expect(body.results.youtube.success).toBe(false);
  });

  it('sets status failed when both platforms fail', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockResolvedValue({ success: false, error: 'YT error' });
    mockPublishToTikTok.mockRejectedValue(new Error('TikTok error'));

    const req = makeRequest({ platform: 'both', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(body.video.status).toBe('failed');
    expect(body.results.youtube.success).toBe(false);
    expect(body.results.tiktok.success).toBe(false);
  });

  it('sets cleaned=true and calls unlink when both platforms succeed', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-123' });
    mockPublishToTikTok.mockResolvedValue({
      success: true,
      status: 'PUBLISH_COMPLETE',
      publishId: 'tt-001',
      postId: 'tt-post-001',
    });

    const req = makeRequest({ platform: 'both', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(body.cleaned).toBe(true);
    expect(mockUnlink).toHaveBeenCalledOnce();
    // Video should be removed from the store
    expect(storeRef.videos).toHaveLength(0);
  });

  it('does not clean up when autoDeleteSettings is not set and publish is partial', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-123' });
    mockPublishToTikTok.mockRejectedValue(new Error('TikTok down'));

    const req = makeRequest({ platform: 'both', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(body.cleaned).toBe(false);
    expect(mockUnlink).not.toHaveBeenCalled();
    // Video should still be in the store
    expect(storeRef.videos).toHaveLength(1);
  });

  it('auto-deletes on partial TikTok success when allowDeletePartialTikTok is true', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockRejectedValue(new Error('YT down'));
    mockPublishToTikTok.mockResolvedValue({
      success: true,
      status: 'PUBLISH_COMPLETE',
      publishId: 'tt-001',
      postId: 'tt-post-001',
    });

    const req = makeRequest({
      platform: 'both',
      publishData: {},
      autoDeleteSettings: { allowDeletePartialTikTok: true, allowDeletePartialYouTube: false, allowDeleteBothFailed: false },
    });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(body.cleaned).toBe(true);
    expect(mockUnlink).toHaveBeenCalledOnce();
  });

  it('auto-deletes on both-failed when allowDeleteBothFailed is true', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockResolvedValue({ success: false, error: 'YT error' });
    mockPublishToTikTok.mockRejectedValue(new Error('TikTok error'));

    const req = makeRequest({
      platform: 'both',
      publishData: {},
      autoDeleteSettings: { allowDeletePartialTikTok: false, allowDeletePartialYouTube: false, allowDeleteBothFailed: true },
    });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(body.cleaned).toBe(true);
    expect(mockUnlink).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// 404 — video not found
// ---------------------------------------------------------------------------

describe('POST /api/videos/[id]/publish — 404 not found', () => {
  it('returns 404 when video ID does not exist in the store', async () => {
    storeRef.videos = [makeVideo()];

    const req = makeRequest({ platform: 'youtube', publishData: {} }, 'non-existent-id');
    const res = await POST(req, makeParams('non-existent-id'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Video not found');
  });

  it('returns 404 when the video store is empty', async () => {
    storeRef.videos = [];

    const req = makeRequest({ platform: 'youtube', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Video not found');
  });
});

// ---------------------------------------------------------------------------
// 409 — in-flight guard (concurrent publish)
// ---------------------------------------------------------------------------

describe('POST /api/videos/[id]/publish — 409 concurrent guard', () => {
  it('returns 409 when the same video is already being published', async () => {
    storeRef.videos = [makeVideo()];

    // First call: YouTube takes a long time
    let resolveFirstPublish!: (v: { success: boolean; videoId: string }) => void;
    const firstPublishPromise = new Promise<{ success: boolean; videoId: string }>(
      (resolve) => { resolveFirstPublish = resolve; }
    );
    mockPublishToYouTube.mockReturnValueOnce(firstPublishPromise);

    const firstReq = makeRequest({ platform: 'youtube', publishData: {} });
    const firstCallPromise = POST(firstReq, makeParams());

    // Give the first call a microtask tick to enter publishingInFlight
    await Promise.resolve();
    await Promise.resolve();

    // Second call for the same ID should be rejected immediately
    const secondReq = makeRequest({ platform: 'youtube', publishData: {} });
    const secondRes = await POST(secondReq, makeParams());
    const secondBody = await secondRes.json();

    expect(secondRes.status).toBe(409);
    expect(secondBody.error).toMatch(/already being published/i);

    // Clean up: resolve the first call
    resolveFirstPublish({ success: true, videoId: 'yt-cleanup' });
    await firstCallPromise;
  });
});

// ---------------------------------------------------------------------------
// Account fallback
// ---------------------------------------------------------------------------

describe('POST /api/videos/[id]/publish — account resolution', () => {
  it('uses the account field from the video record', async () => {
    storeRef.videos = [makeVideo({ account: 'mono' })];
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-mono-001' });

    const req = makeRequest({ platform: 'youtube', publishData: {} });
    const res = await POST(req, makeParams());
    await res.json();

    expect(mockPublishToYouTube).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(Array),
      expect.any(String),
      expect.any(String),
      'mono'
    );
  });
});

// ---------------------------------------------------------------------------
// Data persistence — withLockedJsonFile is used for read-modify-write
// ---------------------------------------------------------------------------

describe('POST /api/videos/[id]/publish — persistence', () => {
  it('calls withLockedJsonFile for both snapshot and result writes', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-save-001' });

    const req = makeRequest({ platform: 'youtube', publishData: {} });
    await POST(req, makeParams());

    // withLockedJsonFile should be called twice:
    // 1) snapshot read + mark 'publishing'
    // 2) apply results
    expect(mockWithLockedJsonFile).toHaveBeenCalledTimes(2);
  });

  it('stores publishedAt ISO string in youtube metadata', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-time-001' });

    const before = new Date().toISOString();
    const req = makeRequest({ platform: 'youtube', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();
    const after = new Date().toISOString();

    expect(body.video.youtube.publishedAt).toBeDefined();
    expect(body.video.youtube.publishedAt >= before).toBe(true);
    expect(body.video.youtube.publishedAt <= after).toBe(true);
  });

  it('preserves other videos in the store during publish', async () => {
    const otherVideo = makeVideo({ id: 'vid-002', filename: 'other.mp4' });
    storeRef.videos = [makeVideo(), otherVideo];
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-001' });

    const req = makeRequest({ platform: 'youtube', publishData: {} });
    await POST(req, makeParams());

    // Both videos should still be in the store (no cleanup for youtube-only)
    expect(storeRef.videos).toHaveLength(2);
    const other = storeRef.videos.find((v: Record<string, unknown>) => v.id === 'vid-002');
    expect(other).toBeDefined();
  });

  it('does not overwrite concurrent uploads during publish', async () => {
    // Simulate: a new video is added to the store AFTER the snapshot read
    // but BEFORE the result write. The new video must survive.
    storeRef.videos = [makeVideo()];

    // Intercept the second withLockedJsonFile call to inject a concurrent upload
    let callCount = 0;
    mockWithLockedJsonFile.mockImplementation(async (_filePath, fallback, updater) => {
      callCount++;
      if (callCount === 2) {
        // Simulate a concurrent upload that happened during publish
        storeRef.videos.push(makeVideo({ id: 'vid-concurrent', filename: 'concurrent.mp4' }) as Record<string, unknown>);
      }
      const current = storeRef.videos.length > 0
        ? JSON.parse(JSON.stringify(storeRef.videos))
        : fallback;
      const updated = await (updater as (c: unknown[]) => unknown[] | Promise<unknown[]>)(current);
      storeRef.videos = updated as Record<string, unknown>[];
      return updated;
    });

    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-001' });

    const req = makeRequest({ platform: 'youtube', publishData: {} });
    await POST(req, makeParams());

    // The concurrent upload should survive
    const concurrent = storeRef.videos.find((v: Record<string, unknown>) => v.id === 'vid-concurrent');
    expect(concurrent).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Error paths — withLockedJsonFile throwing
// ---------------------------------------------------------------------------

describe('POST /api/videos/[id]/publish — error paths', () => {
  it('returns 500 and releases in-flight lock when withLockedJsonFile throws on snapshot read', async () => {
    storeRef.videos = [makeVideo()];

    // Make the first withLockedJsonFile call throw (simulates corrupt videos.json)
    mockWithLockedJsonFile.mockRejectedValueOnce(new SyntaxError('Unexpected token'));

    const req = makeRequest({ platform: 'youtube', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Publish failed — see server logs');

    // In-flight lock should be released — a subsequent request should NOT get 409
    // Reset the mock to work normally
    mockWithLockedJsonFile.mockImplementation(async (_filePath, fallback, updater) => {
      const current = storeRef.videos.length > 0
        ? JSON.parse(JSON.stringify(storeRef.videos))
        : fallback;
      const updated = await (updater as (c: unknown[]) => unknown[] | Promise<unknown[]>)(current);
      storeRef.videos = updated as Record<string, unknown>[];
      return updated;
    });
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-after-error' });

    const retryReq = makeRequest({ platform: 'youtube', publishData: {} });
    const retryRes = await POST(retryReq, makeParams());

    // Should NOT be 409 — lock was released
    expect(retryRes.status).not.toBe(409);
  });

  it('returns 500 when withLockedJsonFile throws on result write (step 3)', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-001' });

    // First call succeeds (snapshot), second call throws (result write)
    let callCount = 0;
    mockWithLockedJsonFile.mockImplementation(async (_filePath, fallback, updater) => {
      callCount++;
      if (callCount === 2) {
        throw new Error('Disk full');
      }
      const current = storeRef.videos.length > 0
        ? JSON.parse(JSON.stringify(storeRef.videos))
        : fallback;
      const updated = await (updater as (c: unknown[]) => unknown[] | Promise<unknown[]>)(current);
      storeRef.videos = updated as Record<string, unknown>[];
      return updated;
    });

    const req = makeRequest({ platform: 'youtube', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Publish failed — see server logs');
  });
});

// ---------------------------------------------------------------------------
// Cleanup failure — fs.unlink rejects
// ---------------------------------------------------------------------------

describe('POST /api/videos/[id]/publish — cleanup failure', () => {
  it('returns 200 with cleaned=false when unlink throws but publish succeeded', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-123' });
    mockPublishToTikTok.mockResolvedValue({
      success: true,
      status: 'PUBLISH_COMPLETE',
      publishId: 'tt-001',
      postId: 'tt-post-001',
    });
    // unlink fails
    mockUnlink.mockRejectedValueOnce(new Error('EACCES: permission denied'));

    const req = makeRequest({ platform: 'both', publishData: {} });
    const res = await POST(req, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.cleaned).toBe(false);
    // Video should still be removed from the JSON store (cleanup filter ran)
    expect(storeRef.videos).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// In-flight lock release after completion
// ---------------------------------------------------------------------------

describe('POST /api/videos/[id]/publish — lock lifecycle', () => {
  it('releases in-flight lock after successful publish, allowing subsequent requests', async () => {
    storeRef.videos = [makeVideo()];
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-first' });

    // First call
    const req1 = makeRequest({ platform: 'youtube', publishData: {} });
    const res1 = await POST(req1, makeParams());
    expect(res1.status).toBe(200);

    // Second call for same ID should NOT get 409
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-second' });
    const req2 = makeRequest({ platform: 'youtube', publishData: {} });
    const res2 = await POST(req2, makeParams());

    expect(res2.status).not.toBe(409);
  });
});

// ---------------------------------------------------------------------------
// Account fallback — missing account field
// ---------------------------------------------------------------------------

describe('POST /api/videos/[id]/publish — account fallback', () => {
  it('defaults to aurora when account field is missing', async () => {
    // Create video without account field
    const videoNoAccount = makeVideo();
    delete (videoNoAccount as Record<string, unknown>).account;
    storeRef.videos = [videoNoAccount];
    mockPublishToYouTube.mockResolvedValue({ success: true, videoId: 'yt-fallback' });

    const req = makeRequest({ platform: 'youtube', publishData: {} });
    const res = await POST(req, makeParams());
    await res.json();

    expect(mockPublishToYouTube).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(Array),
      expect.any(String),
      expect.any(String),
      'aurora'
    );
  });
});
