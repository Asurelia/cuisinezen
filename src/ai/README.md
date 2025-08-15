# 🤖 Agent IA CuisineZen

Agent IA intelligent pour l'analyse automatique, la génération de tests et la validation des fonctionnalités métier de CuisineZen.

## 🎯 Fonctionnalités

### 🔍 Analyse Automatique
- **Scanning d'interface**: Mappe tous les composants React interactifs
- **Détection des hooks**: Identifie useState, useForm, useFirestore, etc.
- **Analyse des interactions**: Boutons, formulaires, dialogs, uploads
- **Logique métier**: Détecte les flows de validation et Firebase

### 🧪 Génération de Tests
- **Tests E2E Playwright**: Avec assertions réelles et sélecteurs optimisés
- **Tests d'accessibilité**: Navigation clavier, ARIA, contraste
- **Tests métier**: Validation des flows critiques (produits, recettes, scanner)
- **Tests de régression**: Prévention des bugs sur les fonctionnalités existantes

### 🏢 Validation Métier
- **Gestion des produits**: Ajout, modification, catégorisation, lots
- **Gestion des recettes**: Création, ingrédients, temps de cuisson
- **Scanner codes-barres**: Détection, permissions caméra, intégration
- **Images**: Upload, optimisation, Firebase Storage
- **Firestore**: Synchronisation temps réel, sécurité, hors-ligne
- **Analytics**: Tracking d'usage, métriques de performance

### 🔧 Auto-amélioration
- **Correction automatique**: Analyse des échecs et propose des fixes
- **Optimisation**: Détecte les tests lents et suggère des améliorations
- **Gaps de couverture**: Identifie les tests manquants
- **Recommandations**: Actions prioritaires basées sur les résultats

## 🚀 Utilisation

### Scripts NPM

```bash
# Analyse complète avec génération de tests
npm run ai:analyze

# Analyse rapide (validation seulement)
npm run ai:quick

# Statistiques du projet
npm run ai:stats

# Modules individuels
npm run ai:scan      # Scanner de composants
npm run ai:tests     # Générateur de tests E2E
npm run ai:validate  # Validateur métier
npm run ai:improve   # Système d'amélioration
```

### Démonstration

```bash
# Démo interactive
tsx src/ai/demo.ts

# Démo complète avec analyse
tsx src/ai/demo.ts --full
```

### Utilisation Programmatique

```typescript
import { cuisineZenAgent } from './src/ai/cuisinezen-ai-agent';

// Analyse complète
const results = await cuisineZenAgent.runFullAnalysis();

// Analyse rapide
const quickResults = await cuisineZenAgent.runQuickAnalysis();

// Tests spécifiques
const tests = await cuisineZenAgent.generateTestsForComponents([
  'AddProductDialog',
  'RecipeFormDialog'
]);

// Validation spécifique
const validation = await cuisineZenAgent.validateSpecificFeatures([
  'Gestion des Produits',
  'Scanner de Codes-barres'
]);
```

## 📊 Résultats

### Fichiers Générés

```
tests/ai-generated/
├── e2e-tests.spec.ts              # Tests E2E Playwright
├── accessibility-tests.spec.ts     # Tests d'accessibilité
├── playwright.config.ts            # Configuration Playwright
├── test-metadata.json             # Métadonnées des tests
└── reports/
    ├── analysis-report.md          # Analyse des composants
    ├── business-validation-report.md # Validation métier
    ├── improvement-report.md       # Suggestions d'amélioration
    └── executive-summary.md        # Synthèse exécutive
```

### Exemple de Tests Générés

```typescript
// Test E2E automatique pour AddProductDialog
test('should add a new product successfully', async ({ page }) => {
  await page.click('[data-testid="add-product-button"]');
  
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  
  await page.fill('input[name="name"]', 'Tomates cerises bio');
  await page.selectOption('select[name="category"]', 'frais');
  await page.fill('input[name="quantity"]', '2');
  
  await page.click('button:has-text("Ajouter le produit")');
  
  await expect(page.locator('text=Tomates cerises bio')).toBeVisible();
});
```

## 🎯 Métriques de Qualité

L'agent génère un **Score de Qualité Global** basé sur:

- **Taux de passage des tests** (40%)
- **Couverture des fonctionnalités métier** (40%) 
- **Performance des tests** (20%)

### Seuils de Qualité

- 🏆 **90%+**: Excellent
- 🥇 **80-89%**: Très bon  
- 🥈 **70-79%**: Bon
- 🥉 **60-69%**: Acceptable
- ⚠️ **40-59%**: À améliorer
- 🚨 **<40%**: Critique

## 🔧 Configuration

### Options de l'Agent

```typescript
const agent = new CuisineZenAIAgent({
  projectRoot: process.cwd(),
  outputDir: 'tests/ai-generated',
  generateTests: true,
  runValidation: true,
  autoImprove: true,
  generateReports: true
});
```

### Composants Supportés

L'agent analyse automatiquement:

- ✅ **Dialogs**: AddProductDialog, RecipeFormDialog, etc.
- ✅ **Formulaires**: Avec validation Zod et react-hook-form
- ✅ **Uploads**: Images avec Firebase Storage
- ✅ **Scanner**: Codes-barres avec ZXing
- ✅ **Listes**: Inventaire, recettes avec pagination
- ✅ **Analytics**: Tracking d'événements

## 🏗️ Architecture

```
src/ai/
├── cuisinezen-ai-agent.ts       # Interface principale
├── test-agent.ts                # Scanner de composants
├── demo.ts                      # Démonstration
├── test-generators/
│   └── e2e-generator.ts         # Générateur tests E2E
├── validators/
│   └── business-validator.ts    # Validateur métier
└── auto-improvement/
    └── test-improver.ts         # Système d'amélioration
```

## 🎯 Fonctionnalités Avancées

### Auto-correction

L'agent détecte et corrige automatiquement:

- **Sélecteurs invalides**: Attentes explicites d'éléments
- **Timeouts**: Optimisation des temps d'attente
- **Permissions**: Configuration caméra/microphone
- **Validations**: Adaptation aux schémas Zod actuels

### Tests Prédictifs

Génère des tests pour:

- **Cas d'erreur**: Données invalides, pannes réseau
- **Performance**: Temps de réponse, optimisations
- **Accessibilité**: Navigation, ARIA, contrastes
- **Sécurité**: Permissions, validation côté client

### Intégration CI/CD

```bash
# Intégration recommandée
npm run ai:quick          # Analyse rapide
npm run ai:analyze        # Si changements détectés
npm run test:e2e          # Exécution des tests générés
```

## 📈 Évolution

L'agent s'améliore automatiquement en:

- **Apprenant** des échecs de tests
- **Adaptant** les sélecteurs aux changements UI
- **Optimisant** les performances
- **Étendant** la couverture des nouveaux composants

## 🆘 Support

### Logs et Debugging

```bash
# Mode verbose
DEBUG=cuisinezen:ai npm run ai:analyze

# Logs détaillés
tsx src/ai/cuisinezen-ai-agent.ts analyze --verbose
```

### Erreurs Communes

1. **Composants non trouvés**: Vérifier les chemins dans `src/components/`
2. **Tests échoués**: Examiner les suggestions d'amélioration
3. **Permissions**: Configurer les accès caméra pour les tests

### Contribution

Pour améliorer l'agent:

1. **Analyser** les nouveaux composants CuisineZen
2. **Étendre** les validateurs métier
3. **Optimiser** les générateurs de tests
4. **Améliorer** les corrections automatiques

---

🤖 **Agent IA CuisineZen** - Automatisation intelligente des tests pour une qualité optimale.