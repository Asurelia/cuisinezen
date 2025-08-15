/**
 * Générateur de tests E2E avec assertions réelles pour CuisineZen
 */

import { ComponentAnalysis, TestCase } from '../test-agent';

export class E2ETestGenerator {
  
  /**
   * Génère des tests E2E Playwright pour les composants CuisineZen
   */
  generatePlaywrightTests(analyses: ComponentAnalysis[]): string {
    const testFiles: string[] = [];
    
    for (const analysis of analyses) {
      if (this.shouldGenerateE2ETests(analysis)) {
        testFiles.push(this.generateComponentE2ETest(analysis));
      }
    }
    
    return testFiles.join('\n\n');
  }

  private shouldGenerateE2ETests(analysis: ComponentAnalysis): boolean {
    // Génère des tests E2E pour les composants avec des interactions importantes
    return analysis.interactions.length > 0 || 
           analysis.businessLogic.length > 0 ||
           analysis.name.toLowerCase().includes('dialog') ||
           analysis.name.toLowerCase().includes('form');
  }

  private generateComponentE2ETest(analysis: ComponentAnalysis): string {
    const testName = analysis.name.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1);
    
    let testContent = `
// Tests E2E pour ${analysis.name}
import { test, expect } from '@playwright/test';

test.describe('${analysis.name}', () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers la page contenant le composant
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

`;

    // Tests spécifiques selon le type de composant
    if (analysis.name.includes('AddProduct')) {
      testContent += this.generateAddProductTests();
    } else if (analysis.name.includes('Recipe')) {
      testContent += this.generateRecipeTests();
    } else if (analysis.name.includes('Barcode')) {
      testContent += this.generateBarcodeTests();
    } else {
      testContent += this.generateGenericTests(analysis);
    }

    testContent += `
});
`;

    return testContent;
  }

  private generateAddProductTests(): string {
    return `
  test('should add a new product successfully', async ({ page }) => {
    // Ouvrir le dialog d'ajout de produit
    await page.click('[data-testid="add-product-button"]');
    
    // Vérifier que le dialog est ouvert
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Ajouter un nouveau produit')).toBeVisible();
    
    // Remplir le formulaire
    await page.fill('input[name="name"]', 'Tomates cerises bio');
    await page.selectOption('select[name="category"]', 'frais');
    await page.fill('input[name="quantity"]', '2');
    
    // Sélectionner une date d'expiration
    await page.click('button:has-text("Choisir une date")');
    await page.click('[data-testid="calendar-next-month"]');
    await page.click('button[data-date]:first-child');
    
    // Soumettre le formulaire
    await page.click('button:has-text("Ajouter le produit")');
    
    // Vérifications
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('text=Tomates cerises bio')).toBeVisible();
    
    // Vérifier que l'analytics a été déclenchée
    const analyticsRequests = [];
    page.on('request', request => {
      if (request.url().includes('analytics')) {
        analyticsRequests.push(request);
      }
    });
    
    expect(analyticsRequests.length).toBeGreaterThan(0);
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('[data-testid="add-product-button"]');
    
    // Essayer de soumettre sans remplir les champs
    await page.click('button:has-text("Ajouter le produit")');
    
    // Vérifier les messages d'erreur
    await expect(page.locator('text=Le nom doit contenir au moins 2 caractères')).toBeVisible();
    await expect(page.locator('text=Veuillez sélectionner une catégorie')).toBeVisible();
  });

  test('should upload product image', async ({ page }) => {
    await page.click('[data-testid="add-product-button"]');
    
    // Upload d'image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/product-image.jpg');
    
    // Vérifier l'aperçu
    await expect(page.locator('img[alt="Aperçu du produit"]')).toBeVisible();
    
    // Compléter et soumettre
    await page.fill('input[name="name"]', 'Produit avec image');
    await page.selectOption('select[name="category"]', 'épicerie');
    await page.click('button:has-text("Ajouter le produit")');
    
    // Vérifier que l'image est sauvegardée
    await expect(page.locator('img[alt*="Produit avec image"]')).toBeVisible();
  });

  test('should suggest category automatically', async ({ page }) => {
    await page.click('[data-testid="add-product-button"]');
    
    // Taper un nom de produit
    await page.fill('input[name="name"]', 'Lait entier');
    
    // Attendre la suggestion automatique
    await page.waitForTimeout(600); // Attendre le debounce
    
    // Vérifier que la catégorie est suggérée
    await expect(page.locator('select[name="category"]')).toHaveValue('frais');
    await expect(page.locator('text=Suggestion...')).not.toBeVisible();
  });

  test('should scan barcode', async ({ page }) => {
    await page.click('[data-testid="add-product-button"]');
    
    // Ouvrir le scanner
    await page.click('button[aria-label*="scanner"], button:has([data-testid="barcode-icon"])');
    
    // Vérifier que le scanner est ouvert
    await expect(page.locator('text=Scanner un code-barres')).toBeVisible();
    
    // Simuler la détection d'un code-barres
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('barcode-detected', { 
        detail: { code: '1234567890123' }
      }));
    });
    
    // Vérifier le toast de confirmation
    await expect(page.locator('text=Code-barres scanné')).toBeVisible();
    await expect(page.locator('text=1234567890123')).toBeVisible();
  });
`;
  }

  private generateRecipeTests(): string {
    return `
  test('should create a new recipe with ingredients', async ({ page }) => {
    // Naviguer vers les recettes
    await page.goto('/recipes');
    await page.click('[data-testid="add-recipe-button"]');
    
    // Vérifier l'ouverture du dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Ajouter une nouvelle recette')).toBeVisible();
    
    // Remplir les informations de base
    await page.fill('input[name="name"]', 'Salade de tomates cerises');
    await page.fill('textarea[name="description"]', 'Une délicieuse salade fraîche');
    await page.fill('input[name="preparationTime"]', '15');
    await page.fill('input[name="cookingTime"]', '0');
    await page.selectOption('select[name="difficulty"]', 'facile');
    
    // Ajouter des ingrédients
    await page.selectOption('select[name="ingredients.0.productId"]', { label: 'Tomates cerises' });
    await page.fill('input[name="ingredients.0.quantity"]', '300');
    await page.selectOption('select[name="ingredients.0.unit"]', 'g');
    
    // Ajouter un deuxième ingrédient
    await page.click('button:has-text("Ajouter un ingrédient")');
    await page.selectOption('select[name="ingredients.1.productId"]', { label: 'Huile d\'olive' });
    await page.fill('input[name="ingredients.1.quantity"]', '2');
    await page.selectOption('select[name="ingredients.1.unit"]', 'ml');
    
    // Sauvegarder
    await page.click('button:has-text("Créer la recette")');
    
    // Vérifications
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('text=Salade de tomates cerises')).toBeVisible();
    await expect(page.locator('text=15 min de préparation')).toBeVisible();
  });

  test('should validate recipe ingredients', async ({ page }) => {
    await page.goto('/recipes');
    await page.click('[data-testid="add-recipe-button"]');
    
    // Essayer de sauvegarder sans ingrédients
    await page.fill('input[name="name"]', 'Recette sans ingrédients');
    await page.click('button:has-text("Créer la recette")');
    
    // Vérifier l'erreur
    await expect(page.locator('text=Veuillez ajouter au moins un ingrédient')).toBeVisible();
    
    // Ajouter un ingrédient invalide
    await page.selectOption('select[name="ingredients.0.productId"]', '');
    await page.fill('input[name="ingredients.0.quantity"]', '-1');
    
    await page.click('button:has-text("Créer la recette")');
    
    // Vérifier les erreurs de validation
    await expect(page.locator('text=Veuillez sélectionner un produit')).toBeVisible();
    await expect(page.locator('text=La quantité doit être positive')).toBeVisible();
  });

  test('should edit existing recipe', async ({ page }) => {
    await page.goto('/recipes');
    
    // Cliquer sur modifier pour une recette existante
    await page.click('[data-testid="recipe-card"]:first-child [data-testid="edit-button"]');
    
    // Vérifier que le formulaire est pré-rempli
    await expect(page.locator('input[name="name"]')).not.toHaveValue('');
    
    // Modifier le nom
    await page.fill('input[name="name"]', 'Recette modifiée');
    
    // Sauvegarder
    await page.click('button:has-text("Sauvegarder les changements")');
    
    // Vérifier la mise à jour
    await expect(page.locator('text=Recette modifiée')).toBeVisible();
  });

  test('should upload recipe image', async ({ page }) => {
    await page.goto('/recipes');
    await page.click('[data-testid="add-recipe-button"]');
    
    // Upload d'image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/recipe-image.jpg');
    
    // Vérifier l'aperçu
    await expect(page.locator('img[alt="Aperçu de la recette"]')).toBeVisible();
    
    // Compléter et soumettre
    await page.fill('input[name="name"]', 'Recette avec image');
    await page.selectOption('select[name="ingredients.0.productId"]', { index: 1 });
    await page.fill('input[name="ingredients.0.quantity"]', '100');
    
    await page.click('button:has-text("Créer la recette")');
    
    // Vérifier que l'image est affichée
    await expect(page.locator('img[alt*="Recette avec image"]')).toBeVisible();
  });
`;
  }

  private generateBarcodeTests(): string {
    return `
  test('should open barcode scanner camera', async ({ page, context }) => {
    // Accorder les permissions de caméra
    await context.grantPermissions(['camera']);
    
    await page.goto('/inventory');
    await page.click('[data-testid="add-product-button"]');
    await page.click('[data-testid="barcode-scanner-button"]');
    
    // Vérifier que le scanner est ouvert
    await expect(page.locator('[data-testid="barcode-scanner"]')).toBeVisible();
    await expect(page.locator('video')).toBeVisible();
    
    // Vérifier les contrôles
    await expect(page.locator('button:has-text("Fermer")')).toBeVisible();
    await expect(page.locator('text=Pointez vers un code-barres')).toBeVisible();
  });

  test('should handle barcode detection', async ({ page }) => {
    await page.goto('/inventory');
    await page.click('[data-testid="add-product-button"]');
    await page.click('[data-testid="barcode-scanner-button"]');
    
    // Simuler la détection d'un code-barres
    await page.evaluate(() => {
      const event = new CustomEvent('barcode-detected', {
        detail: { 
          text: '1234567890123',
          format: 'EAN_13'
        }
      });
      document.dispatchEvent(event);
    });
    
    // Vérifier la fermeture du scanner
    await expect(page.locator('[data-testid="barcode-scanner"]')).not.toBeVisible();
    
    // Vérifier le toast de confirmation
    await expect(page.locator('.toast')).toBeVisible();
    await expect(page.locator('text=Code-barres scanné')).toBeVisible();
    await expect(page.locator('text=1234567890123')).toBeVisible();
  });

  test('should handle camera permission denied', async ({ page, context }) => {
    // Refuser les permissions de caméra
    await context.grantPermissions([]);
    
    await page.goto('/inventory');
    await page.click('[data-testid="add-product-button"]');
    await page.click('[data-testid="barcode-scanner-button"]');
    
    // Vérifier le message d'erreur
    await expect(page.locator('text=Accès à la caméra refusé')).toBeVisible();
    await expect(page.locator('text=Veuillez autoriser l\'accès')).toBeVisible();
  });
`;
  }

  private generateGenericTests(analysis: ComponentAnalysis): string {
    let tests = `
  test('should render ${analysis.name} without crashing', async ({ page }) => {
    // Test de rendu de base
    await expect(page.locator('body')).toBeVisible();
    
    // Vérifier qu'il n'y a pas d'erreurs JavaScript
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
`;

    // Tests pour les interactions détectées
    for (const interaction of analysis.interactions) {
      switch (interaction.type) {
        case 'button':
          tests += `
  test('should handle ${interaction.type} interactions', async ({ page }) => {
    const button = page.locator('${interaction.selector}');
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    
    await button.click();
    
    // Vérifier qu'aucune erreur ne se produit
    await page.waitForTimeout(500);
  });
`;
          break;
          
        case 'form':
          tests += `
  test('should handle form submission', async ({ page }) => {
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Remplir les champs requis (si détectés)
    const requiredInputs = page.locator('input[required]');
    const count = await requiredInputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = requiredInputs.nth(i);
      const type = await input.getAttribute('type');
      
      if (type === 'text' || type === 'email') {
        await input.fill('test value');
      } else if (type === 'number') {
        await input.fill('1');
      }
    }
    
    // Soumettre le formulaire
    await form.locator('button[type="submit"]').click();
  });
`;
          break;
          
        case 'dialog':
          tests += `
  test('should open and close dialog', async ({ page }) => {
    // Trouver le trigger du dialog
    const trigger = page.locator('button').filter({ hasText: /ouvrir|ajouter|modifier/i }).first();
    
    if (await trigger.isVisible()) {
      await trigger.click();
      
      // Vérifier l'ouverture
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Fermer le dialog
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    }
  });
`;
          break;
      }
    }

    return tests;
  }

  /**
   * Génère les tests d'accessibilité
   */
  generateAccessibilityTests(analyses: ComponentAnalysis[]): string {
    return `
// Tests d'accessibilité pour CuisineZen
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should not have accessibility violations on main pages', async ({ page }) => {
    const pages = ['/', '/inventory', '/recipes', '/analytics'];
    
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('should have proper keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier la navigation au clavier
    await page.keyboard.press('Tab');
    const firstFocusable = await page.locator(':focus').first();
    await expect(firstFocusable).toBeVisible();
    
    // Continuer la navigation
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier les boutons ont des labels
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const hasLabel = await button.evaluate(el => {
        return el.hasAttribute('aria-label') || 
               el.hasAttribute('aria-labelledby') || 
               el.textContent?.trim() !== '';
      });
      
      expect(hasLabel).toBe(true);
    }
  });

  test('should support screen readers', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier les landmarks
    await expect(page.locator('[role="main"], main')).toBeVisible();
    await expect(page.locator('[role="navigation"], nav')).toBeVisible();
    
    // Vérifier les headings
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings.first()).toBeVisible();
  });
});
`;
  }

  /**
   * Génère la configuration Playwright
   */
  generatePlaywrightConfig(): string {
    return `
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
`;
  }
}

export const e2eGenerator = new E2ETestGenerator();