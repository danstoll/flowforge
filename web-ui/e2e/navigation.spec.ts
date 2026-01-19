import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');

    // Navigate to Services
    await page.getByRole('link', { name: 'Services' }).click();
    await expect(page).toHaveURL('/services');
    await expect(page.getByRole('heading', { name: /Service/i })).toBeVisible();

    // Navigate to Playground
    await page.getByRole('link', { name: 'API Playground' }).click();
    await expect(page).toHaveURL('/playground');
    await expect(page.getByRole('heading', { name: 'API Playground' })).toBeVisible();

    // Navigate to API Keys
    await page.getByRole('link', { name: 'API Keys' }).click();
    await expect(page).toHaveURL('/api-keys');
    await expect(page.getByRole('heading', { name: /API Key/i })).toBeVisible();

    // Navigate to Documentation
    await page.getByRole('link', { name: 'Documentation' }).click();
    await expect(page).toHaveURL('/docs');
    await expect(page.getByRole('heading', { name: 'Documentation' })).toBeVisible();

    // Navigate back to Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/');
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');

    // Find and click the theme toggle button
    const themeToggle = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    
    // Check initial state (should be light or dark based on system preference)
    const html = page.locator('html');
    const initialDark = await html.evaluate((el) => el.classList.contains('dark'));

    // Toggle theme
    await themeToggle.click();

    // Wait for the class to change
    await expect(html).toHaveClass(initialDark ? '' : /dark/);
  });

  test('should show 404 page for unknown routes', async ({ page }) => {
    await page.goto('/unknown-page');
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Page not found')).toBeVisible();
  });

  test('should have working home link in logo', async ({ page }) => {
    await page.goto('/services');
    await page.getByRole('link', { name: /FlowForge/i }).first().click();
    await expect(page).toHaveURL('/');
  });
});
