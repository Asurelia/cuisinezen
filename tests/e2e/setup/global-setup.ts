import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E setup...');
  
  // Get base URL from config
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the app to be ready
    console.log('⏳ Waiting for application to be ready...');
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    
    // Check if app is responding
    await page.waitForSelector('body', { timeout: 30000 });
    console.log('✅ Application is ready');

    // Setup test environment variables
    console.log('🔧 Setting up test environment...');
    
    // You can add more setup logic here:
    // - Initialize test database
    // - Create test users
    // - Setup Firebase emulators
    // - Seed test data
    
    // Store any global state that tests might need
    process.env.E2E_SETUP_COMPLETE = 'true';
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;