'use client';

import { useEffect, useState, useCallback } from 'react';
import { preloadImages, preloadImage } from '@/lib/image-utils';

interface UseImagePreloaderProps {
  images: Array<{ src: string; priority?: 'high' | 'low' }>;
  enabled?: boolean;
  concurrency?: number;
}

interface UseImagePreloaderReturn {
  isLoading: boolean;
  loadedCount: number;
  totalCount: number;
  progress: number;
  preloadImage: (src: string, priority?: 'high' | 'low') => Promise<void>;
  errors: string[];
}

export function useImagePreloader({
  images,
  enabled = true,
  concurrency = 3,
}: UseImagePreloaderProps): UseImagePreloaderReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const totalCount = images.length;
  const progress = totalCount > 0 ? (loadedCount / totalCount) * 100 : 0;

  const handlePreloadImage = useCallback(async (src: string, priority: 'high' | 'low' = 'low') => {
    try {
      await preloadImage(src, priority);
      setLoadedCount(prev => prev + 1);
    } catch (error) {
      const errorMessage = `Failed to preload image: ${src}`;
      setErrors(prev => [...prev, errorMessage]);
      console.warn(errorMessage, error);
      // Toujours incrémenter pour ne pas bloquer le compteur
      setLoadedCount(prev => prev + 1);
    }
  }, []);

  useEffect(() => {
    if (!enabled || images.length === 0) {
      return;
    }

    let isMounted = true;

    const preloadAllImages = async () => {
      setIsLoading(true);
      setLoadedCount(0);
      setErrors([]);

      // Séparer les images par priorité
      const highPriorityImages = images.filter(img => img.priority === 'high');
      const lowPriorityImages = images.filter(img => img.priority !== 'high');

      try {
        // Précharger d'abord les images haute priorité
        if (highPriorityImages.length > 0) {
          await Promise.allSettled(
            highPriorityImages.map(img => handlePreloadImage(img.src, 'high'))
          );
        }

        if (!isMounted) return;

        // Puis précharger les images basse priorité par batch
        for (let i = 0; i < lowPriorityImages.length; i += concurrency) {
          if (!isMounted) break;
          
          const batch = lowPriorityImages.slice(i, i + concurrency);
          await Promise.allSettled(
            batch.map(img => handlePreloadImage(img.src, 'low'))
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    preloadAllImages();

    return () => {
      isMounted = false;
    };
  }, [images, enabled, concurrency, handlePreloadImage]);

  return {
    isLoading,
    loadedCount,
    totalCount,
    progress,
    preloadImage: handlePreloadImage,
    errors,
  };
}

// Hook simplifié pour précharger une seule image
export function useSingleImagePreloader(src: string, priority: 'high' | 'low' = 'low') {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setError(null);

    preloadImage(src, priority)
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [src, priority]);

  return { isLoaded, isLoading, error };
}