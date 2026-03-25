/**
 * GatePage — Page Object Model for /gate
 *
 * Encapsulates all selectors and actions on the password-gate page.
 * The gate renders inline styles and no data-testid attributes, so we
 * target elements by type/placeholder/text — the most stable option
 * available without modifying production code.
 */
import { Page, Locator, expect } from '@playwright/test';

export class GatePage {
  readonly page: Page;

  // Locators derived from the rendered markup in gate/page.tsx
  readonly heading: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly privateAccessLabel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1', { hasText: 'Apollova' });
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('div', { hasText: 'Incorrect password' });
    this.privateAccessLabel = page.locator('p', { hasText: 'Private Access' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/gate');
    await expect(this.heading).toBeVisible();
  }

  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(password: string): Promise<void> {
    await this.enterPassword(password);
    await this.submit();
  }

  async assertError(): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
  }

  async assertSubmitDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  async assertSubmitEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }

  async assertLoadingState(): Promise<void> {
    // During the fetch, button text changes to "Checking..."
    await expect(this.submitButton).toContainText('Checking');
  }
}
