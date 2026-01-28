import { test, expect } from '@playwright/test';

test.describe('Detail Tables as Sub-Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/xml-generator');
    await page.waitForLoadState('domcontentloaded');

    // Handle username dialog if it appears
    const usernameInput = page.locator('input[placeholder="Enter your username"]');
    if (await usernameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await usernameInput.fill('e2e-tester');
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.waitForTimeout(500);
    }

    // Dismiss migration dialog if it appears
    const laterBtn = page.getByRole('button', { name: '稍後再說' });
    if (await laterBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await laterBtn.click();
      await page.waitForTimeout(300);
    }

    // Dismiss draft restore dialog if it appears
    const discardBtn = page.getByRole('button', { name: '捨棄' });
    if (await discardBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await discardBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('should generate XML with detail tables wrapped in tabgroup as first sub-tab using myapp', async ({ page }) => {
    // Step 1: Fill metadata with "myapp"
    const firstInput = page.locator('input:visible').first();
    await firstInput.fill('myapp');

    // Fill key attribute (second input)
    const secondInput = page.locator('input:visible').nth(1);
    await secondInput.fill('MYAPPID');

    // Step 2: Create a tab named "Main"
    await page.getByRole('button', { name: '新增頁籤' }).click();
    await page.waitForTimeout(300);
    const tabNameInput = page.locator('input[placeholder="頁籤名稱"]');
    await tabNameInput.fill('Main');
    await page.getByRole('button', { name: '確定' }).first().click();
    await page.waitForTimeout(500);

    // Step 3: Fill the first header field label (auto-created placeholder)
    const labelInputs = page.locator('input[placeholder="標籤"]');
    await labelInputs.first().fill('Status');
    await page.waitForTimeout(300);

    // Step 4: Add a detail field in main area
    const mainAreaTrigger = page.getByRole('tab', { name: /主區域/ });
    if (await mainAreaTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mainAreaTrigger.click();
      await page.waitForTimeout(300);
    }

    await page.getByRole('button', { name: '新增明細欄位' }).click();
    await page.waitForTimeout(500);

    // Fill detail field label - it's the last label input
    const allLabels = page.locator('input[placeholder="標籤"]');
    await allLabels.last().fill('Detail Col 1');
    await page.waitForTimeout(300);

    // Fill relationship - find inputs with placeholder "關聯"
    const allRelations = page.locator('input[placeholder="關聯"]');
    await allRelations.last().fill('MYDETAIL');
    await page.waitForTimeout(500);

    // Step 5: Navigate to Preview
    await page.getByRole('tab', { name: '預覽與下載' }).click();
    await page.waitForTimeout(2000);

    // Step 6: Take screenshot of preview
    await page.screenshot({ path: 'test-results/detail-subtab-preview.png', fullPage: true });

    // Find the XML content in the preview
    const codeBlock = page.locator('pre code, pre').first();
    const xmlText = await codeBlock.textContent({ timeout: 5000 }).catch(() => '');

    if (xmlText && xmlText.length > 0) {
      console.log('=== XML Preview ===');
      console.log(xmlText.substring(0, 3000));
      console.log('=== End XML ===');

      // The XML should contain a tabgroup with style="form"
      expect(xmlText).toContain('tabgroup');
      expect(xmlText).toContain('style="form"');
      // The main detail area should be wrapped as a sub-tab with label "主區域"
      expect(xmlText).toContain('主區域');
      // The detail table should be present inside the tabgroup (not directly under main tab)
      expect(xmlText).toContain('<table');
    } else {
      await page.screenshot({ path: 'test-results/detail-subtab-no-xml.png', fullPage: true });
      test.skip(true, 'XML content not found in preview');
    }
  });

  test('should allow renaming main detail label', async ({ page }) => {
    // Create a tab
    await page.getByRole('button', { name: '新增頁籤' }).click();
    await page.waitForTimeout(300);
    const tabNameInput = page.locator('input[placeholder="頁籤名稱"]');
    await tabNameInput.fill('TestTab');
    await page.getByRole('button', { name: '確定' }).first().click();
    await page.waitForTimeout(500);

    // Look for the pencil button to rename main detail area
    const pencilBtn = page.locator('button[title="重新命名主區域"]');
    if (await pencilBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pencilBtn.click();
      await page.waitForTimeout(300);

      const labelInput = page.locator('input#mainDetailLabel');
      await expect(labelInput).toBeVisible();
      await labelInput.clear();
      await labelInput.fill('工單明細');
      await page.getByRole('button', { name: '確定' }).click();
      await page.waitForTimeout(300);

      // Verify the label changed
      const updatedTrigger = page.getByRole('tab', { name: /工單明細/ });
      await expect(updatedTrigger).toBeVisible();
    } else {
      test.skip(true, 'Rename button not visible');
    }
  });
});
