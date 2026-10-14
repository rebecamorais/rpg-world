import { defineConfig, devices } from '@playwright/test';

import { BASE_URL, E2E_PORT, appEnv } from './e2e/support/env';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/support/global-setup.ts',
  // Every test signs in its own user, so tests don't share data and can run in parallel
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Production build: the same bundle, CSP and proxy that run in production
    command: `npm run build && npm run start -- -p ${E2E_PORT}`,
    url: BASE_URL,
    env: appEnv(),
    timeout: 300_000,
    reuseExistingServer: !isCI,
  },
});
