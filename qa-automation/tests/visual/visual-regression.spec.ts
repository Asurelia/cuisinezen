/**
 * CuisineZen Visual Regression Test Suite
 * Automated visual testing with AI-powered analysis
 */

import { test, expect, Page } from '@playwright/test';
import visualConfig from '../../configs/visual-regression.config';
import { VisualTestRunner } from '../../utils/visual-test-runner';
import { AIVisualAnalyzer } from '../../utils/ai-visual-analyzer';
import { PerformanceVisualTracker } from '../../utils/performance-visual-tracker';

interface VisualTestContext {
  runner: VisualTestRunner;
  aiAnalyzer?: AIVisualAnalyzer;
  performanceTracker: PerformanceVisualTracker;
}

test.describe('CuisineZen Visual Regression Tests', () => {
  let context: VisualTestContext;

  test.beforeAll(async () => {
    context = {
      runner: new VisualTestRunner(),
      performanceTracker: new PerformanceVisualTracker(),
    };

    // Initialize AI analyzer if enabled
    if (process.env.ENABLE_AI_VISUAL_ANALYSIS === 'true') {
      context.aiAnalyzer = new AIVisualAnalyzer();
      await context.aiAnalyzer.initialize();
    }

    await context.runner.initialize();
    await context.performanceTracker.initialize();
  });

  test.afterAll(async () => {
    await context.runner.cleanup();
    await context.performanceTracker.generateReport();
    await context.aiAnalyzer?.cleanup();
  });

  // Homepage Visual Tests
  test.describe('Homepage Visual Tests', () => {
    test('homepage displays correctly on desktop', async ({ page }) => {
      await runVisualTest(page, 'homepage-desktop', context);
    });

    test('homepage displays correctly on mobile', async ({ page }) => {
      await runVisualTest(page, 'homepage-mobile', context);
    });

    test('homepage dark theme renders correctly', async ({ page }) => {
      await runVisualTest(page, 'dark-theme-homepage', context);
    });
  });

  // Inventory Visual Tests
  test.describe('Inventory Visual Tests', () => {
    test('inventory empty state displays correctly', async ({ page }) => {
      // Seed empty inventory scenario
      await context.runner.seedTestData('empty-inventory');
      await runVisualTest(page, 'inventory-empty-state', context);
    });

    test('inventory with products displays correctly', async ({ page }) => {
      // Seed inventory with products
      await context.runner.seedTestData('full-inventory');
      await runVisualTest(page, 'inventory-with-products', context);
    });

    test('add product dialog displays correctly', async ({ page }) => {
      await runVisualTest(page, 'inventory-add-product-dialog', context);
    });

    test('product card interactions visual consistency', async ({ page }) => {
      await context.runner.seedTestData('default');
      await page.goto('/inventory');
      
      // Test hover states
      await page.locator('[data-testid=\"product-card\"]').first().hover();
      await expect(page).toHaveScreenshot('product-card-hover.png', {
        clip: { x: 0, y: 0, width: 400, height: 300 },
      });
      
      // Test selected state
      await page.locator('[data-testid=\"product-card\"]').first().click();
      await expect(page).toHaveScreenshot('product-card-selected.png', {
        clip: { x: 0, y: 0, width: 400, height: 300 },
      });
    });
  });

  // Recipe Visual Tests
  test.describe('Recipe Visual Tests', () => {
    test('recipes grid view displays correctly', async ({ page }) => {
      await context.runner.seedTestData('recipe-testing');
      await runVisualTest(page, 'recipes-grid-view', context);
    });

    test('recipe detail view displays correctly', async ({ page }) => {
      await runVisualTest(page, 'recipe-detail-view', context);
    });

    test('recipe form visual consistency', async ({ page }) => {
      await page.goto('/recipes');
      await page.click('[data-testid=\"add-recipe-button\"]');
      
      await expect(page.locator('[data-testid=\"recipe-form-dialog\"]')).toHaveScreenshot(
        'recipe-form-dialog.png'
      );
    });
  });

  // Analytics Visual Tests
  test.describe('Analytics Visual Tests', () => {
    test('analytics dashboard displays correctly', async ({ page }) => {
      await context.runner.seedTestData('analytics-rich');
      await runVisualTest(page, 'analytics-dashboard', context);
    });

    test('analytics charts render consistently', async ({ page }) => {
      await context.runner.seedTestData('analytics-rich');
      await page.goto('/analytics');
      
      // Wait for charts to render
      await page.waitForSelector('[data-testid=\"analytics-chart\"]', { timeout: 10000 });
      await page.waitForTimeout(3000); // Additional wait for animations
      
      // Test individual chart components
      const charts = await page.locator('[data-testid=\"analytics-chart\"]').all();
      
      for (let i = 0; i < charts.length; i++) {
        await expect(charts[i]).toHaveScreenshot(`analytics-chart-${i}.png`, {
          mask: [page.locator('[data-testid=\"chart-tooltip\"]')],
        });
      }
    });

    test('analytics responsive behavior', async ({ page }) => {
      await context.runner.seedTestData('analytics-rich');
      
      // Test different viewport sizes
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 1024, height: 768, name: 'tablet' },
        { width: 375, height: 812, name: 'mobile' },
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/analytics');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`analytics-${viewport.name}.png`);
      }
    });
  });

  // Barcode Scanner Visual Tests
  test.describe('Barcode Scanner Visual Tests', () => {
    test('barcode scanner dialog displays correctly', async ({ page }) => {
      await runVisualTest(page, 'barcode-scanner-dialog', context);
    });

    test('barcode scanner camera states', async ({ page }) => {
      await page.goto('/inventory');
      await page.click('[data-testid=\"barcode-scan-button\"]');
      
      // Test loading state
      await expect(page.locator('[data-testid=\"scanner-loading\"]')).toHaveScreenshot(
        'scanner-loading.png'
      );
      
      // Test permission denied state (mock)
      await page.evaluate(() => {
        (window as any).__mockCameraPermission = 'denied';
      });
      
      await expect(page.locator('[data-testid=\"scanner-permission-denied\"]')).toHaveScreenshot(
        'scanner-permission-denied.png'
      );
    });
  });

  // Menu Creation Visual Tests
  test.describe('Menu Creation Visual Tests', () => {
    test('menu creation flow displays correctly', async ({ page }) => {
      await runVisualTest(page, 'menu-creation-flow', context);
    });

    test('menu creation steps visual consistency', async ({ page }) => {
      await page.goto('/menu');
      await page.click('[data-testid=\"create-menu-button\"]');
      
      const steps = ['select-recipes', 'customize-menu', 'review-menu'];
      
      for (const step of steps) {
        await page.click(`[data-testid=\"menu-step-${step}\"]`);
        await page.waitForTimeout(500);
        
        await expect(page.locator('[data-testid=\"menu-creation-content\"]')).toHaveScreenshot(
          `menu-step-${step}.png`
        );
      }
    });
  });

  // User Account Visual Tests
  test.describe('User Account Visual Tests', () => {
    test('user account page displays correctly', async ({ page }) => {
      await runVisualTest(page, 'user-account-page', context);
    });

    test('user preferences form visual consistency', async ({ page }) => {
      await page.goto('/account');
      await page.click('[data-testid=\"edit-preferences\"]');
      
      await expect(page.locator('[data-testid=\"preferences-form\"]')).toHaveScreenshot(
        'preferences-form.png'
      );
    });
  });

  // Error States Visual Tests
  test.describe('Error States Visual Tests', () => {
    test('404 error page displays correctly', async ({ page }) => {
      await runVisualTest(page, 'error-404-page', context);
    });

    test('network error states visual consistency', async ({ page }) => {
      // Mock network errors
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/inventory');
      await page.waitForSelector('[data-testid=\"error-message\"]');
      
      await expect(page.locator('[data-testid=\"error-container\"]')).toHaveScreenshot(
        'network-error.png'
      );
    });

    test('loading states visual consistency', async ({ page }) => {
      // Mock slow responses
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 2000);
      });
      
      await page.goto('/inventory');
      
      // Capture loading state
      await expect(page.locator('[data-testid=\"loading-skeleton\"]')).toHaveScreenshot(
        'loading-skeleton.png'
      );
    });
  });

  // Accessibility Visual Tests
  test.describe('Accessibility Visual Tests', () => {
    test('high contrast mode displays correctly', async ({ page }) => {
      await runVisualTest(page, 'high-contrast-inventory', context);
    });

    test('focus indicators visual consistency', async ({ page }) => {
      await page.goto('/inventory');
      
      // Test keyboard navigation focus states
      const focusableElements = [
        '[data-testid=\"add-product-button\"]',
        '[data-testid=\"search-input\"]',
        '[data-testid=\"filter-dropdown\"]',
        '[data-testid=\"product-card\"] button',
      ];
      
      for (const selector of focusableElements) {
        await page.focus(selector);
        await page.waitForTimeout(100);
        
        await expect(page.locator(selector)).toHaveScreenshot(
          `focus-${selector.replace(/[\[\]\"=\-\s]/g, '_')}.png`
        );
      }
    });

    test('reduced motion accessibility', async ({ page, browserName }) => {
      // Skip for browsers that don't support prefers-reduced-motion
      test.skip(browserName === 'webkit', 'WebKit doesn\'t fully support prefers-reduced-motion');
      
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/analytics');
      
      await expect(page).toHaveScreenshot('analytics-reduced-motion.png');
    });
  });

  // Cross-browser Compatibility Visual Tests
  test.describe('Cross-browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`homepage renders consistently in ${browserName}`, async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`homepage-${browserName}.png`, {
          fullPage: true,
        });
      });
    });
  });

  // Performance-aware Visual Tests
  test.describe('Performance Visual Tests', () => {
    test('large inventory visual performance', async ({ page }) => {
      const startTime = Date.now();
      
      await context.runner.seedTestData('performance-load');
      await page.goto('/inventory');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Ensure visual consistency even with large datasets
      await expect(page).toHaveScreenshot('large-inventory.png', {
        fullPage: true,
        timeout: 30000,
      });
      
      // Performance assertion
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });
  });
});

// Helper function to run visual tests with common setup
async function runVisualTest(
  page: Page, 
  scenarioName: string, 
  context: VisualTestContext
): Promise<void> {
  const scenario = visualConfig.getScenarios().find(s => s.name === scenarioName);
  if (!scenario) {
    throw new Error(`Visual test scenario '${scenarioName}' not found`);
  }

  const startTime = Date.now();
  
  // Set viewport for the scenario
  if (scenario.viewports.length > 0) {
    const viewport = scenario.viewports[0];
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
  }

  // Navigate to the page
  await page.goto(scenario.url);
  await page.waitForLoadState('networkidle');

  // Execute scenario actions
  if (scenario.actions) {
    for (const action of scenario.actions) {
      switch (action.type) {
        case 'click':
          if (action.selector) {
            await page.click(action.selector);
          }
          break;
        case 'hover':
          if (action.selector) {
            await page.hover(action.selector);
          }
          break;
        case 'type':
          if (action.selector && action.text) {
            await page.fill(action.selector, action.text);
          }
          break;
        case 'wait':
          if (action.delay) {
            await page.waitForTimeout(action.delay);
          }
          break;
      }
    }
  }

  // Apply visual test configuration
  const screenshotOptions: any = {
    threshold: scenario.config.threshold,
    mode: scenario.config.mode,
    animations: scenario.config.animations === 'disable' ? 'disabled' : 'allow',
  };

  // Add masking if specified
  if (scenario.config.mask) {
    screenshotOptions.mask = scenario.config.mask.map(m => page.locator(m.selector));
  }

  // Add clipping if specified
  if (scenario.config.clip) {
    screenshotOptions.clip = scenario.config.clip;
  }

  // Take the screenshot
  await expect(page).toHaveScreenshot(`${scenarioName}.png`, screenshotOptions);

  // Track performance
  const duration = Date.now() - startTime;
  context.performanceTracker.recordTest(scenarioName, duration);

  // AI analysis if enabled
  if (context.aiAnalyzer) {
    await context.aiAnalyzer.analyzeScreenshot(scenarioName, page);
  }

  // Validate performance threshold
  if (duration > 30000) { // 30 seconds
    console.warn(`Visual test '${scenarioName}' took ${duration}ms, which exceeds the recommended threshold`);
  }
}