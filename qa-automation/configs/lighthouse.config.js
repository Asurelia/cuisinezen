module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/inventory',
        'http://localhost:3000/recipes',
        'http://localhost:3000/analytics',
        'http://localhost:3000/account',
        'http://localhost:3000/shopping-list',
      ],
      settings: {
        chromeFlags: '--no-sandbox --headless',
        preset: 'desktop',
      },
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.85 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '../reports/lighthouse',
    },
  },
  extends: 'lighthouse:default',
  settings: {
    // CuisineZen specific audits
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    skipAudits: [
      'uses-http2',
      'canonical',
      'robots-txt',
      'tap-targets',
    ],
    // Firebase specific configurations
    blockedUrlPatterns: [
      'https://www.google-analytics.com/*',
      'https://www.googletagmanager.com/*',
    ],
    // Mobile device emulation
    emulatedFormFactor: 'mobile',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
  },
};