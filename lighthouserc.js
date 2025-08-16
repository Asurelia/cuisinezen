module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000', 'http://localhost:3000/inventory', 'http://localhost:3000/recipes'],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready - started server on',
      startServerReadyTimeout: 20000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],
        
        // Performance metrics - seuils stricts
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // LCP < 2.5s
        'total-blocking-time': ['error', { maxNumericValue: 200 }], // TBT < 200ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // CLS < 0.1
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }], // FCP < 1.8s
        'speed-index': ['error', { maxNumericValue: 3400 }], // SI < 3.4s
        'interactive': ['error', { maxNumericValue: 3800 }], // TTI < 3.8s
        
        // Resource optimization
        'unused-javascript': ['warn', { maxNumericValue: 30000 }], // < 30KB unused JS
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }], // < 20KB unused CSS
        'render-blocking-resources': ['warn', { maxNumericValue: 1000 }], // < 1s blocking
        'unminified-javascript': ['error', { maxNumericValue: 0 }], // No unminified JS
        'unminified-css': ['error', { maxNumericValue: 0 }], // No unminified CSS
        
        // Image optimization
        'modern-image-formats': ['warn', { maxNumericValue: 50000 }], // < 50KB savings
        'offscreen-images': ['warn', { maxNumericValue: 50000 }], // < 50KB savings
        'uses-optimized-images': ['warn', { maxNumericValue: 50000 }], // < 50KB savings
        'uses-webp-images': ['warn', { maxNumericValue: 50000 }], // < 50KB savings
        'uses-responsive-images': ['warn', { maxNumericValue: 50000 }], // < 50KB savings
        
        // Accessibility
        'color-contrast': ['error', { minScore: 1 }],
        'image-alt': ['error', { minScore: 1 }],
        'label': ['error', { minScore: 1 }],
        'link-name': ['error', { minScore: 1 }],
        'button-name': ['error', { minScore: 1 }],
        'document-title': ['error', { minScore: 1 }],
        'html-has-lang': ['error', { minScore: 1 }],
        'meta-viewport': ['error', { minScore: 1 }],
        
        // Security
        'is-on-https': ['error', { minScore: 1 }],
        'uses-http2': ['warn', { minScore: 1 }],
        'external-anchors-use-rel-noopener': ['error', { minScore: 1 }],
        'geolocation-on-start': ['error', { minScore: 1 }],
        'notification-on-start': ['error', { minScore: 1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};