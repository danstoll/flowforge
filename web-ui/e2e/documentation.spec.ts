import { test, expect } from '@playwright/test';

test.describe('Documentation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs');
  });

  test('should display documentation page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Documentation' })).toBeVisible();
  });

  test('should have all documentation tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Getting Started/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /API Reference/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Examples/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Changelog/i })).toBeVisible();
  });

  test('should show getting started guide by default', async ({ page }) => {
    await expect(page.getByText('Quick Start Guide')).toBeVisible();
    await expect(page.getByText('Install dependencies')).toBeVisible();
  });

  test('should switch to API reference tab', async ({ page }) => {
    await page.getByRole('tab', { name: /API Reference/i }).click();
    await expect(page.getByText('Services')).toBeVisible();
  });

  test('should show service list in API reference', async ({ page }) => {
    await page.getByRole('tab', { name: /API Reference/i }).click();
    
    await expect(page.getByRole('button', { name: /Crypto/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Math/i })).toBeVisible();
  });

  test('should select a service and show endpoints', async ({ page }) => {
    await page.getByRole('tab', { name: /API Reference/i }).click();
    
    // Click on crypto service
    await page.getByRole('button', { name: /Crypto/i }).click();
    
    // Should show service details
    await expect(page.getByText(/Crypto Service/i)).toBeVisible();
  });

  test('should show examples tab with integration examples', async ({ page }) => {
    await page.getByRole('tab', { name: /Examples/i }).click();
    
    await expect(page.getByText('React / Next.js')).toBeVisible();
    await expect(page.getByText('Node.js / Express')).toBeVisible();
    await expect(page.getByText('Python')).toBeVisible();
    await expect(page.getByText('cURL')).toBeVisible();
  });

  test('should show changelog', async ({ page }) => {
    await page.getByRole('tab', { name: /Changelog/i }).click();
    
    await expect(page.getByText(/v1\.0\.0/)).toBeVisible();
    await expect(page.getByText('Initial release')).toBeVisible();
  });
});
