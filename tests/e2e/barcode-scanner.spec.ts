import { test, expect } from '@playwright/test';

test.describe('Barcode Scanner Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('should open barcode scanner dialog', async ({ page }) => {
    console.log('🧪 Testing barcode scanner dialog opening...');
    
    // Click barcode scan button
    await page.click('[data-testid="scan-barcode-button"]');
    
    // Wait for scanner dialog to open
    await expect(page.locator('[data-testid="barcode-scanner-dialog"]')).toBeVisible();
    
    // Verify dialog components
    await expect(page.locator('[data-testid="scanner-viewport"]')).toBeVisible();
    await expect(page.locator('[data-testid="manual-barcode-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="close-scanner-button"]')).toBeVisible();
  });

  test('should handle manual barcode entry', async ({ page }) => {
    console.log('🧪 Testing manual barcode entry...');
    
    // Open scanner
    await page.click('[data-testid="scan-barcode-button"]');
    await expect(page.locator('[data-testid="barcode-scanner-dialog"]')).toBeVisible();
    
    // Enter barcode manually
    const testBarcode = '1234567890123';
    await page.fill('[data-testid="manual-barcode-input"]', testBarcode);
    await page.click('[data-testid="submit-barcode-button"]');
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Check for either success or "not found" message
    const successMessage = page.locator('[data-testid="scan-success-message"]');
    const notFoundMessage = page.locator('[data-testid="product-not-found-message"]');
    
    const isSuccess = await successMessage.isVisible();
    const isNotFound = await notFoundMessage.isVisible();
    
    expect(isSuccess || isNotFound).toBe(true);
    
    if (isNotFound) {
      // Should offer to add new product
      await expect(page.locator('[data-testid="add-product-from-barcode-button"]')).toBeVisible();
    }
  });

  test('should add product from unknown barcode', async ({ page }) => {
    console.log('🧪 Testing product addition from unknown barcode...');
    
    // Open scanner
    await page.click('[data-testid="scan-barcode-button"]');
    
    // Enter unknown barcode
    const unknownBarcode = '9999999999999';
    await page.fill('[data-testid="manual-barcode-input"]', unknownBarcode);
    await page.click('[data-testid="submit-barcode-button"]');
    
    // Wait for not found message
    await expect(page.locator('[data-testid="product-not-found-message"]')).toBeVisible();
    
    // Click add product button
    await page.click('[data-testid="add-product-from-barcode-button"]');
    
    // Should open add product dialog with barcode pre-filled
    await expect(page.locator('[data-testid="add-product-dialog"]')).toBeVisible();
    
    // Verify barcode is pre-filled
    const barcodeInput = page.locator('[data-testid="product-barcode-input"]');
    await expect(barcodeInput).toHaveValue(unknownBarcode);
    
    // Fill remaining required fields
    await page.fill('[data-testid="product-name-input"]', 'Scanned Product');
    await page.selectOption('[data-testid="product-category-select"]', 'other');
    await page.fill('[data-testid="product-quantity-input"]', '1');
    
    // Save product
    await page.click('[data-testid="save-product-button"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Verify product appears in inventory
    await expect(page.locator('[data-testid="product-card"]').filter({ hasText: 'Scanned Product' })).toBeVisible();
  });

  test('should handle scanner camera permissions', async ({ page, context }) => {
    console.log('🧪 Testing camera permissions...');
    
    // Grant camera permissions
    await context.grantPermissions(['camera']);
    
    // Open scanner
    await page.click('[data-testid="scan-barcode-button"]');
    await expect(page.locator('[data-testid="barcode-scanner-dialog"]')).toBeVisible();
    
    // Check if camera starts (may not work in headless mode)
    const cameraView = page.locator('[data-testid="camera-view"]');
    const permissionDenied = page.locator('[data-testid="camera-permission-denied"]');
    
    // Should either show camera or permission message
    const hasCameraView = await cameraView.isVisible();
    const hasPermissionMessage = await permissionDenied.isVisible();
    
    expect(hasCameraView || hasPermissionMessage).toBe(true);
    
    if (hasPermissionMessage) {
      // Should show fallback to manual entry
      await expect(page.locator('[data-testid="manual-barcode-input"]')).toBeVisible();
    }
  });

  test('should close scanner dialog', async ({ page }) => {
    console.log('🧪 Testing scanner dialog closing...');
    
    // Open scanner
    await page.click('[data-testid="scan-barcode-button"]');
    await expect(page.locator('[data-testid="barcode-scanner-dialog"]')).toBeVisible();
    
    // Close dialog
    await page.click('[data-testid="close-scanner-button"]');
    
    // Verify dialog is closed
    await expect(page.locator('[data-testid="barcode-scanner-dialog"]')).not.toBeVisible();
  });

  test('should validate barcode format', async ({ page }) => {
    console.log('🧪 Testing barcode format validation...');
    
    // Open scanner
    await page.click('[data-testid="scan-barcode-button"]');
    
    // Test invalid barcode formats
    const invalidBarcodes = ['123', 'abc', '123abc456', ''];
    
    for (const invalidBarcode of invalidBarcodes) {
      await page.fill('[data-testid="manual-barcode-input"]', invalidBarcode);
      await page.click('[data-testid="submit-barcode-button"]');
      
      // Should show validation error
      await expect(page.locator('[data-testid="barcode-validation-error"]')).toBeVisible();
      
      // Clear input for next test
      await page.fill('[data-testid="manual-barcode-input"]', '');
    }
    
    // Test valid barcode
    await page.fill('[data-testid="manual-barcode-input"]', '1234567890123');
    await page.click('[data-testid="submit-barcode-button"]');
    
    // Should not show validation error
    await expect(page.locator('[data-testid="barcode-validation-error"]')).not.toBeVisible();
  });

  test('should handle scanner errors gracefully', async ({ page }) => {
    console.log('🧪 Testing scanner error handling...');
    
    // Mock camera failure by denying permissions
    await page.context().clearPermissions();
    
    // Open scanner
    await page.click('[data-testid="scan-barcode-button"]');
    await expect(page.locator('[data-testid="barcode-scanner-dialog"]')).toBeVisible();
    
    // Should show error message and fallback options
    const errorMessage = page.locator('[data-testid="camera-error-message"]');
    const manualInput = page.locator('[data-testid="manual-barcode-input"]');
    
    // At least one should be visible
    const hasErrorMessage = await errorMessage.isVisible();
    const hasManualInput = await manualInput.isVisible();
    
    expect(hasErrorMessage || hasManualInput).toBe(true);
  });

  test('should show scanning instructions', async ({ page }) => {
    console.log('🧪 Testing scanning instructions...');
    
    // Open scanner
    await page.click('[data-testid="scan-barcode-button"]');
    await expect(page.locator('[data-testid="barcode-scanner-dialog"]')).toBeVisible();
    
    // Should show scanning instructions
    await expect(page.locator('[data-testid="scanning-instructions"]')).toBeVisible();
    
    // Instructions should contain helpful text
    const instructions = await page.locator('[data-testid="scanning-instructions"]').textContent();
    expect(instructions).toContain('barcode');
  });

  test('should support different barcode formats', async ({ page }) => {
    console.log('🧪 Testing different barcode formats...');
    
    // Open scanner
    await page.click('[data-testid="scan-barcode-button"]');
    
    // Test different valid barcode formats
    const validBarcodes = [
      '1234567890123', // EAN-13
      '123456789012',  // UPC-A
      '12345678',      // EAN-8
      '1234567890128', // EAN-13 with check digit
    ];
    
    for (const barcode of validBarcodes) {
      await page.fill('[data-testid="manual-barcode-input"]', barcode);
      await page.click('[data-testid="submit-barcode-button"]');
      
      // Should process without validation error
      await expect(page.locator('[data-testid="barcode-validation-error"]')).not.toBeVisible();
      
      // Wait for processing to complete
      await page.waitForTimeout(1000);
      
      // Clear for next test
      await page.fill('[data-testid="manual-barcode-input"]', '');
    }
  });

  test('should track scanning analytics', async ({ page }) => {
    console.log('🧪 Testing scanning analytics...');
    
    // Mock analytics tracking
    await page.addInitScript(() => {
      window.mockAnalytics = [];
      window.originalLogEvent = window.logEvent;
      window.logEvent = (event, params) => {
        window.mockAnalytics.push({ event, params });
      };
    });
    
    // Open scanner
    await page.click('[data-testid="scan-barcode-button"]');
    
    // Perform scan
    await page.fill('[data-testid="manual-barcode-input"]', '1234567890123');
    await page.click('[data-testid="submit-barcode-button"]');
    
    // Check analytics was called
    const analyticsEvents = await page.evaluate(() => window.mockAnalytics || []);
    
    // Should have tracking events
    const scanEvents = analyticsEvents.filter(event => 
      event.event === 'barcode_scan_success' || event.event === 'barcode_scan_failed'
    );
    
    expect(scanEvents.length).toBeGreaterThan(0);
  });
});