/**
 * LicensesPage — Page Object Model for /licenses
 */
import { Page, Locator, expect } from '@playwright/test';
import type { LicenseFormData } from '../fixtures/test-data';

export class LicensesPage {
  readonly page: Page;

  readonly heading: Locator;
  readonly generateButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly licenseTableBody: Locator;
  readonly emptyState: Locator;
  readonly totalStat: Locator;
  readonly activeStat: Locator;
  readonly unusedStat: Locator;
  readonly revokedStat: Locator;

  // Create Modal
  readonly createModal: Locator;
  readonly customerNameInput: Locator;
  readonly customerEmailInput: Locator;
  readonly pricePaidInput: Locator;
  readonly notesTextarea: Locator;
  readonly generateLicenseSubmitBtn: Locator;
  readonly cancelCreateBtn: Locator;

  // Details Modal
  readonly detailsModal: Locator;
  readonly revokeLicenseBtn: Locator;
  readonly deleteLicenseBtn: Locator;
  readonly closeDetailsBtn: Locator;
  readonly copyToClipboardBtn: Locator;
  readonly resetHardwareBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1', { hasText: 'License Manager' });
    this.generateButton = page.locator('button', { hasText: '+ Generate New License' });
    this.searchInput = page.locator('input[placeholder*="Search by key"]');
    this.statusFilter = page.locator('select');
    this.licenseTableBody = page.locator('div[style*="gridTemplateColumns"] > div').nth(1);
    this.emptyState = page.locator('div', { hasText: "No licenses yet" });
    this.totalStat = page.locator('div', { hasText: 'Total Licenses' });
    this.activeStat = page.locator('div', { hasText: 'Active' }).first();
    this.unusedStat = page.locator('div', { hasText: 'Unused' });
    this.revokedStat = page.locator('div', { hasText: 'Revoked' });

    // Modal
    this.createModal = page.locator('div', { hasText: 'Generate New License' }).last();
    this.customerNameInput = page.locator('input[placeholder="John Doe"]');
    this.customerEmailInput = page.locator('input[placeholder="john@example.com"]');
    this.pricePaidInput = page.locator('input[type="number"]');
    this.notesTextarea = page.locator('textarea[placeholder*="notes"]');
    this.generateLicenseSubmitBtn = page.locator('button[type="submit"]', {
      hasText: 'Generate License',
    });
    this.cancelCreateBtn = page.locator('button[type="button"]', { hasText: 'Cancel' });

    // Details Modal
    this.detailsModal = page.locator('div', { hasText: 'License Details' }).last();
    this.revokeLicenseBtn = page.locator('button', { hasText: 'Revoke License' });
    this.deleteLicenseBtn = page.locator('button', { hasText: 'Delete Permanently' });
    this.closeDetailsBtn = page.locator('button', { hasText: 'Close' });
    this.copyToClipboardBtn = page.locator('button', { hasText: 'Copy to Clipboard' });
    this.resetHardwareBtn = page.locator('button', { hasText: 'Reset Hardware' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/licenses');
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async waitForLoaded(): Promise<void> {
    await expect(
      this.page.locator('p', { hasText: 'Loading licenses' })
    ).not.toBeVisible({ timeout: 10_000 });
  }

  async openCreateModal(): Promise<void> {
    await this.generateButton.click();
    await expect(this.customerNameInput).toBeVisible();
  }

  async fillCreateForm(data: LicenseFormData): Promise<void> {
    await this.customerNameInput.fill(data.customerName);
    await this.customerEmailInput.fill(data.customerEmail);
    await this.pricePaidInput.fill(data.pricePaid);
    if (data.notes) {
      await this.notesTextarea.fill(data.notes);
    }
  }

  async submitCreateForm(): Promise<void> {
    // Handle the alert dialog that appears on success
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.generateLicenseSubmitBtn.click();
  }

  async searchFor(term: string): Promise<void> {
    await this.searchInput.fill(term);
  }

  async filterByStatus(status: 'all' | 'active' | 'unused' | 'revoked'): Promise<void> {
    await this.statusFilter.selectOption(status);
  }

  async clickViewForRow(index = 0): Promise<void> {
    const viewButtons = this.page.locator('button', { hasText: 'View' });
    await viewButtons.nth(index).click();
    await expect(this.detailsModal).toBeVisible();
  }

  async revokeCurrentLicense(): Promise<void> {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.revokeLicenseBtn.click();
  }

  async deleteCurrentLicense(): Promise<void> {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.deleteLicenseBtn.click();
  }

  async closeDetailsModal(): Promise<void> {
    await this.closeDetailsBtn.click();
  }

  async assertLicenseRowCount(count: number): Promise<void> {
    const rows = this.page.locator('button', { hasText: 'View' });
    await expect(rows).toHaveCount(count);
  }

  licenseKeyInTable(licenseKey: string): Locator {
    return this.page.locator('div', { hasText: licenseKey }).first();
  }
}
