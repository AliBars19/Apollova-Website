/**
 * TikTokDrawerPage — Page Object Model for the TikTok Publish Drawer
 *
 * The drawer is a slide-in panel rendered via a React Portal at body level.
 * It appears when the "TikTok" button is clicked on a VideoCard.
 */
import { Page, Locator, expect } from '@playwright/test';

export class TikTokDrawerPage {
  readonly page: Page;

  readonly drawerContainer: Locator;
  readonly drawerHeading: Locator;
  readonly closeButton: Locator;
  readonly titleTextarea: Locator;
  readonly privacySelect: Locator;
  readonly allowCommentCheckbox: Locator;
  readonly allowDuetCheckbox: Locator;
  readonly allowStitchCheckbox: Locator;
  readonly commercialContentToggle: Locator;
  readonly yourBrandCheckbox: Locator;
  readonly brandedContentCheckbox: Locator;
  readonly consentCheckbox: Locator;
  readonly postToTikTokButton: Locator;
  readonly cancelButton: Locator;
  readonly loadingSpinner: Locator;
  readonly privacyError: Locator;
  readonly consentError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.drawerContainer = page.locator('.drawer-container');
    this.drawerHeading = page.locator('h2', { hasText: 'Post to TikTok' });
    this.closeButton = this.drawerContainer.locator('button[style*="40px"]').first();
    this.titleTextarea = page.locator('textarea[placeholder*="caption"]');
    this.privacySelect = page.locator('select').filter({ hasText: 'Select privacy level' });
    this.allowCommentCheckbox = page
      .locator('label', { hasText: 'Comment' })
      .locator('input[type="checkbox"]');
    this.allowDuetCheckbox = page
      .locator('label', { hasText: 'Duet' })
      .locator('input[type="checkbox"]');
    this.allowStitchCheckbox = page
      .locator('label', { hasText: 'Stitch' })
      .locator('input[type="checkbox"]');
    this.commercialContentToggle = page
      .locator('label', { hasText: 'Disclose commercial content' })
      .locator('div[style*="56px"]');
    this.yourBrandCheckbox = page
      .locator('label', { hasText: 'Your brand' })
      .locator('input[type="checkbox"]');
    this.brandedContentCheckbox = page
      .locator('label', { hasText: 'Branded content' })
      .locator('input[type="checkbox"]');
    this.consentCheckbox = page
      .locator('label', { hasText: /By posting, you agree/ })
      .locator('input[type="checkbox"]');
    this.postToTikTokButton = page.locator('button', { hasText: 'Post to TikTok' });
    this.cancelButton = this.drawerContainer.locator('button', { hasText: 'Cancel' });
    this.loadingSpinner = page.locator('p', { hasText: 'Loading creator info' });
    this.privacyError = page.locator('p', { hasText: 'You must select a privacy level' });
    this.consentError = page.locator('p', { hasText: 'You must agree before posting' });
  }

  async waitForOpen(): Promise<void> {
    await expect(this.drawerHeading).toBeVisible({ timeout: 10_000 });
    // Wait for creator info to finish loading
    await expect(this.loadingSpinner).not.toBeVisible({ timeout: 10_000 });
  }

  async close(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.drawerHeading).not.toBeVisible({ timeout: 5_000 });
  }

  async fillTitle(title: string): Promise<void> {
    await this.titleTextarea.clear();
    await this.titleTextarea.fill(title);
  }

  async selectPrivacy(level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY'): Promise<void> {
    await this.privacySelect.selectOption(level);
  }

  async giveConsent(): Promise<void> {
    await this.consentCheckbox.check();
  }

  async assertPostButtonDisabled(): Promise<void> {
    await expect(this.postToTikTokButton).toBeDisabled();
  }

  async assertPostButtonEnabled(): Promise<void> {
    await expect(this.postToTikTokButton).not.toBeDisabled();
    await expect(this.postToTikTokButton).not.toHaveCSS('opacity', '0.4');
  }

  /**
   * Fill all required fields so the post button becomes active.
   */
  async fillMinimumRequired(title = 'E2E Test Video Caption'): Promise<void> {
    await this.fillTitle(title);
    await this.selectPrivacy('PUBLIC_TO_EVERYONE');
    await this.giveConsent();
  }

  async toggleCommercialContent(): Promise<void> {
    await this.commercialContentToggle.click();
  }

  async assertCommercialSectionVisible(): Promise<void> {
    await expect(this.yourBrandCheckbox).toBeVisible();
    await expect(this.brandedContentCheckbox).toBeVisible();
  }
}
