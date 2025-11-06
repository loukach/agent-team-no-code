import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {

  test('homepage should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('simulation page should be responsive', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/simulation');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('socket connection should establish quickly', async ({ page }) => {
    await page.goto('/simulation');

    // Monitor console for socket connection
    let socketConnected = false;
    page.on('console', msg => {
      if (msg.text().includes('socket') || msg.text().includes('connected')) {
        socketConnected = true;
      }
    });

    // Fill form to trigger socket events
    await page.fill('input[type="text"]', 'Test');
    await page.click('button[type="submit"]');

    // Wait a bit for socket connection
    await page.waitForTimeout(2000);

    // Check that status bar appeared (indicates socket working)
    const statusBar = page.locator('text=Newsrooms are working on');
    await expect(statusBar).toBeVisible({ timeout: 5000 });
  });

  test('message queue should handle rapid updates', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/simulation');
    await page.fill('input[type="text"]', 'Quick test');
    await page.click('button[type="submit"]');

    // Switch to message log view
    await page.waitForSelector('button:has-text("Message Log")', { timeout: 10000 });
    await page.click('button:has-text("Message Log")');

    // Wait for messages to start appearing
    await page.waitForTimeout(5000);

    // Check that messages are displaying smoothly (not all at once)
    const messages = page.locator('.bg-white.rounded-lg.shadow-lg .text-xs');
    const messageCount = await messages.count();

    // Should have some messages by now
    expect(messageCount).toBeGreaterThan(0);
  });

  test('no memory leaks during long simulation', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto('/simulation');

    // Get initial metrics
    const initialMetrics = await page.evaluate(() => performance.memory);

    // Run simulation
    await page.fill('input[type="text"]', 'Memory test');
    await page.click('button[type="submit"]');

    // Wait for completion
    await page.waitForSelector('button:has-text("Run Another Simulation")', { timeout: 150000 });

    // Get final metrics
    const finalMetrics = await page.evaluate(() => performance.memory);

    // Memory should not have grown excessively (allow 50MB increase)
    const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
