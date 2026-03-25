/**
 * Gate Authentication Flow — e2e/tests/01-gate-auth.spec.ts
 *
 * Covers:
 *   1. Unauthenticated access to protected routes redirects to /gate
 *   2. Wrong password shows error message
 *   3. Correct password sets cookie and redirects to /dashboard
 *   4. Gate page UI elements render correctly
 *   5. Redirect-back cookie is honoured after login
 */
import { test, expect } from '@playwright/test';
import { GatePage } from '../pages/GatePage';
import { GATE_CREDENTIALS } from '../fixtures/test-data';

// NOTE: These tests intentionally do NOT inject the auth cookie so they
// exercise the real gate flow.

test.describe('Gate Authentication Flow', () => {
  test('gate page renders all UI elements', async ({ page }) => {
    const gatePage = new GatePage(page);
    await gatePage.goto();

    await expect(gatePage.heading).toBeVisible();
    await expect(gatePage.privateAccessLabel).toBeVisible();
    await expect(gatePage.passwordInput).toBeVisible();
    await expect(gatePage.submitButton).toBeVisible();
    await expect(page.locator('p', { hasText: 'password protected' })).toBeVisible();
  });

  test('visiting /dashboard without auth redirects to /gate', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/gate/, { timeout: 10_000 });
  });

  test('visiting /upload without auth redirects to /gate', async ({ page }) => {
    await page.goto('/upload');
    await expect(page).toHaveURL(/\/gate/, { timeout: 10_000 });
  });

  test('visiting /licenses without auth redirects to /gate', async ({ page }) => {
    await page.goto('/licenses');
    await expect(page).toHaveURL(/\/gate/, { timeout: 10_000 });
  });

  test('wrong password shows error and stays on /gate', async ({ page }) => {
    const gatePage = new GatePage(page);
    await gatePage.goto();

    await gatePage.login(GATE_CREDENTIALS.wrong);

    await expect(gatePage.errorMessage).toBeVisible({ timeout: 8_000 });
    await expect(page).toHaveURL(/\/gate/);
  });

  test('empty password field — form requires input before submission', async ({ page }) => {
    const gatePage = new GatePage(page);
    await gatePage.goto();

    // HTML5 required validation prevents submission when field is empty
    await gatePage.submit();
    await expect(page).toHaveURL(/\/gate/);
  });

  test('correct password sets cookie and navigates to /dashboard', async ({ page }) => {
    const gatePage = new GatePage(page);
    await gatePage.goto();

    // Intercept the POST to /api/auth/gate and return a mock success
    // (avoids needing a running server with the real SITE_PASSWORD).
    await page.route('/api/auth/gate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Set-Cookie': 'site_access=true; Path=/; HttpOnly',
        },
        body: JSON.stringify({ success: true }),
      });
    });

    // Also stub /api/auth/status so the dashboard auth check passes
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

    // Stub /api/videos so dashboard loads
    await page.route('/api/videos', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await gatePage.login(GATE_CREDENTIALS.correct);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test('redirect_after_gate cookie directs user to intended protected route', async ({ page }) => {
    // Set the redirect cookie before visiting /gate
    await page.context().addCookies([
      {
        name: 'redirect_after_gate',
        value: '/upload',
        domain: 'localhost',
        path: '/',
      },
    ]);

    const gatePage = new GatePage(page);
    await gatePage.goto();

    // Stub the API so we get a success without needing the real password
    await page.route('/api/auth/gate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Set-Cookie': 'site_access=true; Path=/; HttpOnly',
        },
        body: JSON.stringify({ success: true }),
      });
    });

    await page.route('/api/auth/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true }),
      });
    });

    await gatePage.login(GATE_CREDENTIALS.correct);
    // router.push reads the cookie client-side and navigates to /upload
    await expect(page).toHaveURL(/\/upload/, { timeout: 10_000 });
  });

  test('button shows "Checking..." during in-flight request', async ({ page }) => {
    const gatePage = new GatePage(page);
    await gatePage.goto();

    // Delay the response so we can observe the loading state
    await page.route('/api/auth/gate', async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false }),
      });
    });

    await gatePage.passwordInput.fill('anything');
    await gatePage.submitButton.click();

    await expect(gatePage.submitButton).toContainText('Checking', { timeout: 2_000 });
  });
});
