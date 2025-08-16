import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * CuisineZen Advanced Test Automation Configuration
 * Integrated with DoD Quality Gates System
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts', './automation-setup.ts'],
    globals: true,
    css: true,
    
    // Advanced coverage configuration for DoD compliance
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'text-summary', 'cobertura'],
      reportsDirectory: '../reports/coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/qa-automation/**',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/stories/**',
        '**/mocks/**',
        '**/fixtures/**',
      ],
      // Enhanced thresholds for CuisineZen DoD compliance
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        // Critical business components - high coverage required
        'src/components/product-card.tsx': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/components/recipe-card.tsx': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/components/barcode-scanner-dialog.tsx': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/components/inventory-list.tsx': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        // Services and hooks - business logic critical
        'src/services/**/*.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/hooks/**/*.ts': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/lib/**/*.ts': {
          branches: 88,
          functions: 88,
          lines: 88,
          statements: 88,
        },
      },
      // Advanced coverage analysis
      all: true,
      clean: true,
      skipFull: false,
      100: true,
    },

    // Comprehensive test file patterns
    include: [
      '../tests/unit/**/*.{test,spec}.{js,ts,tsx}',
      '../tests/integration/**/*.{test,spec}.{js,ts,tsx}',
      '../tests/contracts/**/*.{test,spec}.{js,ts,tsx}',
      '../tests/performance/**/*.{test,spec}.{js,ts,tsx}',
      '../../src/**/*.{test,spec}.{js,ts,tsx}',
    ],
    
    // Exclude patterns for automation
    exclude: [
      '../tests/e2e/**/*',
      '../tests/visual/**/*',
      '../tests/load/**/*',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
    ],

    // Mock configuration
    alias: {
      '@': path.resolve(__dirname, '../../src'),
      '@/components': path.resolve(__dirname, '../../src/components'),
      '@/lib': path.resolve(__dirname, '../../src/lib'),
      '@/hooks': path.resolve(__dirname, '../../src/hooks'),
      '@/services': path.resolve(__dirname, '../../src/services'),
    },

    // Test timeout
    testTimeout: 10000,

    // Advanced reporter configuration for DoD integration
    reporter: [
      'default',
      'json',
      'html',
      'junit',
      'verbose',
      ['./custom-reporters/dod-reporter.ts', {}],
      ['./custom-reporters/quality-gate-reporter.ts', {}],
    ],

    outputFile: {
      json: '../reports/vitest-results.json',
      html: '../reports/vitest-html/index.html',
      junit: '../reports/vitest-junit.xml',
    },
    
    // Advanced test configuration for automation
    sequence: {
      concurrent: true,
      shuffle: true,
      hooks: 'parallel',
    },
    
    // Retry configuration for flaky test handling
    retry: process.env.CI ? 2 : 0,
    
    // Performance monitoring
    slowTestThreshold: 5000,
    
    // Test isolation
    isolate: true,

    // Concurrent testing
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // Enhanced Firebase testing configuration
    env: {
      NODE_ENV: 'test',
      FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
      FIRESTORE_EMULATOR_HOST: 'localhost:8080',
      FIREBASE_STORAGE_EMULATOR_HOST: 'localhost:9199',
      FIREBASE_FUNCTIONS_EMULATOR_HOST: 'localhost:5001',
      GOOGLE_CLOUD_PROJECT: 'cuisinezen-test',
      // Test automation flags
      TEST_AUTOMATION_MODE: 'true',
      SKIP_EXTERNAL_APIS: 'true',
      ENABLE_TEST_METRICS: 'true',
      DOD_VALIDATION_MODE: 'true',
    },
    
    // Watch configuration for development
    watch: {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/reports/**',
      ],
    },
    
    // Test data management
    restoreMocks: true,
    clearMocks: true,
    resetMocks: true,
    
    // Advanced mock configuration
    deps: {
      inline: [
        /^@?firebase/,
        /@testing-library/,
        /^genkit/,
      ],
    },
  },

  // Resolve configuration for Next.js compatibility
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
    },
  },
});