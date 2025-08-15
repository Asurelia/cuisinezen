# CuisineZen - Persistance Firestore

## Vue d'ensemble

Cette implémentation fournit une architecture Firestore complète optimisée pour un restaurant avec 5-6 utilisateurs, incluant :

- ✅ Structure de données optimisée pour 1 restaurant
- ✅ Cache intelligent et fonctionnement offline  
- ✅ Synchronisation temps réel entre utilisateurs
- ✅ Migration automatique depuis localStorage
- ✅ Système de permissions granulaires
- ✅ Optimisation des coûts pour rester dans le free tier

## Structure des fichiers

```
src/services/
├── firestore.ts          # Service principal Firestore
├── offline-manager.ts    # Gestion offline et queue
├── migration.ts          # Migration localStorage → Firestore
├── permissions.ts        # Gestion des rôles et permissions
├── cost-optimizer.ts     # Optimisation des coûts Firebase
└── index.ts             # Exports centralisés

src/hooks/
├── use-firestore.ts     # Hooks pour les données
├── use-permissions.ts   # Hooks pour les permissions
└── use-migration.ts     # Hook pour la migration
```

## Structure Firestore

```
restaurants/{restaurantId}/
├── name: string
├── adminEmails: string[]
├── settings: object
├── users/{userEmail}
│   ├── role: 'admin' | 'manager' | 'employee'
│   ├── permissions: UserPermissions
│   └── isActive: boolean
├── products/{productId}
│   ├── name: string
│   ├── category: Category
│   ├── batches: Batch[]
│   ├── createdBy: string
│   └── timestamps...
├── recipes/{recipeId}
│   ├── name: string
│   ├── ingredients: Ingredient[]
│   ├── createdBy: string
│   └── timestamps...
└── activities/{activityId}
    ├── action: 'create' | 'update' | 'delete'
    ├── entityType: 'product' | 'recipe'
    ├── userEmail: string
    └── timestamp
```

## Utilisation de base

### 1. Initialization dans votre layout principal

```tsx
import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { firestoreService } from '@/services';

export function Layout({ children }) {
  const [user] = useAuthState(auth);
  const restaurantId = 'your-restaurant-id';

  useEffect(() => {
    if (user?.email) {
      firestoreService.initializeRestaurant(restaurantId, user.email);
    }
  }, [user?.email]);

  return <>{children}</>;
}
```

### 2. Remplacement de useLocalStorage

**Avant (localStorage) :**
```tsx
const [products, setProducts] = useLocalStorage<Product[]>('products', []);
```

**Après (Firestore) :**
```tsx
const { products, addProduct, updateProduct, deleteProduct } = useFirestoreProducts(restaurantId);
```

### 3. Vérification des permissions

```tsx
const { hasPermission, canPerformAction } = useUserPermissions(restaurantId);

// Vérifier une permission spécifique
if (hasPermission('canCreateProducts')) {
  // Afficher le bouton d'ajout
}

// Vérifier une action sur une entité
if (canPerformAction('delete', 'products')) {
  // Afficher le bouton de suppression
}
```

### 4. Migration automatique

```tsx
const { needed, startMigration, progress } = useMigration(restaurantId);

useEffect(() => {
  if (needed && user?.email) {
    startMigration(); // Migration automatique
  }
}, [needed, user?.email]);

// Afficher la progression
if (progress?.inProgress) {
  return <MigrationProgress progress={progress} />;
}
```

## Optimisations pour le Free Tier

### Limites quotidiennes
- **Lectures** : 50,000 (surveillées)
- **Écritures** : 20,000 (surveillées) 
- **Suppressions** : 20,000 (surveillées)

### Stratégies d'optimisation

1. **Cache intelligent** (2-10 minutes selon le contexte)
2. **Pagination** (25 éléments par page)
3. **Listeners limités** (seulement données critiques)
4. **Batch operations** (grouper les écritures)
5. **Surveillance en temps réel** des coûts

### Monitoring des coûts

```tsx
const { metrics, isNearLimit } = useCostMonitoring();

// metrics.dailyReads, metrics.dailyWrites
// metrics.monthlyCost (estimation)
// metrics.recommendations (suggestions)
```

## Fonctionnement Offline

### Cache local automatique
- Données en cache (5-10 minutes)
- Persistance IndexedDB
- Queue d'opérations offline

### Gestion des conflits
- Optimistic updates
- Retry automatique
- Synchronisation intelligente

```tsx
const { isOnline, queueLength } = useOfflineStatus();

// queueLength : nombre d'opérations en attente
// isOnline : statut de connexion
```

## Permissions et Rôles

### Rôles disponibles
- **Admin** : Toutes les permissions
- **Manager** : Gestion quotidienne, pas de suppression
- **Employee** : Lecture et modification limitée

### Gestion des utilisateurs (Admin seulement)

```tsx
const { users, createUser, updateUserPermissions } = useUserManagement(restaurantId);

// Créer un utilisateur
await createUser('email@example.com', 'manager', 'John Doe');

// Modifier des permissions spécifiques
await updateUserPermissions('email@example.com', {
  canDeleteProducts: false
});
```

## Configuration requise

### Variables d'environnement
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Emails des premiers admins (séparés par des virgules)
NEXT_PUBLIC_ADMIN_EMAILS=admin@restaurant.com,owner@restaurant.com
```

### Règles de sécurité Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Accès restaurant par utilisateur autorisé
    match /restaurants/{restaurantId} {
      allow read, write: if request.auth != null && 
        resource.data.adminEmails.hasAny([request.auth.token.email]) ||
        exists(/databases/$(database)/documents/restaurants/$(restaurantId)/users/$(request.auth.token.email));
      
      // Sous-collections (products, recipes, users, activities)
      match /{document=**} {
        allow read, write: if request.auth != null &&
          exists(/databases/$(database)/documents/restaurants/$(restaurantId)/users/$(request.auth.token.email));
      }
    }
  }
}
```

## Support et débogage

### Debug mode
En développement, activez les logs détaillés :

```tsx
// Statistiques du cache
const stats = firestoreService.getCacheStats();
console.log('Cache:', stats);

// Métriques de coût
const costMetrics = costOptimizer.getCostMetrics();
console.log('Coûts:', costMetrics);
```

### Composant de diagnostic
Utilisez `FirestoreIntegrationExample` pour tester l'intégration complète.

## Migration et mise à jour

La migration se fait automatiquement au premier lancement. Les données localStorage existantes sont :

1. Analysées et normalisées
2. Transférées vers Firestore
3. Nettoyées après succès (optionnel)

Pour forcer une nouvelle migration :
```tsx
const { resetMigration } = useMigration();
resetMigration(); // Relancer la migration
```

## Estimation des coûts

Avec 5-6 utilisateurs et utilisation normale :
- **Lectures** : ~5,000-15,000/jour (bien sous la limite)
- **Écritures** : ~500-2,000/jour (bien sous la limite) 
- **Coût mensuel estimé** : $0.10-0.50/mois (avec les optimisations)

Budget de 1000$ largement suffisant pour plusieurs années d'utilisation.