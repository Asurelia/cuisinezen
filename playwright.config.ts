import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright minimale pour CuisineZen
 * Focus sur Chrome uniquement pour simplicité
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Configuration simple */
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  
  /* Reporter simple */
  reporter: [['html'], ['list']],
  
  /* Configuration de base */
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  /* Timeout global */
  timeout: 30000,

  /* Un seul projet : Chrome */
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Serveur de développement */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },

  /* Expectations simples */
  expect: {
    timeout: 5000,
  },

  /* Dossier de sortie */
  outputDir: 'test-results/',
});