import { test, expect, Page } from '@playwright/test';

/**
 * User Journey Testing Suite
 * Tests automatisés des parcours utilisateur avec métriques UX
 */

interface UXMetrics {
  loadTime: number;
  interactionTime: number;
  navigatedPath: string[];
  errorsEncountered: string[];
  taskCompleted: boolean;
  userSatisfactionScore: number;
  cognitiveLoad: number;
  accessibilityScore: number;
}

interface TaskStep {
  description: string;
  action: (page: Page) => Promise<void>;
  validation: (page: Page) => Promise<boolean>;
  maxTime?: number;
  criticalPath?: boolean;
}

class UXAnalyzer {
  private page: Page;
  private startTime: number = 0;
  private metrics: UXMetrics = {
    loadTime: 0,
    interactionTime: 0,
    navigatedPath: [],
    errorsEncountered: [],
    taskCompleted: false,
    userSatisfactionScore: 0,
    cognitiveLoad: 0,
    accessibilityScore: 0
  };

  constructor(page: Page) {
    this.page = page;
  }

  async startJourney(initialUrl: string): Promise<void> {
    this.startTime = Date.now();
    await this.page.goto(initialUrl);
    await this.page.waitForLoadState('networkidle');
    this.metrics.loadTime = Date.now() - this.startTime;
    this.metrics.navigatedPath.push(initialUrl);
  }

  async executeTask(task: TaskStep): Promise<boolean> {
    const taskStartTime = Date.now();
    
    try {
      // Exécution de l'action
      await task.action(this.page);
      
      // Mesure du temps d'interaction
      const interactionTime = Date.now() - taskStartTime;
      this.metrics.interactionTime += interactionTime;
      
      // Validation du résultat
      const success = await task.validation(this.page);
      
      // Vérification du temps maximal si défini
      if (task.maxTime && interactionTime > task.maxTime) {
        this.metrics.errorsEncountered.push(`Task "${task.description}" took too long: ${interactionTime}ms > ${task.maxTime}ms`);
        return false;
      }
      
      return success;
    } catch (error) {
      this.metrics.errorsEncountered.push(`Task "${task.description}" failed: ${error}`);
      return false;
    }
  }

  async analyzeCognitiveLoad(): Promise<number> {
    // Analyse de la charge cognitive basée sur la complexité de la page
    const complexity = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const interactive = document.querySelectorAll('button, a, input, select, textarea');
      const textLength = document.body.textContent?.length || 0;
      const images = document.querySelectorAll('img').length;
      const forms = document.querySelectorAll('form').length;
      
      return {
        totalElements: elements.length,
        interactiveElements: interactive.length,
        textComplexity: textLength,
        visualElements: images,
        formsCount: forms
      };
    });

    // Calcul simplifié de la charge cognitive (0-100)
    const cognitiveScore = Math.min(100, 
      (complexity.interactiveElements * 2) + 
      (complexity.formsCount * 10) + 
      (complexity.textComplexity / 100) + 
      (complexity.visualElements * 1.5)
    );

    this.metrics.cognitiveLoad = cognitiveScore;
    return cognitiveScore;
  }

  async trackNavigation(): Promise<void> {
    const currentUrl = this.page.url();
    if (!this.metrics.navigatedPath.includes(currentUrl)) {
      this.metrics.navigatedPath.push(currentUrl);
    }
  }

  async calculateSatisfactionScore(): Promise<number> {
    // Score de satisfaction basé sur plusieurs facteurs
    let score = 100;
    
    // Pénalités pour les erreurs
    score -= this.metrics.errorsEncountered.length * 20;
    
    // Pénalité pour les temps de chargement lents
    if (this.metrics.loadTime > 3000) score -= 15;
    if (this.metrics.loadTime > 5000) score -= 25;
    
    // Pénalité pour la charge cognitive élevée
    if (this.metrics.cognitiveLoad > 70) score -= 10;
    if (this.metrics.cognitiveLoad > 90) score -= 20;
    
    // Pénalité pour les parcours trop longs
    if (this.metrics.navigatedPath.length > 5) score -= 5;
    if (this.metrics.navigatedPath.length > 8) score -= 15;
    
    // Bonus pour la completion de tâche
    if (this.metrics.taskCompleted) score += 10;
    
    this.metrics.userSatisfactionScore = Math.max(0, Math.min(100, score));
    return this.metrics.userSatisfactionScore;
  }

  getMetrics(): UXMetrics {
    return { ...this.metrics };
  }

  markTaskCompleted(): void {
    this.metrics.taskCompleted = true;
  }
}

// Définition des parcours utilisateur critiques
const userJourneys = {
  newUserOnboarding: {
    name: 'New User Onboarding',
    priority: 'critical',
    maxDuration: 300000, // 5 minutes
    steps: [
      {
        description: 'Access homepage',
        action: async (page: Page) => {
          await page.goto('/');
        },
        validation: async (page: Page) => {
          return await page.locator('h1').isVisible();
        },
        maxTime: 3000,
        criticalPath: true
      },
      {
        description: 'Navigate to registration',
        action: async (page: Page) => {
          await page.click('text=Sign up');
        },
        validation: async (page: Page) => {
          return page.url().includes('/login') || page.url().includes('/register');
        },
        maxTime: 2000,
        criticalPath: true
      },
      {
        description: 'Complete registration form',
        action: async (page: Page) => {
          if (await page.locator('input[type="email"]').isVisible()) {
            await page.fill('input[type="email"]', 'test@example.com');
            await page.fill('input[type="password"]', 'TestPassword123!');
            await page.click('button[type="submit"]');
          }
        },
        validation: async (page: Page) => {
          return page.url().includes('/inventory') || page.url().includes('/dashboard');
        },
        maxTime: 5000,
        criticalPath: true
      }
    ] as TaskStep[]
  },

  inventoryManagement: {
    name: 'Inventory Management',
    priority: 'high',
    maxDuration: 180000, // 3 minutes
    steps: [
      {
        description: 'Access inventory page',
        action: async (page: Page) => {
          await page.goto('/inventory');
        },
        validation: async (page: Page) => {
          return await page.locator('[data-testid="inventory-list"], .inventory-container').isVisible();
        },
        maxTime: 3000,
        criticalPath: true
      },
      {
        description: 'Add new product',
        action: async (page: Page) => {
          await page.click('button:has-text("Add"), [data-testid="add-product"]');
          await page.waitForSelector('input[name="name"], input[placeholder*="name"]');
          await page.fill('input[name="name"], input[placeholder*="name"]', 'Test Product');
          
          const quantityField = page.locator('input[name="quantity"], input[placeholder*="quantity"]').first();
          if (await quantityField.isVisible()) {
            await quantityField.fill('5');
          }
          
          await page.click('button[type="submit"], button:has-text("Save")');
        },
        validation: async (page: Page) => {
          return await page.locator('text=Test Product').isVisible();
        },
        maxTime: 10000,
        criticalPath: true
      },
      {
        description: 'Search for product',
        action: async (page: Page) => {
          const searchField = page.locator('input[placeholder*="search"], input[type="search"]').first();
          if (await searchField.isVisible()) {
            await searchField.fill('Test Product');
            await page.keyboard.press('Enter');
          }
        },
        validation: async (page: Page) => {
          return await page.locator('text=Test Product').isVisible();
        },
        maxTime: 3000
      }
    ] as TaskStep[]
  },

  recipeDiscovery: {
    name: 'Recipe Discovery and Creation',
    priority: 'high',
    maxDuration: 240000, // 4 minutes
    steps: [
      {
        description: 'Navigate to recipes',
        action: async (page: Page) => {
          await page.goto('/recipes');
        },
        validation: async (page: Page) => {
          return await page.locator('[data-testid="recipes-list"], .recipes-container').isVisible();
        },
        maxTime: 3000,
        criticalPath: true
      },
      {
        description: 'Search for recipes',
        action: async (page: Page) => {
          const searchField = page.locator('input[placeholder*="search"], input[type="search"]').first();
          if (await searchField.isVisible()) {
            await searchField.fill('pasta');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);
          }
        },
        validation: async (page: Page) => {
          const hasResults = await page.locator('.recipe-card, [data-testid="recipe-item"]').count() > 0;
          const hasNoResults = await page.locator('text=No recipes found, text=Aucune recette').isVisible();
          return hasResults || hasNoResults;
        },
        maxTime: 5000
      },
      {
        description: 'Create new recipe',
        action: async (page: Page) => {
          await page.click('button:has-text("Add"), button:has-text("Create"), [data-testid="add-recipe"]');
          await page.waitForSelector('input[name="title"], input[placeholder*="title"], input[placeholder*="name"]');
          
          await page.fill('input[name="title"], input[placeholder*="title"], input[placeholder*="name"]', 'Test Recipe');
          
          const descriptionField = page.locator('textarea[name="description"], textarea[placeholder*="description"]').first();
          if (await descriptionField.isVisible()) {
            await descriptionField.fill('A delicious test recipe');
          }
          
          await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
        },
        validation: async (page: Page) => {
          return await page.locator('text=Test Recipe').isVisible();
        },
        maxTime: 15000,
        criticalPath: true
      }
    ] as TaskStep[]
  },

  menuPlanning: {
    name: 'Menu Planning',
    priority: 'medium',
    maxDuration: 300000, // 5 minutes
    steps: [
      {
        description: 'Access menu planning',
        action: async (page: Page) => {
          await page.goto('/menu');
        },
        validation: async (page: Page) => {
          return await page.locator('[data-testid="menu-planner"], .menu-container').isVisible();
        },
        maxTime: 3000,
        criticalPath: true
      },
      {
        description: 'Create new menu',
        action: async (page: Page) => {
          await page.click('button:has-text("Create"), button:has-text("Add"), [data-testid="create-menu"]');
          await page.waitForSelector('input[name="name"], input[placeholder*="name"]');
          
          await page.fill('input[name="name"], input[placeholder*="name"]', 'Weekly Menu');
          
          const dateField = page.locator('input[type="date"]').first();
          if (await dateField.isVisible()) {
            await dateField.fill('2024-01-01');
          }
          
          await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
        },
        validation: async (page: Page) => {
          return await page.locator('text=Weekly Menu').isVisible();
        },
        maxTime: 10000,
        criticalPath: true
      }
    ] as TaskStep[]
  },

  analyticsReview: {
    name: 'Analytics Review',
    priority: 'medium',
    maxDuration: 120000, // 2 minutes
    steps: [
      {
        description: 'Access analytics dashboard',
        action: async (page: Page) => {
          await page.goto('/analytics');
        },
        validation: async (page: Page) => {
          return await page.locator('[data-testid="analytics-dashboard"], .analytics-container').isVisible();
        },
        maxTime: 3000,
        criticalPath: true
      },
      {
        description: 'Interact with charts',
        action: async (page: Page) => {
          const charts = page.locator('.chart, [data-testid*="chart"], canvas');
          const chartCount = await charts.count();
          
          if (chartCount > 0) {
            await charts.first().hover();
            await page.waitForTimeout(1000);
          }
        },
        validation: async (page: Page) => {
          return await page.locator('.chart, [data-testid*="chart"], canvas').count() > 0;
        },
        maxTime: 5000
      }
    ] as TaskStep[]
  }
};

test.describe('User Journey Testing Suite', () => {
  Object.entries(userJourneys).forEach(([journeyKey, journey]) => {
    test(`${journey.name} - Complete User Journey`, async ({ page }) => {
      const analyzer = new UXAnalyzer(page);
      const journeyStartTime = Date.now();
      
      // Initialisation du parcours
      await analyzer.startJourney('/');
      
      let allStepsCompleted = true;
      let criticalPathFailed = false;
      
      // Exécution des étapes
      for (const [index, step] of journey.steps.entries()) {
        console.log(`Executing step ${index + 1}: ${step.description}`);
        
        const stepSuccess = await analyzer.executeTask(step);
        
        if (!stepSuccess) {
          allStepsCompleted = false;
          if (step.criticalPath) {
            criticalPathFailed = true;
            break; // Arrêt si une étape critique échoue
          }
        }
        
        await analyzer.trackNavigation();
        await analyzer.analyzeCognitiveLoad();
      }
      
      const journeyDuration = Date.now() - journeyStartTime;
      
      // Marquage de la completion si toutes les étapes critiques ont réussi
      if (!criticalPathFailed) {
        analyzer.markTaskCompleted();
      }
      
      // Calcul du score de satisfaction
      await analyzer.calculateSatisfactionScore();
      
      const metrics = analyzer.getMetrics();
      
      // Assertions de base
      expect(criticalPathFailed, `Critical path failed in ${journey.name}`).toBe(false);
      expect(journeyDuration, `Journey took too long: ${journeyDuration}ms`).toBeLessThan(journey.maxDuration);
      
      // Assertions sur les métriques UX
      expect(metrics.loadTime, `Initial load time too slow: ${metrics.loadTime}ms`).toBeLessThan(5000);
      expect(metrics.userSatisfactionScore, `User satisfaction too low: ${metrics.userSatisfactionScore}%`).toBeGreaterThanOrEqual(70);
      expect(metrics.cognitiveLoad, `Cognitive load too high: ${metrics.cognitiveLoad}`).toBeLessThan(80);
      
      // Logging des métriques pour analyse
      console.log(`\n=== UX Metrics for ${journey.name} ===`);
      console.log(`Total Duration: ${journeyDuration}ms`);
      console.log(`Load Time: ${metrics.loadTime}ms`);
      console.log(`Interaction Time: ${metrics.interactionTime}ms`);
      console.log(`Navigation Path: ${metrics.navigatedPath.join(' → ')}`);
      console.log(`Errors: ${metrics.errorsEncountered.length}`);
      console.log(`Task Completed: ${metrics.taskCompleted}`);
      console.log(`Satisfaction Score: ${metrics.userSatisfactionScore}%`);
      console.log(`Cognitive Load: ${metrics.cognitiveLoad}`);
      
      if (metrics.errorsEncountered.length > 0) {
        console.log(`Errors Encountered:`);
        metrics.errorsEncountered.forEach(error => console.log(`  - ${error}`));
      }
      
      // Export des métriques pour analyse ultérieure
      await page.evaluate((journeyMetrics) => {
        if (typeof window !== 'undefined') {
          (window as any).uxMetrics = (window as any).uxMetrics || {};
          (window as any).uxMetrics[journeyMetrics.journeyName] = journeyMetrics.metrics;
        }
      }, { journeyName: journeyKey, metrics });
      
      // Seuils spécifiques par priorité
      if (journey.priority === 'critical') {
        expect(metrics.userSatisfactionScore, `Critical journey satisfaction too low`).toBeGreaterThanOrEqual(85);
        expect(metrics.errorsEncountered.length, `Critical journey has too many errors`).toBe(0);
      } else if (journey.priority === 'high') {
        expect(metrics.userSatisfactionScore, `High priority journey satisfaction too low`).toBeGreaterThanOrEqual(75);
        expect(metrics.errorsEncountered.length, `High priority journey has too many errors`).toBeLessThanOrEqual(1);
      }
    });
  });

  test('Cross-Journey Performance Analysis', async ({ page }) => {
    const allMetrics: Record<string, UXMetrics> = {};
    
    // Exécution rapide de tous les parcours pour analyse comparative
    for (const [journeyKey, journey] of Object.entries(userJourneys)) {
      if (journey.priority === 'critical') { // Focus sur les parcours critiques
        const analyzer = new UXAnalyzer(page);
        await analyzer.startJourney('/');
        
        // Exécution des étapes critiques uniquement
        const criticalSteps = journey.steps.filter(step => step.criticalPath);
        
        for (const step of criticalSteps) {
          await analyzer.executeTask(step);
          await analyzer.trackNavigation();
        }
        
        await analyzer.analyzeCognitiveLoad();
        await analyzer.calculateSatisfactionScore();
        
        allMetrics[journeyKey] = analyzer.getMetrics();
      }
    }
    
    // Analyse comparative
    const avgSatisfaction = Object.values(allMetrics).reduce((sum, m) => sum + m.userSatisfactionScore, 0) / Object.keys(allMetrics).length;
    const avgLoadTime = Object.values(allMetrics).reduce((sum, m) => sum + m.loadTime, 0) / Object.keys(allMetrics).length;
    const avgCognitiveLoad = Object.values(allMetrics).reduce((sum, m) => sum + m.cognitiveLoad, 0) / Object.keys(allMetrics).length;
    
    console.log('\n=== Cross-Journey Analysis ===');
    console.log(`Average Satisfaction Score: ${avgSatisfaction.toFixed(1)}%`);
    console.log(`Average Load Time: ${avgLoadTime.toFixed(0)}ms`);
    console.log(`Average Cognitive Load: ${avgCognitiveLoad.toFixed(1)}`);
    
    console.table(Object.entries(allMetrics).map(([journey, metrics]) => ({
      Journey: journey,
      Satisfaction: `${metrics.userSatisfactionScore}%`,
      LoadTime: `${metrics.loadTime}ms`,
      CognitiveLoad: metrics.cognitiveLoad.toFixed(1),
      Errors: metrics.errorsEncountered.length,
      Completed: metrics.taskCompleted ? 'Yes' : 'No'
    })));
    
    // Assertions globales
    expect(avgSatisfaction, 'Overall user satisfaction too low').toBeGreaterThanOrEqual(80);
    expect(avgLoadTime, 'Overall load times too slow').toBeLessThan(4000);
    expect(avgCognitiveLoad, 'Overall cognitive load too high').toBeLessThan(70);
    
    // Identifier les parcours problématiques
    const problematicJourneys = Object.entries(allMetrics).filter(([_, metrics]) => 
      metrics.userSatisfactionScore < 70 || metrics.errorsEncountered.length > 2
    );
    
    expect(problematicJourneys.length, `Problematic journeys found: ${problematicJourneys.map(([name]) => name).join(', ')}`).toBe(0);
  });
});