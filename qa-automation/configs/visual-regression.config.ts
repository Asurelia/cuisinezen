/**
 * CuisineZen Visual Regression Testing Configuration
 * Advanced visual testing automation with AI-powered analysis
 */

import { PlaywrightTestConfig } from '@playwright/test';

export interface VisualTestConfig {
  threshold: number;
  mode: 'pixel' | 'layout' | 'content';
  animations: 'disable' | 'allow';
  fonts: 'wait' | 'fallback';
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  mask?: Array<{
    selector: string;
    color?: string;
  }>;
}

export interface VisualTestScenario {
  name: string;
  url: string;
  viewports: Array<{
    width: number;
    height: number;
    deviceName?: string;
  }>;
  actions?: Array<{
    type: 'click' | 'hover' | 'type' | 'wait';
    selector?: string;
    text?: string;
    delay?: number;
  }>;
  config: VisualTestConfig;
}

export class VisualRegressionConfig {
  private scenarios: VisualTestScenario[] = [
    // Homepage scenarios
    {
      name: 'homepage-desktop',
      url: '/',
      viewports: [
        { width: 1920, height: 1080, deviceName: 'Desktop' },
        { width: 1366, height: 768, deviceName: 'Laptop' },
      ],
      config: {
        threshold: 0.1,
        mode: 'pixel',
        animations: 'disable',
        fonts: 'wait',
      },
    },
    {
      name: 'homepage-mobile',
      url: '/',
      viewports: [
        { width: 375, height: 812, deviceName: 'iPhone X' },
        { width: 360, height: 640, deviceName: 'Android' },
      ],
      config: {
        threshold: 0.15,
        mode: 'pixel',
        animations: 'disable',
        fonts: 'wait',
      },
    },

    // Inventory page scenarios
    {
      name: 'inventory-empty-state',
      url: '/inventory',
      viewports: [
        { width: 1920, height: 1080 },
        { width: 375, height: 812 },
      ],
      config: {
        threshold: 0.1,
        mode: 'layout',
        animations: 'disable',
        fonts: 'wait',
      },
    },
    {
      name: 'inventory-with-products',
      url: '/inventory',
      viewports: [
        { width: 1920, height: 1080 },
        { width: 768, height: 1024 },
        { width: 375, height: 812 },
      ],
      actions: [
        { type: 'wait', delay: 2000 }, // Wait for products to load
      ],
      config: {
        threshold: 0.2,
        mode: 'content',
        animations: 'disable',
        fonts: 'wait',
        mask: [
          { selector: '[data-testid=\"expiry-date\"]', color: '#000000' },
          { selector: '[data-testid=\"last-updated\"]', color: '#000000' },
        ],
      },
    },
    {
      name: 'inventory-add-product-dialog',
      url: '/inventory',
      viewports: [
        { width: 1920, height: 1080 },
        { width: 375, height: 812 },
      ],
      actions: [
        { type: 'click', selector: '[data-testid=\"add-product-button\"]' },
        { type: 'wait', delay: 500 },
      ],
      config: {
        threshold: 0.1,
        mode: 'pixel',
        animations: 'disable',
        fonts: 'wait',
      },
    },

    // Recipe page scenarios
    {
      name: 'recipes-grid-view',
      url: '/recipes',
      viewports: [
        { width: 1920, height: 1080 },
        { width: 1024, height: 768 },
        { width: 375, height: 812 },
      ],
      config: {
        threshold: 0.15,
        mode: 'layout',
        animations: 'disable',
        fonts: 'wait',
        mask: [
          { selector: '[data-testid=\"recipe-rating\"]', color: '#888888' },
          { selector: '[data-testid=\"recipe-reviews\"]', color: '#888888' },
        ],
      },
    },
    {
      name: 'recipe-detail-view',
      url: '/recipes',
      viewports: [
        { width: 1920, height: 1080 },
        { width: 375, height: 812 },
      ],
      actions: [
        { type: 'click', selector: '[data-testid=\"recipe-card\"]:first-child' },
        { type: 'wait', delay: 1000 },
      ],
      config: {
        threshold: 0.2,
        mode: 'content',
        animations: 'disable',
        fonts: 'wait',
      },
    },

    // Analytics dashboard scenarios
    {
      name: 'analytics-dashboard',
      url: '/analytics',
      viewports: [
        { width: 1920, height: 1080 },
        { width: 1024, height: 768 },
        { width: 375, height: 812 },
      ],
      actions: [
        { type: 'wait', delay: 3000 }, // Wait for charts to render
      ],
      config: {
        threshold: 0.3,
        mode: 'layout',
        animations: 'disable',
        fonts: 'wait',
        mask: [
          { selector: '[data-testid=\"chart-data\"]', color: '#f0f0f0' },
          { selector: '[data-testid=\"metric-value\"]', color: '#f0f0f0' },
          { selector: '[data-testid=\"date-range\"]', color: '#000000' },
        ],
      },
    },

    // Barcode scanner scenarios
    {
      name: 'barcode-scanner-dialog',
      url: '/inventory',
      viewports: [
        { width: 375, height: 812 },
        { width: 414, height: 896 },
      ],
      actions: [
        { type: 'click', selector: '[data-testid=\"barcode-scan-button\"]' },
        { type: 'wait', delay: 1000 },
      ],
      config: {
        threshold: 0.1,
        mode: 'pixel',
        animations: 'disable',
        fonts: 'wait',
        mask: [
          { selector: '[data-testid=\"camera-preview\"]', color: '#000000' },
        ],
      },
    },

    // Menu creation scenarios
    {
      name: 'menu-creation-flow',
      url: '/menu',
      viewports: [
        { width: 1920, height: 1080 },
        { width: 768, height: 1024 },
      ],
      actions: [
        { type: 'click', selector: '[data-testid=\"create-menu-button\"]' },
        { type: 'wait', delay: 500 },
      ],
      config: {
        threshold: 0.15,
        mode: 'layout',
        animations: 'disable',
        fonts: 'wait',
      },
    },

    // User account scenarios
    {
      name: 'user-account-page',
      url: '/account',
      viewports: [
        { width: 1920, height: 1080 },
        { width: 375, height: 812 },
      ],
      config: {
        threshold: 0.1,
        mode: 'pixel',
        animations: 'disable',
        fonts: 'wait',
        mask: [
          { selector: '[data-testid=\"user-avatar\"]', color: '#cccccc' },
          { selector: '[data-testid=\"last-login\"]', color: '#000000' },
        ],
      },
    },

    // Error state scenarios
    {
      name: 'error-404-page',
      url: '/non-existent-page',
      viewports: [
        { width: 1920, height: 1080 },
        { width: 375, height: 812 },
      ],
      config: {
        threshold: 0.05,
        mode: 'pixel',
        animations: 'disable',
        fonts: 'wait',
      },
    },

    // Theme variations
    {
      name: 'dark-theme-homepage',
      url: '/',
      viewports: [
        { width: 1920, height: 1080 },
        { width: 375, height: 812 },
      ],
      actions: [
        { type: 'click', selector: '[data-testid=\"theme-toggle\"]' },
        { type: 'wait', delay: 500 },
      ],
      config: {
        threshold: 0.2,
        mode: 'pixel',
        animations: 'disable',
        fonts: 'wait',
      },
    },

    // Accessibility high contrast mode
    {
      name: 'high-contrast-inventory',
      url: '/inventory',
      viewports: [
        { width: 1920, height: 1080 },
      ],
      actions: [
        { type: 'wait', delay: 1000 },
      ],
      config: {
        threshold: 0.25,
        mode: 'pixel',
        animations: 'disable',
        fonts: 'wait',
      },
    },
  ];

  getScenarios(): VisualTestScenario[] {
    return this.scenarios;
  }

  getScenariosByCategory(category: string): VisualTestScenario[] {
    return this.scenarios.filter(scenario => scenario.name.includes(category));
  }

  getPlaywrightConfig(): PlaywrightTestConfig {
    return {
      testDir: '../tests/visual',
      fullyParallel: true,
      forbidOnly: !!process.env.CI,
      retries: process.env.CI ? 2 : 0,
      workers: process.env.CI ? 2 : undefined,
      
      reporter: [
        ['html', { outputFolder: '../reports/visual-html' }],
        ['json', { outputFile: '../reports/visual-results.json' }],
        ['./custom-reporters/visual-reporter.ts', {}],
      ],
      
      use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        
        // Visual testing specific settings
        ignoreHTTPSErrors: true,
        colorScheme: 'light',
        
        // Disable animations for consistent screenshots
        reducedMotion: 'reduce',
      },

      expect: {
        // Global visual comparison settings
        toHaveScreenshot: {
          threshold: 0.2,
          mode: 'pixel',
          animations: 'disabled',
        },
        toMatchSnapshot: {
          threshold: 0.15,
        },
      },

      projects: [
        {
          name: 'visual-desktop',
          use: {
            viewport: { width: 1920, height: 1080 },
            deviceScaleFactor: 1,
          },
          testMatch: '**/visual/**/*.spec.ts',
        },
        {
          name: 'visual-tablet',
          use: {
            viewport: { width: 768, height: 1024 },
            deviceScaleFactor: 2,
          },
          testMatch: '**/visual/**/*.spec.ts',
        },
        {
          name: 'visual-mobile',
          use: {
            viewport: { width: 375, height: 812 },
            deviceScaleFactor: 2,
          },
          testMatch: '**/visual/**/*.spec.ts',
        },
        {
          name: 'visual-high-contrast',
          use: {
            viewport: { width: 1920, height: 1080 },
            colorScheme: 'dark',
            forcedColors: 'active',
          },
          testMatch: '**/visual/accessibility/*.spec.ts',
        },
      ],

      webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },

      timeout: 60 * 1000,
      globalTimeout: 60 * 60 * 1000, // 1 hour for all visual tests
      
      outputDir: '../reports/visual-test-results',
    };
  }

  // Advanced visual testing utilities
  generateDynamicScenarios(pages: string[]): VisualTestScenario[] {
    const viewports = [
      { width: 1920, height: 1080, deviceName: 'Desktop' },
      { width: 768, height: 1024, deviceName: 'Tablet' },
      { width: 375, height: 812, deviceName: 'Mobile' },
    ];

    return pages.flatMap(page => 
      viewports.map(viewport => ({
        name: `${page.replace('/', '')}-${viewport.deviceName?.toLowerCase()}`,
        url: page,
        viewports: [viewport],
        config: {
          threshold: 0.15,
          mode: 'pixel' as const,
          animations: 'disable' as const,
          fonts: 'wait' as const,
        },
      }))
    );
  }

  // AI-powered visual analysis configuration
  getAIAnalysisConfig() {
    return {
      enableAIAnalysis: process.env.ENABLE_AI_VISUAL_ANALYSIS === 'true',
      aiProvider: 'openai',
      analysisTypes: [
        'layout-changes',
        'color-differences',
        'text-variations',
        'element-positioning',
        'accessibility-visual',
      ],
      confidenceThreshold: 0.8,
      reportingLevel: 'detailed',
    };
  }

  // Performance-aware visual testing
  getPerformanceVisualConfig() {
    return {
      enablePerformanceTracking: true,
      maxScreenshotTime: 5000,
      maxComparisonTime: 3000,
      parallelProcessing: true,
      compressionLevel: 8,
      caching: {
        enabled: true,
        strategy: 'content-hash',
        ttl: 24 * 60 * 60 * 1000, // 24 hours
      },
    };
  }
}

export default new VisualRegressionConfig();