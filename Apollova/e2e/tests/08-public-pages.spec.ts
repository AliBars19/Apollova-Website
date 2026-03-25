/**
 * Public Pages — e2e/tests/08-public-pages.spec.ts
 *
 * Covers:
 *   1. Homepage loads with hero section + "Pioneers of Lyric Content"
 *   2. All three template cards are visible on the homepage
 *   3. Each template card links to the correct URL
 *   4. Enquiries section and contact email visible on homepage
 *   5. Apollova Aurora template page structure
 *   6. Apollova Mono template page structure
 *   7. Apollova Onyx template page structure
 *   8. Privacy Policy page loads
 *   9. Terms of Service page loads
 *  10. Public navbar is visible on public pages
 *  11. Admin navbar is NOT visible on public pages
 *  12. Public pages are accessible without auth cookie
 */
import { test, expect } from '@playwright/test';
import { PublicHomePage } from '../pages/PublicHomePage';
import { TemplatePage } from '../pages/TemplatePage';

// No auth cookie injection — these are deliberately unauthenticated tests
test.describe('Public Pages', () => {
  test('homepage renders hero video and "Pioneers of Lyric Content" heading', async ({ page }) => {
    const homePage = new PublicHomePage(page);
    await homePage.goto();

    await expect(homePage.sectionHeading).toBeVisible();
    // Hero <video> element is present in the DOM
    await expect(homePage.heroVideo).toBeAttached();
  });

  test('all three template cards appear on the homepage', async ({ page }) => {
    const homePage = new PublicHomePage(page);
    await homePage.goto();

    await homePage.assertAllTemplateCardsVisible();
  });

  test('Aurora template card links to /templates/apollova-aurora', async ({ page }) => {
    const homePage = new PublicHomePage(page);
    await homePage.goto();

    const href = await homePage.auroraCard.locator('..').getAttribute('href');
    expect(href).toContain('apollova-aurora');
  });

  test('Mono template card links to /templates/apollova-mono', async ({ page }) => {
    const homePage = new PublicHomePage(page);
    await homePage.goto();

    const href = await homePage.monoCard.locator('..').getAttribute('href');
    expect(href).toContain('apollova-mono');
  });

  test('Onyx template card links to /templates/apollova-onyx', async ({ page }) => {
    const homePage = new PublicHomePage(page);
    await homePage.goto();

    const href = await homePage.onyxCard.locator('..').getAttribute('href');
    expect(href).toContain('apollova-onyx');
  });

  test('enquiries section and contact email are visible', async ({ page }) => {
    const homePage = new PublicHomePage(page);
    await homePage.goto();

    await expect(page.locator('h2', { hasText: 'Enquiries' })).toBeVisible();
    await homePage.assertContactEmailVisible();
  });

  test('Apollova Aurora template page renders correctly', async ({ page }) => {
    const templatePage = new TemplatePage(page, 'aurora');
    await templatePage.goto();
    await templatePage.assertStructure();
    await expect(page).toHaveURL(/apollova-aurora/);
  });

  test('Apollova Mono template page renders correctly', async ({ page }) => {
    const templatePage = new TemplatePage(page, 'mono');
    await templatePage.goto();
    await templatePage.assertStructure();
    await expect(page).toHaveURL(/apollova-mono/);
  });

  test('Apollova Onyx template page renders correctly', async ({ page }) => {
    const templatePage = new TemplatePage(page, 'onyx');
    await templatePage.goto();
    await templatePage.assertStructure();
    await expect(page).toHaveURL(/apollova-onyx/);
  });

  test('Privacy Policy page loads', async ({ page }) => {
    await page.goto('/privacy-policy');
    // Minimal check: page loads without error
    await expect(page).not.toHaveURL(/\/gate/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Terms of Service page loads', async ({ page }) => {
    await page.goto('/terms-of-service');
    await expect(page).not.toHaveURL(/\/gate/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('public navbar is present on the homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // PublicNavbar renders a <nav> element; verify it's present
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 10_000 });
  });

  test('admin navbar is NOT visible on the public homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // AdminNavbar renders the "Admin" badge — should not be present on public pages
    await expect(page.locator('span', { hasText: 'Admin' })).not.toBeVisible();
  });

  test('homepage is accessible without an auth cookie', async ({ page }) => {
    // No cookie injection; page must load without redirect
    await page.goto('/');
    await expect(page).not.toHaveURL(/\/gate/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('template page is accessible without an auth cookie', async ({ page }) => {
    await page.goto('/templates/apollova-aurora');
    await expect(page).not.toHaveURL(/\/gate/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('"Discover" link text appears under each template card', async ({ page }) => {
    const homePage = new PublicHomePage(page);
    await homePage.goto();

    const discoverLinks = page.locator('span', { hasText: 'Discover' });
    await expect(discoverLinks).toHaveCount(3);
  });

  test('description text is present under each template card', async ({ page }) => {
    const homePage = new PublicHomePage(page);
    await homePage.goto();

    await expect(
      page.locator('p', { hasText: 'virtual MacBook' })
    ).toBeVisible();
    await expect(
      page.locator('p', { hasText: 'most viral template' })
    ).toBeVisible();
    await expect(
      page.locator('p', { hasText: 'Iconic, simple' })
    ).toBeVisible();
  });
});
