import { test, expect } from '@playwright/test';

test.describe('Navigation de base', () => {
  test('devrait naviguer vers toutes les pages principales', async ({ page }) => {
    // Page d'accueil
    await page.goto('/');
    await expect(page).toHaveTitle(/CuisineZen/);
    
    // Navigation vers l'inventaire
    await page.goto('/inventory');
    await expect(page.locator('h1')).toContainText(/inventaire|stock|produit/i);
    await page.waitForLoadState('networkidle');
    
    // Navigation vers les recettes
    await page.goto('/recipes');
    await expect(page.locator('h1')).toContainText(/recette/i);
    await page.waitForLoadState('networkidle');
    
    // Navigation vers le menu
    await page.goto('/menu');
    await expect(page.locator('h1')).toContainText(/menu/i);
    await page.waitForLoadState('networkidle');
    
    // Navigation vers les analytics
    await page.goto('/analytics');
    await expect(page.locator('h1')).toContainText(/analytic|statistique|rapport/i);
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher la sidebar de navigation', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que la sidebar existe
    const sidebar = page.locator('[data-testid="sidebar"]').or(page.locator('nav')).or(page.locator('.sidebar'));
    await expect(sidebar.first()).toBeVisible();
    
    // Vérifier les liens de navigation principaux
    await expect(page.getByRole('link', { name: /inventaire|stock/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /recette/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /menu/i }).first()).toBeVisible();
  });

  test('devrait pouvoir naviguer via la sidebar', async ({ page }) => {
    await page.goto('/');
    
    // Cliquer sur le lien inventaire
    await page.getByRole('link', { name: /inventaire|stock/i }).first().click();
    await expect(page).toHaveURL(/\/inventory/);
    
    // Cliquer sur le lien recettes
    await page.getByRole('link', { name: /recette/i }).first().click();
    await expect(page).toHaveURL(/\/recipes/);
    
    // Retour à l'accueil
    await page.getByRole('link', { name: /accueil|home|cuisinezen/i }).first().click();
    await expect(page).toHaveURL('/');
  });

  test('devrait être responsive sur mobile', async ({ page }) => {
    // Simuler un viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Vérifier que la page se charge correctement
    await expect(page.locator('body')).toBeVisible();
    
    // Sur mobile, la navigation peut être dans un menu hamburger
    const mobileMenu = page.locator('[data-testid="mobile-menu"]').or(page.locator('.mobile-menu')).or(page.locator('[aria-label*="menu"]'));
    if (await mobileMenu.first().isVisible()) {
      await mobileMenu.first().click();
      await expect(page.getByRole('link', { name: /inventaire/i }).first()).toBeVisible();
    }
  });
});