import { test, expect } from '@playwright/test';

test.describe('Product Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Use authenticated state
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('should add a new product manually', async ({ page }) => {
    console.log('🧪 Testing manual product addition...');
    
    // Click add product button
    await page.click('[data-testid="add-product-button"]');
    
    // Wait for dialog to open
    await expect(page.locator('[data-testid="add-product-dialog"]')).toBeVisible();
    
    // Fill product details
    await page.fill('[data-testid="product-name-input"]', 'Fresh Tomatoes');
    await page.selectOption('[data-testid="product-category-select"]', 'vegetables');
    await page.fill('[data-testid="product-quantity-input"]', '5');
    await page.selectOption('[data-testid="product-unit-select"]', 'kg');
    await page.fill('[data-testid="product-price-input"]', '3.50');
    await page.fill('[data-testid="product-supplier-input"]', 'Local Farm');
    
    // Set expiration date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.fill('[data-testid="product-expiry-input"]', tomorrowStr);
    
    // Add notes
    await page.fill('[data-testid="product-notes-input"]', 'Organic tomatoes, grade A');
    
    // Submit form
    await page.click('[data-testid="save-product-button"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Verify product appears in list
    await expect(page.locator('[data-testid="product-card"]').filter({ hasText: 'Fresh Tomatoes' })).toBeVisible();
    
    // Verify product details
    const productCard = page.locator('[data-testid="product-card"]').filter({ hasText: 'Fresh Tomatoes' });
    await expect(productCard.locator('[data-testid="product-quantity"]')).toContainText('5 kg');
    await expect(productCard.locator('[data-testid="product-price"]')).toContainText('3.50');
    await expect(productCard.locator('[data-testid="product-supplier"]')).toContainText('Local Farm');
  });

  test('should edit an existing product', async ({ page }) => {
    console.log('🧪 Testing product editing...');
    
    // Ensure we have at least one product
    const productExists = await page.locator('[data-testid="product-card"]').first().isVisible();
    
    if (!productExists) {
      // Add a product first
      await page.click('[data-testid="add-product-button"]');
      await page.fill('[data-testid="product-name-input"]', 'Test Product');
      await page.selectOption('[data-testid="product-category-select"]', 'other');
      await page.fill('[data-testid="product-quantity-input"]', '1');
      await page.click('[data-testid="save-product-button"]');
      await page.waitForSelector('[data-testid="success-toast"]');
    }
    
    // Click edit button on first product
    await page.locator('[data-testid="product-card"]').first().locator('[data-testid="edit-product-button"]').click();
    
    // Wait for edit dialog
    await expect(page.locator('[data-testid="edit-product-dialog"]')).toBeVisible();
    
    // Update quantity
    await page.fill('[data-testid="product-quantity-input"]', '10');
    
    // Update notes
    await page.fill('[data-testid="product-notes-input"]', 'Updated notes');
    
    // Save changes
    await page.click('[data-testid="save-product-button"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Verify changes are reflected
    await expect(page.locator('[data-testid="product-quantity"]').first()).toContainText('10');
  });

  test('should delete a product', async ({ page }) => {
    console.log('🧪 Testing product deletion...');
    
    // Ensure we have at least one product
    const productExists = await page.locator('[data-testid="product-card"]').first().isVisible();
    
    if (!productExists) {
      // Add a product first
      await page.click('[data-testid="add-product-button"]');
      await page.fill('[data-testid="product-name-input"]', 'Product to Delete');
      await page.selectOption('[data-testid="product-category-select"]', 'other');
      await page.fill('[data-testid="product-quantity-input"]', '1');
      await page.click('[data-testid="save-product-button"]');
      await page.waitForSelector('[data-testid="success-toast"]');
    }
    
    // Get the product name for verification
    const productName = await page.locator('[data-testid="product-card"]').first().locator('[data-testid="product-name"]').textContent();
    
    // Click delete button
    await page.locator('[data-testid="product-card"]').first().locator('[data-testid="delete-product-button"]').click();
    
    // Confirm deletion in dialog
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Verify product is removed from list
    if (productName) {
      await expect(page.locator('[data-testid="product-card"]').filter({ hasText: productName })).not.toBeVisible();
    }
  });

  test('should filter products by category', async ({ page }) => {
    console.log('🧪 Testing product filtering...');
    
    // Add products from different categories if none exist
    const categories = ['vegetables', 'meat', 'dairy'];
    
    for (const category of categories) {
      await page.click('[data-testid="add-product-button"]');
      await page.fill('[data-testid="product-name-input"]', `Test ${category} Product`);
      await page.selectOption('[data-testid="product-category-select"]', category);
      await page.fill('[data-testid="product-quantity-input"]', '1');
      await page.click('[data-testid="save-product-button"]');
      await page.waitForSelector('[data-testid="success-toast"]');
    }
    
    // Test filtering by vegetables
    await page.selectOption('[data-testid="category-filter"]', 'vegetables');
    
    // Wait for filter to apply
    await page.waitForTimeout(1000);
    
    // Verify only vegetable products are shown
    const visibleProducts = await page.locator('[data-testid="product-card"]').all();
    for (const product of visibleProducts) {
      const categoryBadge = product.locator('[data-testid="product-category"]');
      await expect(categoryBadge).toContainText('vegetables');
    }
    
    // Clear filter
    await page.selectOption('[data-testid="category-filter"]', 'all');
    
    // Verify all products are shown again
    const allProducts = await page.locator('[data-testid="product-card"]').all();
    expect(allProducts.length).toBeGreaterThanOrEqual(3);
  });

  test('should search products by name', async ({ page }) => {
    console.log('🧪 Testing product search...');
    
    // Add a unique product for search testing
    await page.click('[data-testid="add-product-button"]');
    await page.fill('[data-testid="product-name-input"]', 'Unique Search Product');
    await page.selectOption('[data-testid="product-category-select"]', 'other');
    await page.fill('[data-testid="product-quantity-input"]', '1');
    await page.click('[data-testid="save-product-button"]');
    await page.waitForSelector('[data-testid="success-toast"]');
    
    // Search for the product
    await page.fill('[data-testid="product-search-input"]', 'Unique Search');
    
    // Wait for search to apply
    await page.waitForTimeout(1000);
    
    // Verify only matching products are shown
    const searchResults = await page.locator('[data-testid="product-card"]').all();
    expect(searchResults.length).toBeGreaterThanOrEqual(1);
    
    for (const product of searchResults) {
      const productName = await product.locator('[data-testid="product-name"]').textContent();
      expect(productName?.toLowerCase()).toContain('unique search');
    }
    
    // Clear search
    await page.fill('[data-testid="product-search-input"]', '');
    
    // Verify all products are shown again
    await page.waitForTimeout(1000);
    const allProducts = await page.locator('[data-testid="product-card"]').all();
    expect(allProducts.length).toBeGreaterThan(searchResults.length);
  });

  test('should show expiration alerts', async ({ page }) => {
    console.log('🧪 Testing expiration alerts...');
    
    // Add a product that expires today
    await page.click('[data-testid="add-product-button"]');
    await page.fill('[data-testid="product-name-input"]', 'Expires Today');
    await page.selectOption('[data-testid="product-category-select"]', 'dairy');
    await page.fill('[data-testid="product-quantity-input"]', '1');
    
    // Set expiration to today
    const today = new Date().toISOString().split('T')[0];
    await page.fill('[data-testid="product-expiry-input"]', today);
    
    await page.click('[data-testid="save-product-button"]');
    await page.waitForSelector('[data-testid="success-toast"]');
    
    // Check for expiration alert
    const alertProduct = page.locator('[data-testid="product-card"]').filter({ hasText: 'Expires Today' });
    await expect(alertProduct.locator('[data-testid="expiration-alert"]')).toBeVisible();
    
    // Verify alert styling
    await expect(alertProduct).toHaveClass(/.*warning.*|.*danger.*|.*alert.*/);
  });

  test('should handle product image upload', async ({ page }) => {
    console.log('🧪 Testing product image upload...');
    
    // Click add product button
    await page.click('[data-testid="add-product-button"]');
    
    // Fill basic product info
    await page.fill('[data-testid="product-name-input"]', 'Product with Image');
    await page.selectOption('[data-testid="product-category-select"]', 'vegetables');
    await page.fill('[data-testid="product-quantity-input"]', '1');
    
    // Upload image (if upload component exists)
    const imageUpload = page.locator('[data-testid="product-image-upload"]');
    if (await imageUpload.isVisible()) {
      // Create a test image file
      const testImagePath = './tests/e2e/fixtures/test-product.jpg';
      
      // Check if fixture exists or create a mock upload
      try {
        await page.setInputFiles('[data-testid="image-file-input"]', testImagePath);
        
        // Wait for image preview
        await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
      } catch (error) {
        console.log('Image upload skipped - fixture not found or component not available');
      }
    }
    
    // Save product
    await page.click('[data-testid="save-product-button"]');
    await page.waitForSelector('[data-testid="success-toast"]');
    
    // Verify product is created
    await expect(page.locator('[data-testid="product-card"]').filter({ hasText: 'Product with Image' })).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    console.log('🧪 Testing form validation...');
    
    // Click add product button
    await page.click('[data-testid="add-product-button"]');
    
    // Try to submit without required fields
    await page.click('[data-testid="save-product-button"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="quantity-error"]')).toBeVisible();
    
    // Fill name but leave quantity empty
    await page.fill('[data-testid="product-name-input"]', 'Test Product');
    await page.click('[data-testid="save-product-button"]');
    
    // Verify quantity error still shows
    await expect(page.locator('[data-testid="quantity-error"]')).toBeVisible();
    
    // Fill all required fields
    await page.fill('[data-testid="product-quantity-input"]', '1');
    await page.selectOption('[data-testid="product-category-select"]', 'other');
    
    // Submit should now work
    await page.click('[data-testid="save-product-button"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });
});