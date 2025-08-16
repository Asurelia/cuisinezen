# Tests E2E CuisineZen

Configuration Playwright minimale pour tester les fonctionnalités essentielles de CuisineZen.

## Configuration

- **Navigateur** : Chrome uniquement (simplicité)
- **Tests** : 3 suites essentielles
- **Execution** : Séquentielle (pas de parallélisme)

## Tests disponibles

### 1. Navigation (`navigation.spec.ts`)
- Navigation entre les pages principales
- Vérification de la sidebar
- Test responsive mobile

### 2. Ajout de produit (`add-product.spec.ts`)
- Ajout d'un produit basique
- Validation des champs obligatoires
- Fonctionnalité d'annulation

### 3. Création de recette (`create-recipe.spec.ts`)
- Création d'une recette simple
- Validation des champs
- Recherche de recettes
- Annulation de création

## Utilisation

### Vérification de la configuration
```bash
node scripts/setup-e2e.js
```

### Installation des dépendances
```bash
npm install @playwright/test
npx playwright install chromium
```

### Lancer les tests
```bash
# Tests essentiels seulement
npm run test:e2e:basic

# Tous les tests E2E
npm run test:e2e

# Mode visible (pour debug)
npm run test:e2e:headed

# Interface graphique
npm run test:e2e:ui
```

### Prérequis
- Serveur de développement lancé (`npm run dev`)
- Port 3000 disponible

## Stratégie des tests

Les tests utilisent une approche **robuste** avec plusieurs sélecteurs de fallback :
- data-testid en priorité
- Sélecteurs semantiques (role, text)
- Sélecteurs CSS de fallback

Cela permet aux tests de fonctionner même si l'interface évolue.

## Fichiers de configuration

- `playwright.config.ts` - Configuration minimale
- `tests/e2e/*.spec.ts` - Tests individuels
- `scripts/setup-e2e.js` - Installation automatique

## Rapports

Les rapports HTML sont générés dans `test-results/` après chaque exécution.