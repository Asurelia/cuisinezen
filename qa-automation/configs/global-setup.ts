import { FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * Configures Firebase emulators and test environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up test environment...');

  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

  // Additional setup can be added here:
  // - Start Firebase emulators if not already running
  // - Seed test data
  // - Configure authentication tokens
  // - Set up mock services

  console.log('✅ Test environment ready');
}

export default globalSetup;