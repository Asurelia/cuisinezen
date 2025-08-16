import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global E2E teardown...');
  
  try {
    // Cleanup any global resources
    console.log('🔧 Cleaning up test environment...');
    
    // You can add cleanup logic here:
    // - Stop Firebase emulators
    // - Clean test database
    // - Remove test files
    // - Reset test state
    
    // Clear environment variables
    delete process.env.E2E_SETUP_COMPLETE;
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here to avoid masking test failures
  }
}

export default globalTeardown;