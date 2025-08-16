import { test, expect } from '@playwright/test';

test.describe('Ajout de produit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('devrait ajouter un produit basique', async ({ page }) => {
    // Cliquer sur le bouton d'ajout de produit
    const addButton = page.getByRole('button', { name: /ajouter|nouveau.*produit/i })
      .or(page.locator('[data-testid="add-product-button"]'))
      .or(page.locator('button:has-text("Ajouter")'));
    
    await addButton.first().click();
    
    // Vérifier que le formulaire ou dialog s'ouvre
    const dialog = page.locator('[data-testid="add-product-dialog"]')
      .or(page.locator('.dialog'))
      .or(page.locator('[role="dialog"]'));
    
    await expect(dialog.first()).toBeVisible();
    
    // Remplir les champs obligatoires
    const nameInput = page.locator('[data-testid="product-name-input"]')
      .or(page.locator('input[placeholder*="nom"]'))
      .or(page.locator('input[name*="name"]'));
    
    await nameInput.first().fill('Tomates cerises');
    
    // Sélectionner une catégorie si disponible
    const categorySelect = page.locator('[data-testid="product-category-select"]')
      .or(page.locator('select'))
      .or(page.getByLabel(/catégorie/i));
    
    if (await categorySelect.first().isVisible()) {
      await categorySelect.first().selectOption({ label: /légume|vegetable/i });
    }
    
    // Quantité
    const quantityInput = page.locator('[data-testid="product-quantity-input"]')
      .or(page.locator('input[placeholder*="quantité"]'))
      .or(page.locator('input[type="number"]'));
    
    await quantityInput.first().fill('2');
    
    // Sauvegarder
    const saveButton = page.getByRole('button', { name: /sauvegarder|enregistrer|ajouter/i })
      .or(page.locator('[data-testid="save-product-button"]'));
    
    await saveButton.first().click();
    
    // Vérifier le succès
    const successMessage = page.locator('[data-testid="success-toast"]')
      .or(page.locator('.toast'))
      .or(page.locator('[role="alert"]'));
    
    await expect(successMessage.first()).toBeVisible();
    
    // Vérifier que le produit apparaît dans la liste
    await expect(page.getByText('Tomates cerises')).toBeVisible();
  });

  test('devrait valider les champs obligatoires', async ({ page }) => {
    // Ouvrir le formulaire d'ajout
    const addButton = page.getByRole('button', { name: /ajouter|nouveau.*produit/i })
      .or(page.locator('[data-testid="add-product-button"]'));
    
    await addButton.first().click();
    
    // Essayer de sauvegarder sans remplir les champs
    const saveButton = page.getByRole('button', { name: /sauvegarder|enregistrer|ajouter/i })
      .or(page.locator('[data-testid="save-product-button"]'));
    
    await saveButton.first().click();
    
    // Vérifier qu'il y a des erreurs de validation
    const errorMessages = page.locator('[data-testid*="error"]')
      .or(page.locator('.error'))
      .or(page.locator('[role="alert"]'));
    
    await expect(errorMessages.first()).toBeVisible();
  });

  test('devrait pouvoir annuler l\'ajout', async ({ page }) => {
    // Ouvrir le formulaire
    const addButton = page.getByRole('button', { name: /ajouter|nouveau.*produit/i })
      .or(page.locator('[data-testid="add-product-button"]'));
    
    await addButton.first().click();
    
    // Remplir quelques champs
    const nameInput = page.locator('[data-testid="product-name-input"]')
      .or(page.locator('input[placeholder*="nom"]'))
      .or(page.locator('input[name*="name"]'));
    
    await nameInput.first().fill('Produit test');
    
    // Annuler
    const cancelButton = page.getByRole('button', { name: /annuler|fermer/i })
      .or(page.locator('[data-testid="cancel-button"]'))
      .or(page.locator('button:has-text("×")'));
    
    await cancelButton.first().click();
    
    // Vérifier que le dialog se ferme
    const dialog = page.locator('[data-testid="add-product-dialog"]')
      .or(page.locator('.dialog'))
      .or(page.locator('[role="dialog"]'));
    
    await expect(dialog.first()).not.toBeVisible();
    
    // Vérifier que le produit n'a pas été ajouté
    await expect(page.getByText('Produit test')).not.toBeVisible();
  });
});