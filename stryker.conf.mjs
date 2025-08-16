// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress", "json"],
  testRunner: "vitest",
  coverageAnalysis: "perTest",
  
  // Mutation testing configuration
  mutate: [
    "src/**/*.ts",
    "src/**/*.tsx",
    "!src/**/*.test.ts",
    "!src/**/*.test.tsx",
    "!src/**/*.spec.ts",
    "!src/**/*.spec.tsx",
    "!src/**/*.d.ts",
    "!src/app/**/*.tsx", // Skip Next.js app directory components for now
    "!src/middleware.ts", // Skip middleware
    "!src/**/*.config.ts", // Skip config files
  ],

  // Test files to run
  testRunnerNodeArgs: ["--experimental-loader", "@stryker-mutator/vitest-runner/dist/loader.js"],
  
  // Directories and files to ignore
  ignoredByPattern: [
    "node_modules/**",
    "dist/**",
    ".next/**",
    "coverage/**",
    "test-results/**",
    "tests/e2e/**", // Skip E2E tests for mutation testing
    "*.config.*",
    "*.setup.*"
  ],

  // Focus on critical business logic
  mutator: {
    plugins: ["@stryker-mutator/typescript-checker"],
    excludedMutations: [
      "StringLiteral", // Skip string literal mutations (mostly UI text)
      "RegexLiteral",  // Skip regex mutations (complex and often not critical)
      "ArrayDeclaration", // Skip array literal mutations
    ]
  },

  // TypeScript support
  tsconfigFile: "tsconfig.json",
  typescriptChecker: {
    enabled: true,
    prioritizePerformanceOverAccuracy: false
  },

  // Performance settings
  concurrency: 4,
  maxConcurrentTestRunners: 4,
  timeoutMS: 60000,
  timeoutFactor: 1.5,
  dryRunTimeoutMinutes: 10,

  // Thresholds for mutation score
  thresholds: {
    high: 85,
    low: 70,
    break: 65
  },

  // HTML reporter configuration
  htmlReporter: {
    baseDir: "test-results/mutation"
  },

  // JSON reporter configuration
  jsonReporter: {
    fileName: "test-results/mutation-report.json"
  },

  // Plugin configuration
  plugins: [
    "@stryker-mutator/vitest-runner",
    "@stryker-mutator/typescript-checker"
  ],

  // Incremental mode (only test changed files)
  incremental: true,
  incrementalFile: "test-results/.stryker-tmp/incremental.json",

  // Files to include in the sandbox
  files: [
    "src/**/*.ts",
    "src/**/*.tsx",
    "tests/**/*.ts",
    "tests/**/*.tsx",
    "!tests/e2e/**",
    "vitest.config.ts",
    "tsconfig.json",
    "package.json"
  ],

  // Build command (if needed)
  buildCommand: "npm run typecheck",

  // Specific focus areas for mutation testing
  mutationRange: {
    // Focus on specific directories that contain business logic
    include: [
      "src/hooks/**",
      "src/services/**", 
      "src/lib/**",
      "!src/lib/firebase.ts" // Skip Firebase config
    ]
  },

  // Configure specific mutators
  mutatorOptions: {
    // Arithmetic mutations
    ArithmeticOperator: {
      enabled: true
    },
    // Boolean mutations
    BooleanLiteral: {
      enabled: true
    },
    // Conditional mutations
    ConditionalExpression: {
      enabled: true
    },
    // Equality mutations
    EqualityOperator: {
      enabled: true
    },
    // Logical mutations
    LogicalOperator: {
      enabled: true
    },
    // Method expression mutations
    MethodExpression: {
      enabled: true
    },
    // Object literal mutations
    ObjectLiteral: {
      enabled: false // Often causes many irrelevant mutations
    },
    // Update mutations
    UpdateOperator: {
      enabled: true
    }
  },

  // Warnings and error handling
  warnings: {
    unknown: "off",
    deprecated: "off"
  },

  // Disable mutations for specific patterns
  disableTypeChecks: false,
  allowConsoleColors: true,

  // Custom commands for different scenarios
  commandRunner: {
    command: "npm test"
  }
};

export default config;