# 📋 Documentation API - CuisineZen

Cette documentation présente l'ensemble des services, hooks personnalisés et composants de CuisineZen, avec des exemples pratiques d'utilisation.

## 📋 Table des matières

1. [Hooks personnalisés](#-hooks-personnalisés)
2. [Services](#-services)
3. [Composants](#-composants)
4. [Types et interfaces](#-types-et-interfaces)
5. [Configuration et utilitaires](#-configuration-et-utilitaires)
6. [Intégration IA](#-intégration-ia)

---

## 🪝 Hooks personnalisés

### useFirestoreProducts

Hook principal pour la gestion des produits avec Firestore, remplaçant `useLocalStorage`.

```typescript
function useFirestoreProducts(restaurantId?: string): {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}
```

#### Utilisation

```tsx
import { useFirestoreProducts } from '@/hooks/use-firestore';

function InventoryPage() {
  const { products, loading, error, addProduct, updateProduct, deleteProduct } = 
    useFirestoreProducts('restaurant-123');

  if (loading) return <InventoryLoading />;
  if (error) return <ErrorMessage error={error} />;

  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      await addProduct(productData);
      toast.success('Produit ajouté avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  return (
    <div>
      {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product}
          onEdit={(id, updates) => updateProduct(id, updates)}
          onDelete={deleteProduct}
        />
      ))}
    </div>
  );
}
```

#### Fonctionnalités

- **Synchronisation temps réel** avec Firestore
- **Mode offline** avec queue de synchronisation
- **Optimistic updates** pour une UX fluide
- **Gestion d'erreurs** intégrée
- **Cache intelligent** pour optimiser les coûts

---

### useFirestoreRecipes

Hook similaire pour la gestion des recettes.

```typescript
function useFirestoreRecipes(restaurantId?: string): {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}
```

#### Exemple d'utilisation

```tsx
import { useFirestoreRecipes } from '@/hooks/use-firestore';

function RecipesPage() {
  const { recipes, loading, addRecipe } = useFirestoreRecipes('restaurant-123');
  
  const handleCreateRecipe = async (formData: RecipeFormData) => {
    const newRecipe: Omit<Recipe, 'id'> = {
      name: formData.name,
      description: formData.description,
      ingredients: formData.ingredients,
      preparationTime: formData.prepTime,
      cookingTime: formData.cookTime,
      difficulty: formData.difficulty
    };
    
    await addRecipe(newRecipe);
  };

  return (
    <RecipeGrid 
      recipes={recipes} 
      loading={loading}
      onCreateRecipe={handleCreateRecipe}
    />
  );
}
```

---

### useUserPermissions

Hook pour la gestion des permissions utilisateur.

```typescript
function useUserPermissions(restaurantId?: string): {
  isAdmin: boolean;
  loading: boolean;
  userEmail: string | undefined;
}
```

#### Utilisation avec HOC

```tsx
import { useUserPermissions } from '@/hooks/use-permissions';

// Hook de permission
function useRequireAdmin(restaurantId: string) {
  const { isAdmin, loading } = useUserPermissions(restaurantId);
  
  useEffect(() => {
    if (!loading && !isAdmin) {
      redirect('/unauthorized');
    }
  }, [isAdmin, loading]);
  
  return { isAdmin, loading };
}

// Composant protégé
function AdminPanel({ restaurantId }: { restaurantId: string }) {
  const { isAdmin, loading } = useRequireAdmin(restaurantId);
  
  if (loading) return <LoadingSpinner />;
  if (!isAdmin) return null;
  
  return (
    <div>
      <h1>Panneau d'administration</h1>
      {/* Interface admin */}
    </div>
  );
}
```

---

### useImageUpload

Hook pour la gestion d'upload d'images avec optimisation automatique.

```typescript
function useImageUpload(): {
  uploadImage: (file: File, path: string) => Promise<string>;
  uploading: boolean;
  progress: number;
  error: string | null;
}
```

#### Exemple d'utilisation

```tsx
import { useImageUpload } from '@/hooks/use-image-upload';

function ProductImageUpload({ onImageUploaded }: { onImageUploaded: (url: string) => void }) {
  const { uploadImage, uploading, progress, error } = useImageUpload();
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const imageUrl = await uploadImage(file, `products/${Date.now()}`);
      onImageUploaded(imageUrl);
    } catch (err) {
      console.error('Erreur upload:', err);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileSelect} />
      {uploading && (
        <div>
          <p>Upload en cours: {progress}%</p>
          <div className="w-full bg-gray-200 rounded">
            <div 
              className="bg-blue-600 h-2 rounded" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
```

---

### useMigration

Hook pour la migration automatique des données localStorage vers Firestore.

```typescript
function useMigration(restaurantId?: string): {
  needed: boolean;
  inProgress: boolean;
  completed: boolean;
  progress: MigrationProgress | null;
  startMigration: () => Promise<void>;
  resetMigration: () => void;
}
```

#### Utilisation

```tsx
import { useMigration } from '@/hooks/use-migration';

function AppInitializer({ restaurantId }: { restaurantId: string }) {
  const { needed, inProgress, progress, startMigration } = useMigration(restaurantId);
  
  useEffect(() => {
    if (needed) {
      startMigration();
    }
  }, [needed, startMigration]);

  if (inProgress) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <h2>Migration des données en cours</h2>
          <p>Étape: {progress?.currentStep}</p>
          <p>{progress?.completedItems} / {progress?.totalItems}</p>
          <Progress value={progress?.percentage} />
        </Card>
      </div>
    );
  }

  return null;
}
```

---

## 🔧 Services

### FirestoreService

Service principal pour toutes les opérations Firestore.

```typescript
class FirestoreService {
  // Initialisation
  initializeRestaurant(restaurantId: string, adminEmail: string): Promise<void>
  
  // Produits
  getProducts(): Promise<Product[]>
  addProduct(product: Omit<Product, 'id'>, userEmail: string): Promise<string>
  updateProduct(id: string, updates: Partial<Product>, userEmail: string): Promise<void>
  deleteProduct(id: string, userEmail: string): Promise<void>
  subscribeToProducts(callback: (products: Product[]) => void): () => void
  
  // Recettes
  getRecipes(): Promise<Recipe[]>
  addRecipe(recipe: Omit<Recipe, 'id'>, userEmail: string): Promise<string>
  updateRecipe(id: string, updates: Partial<Recipe>, userEmail: string): Promise<void>
  deleteRecipe(id: string, userEmail: string): Promise<void>
  subscribeToRecipes(callback: (recipes: Recipe[]) => void): () => void
  
  // Statistiques et cache
  getCacheStats(): { cacheSize: number; activeListeners: number; isOnline: boolean }
}
```

#### Utilisation directe (déconseillée, préférer les hooks)

```typescript
import { firestoreService } from '@/services/firestore';

// Initialisation (à faire une seule fois)
await firestoreService.initializeRestaurant('restaurant-123', 'admin@restaurant.com');

// Opérations sur les produits
const products = await firestoreService.getProducts();
const productId = await firestoreService.addProduct({
  name: 'Tomates',
  category: 'frais',
  batches: []
}, 'user@example.com');

// Écoute temps réel
const unsubscribe = firestoreService.subscribeToProducts((products) => {
  console.log('Produits mis à jour:', products);
});

// Nettoyage
unsubscribe();
```

---

### ImageService

Service pour l'optimisation et l'upload d'images.

```typescript
class ImageService {
  uploadImage(file: File, path: string): Promise<string>
  optimizeImage(file: File, options?: OptimizationOptions): Promise<File>
  generateThumbnail(file: File, size: number): Promise<File>
  deleteImage(url: string): Promise<void>
}

interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}
```

#### Utilisation

```typescript
import { imageService } from '@/services/image.service';

async function handleImageUpload(file: File) {
  // Optimisation automatique
  const optimizedFile = await imageService.optimizeImage(file, {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.8,
    format: 'webp'
  });
  
  // Upload vers Firebase Storage
  const imageUrl = await imageService.uploadImage(optimizedFile, `products/${Date.now()}`);
  
  // Génération de thumbnail
  const thumbnail = await imageService.generateThumbnail(optimizedFile, 150);
  const thumbnailUrl = await imageService.uploadImage(thumbnail, `thumbnails/${Date.now()}`);
  
  return { imageUrl, thumbnailUrl };
}
```

---

### CostOptimizer

Service pour optimiser les coûts Firebase et surveiller l'utilisation.

```typescript
class CostOptimizer {
  getCostMetrics(): CostMetrics
  shouldUseCache(operation: string): boolean
  batchOperations<T>(operations: Operation<T>[]): Promise<T[]>
  monitorUsage(): UsageReport
}

interface CostMetrics {
  dailyReads: number;
  dailyWrites: number;
  estimatedMonthlyCost: number;
  recommendations: string[];
}
```

#### Utilisation avec monitoring

```tsx
import { costOptimizer } from '@/services/cost-optimizer';

function AdminDashboard() {
  const [metrics, setMetrics] = useState<CostMetrics | null>(null);
  
  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = costOptimizer.getCostMetrics();
      setMetrics(currentMetrics);
    };
    
    updateMetrics();
    const interval = setInterval(updateMetrics, 60000); // Chaque minute
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Monitoring des coûts Firebase</h2>
      {metrics && (
        <div>
          <p>Lectures aujourd'hui: {metrics.dailyReads}</p>
          <p>Écritures aujourd'hui: {metrics.dailyWrites}</p>
          <p>Coût mensuel estimé: ${metrics.estimatedMonthlyCost}</p>
          
          {metrics.recommendations.length > 0 && (
            <div>
              <h3>Recommandations</h3>
              <ul>
                {metrics.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### OfflineManager

Service pour la gestion du mode hors ligne et de la synchronisation.

```typescript
class OfflineManager {
  addToQueue(operation: OfflineOperation): void
  processQueue(): Promise<void>
  getQueueStatus(): { queueLength: number; isProcessing: boolean }
  clearQueue(): void
  enableOfflineMode(): void
  disableOfflineMode(): void
}

interface OfflineOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data: any;
  timestamp: number;
}
```

#### Utilisation automatique

```typescript
// Le service est utilisé automatiquement par les hooks
// Exemple de vérification du statut offline

import { offlineManager } from '@/services/offline-manager';

function OfflineIndicator() {
  const [queueStatus, setQueueStatus] = useState(offlineManager.getQueueStatus());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const interval = setInterval(() => {
      setQueueStatus(offlineManager.getQueueStatus());
    }, 1000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && queueStatus.queueLength === 0) return null;

  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
      {!isOnline && <p>Mode hors ligne activé</p>}
      {queueStatus.queueLength > 0 && (
        <p>{queueStatus.queueLength} opération(s) en attente de synchronisation</p>
      )}
    </div>
  );
}
```

---

## 🎨 Composants

### ProductCard

Composant principal pour l'affichage des produits.

```tsx
interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

function ProductCard(props: ProductCardProps): JSX.Element
```

#### Utilisation

```tsx
import { ProductCard } from '@/components/product-card';

function InventoryGrid({ products }: { products: Product[] }) {
  const handleEdit = (product: Product) => {
    // Ouvrir le dialogue d'édition
    setEditingProduct(product);
    setEditDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    const confirmed = await confirm('Supprimer ce produit ?');
    if (confirmed) {
      await deleteProduct(productId);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={handleEdit}
          onDelete={handleDelete}
          variant="default"
        />
      ))}
    </div>
  );
}
```

---

### AddProductDialog

Dialogue pour l'ajout de nouveaux produits.

```tsx
interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (product: Omit<Product, 'id'>) => Promise<void>;
  categories: Category[];
}

function AddProductDialog(props: AddProductDialogProps): JSX.Element
```

#### Utilisation avec IA

```tsx
import { AddProductDialog } from '@/components/add-product-dialog';
import { suggestFoodCategory } from '@/ai/flows/suggest-food-category';

function InventoryPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { addProduct } = useFirestoreProducts('restaurant-123');

  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    // Suggestion de catégorie par IA si pas déjà définie
    if (!productData.category) {
      const suggestedCategory = await suggestFoodCategory({ 
        foodItemName: productData.name 
      });
      productData.category = suggestedCategory || 'épicerie';
    }

    await addProduct(productData);
    setDialogOpen(false);
  };

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        Ajouter un produit
      </Button>
      
      <AddProductDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAddProduct}
        categories={categories}
      />
    </>
  );
}
```

---

### BarcodeScannerDialog

Dialogue pour le scan de codes-barres.

```tsx
interface BarcodeScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
}

function BarcodeScannerDialog(props: BarcodeScannerDialogProps): JSX.Element
```

#### Utilisation

```tsx
import { BarcodeScannerDialog } from '@/components/barcode-scanner-dialog';

function ProductManagement() {
  const [scannerOpen, setScannerOpen] = useState(false);
  
  const handleBarcodeScan = async (barcode: string) => {
    try {
      // Rechercher le produit dans une base de données externe
      const productInfo = await lookupProductByBarcode(barcode);
      
      if (productInfo) {
        // Pré-remplir le formulaire d'ajout
        setProductFormData({
          name: productInfo.name,
          category: productInfo.category,
          imageUrl: productInfo.imageUrl
        });
        setAddDialogOpen(true);
      } else {
        toast.info('Produit non trouvé, ajout manuel requis');
      }
    } catch (error) {
      toast.error('Erreur lors de la recherche du produit');
    } finally {
      setScannerOpen(false);
    }
  };

  return (
    <>
      <Button onClick={() => setScannerOpen(true)}>
        Scanner un code-barres
      </Button>
      
      <BarcodeScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
        onError={(error) => toast.error(error)}
      />
    </>
  );
}
```

---

### OverviewMetrics

Composant d'analytics pour la vue d'ensemble.

```tsx
interface OverviewData {
  totalProducts: number;
  totalRecipes: number;
  dailyOperations: number;
  avgPerformance: number;
  expiringProducts: number;
  weeklyGrowth: number;
}

function OverviewMetrics(): JSX.Element
```

#### Intégration avec données réelles

```tsx
import { OverviewMetrics } from '@/components/analytics/overview-metrics';

function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <h1>Tableau de bord analytique</h1>
      
      {/* Métriques d'overview */}
      <OverviewMetrics />
      
      {/* Autres composants d'analytics */}
      <ExpirationAlerts />
      <PerformanceMetrics />
      <WeeklyReport />
    </div>
  );
}
```

---

## 📊 Types et interfaces

### Types principaux

```typescript
// Catégories de produits
type Category = 'frais' | 'surgelé' | 'épicerie' | 'boisson' | 'entretien';

// Difficulté des recettes
type Difficulty = 'facile' | 'moyen' | 'difficile';

// Unités de mesure
type Unit = 'g' | 'ml' | 'piece';
```

### Interfaces de données

```typescript
// Lot de produit avec date de péremption
interface Batch {
  id: string;
  quantity: number;
  expiryDate: Date | null;
}

// Produit avec ses lots
interface Product {
  id: string;
  name: string;
  category: Category;
  imageUrl?: string;
  batches: Batch[];
}

// Ingrédient d'une recette
interface Ingredient {
  productId: string;
  quantity: number;
  unit: Unit;
}

// Recette complète
interface Recipe {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  ingredients: Ingredient[];
  preparationTime?: number; // en minutes
  cookingTime?: number; // en minutes
  difficulty?: Difficulty;
}
```

### Interfaces de service

```typescript
// Données Firestore étendues
interface FirestoreProduct extends Omit<Product, 'batches'> {
  batches: (Omit<Batch, 'expiryDate'> & { expiryDate: any })[];
  restaurantId: string;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

// Configuration restaurant
interface RestaurantData {
  id: string;
  name: string;
  adminEmails: string[];
  settings: {
    timezone: string;
    currency: string;
    features: {
      inventory: boolean;
      recipes: boolean;
      menu: boolean;
      shoppingList: boolean;
    };
  };
  createdAt: any;
  updatedAt: any;
}

// Activité utilisateur pour audit
interface UserActivity {
  id: string;
  userId: string;
  userEmail: string;
  action: 'create' | 'update' | 'delete';
  entityType: 'product' | 'recipe' | 'menu';
  entityId: string;
  entityName: string;
  timestamp: any;
  restaurantId: string;
}
```

---

## ⚙️ Configuration et utilitaires

### Firebase Configuration

```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### Utilitaires de validation

```typescript
// lib/utils.ts
import { z } from 'zod';

// Schémas de validation Zod
export const ProductSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  category: z.enum(['frais', 'surgelé', 'épicerie', 'boisson', 'entretien']),
  imageUrl: z.string().url().optional(),
  batches: z.array(z.object({
    id: z.string(),
    quantity: z.number().positive(),
    expiryDate: z.date().nullable()
  })).min(1, 'Au moins un lot est requis')
});

export const RecipeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  ingredients: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    unit: z.enum(['g', 'ml', 'piece'])
  })).min(1),
  preparationTime: z.number().positive().optional(),
  cookingTime: z.number().positive().optional(),
  difficulty: z.enum(['facile', 'moyen', 'difficile']).optional()
});

// Fonctions utilitaires
export function calculateExpiryAlert(expiryDate: Date): 'urgent' | 'warning' | 'safe' {
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= 3) return 'urgent';
  if (daysUntilExpiry <= 7) return 'warning';
  return 'safe';
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitFor: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}
```

---

## 🤖 Intégration IA

### Configuration Genkit

```typescript
// ai/genkit.ts
import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

export const ai = configureGenkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
```

### Flow de suggestion de catégorie

```typescript
// ai/flows/suggest-food-category.ts
import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';

export const suggestFoodCategory = defineFlow(
  {
    name: 'suggestFoodCategory',
    inputSchema: z.object({ foodItemName: z.string() }),
    outputSchema: z.string()
  },
  async ({ foodItemName }) => {
    // Logique d'analyse IA pour suggérer une catégorie
    // Retourne: 'frais' | 'surgelé' | 'épicerie' | 'boisson' | 'entretien'
  }
);
```

#### Utilisation dans les composants

```tsx
import { suggestFoodCategory } from '@/ai/flows/suggest-food-category';

function ProductForm() {
  const [productName, setProductName] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState<Category | null>(null);
  
  // Suggestion automatique lors de la saisie du nom
  useEffect(() => {
    if (productName.length > 3) {
      const suggest = debounce(async () => {
        try {
          const category = await suggestFoodCategory({ foodItemName: productName });
          setSuggestedCategory(category as Category);
        } catch (error) {
          console.error('Erreur suggestion catégorie:', error);
        }
      }, 500);
      
      suggest();
    }
  }, [productName]);

  return (
    <form>
      <input 
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        placeholder="Nom du produit"
      />
      
      {suggestedCategory && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-700">
            Catégorie suggérée: <strong>{categoryNames[suggestedCategory]}</strong>
          </p>
          <Button 
            size="sm" 
            onClick={() => setSelectedCategory(suggestedCategory)}
          >
            Accepter
          </Button>
        </div>
      )}
    </form>
  );
}
```

### Flow d'extraction de menu

```typescript
// ai/flows/extract-menu-from-image.ts
import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';

const MenuExtractionSchema = z.object({
  meals: z.array(z.object({
    day: z.string(),
    period: z.enum(['midi', 'soir']),
    dishes: z.array(z.string())
  }))
});

export const extractMenuFromImage = defineFlow(
  {
    name: 'extractMenuFromImage',
    inputSchema: z.object({ imageUrl: z.string() }),
    outputSchema: MenuExtractionSchema
  },
  async ({ imageUrl }) => {
    // Analyse de l'image pour extraire la planification des repas
    // Retourne la structure de menu pour la semaine
  }
);
```

#### Utilisation pour l'import de menus

```tsx
import { extractMenuFromImage } from '@/ai/flows/extract-menu-from-image';

function MenuImportDialog() {
  const [importing, setImporting] = useState(false);
  const { uploadImage } = useImageUpload();

  const handleImageUpload = async (file: File) => {
    setImporting(true);
    
    try {
      // Upload de l'image
      const imageUrl = await uploadImage(file, `menu-imports/${Date.now()}`);
      
      // Extraction IA du contenu
      const extractedMenu = await extractMenuFromImage({ imageUrl });
      
      // Création du menu dans l'application
      await createWeeklyMenu(extractedMenu);
      
      toast.success('Menu importé avec succès !');
    } catch (error) {
      toast.error('Erreur lors de l\'import du menu');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog>
      <DialogContent>
        <h2>Importer un menu depuis une image</h2>
        
        {importing ? (
          <div className="text-center">
            <Spinner />
            <p>Analyse de l'image en cours...</p>
          </div>
        ) : (
          <ImageDropzone onUpload={handleImageUpload} />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🎯 Exemples d'intégration complète

### Page d'inventaire avec toutes les fonctionnalités

```tsx
import { useState } from 'react';
import { useFirestoreProducts } from '@/hooks/use-firestore';
import { useUserPermissions } from '@/hooks/use-permissions';
import { ProductCard } from '@/components/product-card';
import { AddProductDialog } from '@/components/add-product-dialog';
import { BarcodeScannerDialog } from '@/components/barcode-scanner-dialog';
import { Button } from '@/components/ui/button';
import { categories } from '@/lib/types';

export default function InventoryPage() {
  const restaurantId = 'restaurant-123'; // En réalité, récupéré du contexte
  const { products, loading, error, addProduct, updateProduct, deleteProduct } = 
    useFirestoreProducts(restaurantId);
  const { isAdmin } = useUserPermissions(restaurantId);
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Gestion de l'ajout de produit
  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      await addProduct(productData);
      setAddDialogOpen(false);
      toast.success('Produit ajouté avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du produit');
    }
  };

  // Gestion du scan de code-barres
  const handleBarcodeScan = async (barcode: string) => {
    setScannerOpen(false);
    // Logique de recherche du produit...
    setAddDialogOpen(true);
  };

  // Grouper les produits par catégorie
  const productsByCategory = categories.reduce((acc, category) => {
    acc[category] = products.filter(p => p.category === category);
    return acc;
  }, {} as Record<Category, Product[]>);

  if (loading) return <InventoryLoading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventaire</h1>
        
        <div className="flex gap-2">
          <Button onClick={() => setScannerOpen(true)}>
            Scanner code-barres
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            Ajouter produit
          </Button>
        </div>
      </div>

      {/* Affichage par catégories */}
      <div className="space-y-6">
        {categories.map(category => (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-4 capitalize">
              {categoryNames[category]} ({productsByCategory[category].length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productsByCategory[category].map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={(product) => {/* Logique d'édition */}}
                  onDelete={deleteProduct}
                  showActions={isAdmin}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dialogues */}
      <AddProductDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAddProduct}
        categories={categories}
      />
      
      <BarcodeScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
}
```

---

Cette documentation couvre l'ensemble de l'API CuisineZen. Pour des exemples plus spécifiques ou des questions sur l'implémentation, consultez les autres documents de la section `/docs` ou ouvrez une issue sur le repository.

*Documentation mise à jour le 15 août 2025*