/**
 * UploadPage — Page Object Model for /upload
 */
import { Page, Locator, expect } from '@playwright/test';
import path from 'path';

export class UploadPage {
  readonly page: Page;

  readonly heading: Locator;
  readonly dropZone: Locator;
  readonly fileInput: Locator;
  readonly uploadButton: Locator;
  readonly progressBar: Locator;

  // Account selector buttons
  readonly auroraAccountBtn: Locator;
  readonly monoAccountBtn: Locator;
  readonly onyxAccountBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1', { hasText: 'Upload Videos' });
    // Drop zone is identified by its visible text
    this.dropZone = page.locator('div', { hasText: 'Drag & drop videos here' });
    this.fileInput = page.locator('#file-input');
    this.uploadButton = page.locator('button', { hasText: /Upload .* video/ });
    this.progressBar = page.locator('div[style*="transition: width"]');

    // Account buttons match "Apollova Aurora", "Apollova Mono", "Apollova Onyx"
    this.auroraAccountBtn = page.locator('button', { hasText: 'Apollova Aurora' });
    this.monoAccountBtn = page.locator('button', { hasText: 'Apollova Mono' });
    this.onyxAccountBtn = page.locator('button', { hasText: 'Apollova Onyx' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/upload');
    await expect(this.heading).toBeVisible();
  }

  async selectAccount(account: 'aurora' | 'mono' | 'onyx'): Promise<void> {
    const btn = {
      aurora: this.auroraAccountBtn,
      mono: this.monoAccountBtn,
      onyx: this.onyxAccountBtn,
    }[account];
    await btn.click();
  }

  /**
   * Attach files via the hidden file input (bypasses drag-and-drop OS dialog).
   */
  async attachFiles(filePaths: string[]): Promise<void> {
    await this.fileInput.setInputFiles(filePaths);
  }

  async assertFileCount(count: number): Promise<void> {
    await expect(
      this.page.locator('h3', { hasText: new RegExp(`${count} video`) })
    ).toBeVisible();
  }

  async removeFirstFile(): Promise<void> {
    await this.page.locator('button', { hasText: '✕' }).first().click();
  }

  async assertUploadButtonVisible(): Promise<void> {
    await expect(this.uploadButton).toBeVisible();
  }

  async assertSelectedAccount(account: 'aurora' | 'mono' | 'onyx'): Promise<void> {
    // The selected account badge appears in the file list header
    const badge = this.page.locator('span', {
      hasText: new RegExp(`→ ${account.charAt(0).toUpperCase() + account.slice(1)} Account`, 'i'),
    });
    await expect(badge).toBeVisible();
  }

  async clickUpload(): Promise<void> {
    await this.uploadButton.click();
  }

  async assertUploadingState(): Promise<void> {
    await expect(this.page.locator('button', { hasText: /Uploading/ })).toBeVisible();
  }
}
