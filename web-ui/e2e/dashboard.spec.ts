import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the dashboard title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('should display service health cards', async ({ page }) => {
    await expect(page.getByText('Crypto Service')).toBeVisible();
    await expect(page.getByText('Math Service')).toBeVisible();
    await expect(page.getByText('PDF Service')).toBeVisible();
    await expect(page.getByText('LLM Service')).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    await expect(page.getByText('Total Services')).toBeVisible();
    await expect(page.getByText('API Gateway')).toBeVisible();
    await expect(page.getByText('Requests Today')).toBeVisible();
    await expect(page.getByText('Avg Response')).toBeVisible();
  });

  test('should display quick actions', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Hash Text/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Calculate/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate PDF/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /AI Chat/i })).toBeVisible();
  });

  test('should navigate to playground from quick action', async ({ page }) => {
    await page.getByRole('link', { name: /Hash Text/i }).click();
    await expect(page).toHaveURL(/.*playground.*crypto/);
  });

  test('should show recent API calls section', async ({ page }) => {
    await expect(page.getByText('Recent API Calls')).toBeVisible();
  });
});
