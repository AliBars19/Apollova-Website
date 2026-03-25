/**
 * Dashboard Management — e2e/tests/03-dashboard-management.spec.ts
 *
 * Covers:
 *   1. Dashboard loads and shows heading + connected-accounts panel
 *   2. Empty state message when no videos
 *   3. VideoCard renders with all action buttons
 *   4. Edit mode opens with caption/schedule/account controls
 *   5. Save updates the caption optimistically
 *   6. Cancel edit restores original state
 *   7. Delete button with confirm dialog removes the card
 *   8. Account visibility toggles hide/show video cards by account
 *   9. Advanced Settings panel opens and checkboxes function
 */
import { test, expect, Page } from '@playwright/test';
import { injectAuthCookie } from '../fixtures/auth';
import { DashboardPage } from '../pages/DashboardPage';
import { buildVideo } from '../fixtures/test-data';

// Shared API stubs
async function stubAuthStatus(page: Page): Promise<void> {
  await page.route('/api/auth/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        accounts: {
          aurora: { youtube: false, tiktok: false },
          mono: { youtube: false, tiktok: false },
          onyx: { youtube: false, tiktok: false },
        },
      }),
    });
  });
}

async function stubEmptyVideos(page: Page): Promise<void> {
  await page.route('/api/videos', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else {
      await route.continue();
    }
  });
}

async function stubVideos(page: Page, videos: ReturnType<typeof buildVideo>[]): Promise<void> {
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

test.describe('Dashboard Management', () => {
  test.beforeEach(async ({ context }) => {
    await injectAuthCookie(context);
  });

  test('dashboard renders heading and connected accounts panel', async ({ page }) => {
    await stubAuthStatus(page);
    await stubEmptyVideos(page);

    const dashPage = new DashboardPage(page);
    await dashPage.goto();

    await expect(dashPage.heading).toBeVisible();
    await dashPage.assertConnectedAccountsVisible();
    await dashPage.assertReadySummaryVisible();
  });

  test('empty state message appears when no videos exist', async ({ page }) => {
    await stubAuthStatus(page);
    await stubEmptyVideos(page);

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await dashPage.waitForVideosLoaded();

    await expect(
      page.locator('p', { hasText: 'No videos yet' })
    ).toBeVisible();
  });

  test('video cards render with Edit, TikTok, YouTube, Both and Delete buttons', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_test_clip.mp4' });
    await stubAuthStatus(page);
    await stubVideos(page, [video]);

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await dashPage.waitForVideosLoaded();

    const card = dashPage.videoCard('aurora_test_clip.mp4');
    await expect(card).toBeVisible();
    await expect(card.locator('button', { hasText: 'Edit' })).toBeVisible();
    await expect(card.locator('button', { hasText: 'TikTok' })).toBeVisible();
    await expect(card.locator('button', { hasText: 'YouTube' })).toBeVisible();
    await expect(card.locator('button', { hasText: 'Both' })).toBeVisible();
    await expect(card.locator('button', { hasText: 'Delete' })).toBeVisible();
  });

  test('clicking Edit opens the caption/schedule editor', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_edit_test.mp4' });
    await stubAuthStatus(page);
    await stubVideos(page, [video]);

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await dashPage.waitForVideosLoaded();

    await dashPage.editButtonFor('aurora_edit_test.mp4').click();

    // Edit mode shows textarea + datetime input + account picker + Save/Cancel
    const card = dashPage.videoCard('aurora_edit_test.mp4');
    await expect(card.locator('textarea')).toBeVisible();
    await expect(card.locator('input[type="datetime-local"]')).toBeVisible();
    await expect(card.locator('button', { hasText: 'Save' })).toBeVisible();
    await expect(card.locator('button', { hasText: 'Cancel' })).toBeVisible();
  });

  test('saving edit calls PATCH and updates the card optimistically', async ({ page }) => {
    const video = buildVideo({
      filename: 'aurora_save_test.mp4',
      tiktok: {
        caption: 'Original caption',
        status: 'pending',
        publishId: undefined,
        videoId: undefined,
        publishedAt: undefined,
        error: null,
      },
    });

    await stubAuthStatus(page);
    await stubVideos(page, [video]);

    let patchCalled = false;
    await page.route(`/api/videos/${video.id}`, async (route) => {
      if (route.request().method() === 'PATCH') {
        patchCalled = true;
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...video, tiktok: { ...video.tiktok, caption: body.caption } }),
        });
      } else {
        await route.continue();
      }
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await dashPage.waitForVideosLoaded();

    await dashPage.editButtonFor('aurora_save_test.mp4').click();
    const card = dashPage.videoCard('aurora_save_test.mp4');
    await card.locator('textarea').fill('Updated caption from E2E');
    await card.locator('button', { hasText: 'Save' }).click();

    // Verify PATCH was called
    expect(patchCalled).toBe(true);
    // The card exits edit mode
    await expect(card.locator('textarea')).not.toBeVisible();
  });

  test('Cancel edit restores the card to view mode', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_cancel_test.mp4' });
    await stubAuthStatus(page);
    await stubVideos(page, [video]);

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await dashPage.waitForVideosLoaded();

    const card = dashPage.videoCard('aurora_cancel_test.mp4');
    await dashPage.editButtonFor('aurora_cancel_test.mp4').click();
    await expect(card.locator('textarea')).toBeVisible();

    await card.locator('button', { hasText: 'Cancel' }).click();
    await expect(card.locator('textarea')).not.toBeVisible();
    await expect(card.locator('button', { hasText: 'Edit' })).toBeVisible();
  });

  test('deleting a draft video removes it from the list after confirm', async ({ page }) => {
    const video = buildVideo({ filename: 'aurora_delete_test.mp4' });
    await stubAuthStatus(page);
    await stubVideos(page, [video]);

    await page.route(`/api/videos/${video.id}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 200, body: '{}' });
      } else {
        await route.continue();
      }
    });

    // Accept the confirm dialog
    page.on('dialog', (d) => d.accept());

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await dashPage.waitForVideosLoaded();

    await dashPage.deleteButtonFor('aurora_delete_test.mp4').click();

    // Card should disappear
    await expect(dashPage.videoCard('aurora_delete_test.mp4')).not.toBeVisible({ timeout: 5_000 });
    // Empty state appears
    await expect(page.locator('p', { hasText: 'No videos yet' })).toBeVisible();
  });

  test('account visibility toggle hides videos for that account', async ({ page }) => {
    const auroraVideo = buildVideo({ filename: 'aurora_visible.mp4', account: 'aurora' });
    const monoVideo = buildVideo({ filename: 'mono_visible.mp4', account: 'mono' });

    await stubAuthStatus(page);
    await stubVideos(page, [auroraVideo, monoVideo]);

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await dashPage.waitForVideosLoaded();

    // Both cards should be visible initially
    await expect(dashPage.videoCard('aurora_visible.mp4')).toBeVisible();
    await expect(dashPage.videoCard('mono_visible.mp4')).toBeVisible();

    // Toggle Aurora off by clicking its visibility button in the ConnectionStatus
    // The visibility buttons are labeled with account names
    const auroraToggle = page.locator('div[style*="flex"] > button', { hasText: 'Aurora' });
    await auroraToggle.click();

    // Aurora video should be hidden
    await expect(dashPage.videoCard('aurora_visible.mp4')).not.toBeVisible();
    // Mono video should still be visible
    await expect(dashPage.videoCard('mono_visible.mp4')).toBeVisible();
  });

  test('Advanced Settings panel toggles open and checkboxes are interactive', async ({ page }) => {
    await stubAuthStatus(page);
    await stubEmptyVideos(page);

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await dashPage.openAdvancedSettings();

    await expect(
      page.locator('label', { hasText: 'Allow delete when TikTok succeeded' })
    ).toBeVisible();
    await expect(
      page.locator('label', { hasText: 'Allow delete when YouTube succeeded' })
    ).toBeVisible();
    await expect(
      page.locator('label', { hasText: 'Allow delete when both uploads failed' })
    ).toBeVisible();

    // Toggle a checkbox
    const bothFailedCheckbox = page.locator(
      'label:has-text("both uploads failed") input[type="checkbox"]'
    );
    await bothFailedCheckbox.check();
    await expect(bothFailedCheckbox).toBeChecked();
    await bothFailedCheckbox.uncheck();
    await expect(bothFailedCheckbox).not.toBeChecked();
  });

  test('Advanced Settings can be closed again', async ({ page }) => {
    await stubAuthStatus(page);
    await stubEmptyVideos(page);

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await dashPage.openAdvancedSettings();
    await dashPage.closeAdvancedSettings();

    await expect(
      page.locator('label', { hasText: 'Allow delete when both uploads failed' })
    ).not.toBeVisible();
  });

  test('published video does not show TikTok/YouTube/Both publish buttons', async ({ page }) => {
    const video = buildVideo({
      filename: 'aurora_published.mp4',
      status: 'published',
    });
    await stubAuthStatus(page);
    await stubVideos(page, [video]);

    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await dashPage.waitForVideosLoaded();

    const card = dashPage.videoCard('aurora_published.mp4');
    await expect(card.locator('button', { hasText: 'TikTok' })).not.toBeVisible();
    await expect(card.locator('button', { hasText: 'YouTube' })).not.toBeVisible();
    await expect(card.locator('button', { hasText: 'Both' })).not.toBeVisible();
    // Edit and Delete should still be visible
    await expect(card.locator('button', { hasText: 'Edit' })).toBeVisible();
    await expect(card.locator('button', { hasText: 'Delete' })).toBeVisible();
  });

  test('delete blocked for partial-TikTok video when setting is off', async ({ page }) => {
    const video = buildVideo({
      filename: 'aurora_partial.mp4',
      status: 'partial',
      tiktok: { caption: 'Partial', status: 'published', error: null },
      youtube: { title: 'T', description: '', tags: [], category: '', privacy: 'private', status: 'failed', error: 'err' },
    });
    await stubAuthStatus(page);
    await stubVideos(page, [video]);

    // Advanced settings from localStorage default to all false
    const dashPage = new DashboardPage(page);
    await dashPage.goto();
    await dashPage.waitForVideosLoaded();

    // Capture alert (blocked delete)
    const alertPromise = page.waitForEvent('dialog');
    // Dismiss subsequent confirm (just in case)
    page.once('dialog', (d) => d.accept());
    await dashPage.deleteButtonFor('aurora_partial.mp4').click();

    const alert = await alertPromise;
    expect(alert.message()).toContain('TikTok succeeded but YouTube failed');
    await alert.accept();

    // Card should still be present
    await expect(dashPage.videoCard('aurora_partial.mp4')).toBeVisible();
  });
});
