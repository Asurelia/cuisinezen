# 🤝 Guide de Contribution - CuisineZen

Merci de votre intérêt pour contribuer à CuisineZen ! Ce guide vous accompagnera pour faire vos premières contributions de manière efficace et cohérente avec notre philosophie de développement.

## 📋 Table des matières

1. [Code de conduite](#-code-de-conduite)
2. [Processus de contribution](#-processus-de-contribution)
3. [Standards de code](#-standards-de-code)
4. [Architecture et patterns](#-architecture-et-patterns)
5. [Tests et qualité](#-tests-et-qualité)
6. [Workflow Git](#-workflow-git)
7. [Documentation](#-documentation)
8. [Performance et sécurité](#-performance-et-sécurité)

## 🌟 Code de conduite

### Nos valeurs
- **Respect** : Échanges bienveillants et constructifs
- **Inclusion** : Accueil de toutes les perspectives et expériences
- **Collaboration** : Travail d'équipe et partage de connaissances
- **Qualité** : Code propre, testé et documenté
- **Innovation** : Amélioration continue et nouvelles idées

### Comportements attendus
- Utiliser un langage accueillant et respectueux
- Accepter les critiques constructives
- Se concentrer sur l'intérêt du projet
- Faire preuve d'empathie envers la communauté

## 🚀 Processus de contribution

### 1. Préparation de l'environnement

```bash
# Fork et clone du projet
git clone https://github.com/VOTRE-USERNAME/cuisinezen.git
cd cuisinezen

# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Firebase

# Vérification que tout fonctionne
npm run dev
npm run lint
npm run typecheck
```

### 2. Types de contributions

#### 🐛 Correction de bugs
1. Créer une issue décrivant le bug
2. Référencer l'issue dans votre PR
3. Inclure des tests pour éviter la régression

#### ✨ Nouvelles fonctionnalités
1. Discuter de la fonctionnalité dans une issue
2. Obtenir l'approbation des mainteneurs
3. Implémenter avec tests et documentation

#### 📚 Documentation
1. Identifier les lacunes documentaires
2. Proposer des améliorations claires
3. Inclure des exemples pratiques

#### 🔧 Améliorations techniques
1. Proposer l'amélioration avec justification
2. Mesurer l'impact performance/sécurité
3. Maintenir la compatibilité

### 3. Workflow de contribution

```bash
# 1. Créer une branche feature
git checkout -b feature/nom-fonctionnalite

# 2. Développer avec commits atomiques
git add .
git commit -m "feat: ajouter validation des formules de recettes"

# 3. Maintenir la branche à jour
git fetch origin
git rebase origin/main

# 4. Pousser et créer une PR
git push origin feature/nom-fonctionnalite
```

## 📝 Standards de code

### Structure des fichiers

```
src/
├── app/                    # Pages Next.js App Router
│   ├── (app)/             # Groupe d'application authentifiée
│   ├── (auth)/            # Groupe d'authentification
│   └── api/               # API Routes
├── components/            # Composants réutilisables
│   ├── ui/               # Composants UI de base (Radix)
│   └── [feature]/        # Composants métier par fonctionnalité
├── hooks/                # Hooks personnalisés
├── lib/                  # Utilitaires et configuration
├── services/             # Services et logique métier
└── ai/                   # Configuration et flows IA
```

### Conventions de nommage

#### Fichiers et dossiers
```bash
# Fichiers : kebab-case
add-product-dialog.tsx
use-firestore-products.ts
analytics-service.ts

# Dossiers : kebab-case
components/analytics/
hooks/firestore/
services/cost-optimization/

# Composants : PascalCase pour les exports
export function AddProductDialog() {}
export const ProductCard = () => {}
```

#### Variables et fonctions
```typescript
// Fonctions : camelCase
function calculateExpiryDate(batch: Batch): Date {}
const handleProductSubmit = () => {}

// Constantes : SCREAMING_SNAKE_CASE
const MAX_UPLOAD_SIZE = 5_000_000;
const CACHE_DURATION_MS = 300_000;

// Interfaces : PascalCase avec préfixe optionnel
interface Product {}
interface UserPermissions {}
type Category = 'frais' | 'surgelé';
```

### Style TypeScript

#### Types stricts et sécurisés
```typescript
// ✅ Bon : Types explicites et stricts
interface ProductFormData {
  readonly name: string;
  readonly category: Category;
  readonly batches: readonly Batch[];
}

// ✅ Bon : Gestion d'erreurs typée
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// ❌ Éviter : Types any ou trop permissifs
function processData(data: any): any {}
```

#### Hooks et services
```typescript
// ✅ Bon : Hook avec types stricts
export function useFirestoreProducts(restaurantId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  return { products, loading, error, addProduct, updateProduct };
}

// ✅ Bon : Service avec interface claire
export class FirestoreService {
  async getProducts(restaurantId: string): Promise<Product[]> {
    // Implémentation avec gestion d'erreurs
  }
}
```

### Standards React

#### Composants fonctionnels
```tsx
// ✅ Bon : Props typées et valeurs par défaut
interface ProductCardProps {
  readonly product: Product;
  readonly onEdit?: (product: Product) => void;
  readonly onDelete?: (productId: string) => void;
  readonly showActions?: boolean;
}

export function ProductCard({ 
  product, 
  onEdit, 
  onDelete, 
  showActions = true 
}: ProductCardProps) {
  // Logique du composant
  return (
    <Card className="relative">
      {/* JSX propre et lisible */}
    </Card>
  );
}
```

#### Gestion d'état
```tsx
// ✅ Bon : État local simple
const [isOpen, setIsOpen] = useState(false);

// ✅ Bon : État complexe avec reducer
const [state, dispatch] = useReducer(productReducer, initialState);

// ✅ Bon : État global avec Zustand
const { products, addProduct } = useProductStore();
```

## 🏗️ Architecture et patterns

### Principes architecturaux

#### 1. Séparation des responsabilités
```typescript
// Composant : Affichage uniquement
export function ProductList({ products }: ProductListProps) {
  return products.map(product => <ProductCard key={product.id} />);
}

// Hook : Logique métier
export function useProducts() {
  // Gestion d'état et appels API
}

// Service : Accès aux données
export class ProductService {
  // Opérations CRUD
}
```

#### 2. Server Components par défaut
```tsx
// ✅ Server Component par défaut
export default async function InventoryPage() {
  const products = await getProducts();
  return <InventoryList products={products} />;
}

// ✅ Client Component quand nécessaire
'use client';
export function AddProductDialog() {
  // Interactivité côté client
}
```

#### 3. Composition over Inheritance
```tsx
// ✅ Bon : Composition avec render props
<DataTable
  data={products}
  columns={productColumns}
  renderRow={(product) => <ProductRow product={product} />}
/>

// ✅ Bon : HOC pour réutilisabilité
export function withPermissions<T>(
  Component: React.ComponentType<T>,
  permission: Permission
) {
  return function WithPermissionsComponent(props: T) {
    const { hasPermission } = usePermissions();
    if (!hasPermission(permission)) return null;
    return <Component {...props} />;
  };
}
```

### Patterns recommandés

#### 1. Custom Hooks pour la logique
```typescript
// Hook réutilisable pour les opérations CRUD
export function useFirestoreCollection<T>(
  collectionPath: string,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Logique de subscription, cache, etc.
  
  return { data, loading, error, add, update, remove };
}
```

#### 2. Service Layer Pattern
```typescript
// Service abstrait pour consistance
abstract class BaseFirestoreService<T> {
  constructor(protected collectionPath: string) {}
  
  abstract create(data: Omit<T, 'id'>): Promise<T>;
  abstract getById(id: string): Promise<T | null>;
  abstract update(id: string, data: Partial<T>): Promise<void>;
  abstract delete(id: string): Promise<void>;
}

// Implémentation spécifique
export class ProductService extends BaseFirestoreService<Product> {
  constructor(restaurantId: string) {
    super(`restaurants/${restaurantId}/products`);
  }
  
  async create(productData: Omit<Product, 'id'>): Promise<Product> {
    // Implémentation spécifique aux produits
  }
}
```

#### 3. Error Boundaries et gestion d'erreurs
```tsx
// Error Boundary pour robustesse
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryComponent
      fallback={<ErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('Error caught by boundary:', error, errorInfo);
        // Envoi vers service de monitoring
      }}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}
```

## 🧪 Tests et qualité

### Standards de tests

#### 1. Structure des tests
```
src/
├── components/
│   ├── product-card.tsx
│   └── __tests__/
│       ├── product-card.test.tsx
│       └── product-card.integration.test.tsx
├── hooks/
│   ├── use-products.ts
│   └── __tests__/
│       └── use-products.test.ts
└── services/
    ├── product-service.ts
    └── __tests__/
        └── product-service.test.ts
```

#### 2. Tests de composants
```typescript
// Tests unitaires avec React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../product-card';

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: '1',
    name: 'Tomates',
    category: 'frais',
    batches: []
  };

  it('affiche le nom du produit', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Tomates')).toBeInTheDocument();
  });

  it('appelle onEdit quand le bouton modifier est cliqué', () => {
    const onEdit = jest.fn();
    render(<ProductCard product={mockProduct} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /modifier/i }));
    expect(onEdit).toHaveBeenCalledWith(mockProduct);
  });
});
```

#### 3. Tests de hooks
```typescript
// Tests de hooks personnalisés
import { renderHook, act } from '@testing-library/react';
import { useProducts } from '../use-products';

describe('useProducts', () => {
  it('charge les produits au montage', async () => {
    const { result } = renderHook(() => useProducts('restaurant-1'));
    
    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      // Attendre la fin du chargement
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.products).toHaveLength(0);
  });
});
```

#### 4. Tests d'intégration
```typescript
// Tests avec Firebase Emulator
import { initializeTestApp, clearFirestoreData } from '@firebase/testing';

describe('ProductService Integration', () => {
  let app: firebase.app.App;
  let service: ProductService;

  beforeEach(async () => {
    app = initializeTestApp({ projectId: 'test-project' });
    service = new ProductService(app, 'test-restaurant');
  });

  afterEach(async () => {
    await clearFirestoreData({ projectId: 'test-project' });
    await app.delete();
  });

  it('crée et récupère un produit', async () => {
    const productData = { name: 'Test', category: 'frais', batches: [] };
    const created = await service.create(productData);
    const retrieved = await service.getById(created.id);
    
    expect(retrieved).toEqual(created);
  });
});
```

### Couverture de tests

```bash
# Configuration Jest (jest.config.js)
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Linting et formatting

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

## 🔄 Workflow Git

### Convention de commits

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/) :

```bash
# Format : type(scope): description
feat(inventory): ajouter scanner de codes-barres
fix(auth): corriger la déconnexion automatique
docs(api): mettre à jour la documentation des hooks
style(ui): améliorer l'espacement des cartes produits
refactor(services): extraire la logique de cache
test(components): ajouter tests ProductCard
chore(deps): mettre à jour les dépendances Firebase
```

#### Types de commits
- **feat** : Nouvelle fonctionnalité
- **fix** : Correction de bug
- **docs** : Documentation
- **style** : Formatage (sans changement de logique)
- **refactor** : Refactoring (sans nouvelle feature ni fix)
- **test** : Ajout ou modification de tests
- **chore** : Maintenance (dépendances, config, etc.)

### Branches et PR

#### Stratégie de branches
```bash
main                    # Production (protégée)
├── develop            # Intégration (protégée)
├── feature/scanner    # Nouvelle fonctionnalité
├── fix/auth-bug      # Correction de bug
└── docs/api-update   # Mise à jour documentation
```

#### Template de Pull Request

```markdown
## Description
Brève description des changements apportés.

## Type de changement
- [ ] Bug fix (changement qui corrige un problème)
- [ ] Nouvelle fonctionnalité (changement qui ajoute une fonctionnalité)
- [ ] Breaking change (changement qui affecte la compatibilité)
- [ ] Documentation (changement de documentation uniquement)

## Tests
- [ ] Les tests existants passent
- [ ] De nouveaux tests ont été ajoutés
- [ ] La couverture de tests est maintenue/améliorée

## Checklist
- [ ] Mon code suit les standards du projet
- [ ] J'ai effectué une auto-review de mon code
- [ ] J'ai commenté les parties complexes
- [ ] J'ai mis à jour la documentation
- [ ] Mes changements ne génèrent pas de nouveaux warnings
- [ ] Les tests passent localement

## Screenshots (si applicable)
Captures d'écran des changements visuels.

## Notes supplémentaires
Informations additionnelles pour les reviewers.
```

### Hooks Git

```bash
# .husky/pre-commit
#!/bin/sh
npm run lint
npm run typecheck
npm run test:ci
```

```bash
# .husky/commit-msg
#!/bin/sh
npx commitlint --edit $1
```

## 📚 Documentation

### Standards de documentation

#### 1. Code auto-documenté
```typescript
/**
 * Calcule la date d'expiration moyenne des lots d'un produit.
 * 
 * @param product - Le produit à analyser
 * @returns La date d'expiration moyenne ou null si aucun lot n'a de date
 * 
 * @example
 * ```typescript
 * const avgExpiry = calculateAverageExpiryDate(product);
 * if (avgExpiry && isWithinDays(avgExpiry, 7)) {
 *   showExpiryAlert(product);
 * }
 * ```
 */
export function calculateAverageExpiryDate(product: Product): Date | null {
  const validDates = product.batches
    .map(batch => batch.expiryDate)
    .filter((date): date is Date => date !== null);
    
  if (validDates.length === 0) return null;
  
  const avgTime = validDates.reduce((sum, date) => sum + date.getTime(), 0) / validDates.length;
  return new Date(avgTime);
}
```

#### 2. README par feature
```markdown
# Feature: Scanner de Codes-Barres

## Vue d'ensemble
Fonctionnalité permettant de scanner des codes-barres pour ajouter rapidement des produits à l'inventaire.

## Composants
- `BarcodeScannerDialog` : Interface de scan
- `useBarcodeScanner` : Hook de gestion du scanner
- `BarcodeService` : Service d'intégration API

## Utilisation
\`\`\`tsx
import { BarcodeScannerDialog } from '@/components/barcode-scanner-dialog';

function InventoryPage() {
  const [scannerOpen, setScannerOpen] = useState(false);
  
  return (
    <BarcodeScannerDialog 
      open={scannerOpen}
      onClose={() => setScannerOpen(false)}
      onScan={(product) => handleProductAdd(product)}
    />
  );
}
\`\`\`
```

#### 3. Changements et migration
```markdown
# Migration Guide v2.0

## Breaking Changes

### Service API Updates
**Avant :**
\`\`\`typescript
const products = await productService.getAll();
\`\`\`

**Après :**
\`\`\`typescript
const products = await productService.getByRestaurant(restaurantId);
\`\`\`

### Component Props Changes
- `ProductCard.showEditButton` → `ProductCard.actions.edit`
- `RecipeForm.onSubmit` signature changed

## Migration Steps
1. Mettre à jour les appels de service...
2. Ajuster les props des composants...
```

## ⚡ Performance et sécurité

### Guidelines de performance

#### 1. Optimisation React
```tsx
// ✅ Mémoisation appropriée
const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  return <Card>{/* ... */}</Card>;
});

// ✅ Lazy loading des composants lourds
const HeavyChart = lazy(() => import('./heavy-chart'));

// ✅ Optimisation des re-renders
const { products, addProduct } = useProducts();
const handleAdd = useCallback((product: Product) => {
  addProduct(product);
}, [addProduct]);
```

#### 2. Optimisation Firebase
```typescript
// ✅ Requêtes optimisées avec pagination
export function useProductsPaginated(restaurantId: string, pageSize = 25) {
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  
  const loadMore = useCallback(async () => {
    const query = lastDoc 
      ? firestoreQuery(collection(db, `restaurants/${restaurantId}/products`))
          .orderBy('createdAt')
          .startAfter(lastDoc)
          .limit(pageSize)
      : firestoreQuery(collection(db, `restaurants/${restaurantId}/products`))
          .orderBy('createdAt')
          .limit(pageSize);
          
    // Exécution de la requête...
  }, [lastDoc, pageSize]);
}

// ✅ Cache intelligent
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

export function getCachedData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return Promise.resolve(cached.data);
  }
  
  return fetcher().then(data => {
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}
```

### Guidelines de sécurité

#### 1. Validation des données
```typescript
// ✅ Validation avec Zod
const ProductSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['frais', 'surgelé', 'épicerie', 'boisson', 'entretien']),
  batches: z.array(BatchSchema).min(1)
});

export function validateProduct(data: unknown): Product {
  return ProductSchema.parse(data);
}

// ✅ Sanitisation des entrées
export function sanitizeProductName(name: string): string {
  return name
    .trim()
    .replace(/[<>\"']/g, '') // Enlever caractères dangereux
    .substring(0, 100); // Limiter la longueur
}
```

#### 2. Gestion des permissions
```typescript
// ✅ Vérification des permissions
export function withPermission(permission: Permission) {
  return function <T extends {}>(Component: React.ComponentType<T>) {
    return function PermissionWrappedComponent(props: T) {
      const { hasPermission } = usePermissions();
      
      if (!hasPermission(permission)) {
        return <UnauthorizedMessage />;
      }
      
      return <Component {...props} />;
    };
  };
}

// Usage
const AdminProductCard = withPermission('admin')(ProductCard);
```

#### 3. Gestion des secrets
```typescript
// ✅ Variables d'environnement uniquement
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  // ...
};

// ❌ JAMAIS de secrets hardcodés
const API_KEY = "sk-123456789"; // ❌ Ne JAMAIS faire ça
```

## 🎯 Processus de review

### Checklist du reviewer

#### Code Quality
- [ ] Le code respecte les conventions du projet
- [ ] Les types TypeScript sont appropriés
- [ ] La logique métier est dans les bons endroits
- [ ] Pas de code dupliqué
- [ ] Gestion d'erreurs appropriée

#### Performance
- [ ] Pas de re-renders inutiles
- [ ] Mémoisation appropriée
- [ ] Requêtes optimisées
- [ ] Images optimisées

#### Sécurité
- [ ] Validation des données d'entrée
- [ ] Permissions vérifiées
- [ ] Pas de secrets exposés
- [ ] Sanitisation appropriée

#### Tests
- [ ] Tests unitaires présents
- [ ] Couverture maintenue
- [ ] Tests d'intégration si nécessaire
- [ ] Edge cases couverts

#### Documentation
- [ ] Code auto-documenté
- [ ] README mis à jour si nécessaire
- [ ] Changements API documentés
- [ ] Exemples d'utilisation

### Feedback constructif

```markdown
# Exemple de feedback positif

## Points forts
✅ Excellente séparation des responsabilités entre le hook et le composant
✅ Gestion d'erreurs robuste avec fallbacks appropriés
✅ Types TypeScript très précis

## Suggestions d'amélioration
💡 **Performance** : Considérer `useMemo` pour `expensiveCalculation` ligne 42
💡 **UX** : Ajouter un état de loading pendant la sauvegarde
💡 **Tests** : Ajouter un test pour le cas d'erreur réseau

## Questions
❓ Avez-vous considéré l'utilisation d'un debounce pour la recherche ?
❓ Cette fonction sera-t-elle réutilisée ailleurs ? Si oui, considérer l'extraction.
```

## 🆘 Support et questions

### Où trouver de l'aide

1. **Documentation** : Consultez `/docs` en premier
2. **Issues GitHub** : Recherchez les problèmes similaires
3. **Discussions** : Utilisez GitHub Discussions pour les questions générales
4. **Code Review** : N'hésitez pas à demander un review anticipé

### Mentors et experts

| Domaine | Expert | Contact |
|---------|--------|---------|
| Architecture | @lead-dev | Discussions GitHub |
| Firebase | @firebase-expert | Issues techniques |
| UI/UX | @design-lead | Questions design |
| Performance | @perf-specialist | Optimisations |

---

**Merci de contribuer à CuisineZen ! 🙏**

Ensemble, nous créons une solution qui révolutionne la gestion culinaire. Chaque contribution, petite ou grande, fait la différence.

*Guide mis à jour le 15 août 2025*