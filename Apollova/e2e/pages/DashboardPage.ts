/**
 * DashboardPage — Page Object Model for /dashboard
 */
import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;

  readonly heading: Locator;
  readonly bulkScheduleButton: Locator;
  readonly advancedSettingsToggle: Locator;
  readonly videoGrid: Locator;
  readonly emptyState: Locator;
  readonly loadingState: Locator;
  readonly errorState: Locator;

  // ConnectionStatus account visibility toggles
  readonly auroraVisibilityToggle: Locator;
  readonly monoVisibilityToggle: Locator;
  readonly onyxVisibilityToggle: Locator;

  // ConnectionStatus connect buttons
  readonly youtubeConnectButtons: Locator;
  readonly tiktokConnectButtons: Locator;

  // Advanced settings checkboxes
  readonly allowDeletePartialTikTokCheckbox: Locator;
  readonly allowDeletePartialYouTubeCheckbox: Locator;
  readonly allowDeleteBothFailedCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1', { hasText: 'Your Video Dashboard' });
    this.bulkScheduleButton = page.locator('button', { hasText: 'Bulk Schedule' });
    this.advancedSettingsToggle = page.locator('button', { hasText: 'Advanced Settings' });
    this.videoGrid = page.locator('.grid');
    this.emptyState = page.locator('p', { hasText: 'No videos yet' });
    this.loadingState = page.locator('p', { hasText: 'Loading videos' });
    this.errorState = page.locator('p[style*="#ff6b81"]');

    // Visibility toggles inside ConnectionStatus
    this.auroraVisibilityToggle = page.locator('button', { hasText: 'Aurora' }).first();
    this.monoVisibilityToggle = page.locator('button', { hasText: 'Mono' }).first();
    this.onyxVisibilityToggle = page.locator('button', { hasText: 'Onyx' }).first();

    // Connect buttons
    this.youtubeConnectButtons = page.locator('button', { hasText: 'Connect' }).filter({
      has: page.locator('button[style*="FF0000"]'),
    });
    this.tiktokConnectButtons = page.locator('button', { hasText: 'Connect' }).filter({
      has: page.locator('button[style*="69C9D0"]'),
    });

    // Advanced settings
    this.allowDeletePartialTikTokCheckbox = page.locator(
      'label:has-text("TikTok succeeded but YouTube failed") input[type="checkbox"]'
    );
    this.allowDeletePartialYouTubeCheckbox = page.locator(
      'label:has-text("YouTube succeeded but TikTok failed") input[type="checkbox"]'
    );
    this.allowDeleteBothFailedCheckbox = page.locator(
      'label:has-text("both uploads failed") input[type="checkbox"]'
    );
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async waitForVideosLoaded(): Promise<void> {
    await expect(this.loadingState).not.toBeVisible({ timeout: 15_000 });
  }

  async openAdvancedSettings(): Promise<void> {
    await this.advancedSettingsToggle.click();
    await expect(this.allowDeleteBothFailedCheckbox).toBeVisible();
  }

  async closeAdvancedSettings(): Promise<void> {
    await this.advancedSettingsToggle.click();
  }

  async openBulkScheduleModal(): Promise<void> {
    await this.bulkScheduleButton.click();
    // Wait for the modal heading to appear
    await expect(this.page.locator('h2', { hasText: 'Bulk Schedule' })).toBeVisible();
  }

  // Returns a locator for a specific VideoCard by approximate filename text
  videoCard(filename: string): Locator {
    return this.page.locator('div.grid > div').filter({ hasText: filename });
  }

  // Returns the Edit button inside a VideoCard
  editButtonFor(filename: string): Locator {
    return this.videoCard(filename).locator('button', { hasText: 'Edit' });
  }

  // Returns the Delete button inside a VideoCard
  deleteButtonFor(filename: string): Locator {
    return this.videoCard(filename).locator('button', { hasText: 'Delete' });
  }

  // Returns the TikTok publish button inside a VideoCard
  tiktokPublishButtonFor(filename: string): Locator {
    return this.videoCard(filename).locator('button', { hasText: 'TikTok' });
  }

  // Returns the YouTube publish button inside a VideoCard
  youtubePublishButtonFor(filename: string): Locator {
    return this.videoCard(filename).locator('button', { hasText: 'YouTube' });
  }

  // Returns the Both publish button inside a VideoCard
  bothPublishButtonFor(filename: string): Locator {
    return this.videoCard(filename).locator('button', { hasText: 'Both' });
  }

  async assertConnectedAccountsVisible(): Promise<void> {
    await expect(this.page.locator('h3', { hasText: 'Connected Accounts' })).toBeVisible();
  }

  async assertReadySummaryVisible(): Promise<void> {
    await expect(this.page.locator('text=/\\/3 Ready/')).toBeVisible();
  }
}
