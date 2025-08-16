import { test, expect } from '@playwright/test';

test.describe('Création de recette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
  });

  test('devrait créer une recette basique', async ({ page }) => {
    // Cliquer sur le bouton de création de recette
    const addButton = page.getByRole('button', { name: /ajouter|nouvelle.*recette|créer/i })
      .or(page.locator('[data-testid="add-recipe-button"]'))
      .or(page.locator('button:has-text("Ajouter")'));
    
    await addButton.first().click();
    
    // Vérifier que le formulaire s'ouvre
    const dialog = page.locator('[data-testid="add-recipe-dialog"]')
      .or(page.locator('[data-testid="recipe-form-dialog"]'))
      .or(page.locator('.dialog'))
      .or(page.locator('[role="dialog"]'));
    
    await expect(dialog.first()).toBeVisible();
    
    // Remplir le nom de la recette
    const nameInput = page.locator('[data-testid="recipe-name-input"]')
      .or(page.locator('input[placeholder*="nom"]'))
      .or(page.locator('input[name*="name"]'));
    
    await nameInput.first().fill('Salade de tomates');
    
    // Remplir la description
    const descriptionInput = page.locator('[data-testid="recipe-description-input"]')
      .or(page.locator('textarea[placeholder*="description"]'))
      .or(page.locator('textarea'));
    
    await descriptionInput.first().fill('Une délicieuse salade fraîche');
    
    // Temps de préparation
    const prepTimeInput = page.locator('[data-testid="recipe-prep-time-input"]')
      .or(page.locator('input[placeholder*="temps"]'))
      .or(page.locator('input[type="number"]').nth(0));
    
    if (await prepTimeInput.first().isVisible()) {
      await prepTimeInput.first().fill('15');
    }
    
    // Nombre de portions
    const servingsInput = page.locator('[data-testid="recipe-servings-input"]')
      .or(page.locator('input[placeholder*="portion"]'))
      .or(page.locator('input[type="number"]').nth(1));
    
    if (await servingsInput.first().isVisible()) {
      await servingsInput.first().fill('4');
    }
    
    // Ingrédients
    const ingredientsInput = page.locator('[data-testid="recipe-ingredients-input"]')
      .or(page.locator('textarea[placeholder*="ingrédient"]'))
      .or(page.locator('textarea').nth(1));
    
    if (await ingredientsInput.first().isVisible()) {
      await ingredientsInput.first().fill('2 tomates\n1 oignon\nHuile d\'olive\nSel et poivre');
    }
    
    // Instructions
    const instructionsInput = page.locator('[data-testid="recipe-instructions-input"]')
      .or(page.locator('textarea[placeholder*="instruction"]'))
      .or(page.locator('textarea').nth(2));
    
    if (await instructionsInput.first().isVisible()) {
      await instructionsInput.first().fill('1. Couper les tomates\n2. Émincer l\'oignon\n3. Mélanger avec l\'huile');
    }
    
    // Sauvegarder
    const saveButton = page.getByRole('button', { name: /sauvegarder|enregistrer|créer/i })
      .or(page.locator('[data-testid="save-recipe-button"]'));
    
    await saveButton.first().click();
    
    // Vérifier le succès
    const successMessage = page.locator('[data-testid="success-toast"]')
      .or(page.locator('.toast'))
      .or(page.locator('[role="alert"]'));
    
    await expect(successMessage.first()).toBeVisible();
    
    // Vérifier que la recette apparaît dans la liste
    await expect(page.getByText('Salade de tomates')).toBeVisible();
  });

  test('devrait valider les champs obligatoires de la recette', async ({ page }) => {
    // Ouvrir le formulaire
    const addButton = page.getByRole('button', { name: /ajouter|nouvelle.*recette|créer/i })
      .or(page.locator('[data-testid="add-recipe-button"]'));
    
    await addButton.first().click();
    
    // Essayer de sauvegarder sans remplir les champs
    const saveButton = page.getByRole('button', { name: /sauvegarder|enregistrer|créer/i })
      .or(page.locator('[data-testid="save-recipe-button"]'));
    
    await saveButton.first().click();
    
    // Vérifier qu'il y a des erreurs de validation
    const errorMessages = page.locator('[data-testid*="error"]')
      .or(page.locator('.error'))
      .or(page.locator('[role="alert"]'));
    
    await expect(errorMessages.first()).toBeVisible();
  });

  test('devrait pouvoir rechercher des recettes', async ({ page }) => {
    // Ajouter d'abord une recette pour la recherche
    const addButton = page.getByRole('button', { name: /ajouter|nouvelle.*recette/i })
      .or(page.locator('[data-testid="add-recipe-button"]'));
    
    if (await addButton.first().isVisible()) {
      await addButton.first().click();
      
      const nameInput = page.locator('[data-testid="recipe-name-input"]')
        .or(page.locator('input[placeholder*="nom"]'));
      
      await nameInput.first().fill('Soupe de légumes');
      
      const descriptionInput = page.locator('[data-testid="recipe-description-input"]')
        .or(page.locator('textarea'));
      
      await descriptionInput.first().fill('Une soupe healthy');
      
      const saveButton = page.getByRole('button', { name: /sauvegarder|enregistrer|créer/i });
      await saveButton.first().click();
      
      // Attendre que la recette soit sauvegardée
      await page.waitForTimeout(1000);
    }
    
    // Rechercher la recette
    const searchInput = page.locator('[data-testid="recipe-search-input"]')
      .or(page.locator('input[placeholder*="recherch"]'))
      .or(page.locator('input[type="search"]'));
    
    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('soupe');
      
      // Vérifier que les résultats de recherche s'affichent
      await expect(page.getByText('Soupe de légumes')).toBeVisible();
    }
  });

  test('devrait pouvoir annuler la création de recette', async ({ page }) => {
    // Ouvrir le formulaire
    const addButton = page.getByRole('button', { name: /ajouter|nouvelle.*recette/i })
      .or(page.locator('[data-testid="add-recipe-button"]'));
    
    await addButton.first().click();
    
    // Remplir quelques champs
    const nameInput = page.locator('[data-testid="recipe-name-input"]')
      .or(page.locator('input[placeholder*="nom"]'));
    
    await nameInput.first().fill('Recette test');
    
    // Annuler
    const cancelButton = page.getByRole('button', { name: /annuler|fermer/i })
      .or(page.locator('[data-testid="cancel-button"]'))
      .or(page.locator('button:has-text("×")'));
    
    await cancelButton.first().click();
    
    // Vérifier que le dialog se ferme
    const dialog = page.locator('[data-testid="add-recipe-dialog"]')
      .or(page.locator('[data-testid="recipe-form-dialog"]'))
      .or(page.locator('.dialog'));
    
    await expect(dialog.first()).not.toBeVisible();
    
    // Vérifier que la recette n'a pas été ajoutée
    await expect(page.getByText('Recette test')).not.toBeVisible();
  });
});