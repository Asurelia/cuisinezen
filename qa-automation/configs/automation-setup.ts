/**
 * CuisineZen Advanced Test Automation Setup
 * Integrated with DoD Quality Gates System
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { TestDataManager } from '../utils/test-data-manager';
import { MockFirebaseEmulator } from '../utils/mock-firebase';
import { PerformanceTracker } from '../utils/performance-tracker';
import { QualityGateValidator } from '../utils/quality-gate-validator';
import { TestMetricsCollector } from '../utils/test-metrics-collector';

// Global test environment setup
export class TestAutomationEnvironment {
  private static instance: TestAutomationEnvironment;
  private server: any;
  private dataManager: TestDataManager;
  private firebaseEmulator: MockFirebaseEmulator;
  private performanceTracker: PerformanceTracker;
  private qualityValidator: QualityGateValidator;
  private metricsCollector: TestMetricsCollector;

  private constructor() {
    this.dataManager = new TestDataManager();
    this.firebaseEmulator = new MockFirebaseEmulator();
    this.performanceTracker = new PerformanceTracker();
    this.qualityValidator = new QualityGateValidator();
    this.metricsCollector = new TestMetricsCollector();
  }

  static getInstance(): TestAutomationEnvironment {
    if (!TestAutomationEnvironment.instance) {
      TestAutomationEnvironment.instance = new TestAutomationEnvironment();
    }
    return TestAutomationEnvironment.instance;
  }

  async setup(): Promise<void> {
    console.log('🚀 Setting up CuisineZen Test Automation Environment...');

    // Start MSW server for API mocking
    await this.setupMSWServer();

    // Initialize Firebase emulators
    await this.firebaseEmulator.initialize();

    // Setup test data
    await this.dataManager.initializeTestData();

    // Start performance tracking
    this.performanceTracker.startTracking();

    // Initialize metrics collection
    this.metricsCollector.initialize();

    console.log('✅ Test Automation Environment ready!');
  }

  async teardown(): Promise<void> {
    console.log('🧹 Cleaning up Test Automation Environment...');

    // Stop MSW server
    this.server?.close();

    // Cleanup Firebase emulators
    await this.firebaseEmulator.cleanup();

    // Clear test data
    await this.dataManager.cleanup();

    // Stop performance tracking
    this.performanceTracker.stopTracking();

    // Generate metrics report
    await this.metricsCollector.generateReport();

    console.log('✅ Test Automation Environment cleaned up!');
  }

  private async setupMSWServer(): Promise<void> {
    const { rest } = await import('msw');
    
    // Define MSW handlers for CuisineZen APIs
    const handlers = [
      // Authentication API
      rest.post('/api/auth/session', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            user: {
              id: 'test-user-id',
              email: 'test@cuisinezen.com',
              name: 'Test User',
            },
            session: {
              token: 'test-token',
              expires: Date.now() + 3600000,
            },
          })
        );
      }),

      // Products API
      rest.get('/api/products', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json(this.dataManager.getTestProducts())
        );
      }),

      rest.post('/api/products', async (req, res, ctx) => {
        const product = await req.json();
        return res(
          ctx.status(201),
          ctx.json({
            id: 'test-product-id',
            ...product,
            createdAt: new Date().toISOString(),
          })
        );
      }),

      // Recipes API
      rest.get('/api/recipes', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json(this.dataManager.getTestRecipes())
        );
      }),

      // Analytics API
      rest.get('/api/analytics/overview', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json(this.dataManager.getTestAnalytics())
        );
      }),

      // Barcode Scanner API
      rest.post('/api/barcode/scan', async (req, res, ctx) => {
        const { barcode } = await req.json();
        return res(
          ctx.status(200),
          ctx.json({
            product: this.dataManager.getProductByBarcode(barcode),
            confidence: 0.95,
          })
        );
      }),

      // Error simulation for testing
      rest.get('/api/test/error', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Test error' }));
      }),
    ];

    this.server = setupServer(...handlers);
    this.server.listen({ onUnhandledRequest: 'warn' });
  }

  // Helper methods for test scenarios
  async seedDatabase(scenario: string): Promise<void> {
    await this.dataManager.seedScenario(scenario);
  }

  async clearDatabase(): Promise<void> {
    await this.dataManager.clearAll();
  }

  startPerformanceTest(testName: string): void {
    this.performanceTracker.startTest(testName);
  }

  endPerformanceTest(testName: string): PerformanceMetrics {
    return this.performanceTracker.endTest(testName);
  }

  validateQualityGates(testResults: any): QualityGateResult {
    return this.qualityValidator.validate(testResults);
  }
}

// Global setup and teardown
const testEnv = TestAutomationEnvironment.getInstance();

beforeAll(async () => {
  await testEnv.setup();
}, 30000);

afterAll(async () => {
  await testEnv.teardown();
});

beforeEach(async () => {
  // Clean up DOM after each test
  cleanup();
  
  // Reset all mocks
  vi.clearAllMocks();
  vi.resetAllMocks();
  
  // Clear local storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset Firebase emulator state
  await testEnv.clearDatabase();
  
  // Start performance tracking for individual test
  if (expect.getState().currentTestName) {
    testEnv.startPerformanceTest(expect.getState().currentTestName);
  }
});

afterEach(async () => {
  // End performance tracking for individual test
  if (expect.getState().currentTestName) {
    const metrics = testEnv.endPerformanceTest(expect.getState().currentTestName);
    
    // Validate performance thresholds
    if (metrics.duration > 5000) {
      console.warn(`⚠️ Slow test detected: ${expect.getState().currentTestName} took ${metrics.duration}ms`);
    }
  }
  
  // Additional cleanup
  cleanup();
});

// Custom global test utilities
declare global {
  namespace Vi {
    interface TestContext {
      seedDatabase: (scenario: string) => Promise<void>;
      clearDatabase: () => Promise<void>;
      expectPerformance: (threshold: number) => void;
      validateQualityGates: () => QualityGateResult;
    }
  }
}

// Export types for testing
export interface PerformanceMetrics {
  testName: string;
  duration: number;
  memoryUsage: number;
  renderTime?: number;
  apiCalls: number;
}

export interface QualityGateResult {
  passed: boolean;
  score: number;
  violations: Array<{
    rule: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
  }>;
}

// Enhanced matchers for CuisineZen testing
expect.extend({
  toBeAccessible(received: HTMLElement) {
    // Basic accessibility checks
    const hasRole = received.getAttribute('role') || received.tagName.toLowerCase();
    const hasLabel = received.getAttribute('aria-label') || 
                    received.getAttribute('aria-labelledby') ||
                    received.textContent;
    
    const pass = hasRole && hasLabel;
    
    return {
      message: () => 
        pass 
          ? `Expected element to not be accessible`
          : `Expected element to be accessible (missing role or label)`,
      pass,
    };
  },
  
  toHavePerformantRender(received: () => void, threshold = 100) {
    const start = performance.now();
    received();
    const duration = performance.now() - start;
    
    const pass = duration <= threshold;
    
    return {
      message: () =>
        pass
          ? `Expected render to be slower than ${threshold}ms`
          : `Expected render to be faster than ${threshold}ms, but took ${duration}ms`,
      pass,
    };
  },
  
  toPassQualityGates(received: any) {
    const testEnv = TestAutomationEnvironment.getInstance();
    const result = testEnv.validateQualityGates(received);
    
    return {
      message: () =>
        result.passed
          ? `Expected quality gates to fail`
          : `Quality gates failed: ${result.violations.map(v => v.message).join(', ')}`,
      pass: result.passed,
    };
  },
});