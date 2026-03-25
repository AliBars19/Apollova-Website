/**
 * Video Upload Flow — e2e/tests/02-upload-flow.spec.ts
 *
 * Covers:
 *   1. Upload page renders with account selector + drop zone
 *   2. Selecting an account highlights the correct button
 *   3. Attaching files shows them in the list
 *   4. Removing a file updates the list
 *   5. Upload button shows correct account + file count
 *   6. Successful upload redirects to /dashboard
 *   7. Upload failure shows an alert
 *   8. Only video/* files are accepted
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { injectAuthCookie } from '../fixtures/auth';
import { UploadPage } from '../pages/UploadPage';
import { UPLOAD_FILENAMES, buildTinyMp4Buffer } from '../fixtures/test-data';

// Helper: write a tiny fake .mp4 to a temp file and return its path
function createTempMp4(name: string): string {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, name);
  fs.writeFileSync(filePath, buildTinyMp4Buffer());
  return filePath;
}

test.describe('Video Upload Flow', () => {
  test.beforeEach(async ({ context }) => {
    await injectAuthCookie(context);
  });

  test('upload page renders heading, account selector and drop zone', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    await expect(uploadPage.heading).toBeVisible();
    await expect(uploadPage.auroraAccountBtn).toBeVisible();
    await expect(uploadPage.monoAccountBtn).toBeVisible();
    await expect(uploadPage.onyxAccountBtn).toBeVisible();
    await expect(uploadPage.dropZone).toBeVisible();
    await expect(page.locator('p', { hasText: 'or click to browse' })).toBeVisible();
  });

  test('selecting Aurora account highlights it', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    // Aurora is default, click Mono then back to Aurora
    await uploadPage.selectAccount('mono');
    await uploadPage.selectAccount('aurora');
    // The Aurora button has accent border when selected
    const style = await uploadPage.auroraAccountBtn.getAttribute('style');
    expect(style).toContain('84C3AA');
  });

  test('selecting Mono account switches highlight', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.selectAccount('mono');
    const style = await uploadPage.monoAccountBtn.getAttribute('style');
    expect(style).toContain('F59E0B');
  });

  test('selecting Onyx account switches highlight', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.selectAccount('onyx');
    const style = await uploadPage.onyxAccountBtn.getAttribute('style');
    expect(style).toContain('1E90FF');
  });

  test('attaching a video file shows it in the list', async ({ page }) => {
    const filePath = createTempMp4(UPLOAD_FILENAMES.aurora);
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    await uploadPage.attachFiles([filePath]);
    await uploadPage.assertFileCount(1);
    await expect(page.locator('p', { hasText: UPLOAD_FILENAMES.aurora })).toBeVisible();
  });

  test('attaching multiple files shows correct count', async ({ page }) => {
    const file1 = createTempMp4(UPLOAD_FILENAMES.aurora);
    const file2 = createTempMp4(UPLOAD_FILENAMES.mono);
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    await uploadPage.attachFiles([file1, file2]);
    await uploadPage.assertFileCount(2);
  });

  test('removing a file updates the list', async ({ page }) => {
    const file1 = createTempMp4(UPLOAD_FILENAMES.aurora);
    const file2 = createTempMp4(UPLOAD_FILENAMES.mono);
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    await uploadPage.attachFiles([file1, file2]);
    await uploadPage.assertFileCount(2);
    await uploadPage.removeFirstFile();
    await uploadPage.assertFileCount(1);
  });

  test('upload button label reflects selected account and file count', async ({ page }) => {
    const filePath = createTempMp4(UPLOAD_FILENAMES.mono);
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.selectAccount('mono');
    await uploadPage.attachFiles([filePath]);

    const btn = uploadPage.uploadButton;
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Mono');
    await expect(btn).toContainText('1 video');
  });

  test('successful upload redirects to /dashboard', async ({ page }) => {
    const filePath = createTempMp4(UPLOAD_FILENAMES.aurora);

    // Stub upload endpoint
    await page.route('/api/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, video: { id: 'new-vid-1' } }),
      });
    });

    // Stub dashboard auth + video endpoints to avoid cascade failures
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
    await page.route('/api/videos', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.attachFiles([filePath]);
    await uploadPage.clickUpload();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });

  test('upload failure shows an alert', async ({ page }) => {
    const filePath = createTempMp4(UPLOAD_FILENAMES.aurora);

    await page.route('/api/upload', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.attachFiles([filePath]);

    // Capture the alert
    const alertPromise = page.waitForEvent('dialog');
    await uploadPage.clickUpload();
    const dialog = await alertPromise;

    expect(dialog.message()).toContain('Upload failed');
    await dialog.accept();
  });

  test('upload button is not visible before files are attached', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await expect(uploadPage.uploadButton).not.toBeVisible();
  });

  test('non-video files are filtered out when attached', async ({ page }) => {
    // Create a .txt file — the input has accept="video/*" which the browser
    // enforces; we verify the JS filter also prevents it from appearing.
    const tmpDir = os.tmpdir();
    const txtPath = path.join(tmpDir, 'not_a_video.txt');
    fs.writeFileSync(txtPath, 'not a video');

    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    // setInputFiles bypasses the accept attribute, but the JS filter
    // (file.type.startsWith('video/')) runs client-side — .txt has MIME
    // type text/plain so it is filtered out silently.
    await uploadPage.fileInput.setInputFiles(txtPath);

    // Upload button should NOT appear
    await expect(uploadPage.uploadButton).not.toBeVisible();
  });
});
