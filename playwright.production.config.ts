import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', testMatch: 'garden*.spec.ts', workers: 1, timeout: 90_000,
  expect: { timeout: 20_000 }, retries: 0, reporter: 'list', outputDir: 'test-results-production',
  use: { baseURL: 'http://127.0.0.1:4173', headless: true,
    contextOptions: { reducedMotion: 'reduce' }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'production-chromium', use: { browserName: 'chromium' } }],
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 60_000 },
});
