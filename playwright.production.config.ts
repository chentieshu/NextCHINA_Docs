import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', testMatch: ['workspace*.spec.ts', 'reader-scroll.spec.ts'], workers: 1, timeout: 90_000,
  expect: { timeout: 20_000 }, retries: 0, maxFailures: process.env.CI ? 3 : undefined,
  reporter: 'list', outputDir: 'test-results-production',
  use: { baseURL: 'http://127.0.0.1:4173', headless: true,
    actionTimeout: 15_000, navigationTimeout: 30_000,
    contextOptions: { reducedMotion: 'reduce' }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'production-chromium', use: { browserName: 'chromium' } }],
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 60_000 },
});
