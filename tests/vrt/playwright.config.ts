import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  snapshotDir: './snapshots',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}-{projectName}{ext}',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: '../../playwright-report' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:6007',
    trace: 'on-first-retry',
  },

  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled',
    },
  },

  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 667 },
      },
    },
  ],

  webServer: {
    command: 'npx http-server storybook-static -p 6007 -s',
    url: 'http://localhost:6007',
    reuseExistingServer: !process.env.CI,
    cwd: '../..',
    timeout: 120000,
  },
});
