import { test, expect } from '@playwright/test';

test.describe('XML Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/xml-generator');
    // Wait for DOM to be ready
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the XML generator page', async ({ page }) => {
    // Page should have loaded - check body has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have input fields', async ({ page }) => {
    // Check for any input fields on the page
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('should have interactive buttons', async ({ page }) => {
    // Check page has buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should be able to interact with inputs', async ({ page }) => {
    // Find first visible input and fill it
    const input = page.locator('input:visible').first();
    if (await input.isVisible()) {
      await input.fill('TEST');
      const value = await input.inputValue();
      expect(value).toBe('TEST');
    }
  });
});

test.describe('Navigation', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Home should redirect or show content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have page structure', async ({ page }) => {
    await page.goto('/tools/xml-generator');
    await page.waitForLoadState('domcontentloaded');

    // Page should have some interactive elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });
});
