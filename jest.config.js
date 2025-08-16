const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/a11y/',
    '<rootDir>/tests/e2e/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/error.tsx',
    '!src/app/**/not-found.tsx',
    '!src/app/**/page.tsx', // Exclude page components from coverage
    '!src/lib/types.ts',
    '!src/lib/constants.ts',
    '!src/**/*.config.{js,ts}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'cobertura',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Specific thresholds for critical modules
    './src/lib/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/services/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/hooks/': {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  // Performance optimizations
  maxWorkers: '50%',
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Test timeout
  testTimeout: 10000,
  
  // Error handling
  errorOnDeprecated: true,
  bail: 0, // Don't stop on first failure
  verbose: false,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)