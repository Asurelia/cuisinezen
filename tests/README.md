# CuisineZen - Test Suite Documentation

Ce document décrit la stratégie de tests complète mise en place pour CuisineZen, incluant les tests unitaires, d'intégration, E2E, de contrats et de mutation.

## 🏗️ Architecture des Tests

### Structure des Dossiers

```
tests/
├── setup.ts                    # Configuration globale Vitest
├── hooks/                      # Tests des hooks React personnalisés
├── services/                   # Tests des services Firebase
├── lib/                        # Tests des utilitaires
├── contracts/                  # Tests de contrats et schémas
├── e2e/                        # Tests end-to-end avec Playwright
│   ├── setup/                  # Configuration globale E2E
│   ├── product-management.spec.ts
│   ├── barcode-scanner.spec.ts
│   └── recipe-management.spec.ts
└── README.md                   # Cette documentation
```

## 🧪 Types de Tests

### 1. Tests Unitaires (Vitest + Fast-Check)

**Objectif** : Tester les unités de code isolément avec des données générées automatiquement.

**Technologies** :
- **Vitest** : Framework de test rapide et moderne
- **Fast-Check** : Property-based testing pour générer des données de test
- **Testing Library** : Utilitaires pour tester les composants React

**Coverage** :
- ✅ Hooks personnalisés (`useLocalStorage`, `useFirestore`, etc.)
- ✅ Services Firebase (`firestore.ts`, `storage.service.ts`)
- ✅ Utilitaires (`image-utils.ts`, `analytics.ts`)
- ✅ Property-based testing pour la validation robuste

**Commandes** :
```bash
npm run test              # Tests en mode watch
npm run test:run          # Tests une fois
npm run test:coverage     # Tests avec couverture
npm run test:ui           # Interface graphique
```

### 2. Tests End-to-End (Playwright)

**Objectif** : Tester les workflows complets depuis l'interface utilisateur.

**Technologies** :
- **Playwright** : Framework E2E multi-navigateurs
- **Configuration cross-browser** : Chrome, Firefox, Safari, Mobile

**Coverage** :
- ✅ Gestion des produits (ajout, modification, suppression)
- ✅ Scanner de codes-barres
- ✅ Gestion des recettes
- ✅ Navigation et accessibilité
- ✅ Tests mobiles et desktop

**Commandes** :
```bash
npm run test:e2e          # Tests E2E
npm run test:e2e:ui       # Mode interface graphique
```

### 3. Tests de Contrats Firebase

**Objectif** : Valider les règles de sécurité Firestore et les schémas de données.

**Technologies** :
- **Firebase Rules Unit Testing** : Tests des règles de sécurité
- **Zod** : Validation des schémas TypeScript

**Coverage** :
- ✅ Règles de sécurité Firestore
- ✅ Validation des schémas de données
- ✅ Tests d'autorisation et d'authentification
- ✅ Performance des requêtes

**Commandes** :
```bash
npm run test:contracts    # Tests de contrats uniquement
```

### 4. Mutation Testing (Stryker)

**Objectif** : Évaluer la qualité des tests en introduisant des mutations dans le code.

**Technologies** :
- **Stryker Mutator** : Framework de mutation testing
- **Focus sur la logique métier** : Hooks, services, utilitaires

**Configuration** :
- Seuils : Haut (85%), Bas (70%), Échec (65%)
- Exclusions intelligentes : UI, configuration, tests
- Mutations ciblées : arithmétiques, logiques, conditionnelles

**Commandes** :
```bash
npm run test:mutation     # Mutation testing
```

## 📊 Métriques et Seuils

### Couverture de Code (Vitest)
- **Branches** : 80% minimum
- **Fonctions** : 80% minimum
- **Lignes** : 80% minimum
- **Statements** : 80% minimum

### Score de Mutation (Stryker)
- **Excellent** : 85%+
- **Bon** : 70-85%
- **Acceptable** : 65-70%
- **Insuffisant** : <65% (échec)

### Performance E2E
- **Timeout global** : 60 secondes
- **Navigation** : 30 secondes
- **Actions** : 10 secondes

## 🚀 Commandes Rapides

### Développement
```bash
# Tests en cours de développement
npm run test                    # Tests unitaires en watch mode
npm run test:ui                 # Interface graphique des tests

# Vérification rapide
npm run test:run                # Tous les tests unitaires
npm run typecheck              # Vérification TypeScript
```

### Intégration Continue
```bash
# Suite complète de tests
npm run test:run && npm run test:e2e

# Avec couverture
npm run test:coverage

# Tests de contrats
npm run test:contracts
```

### Analyse Approfondie
```bash
# Mutation testing (long)
npm run test:mutation

# Tests E2E complets
npm run test:e2e

# Combinaison recommandée pour release
npm run test:coverage && npm run test:e2e && npm run test:contracts
```

## 🔧 Configuration des Outils

### Vitest (`vitest.config.ts`)
- Environnement : jsdom pour les tests React
- Mocks automatiques : Firebase, Next.js
- Coverage : v8 provider
- Setup global : `tests/setup.ts`

### Playwright (`playwright.config.ts`)
- Multi-navigateurs : Chrome, Firefox, Safari
- Tests mobiles : Pixel 5, iPhone 12
- Serveur local automatique : port 3000
- Artifacts : screenshots, vidéos, traces

### Stryker (`stryker.conf.mjs`)
- Runner : Vitest
- TypeScript : Support complet
- Focus : logique métier uniquement
- Incremental : pour optimiser les performances

## 📝 Bonnes Pratiques

### Tests Unitaires
1. **AAA Pattern** : Arrange, Act, Assert
2. **Isolation** : Mocks pour les dépendances externes
3. **Property-based** : Utiliser fast-check pour les cas limites
4. **Noms descriptifs** : Tests auto-documentés

### Tests E2E
1. **Data attributes** : `data-testid` pour la sélection stable
2. **Page Object Model** : Pour la réutilisabilité
3. **Tests indépendants** : Pas de dépendances entre tests
4. **Setup/Teardown** : Nettoyage systématique

### Tests de Contrats
1. **Schémas stricts** : Validation Zod exhaustive
2. **Cas d'erreur** : Tester les échecs attendus
3. **Performance** : Optimiser les requêtes Firebase
4. **Sécurité** : Valider toutes les règles d'accès

## 🐛 Debug et Troubleshooting

### Tests qui échouent
```bash
# Debug tests unitaires
npm run test -- --reporter=verbose

# Debug E2E avec interface
npm run test:e2e:ui

# Debug avec traces Playwright
npx playwright test --debug
```

### Performance lente
```bash
# Profiling des tests
npm run test -- --reporter=default --coverage=false

# Tests parallèles réduits
npm run test:e2e -- --workers=1
```

### Problèmes Firebase
```bash
# Vérifier les émulateurs
firebase emulators:start --only=firestore

# Tests de contrats isolés
npm run test:contracts -- --reporter=verbose
```

## 📈 Rapports et Monitoring

### Génération des Rapports
- **Coverage** : `coverage/index.html`
- **E2E** : `test-results/index.html`
- **Mutation** : `test-results/mutation/index.html`

### Intégration CI/CD
- Tous les tests dans la pipeline
- Échec si coverage < seuils
- Rapports uploadés comme artifacts
- Notifications sur échecs

## 🔄 Workflow de Développement

1. **Développement** : Tests unitaires en watch mode
2. **Avant commit** : `npm run test:run`
3. **Pull Request** : Suite complète automatisée
4. **Release** : Mutation testing inclus
5. **Monitoring** : Suivi des métriques en continu

Cette stratégie de tests garantit la qualité, la fiabilité et la maintenabilité de l'application CuisineZen à tous les niveaux.