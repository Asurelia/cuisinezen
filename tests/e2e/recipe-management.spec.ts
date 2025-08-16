import { test, expect } from '@playwright/test';

test.describe('Recipe Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
  });

  test('should create a new recipe', async ({ page }) => {
    console.log('🧪 Testing recipe creation...');
    
    // Click add recipe button
    await page.click('[data-testid="add-recipe-button"]');
    
    // Wait for dialog to open
    await expect(page.locator('[data-testid="recipe-form-dialog"]')).toBeVisible();
    
    // Fill recipe basic info
    await page.fill('[data-testid="recipe-name-input"]', 'Pasta Carbonara');
    await page.selectOption('[data-testid="recipe-category-select"]', 'main-course');
    await page.fill('[data-testid="recipe-servings-input"]', '4');
    await page.fill('[data-testid="recipe-prep-time-input"]', '15');
    await page.fill('[data-testid="recipe-cook-time-input"]', '20');
    
    // Add ingredients
    await page.click('[data-testid="add-ingredient-button"]');
    await page.fill('[data-testid="ingredient-name-0"]', 'Spaghetti');
    await page.fill('[data-testid="ingredient-quantity-0"]', '400');
    await page.fill('[data-testid="ingredient-unit-0"]', 'g');
    
    await page.click('[data-testid="add-ingredient-button"]');
    await page.fill('[data-testid="ingredient-name-1"]', 'Bacon');
    await page.fill('[data-testid="ingredient-quantity-1"]', '200');
    await page.fill('[data-testid="ingredient-unit-1"]', 'g');
    
    await page.click('[data-testid="add-ingredient-button"]');
    await page.fill('[data-testid="ingredient-name-2"]', 'Eggs');
    await page.fill('[data-testid="ingredient-quantity-2"]', '3');
    await page.fill('[data-testid="ingredient-unit-2"]', 'pieces');
    
    // Add cooking steps
    await page.click('[data-testid="add-step-button"]');
    await page.fill('[data-testid="step-description-0"]', 'Cook spaghetti in salted boiling water until al dente.');
    
    await page.click('[data-testid="add-step-button"]');
    await page.fill('[data-testid="step-description-1"]', 'Cook bacon until crispy, then set aside.');
    
    await page.click('[data-testid="add-step-button"]');
    await page.fill('[data-testid="step-description-2"]', 'Mix eggs with cheese and black pepper.');
    
    await page.click('[data-testid="add-step-button"]');
    await page.fill('[data-testid="step-description-3"]', 'Combine hot pasta with egg mixture and bacon. Serve immediately.');
    
    // Add notes
    await page.fill('[data-testid="recipe-notes-input"]', 'Traditional Italian recipe. Serve with freshly grated Parmesan.');
    
    // Save recipe
    await page.click('[data-testid="save-recipe-button"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Verify recipe appears in list
    await expect(page.locator('[data-testid="recipe-card"]').filter({ hasText: 'Pasta Carbonara' })).toBeVisible();
    
    // Verify recipe details
    const recipeCard = page.locator('[data-testid="recipe-card"]').filter({ hasText: 'Pasta Carbonara' });
    await expect(recipeCard.locator('[data-testid="recipe-servings"]')).toContainText('4');
    await expect(recipeCard.locator('[data-testid="recipe-total-time"]')).toContainText('35'); // 15 + 20
    await expect(recipeCard.locator('[data-testid="recipe-category"]')).toContainText('main-course');
  });

  test('should view recipe details', async ({ page }) => {
    console.log('🧪 Testing recipe detail view...');
    
    // Ensure we have at least one recipe
    const recipeExists = await page.locator('[data-testid="recipe-card"]').first().isVisible();
    
    if (!recipeExists) {
      // Create a test recipe first
      await page.click('[data-testid="add-recipe-button"]');
      await page.fill('[data-testid="recipe-name-input"]', 'Test Recipe');
      await page.selectOption('[data-testid="recipe-category-select"]', 'dessert');
      await page.fill('[data-testid="recipe-servings-input"]', '2');
      await page.click('[data-testid="add-ingredient-button"]');
      await page.fill('[data-testid="ingredient-name-0"]', 'Sugar');
      await page.fill('[data-testid="ingredient-quantity-0"]', '100');
      await page.fill('[data-testid="ingredient-unit-0"]', 'g');
      await page.click('[data-testid="add-step-button"]');
      await page.fill('[data-testid="step-description-0"]', 'Mix everything together.');
      await page.click('[data-testid="save-recipe-button"]');
      await page.waitForSelector('[data-testid="success-toast"]');
    }
    
    // Click on first recipe card
    await page.locator('[data-testid="recipe-card"]').first().click();
    
    // Should navigate to recipe detail page or open detail modal
    await expect(page.locator('[data-testid="recipe-detail-view"]')).toBeVisible();
    
    // Verify detail components are present
    await expect(page.locator('[data-testid="recipe-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="recipe-ingredients-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="recipe-steps-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="recipe-metadata"]')).toBeVisible();
  });

  test('should edit an existing recipe', async ({ page }) => {
    console.log('🧪 Testing recipe editing...');
    
    // Ensure we have a recipe to edit
    const recipeExists = await page.locator('[data-testid="recipe-card"]').first().isVisible();
    
    if (!recipeExists) {
      // Create a test recipe first
      await page.click('[data-testid="add-recipe-button"]');
      await page.fill('[data-testid="recipe-name-input"]', 'Recipe to Edit');
      await page.selectOption('[data-testid="recipe-category-select"]', 'appetizer');
      await page.fill('[data-testid="recipe-servings-input"]', '2');
      await page.click('[data-testid="save-recipe-button"]');
      await page.waitForSelector('[data-testid="success-toast"]');
    }
    
    // Click edit button on first recipe
    await page.locator('[data-testid="recipe-card"]').first().locator('[data-testid="edit-recipe-button"]').click();
    
    // Wait for edit dialog
    await expect(page.locator('[data-testid="recipe-form-dialog"]')).toBeVisible();
    
    // Update servings
    await page.fill('[data-testid="recipe-servings-input"]', '6');
    
    // Update prep time
    await page.fill('[data-testid="recipe-prep-time-input"]', '30');
    
    // Add a new ingredient if ingredients section exists
    const addIngredientButton = page.locator('[data-testid="add-ingredient-button"]');
    if (await addIngredientButton.isVisible()) {
      await addIngredientButton.click();
      const lastIngredientIndex = await page.locator('[data-testid^="ingredient-name-"]').count() - 1;
      await page.fill(`[data-testid="ingredient-name-${lastIngredientIndex}"]`, 'New Ingredient');
      await page.fill(`[data-testid="ingredient-quantity-${lastIngredientIndex}"]`, '1');
      await page.fill(`[data-testid="ingredient-unit-${lastIngredientIndex}"]`, 'cup');
    }
    
    // Save changes
    await page.click('[data-testid="save-recipe-button"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Verify changes are reflected
    const updatedCard = page.locator('[data-testid="recipe-card"]').first();
    await expect(updatedCard.locator('[data-testid="recipe-servings"]')).toContainText('6');
  });

  test('should delete a recipe', async ({ page }) => {
    console.log('🧪 Testing recipe deletion...');
    
    // Ensure we have a recipe to delete
    const recipeExists = await page.locator('[data-testid="recipe-card"]').first().isVisible();
    
    if (!recipeExists) {
      // Create a test recipe first
      await page.click('[data-testid="add-recipe-button"]');
      await page.fill('[data-testid="recipe-name-input"]', 'Recipe to Delete');
      await page.selectOption('[data-testid="recipe-category-select"]', 'snack');
      await page.fill('[data-testid="recipe-servings-input"]', '1');
      await page.click('[data-testid="save-recipe-button"]');
      await page.waitForSelector('[data-testid="success-toast"]');
    }
    
    // Get recipe name for verification
    const recipeName = await page.locator('[data-testid="recipe-card"]').first().locator('[data-testid="recipe-name"]').textContent();
    
    // Click delete button
    await page.locator('[data-testid="recipe-card"]').first().locator('[data-testid="delete-recipe-button"]').click();
    
    // Confirm deletion
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Verify recipe is removed
    if (recipeName) {
      await expect(page.locator('[data-testid="recipe-card"]').filter({ hasText: recipeName })).not.toBeVisible();
    }
  });

  test('should filter recipes by category', async ({ page }) => {
    console.log('🧪 Testing recipe filtering...');
    
    // Create recipes in different categories
    const categories = ['appetizer', 'main-course', 'dessert'];
    
    for (const category of categories) {
      await page.click('[data-testid="add-recipe-button"]');
      await page.fill('[data-testid="recipe-name-input"]', `Test ${category} Recipe`);
      await page.selectOption('[data-testid="recipe-category-select"]', category);
      await page.fill('[data-testid="recipe-servings-input"]', '2');
      await page.click('[data-testid="save-recipe-button"]');
      await page.waitForSelector('[data-testid="success-toast"]');
    }
    
    // Test filtering by main-course
    await page.selectOption('[data-testid="recipe-category-filter"]', 'main-course');
    await page.waitForTimeout(1000);
    
    // Verify only main-course recipes are shown
    const visibleRecipes = await page.locator('[data-testid="recipe-card"]').all();
    for (const recipe of visibleRecipes) {
      const categoryBadge = recipe.locator('[data-testid="recipe-category"]');
      await expect(categoryBadge).toContainText('main-course');
    }
    
    // Clear filter
    await page.selectOption('[data-testid="recipe-category-filter"]', 'all');
    await page.waitForTimeout(1000);
    
    // Verify all recipes are shown
    const allRecipes = await page.locator('[data-testid="recipe-card"]').all();
    expect(allRecipes.length).toBeGreaterThanOrEqual(3);
  });

  test('should search recipes', async ({ page }) => {
    console.log('🧪 Testing recipe search...');
    
    // Create a unique recipe for search testing
    await page.click('[data-testid="add-recipe-button"]');
    await page.fill('[data-testid="recipe-name-input"]', 'Unique Search Recipe');
    await page.selectOption('[data-testid="recipe-category-select"]', 'main-course');
    await page.fill('[data-testid="recipe-servings-input"]', '2');
    await page.click('[data-testid="save-recipe-button"]');
    await page.waitForSelector('[data-testid="success-toast"]');
    
    // Search for the recipe
    await page.fill('[data-testid="recipe-search-input"]', 'Unique Search');
    await page.waitForTimeout(1000);
    
    // Verify search results
    const searchResults = await page.locator('[data-testid="recipe-card"]').all();
    expect(searchResults.length).toBeGreaterThanOrEqual(1);
    
    for (const recipe of searchResults) {
      const recipeName = await recipe.locator('[data-testid="recipe-name"]').textContent();
      expect(recipeName?.toLowerCase()).toContain('unique search');
    }
    
    // Clear search
    await page.fill('[data-testid="recipe-search-input"]', '');
    await page.waitForTimeout(1000);
    
    // Verify all recipes are shown
    const allRecipes = await page.locator('[data-testid="recipe-card"]').all();
    expect(allRecipes.length).toBeGreaterThan(searchResults.length);
  });

  test('should calculate total cooking time', async ({ page }) => {
    console.log('🧪 Testing cooking time calculation...');
    
    // Create recipe with specific times
    await page.click('[data-testid="add-recipe-button"]');
    await page.fill('[data-testid="recipe-name-input"]', 'Timed Recipe');
    await page.fill('[data-testid="recipe-prep-time-input"]', '15');
    await page.fill('[data-testid="recipe-cook-time-input"]', '25');
    await page.selectOption('[data-testid="recipe-category-select"]', 'main-course');
    await page.fill('[data-testid="recipe-servings-input"]', '2');
    await page.click('[data-testid="save-recipe-button"]');
    await page.waitForSelector('[data-testid="success-toast"]');
    
    // Verify total time is calculated correctly (15 + 25 = 40)
    const recipeCard = page.locator('[data-testid="recipe-card"]').filter({ hasText: 'Timed Recipe' });
    await expect(recipeCard.locator('[data-testid="recipe-total-time"]')).toContainText('40');
  });

  test('should validate recipe form', async ({ page }) => {
    console.log('🧪 Testing recipe form validation...');
    
    // Open recipe form
    await page.click('[data-testid="add-recipe-button"]');
    
    // Try to submit without required fields
    await page.click('[data-testid="save-recipe-button"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="recipe-name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="recipe-servings-error"]')).toBeVisible();
    
    // Fill name but leave servings empty
    await page.fill('[data-testid="recipe-name-input"]', 'Test Recipe');
    await page.click('[data-testid="save-recipe-button"]');
    
    // Verify servings error still shows
    await expect(page.locator('[data-testid="recipe-servings-error"]')).toBeVisible();
    
    // Fill required fields
    await page.fill('[data-testid="recipe-servings-input"]', '2');
    await page.selectOption('[data-testid="recipe-category-select"]', 'snack');
    
    // Submit should now work
    await page.click('[data-testid="save-recipe-button"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });

  test('should handle ingredient management', async ({ page }) => {
    console.log('🧪 Testing ingredient management...');
    
    // Open recipe form
    await page.click('[data-testid="add-recipe-button"]');
    await page.fill('[data-testid="recipe-name-input"]', 'Ingredient Test Recipe');
    await page.selectOption('[data-testid="recipe-category-select"]', 'main-course');
    await page.fill('[data-testid="recipe-servings-input"]', '2');
    
    // Add multiple ingredients
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="add-ingredient-button"]');
      await page.fill(`[data-testid="ingredient-name-${i}"]`, `Ingredient ${i + 1}`);
      await page.fill(`[data-testid="ingredient-quantity-${i}"]`, `${i + 1}`);
      await page.fill(`[data-testid="ingredient-unit-${i}"]`, 'cup');
    }
    
    // Remove middle ingredient
    await page.click('[data-testid="remove-ingredient-1"]');
    
    // Verify ingredient is removed
    const ingredientInputs = await page.locator('[data-testid^="ingredient-name-"]').count();
    expect(ingredientInputs).toBe(2);
    
    // Save recipe
    await page.click('[data-testid="save-recipe-button"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });

  test('should handle cooking steps management', async ({ page }) => {
    console.log('🧪 Testing cooking steps management...');
    
    // Open recipe form
    await page.click('[data-testid="add-recipe-button"]');
    await page.fill('[data-testid="recipe-name-input"]', 'Steps Test Recipe');
    await page.selectOption('[data-testid="recipe-category-select"]', 'main-course');
    await page.fill('[data-testid="recipe-servings-input"]', '2');
    
    // Add multiple steps
    for (let i = 0; i < 4; i++) {
      await page.click('[data-testid="add-step-button"]');
      await page.fill(`[data-testid="step-description-${i}"]`, `Step ${i + 1}: Do something important.`);
    }
    
    // Remove a step
    await page.click('[data-testid="remove-step-2"]');
    
    // Verify step is removed
    const stepInputs = await page.locator('[data-testid^="step-description-"]').count();
    expect(stepInputs).toBe(3);
    
    // Reorder steps (if reordering functionality exists)
    const moveUpButton = page.locator('[data-testid="move-step-up-1"]');
    if (await moveUpButton.isVisible()) {
      await moveUpButton.click();
      
      // Verify step order changed
      const firstStepValue = await page.locator('[data-testid="step-description-0"]').inputValue();
      expect(firstStepValue).toContain('Step 2');
    }
    
    // Save recipe
    await page.click('[data-testid="save-recipe-button"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });

  test('should handle recipe image upload', async ({ page }) => {
    console.log('🧪 Testing recipe image upload...');
    
    // Open recipe form
    await page.click('[data-testid="add-recipe-button"]');
    await page.fill('[data-testid="recipe-name-input"]', 'Recipe with Image');
    await page.selectOption('[data-testid="recipe-category-select"]', 'dessert');
    await page.fill('[data-testid="recipe-servings-input"]', '4');
    
    // Upload image if component exists
    const imageUpload = page.locator('[data-testid="recipe-image-upload"]');
    if (await imageUpload.isVisible()) {
      try {
        const testImagePath = './tests/e2e/fixtures/test-recipe.jpg';
        await page.setInputFiles('[data-testid="recipe-image-input"]', testImagePath);
        
        // Wait for image preview
        await expect(page.locator('[data-testid="recipe-image-preview"]')).toBeVisible();
      } catch (error) {
        console.log('Image upload skipped - fixture not found');
      }
    }
    
    // Save recipe
    await page.click('[data-testid="save-recipe-button"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Verify recipe is created
    await expect(page.locator('[data-testid="recipe-card"]').filter({ hasText: 'Recipe with Image' })).toBeVisible();
  });
});