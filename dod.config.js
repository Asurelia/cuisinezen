// Configuration DoD simple et pragmatique pour CuisineZen
module.exports = {
  // Seuils de qualité réalistes
  gates: {
    coverage: {
      lines: 70,      // Réaliste pour commencer
      branches: 60,
      functions: 70
    },
    tests: {
      unit: true,     // Au moins quelques tests unitaires
      e2e: true       // Au moins quelques tests E2E
    },
    code: {
      typescript: true,  // Pas d'erreurs TypeScript
      eslint: true      // Pas d'erreurs ESLint
    },
    performance: {
      lighthouse: 80,   // Score Lighthouse minimum
      bundleSize: 500   // KB max pour le bundle principal
    }
  },
  
  // Scripts à exécuter
  scripts: {
    test: 'npm run test:run',
    lint: 'npm run lint',
    typecheck: 'npm run typecheck',
    e2e: 'npm run test:e2e:basic',
    build: 'npm run build'
  }
};
