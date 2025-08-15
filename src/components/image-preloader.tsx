'use client';

import { useEffect, useState } from 'react';
import { useImagePreloader } from '@/hooks/use-image-preloader';
import type { Product, Recipe } from '@/lib/types';

interface ImagePreloaderProps {
  products?: Product[];
  recipes?: Recipe[];
  maxCriticalImages?: number;
  enabled?: boolean;
  onProgress?: (progress: number) => void;
}

/**
 * Composant invisible qui précharge les images critiques en arrière-plan
 */
export function ImagePreloader({
  products = [],
  recipes = [],
  maxCriticalImages = 6,
  enabled = true,
  onProgress,
}: ImagePreloaderProps) {
  const [imagesToPreload, setImagesToPreload] = useState<Array<{ src: string; priority?: 'high' | 'low' }>>([]);

  // Préparer la liste des images à précharger
  useEffect(() => {
    const images: Array<{ src: string; priority?: 'high' | 'low' }> = [];

    // Ajouter les images de produits (les premiers sont prioritaires)
    products.slice(0, maxCriticalImages).forEach((product, index) => {
      if (product.imageUrl) {
        images.push({
          src: product.imageUrl,
          priority: index < 3 ? 'high' : 'low', // Les 3 premiers en haute priorité
        });
      }
    });

    // Ajouter les images de recettes
    recipes.slice(0, maxCriticalImages).forEach((recipe, index) => {
      if (recipe.imageUrl) {
        images.push({
          src: recipe.imageUrl,
          priority: index < 3 ? 'high' : 'low', // Les 3 premières en haute priorité
        });
      }
    });

    setImagesToPreload(images);
  }, [products, recipes, maxCriticalImages]);

  const { progress, isLoading, errors } = useImagePreloader({
    images: imagesToPreload,
    enabled,
    concurrency: 3,
  });

  // Callback pour informer le parent du progrès
  useEffect(() => {
    onProgress?.(progress);
  }, [progress, onProgress]);

  // Log des erreurs en développement
  useEffect(() => {
    if (errors.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn('Image preloading errors:', errors);
    }
  }, [errors]);

  return null; // Composant invisible
}

/**
 * Hook personnalisé pour intégrer facilement le préchargement d'images
 * dans n'importe quel composant
 */
export function useAutoImagePreloader(data: {
  products?: Product[];
  recipes?: Recipe[];
  maxCriticalImages?: number;
}) {
  const { products = [], recipes = [], maxCriticalImages = 6 } = data;
  const [preloadProgress, setPreloadProgress] = useState(0);

  return {
    ImagePreloaderComponent: (
      <ImagePreloader
        products={products}
        recipes={recipes}
        maxCriticalImages={maxCriticalImages}
        onProgress={setPreloadProgress}
      />
    ),
    preloadProgress,
  };
}

/**
 * Composant de préchargement spécifique pour la page d'inventaire
 */
export function InventoryImagePreloader({ products }: { products: Product[] }) {
  return (
    <ImagePreloader
      products={products}
      maxCriticalImages={8}
      enabled={products.length > 0}
    />
  );
}

/**
 * Composant de préchargement spécifique pour la page des recettes
 */
export function RecipesImagePreloader({ recipes }: { recipes: Recipe[] }) {
  return (
    <ImagePreloader
      recipes={recipes}
      maxCriticalImages={8}
      enabled={recipes.length > 0}
    />
  );
}