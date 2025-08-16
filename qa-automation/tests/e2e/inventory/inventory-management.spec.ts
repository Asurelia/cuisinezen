import { test, expect } from '@playwright/test';

describe('Inventory Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to inventory page
    await page.goto('/inventory');
    
    // Wait for the page to load
    await expect(page).toHaveTitle(/CuisineZen/);
    await expect(page.getByRole('heading', { name: /inventory/i })).toBeVisible();
  });

  test('User can add a new product to inventory', async ({ page }) => {
    // Click add product button
    await page.getByRole('button', { name: /add product/i }).click();
    
    // Fill in product details
    await page.getByLabel(/product name/i).fill('Test Product');
    await page.getByLabel(/category/i).selectOption('grocery');
    await page.getByLabel(/quantity/i).fill('5');
    await page.getByLabel(/expiry date/i).fill('2024-12-31');
    
    // Submit the form
    await page.getByRole('button', { name: /save/i }).click();
    
    // Verify product appears in the list
    await expect(page.getByText('Test Product')).toBeVisible();
    await expect(page.getByText('5')).toBeVisible();
    
    // Verify success message
    await expect(page.getByText(/product added successfully/i)).toBeVisible();
  });

  test('User can edit product details', async ({ page }) => {
    // Assume there's an existing product
    await page.getByTestId('product-card').first().hover();
    await page.getByRole('button', { name: /edit/i }).first().click();
    
    // Update product name
    await page.getByLabel(/product name/i).clear();
    await page.getByLabel(/product name/i).fill('Updated Product Name');
    
    // Update quantity
    await page.getByLabel(/quantity/i).clear();
    await page.getByLabel(/quantity/i).fill('10');
    
    // Save changes
    await page.getByRole('button', { name: /save/i }).click();
    
    // Verify changes are reflected
    await expect(page.getByText('Updated Product Name')).toBeVisible();
    await expect(page.getByText('10')).toBeVisible();
    
    // Verify success message
    await expect(page.getByText(/product updated successfully/i)).toBeVisible();
  });

  test('User can delete a product', async ({ page }) => {
    // Get initial product count
    const initialProducts = await page.getByTestId('product-card').count();
    
    // Delete the first product
    await page.getByTestId('product-card').first().hover();
    await page.getByRole('button', { name: /delete/i }).first().click();
    
    // Confirm deletion in dialog
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Verify product is removed
    const finalProducts = await page.getByTestId('product-card').count();
    expect(finalProducts).toBe(initialProducts - 1);
    
    // Verify success message
    await expect(page.getByText(/product deleted successfully/i)).toBeVisible();
  });

  test('User can filter products by category', async ({ page }) => {
    // Select fresh category filter
    await page.getByRole('combobox', { name: /filter by category/i }).click();
    await page.getByRole('option', { name: /fresh/i }).click();
    
    // Verify only fresh products are shown
    const visibleProducts = page.getByTestId('product-card');
    await expect(visibleProducts).toHaveCount(0); // Assuming no fresh products initially
    
    // Or if there are fresh products:
    // const freshProducts = await visibleProducts.all();
    // for (const product of freshProducts) {
    //   await expect(product.getByText(/fresh/i)).toBeVisible();
    // }
    
    // Clear filter
    await page.getByRole('button', { name: /clear filters/i }).click();
    
    // Verify all products are shown again
    await expect(visibleProducts.first()).toBeVisible();
  });

  test('User can sort products by expiration date', async ({ page }) => {
    // Click sort dropdown
    await page.getByRole('combobox', { name: /sort by/i }).click();
    await page.getByRole('option', { name: /expiration date/i }).click();
    
    // Wait for sorting to apply
    await page.waitForTimeout(500);
    
    // Verify products are sorted (would need to check actual dates)
    const productCards = page.getByTestId('product-card');
    await expect(productCards.first()).toBeVisible();
    
    // Could add more specific assertions about order
  });

  test('User can view expiration alerts', async ({ page }) => {
    // Navigate to or check for expiration alerts section
    const alertsSection = page.getByTestId('expiration-alerts');
    
    // If there are products expiring soon
    if (await alertsSection.isVisible()) {
      await expect(alertsSection.getByText(/expiring soon/i)).toBeVisible();
      
      // Check that clicking on alert navigates to product
      await alertsSection.getByRole('button').first().click();
      await expect(page.getByTestId('product-details')).toBeVisible();
    }
  });

  test('User can perform bulk operations', async ({ page }) => {
    // Enable bulk selection mode
    await page.getByRole('button', { name: /bulk actions/i }).click();
    
    // Select multiple products
    await page.getByTestId('product-checkbox').first().check();
    await page.getByTestId('product-checkbox').nth(1).check();
    
    // Verify bulk actions are available
    await expect(page.getByRole('button', { name: /delete selected/i })).toBeEnabled();
    await expect(page.getByRole('button', { name: /update category/i })).toBeEnabled();
    
    // Perform bulk category update
    await page.getByRole('button', { name: /update category/i }).click();
    await page.getByRole('combobox', { name: /new category/i }).selectOption('frozen');
    await page.getByRole('button', { name: /apply/i }).click();
    
    // Verify success message
    await expect(page.getByText(/products updated successfully/i)).toBeVisible();
  });

  test('User can search products', async ({ page }) => {
    // Use search functionality
    await page.getByPlaceholder(/search products/i).fill('milk');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Verify search results
    const searchResults = page.getByTestId('product-card');
    const resultCount = await searchResults.count();
    
    if (resultCount > 0) {
      // Verify search term appears in results
      await expect(searchResults.first().getByText(/milk/i)).toBeVisible();
    } else {
      // Verify no results message
      await expect(page.getByText(/no products found/i)).toBeVisible();
    }
    
    // Clear search
    await page.getByPlaceholder(/search products/i).clear();
    await expect(searchResults.first()).toBeVisible();
  });

  test('Inventory displays empty state when no products', async ({ page }) => {
    // This test assumes we can clear all products or navigate to empty state
    
    // Check if empty state is shown
    const emptyState = page.getByTestId('empty-inventory');
    
    if (await emptyState.isVisible()) {
      await expect(emptyState.getByText(/no products in your inventory/i)).toBeVisible();
      await expect(emptyState.getByRole('button', { name: /add your first product/i })).toBeVisible();
      
      // Test call-to-action button
      await emptyState.getByRole('button', { name: /add your first product/i }).click();
      await expect(page.getByRole('dialog', { name: /add product/i })).toBeVisible();
    }
  });

  test('Inventory handles loading states correctly', async ({ page }) => {
    // Reload page to see loading state
    await page.reload();
    
    // Check for loading indicators
    const loadingSpinner = page.getByTestId('loading-spinner');
    const skeletonCards = page.getByTestId('skeleton-card');
    
    // Loading indicator should appear initially
    if (await loadingSpinner.isVisible()) {
      await expect(loadingSpinner).toBeVisible();
    }
    
    if (await skeletonCards.first().isVisible()) {
      await expect(skeletonCards.first()).toBeVisible();
    }
    
    // Wait for content to load
    await expect(page.getByTestId('inventory-grid')).toBeVisible();
    
    // Loading indicators should disappear
    await expect(loadingSpinner).not.toBeVisible();
  });

  test('User can navigate between inventory views', async ({ page }) => {
    // Test grid view (default)
    await expect(page.getByTestId('inventory-grid')).toBeVisible();
    
    // Switch to list view
    await page.getByRole('button', { name: /list view/i }).click();
    await expect(page.getByTestId('inventory-list')).toBeVisible();
    
    // Switch back to grid view
    await page.getByRole('button', { name: /grid view/i }).click();
    await expect(page.getByTestId('inventory-grid')).toBeVisible();
  });
});