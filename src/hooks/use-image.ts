import { useState, useEffect, useCallback } from 'react';
import { imageService, ImageGetOptions, ImageUrls } from '@/services/image.service';

interface UseImageState {
  loading: boolean;
  error: string | null;
  url: string | null;
  urls: ImageUrls | null;
}

interface UseImageReturn extends UseImageState {
  refetch: () => Promise<void>;
  getResponsive: () => Promise<{ src: string; srcSet: string; sizes: string } | null>;
}

export const useImage = (
  category: 'product' | 'recipe' | null,
  imageId: string | null,
  options: ImageGetOptions = {}
): UseImageReturn => {
  const [state, setState] = useState<UseImageState>({
    loading: false,
    error: null,
    url: null,
    urls: null
  });

  const fetchImage = useCallback(async () => {
    if (!category || !imageId) {
      setState({
        loading: false,
        error: null,
        url: null,
        urls: null
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [url, urls] = await Promise.all([
        imageService.getImageUrl(category, imageId, options),
        imageService.getAllImageUrls(category, imageId, options.useCache ?? true)
      ]);

      setState({
        loading: false,
        error: null,
        url,
        urls
      });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        url: null,
        urls: null
      });
    }
  }, [category, imageId, options]);

  const getResponsive = useCallback(async () => {
    if (!category || !imageId) return null;

    try {
      return await imageService.getResponsiveImageUrls(category, imageId);
    } catch (error) {
      console.error('Erreur lors de la récupération des URLs responsive:', error);
      return null;
    }
  }, [category, imageId]);

  useEffect(() => {
    fetchImage();
  }, [fetchImage]);

  return {
    ...state,
    refetch: fetchImage,
    getResponsive
  };
};

// Hook pour gérer plusieurs images
interface UseMultipleImagesReturn {
  loading: boolean;
  error: string | null;
  images: Record<string, ImageUrls>;
  getImage: (imageId: string) => ImageUrls | null;
  preloadImages: (imageIds: string[]) => Promise<void>;
}

export const useMultipleImages = (
  category: 'product' | 'recipe',
  imageIds: string[],
  options: ImageGetOptions = {}
): UseMultipleImagesReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, ImageUrls>>({});

  const fetchImages = useCallback(async () => {
    if (imageIds.length === 0) {
      setImages({});
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const imagePromises = imageIds.map(async (imageId) => {
        try {
          const urls = await imageService.getAllImageUrls(category, imageId, options.useCache ?? true);
          return { imageId, urls };
        } catch (error) {
          console.warn(`Impossible de charger l'image ${imageId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(imagePromises);
      const validResults = results.filter(Boolean) as { imageId: string; urls: ImageUrls }[];

      const imageMap = validResults.reduce((acc, { imageId, urls }) => {
        acc[imageId] = urls;
        return acc;
      }, {} as Record<string, ImageUrls>);

      setImages(imageMap);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [category, imageIds, options]);

  const getImage = useCallback((imageId: string): ImageUrls | null => {
    return images[imageId] || null;
  }, [images]);

  const preloadImages = useCallback(async (preloadIds: string[]) => {
    const imageData = preloadIds.map(id => ({ category, id }));
    await imageService.preloadPopularImages(imageData);
  }, [category]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return {
    loading,
    error,
    images,
    getImage,
    preloadImages
  };
};