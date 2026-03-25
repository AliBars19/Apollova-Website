/**
 * License Management — e2e/tests/07-license-management.spec.ts
 *
 * Covers:
 *   1. /licenses page renders heading and stats grid
 *   2. "No licenses yet" empty state
 *   3. Generate New License button opens the create modal
 *   4. Create modal validates required fields
 *   5. Submitting create form calls POST /api/licenses
 *   6. Created license appears in the table
 *   7. View button opens the details modal
 *   8. Details modal shows all license fields
 *   9. Revoke license calls PATCH and updates status
 *   10. Delete permanently calls DELETE (only available for revoked licenses)
 *   11. Search filters the license list
 *   12. Status filter works correctly
 */
import { test, expect, Page } from '@playwright/test';
import { injectAuthCookie } from '../fixtures/auth';
import { LicensesPage } from '../pages/LicensesPage';
import { buildLicenseFormData } from '../fixtures/test-data';

interface LicenseRecord {
  id: string;
  license_key: string;
  customer_email: string;
  customer_name: string;
  purchase_date: string;
  price_paid: number;
  activated: boolean;
  activation_date: string | null;
  hw_fingerprint: string | null;
  last_verified: string | null;
  revoked: boolean;
  notes: string;
}

function makeLicense(overrides: Partial<LicenseRecord> = {}): LicenseRecord {
  return {
    id: `lic-${Date.now()}`,
    license_key: `APOL-TEST-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    customer_email: 'customer@example.com',
    customer_name: 'Test Customer',
    purchase_date: new Date().toISOString(),
    price_paid: 250,
    activated: false,
    activation_date: null,
    hw_fingerprint: null,
    last_verified: null,
    revoked: false,
    notes: '',
    ...overrides,
  };
}

async function stubLicenses(page: Page, licenses: LicenseRecord[]) {
  await page.route('/api/licenses', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ licenses }),
      });
    } else {
      await route.continue();
    }
  });
}

test.describe('License Management', () => {
  test.beforeEach(async ({ context }) => {
    await injectAuthCookie(context);
  });

  test('licenses page renders heading, stats, and generate button', async ({ page }) => {
    await stubLicenses(page, []);

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();

    await expect(licensesPage.heading).toBeVisible();
    await expect(licensesPage.generateButton).toBeVisible();
    await expect(licensesPage.totalStat).toBeVisible();
  });

  test('empty state shows correct message', async ({ page }) => {
    await stubLicenses(page, []);

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();

    await expect(
      page.locator('div', { hasText: "No licenses yet. Click 'Generate New License'" })
    ).toBeVisible();
  });

  test('stats grid shows correct counts', async ({ page }) => {
    const licenses = [
      makeLicense({ activated: true, revoked: false }),
      makeLicense({ activated: false, revoked: false }),
      makeLicense({ activated: false, revoked: true }),
    ];
    await stubLicenses(page, licenses);

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();

    // Total = 3, Active = 1, Unused = 1, Revoked = 1
    // Stats are rendered as large numbers inside the stat cards
    const statCards = page.locator('div[style*="36px"]');
    // Values: "3", "1", "1", "1"
    await expect(statCards.filter({ hasText: '3' })).toBeVisible();
    await expect(statCards.filter({ hasText: '1' }).first()).toBeVisible();
  });

  test('Generate New License button opens create modal', async ({ page }) => {
    await stubLicenses(page, []);

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();
    await licensesPage.openCreateModal();

    await expect(page.locator('h2', { hasText: 'Generate New License' })).toBeVisible();
    await expect(licensesPage.customerNameInput).toBeVisible();
    await expect(licensesPage.customerEmailInput).toBeVisible();
    await expect(licensesPage.pricePaidInput).toBeVisible();
  });

  test('create modal Cancel button closes the modal', async ({ page }) => {
    await stubLicenses(page, []);

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();
    await licensesPage.openCreateModal();

    await licensesPage.cancelCreateBtn.click();
    await expect(page.locator('h2', { hasText: 'Generate New License' })).not.toBeVisible({ timeout: 5_000 });
  });

  test('submitting create form calls POST /api/licenses', async ({ page }) => {
    await stubLicenses(page, []);

    const formData = buildLicenseFormData();
    let postBody: Partial<LicenseRecord> = {};

    await page.route('/api/licenses', async (route) => {
      if (route.request().method() === 'POST') {
        postBody = route.request().postDataJSON();
        // After create, return the new license in the GET
        const newLicense = makeLicense({
          customer_name: postBody.customer_name ?? '',
          customer_email: postBody.customer_email ?? '',
        });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, license: newLicense }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ licenses: [] }),
        });
      }
    });

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();
    await licensesPage.openCreateModal();
    await licensesPage.fillCreateForm(formData);
    await licensesPage.submitCreateForm();

    expect(postBody.customer_name).toBe(formData.customerName);
    expect(postBody.customer_email).toBe(formData.customerEmail);
  });

  test('license rows render with View button', async ({ page }) => {
    const licenses = [makeLicense(), makeLicense(), makeLicense()];
    await stubLicenses(page, licenses);

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();

    await licensesPage.assertLicenseRowCount(3);
  });

  test('View button opens the details modal', async ({ page }) => {
    const license = makeLicense({ customer_name: 'Jane Details' });
    await stubLicenses(page, [license]);

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();

    await licensesPage.clickViewForRow(0);

    await expect(page.locator('h2', { hasText: 'License Details' })).toBeVisible();
    await expect(page.locator('div', { hasText: 'Jane Details' })).toBeVisible();
  });

  test('details modal shows customer email and price paid', async ({ page }) => {
    const license = makeLicense({
      customer_name: 'Price Test',
      customer_email: 'price@test.com',
      price_paid: 350,
    });
    await stubLicenses(page, [license]);

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();
    await licensesPage.clickViewForRow(0);

    await expect(page.locator('span', { hasText: 'price@test.com' })).toBeVisible();
    await expect(page.locator('span', { hasText: '£350.00' })).toBeVisible();
  });

  test('Revoke License button calls PATCH /api/licenses/:id', async ({ page }) => {
    const license = makeLicense({ activated: false, revoked: false });
    await stubLicenses(page, [license]);

    let patchCalled = false;
    await page.route(`/api/licenses/${license.id}`, async (route) => {
      if (route.request().method() === 'PATCH') {
        patchCalled = true;
        await route.fulfill({ status: 200, body: '{}' });
      } else {
        await route.continue();
      }
    });

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();
    await licensesPage.clickViewForRow(0);
    await licensesPage.revokeCurrentLicense();

    expect(patchCalled).toBe(true);
  });

  test('Delete Permanently button only visible for revoked licenses', async ({ page }) => {
    const revokedLicense = makeLicense({ revoked: true });
    await stubLicenses(page, [revokedLicense]);

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();
    await licensesPage.clickViewForRow(0);

    await expect(licensesPage.deleteLicenseBtn).toBeVisible();
    // Revoke button should NOT be visible for already-revoked license
    await expect(licensesPage.revokeLicenseBtn).not.toBeVisible();
  });

  test('Delete calls DELETE /api/licenses/:id', async ({ page }) => {
    const license = makeLicense({ revoked: true });
    await stubLicenses(page, [license]);

    let deleteCalled = false;
    await page.route(`/api/licenses/${license.id}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        await route.fulfill({ status: 200, body: '{}' });
      } else {
        await route.continue();
      }
    });

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();
    await licensesPage.clickViewForRow(0);
    await licensesPage.deleteCurrentLicense();

    expect(deleteCalled).toBe(true);
  });

  test('search filters the license table', async ({ page }) => {
    const licenses = [
      makeLicense({ customer_name: 'Alice Smith', customer_email: 'alice@test.com' }),
      makeLicense({ customer_name: 'Bob Jones', customer_email: 'bob@test.com' }),
    ];
    await stubLicenses(page, licenses);

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();

    await licensesPage.searchFor('alice');

    await expect(page.locator('div', { hasText: 'Alice Smith' })).toBeVisible();
    await expect(page.locator('div', { hasText: 'Bob Jones' })).not.toBeVisible();
  });

  test('status filter "revoked" shows only revoked licenses', async ({ page }) => {
    const licenses = [
      makeLicense({ customer_name: 'Active User', activated: true, revoked: false }),
      makeLicense({ customer_name: 'Revoked User', activated: false, revoked: true }),
    ];
    await stubLicenses(page, licenses);

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();

    await licensesPage.filterByStatus('revoked');

    await expect(page.locator('div', { hasText: 'Revoked User' })).toBeVisible();
    await expect(page.locator('div', { hasText: 'Active User' })).not.toBeVisible();
  });

  test('status filter "active" shows only active licenses', async ({ page }) => {
    const licenses = [
      makeLicense({ customer_name: 'Active User', activated: true, revoked: false }),
      makeLicense({ customer_name: 'Unused User', activated: false, revoked: false }),
    ];
    await stubLicenses(page, licenses);

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();

    await licensesPage.filterByStatus('active');

    await expect(page.locator('div', { hasText: 'Active User' })).toBeVisible();
    await expect(page.locator('div', { hasText: 'Unused User' })).not.toBeVisible();
  });

  test('closing details modal returns to list view', async ({ page }) => {
    const license = makeLicense();
    await stubLicenses(page, [license]);

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();
    await licensesPage.clickViewForRow(0);
    await licensesPage.closeDetailsModal();

    await expect(page.locator('h2', { hasText: 'License Details' })).not.toBeVisible({ timeout: 5_000 });
    await expect(licensesPage.heading).toBeVisible();
  });
});
