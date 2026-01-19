import { test, expect } from '@playwright/test';

test.describe('API Playground', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/playground');
  });

  test('should display the playground page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'API Playground' })).toBeVisible();
  });

  test('should have service selector', async ({ page }) => {
    await expect(page.getByText('Service')).toBeVisible();
    await expect(page.getByRole('combobox').first()).toBeVisible();
  });

  test('should select a service and show endpoints', async ({ page }) => {
    // Open service selector
    await page.getByRole('combobox').first().click();
    
    // Select crypto service
    await page.getByRole('option', { name: /Crypto/i }).click();
    
    // Should show endpoint selector
    await expect(page.getByRole('combobox').nth(1)).toBeVisible();
  });

  test('should navigate to playground with service pre-selected via URL', async ({ page }) => {
    await page.goto('/playground?service=crypto');
    
    // Service should be pre-selected
    await expect(page.getByText(/Crypto/i).first()).toBeVisible();
  });

  test('should show code generation tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /cURL/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /JavaScript/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Python/i })).toBeVisible();
  });

  test('should add headers', async ({ page }) => {
    // Find and click add header button
    const addHeaderButton = page.getByRole('button', { name: /Add Header/i });
    await addHeaderButton.click();
    
    // Should show new header input fields
    const headerInputs = page.locator('input[placeholder="Header name"]');
    await expect(headerInputs).toBeVisible();
  });

  test('should edit request body', async ({ page }) => {
    // Select a service first
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /Crypto/i }).click();

    // Find the request body textarea
    const bodyTextarea = page.locator('textarea').first();
    await bodyTextarea.fill('{"test": "value"}');
    
    await expect(bodyTextarea).toHaveValue('{"test": "value"}');
  });

  test('should switch between code generation tabs', async ({ page }) => {
    // Click JavaScript tab
    await page.getByRole('tab', { name: /JavaScript/i }).click();
    await expect(page.getByRole('tabpanel')).toContainText(/fetch|axios/i);

    // Click Python tab
    await page.getByRole('tab', { name: /Python/i }).click();
    await expect(page.getByRole('tabpanel')).toContainText(/requests|import/i);

    // Click cURL tab
    await page.getByRole('tab', { name: /cURL/i }).click();
    await expect(page.getByRole('tabpanel')).toContainText(/curl/i);
  });
});
