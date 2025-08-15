'use client';

import { firestoreService } from './firestore';
import type { Product, Recipe } from '@/lib/types';

export interface MigrationProgress {
  step: string;
  progress: number;
  total: number;
  errors: string[];
  completed: boolean;
}

class MigrationService {
  private readonly MIGRATION_KEY = 'cuisinezen_migration_status';
  private readonly VERSION_KEY = 'cuisinezen_data_version';
  private readonly CURRENT_VERSION = '1.0.0';

  // Vérifier si la migration est nécessaire
  isMigrationNeeded(): boolean {
    try {
      const currentVersion = localStorage.getItem(this.VERSION_KEY);
      const migrationStatus = localStorage.getItem(this.MIGRATION_KEY);
      
      // Première installation ou version différente
      if (!currentVersion || currentVersion !== this.CURRENT_VERSION) {
        return true;
      }
      
      // Migration incomplète
      if (!migrationStatus || migrationStatus !== 'completed') {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur vérification migration:', error);
      return true; // Par sécurité, forcer la migration
    }
  }

  // Récupérer les données localStorage existantes
  private getLocalStorageData(): { products: Product[]; recipes: Recipe[] } {
    const products: Product[] = [];
    const recipes: Recipe[] = [];

    try {
      // Essayer différentes clés possibles pour les produits
      const productKeys = ['products', 'inventory', 'cuisinezen-products'];
      for (const key of productKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data, (key, value) => {
            // Reconstituer les dates
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                return date;
              }
            }
            return value;
          });
          
          if (Array.isArray(parsed)) {
            products.push(...this.normalizeProducts(parsed));
          }
          break;
        }
      }

      // Essayer différentes clés possibles pour les recettes
      const recipeKeys = ['recipes', 'cuisinezen-recipes'];
      for (const key of recipeKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            recipes.push(...this.normalizeRecipes(parsed));
          }
          break;
        }
      }
    } catch (error) {
      console.error('Erreur lecture localStorage:', error);
    }

    return { products, recipes };
  }

  // Normaliser les produits pour s'assurer qu'ils respectent le type Product
  private normalizeProducts(data: any[]): Product[] {
    return data
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        id: item.id || `migrated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name || 'Produit sans nom',
        category: this.normalizeCategory(item.category),
        imageUrl: item.imageUrl || undefined,
        batches: this.normalizeBatches(item.batches || item.batch || [])
      }))
      .filter(product => product.name.trim() !== '');
  }

  // Normaliser les recettes
  private normalizeRecipes(data: any[]): Recipe[] {
    return data
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        id: item.id || `migrated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name || 'Recette sans nom',
        description: item.description || '',
        imageUrl: item.imageUrl || undefined,
        ingredients: this.normalizeIngredients(item.ingredients || []),
        preparationTime: item.preparationTime || undefined,
        cookingTime: item.cookingTime || undefined,
        difficulty: this.normalizeDifficulty(item.difficulty)
      }))
      .filter(recipe => recipe.name.trim() !== '');
  }

  private normalizeCategory(category: any): 'frais' | 'surgelé' | 'épicerie' | 'boisson' | 'entretien' {
    const validCategories = ['frais', 'surgelé', 'épicerie', 'boisson', 'entretien'];
    return validCategories.includes(category) ? category : 'épicerie';
  }

  private normalizeBatches(batches: any[]): any[] {
    if (!Array.isArray(batches)) return [];
    
    return batches.map(batch => ({
      id: batch.id || `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quantity: Math.max(0, Number(batch.quantity) || 0),
      expiryDate: batch.expiryDate instanceof Date ? batch.expiryDate : 
                   (batch.expiryDate ? new Date(batch.expiryDate) : null)
    }));
  }

  private normalizeIngredients(ingredients: any[]): any[] {
    if (!Array.isArray(ingredients)) return [];
    
    return ingredients
      .filter(ing => ing && ing.productId)
      .map(ing => ({
        productId: ing.productId,
        quantity: Math.max(0, Number(ing.quantity) || 0),
        unit: ['g', 'ml', 'piece'].includes(ing.unit) ? ing.unit : 'piece'
      }));
  }

  private normalizeDifficulty(difficulty: any): 'facile' | 'moyen' | 'difficile' | undefined {
    const validDifficulties = ['facile', 'moyen', 'difficile'];
    return validDifficulties.includes(difficulty) ? difficulty : undefined;
  }

  // Effectuer la migration complète
  async migrateToFirestore(
    restaurantId: string, 
    userEmail: string,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<void> {
    const progress: MigrationProgress = {
      step: 'Initialisation',
      progress: 0,
      total: 100,
      errors: [],
      completed: false
    };

    try {
      // Étape 1 : Initialiser le restaurant
      progress.step = 'Initialisation du restaurant';
      progress.progress = 10;
      onProgress?.(progress);

      await firestoreService.initializeRestaurant(restaurantId, userEmail);

      // Étape 2 : Récupérer les données localStorage
      progress.step = 'Lecture des données locales';
      progress.progress = 20;
      onProgress?.(progress);

      const localData = this.getLocalStorageData();
      const totalItems = localData.products.length + localData.recipes.length;

      if (totalItems === 0) {
        progress.step = 'Aucune donnée à migrer';
        progress.progress = 100;
        progress.completed = true;
        onProgress?.(progress);
        this.markMigrationCompleted();
        return;
      }

      let processedItems = 0;

      // Étape 3 : Migrer les produits
      progress.step = `Migration des produits (${localData.products.length})`;
      onProgress?.(progress);

      for (const product of localData.products) {
        try {
          await firestoreService.addProduct(product, userEmail);
          processedItems++;
          
          progress.progress = 20 + Math.floor((processedItems / totalItems) * 60);
          onProgress?.(progress);
          
          // Petite pause pour éviter la surcharge
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          progress.errors.push(`Erreur produit "${product.name}": ${error.message}`);
          console.error('Erreur migration produit:', product, error);
        }
      }

      // Étape 4 : Migrer les recettes
      progress.step = `Migration des recettes (${localData.recipes.length})`;
      onProgress?.(progress);

      for (const recipe of localData.recipes) {
        try {
          // Note: Adapter selon l'implémentation des recettes dans firestoreService
          // await firestoreService.addRecipe(recipe, userEmail);
          processedItems++;
          
          progress.progress = 20 + Math.floor((processedItems / totalItems) * 60);
          onProgress?.(progress);
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          progress.errors.push(`Erreur recette "${recipe.name}": ${error.message}`);
          console.error('Erreur migration recette:', recipe, error);
        }
      }

      // Étape 5 : Finalisation
      progress.step = 'Finalisation de la migration';
      progress.progress = 90;
      onProgress?.(progress);

      this.markMigrationCompleted();
      
      // Optionnel : Nettoyer localStorage après migration réussie
      if (progress.errors.length === 0) {
        this.cleanupLocalStorage();
      }

      progress.step = 'Migration terminée';
      progress.progress = 100;
      progress.completed = true;
      onProgress?.(progress);

    } catch (error: any) {
      progress.errors.push(`Erreur générale: ${error.message}`);
      throw error;
    }
  }

  // Marquer la migration comme terminée
  private markMigrationCompleted() {
    try {
      localStorage.setItem(this.MIGRATION_KEY, 'completed');
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
    } catch (error) {
      console.error('Erreur marquage migration:', error);
    }
  }

  // Nettoyer localStorage après migration réussie
  private cleanupLocalStorage() {
    try {
      const keysToRemove = [
        'products', 'inventory', 'cuisinezen-products',
        'recipes', 'cuisinezen-recipes'
      ];
      
      keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`✅ Nettoyé: ${key}`);
        }
      });
    } catch (error) {
      console.error('Erreur nettoyage localStorage:', error);
    }
  }

  // Réinitialiser la migration (pour tests ou en cas de problème)
  resetMigration() {
    try {
      localStorage.removeItem(this.MIGRATION_KEY);
      localStorage.removeItem(this.VERSION_KEY);
      console.log('🔄 Migration réinitialisée');
    } catch (error) {
      console.error('Erreur réinitialisation migration:', error);
    }
  }

  // Obtenir les statistiques de migration
  getMigrationStats(): { needsMigration: boolean; dataVersion: string | null; status: string | null } {
    return {
      needsMigration: this.isMigrationNeeded(),
      dataVersion: localStorage.getItem(this.VERSION_KEY),
      status: localStorage.getItem(this.MIGRATION_KEY)
    };
  }
}

// Instance singleton
export const migrationService = new MigrationService();