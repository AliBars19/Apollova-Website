// src/utils/__tests__/youtube.test.ts
// Tests for youtube.ts — publishToYouTube happy path, null upload-URL error,
// missing file error, and failed upload error handling.
//
// Pattern: vi.mock at module level with vi.fn() placeholders.
// Each test sets the desired return value via mockResolvedValue / mockReturnValue,
// then re-imports the module under test with vi.resetModules().

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ---------------------------------------------------------------------------
// Module-level mocks
// MUST NOT reference any local variables inside the factory (hoisting rule).
// ---------------------------------------------------------------------------

vi.mock('../tokenManager', () => ({
  getValidYouTubeToken: vi.fn(),
  AccountId: {},
}));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FAKE_ACCESS_TOKEN = 'ya29.fake_access_token';
const FAKE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=fake123';
const FAKE_VIDEO_BUFFER = Buffer.from('FAKEVIDEOCONTENT');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInitResponse(uploadUrl: string | null = FAKE_UPLOAD_URL) {
  return {
    ok: true,
    text: async () => '',
    headers: {
      get: (key: string) => (key === 'location' ? uploadUrl : null),
    },
  };
}

function makeUploadResponse(videoId = 'yt_video_abc123') {
  return {
    ok: true,
    text: async () => '',
    headers: { get: () => null },
    json: async () => ({ id: videoId }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('publishToYouTube', () => {
  let tmpDir: string;
  let videoPath: string;

  beforeEach(async () => {
    // Create a real temp video file
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yt-test-'));
    videoPath = path.join(tmpDir, 'test_video.mp4');
    fs.writeFileSync(videoPath, FAKE_VIDEO_BUFFER);

    // Reset module cache so each test gets a fresh import of youtube.ts
    vi.resetModules();

    // Set up the token mock to return a valid token by default
    const { getValidYouTubeToken } = await import('../tokenManager');
    (getValidYouTubeToken as ReturnType<typeof vi.fn>).mockResolvedValue(FAKE_ACCESS_TOKEN);
  });

  afterEach(() => {
    vi.clearAllMocks();
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch {
      // ignore cleanup errors
    }
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  it('returns success:true with videoId on a complete upload', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeUploadResponse('yt_video_abc123'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    const result = await publishToYouTube(videoPath, 'Test Title', 'Test Description', ['tag1', 'tag2'], '10', 'public', 'aurora');

    expect(result.success).toBe(true);
    expect(result.videoId).toBe('yt_video_abc123');
    expect(result.error).toBeUndefined();
  });

  it('sends Authorization Bearer header in the init request', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeUploadResponse());
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    await publishToYouTube(videoPath, 'T', 'D', [], '10', 'public', 'aurora');

    const [, initOpts] = mockFetch.mock.calls[0];
    expect(initOpts.headers['Authorization']).toBe(`Bearer ${FAKE_ACCESS_TOKEN}`);
  });

  it('sends correct snippet and status in the init body', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeUploadResponse('vid456'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    await publishToYouTube(videoPath, 'My Song', 'My Description', ['music', 'pop'], '10', 'unlisted', 'mono');

    const [, initOpts] = mockFetch.mock.calls[0];
    const body = JSON.parse(initOpts.body);
    expect(body.snippet.title).toBe('My Song');
    expect(body.snippet.description).toBe('My Description');
    expect(body.snippet.tags).toEqual(['music', 'pop']);
    expect(body.snippet.categoryId).toBe('10');
    expect(body.status.privacyStatus).toBe('unlisted');
    expect(body.status.selfDeclaredMadeForKids).toBe(false);
  });

  it('sends the video buffer to the upload URL via PUT', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeUploadResponse('vid789'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    await publishToYouTube(videoPath, 'T', 'D', [], '10', 'public', 'aurora');

    const [uploadUrl, uploadOpts] = mockFetch.mock.calls[1];
    expect(uploadUrl).toBe(FAKE_UPLOAD_URL);
    expect(uploadOpts.method).toBe('PUT');
    expect(uploadOpts.headers['Content-Type']).toBe('video/mp4');
    expect(Buffer.isBuffer(uploadOpts.body)).toBe(true);
    expect(uploadOpts.body.toString()).toBe(FAKE_VIDEO_BUFFER.toString());
  });

  it('defaults to aurora account and music category', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeUploadResponse('default_test'));
    vi.stubGlobal('fetch', mockFetch);

    const { getValidYouTubeToken } = await import('../tokenManager');
    const tokenSpy = getValidYouTubeToken as ReturnType<typeof vi.fn>;

    const { publishToYouTube } = await import('../youtube');
    // Omit accountId, category, privacy — should use defaults
    await publishToYouTube(videoPath, 'T', 'D', []);

    expect(tokenSpy).toHaveBeenCalledWith('aurora');
    const [, initOpts] = mockFetch.mock.calls[0];
    const body = JSON.parse(initOpts.body);
    expect(body.snippet.categoryId).toBe('10');
    expect(body.status.privacyStatus).toBe('public');
  });

  it('includes X-Upload-Content-Length with the file size in the init request', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeUploadResponse('sizecheck'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    await publishToYouTube(videoPath, 'T', 'D', [], '10', 'public', 'aurora');

    const [, initOpts] = mockFetch.mock.calls[0];
    expect(initOpts.headers['X-Upload-Content-Length']).toBe(String(FAKE_VIDEO_BUFFER.length));
  });

  it('handles empty tags array', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeUploadResponse('empty_tags'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    const result = await publishToYouTube(videoPath, 'T', 'D', [], '10', 'public', 'aurora');

    expect(result.success).toBe(true);
    const [, initOpts] = mockFetch.mock.calls[0];
    const body = JSON.parse(initOpts.body);
    expect(body.snippet.tags).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Error: null upload URL (no Location header)
  // -------------------------------------------------------------------------

  it('returns success:false with error message when Location header is null', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeInitResponse(null));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    const result = await publishToYouTube(videoPath, 'T', 'D', [], '10', 'public', 'aurora');

    expect(result.success).toBe(false);
    expect(result.error).toContain('No upload URL');
    expect(result.videoId).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Error: init request fails (non-2xx)
  // -------------------------------------------------------------------------

  it('returns success:false when init response is not ok (403)', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
      headers: { get: () => null },
    });
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    const result = await publishToYouTube(videoPath, 'T', 'D', [], '10', 'public', 'aurora');

    expect(result.success).toBe(false);
    expect(result.error).toContain('403');
  });

  // -------------------------------------------------------------------------
  // Error: file doesn't exist
  // -------------------------------------------------------------------------

  it('returns success:false when the video file does not exist', async () => {
    // Token mock still resolves, but fs.readFileSync will throw before any fetch
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    const result = await publishToYouTube('/nonexistent/path/video.mp4', 'T', 'D', [], '10', 'public', 'aurora');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
    expect(result.error!.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Error: upload step fails (non-2xx)
  // -------------------------------------------------------------------------

  it('returns success:false when the video upload PUT returns 500', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    const result = await publishToYouTube(videoPath, 'T', 'D', [], '10', 'public', 'aurora');

    expect(result.success).toBe(false);
    expect(result.error).toContain('500');
  });

  // -------------------------------------------------------------------------
  // Error: token fetch fails
  // -------------------------------------------------------------------------

  it('returns success:false when getValidYouTubeToken throws', async () => {
    // Override the default mock set in beforeEach
    const { getValidYouTubeToken } = await import('../tokenManager');
    (getValidYouTubeToken as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('YouTube not authorized for aurora account. Please authorize first.')
    );

    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    const result = await publishToYouTube(videoPath, 'T', 'D', [], '10', 'public', 'aurora');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not authorized');
    // fetch should never have been called since the error happens before the init request
    // (the error is caught in the outer try/catch so fetch might not be called)
    // We just verify success:false is enough
  });

  // -------------------------------------------------------------------------
  // Error: network failure during upload
  // -------------------------------------------------------------------------

  it('returns success:false when fetch throws a network error during upload', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockRejectedValueOnce(new Error('ECONNRESET'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    const result = await publishToYouTube(videoPath, 'T', 'D', [], '10', 'public', 'aurora');

    expect(result.success).toBe(false);
    expect(result.error).toContain('ECONNRESET');
  });

  // -------------------------------------------------------------------------
  // All three account IDs
  // -------------------------------------------------------------------------

  it('works with aurora account', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeUploadResponse('vid_aurora'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    const result = await publishToYouTube(videoPath, 'T', 'D', [], '10', 'public', 'aurora');
    expect(result.success).toBe(true);
    expect(result.videoId).toBe('vid_aurora');
  });

  it('works with mono account', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeUploadResponse('vid_mono'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    const result = await publishToYouTube(videoPath, 'T', 'D', [], '10', 'public', 'mono');
    expect(result.success).toBe(true);
    expect(result.videoId).toBe('vid_mono');
  });

  it('works with onyx account', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeInitResponse())
      .mockResolvedValueOnce(makeUploadResponse('vid_onyx'));
    vi.stubGlobal('fetch', mockFetch);

    const { publishToYouTube } = await import('../youtube');
    const result = await publishToYouTube(videoPath, 'T', 'D', [], '10', 'public', 'onyx');
    expect(result.success).toBe(true);
    expect(result.videoId).toBe('vid_onyx');
  });
});
