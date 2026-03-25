/**
 * OAuth Connection — e2e/tests/06-oauth-connection.spec.ts
 *
 * Covers:
 *   1. ConnectionStatus renders 3 account cards
 *   2. Disconnected state shows "Connect" buttons for YouTube and TikTok
 *   3. Connected state shows green status indicators + disconnect (✕) buttons
 *   4. YouTube Connect button navigates to the OAuth authorise URL
 *   5. TikTok Connect button navigates to the OAuth authorise URL
 *   6. Disconnect button calls POST /api/auth/disconnect then refreshes status
 *   7. "All accounts connected" summary shows when all 3 have both platforms
 *   8. Account names show when connected
 */
import { test, expect, Page } from '@playwright/test';
import { injectAuthCookie } from '../fixtures/auth';
import { DashboardPage } from '../pages/DashboardPage';

type AccountStatus = { youtube: boolean; tiktok: boolean; youtubeName?: string; tiktokName?: string };
type Accounts = { aurora: AccountStatus; mono: AccountStatus; onyx: AccountStatus };

async function stubWithStatus(page: Page, accounts: Accounts) {
  await page.route('/api/auth/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated: true, accounts }),
    });
  });

  await page.route('/api/videos', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    } else {
      await route.continue();
    }
  });
}

test.describe('OAuth Connection — ConnectionStatus component', () => {
  test.beforeEach(async ({ context }) => {
    await injectAuthCookie(context);
  });

  test('three account cards render (Aurora, Mono, Onyx)', async ({ page }) => {
    await stubWithStatus(page, {
      aurora: { youtube: false, tiktok: false },
      mono: { youtube: false, tiktok: false },
      onyx: { youtube: false, tiktok: false },
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();

    await expect(page.locator('text=Aurora')).toBeVisible();
    await expect(page.locator('text=Mono')).toBeVisible();
    await expect(page.locator('text=Onyx')).toBeVisible();
  });

  test('disconnected state shows YouTube and TikTok Connect buttons', async ({ page }) => {
    await stubWithStatus(page, {
      aurora: { youtube: false, tiktok: false },
      mono: { youtube: false, tiktok: false },
      onyx: { youtube: false, tiktok: false },
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();

    // 3 accounts × 2 platforms = 6 Connect buttons total
    const connectButtons = page.locator('button', { hasText: 'Connect' });
    await expect(connectButtons).toHaveCount(6);
  });

  test('connected state shows green checkmarks', async ({ page }) => {
    await stubWithStatus(page, {
      aurora: { youtube: true, tiktok: true, youtubeName: 'AuroraYT', tiktokName: 'aurora_tt' },
      mono: { youtube: false, tiktok: false },
      onyx: { youtube: false, tiktok: false },
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();

    // Aurora YouTube connected: "✓ YouTube" appears (green background)
    await expect(
      page.locator('span', { hasText: '✓ YouTube' }).first()
    ).toBeVisible();
    await expect(
      page.locator('span', { hasText: '✓ TikTok' }).first()
    ).toBeVisible();
  });

  test('connected state shows account names', async ({ page }) => {
    await stubWithStatus(page, {
      aurora: { youtube: true, tiktok: true, youtubeName: 'AuroraYT', tiktokName: 'aurora_tt' },
      mono: { youtube: false, tiktok: false },
      onyx: { youtube: false, tiktok: false },
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();

    await expect(page.locator('span', { hasText: 'AuroraYT' })).toBeVisible();
    await expect(page.locator('span', { hasText: '@aurora_tt' })).toBeVisible();
  });

  test('YouTube Connect button points to correct OAuth URL', async ({ page }) => {
    await stubWithStatus(page, {
      aurora: { youtube: false, tiktok: false },
      mono: { youtube: false, tiktok: false },
      onyx: { youtube: false, tiktok: false },
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();

    // The YouTube Connect button does: window.location.href = /api/auth/youtube/authorise?account=aurora
    // We intercept the navigation to verify the URL
    const [navigation] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/auth/youtube/authorise')),
      // Click the first YouTube Connect button (Aurora account)
      page.locator('button[style*="FF0000"]', { hasText: 'Connect' }).first().click(),
    ]);

    expect(navigation.url()).toContain('/api/auth/youtube/authorise');
    expect(navigation.url()).toContain('account=aurora');
  });

  test('TikTok Connect button points to correct OAuth URL', async ({ page }) => {
    await stubWithStatus(page, {
      aurora: { youtube: false, tiktok: false },
      mono: { youtube: false, tiktok: false },
      onyx: { youtube: false, tiktok: false },
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();

    const [navigation] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/auth/tiktok/authorise')),
      page.locator('button[style*="69C9D0"]', { hasText: 'Connect' }).first().click(),
    ]);

    expect(navigation.url()).toContain('/api/auth/tiktok/authorise');
    expect(navigation.url()).toContain('account=aurora');
  });

  test('disconnect button calls POST /api/auth/disconnect', async ({ page }) => {
    await stubWithStatus(page, {
      aurora: { youtube: true, tiktok: false, youtubeName: 'AuroraYT' },
      mono: { youtube: false, tiktok: false },
      onyx: { youtube: false, tiktok: false },
    });

    let disconnectBody: { account?: string; platform?: string } = {};
    await page.route('/api/auth/disconnect', async (route) => {
      disconnectBody = route.request().postDataJSON();
      // Simulate a re-fetch of status after disconnect
      await page.route('/api/auth/status', async (r) => {
        await r.fulfill({
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
      await route.fulfill({ status: 200, body: '{}' });
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();

    // Accept the confirm dialog
    page.once('dialog', (d) => d.accept());

    // The disconnect button is the ✕ button next to "✓ YouTube"
    await page.locator('button[title="Disconnect YouTube"]').first().click();
    await page.waitForResponse((r) => r.url().includes('/api/auth/disconnect'));

    expect(disconnectBody.account).toBe('aurora');
    expect(disconnectBody.platform).toBe('youtube');
  });

  test('"All accounts connected" summary message when all 3 fully connected', async ({ page }) => {
    await stubWithStatus(page, {
      aurora: { youtube: true, tiktok: true },
      mono: { youtube: true, tiktok: true },
      onyx: { youtube: true, tiktok: true },
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();

    await expect(
      page.locator('span', { hasText: '✓ All accounts connected' })
    ).toBeVisible();
    await expect(
      page.locator('span', { hasText: '36 videos/day' })
    ).toBeVisible();
  });

  test('"0/3 Ready" shown when no accounts connected', async ({ page }) => {
    await stubWithStatus(page, {
      aurora: { youtube: false, tiktok: false },
      mono: { youtube: false, tiktok: false },
      onyx: { youtube: false, tiktok: false },
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();

    await expect(page.locator('text=0/3 Ready')).toBeVisible();
  });
});
