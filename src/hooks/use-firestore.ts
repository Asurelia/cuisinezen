'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { firestoreService } from '@/services/firestore';
import { offlineManager } from '@/services/offline-manager';
import type { Product, Recipe } from '@/lib/types';

// Hook principal pour remplacer useLocalStorage
export function useFirestoreProducts(restaurantId?: string) {
  const [user] = useAuthState(auth);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialisation du service
  useEffect(() => {
    if (user?.email && restaurantId) {
      firestoreService.initializeRestaurant(restaurantId, user.email)
        .catch(err => setError(`Erreur initialisation: ${err.message}`));
    }
  }, [user?.email, restaurantId]);

  // Chargement initial et synchronisation temps réel
  useEffect(() => {
    if (!user?.email || !restaurantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Chargement initial
    firestoreService.getProducts()
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        setError(`Erreur lecture: ${err.message}`);
        setLoading(false);
      });

    // Écoute temps réel
    try {
      const unsubscribe = firestoreService.subscribeToProducts((data) => {
        setProducts(data);
        setError(null);
      });
      unsubscribeRef.current = unsubscribe;
    } catch (err: any) {
      setError(`Erreur synchronisation: ${err.message}`);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.email, restaurantId]);

  // Actions CRUD
  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    if (!user?.email) throw new Error('Utilisateur non connecté');

    try {
      if (navigator.onLine) {
        await firestoreService.addProduct(product, user.email);
      } else {
        // Mode offline : ajouter à la queue
        offlineManager.addToQueue({
          type: 'create',
          collection: 'products',
          data: { ...product, createdBy: user.email }
        });
        
        // Optimistic update local
        const tempId = `temp-${Date.now()}`;
        setProducts(prev => [...prev, { ...product, id: tempId }]);
      }
    } catch (error: any) {
      throw new Error(`Erreur ajout produit: ${error.message}`);
    }
  }, [user?.email]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    if (!user?.email) throw new Error('Utilisateur non connecté');

    try {
      if (navigator.onLine) {
        await firestoreService.updateProduct(id, updates, user.email);
      } else {
        // Mode offline : ajouter à la queue
        offlineManager.addToQueue({
          type: 'update',
          collection: 'products',
          documentId: id,
          data: { ...updates, updatedBy: user.email }
        });
        
        // Optimistic update local
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      }
    } catch (error: any) {
      throw new Error(`Erreur mise à jour produit: ${error.message}`);
    }
  }, [user?.email]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!user?.email) throw new Error('Utilisateur non connecté');

    try {
      if (navigator.onLine) {
        await firestoreService.deleteProduct(id, user.email);
      } else {
        // Mode offline : ajouter à la queue
        offlineManager.addToQueue({
          type: 'delete',
          collection: 'products',
          documentId: id,
          data: { deletedBy: user.email }
        });
        
        // Optimistic update local
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (error: any) {
      throw new Error(`Erreur suppression produit: ${error.message}`);
    }
  }, [user?.email]);

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    refresh: () => firestoreService.getProducts().then(setProducts)
  };
}

// Hook similaire pour les recettes
export function useFirestoreRecipes(restaurantId?: string) {
  const [user] = useAuthState(auth);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Pattern similaire aux produits...
  useEffect(() => {
    if (!user?.email || !restaurantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    firestoreService.getRecipes()
      .then(data => {
        setRecipes(data);
        setLoading(false);
      })
      .catch(err => {
        setError(`Erreur lecture recettes: ${err.message}`);
        setLoading(false);
      });

    try {
      const unsubscribe = firestoreService.subscribeToRecipes((data) => {
        setRecipes(data);
        setError(null);
      });
      unsubscribeRef.current = unsubscribe;
    } catch (err: any) {
      setError(`Erreur synchronisation recettes: ${err.message}`);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.email, restaurantId]);

  const addRecipe = useCallback(async (recipe: Omit<Recipe, 'id'>) => {
    if (!user?.email) throw new Error('Utilisateur non connecté');
    // Implementation similaire aux produits...
  }, [user?.email]);

  const updateRecipe = useCallback(async (id: string, updates: Partial<Recipe>) => {
    if (!user?.email) throw new Error('Utilisateur non connecté');
    // Implementation similaire aux produits...
  }, [user?.email]);

  const deleteRecipe = useCallback(async (id: string) => {
    if (!user?.email) throw new Error('Utilisateur non connecté');
    // Implementation similaire aux produits...
  }, [user?.email]);

  return {
    recipes,
    loading,
    error,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    refresh: () => firestoreService.getRecipes().then(setRecipes)
  };
}

// Hook pour la gestion d'un seul item (pour optimiser les lectures)
export function useFirestoreProduct(id: string, restaurantId?: string) {
  const [user] = useAuthState(auth);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email || !restaurantId || !id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Implémenter la lecture d'un seul produit si nécessaire
    // Pour l'instant, utiliser la liste complète (cache local)
    firestoreService.getProducts()
      .then(products => {
        const found = products.find(p => p.id === id);
        setProduct(found || null);
        setLoading(false);
      })
      .catch(err => {
        setError(`Erreur lecture produit: ${err.message}`);
        setLoading(false);
      });
  }, [id, user?.email, restaurantId]);

  return { product, loading, error };
}

// Hook pour les statistiques et monitoring
export function useFirestoreStats() {
  const [stats, setStats] = useState({
    cacheSize: 0,
    activeListeners: 0,
    isOnline: true,
    queueLength: 0
  });

  useEffect(() => {
    const updateStats = () => {
      const firestoreStats = firestoreService.getCacheStats();
      const offlineStats = offlineManager.getQueueStatus();
      
      setStats({
        cacheSize: firestoreStats.cacheSize,
        activeListeners: firestoreStats.activeListeners,
        isOnline: firestoreStats.isOnline,
        queueLength: offlineStats.queueLength
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}

// Hook pour les permissions utilisateur
export function useUserPermissions(restaurantId?: string) {
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email || !restaurantId) {
      setLoading(false);
      return;
    }

    // Pour l'instant, utiliser la logique existante
    const { isAdmin: checkIsAdmin } = require('@/lib/firebase');
    setIsAdmin(checkIsAdmin(user.email));
    setLoading(false);
  }, [user?.email, restaurantId]);

  return { isAdmin, loading, userEmail: user?.email };
}