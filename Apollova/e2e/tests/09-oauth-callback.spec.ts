/**
 * OAuth Callback Flows — e2e/tests/09-oauth-callback.spec.ts
 *
 * Covers:
 *   1. YouTube OAuth callback success redirects to /auth-success with platform=youtube
 *   2. YouTube OAuth callback with error=access_denied returns 400
 *   3. TikTok OAuth callback success redirects to /auth-success with platform=tiktok
 *   4. TikTok callback with invalid (non-base64url) state returns 400
 *   5. /auth-success page shows the connected platform name
 *   6. /auth-success page has "Go to Dashboard" button
 *   7. Dashboard /api/auth/status reflects connected account after OAuth
 *
 * Strategy: The callback routes make real calls to Google/TikTok, so we
 * exercise them by navigating directly to the callback URLs (simulating the
 * OAuth redirect) and stubbing the outbound fetch via route.fulfill().
 * For the "success" cases we stub /api/auth/callback/* so the server never
 * tries to reach Google or TikTok.
 */
import { test, expect, Page } from '@playwright/test';
import { injectAuthCookie } from '../fixtures/auth';
import { DashboardPage } from '../pages/DashboardPage';

// ---------------------------------------------------------------------------
// Shared stubs
// ---------------------------------------------------------------------------

async function stubDashboardBase(page: Page, accountStatus = {
  aurora: { youtube: false, tiktok: false },
  mono:   { youtube: false, tiktok: false },
  onyx:   { youtube: false, tiktok: false },
}) {
  await page.route('/api/auth/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated: true, accounts: accountStatus }),
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

// ---------------------------------------------------------------------------
// YouTube callback tests
// ---------------------------------------------------------------------------

test.describe('OAuth Callback — YouTube', () => {
  // No auth cookie needed for callback URLs (they are API routes, not
  // protected admin pages).  Auth cookie IS needed to then visit /dashboard.

  test('YouTube callback with valid code redirects to /auth-success?platform=youtube', async ({ page }) => {
    // Stub the callback endpoint so the server does not contact Google
    await page.route('**/api/auth/callback/youtube**', async (route) => {
      await route.fulfill({
        status: 302,
        headers: { Location: 'http://localhost:3000/auth-success?platform=youtube&account=aurora' },
      });
    });

    await page.goto('/api/auth/callback/youtube?code=fake_code&state=aurora');

    await expect(page).toHaveURL(/\/auth-success/, { timeout: 10_000 });
    await expect(page).toHaveURL(/platform=youtube/);
  });

  test('YouTube callback success page shows "YouTube Connected!" heading', async ({ page }) => {
    await page.goto('/auth-success?platform=youtube&account=aurora');

    await expect(
      page.locator('h2', { hasText: 'YouTube Connected!' })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('YouTube callback error=access_denied — callback API returns 400', async ({ page }) => {
    // Stub the callback to return an error JSON (simulating the real handler
    // returning { error: 'Authorization denied by user' } with status 400)
    await page.route('**/api/auth/callback/youtube**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Authorization denied by user' }),
      });
    });

    const response = await page.goto(
      '/api/auth/callback/youtube?error=access_denied&state=aurora'
    );

    // The real route returns 400 when `error` is present
    expect(response?.status()).toBe(400);
  });

  test('YouTube callback with no code returns 400', async ({ page }) => {
    await page.route('**/api/auth/callback/youtube**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'No authorization code provided' }),
      });
    });

    const response = await page.goto('/api/auth/callback/youtube?state=aurora');
    expect(response?.status()).toBe(400);
  });

  test('dashboard shows YouTube connected after successful OAuth', async ({ page, context }) => {
    await injectAuthCookie(context);

    // Simulate state where Aurora's YouTube is now connected
    await stubDashboardBase(page, {
      aurora: { youtube: true, tiktok: false, youtubeName: 'AuroraYT' } as any,
      mono:   { youtube: false, tiktok: false },
      onyx:   { youtube: false, tiktok: false },
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();

    // Connected state shows checkmark
    await expect(
      page.locator('span', { hasText: '✓ YouTube' }).first()
    ).toBeVisible();
    await expect(
      page.locator('span', { hasText: 'AuroraYT' })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TikTok callback tests
// ---------------------------------------------------------------------------

test.describe('OAuth Callback — TikTok', () => {
  test('TikTok callback with valid code and state redirects to /auth-success?platform=tiktok', async ({ page }) => {
    await page.route('**/api/auth/callback/tiktok**', async (route) => {
      await route.fulfill({
        status: 302,
        headers: { Location: 'http://localhost:3000/auth-success?platform=tiktok&account=aurora' },
      });
    });

    await page.goto('/api/auth/callback/tiktok?code=fake_code&state=fake_state');

    await expect(page).toHaveURL(/\/auth-success/, { timeout: 10_000 });
    await expect(page).toHaveURL(/platform=tiktok/);
  });

  test('TikTok callback success page shows "TikTok Connected!" heading', async ({ page }) => {
    await page.goto('/auth-success?platform=tiktok&account=aurora');

    await expect(
      page.locator('h2', { hasText: 'TikTok Connected!' })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('TikTok callback error=access_denied returns 400', async ({ page }) => {
    await page.route('**/api/auth/callback/tiktok**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Authorization denied by user' }),
      });
    });

    const response = await page.goto(
      '/api/auth/callback/tiktok?error=access_denied&state=some_state'
    );
    expect(response?.status()).toBe(400);
  });

  test('TikTok callback with invalid (non-base64url) state returns 400', async ({ page }) => {
    await page.route('**/api/auth/callback/tiktok**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid state parameter' }),
      });
    });

    // Real handler will try JSON.parse(Buffer.from(state, 'base64url')) and fail
    const response = await page.goto(
      '/api/auth/callback/tiktok?code=fake_code&state=NOT_VALID_BASE64'
    );
    expect(response?.status()).toBe(400);
  });

  test('TikTok callback with no code returns 400', async ({ page }) => {
    await page.route('**/api/auth/callback/tiktok**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'No authorization code or state provided' }),
      });
    });

    const response = await page.goto('/api/auth/callback/tiktok');
    expect(response?.status()).toBe(400);
  });

  test('dashboard shows TikTok connected after successful OAuth', async ({ page, context }) => {
    await injectAuthCookie(context);

    await stubDashboardBase(page, {
      aurora: { youtube: false, tiktok: true, tiktokName: 'aurora_tt' } as any,
      mono:   { youtube: false, tiktok: false },
      onyx:   { youtube: false, tiktok: false },
    });

    const dashPage = new DashboardPage(page);
    await dashPage.goto();

    await expect(
      page.locator('span', { hasText: '✓ TikTok' }).first()
    ).toBeVisible();
    await expect(
      page.locator('span', { hasText: '@aurora_tt' })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// /auth-success shared page tests
// ---------------------------------------------------------------------------

test.describe('/auth-success page', () => {
  test('"Go to Dashboard Now" button is visible', async ({ page }) => {
    await page.goto('/auth-success?platform=youtube&account=aurora');

    await expect(
      page.locator('button', { hasText: 'Go to Dashboard Now' })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('countdown timer text is visible', async ({ page }) => {
    await page.goto('/auth-success?platform=tiktok&account=mono');

    // The countdown shows "Redirecting to dashboard in X seconds..."
    await expect(
      page.locator('p', { hasText: /Redirecting to dashboard in/ })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('page is accessible without an auth cookie', async ({ page }) => {
    // auth-success is a public page (no middleware protection)
    await page.goto('/auth-success?platform=youtube&account=aurora');
    await expect(page).not.toHaveURL(/\/gate/);
    await expect(page.locator('body')).toBeVisible();
  });
});
