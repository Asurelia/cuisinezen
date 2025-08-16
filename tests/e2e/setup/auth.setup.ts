import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate user', async ({ page }) => {
  console.log('🔐 Setting up authentication...');
  
  // Go to login page
  await page.goto('/login');
  
  // Check if we're already logged in
  const isLoggedIn = await page.locator('[data-testid="user-menu"]').isVisible();
  
  if (isLoggedIn) {
    console.log('✅ User already logged in');
    await page.context().storageState({ path: authFile });
    return;
  }
  
  // Fill login form
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'testpassword123');
  
  // Submit login
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful login (redirect to dashboard)
  await page.waitForURL('/dashboard', { timeout: 10000 });
  
  // Verify we're logged in
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  
  console.log('✅ Authentication successful');
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});