# Testing Guide - AI Newsroom Simulator

This guide covers all testing strategies for the AI Newsroom Simulator using Playwright.

## Table of Contents
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Test Suites](#test-suites)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

---

## Installation

### 1. Install Playwright and dependencies

```bash
npm install
```

### 2. Install Playwright browsers

```bash
npx playwright install
```

### 3. Install system dependencies (Linux only)

```bash
npx playwright install-deps
```

---

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests with UI mode (interactive)

```bash
npm run test:ui
```

### Run tests in headed mode (see browser)

```bash
npm run test:headed
```

### Debug tests

```bash
npm run test:debug
```

### View test report

```bash
npm run test:report
```

### Generate test code (Codegen)

```bash
npm run test:codegen
```

This opens a browser where you can interact with your app, and Playwright will generate test code for you!

---

## Test Suites

### 1. **End-to-End Tests** (`tests/e2e/simulation.spec.js`)

Tests the complete user flow:
- ✅ Homepage loads successfully
- ✅ Navigation to simulation page
- ✅ Topic input validation
- ✅ Simulation submission and real-time updates
- ✅ View mode toggling (Visual vs Text)
- ✅ Heartbeat animations in AgentStatusBar
- ✅ Simulation results display
- ✅ Error handling
- ✅ Simulation restart

**Run specific test:**
```bash
npx playwright test simulation.spec.js
```

### 2. **Visual Regression Tests** (`tests/e2e/visual-regression.spec.js`)

Ensures UI remains consistent:
- 📸 Homepage snapshot
- 📸 Simulation page snapshot
- 📸 Agent status bar rendering
- 📸 Visual orchestration view

**Run visual tests:**
```bash
npx playwright test visual-regression.spec.js
```

**Update snapshots:**
```bash
npx playwright test visual-regression.spec.js --update-snapshots
```

### 3. **Performance Tests** (`tests/e2e/performance.spec.js`)

Validates performance metrics:
- ⚡ Page load times (<3 seconds)
- ⚡ Socket connection speed
- ⚡ Message queue handling
- ⚡ Memory leak detection

**Run performance tests:**
```bash
npx playwright test performance.spec.js
```

### 4. **Accessibility Tests** (`tests/e2e/accessibility.spec.js`)

Ensures WCAG compliance:
- ♿ No accessibility violations
- ♿ Keyboard navigation
- ♿ Proper ARIA labels
- ♿ Button accessible names

**Run accessibility tests:**
```bash
npx playwright test accessibility.spec.js
```

---

## Test Configuration

### Browser Support

Tests run on multiple browsers:
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile Chrome
- ✅ Mobile Safari

### Automatic Server Startup

Playwright automatically starts:
1. Backend server (port 3000)
2. Frontend dev server (port 5174)

No need to manually start servers before running tests!

---

## Best Practices

### 1. **Use Data Test IDs**

Add `data-testid` attributes to elements for stable selectors:

```jsx
<button data-testid="submit-button">Submit</button>
```

```js
await page.click('[data-testid="submit-button"]');
```

### 2. **Wait for Network Idle**

For pages with dynamic content:

```js
await page.goto('/simulation');
await page.waitForLoadState('networkidle');
```

### 3. **Handle Timeouts**

For long-running operations:

```js
test('long simulation', async ({ page }) => {
  test.setTimeout(180000); // 3 minutes
  // ... test code
});
```

### 4. **Mock API Calls**

For testing error scenarios:

```js
await page.route('**/api/simulate', route => {
  route.fulfill({
    status: 500,
    body: JSON.stringify({ error: 'Server error' })
  });
});
```

### 5. **Parallel Execution**

Run tests in parallel for speed:

```bash
npx playwright test --workers=4
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 18
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npm test
      env:
        ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

### Environment Variables

For CI environments, set:
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `CI=true` - Enables CI-specific configurations

---

## Test Organization

```
tests/
└── e2e/
    ├── simulation.spec.js      # Core functionality tests
    ├── visual-regression.spec.js  # Visual snapshot tests
    ├── performance.spec.js     # Performance benchmarks
    └── accessibility.spec.js   # A11y compliance tests
```

---

## Common Test Patterns

### Wait for socket connection

```js
await page.goto('/simulation');
await page.fill('input[type="text"]', 'Test topic');
await page.click('button[type="submit"]');

// Wait for real-time updates to start
await page.waitForSelector('text=Newsrooms are working on', { timeout: 10000 });
```

### Check agent status updates

```js
// Verify agents are showing activity
await expect(page.locator('text=Progressive Tribune')).toBeVisible();
await expect(page.locator('text=Traditional Post')).toBeVisible();
await expect(page.locator('text=Digital Daily')).toBeVisible();
```

### Verify message queue is working

```js
await page.click('button:has-text("Message Log")');
await page.waitForTimeout(3000);

const messages = page.locator('.message-item'); // Adjust selector
const count = await messages.count();
expect(count).toBeGreaterThan(0);
```

---

## Troubleshooting

### Tests timing out

Increase timeout in `playwright.config.js`:

```js
use: {
  actionTimeout: 30000, // 30 seconds
  navigationTimeout: 30000,
}
```

### CORS errors in tests

Ensure server CORS config allows test origin:

```js
cors: {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175']
}
```

### Visual snapshots failing

Update snapshots if UI intentionally changed:

```bash
npx playwright test --update-snapshots
```

---

## Useful Commands

```bash
# Run specific test file
npx playwright test simulation.spec.js

# Run tests matching pattern
npx playwright test --grep "should submit"

# Run tests on specific browser
npx playwright test --project=chromium

# Show test trace
npx playwright show-trace trace.zip

# Generate HTML report
npx playwright test --reporter=html
```

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI Guide](https://playwright.dev/docs/ci)

---

## Support

For issues or questions:
- Check existing test examples in `tests/e2e/`
- Use `test:debug` mode to step through tests
- Use `test:codegen` to generate test code interactively
