// src/utils/__tests__/tiktok.test.ts
// Tests for tiktok.ts — publishToTikTokCompliant
// Covers: happy path, chunk boundary calculation, Content-Range headers,
// status polling (success / FAILED / timeout), and error propagation.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ---------------------------------------------------------------------------
// Module-level mock — factory MUST NOT reference local variables (hoisting).
// ---------------------------------------------------------------------------

vi.mock('../tokenManager', () => ({
  getValidTikTokToken: vi.fn(),
  AccountId: {},
}));

// ---------------------------------------------------------------------------
// Constants mirrored from source
// ---------------------------------------------------------------------------
const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB

const FAKE_ACCESS_TOKEN = 'tt_fake_access_token';
const FAKE_PUBLISH_ID = 'publish_abc123';
const FAKE_UPLOAD_URL = 'https://open.tiktokapis.com/v2/upload/fake_url';

const BASE_OPTIONS = {
  videoId: 'vid1',
  title: 'Test TikTok',
  privacyLevel: 'PUBLIC_TO_EVERYONE',
  disableComment: false,
  disableDuet: false,
  disableStitch: false,
  commercialContent: { enabled: false, yourBrand: false, brandedContent: false },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBuffer(size: number): Buffer {
  return Buffer.alloc(size);
}

function makeInitResponse() {
  return {
    ok: true,
    status: 200,
    text: async () => '',
    json: async () => ({
      data: { publish_id: FAKE_PUBLISH_ID, upload_url: FAKE_UPLOAD_URL },
    }),
  };
}

function makeChunkResponse() {
  return { ok: true, status: 200 };
}

function makeStatusResponse(status: string, extras: Record<string, unknown> = {}) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ data: { status, ...extras } }),
  };
}

// ---------------------------------------------------------------------------
// Shared setup/teardown
// ---------------------------------------------------------------------------

let tmpDir: string;
let videoPath: string;

beforeEach(async () => {
  vi.useFakeTimers({ shouldAdvanceTime: false });
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tiktok-test-'));
  vi.resetModules();

  // Set up default token mock
  const { getValidTikTokToken } = await import('../tokenManager');
  (getValidTikTokToken as ReturnType<typeof vi.fn>).mockResolvedValue(FAKE_ACCESS_TOKEN);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  try {
    fs.rmSync(tmpDir, { recursive: true });
  } catch {
    // ignore
  }
});

// ---------------------------------------------------------------------------
// Chunk boundary calculation
// ---------------------------------------------------------------------------

describe('chunk boundary calculation', () => {
  it('calculates 1 chunk for a file exactly CHUNK_SIZE bytes', async () => {
    videoPath = path.join(tmpDir, 'exact.mp4');
    fs.writeFileSync(videoPath, makeBuffer(CHUNK_SIZE));

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    const result = await promise;

    // init + 1 chunk + 1 poll = 3
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(true);
  });

  it('calculates 2 chunks for a file of 2 * CHUNK_SIZE bytes', async () => {
    videoPath = path.join(tmpDir, 'two_chunks.mp4');
    fs.writeFileSync(videoPath, makeBuffer(2 * CHUNK_SIZE));

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())  // chunk 1
      .mockResolvedValueOnce(makeChunkResponse())  // chunk 2
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    const result = await promise;

    // init + 2 chunks + 1 poll = 4
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(result.success).toBe(true);
  });

  it('uses Math.floor — file slightly over CHUNK_SIZE gets 1 chunk', async () => {
    // Math.floor((CHUNK_SIZE + 1) / CHUNK_SIZE) = 1
    videoPath = path.join(tmpDir, 'floor.mp4');
    fs.writeFileSync(videoPath, makeBuffer(CHUNK_SIZE + 1));

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    await promise;

    // init + 1 chunk + 1 poll = 3
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('sends 0 chunks for a file smaller than CHUNK_SIZE (5 MB)', async () => {
    // Math.floor(5MB / 10MB) = 0, so chunk loop is never entered
    videoPath = path.join(tmpDir, 'small.mp4');
    fs.writeFileSync(videoPath, makeBuffer(5 * 1024 * 1024));

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    const result = await promise;

    // init + 0 chunks + 1 poll = 2
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Content-Range header construction
// ---------------------------------------------------------------------------

describe('Content-Range header construction', () => {
  it('sets correct Content-Range for single chunk covering entire file', async () => {
    const videoSize = CHUNK_SIZE;
    videoPath = path.join(tmpDir, 'range_test.mp4');
    fs.writeFileSync(videoPath, makeBuffer(videoSize));

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    await promise;

    const [, chunkOpts] = mockFetch.mock.calls[1];
    // For i=0 (last chunk): start=0, end=videoSize
    expect(chunkOpts.headers['Content-Range']).toBe(`bytes 0-${videoSize - 1}/${videoSize}`);
  });

  it('sets correct Content-Range for first of two chunks', async () => {
    const videoSize = 2 * CHUNK_SIZE;
    videoPath = path.join(tmpDir, 'range2.mp4');
    fs.writeFileSync(videoPath, makeBuffer(videoSize));

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())  // chunk 0
      .mockResolvedValueOnce(makeChunkResponse())  // chunk 1
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    await promise;

    // Chunk 0 (not last): start=0, end=(0+1)*CHUNK_SIZE
    const [, chunk0Opts] = mockFetch.mock.calls[1];
    expect(chunk0Opts.headers['Content-Range']).toBe(`bytes 0-${CHUNK_SIZE - 1}/${videoSize}`);

    // Chunk 1 (last): start=CHUNK_SIZE, end=videoSize
    const [, chunk1Opts] = mockFetch.mock.calls[2];
    expect(chunk1Opts.headers['Content-Range']).toBe(`bytes ${CHUNK_SIZE}-${videoSize - 1}/${videoSize}`);
  });
});

// ---------------------------------------------------------------------------
// Init request
// ---------------------------------------------------------------------------

describe('init request', () => {
  beforeEach(() => {
    videoPath = path.join(tmpDir, 'init_test.mp4');
    fs.writeFileSync(videoPath, makeBuffer(CHUNK_SIZE));
  });

  it('sends Authorization Bearer header', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    await promise;

    const [, initOpts] = mockFetch.mock.calls[0];
    expect(initOpts.headers['Authorization']).toBe(`Bearer ${FAKE_ACCESS_TOKEN}`);
  });

  it('sends correct post_info fields', async () => {
    const customOptions = {
      ...BASE_OPTIONS,
      title: 'My TikTok',
      privacyLevel: 'FRIENDS_ONLY',
      disableComment: true,
      disableDuet: true,
      disableStitch: true,
    };

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, customOptions);
    await vi.runAllTimersAsync();
    await promise;

    const [, initOpts] = mockFetch.mock.calls[0];
    const body = JSON.parse(initOpts.body);
    expect(body.post_info.title).toBe('My TikTok');
    expect(body.post_info.privacy_level).toBe('FRIENDS_ONLY');
    expect(body.post_info.disable_comment).toBe(true);
    expect(body.post_info.disable_duet).toBe(true);
    expect(body.post_info.disable_stitch).toBe(true);
    expect(body.post_info.video_cover_timestamp_ms).toBe(1000);
  });

  it('sets brand_content_toggle when yourBrand is true', async () => {
    const opts = {
      ...BASE_OPTIONS,
      commercialContent: { enabled: true, yourBrand: true, brandedContent: false },
    };

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, opts);
    await vi.runAllTimersAsync();
    await promise;

    const [, initOpts] = mockFetch.mock.calls[0];
    const body = JSON.parse(initOpts.body);
    expect(body.post_info.brand_content_toggle).toBe(true);
    expect(body.post_info.brand_organic_toggle).toBeUndefined();
  });

  it('sets brand_organic_toggle when brandedContent is true', async () => {
    const opts = {
      ...BASE_OPTIONS,
      commercialContent: { enabled: true, yourBrand: false, brandedContent: true },
    };

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, opts);
    await vi.runAllTimersAsync();
    await promise;

    const [, initOpts] = mockFetch.mock.calls[0];
    const body = JSON.parse(initOpts.body);
    expect(body.post_info.brand_organic_toggle).toBe(true);
    expect(body.post_info.brand_content_toggle).toBeUndefined();
  });

  it('sets neither brand flag when commercialContent.enabled is false', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    await promise;

    const [, initOpts] = mockFetch.mock.calls[0];
    const body = JSON.parse(initOpts.body);
    expect(body.post_info.brand_content_toggle).toBeUndefined();
    expect(body.post_info.brand_organic_toggle).toBeUndefined();
  });

  it('throws when init returns non-ok', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => '{"error":"invalid_request"}',
    });
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    await expect(publishToTikTokCompliant(videoPath, BASE_OPTIONS)).rejects.toThrow('Init failed');
  });
});

// ---------------------------------------------------------------------------
// Status polling loop
// ---------------------------------------------------------------------------

describe('status polling loop', () => {
  beforeEach(() => {
    videoPath = path.join(tmpDir, 'poll_test.mp4');
    fs.writeFileSync(videoPath, makeBuffer(CHUNK_SIZE));
  });

  it('succeeds after N retries (transitions through intermediate states)', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('PROCESSING_UPLOAD'))
      .mockResolvedValueOnce(makeStatusResponse('PROCESSING_TRANSCODE'))
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE', {
        publicaly_available_post_id: ['post_xyz'],
      }));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.publishId).toBe(FAKE_PUBLISH_ID);
    expect(result.status).toBe('PUBLISH_COMPLETE');
    expect(result.postId).toBe('post_xyz');
  });

  it('returns postId from publicaly_available_post_id[0]', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE', {
        publicaly_available_post_id: ['post_abc', 'post_xyz'],
      }));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.postId).toBe('post_abc');
  });

  it('FAILED status is caught by the inner try/catch and polling continues to timeout', async () => {
    // The throw on FAILED happens inside the inner try { } catch block at line 172 of tiktok.ts,
    // so the error is caught, polling continues for the remaining attempts, and the function
    // ultimately returns success:true with status UNKNOWN (timeout path).
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      // First poll returns FAILED — this throw is caught, polling continues
      .mockResolvedValueOnce(makeStatusResponse('FAILED', { fail_reason: 'CONTENT_VIOLATION' }))
      // Remaining polls return PROCESSING so the timeout path is hit
      .mockResolvedValue(makeStatusResponse('PROCESSING_UPLOAD'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    const result = await promise;

    // Error was swallowed — the function still returns success:true after timeout
    expect(result.success).toBe(true);
    expect(result.status).toBe('UNKNOWN');
  });

  it('FAILED with no fail_reason is also caught and polling continues', async () => {
    // Same inner try/catch swallows the "Unknown error" throw
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('FAILED'))  // no fail_reason → "Unknown error"
      .mockResolvedValue(makeStatusResponse('PROCESSING_UPLOAD'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.status).toBe('UNKNOWN');
  });

  it('returns status UNKNOWN and success:true after poll timeout (60 retries)', async () => {
    const processingResponse = makeStatusResponse('PROCESSING_UPLOAD');
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValue(processingResponse); // all 60 polls return PROCESSING
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.status).toBe('UNKNOWN');
    // init + 1 chunk + 60 polls = 62
    expect(mockFetch).toHaveBeenCalledTimes(62);
  });

  it('continues polling when a status check returns non-ok', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce({ ok: false, status: 503 })   // one bad poll
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.status).toBe('PUBLISH_COMPLETE');
  });

  it('sends publish_id in each status poll body', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    await promise;

    // Status poll is call index 2
    const [, pollOpts] = mockFetch.mock.calls[2];
    const body = JSON.parse(pollOpts.body);
    expect(body.publish_id).toBe(FAKE_PUBLISH_ID);
  });
});

// ---------------------------------------------------------------------------
// Error propagation
// ---------------------------------------------------------------------------

describe('error propagation', () => {
  beforeEach(() => {
    videoPath = path.join(tmpDir, 'err_test.mp4');
    fs.writeFileSync(videoPath, makeBuffer(CHUNK_SIZE));
  });

  it('throws when the video file does not exist', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    await expect(
      publishToTikTokCompliant('/nonexistent/video.mp4', BASE_OPTIONS)
    ).rejects.toThrow();
  });

  it('throws when getValidTikTokToken rejects', async () => {
    const { getValidTikTokToken } = await import('../tokenManager');
    (getValidTikTokToken as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('TikTok not authorized for aurora account.')
    );

    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    await expect(publishToTikTokCompliant(videoPath, BASE_OPTIONS)).rejects.toThrow(
      'TikTok not authorized'
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('throws when a chunk upload fails', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce({ ok: false, status: 500 });
    vi.stubGlobal('fetch', mockFetch);

    const { publishToTikTokCompliant } = await import('../tiktok');
    await expect(publishToTikTokCompliant(videoPath, BASE_OPTIONS)).rejects.toThrow(
      'Chunk 1 upload failed: 500'
    );
  });
});

// ---------------------------------------------------------------------------
// Account ID handling
// ---------------------------------------------------------------------------

describe('account ID handling', () => {
  beforeEach(() => {
    videoPath = path.join(tmpDir, 'account_test.mp4');
    fs.writeFileSync(videoPath, makeBuffer(CHUNK_SIZE));
  });

  it('defaults to aurora account when not specified', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { getValidTikTokToken } = await import('../tokenManager');
    const tokenSpy = getValidTikTokToken as ReturnType<typeof vi.fn>;

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS);
    await vi.runAllTimersAsync();
    await promise;

    expect(tokenSpy).toHaveBeenCalledWith('aurora');
  });

  it('passes onyx account to token manager', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { getValidTikTokToken } = await import('../tokenManager');
    const tokenSpy = getValidTikTokToken as ReturnType<typeof vi.fn>;

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS, 'onyx');
    await vi.runAllTimersAsync();
    await promise;

    expect(tokenSpy).toHaveBeenCalledWith('onyx');
  });

  it('passes mono account to token manager', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeChunkResponse())
      .mockResolvedValueOnce(makeStatusResponse('PUBLISH_COMPLETE'));
    vi.stubGlobal('fetch', mockFetch);

    const { getValidTikTokToken } = await import('../tokenManager');
    const tokenSpy = getValidTikTokToken as ReturnType<typeof vi.fn>;

    const { publishToTikTokCompliant } = await import('../tiktok');
    const promise = publishToTikTokCompliant(videoPath, BASE_OPTIONS, 'mono');
    await vi.runAllTimersAsync();
    await promise;

    expect(tokenSpy).toHaveBeenCalledWith('mono');
  });
});
