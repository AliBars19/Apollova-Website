/**
 * Publish Failures and Partial States — e2e/tests/10-publish-failures.spec.ts
 *
 * Covers:
 *   1. YouTube publish API failure → card shows "failed" status badge
 *   2. TikTok publish API failure (via drawer) → card shows "failed" status badge
 *   3. Partial failure: YouTube ok, TikTok fail → status badge "partial"
 *   4. Partial failure: TikTok ok, YouTube fail → status badge "partial"
 *   5. YouTube failure alert contains error text
 *   6. TikTok failure alert contains error text
 *   7. Both-platform failure → status badge "failed"
 */
import { test, expect, Page } from '@playwright/test';
import { injectAuthCookie } from '../fixtures/auth';
import { DashboardPage } from '../pages/DashboardPage';
import { TikTokDrawerPage } from '../pages/TikTokDrawerPage';
import { buildVideo } from '../fixtures/test-data';

// ---------------------------------------------------------------------------
// Shared setup helper (mirrors the pattern in 04-publishing-flow.spec.ts)
// ---------------------------------------------------------------------------

async function setupDashboard(
  page: Page,
  videos: ReturnType<typeof buildVideo>[],
  accountsConnected = true
) {
  await page.route('/api/auth/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        accounts: accountsConnected
          ? {
              aurora: { youtube: true, tiktok: true, youtubeName: 'AuroraYT', tiktokName: 'aurora_tt' },
              mono:   { youtube: false, tiktok: false },
              onyx:   { youtube: false, tiktok: false },
            }
          : {
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

  // Stub TikTok creator info so the drawer opens properly
  await page.route('/api/tiktok/creator-info', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        creatorInfo: {
          creator_username: 'aurora_tt',
          creator_avatar_url: '',
          privacy_level_options: ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'],
          comment_disabled: false,
          duet_disabled: false,
          stitch_disabled: false,
          max_video_post_duration_sec: 600,
        },
      }),
    });
  });
}

// ---------------------------------------------------------------------------
// Wait for videos to load helper
// ---------------------------------------------------------------------------
async function waitForVideos(page: Page) {
  await page.waitForResponse((r) => r.url().includes('/api/videos') && r.status() === 200);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Publish Failures and Partial States', () => {
  test.beforeEach(async ({ context }) => {
    await injectAuthCookie(context);
  });

  // -------------------------------------------------------------------------
  // YouTube publish failure
  // -------------------------------------------------------------------------

  test('YouTube publish API failure → alert contains failure message', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_yt_fail.mp4' });
    await setupDashboard(page, [video]);

    await page.route(`/api/videos/${video.id}/publish`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'YouTube API quota exceeded' }),
      });
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await waitForVideos(page);

    const alertPromise = page.waitForEvent('dialog');
    await dashPage.youtubePublishButtonFor('aurora_yt_fail.mp4').click();
    const alert = await alertPromise;

    // The dashboard shows an error alert when the API call fails
    expect(alert.message()).toMatch(/Error publishing to YouTube|Failed to publish/);
    await alert.accept();
  });

  test('YouTube publish API failure → card status badge shows "failed"', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_yt_fail_badge.mp4' });
    await setupDashboard(page, [video]);

    await page.route(`/api/videos/${video.id}/publish`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          video: {
            ...video,
            status: 'failed',
            youtube: { ...video.youtube, status: 'failed', error: 'Token expired' },
          },
          results: { youtube: { success: false, error: 'Token expired' } },
          cleaned: false,
        }),
      });
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await waitForVideos(page);

    // Accept alert shown after publish
    page.once('dialog', (d) => d.accept());
    await dashPage.youtubePublishButtonFor('aurora_yt_fail_badge.mp4').click();

    await page.waitForResponse((r) => r.url().includes('/publish'));

    // Card should now display "failed" status
    const card = dashPage.videoCard('aurora_yt_fail_badge.mp4');
    await expect(card.locator('span', { hasText: 'failed' })).toBeVisible({ timeout: 8_000 });
  });

  // -------------------------------------------------------------------------
  // TikTok publish failure
  // -------------------------------------------------------------------------

  test('TikTok publish API failure → alert contains failure message', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_tt_fail.mp4' });
    await setupDashboard(page, [video]);

    await page.route(`/api/videos/${video.id}/publish`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'TikTok rate limit exceeded' }),
      });
    });

    const dashPage = new DashboardPage(page);
    const drawerPage = new TikTokDrawerPage(page);

    await dashPage.goto();
    await waitForVideos(page);

    await dashPage.tiktokPublishButtonFor('aurora_tt_fail.mp4').click();
    await drawerPage.waitForOpen();
    await drawerPage.fillMinimumRequired('Failure test caption');

    const alertPromise = page.waitForEvent('dialog');
    await drawerPage.postToTikTokButton.click();
    const alert = await alertPromise;

    expect(alert.message()).toMatch(/Error publishing to TikTok|Failed to publish/);
    await alert.accept();
  });

  test('TikTok publish API failure → card status badge shows "failed"', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_tt_fail_badge.mp4' });
    await setupDashboard(page, [video]);

    await page.route(`/api/videos/${video.id}/publish`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          video: {
            ...video,
            status: 'failed',
            tiktok: { ...video.tiktok, status: 'failed', error: 'TikTok auth error' },
          },
          results: { tiktok: { success: false, error: 'TikTok auth error' } },
          cleaned: false,
        }),
      });
    });

    const dashPage = new DashboardPage(page);
    const drawerPage = new TikTokDrawerPage(page);

    await dashPage.goto();
    await waitForVideos(page);

    await dashPage.tiktokPublishButtonFor('aurora_tt_fail_badge.mp4').click();
    await drawerPage.waitForOpen();
    await drawerPage.fillMinimumRequired('Failure badge test');

    page.once('dialog', (d) => d.accept());
    await drawerPage.postToTikTokButton.click();

    await page.waitForResponse((r) => r.url().includes('/publish'));

    const card = dashPage.videoCard('aurora_tt_fail_badge.mp4');
    await expect(card.locator('span', { hasText: 'failed' })).toBeVisible({ timeout: 8_000 });
  });

  // -------------------------------------------------------------------------
  // Partial failures — "Both" publish path
  // -------------------------------------------------------------------------

  test('partial failure: YouTube ok, TikTok fail → status badge shows "partial"', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_partial_yt_ok.mp4' });
    await setupDashboard(page, [video]);

    await page.route(`/api/videos/${video.id}/publish`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          video: {
            ...video,
            status: 'partial',
            youtube: { ...video.youtube, status: 'published', videoId: 'yt-123' },
            tiktok:  { ...video.tiktok,  status: 'failed',    error: 'TikTok error' },
          },
          results: {
            youtube: { success: true,  videoId: 'yt-123' },
            tiktok:  { success: false, error: 'TikTok error' },
          },
          cleaned: false,
        }),
      });
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await waitForVideos(page);

    page.once('dialog', (d) => d.accept());
    await dashPage.bothPublishButtonFor('aurora_partial_yt_ok.mp4').click();

    await page.waitForResponse((r) => r.url().includes('/publish'));

    const card = dashPage.videoCard('aurora_partial_yt_ok.mp4');
    await expect(card.locator('span', { hasText: 'partial' })).toBeVisible({ timeout: 8_000 });
  });

  test('partial failure: TikTok ok, YouTube fail → status badge shows "partial"', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_partial_tt_ok.mp4' });
    await setupDashboard(page, [video]);

    await page.route(`/api/videos/${video.id}/publish`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          video: {
            ...video,
            status: 'partial',
            tiktok:  { ...video.tiktok,  status: 'published', videoId: 'tt-456' },
            youtube: { ...video.youtube, status: 'failed',    error: 'YouTube quota' },
          },
          results: {
            tiktok:  { success: true,  videoId: 'tt-456' },
            youtube: { success: false, error: 'YouTube quota' },
          },
          cleaned: false,
        }),
      });
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await waitForVideos(page);

    page.once('dialog', (d) => d.accept());
    await dashPage.bothPublishButtonFor('aurora_partial_tt_ok.mp4').click();

    await page.waitForResponse((r) => r.url().includes('/publish'));

    const card = dashPage.videoCard('aurora_partial_tt_ok.mp4');
    await expect(card.locator('span', { hasText: 'partial' })).toBeVisible({ timeout: 8_000 });
  });

  test('both-platform failure → status badge shows "failed"', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_both_fail.mp4' });
    await setupDashboard(page, [video]);

    await page.route(`/api/videos/${video.id}/publish`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          video: {
            ...video,
            status: 'failed',
            tiktok:  { ...video.tiktok,  status: 'failed', error: 'TikTok down' },
            youtube: { ...video.youtube, status: 'failed', error: 'YouTube down' },
          },
          results: {
            tiktok:  { success: false, error: 'TikTok down' },
            youtube: { success: false, error: 'YouTube down' },
          },
          cleaned: false,
        }),
      });
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await waitForVideos(page);

    page.once('dialog', (d) => d.accept());
    await dashPage.bothPublishButtonFor('aurora_both_fail.mp4').click();

    await page.waitForResponse((r) => r.url().includes('/publish'));

    const card = dashPage.videoCard('aurora_both_fail.mp4');
    await expect(card.locator('span', { hasText: 'failed' })).toBeVisible({ timeout: 8_000 });
  });

  // -------------------------------------------------------------------------
  // Platform status rows on the card
  // -------------------------------------------------------------------------

  test('partial failure card shows YouTube platform status as "published"', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_partial_yt_status.mp4' });
    await setupDashboard(page, [video]);

    await page.route(`/api/videos/${video.id}/publish`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          video: {
            ...video,
            status: 'partial',
            youtube: { ...video.youtube, status: 'published', videoId: 'yt-789' },
            tiktok:  { ...video.tiktok,  status: 'failed', error: 'TT error' },
          },
          results: {
            youtube: { success: true },
            tiktok:  { success: false, error: 'TT error' },
          },
          cleaned: false,
        }),
      });
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await waitForVideos(page);

    page.once('dialog', (d) => d.accept());
    await dashPage.bothPublishButtonFor('aurora_partial_yt_status.mp4').click();
    await page.waitForResponse((r) => r.url().includes('/publish'));

    const card = dashPage.videoCard('aurora_partial_yt_status.mp4');
    await expect(card.locator('span', { hasText: 'YouTube: published' })).toBeVisible({ timeout: 8_000 });
    await expect(card.locator('span', { hasText: 'TikTok: failed' })).toBeVisible({ timeout: 8_000 });
  });

  test('partial card keeps Edit and Delete buttons visible', async ({ page }) => {
    const video = buildVideo({
      filename: 'aurora_partial_buttons.mp4',
      status: 'partial',
      tiktok:  { caption: 'Caption', status: 'published', publishId: undefined, videoId: 'tt-1', publishedAt: undefined, error: null },
      youtube: { title: 'Title', description: '', tags: [], category: '', privacy: 'private', status: 'failed', videoId: undefined, publishedAt: undefined, error: 'err' },
    });

    await setupDashboard(page, [video]);

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await page.waitForResponse((r) => r.url().includes('/api/videos') && r.status() === 200);

    const card = dashPage.videoCard('aurora_partial_buttons.mp4');
    await expect(card.locator('button', { hasText: 'Edit' })).toBeVisible();
    await expect(card.locator('button', { hasText: 'Delete' })).toBeVisible();
  });
});
