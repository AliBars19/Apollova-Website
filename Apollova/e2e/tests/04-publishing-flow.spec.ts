/**
 * Publishing Flow — e2e/tests/04-publishing-flow.spec.ts
 *
 * Covers:
 *   1. YouTube-only publish calls POST /api/videos/:id/publish with platform=youtube
 *   2. TikTok button opens the compliance drawer
 *   3. TikTok drawer shows creator info section
 *   4. Post button disabled until title + privacy + consent are set
 *   5. Post button enabled after all required fields filled
 *   6. TikTok drawer: commercial content section appears when toggled
 *   7. TikTok drawer: branded content checkbox disabled for SELF_ONLY privacy
 *   8. "Both" publish calls POST with platform=both
 *   9. Drawer closes on Cancel
 */
import { test, expect, Page } from '@playwright/test';
import { injectAuthCookie } from '../fixtures/auth';
import { DashboardPage } from '../pages/DashboardPage';
import { TikTokDrawerPage } from '../pages/TikTokDrawerPage';
import { buildVideo } from '../fixtures/test-data';

async function setupDashboard(page: Page, videos: ReturnType<typeof buildVideo>[]) {
  await page.route('/api/auth/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        accounts: {
          aurora: { youtube: true, tiktok: true, youtubeName: 'AuroraYT', tiktokName: 'aurora_tt' },
          mono: { youtube: false, tiktok: false },
          onyx: { youtube: false, tiktok: false },
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

  // Stub TikTok creator info for the drawer
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

test.describe('Publishing Flow', () => {
  test.beforeEach(async ({ context }) => {
    await injectAuthCookie(context);
  });

  test('YouTube-only publish fires correct API call', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_yt_publish.mp4' });
    await setupDashboard(page, [video]);

    let publishPlatform = '';
    await page.route(`/api/videos/${video.id}/publish`, async (route) => {
      const body = route.request().postDataJSON();
      publishPlatform = body.platform;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          video: { ...video, status: 'published', youtube: { ...video.youtube, status: 'published' } },
          results: { youtube: { success: true } },
        }),
      });
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await page.waitForResponse((r) => r.url().includes('/api/videos') && r.status() === 200);

    // Accept the success alert
    page.once('dialog', (d) => d.accept());
    await dashPage.youtubePublishButtonFor('aurora_yt_publish.mp4').click();

    await page.waitForResponse((r) => r.url().includes('/publish'));
    expect(publishPlatform).toBe('youtube');
  });

  test('"Both" publish fires API call with platform=both', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_both_publish.mp4' });
    await setupDashboard(page, [video]);

    let publishPlatform = '';
    await page.route(`/api/videos/${video.id}/publish`, async (route) => {
      const body = route.request().postDataJSON();
      publishPlatform = body.platform;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          video: { ...video, status: 'published' },
          results: { youtube: { success: true }, tiktok: { success: true } },
          cleaned: false,
        }),
      });
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await page.waitForResponse((r) => r.url().includes('/api/videos') && r.status() === 200);

    page.once('dialog', (d) => d.accept());
    await dashPage.bothPublishButtonFor('aurora_both_publish.mp4').click();

    await page.waitForResponse((r) => r.url().includes('/publish'));
    expect(publishPlatform).toBe('both');
  });

  test('TikTok button opens the compliance drawer', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_tt_open.mp4' });
    await setupDashboard(page, [video]);

    const dashPage = new DashboardPage(page);
    const drawerPage = new TikTokDrawerPage(page);

    await dashPage.goto();
    await page.waitForResponse((r) => r.url().includes('/api/videos') && r.status() === 200);

    await dashPage.tiktokPublishButtonFor('aurora_tt_open.mp4').click();
    await drawerPage.waitForOpen();

    await expect(drawerPage.drawerHeading).toBeVisible();
  });

  test('drawer displays creator username', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_tt_creator.mp4' });
    await setupDashboard(page, [video]);

    const dashPage = new DashboardPage(page);
    const drawerPage = new TikTokDrawerPage(page);

    await dashPage.goto();
    await page.waitForResponse((r) => r.url().includes('/api/videos') && r.status() === 200);

    await dashPage.tiktokPublishButtonFor('aurora_tt_creator.mp4').click();
    await drawerPage.waitForOpen();

    await expect(page.locator('text=@aurora_tt')).toBeVisible();
  });

  test('Post button is disabled with no required fields', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_tt_disabled.mp4' });
    await setupDashboard(page, [video]);

    const dashPage = new DashboardPage(page);
    const drawerPage = new TikTokDrawerPage(page);

    await dashPage.goto();
    await page.waitForResponse((r) => r.url().includes('/api/videos') && r.status() === 200);

    await dashPage.tiktokPublishButtonFor('aurora_tt_disabled.mp4').click();
    await drawerPage.waitForOpen();

    // Clear title to make the button disabled
    await drawerPage.titleTextarea.fill('');

    // Button should be disabled (opacity 0.4 or actual disabled attribute)
    const btn = drawerPage.postToTikTokButton;
    const isDisabledOrOpaque =
      (await btn.isDisabled()) ||
      (await btn.getAttribute('style'))?.includes('0.4');
    expect(isDisabledOrOpaque).toBe(true);
  });

  test('Post button is enabled after filling all required fields', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_tt_enabled.mp4' });
    await setupDashboard(page, [video]);

    const dashPage = new DashboardPage(page);
    const drawerPage = new TikTokDrawerPage(page);

    await dashPage.goto();
    await page.waitForResponse((r) => r.url().includes('/api/videos') && r.status() === 200);

    await dashPage.tiktokPublishButtonFor('aurora_tt_enabled.mp4').click();
    await drawerPage.waitForOpen();

    await drawerPage.fillMinimumRequired('E2E enabled test caption');

    // Post button should now be enabled (opacity 1, not disabled)
    const style = await drawerPage.postToTikTokButton.getAttribute('style');
    expect(style).not.toContain('0.4');
    expect(await drawerPage.postToTikTokButton.isDisabled()).toBe(false);
  });

  test('privacy error shows when no privacy level is selected', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_privacy_err.mp4' });
    await setupDashboard(page, [video]);

    const dashPage = new DashboardPage(page);
    const drawerPage = new TikTokDrawerPage(page);

    await dashPage.goto();
    await page.waitForResponse((r) => r.url().includes('/api/videos') && r.status() === 200);

    await dashPage.tiktokPublishButtonFor('aurora_privacy_err.mp4').click();
    await drawerPage.waitForOpen();

    await expect(drawerPage.privacyError).toBeVisible();
  });

  test('consent error shows when consent not ticked', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_consent_err.mp4' });
    await setupDashboard(page, [video]);

    const dashPage = new DashboardPage(page);
    const drawerPage = new TikTokDrawerPage(page);

    await dashPage.goto();
    await page.waitForResponse((r) => r.url().includes('/api/videos') && r.status() === 200);

    await dashPage.tiktokPublishButtonFor('aurora_consent_err.mp4').click();
    await drawerPage.waitForOpen();

    await expect(drawerPage.consentError).toBeVisible();
  });

  test('commercial content section appears when toggle is clicked', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_commercial.mp4' });
    await setupDashboard(page, [video]);

    const dashPage = new DashboardPage(page);
    const drawerPage = new TikTokDrawerPage(page);

    await dashPage.goto();
    await page.waitForResponse((r) => r.url().includes('/api/videos') && r.status() === 200);

    await dashPage.tiktokPublishButtonFor('aurora_commercial.mp4').click();
    await drawerPage.waitForOpen();

    // Click the toggle div for commercial content
    await drawerPage.toggleCommercialContent();
    await drawerPage.assertCommercialSectionVisible();
  });

  test('branded content checkbox is disabled when SELF_ONLY privacy selected', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_self_only.mp4' });
    await setupDashboard(page, [video]);

    const dashPage = new DashboardPage(page);
    const drawerPage = new TikTokDrawerPage(page);

    await dashPage.goto();
    await page.waitForResponse((r) => r.url().includes('/api/videos') && r.status() === 200);

    await dashPage.tiktokPublishButtonFor('aurora_self_only.mp4').click();
    await drawerPage.waitForOpen();

    await drawerPage.selectPrivacy('SELF_ONLY');
    await drawerPage.toggleCommercialContent();

    await expect(drawerPage.brandedContentCheckbox).toBeDisabled();
  });

  test('clicking Cancel closes the drawer', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_tt_cancel.mp4' });
    await setupDashboard(page, [video]);

    const dashPage = new DashboardPage(page);
    const drawerPage = new TikTokDrawerPage(page);

    await dashPage.goto();
    await page.waitForResponse((r) => r.url().includes('/api/videos') && r.status() === 200);

    await dashPage.tiktokPublishButtonFor('aurora_tt_cancel.mp4').click();
    await drawerPage.waitForOpen();
    await drawerPage.close();

    await expect(drawerPage.drawerHeading).not.toBeVisible({ timeout: 5_000 });
  });

  test('successful TikTok publish fires API and shows success alert', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_tt_success.mp4' });
    await setupDashboard(page, [video]);

    await page.route(`/api/videos/${video.id}/publish`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          video: { ...video, status: 'published', tiktok: { ...video.tiktok, status: 'published' } },
          results: { tiktok: { success: true } },
        }),
      });
    });

    const dashPage = new DashboardPage(page);
    const drawerPage = new TikTokDrawerPage(page);

    await dashPage.goto();
    await page.waitForResponse((r) => r.url().includes('/api/videos') && r.status() === 200);

    await dashPage.tiktokPublishButtonFor('aurora_tt_success.mp4').click();
    await drawerPage.waitForOpen();
    await drawerPage.fillMinimumRequired('E2E success caption');

    // Accept success alert
    const alertPromise = page.waitForEvent('dialog');
    await drawerPage.postToTikTokButton.click();
    const alert = await alertPromise;
    expect(alert.message()).toContain('Published to TikTok');
    await alert.accept();
  });
});
