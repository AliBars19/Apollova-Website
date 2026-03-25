/**
 * TemplatePage — Page Object Model for /templates/apollova-{aurora|mono|onyx}
 */
import { Page, Locator, expect } from '@playwright/test';

type TemplateName = 'aurora' | 'mono' | 'onyx';

const templateTitles: Record<TemplateName, string> = {
  aurora: 'Apollova Aurora',
  mono: 'Apollova Mono',
  onyx: 'Apollova Onyx',
};

const templatePaths: Record<TemplateName, string> = {
  aurora: '/templates/apollova-aurora',
  mono: '/templates/apollova-mono',
  onyx: '/templates/apollova-onyx',
};

export class TemplatePage {
  readonly page: Page;
  readonly name: TemplateName;

  readonly heading: Locator;
  readonly heroVideo: Locator;
  readonly featureCards: Locator;
  readonly enquirySection: Locator;
  readonly contactEmailLink: Locator;

  constructor(page: Page, name: TemplateName) {
    this.page = page;
    this.name = name;
    this.heading = page.locator('h1', { hasText: templateTitles[name] });
    this.heroVideo = page.locator('video').first();
    this.featureCards = page.locator('div[style*="aspectRatio"]');
    this.enquirySection = page.locator('h2', {
      hasText: new RegExp(`Interested in.*${templateTitles[name]}`, 'i'),
    });
    this.contactEmailLink = page.locator('a[href*="contact@apollova"]');
  }

  async goto(): Promise<void> {
    await this.page.goto(templatePaths[this.name]);
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async assertStructure(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.enquirySection).toBeVisible();
    await expect(this.contactEmailLink.first()).toBeVisible();
  }
}
