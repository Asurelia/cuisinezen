import { defineConfig, devices } from '@playwright/test';

/**
 * CuisineZen Playwright Configuration
 * Optimized for Next.js 15 with App Router
 */
export default defineConfig({
  testDir: '../tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: '../reports/playwright-html' }],
    ['json', { outputFile: '../reports/playwright-results.json' }],
    ['junit', { outputFile: '../reports/playwright-junit.xml' }]
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet
    {
      name: 'Tablet',
      use: { ...devices['iPad Air'] },
    },

    // CuisineZen specific test configurations
    {
      name: 'inventory-flow',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/inventory/**/*.spec.ts',
    },
    {
      name: 'recipe-flow',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/recipes/**/*.spec.ts',
    },
    {
      name: 'analytics-flow',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/analytics/**/*.spec.ts',
    },
    {
      name: 'barcode-scanner',
      use: { 
        ...devices['Pixel 5'],
        permissions: ['camera'],
      },
      testMatch: '**/barcode/**/*.spec.ts',
    },
  ],

  // Development server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Global test settings
  globalSetup: require.resolve('../configs/global-setup.ts'),
  globalTeardown: require.resolve('../configs/global-teardown.ts'),

  // Timeout configurations
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },

  // Output directories
  outputDir: '../reports/test-results',
});