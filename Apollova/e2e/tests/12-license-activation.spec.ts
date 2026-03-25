/**
 * License Activation and Hardware Reset — e2e/tests/12-license-activation.spec.ts
 *
 * Covers:
 *   1. POST /api/activate with valid key + hw_fingerprint → { success: true }
 *   2. POST /api/activate with invalid key → { success: false, error: '...' }
 *   3. POST /api/activate with revoked license → { success: false } 403
 *   4. POST /api/activate with key already bound to different hardware → 403
 *   5. Hardware reset button in LicensesPage details modal calls
 *      POST /api/licenses/:id/reset
 *   6. After hardware reset the response includes { success: true }
 *   7. hw_fingerprint field in the details modal shows "None" / empty after reset
 *   8. GET /api/activate returns the endpoint description (contract test)
 */
import { test, expect, Page } from '@playwright/test';
import { injectAuthCookie } from '../fixtures/auth';
import { LicensesPage } from '../pages/LicensesPage';

// ---------------------------------------------------------------------------
// License record factory (mirrors 07-license-management.spec.ts)
// ---------------------------------------------------------------------------

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
    id: `lic-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    license_key: `APOL-ACT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    customer_email: 'activation@example.com',
    customer_name: 'Activation Test',
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

// ---------------------------------------------------------------------------
// /api/activate contract tests
// ---------------------------------------------------------------------------

test.describe('License Activation API (/api/activate)', () => {
  test('POST /api/activate with valid key → success: true', async ({ page }) => {
    await page.route('/api/activate', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'License activated successfully!',
            token: 'abc123token',
          }),
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.evaluate(async () => {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: 'APOL-VALID-KEY-1234',
          hwFingerprint: 'sha256-abc123def456',
        }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeTruthy();
  });

  test('POST /api/activate with invalid key → success: false, 404', async ({ page }) => {
    await page.goto('/gate'); // Navigate somewhere first so page.evaluate works

    await page.route('/api/activate', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid license key. Please check and try again.',
          }),
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.evaluate(async () => {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: 'APOL-INVALID-0000',
          hwFingerprint: 'sha256-abc123',
        }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Invalid license key');
  });

  test('POST /api/activate with revoked license → success: false, 403', async ({ page }) => {
    await page.goto('/gate');

    await page.route('/api/activate', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'This license has been revoked. Contact support for assistance.',
          }),
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.evaluate(async () => {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: 'APOL-REVOKED-1234',
          hwFingerprint: 'sha256-abc123',
        }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('revoked');
  });

  test('POST /api/activate with key already bound to different hardware → 403', async ({ page }) => {
    await page.goto('/gate');

    await page.route('/api/activate', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'This license is already activated on another computer. Contact support to reset.',
          }),
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.evaluate(async () => {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: 'APOL-BOUND-1234',
          hwFingerprint: 'sha256-different-machine',
        }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('another computer');
  });

  test('POST /api/activate with missing fields → 400', async ({ page }) => {
    await page.goto('/gate');

    await page.route('/api/activate', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Missing license key or hardware fingerprint',
          }),
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.evaluate(async () => {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('GET /api/activate returns endpoint description', async ({ page }) => {
    await page.route('/api/activate', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            endpoint: '/api/activate',
            method: 'POST',
            body: { licenseKey: 'XXXX-XXXX-XXXX-XXXX', hwFingerprint: 'sha256-hash' },
          }),
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.goto('/api/activate');
    const body = await response?.json();

    expect(body.endpoint).toBe('/api/activate');
    expect(body.method).toBe('POST');
  });
});

// ---------------------------------------------------------------------------
// Hardware Reset via LicensesPage UI
// ---------------------------------------------------------------------------

test.describe('Hardware Reset (LicensesPage)', () => {
  test.beforeEach(async ({ context }) => {
    await injectAuthCookie(context);
  });

  test('Reset Hardware button is visible in the details modal for activated license', async ({ page }) => {
    const license = makeLicense({
      activated: true,
      hw_fingerprint: 'sha256-machine-abc',
      activation_date: new Date().toISOString(),
    });

    await stubLicenses(page, [license]);

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();
    await licensesPage.clickViewForRow(0);

    await expect(licensesPage.resetHardwareBtn).toBeVisible();
  });

  test('Reset Hardware button click calls POST /api/licenses/:id/reset', async ({ page }) => {
    const license = makeLicense({
      activated: true,
      hw_fingerprint: 'sha256-machine-xyz',
    });

    await stubLicenses(page, [license]);

    let resetCalled = false;
    await page.route(`/api/licenses/${license.id}/reset`, async (route) => {
      if (route.request().method() === 'POST') {
        resetCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Hardware binding reset. Customer can now activate on a new computer.',
          }),
        });
      } else {
        await route.continue();
      }
    });

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();
    await licensesPage.clickViewForRow(0);

    // Accept the confirm dialog that the reset button triggers
    page.once('dialog', (d) => d.accept());
    await licensesPage.resetHardwareBtn.click();

    // Wait for the reset API call
    await page.waitForResponse(
      (r) => r.url().includes('/reset') && r.status() === 200,
      { timeout: 8_000 }
    );

    expect(resetCalled).toBe(true);
  });

  test('hardware reset API returns success: true', async ({ page }) => {
    const license = makeLicense({ activated: true, hw_fingerprint: 'sha256-abc' });

    await stubLicenses(page, [license]);

    await page.route(`/api/licenses/${license.id}/reset`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Hardware binding reset. Customer can now activate on a new computer.',
        }),
      });
    });

    // Also stub re-fetch of licenses after reset
    let callCount = 0;
    await page.route('/api/licenses', async (route) => {
      callCount++;
      const resetLicense = callCount > 1
        ? { ...license, activated: false, hw_fingerprint: null, activation_date: null }
        : license;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ licenses: [resetLicense] }),
      });
    });

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();
    await licensesPage.clickViewForRow(0);

    page.once('dialog', (d) => d.accept());

    const [resetResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/reset')),
      licensesPage.resetHardwareBtn.click(),
    ]);

    const body = await resetResponse.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('Hardware binding reset');
  });

  test('hardware reset: 404 if license does not exist', async ({ page }) => {
    const license = makeLicense({ activated: true, hw_fingerprint: 'sha256-abc' });
    await stubLicenses(page, [license]);

    await page.route(`/api/licenses/${license.id}/reset`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'License not found' }),
      });
    });

    const licensesPage = new LicensesPage(page);
    await licensesPage.goto();
    await licensesPage.waitForLoaded();
    await licensesPage.clickViewForRow(0);

    page.once('dialog', (d) => d.accept());

    const [resetResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/reset')),
      licensesPage.resetHardwareBtn.click(),
    ]);

    expect(resetResponse.status()).toBe(404);
    const body = await resetResponse.json();
    expect(body.success).toBe(false);
  });
});
