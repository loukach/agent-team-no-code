import { test, expect } from '@playwright/test';

test.describe('AI Newsroom Simulator - End-to-End Tests', () => {

  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/AI Newsroom Simulator/i);

    // Check main heading
    await expect(page.locator('h1')).toContainText('AI Newsroom Simulator');
  });

  test('should navigate to simulation page', async ({ page }) => {
    await page.goto('/');

    // Click start button
    await page.click('text=Start New Simulation');

    // Should be on simulation page
    await expect(page).toHaveURL(/.*simulation/);
    await expect(page.locator('h1')).toContainText('AI Newsroom Simulator');
  });

  test('should show topic input field', async ({ page }) => {
    await page.goto('/simulation');

    // Topic input should be visible
    const input = page.locator('input[type="text"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', /Enter any news topic/i);
  });

  test('should validate empty topic submission', async ({ page }) => {
    await page.goto('/simulation');

    // Try to submit without entering topic
    const submitButton = page.locator('button[type="submit"]');

    // Input should be required
    const input = page.locator('input[type="text"]');
    const isRequired = await input.getAttribute('required');
    expect(isRequired).not.toBeNull();
  });

  test('should submit simulation and show real-time updates', async ({ page }) => {
    // Increase timeout for this test since it involves API calls
    test.setTimeout(120000);

    await page.goto('/simulation');

    // Enter a topic
    await page.fill('input[type="text"]', 'Is AGI around the corner?');

    // Submit the form
    await page.click('button[type="submit"]');

    // Should show agent status bar
    await expect(page.locator('text=Newsrooms are working on')).toBeVisible({ timeout: 5000 });

    // Should show the topic
    await expect(page.locator('text=Is AGI around the corner?')).toBeVisible();

    // Check for AgentStatusBar component
    await expect(page.locator('text=Progressive Tribune')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Traditional Post')).toBeVisible();
    await expect(page.locator('text=Digital Daily')).toBeVisible();

    // Wait for phase indicator
    await expect(page.locator('text=Phase 1: Independent Research')).toBeVisible({ timeout: 15000 });

    // Check for view mode toggle buttons
    await expect(page.locator('button:has-text("Visual Orchestration")')).toBeVisible();
    await expect(page.locator('button:has-text("Message Log")')).toBeVisible();
  });

  test('should toggle between visual and text views', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/simulation');
    await page.fill('input[type="text"]', 'Artificial Intelligence');
    await page.click('button[type="submit"]');

    // Wait for agent status to appear
    await page.waitForSelector('text=Newsrooms are working on', { timeout: 10000 });

    // Should start in visual mode
    await expect(page.locator('button:has-text("Visual Orchestration")')).toHaveClass(/bg-blue-500/);

    // Switch to message log
    await page.click('button:has-text("Message Log")');
    await expect(page.locator('button:has-text("Message Log")')).toHaveClass(/bg-blue-500/);

    // Switch back to visual
    await page.click('button:has-text("Visual Orchestration")');
    await expect(page.locator('button:has-text("Visual Orchestration")')).toHaveClass(/bg-blue-500/);
  });

  test('should show heartbeat animations in AgentStatusBar', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/simulation');
    await page.fill('input[type="text"]', 'Climate change');
    await page.click('button[type="submit"]');

    // Wait for agent status bar
    await page.waitForSelector('text=Progressive Tribune', { timeout: 15000 });

    // Check for pulsing indicators (heartbeat dots)
    const statusBar = page.locator('.bg-white.rounded-lg.shadow-lg').first();
    await expect(statusBar).toBeVisible();

    // Verify progress bars are animating
    const progressBars = page.locator('.bg-gray-200.rounded-full');
    expect(await progressBars.count()).toBeGreaterThan(0);
  });

  test('should display simulation results', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for full simulation

    await page.goto('/simulation');
    await page.fill('input[type="text"]', 'Future of work');
    await page.click('button[type="submit"]');

    // Wait for simulation to complete (may take 1-2 minutes)
    await page.waitForSelector('text=Three Perspectives on', { timeout: 150000 });

    // Should show results
    await expect(page.locator('text=Three Perspectives on')).toBeVisible();

    // Should show cost
    await expect(page.locator('text=/Cost: €/')).toBeVisible();

    // Should show newspaper cards
    await expect(page.locator('text=Progressive Tribune')).toBeVisible();
    await expect(page.locator('text=Traditional Post')).toBeVisible();
    await expect(page.locator('text=Digital Daily')).toBeVisible();

    // Should have "Run Another Simulation" button
    await expect(page.locator('button:has-text("Run Another Simulation")')).toBeVisible();
  });

  test('should handle simulation errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/simulate', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Simulation failed' })
      });
    });

    await page.goto('/simulation');
    await page.fill('input[type="text"]', 'Test topic');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Error')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });

  test('should allow restarting simulation after completion', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto('/simulation');
    await page.fill('input[type="text"]', 'Space exploration');
    await page.click('button[type="submit"]');

    // Wait for completion
    await page.waitForSelector('button:has-text("Run Another Simulation")', { timeout: 150000 });

    // Click restart
    await page.click('button:has-text("Run Another Simulation")');

    // Should show input field again
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="text"]')).toHaveValue('');
  });
});
