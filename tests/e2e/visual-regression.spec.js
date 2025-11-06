import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {

  test('homepage should match snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('simulation page should match snapshot', async ({ page }) => {
    await page.goto('/simulation');
    await expect(page).toHaveScreenshot('simulation-page.png');
  });

  test('agent status bar should render correctly', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/simulation');
    await page.fill('input[type="text"]', 'Test topic');
    await page.click('button[type="submit"]');

    // Wait for status bar to appear
    await page.waitForSelector('text=Progressive Tribune', { timeout: 15000 });

    // Take screenshot of status bar
    const statusBar = page.locator('.bg-white.rounded-lg.shadow-lg').first();
    await expect(statusBar).toHaveScreenshot('agent-status-bar.png');
  });

  test('visual orchestration view should render', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/simulation');
    await page.fill('input[type="text"]', 'Test topic');
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=Newsrooms are working on', { timeout: 10000 });

    // Ensure visual mode is selected
    await page.click('button:has-text("Visual Orchestration")');

    // Wait a bit for animations
    await page.waitForTimeout(2000);

    // Take screenshot
    await expect(page).toHaveScreenshot('visual-orchestration.png', {
      fullPage: false,
      clip: { x: 0, y: 200, width: 1200, height: 600 }
    });
  });
});
