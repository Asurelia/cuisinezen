#!/usr/bin/env node

/**
 * Script d'installation simple pour les tests E2E Playwright
 */

const fs = require('fs');
const path = require('path');

console.log('🎭 Configuration des tests E2E Playwright pour CuisineZen...\n');

// Créer le dossier test-results s'il n'existe pas
const testResultsDir = path.join(process.cwd(), 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
  console.log('📁 Dossier test-results créé');
}

// Vérifier que nos fichiers de tests existent
const testFiles = [
  'tests/e2e/navigation.spec.ts',
  'tests/e2e/add-product.spec.ts', 
  'tests/e2e/create-recipe.spec.ts'
];

console.log('🧪 Vérification des fichiers de tests...');
testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MANQUANT`);
  }
});

// Vérifier la configuration
if (fs.existsSync('playwright.config.ts')) {
  console.log('  ✅ playwright.config.ts');
} else {
  console.log('  ❌ playwright.config.ts - MANQUANT');
}

console.log('\n📋 Résumé de la configuration :');
console.log('  - Configuration minimale avec Chrome uniquement');
console.log('  - 3 tests E2E essentiels créés');
console.log('  - Pas de complexité inutile');
console.log('  - Tests robustes avec sélecteurs multiples');

console.log('\n🚀 Prochaines étapes :');
console.log('  1. Installer Playwright : npm install @playwright/test');
console.log('  2. Installer Chrome : npx playwright install chromium');
console.log('  3. Démarrer le serveur : npm run dev');
console.log('  4. Lancer les tests : npm run test:e2e:basic');

console.log('\n📚 Documentation disponible dans tests/e2e/README.md');