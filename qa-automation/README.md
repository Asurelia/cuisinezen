# CuisineZen AI DoD Auditor

Un système complet d'assurance qualité automatisé avec intelligence artificielle pour CuisineZen, adapté aux applications Next.js 15 avec Firebase.

## 🎯 Vue d'ensemble

Ce système implémente une approche "Definition of Done" (DoD) automatisée avec 10 gates de qualité :

1. **Code Quality & Standards** - ESLint, TypeScript, Prettier
2. **Security** - Scan des vulnérabilités, règles Firebase, secrets
3. **Unit Testing** - Tests unitaires avec couverture et mutation testing
4. **Integration Testing** - Tests d'intégration Firebase
5. **E2E Testing** - Tests end-to-end avec Playwright
6. **Performance** - Lighthouse, Web Vitals, optimisation bundle
7. **Accessibility** - Tests WCAG 2.1-AA avec axe-core
8. **Visual Testing** - Tests de régression visuelle
9. **Cross-browser** - Compatibilité multi-navigateurs
10. **Mobile Testing** - Tests responsive et mobile

## 🚀 Démarrage rapide

### Installation des dépendances

```bash
npm install
```

### Configuration initiale

```bash
# Scanner les composants existants
npm run qa:scan-components

# Générer les tests automatiquement
npm run qa:generate-tests

# Lancer l'audit IA complet
npm run qa:ai-audit
```

### Exécution des gates de qualité

```bash
# Tous les gates en une fois
npm run gates:all

# Gates individuels
npm run gates:code-quality
npm run gates:security
npm run gates:testing
npm run gates:e2e
npm run gates:performance

# Vérification des gates
npm run gates:check
```

## 📁 Structure du projet

```
qa-automation/
├── policies/                    # Politiques DoD YAML
│   └── cuisinezen-dod.yaml
├── configs/                     # Configurations outils
│   ├── playwright.config.ts
│   ├── vitest.config.ts
│   ├── stryker.config.json
│   └── lighthouse.config.js
├── agents/                      # Agents IA
│   ├── generators/
│   │   └── test-generator.js    # Génération automatique de tests
│   └── analyzers/
│       └── ai-auditor.js        # Audit qualité IA
├── scanners/                    # Scanners de code
│   └── component-scanner.js     # Mapping composants React
├── gates/                       # Vérificateurs de gates
│   └── gate-checker.js          # Validation des gates de qualité
├── tests/                       # Tests générés
│   ├── unit/                    # Tests unitaires
│   ├── integration/             # Tests d'intégration
│   ├── e2e/                     # Tests end-to-end
│   ├── performance/             # Tests de performance
│   ├── accessibility/           # Tests d'accessibilité
│   └── visual/                  # Tests visuels
└── reports/                     # Rapports générés
    ├── component-map.json
    ├── test-generation-report.json
    └── ai-audit-report.json
```

## 🔧 Configuration

### Policies DoD

Le fichier `policies/cuisinezen-dod.yaml` définit :

- Les gates de qualité activés
- Les seuils de performance
- Les composants critiques à tester
- Les scénarios métier spécifiques à CuisineZen

### Variables d'environnement

```bash
# Pour les tests IA
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Pour les émulateurs Firebase
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
```

## 🤖 Agents IA

### Scanner de composants

Analyse automatiquement la base de code pour :
- Mapper tous les composants React
- Identifier les patterns et anti-patterns
- Calculer la complexité et la testabilité
- Détecter les fonctionnalités CuisineZen

```bash
npm run qa:scan-components
```

### Générateur de tests

Génère automatiquement :
- Tests unitaires pour chaque composant
- Tests d'intégration pour les flows Firebase
- Tests E2E pour les parcours utilisateur critiques
- Tests d'accessibilité

```bash
npm run qa:generate-tests
```

### Auditeur IA

Effectue un audit complet de qualité :
- Analyse de la qualité du code
- Détection des problèmes de sécurité
- Évaluation des performances
- Vérification de l'accessibilité
- Recommandations d'amélioration

```bash
npm run qa:ai-audit
```

## 🧪 Types de tests

### Tests unitaires (Vitest)

```bash
# Tous les tests unitaires
npm run test:unit

# Avec couverture
npm run test:coverage

# Tests de mutation
npm run test:mutation
```

### Tests E2E (Playwright)

```bash
# Tous les tests E2E
npm run test:e2e

# Tests spécifiques aux fonctionnalités
npm run test:e2e:inventory
npm run test:e2e:recipes
npm run test:e2e:barcode

# Mode debug
npm run test:e2e:debug
```

### Tests d'accessibilité

```bash
npm run test:a11y
```

### Tests visuels

```bash
npm run test:visual
```

## 📊 Rapports

### Rapport de mapping des composants

- `reports/component-map.json` : Analyse complète des composants
- `reports/component-scan-summary.md` : Résumé en markdown

### Rapport de génération de tests

- `reports/test-generation-report.json` : Tests générés et couverture

### Rapport d'audit IA

- `reports/ai-audit-report.json` : Audit complet avec scores
- `reports/ai-audit-summary.md` : Résumé des recommandations

### Rapport des gates de qualité

- `reports/gates/gate-results.json` : Résultats détaillés
- `reports/gates/gate-summary.json` : Résumé pour CI/CD

## 🔄 CI/CD Integration

### GitHub Actions

Le workflow `.github/workflows/ci-cd.yml` automatise :

1. **Vérification de la qualité du code**
2. **Tests unitaires et d'intégration**
3. **Tests E2E avec émulateurs Firebase**
4. **Analyse de performance**
5. **Audit IA des Pull Requests**
6. **Validation des gates de qualité**
7. **Déploiement automatique**

### Gates de qualité

Les gates bloquent le déploiement si :
- Couverture de test < 80%
- Score de performance < 90
- Violations d'accessibilité détectées
- Vulnérabilités de sécurité présentes

## 🎨 Spécificités CuisineZen

### Composants testés prioritairement

- `ProductCard` - Affichage produits inventaire
- `RecipeCard` - Affichage recettes
- `BarcodeScanner` - Scanner codes-barres
- `Analytics` - Tableaux de bord
- `InventoryList` - Liste des produits

### Scénarios métier testés

- Gestion inventaire (ajout, modification, suppression)
- Création et modification de recettes
- Scan de codes-barres
- Analytics et rapports
- Authentication Firebase
- Upload d'images

### Métriques de performance

- Score Lighthouse > 90
- FCP < 1.5s
- LCP < 2.5s
- CLS < 0.1

## 📚 Commandes utiles

```bash
# Installation complète avec outils QA
npm run ci:setup

# Lancement de tous les tests
npm run ci:test

# Génération du rapport qualité
npm run gates:report

# Nettoyage des rapports
npm run clean:reports

# Mise à jour des snapshots visuels
npm run test:visual -- --update-snapshots
```

## 🔍 Debugging

### Tests qui échouent

```bash
# Mode debug Playwright
npm run test:e2e:debug

# Tests avec interface utilisateur
npm run test:e2e:ui
npm run test:ui
```

### Problèmes de performance

```bash
# Analyse du bundle
npm run bundle:analyze

# Audit Lighthouse spécifique
npm run lighthouse:inventory
npm run lighthouse:recipes
```

### Problèmes de qualité

```bash
# Vérification détaillée des gates
npm run gates:check

# Audit IA complet
npm run qa:ai-audit
```

## 📖 Documentation complémentaire

- [Policies DoD](./policies/cuisinezen-dod.yaml)
- [Configuration Playwright](./configs/playwright.config.ts)
- [Configuration Vitest](./configs/vitest.config.ts)
- [Workflow CI/CD](../.github/workflows/ci-cd.yml)

## 🆘 Support

Pour toute question ou problème :

1. Vérifiez les logs dans `qa-automation/reports/`
2. Consultez la documentation des outils
3. Exécutez `npm run gates:check` pour un diagnostic

---

*Système généré par Claude Code pour CuisineZen v2.0*