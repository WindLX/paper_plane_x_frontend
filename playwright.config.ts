import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.browser.ts',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5178',
    viewport: { width: 1920, height: 1080 },
    launchOptions: { executablePath: process.env.PPX_TEST_CHROMIUM },
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 5178 --strictPort',
    url: 'http://127.0.0.1:5178',
    reuseExistingServer: false,
  },
})
