import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', testMatch: '**/*.spec.ts',
  fullyParallel: false, workers: 1, timeout: 180_000,
  expect: { timeout: 20_000 }, retries: 0, maxFailures: process.env.CI ? 3 : undefined,
  reporter: 'list', outputDir: 'test-results',
  use: { baseURL: 'http://127.0.0.1:3000', headless: true,
    actionTimeout: 15_000, navigationTimeout: 30_000,
    contextOptions: { reducedMotion: 'reduce' }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
