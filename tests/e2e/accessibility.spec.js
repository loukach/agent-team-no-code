import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {

  test('homepage should have no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('simulation page should have no accessibility violations', async ({ page }) => {
    await page.goto('/simulation');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/simulation');

    // Tab through elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="text"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/simulation');

    // Check input has label or aria-label
    const input = page.locator('input[type="text"]');
    const hasLabel = await input.evaluate(el => {
      const id = el.getAttribute('id');
      const ariaLabel = el.getAttribute('aria-label');
      const hasLabelElement = document.querySelector(`label[for="${id}"]`);
      return !!ariaLabel || !!hasLabelElement;
    });

    expect(hasLabel).toBe(true);
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/simulation');

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.evaluate(el => {
        return el.textContent || el.getAttribute('aria-label');
      });

      expect(accessibleName).toBeTruthy();
    }
  });
});
