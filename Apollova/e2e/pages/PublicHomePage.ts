/**
 * PublicHomePage — Page Object Model for / (the public homepage)
 */
import { Page, Locator, expect } from '@playwright/test';

export class PublicHomePage {
  readonly page: Page;

  readonly heroVideo: Locator;
  readonly sectionHeading: Locator;
  readonly templateCards: Locator;
  readonly auroraCard: Locator;
  readonly monoCard: Locator;
  readonly onyxCard: Locator;
  readonly contactEmail: Locator;
  readonly scrollIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroVideo = page.locator('video').first();
    this.sectionHeading = page.locator('h2', { hasText: 'Pioneers of Lyric Content' });
    this.templateCards = page.locator('article');
    this.auroraCard = page.locator('article', { hasText: 'Apollova Aurora' });
    this.monoCard = page.locator('article', { hasText: 'Apollova Mono' });
    this.onyxCard = page.locator('article', { hasText: 'Apollova Onyx' });
    this.contactEmail = page.locator('a[href*="contact@apollova"]');
    this.scrollIndicator = page.locator('span', { hasText: 'Scroll' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    // Verify at least the section heading rendered (hero video may not autoplay in headless)
    await expect(this.sectionHeading).toBeVisible({ timeout: 15_000 });
  }

  async clickAuroraCard(): Promise<void> {
    await this.auroraCard.click();
    await expect(this.page).toHaveURL(/apollova-aurora/);
  }

  async clickMonoCard(): Promise<void> {
    await this.monoCard.click();
    await expect(this.page).toHaveURL(/apollova-mono/);
  }

  async clickOnyxCard(): Promise<void> {
    await this.onyxCard.click();
    await expect(this.page).toHaveURL(/apollova-onyx/);
  }

  async assertAllTemplateCardsVisible(): Promise<void> {
    await expect(this.auroraCard).toBeVisible();
    await expect(this.monoCard).toBeVisible();
    await expect(this.onyxCard).toBeVisible();
  }

  async assertContactEmailVisible(): Promise<void> {
    await expect(this.contactEmail.first()).toBeVisible();
  }
}
