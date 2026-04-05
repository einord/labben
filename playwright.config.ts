import { defineConfig, devices } from '@playwright/test'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const baseURL = process.env.BASE_URL || 'http://localhost:3005'
const isExternalServer = !!process.env.BASE_URL
const testDataDir = join(__dirname, 'e2e', '.data')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  globalSetup: './e2e/global-setup.ts',

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],

  // Only start dev server when not testing against an external server (e.g. Docker)
  ...(!isExternalServer && {
    webServer: {
      command: `DATA_DIR=${testDataDir} pnpm dev`,
      url: 'http://localhost:3005',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  }),
})
