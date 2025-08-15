'use client';

import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator,
  writeBatch,
  serverTimestamp,
  type Unsubscribe,
  type DocumentData,
  type QuerySnapshot,
  type DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, Recipe, Category, Batch } from '@/lib/types';

// Structure optimisée pour 1 restaurant avec 5-6 utilisateurs
export interface RestaurantData {
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

export interface FirestoreProduct extends Omit<Product, 'batches'> {
  batches: (Omit<Batch, 'expiryDate'> & { expiryDate: any })[];
  restaurantId: string;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

export interface FirestoreRecipe extends Recipe {
  restaurantId: string;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

export interface UserActivity {
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

// Configuration du cache pour optimiser les coûts
class FirestoreCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }
}

class FirestoreService {
  private cache = new FirestoreCache();
  private listeners = new Map<string, Unsubscribe>();
  private isOnline = true;
  private restaurantId: string | null = null;

  constructor() {
    // Écouter les changements de connectivité
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setOnlineStatus(true));
      window.addEventListener('offline', () => this.setOnlineStatus(false));
    }
  }

  // Gestion de la connectivité
  private async setOnlineStatus(online: boolean) {
    this.isOnline = online;
    if (!db) return;

    try {
      if (online) {
        await enableNetwork(db);
        console.log('✅ Firestore connecté');
      } else {
        await disableNetwork(db);
        console.log('📴 Firestore hors ligne');
      }
    } catch (error) {
      console.error('Erreur changement statut réseau:', error);
    }
  }

  // Initialisation du restaurant
  async initializeRestaurant(restaurantId: string, adminEmail: string): Promise<void> {
    if (!db) throw new Error('Firestore non initialisé');
    
    this.restaurantId = restaurantId;
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    
    try {
      const restaurantSnap = await getDoc(restaurantRef);
      
      if (!restaurantSnap.exists()) {
        const restaurantData: RestaurantData = {
          id: restaurantId,
          name: 'Mon Restaurant',
          adminEmails: [adminEmail],
          settings: {
            timezone: 'Europe/Paris',
            currency: 'EUR',
            features: {
              inventory: true,
              recipes: true,
              menu: true,
              shoppingList: true
            }
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(restaurantRef, restaurantData);
        console.log('✅ Restaurant initialisé');
      }
    } catch (error) {
      console.error('Erreur initialisation restaurant:', error);
      throw error;
    }
  }

  // Utilitaires pour la structure des collections
  private getProductsCollection() {
    if (!db || !this.restaurantId) throw new Error('Service non initialisé');
    return collection(db, 'restaurants', this.restaurantId, 'products');
  }

  private getRecipesCollection() {
    if (!db || !this.restaurantId) throw new Error('Service non initialisé');
    return collection(db, 'restaurants', this.restaurantId, 'recipes');
  }

  private getActivitiesCollection() {
    if (!db || !this.restaurantId) throw new Error('Service non initialisé');
    return collection(db, 'restaurants', this.restaurantId, 'activities');
  }

  // CRUD Products avec cache intelligent
  async getProducts(): Promise<Product[]> {
    const cacheKey = `products-${this.restaurantId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isOnline) {
      return cached;
    }

    try {
      const productsRef = this.getProductsCollection();
      const q = query(productsRef, orderBy('name'));
      const snapshot = await getDoc(doc(productsRef.firestore, productsRef.path, '_'));
      
      const products: Product[] = [];
      // Convertir les données Firestore
      snapshot.docs?.forEach(doc => {
        const data = doc.data() as FirestoreProduct;
        const product: Product = {
          id: doc.id,
          name: data.name,
          category: data.category,
          imageUrl: data.imageUrl,
          batches: data.batches.map(batch => ({
            ...batch,
            expiryDate: batch.expiryDate?.toDate() || null
          }))
        };
        products.push(product);
      });

      // Cache pour 2 minutes pour réduire les lectures
      this.cache.set(cacheKey, products, 2 * 60 * 1000);
      return products;
    } catch (error) {
      console.error('Erreur lecture produits:', error);
      // Retourner le cache en cas d'erreur
      return cached || [];
    }
  }

  async addProduct(product: Omit<Product, 'id'>, userEmail: string): Promise<string> {
    if (!db || !this.restaurantId) throw new Error('Service non initialisé');

    const batch = writeBatch(db);
    const productId = doc(this.getProductsCollection()).id;
    
    const firestoreProduct: Omit<FirestoreProduct, 'id'> = {
      ...product,
      batches: product.batches.map(batch => ({
        ...batch,
        expiryDate: batch.expiryDate ? batch.expiryDate : null
      })),
      restaurantId: this.restaurantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userEmail
    };

    // Ajouter le produit
    const productRef = doc(this.getProductsCollection(), productId);
    batch.set(productRef, firestoreProduct);

    // Ajouter l'activité
    const activityRef = doc(this.getActivitiesCollection());
    const activity: Omit<UserActivity, 'id'> = {
      userId: userEmail,
      userEmail,
      action: 'create',
      entityType: 'product',
      entityId: productId,
      entityName: product.name,
      timestamp: serverTimestamp(),
      restaurantId: this.restaurantId
    };
    batch.set(activityRef, activity);

    await batch.commit();
    
    // Invalider le cache
    this.cache.delete(`products-${this.restaurantId}`);
    
    return productId;
  }

  async updateProduct(id: string, updates: Partial<Product>, userEmail: string): Promise<void> {
    if (!db || !this.restaurantId) throw new Error('Service non initialisé');

    const batch = writeBatch(db);
    const productRef = doc(this.getProductsCollection(), id);
    
    const firestoreUpdates: Partial<FirestoreProduct> = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    if (updates.batches) {
      firestoreUpdates.batches = updates.batches.map(batch => ({
        ...batch,
        expiryDate: batch.expiryDate ? batch.expiryDate : null
      }));
    }

    batch.update(productRef, firestoreUpdates);

    // Ajouter l'activité
    const activityRef = doc(this.getActivitiesCollection());
    const activity: Omit<UserActivity, 'id'> = {
      userId: userEmail,
      userEmail,
      action: 'update',
      entityType: 'product',
      entityId: id,
      entityName: updates.name || 'Produit',
      timestamp: serverTimestamp(),
      restaurantId: this.restaurantId
    };
    batch.set(activityRef, activity);

    await batch.commit();
    
    // Invalider le cache
    this.cache.delete(`products-${this.restaurantId}`);
  }

  async deleteProduct(id: string, userEmail: string): Promise<void> {
    if (!db || !this.restaurantId) throw new Error('Service non initialisé');

    const batch = writeBatch(db);
    const productRef = doc(this.getProductsCollection(), id);
    
    // Récupérer le nom du produit avant suppression
    const productSnap = await getDoc(productRef);
    const productName = productSnap.exists() ? productSnap.data().name : 'Produit';

    batch.delete(productRef);

    // Ajouter l'activité
    const activityRef = doc(this.getActivitiesCollection());
    const activity: Omit<UserActivity, 'id'> = {
      userId: userEmail,
      userEmail,
      action: 'delete',
      entityType: 'product',
      entityId: id,
      entityName: productName,
      timestamp: serverTimestamp(),
      restaurantId: this.restaurantId
    };
    batch.set(activityRef, activity);

    await batch.commit();
    
    // Invalider le cache
    this.cache.delete(`products-${this.restaurantId}`);
  }

  // CRUD Recipes avec même pattern
  async getRecipes(): Promise<Recipe[]> {
    const cacheKey = `recipes-${this.restaurantId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isOnline) {
      return cached;
    }

    try {
      const recipesRef = this.getRecipesCollection();
      const q = query(recipesRef, orderBy('name'));
      // Implementation similaire aux produits...
      
      const recipes: Recipe[] = [];
      // Convertir et retourner...
      
      this.cache.set(cacheKey, recipes, 2 * 60 * 1000);
      return recipes;
    } catch (error) {
      console.error('Erreur lecture recettes:', error);
      return cached || [];
    }
  }

  // Synchronisation temps réel
  subscribeToProducts(callback: (products: Product[]) => void): Unsubscribe {
    if (!db || !this.restaurantId) {
      throw new Error('Service non initialisé');
    }

    const productsRef = this.getProductsCollection();
    const q = query(productsRef, orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as FirestoreProduct;
        const product: Product = {
          id: doc.id,
          name: data.name,
          category: data.category,
          imageUrl: data.imageUrl,
          batches: data.batches.map(batch => ({
            ...batch,
            expiryDate: batch.expiryDate?.toDate() || null
          }))
        };
        products.push(product);
      });
      
      // Mettre à jour le cache
      this.cache.set(`products-${this.restaurantId}`, products, 2 * 60 * 1000);
      callback(products);
    }, (error) => {
      console.error('Erreur écoute produits:', error);
      // En cas d'erreur, utiliser le cache
      const cached = this.cache.get(`products-${this.restaurantId}`);
      if (cached) callback(cached);
    });

    // Stocker pour nettoyage
    this.listeners.set(`products-${this.restaurantId}`, unsubscribe);
    return unsubscribe;
  }

  subscribeToRecipes(callback: (recipes: Recipe[]) => void): Unsubscribe {
    // Implementation similaire pour les recettes
    if (!db || !this.restaurantId) {
      throw new Error('Service non initialisé');
    }
    
    // Pattern similaire aux produits...
    return () => {}; // Placeholder
  }

  // Nettoyage
  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    this.cache.clear();
  }

  // Statistiques pour monitoring des coûts
  getCacheStats() {
    return {
      cacheSize: this.cache['cache'].size,
      activeListeners: this.listeners.size,
      isOnline: this.isOnline
    };
  }
}

// Instance singleton
export const firestoreService = new FirestoreService();

// Utilitaires d'exportation
export type { FirestoreProduct, FirestoreRecipe, UserActivity, RestaurantData };