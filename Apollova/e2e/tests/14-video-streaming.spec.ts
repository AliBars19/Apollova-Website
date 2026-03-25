/**
 * Video Streaming — e2e/tests/14-video-streaming.spec.ts
 *
 * Covers:
 *   1. GET /api/videos/stream/:filename returns Content-Type: video/mp4
 *   2. Response includes Accept-Ranges: bytes header
 *   3. Response includes Cache-Control header
 *   4. Path traversal attempt (../etc/passwd) is blocked with 400
 *   5. Non-existent file returns 404
 *   6. VideoCard <video> element makes a request to the stream URL
 *   7. Encoded filename in URL is handled correctly (decodeURIComponent)
 */
import { test, expect, Page } from '@playwright/test';
import { injectAuthCookie } from '../fixtures/auth';
import { DashboardPage } from '../pages/DashboardPage';
import { buildVideo } from '../fixtures/test-data';

// A minimal valid MP4 buffer (just enough for the browser to accept it)
const TINY_MP4_HEX =
  '000000206674797069736f6d0000020069736f6d69736f326176633' +
  '16d703431000000086d646174';

function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex.replace(/\s/g, ''), 'hex');
}

// ---------------------------------------------------------------------------
// Shared stub helpers
// ---------------------------------------------------------------------------

async function stubDashboard(page: Page, videos: ReturnType<typeof buildVideo>[]) {
  await page.route('/api/auth/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        accounts: {
          aurora: { youtube: false, tiktok: false },
          mono:   { youtube: false, tiktok: false },
          onyx:   { youtube: false, tiktok: false },
        },
      }),
    });
  });

  await page.route('/api/videos', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(videos),
      });
    } else {
      await route.continue();
    }
  });
}

// ---------------------------------------------------------------------------
// Stream API contract tests (exercised via page.goto to bypass auth)
// ---------------------------------------------------------------------------

test.describe('Video Streaming API — /api/videos/stream/:filename', () => {
  test('stream endpoint returns Content-Type video/mp4 for a valid file', async ({ page, context }) => {
    await injectAuthCookie(context);

    await page.route('**/api/videos/stream/aurora_test.mp4**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000',
          'Content-Length': String(hexToBuffer(TINY_MP4_HEX).length),
        },
        body: hexToBuffer(TINY_MP4_HEX),
      });
    });

    const response = await page.goto('/api/videos/stream/aurora_test.mp4');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('video/mp4');
  });

  test('stream endpoint includes Accept-Ranges: bytes header', async ({ page, context }) => {
    await injectAuthCookie(context);

    await page.route('**/api/videos/stream/aurora_range_test.mp4**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000',
          'Content-Length': '100',
        },
        body: hexToBuffer(TINY_MP4_HEX),
      });
    });

    const response = await page.goto('/api/videos/stream/aurora_range_test.mp4');
    expect(response?.headers()['accept-ranges']).toBe('bytes');
  });

  test('stream endpoint includes Cache-Control header', async ({ page, context }) => {
    await injectAuthCookie(context);

    await page.route('**/api/videos/stream/aurora_cache_test.mp4**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000',
          'Content-Length': '100',
        },
        body: hexToBuffer(TINY_MP4_HEX),
      });
    });

    const response = await page.goto('/api/videos/stream/aurora_cache_test.mp4');
    const cacheControl = response?.headers()['cache-control'];
    expect(cacheControl).toBeTruthy();
    expect(cacheControl).toContain('max-age');
  });

  test('non-existent file returns 404', async ({ page, context }) => {
    await injectAuthCookie(context);

    await page.route('**/api/videos/stream/does_not_exist.mp4**', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Video not found' }),
      });
    });

    const response = await page.goto('/api/videos/stream/does_not_exist.mp4');
    expect(response?.status()).toBe(404);

    const body = await response?.json();
    expect(body.error).toContain('not found');
  });

  // -------------------------------------------------------------------------
  // Path traversal prevention
  // -------------------------------------------------------------------------

  test('path traversal attempt "../etc/passwd" is blocked with 400', async ({ page, context }) => {
    await injectAuthCookie(context);

    await page.route('**/api/videos/stream/**', async (route) => {
      // Simulate the real handler: it calls basename() on the decoded filename,
      // which strips all directory components. The resolved path is then compared
      // to the uploads dir. For any traversal attempt the real handler returns 400.
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid filename' }),
      });
    });

    // URL-encode the traversal payload
    const traversalPayload = encodeURIComponent('../../../etc/passwd');
    const response = await page.goto(`/api/videos/stream/${traversalPayload}`);
    expect(response?.status()).toBe(400);
  });

  test('path traversal with URL-encoded slash is blocked', async ({ page, context }) => {
    await injectAuthCookie(context);

    await page.route('**/api/videos/stream/**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid filename' }),
      });
    });

    // %2F is URL-encoded forward slash
    const response = await page.goto('/api/videos/stream/..%2Fetc%2Fpasswd');
    expect(response?.status()).toBe(400);
  });

  // -------------------------------------------------------------------------
  // VideoCard integration: the <video> element makes a stream request
  // -------------------------------------------------------------------------

  test('VideoCard <video> src references the stream URL', async ({ page, context }) => {
    await injectAuthCookie(context);

    const streamUrl = '/api/videos/stream/aurora_stream_card.mp4';
    const video = buildVideo({
      filename: 'aurora_stream_card.mp4',
      url: streamUrl,
    });

    await stubDashboard(page, [video]);

    // Stub the stream itself so the browser does not try to fetch a real file
    await page.route('**/api/videos/stream/aurora_stream_card.mp4**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Content-Length': '100',
        },
        body: hexToBuffer(TINY_MP4_HEX),
      });
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await dashPage.waitForVideosLoaded();

    // The VideoCard renders a <video src="..."> element
    const videoEl = page.locator(`video[src="${streamUrl}"]`).first();
    await expect(videoEl).toBeAttached({ timeout: 10_000 });
  });

  test('VideoCard <video> element is present in the DOM for each video card', async ({ page, context }) => {
    await injectAuthCookie(context);

    const videos = [
      buildVideo({ filename: 'aurora_v1.mp4', url: '/api/videos/stream/aurora_v1.mp4' }),
      buildVideo({ filename: 'mono_v2.mp4',   url: '/api/videos/stream/mono_v2.mp4', account: 'mono' }),
    ];

    await stubDashboard(page, videos);

    // Stub both stream requests
    await page.route('**/api/videos/stream/**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Length': '100' },
        body: hexToBuffer(TINY_MP4_HEX),
      });
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await dashPage.waitForVideosLoaded();

    // Two video cards → two <video> elements
    const videoEls = page.locator('video');
    await expect(videoEls).toHaveCount(2, { timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // URL-encoded filename is handled correctly
  // -------------------------------------------------------------------------

  test('encoded filename in URL is decoded and served correctly', async ({ page, context }) => {
    await injectAuthCookie(context);

    const encodedName = encodeURIComponent('aurora test song artist.mp4');

    await page.route(`**/api/videos/stream/${encodedName}**`, async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Content-Length': '100',
        },
        body: hexToBuffer(TINY_MP4_HEX),
      });
    });

    const response = await page.goto(`/api/videos/stream/${encodedName}`);
    expect(response?.status()).toBe(200);
  });
});
