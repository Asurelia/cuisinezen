import { storageService, ImageUrls, ImageSize, UploadResult } from './storage.service';
import { cacheService } from './cache.service';

// Interface pour les options d'upload
export interface ImageUploadOptions {
  userId?: string;
  replaceExisting?: boolean;
  skipCache?: boolean;
}

// Interface pour les options de récupération
export interface ImageGetOptions {
  useCache?: boolean;
  size?: ImageSize;
  transformations?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg';
  };
}

// Interface pour les statistiques d'utilisation
export interface ImageUsageStats {
  totalImages: number;
  categoryBreakdown: Record<'product' | 'recipe', number>;
  cacheStats: {
    size: number;
    maxSize: number;
    hitRate: number;
  };
  storageUsage: {
    estimated: string; // En MB
  };
}

class ImageService {
  private static instance: ImageService;

  private constructor() {}

  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  /**
   * Upload une image avec gestion automatique du cache
   */
  public async uploadImage(
    file: File,
    category: 'product' | 'recipe',
    options: ImageUploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const result = await storageService.uploadImage(file, category, options.userId);

      // Mettre en cache automatiquement sauf si demandé autrement
      if (!options.skipCache) {
        cacheService.setImageUrls(category, result.id, result.urls);
      }

      return result;
    } catch (error) {
      console.error('Erreur lors de l\'upload d\'image:', error);
      throw error;
    }
  }

  /**
   * Récupère une URL d'image avec gestion du cache
   */
  public async getImageUrl(
    category: 'product' | 'recipe',
    imageId: string,
    options: ImageGetOptions = {}
  ): Promise<string> {
    const { useCache = true, size = 'medium', transformations } = options;

    try {
      // Essayer d'abord le cache si activé
      if (useCache) {
        const cachedUrl = cacheService.getImageUrl(category, imageId, size);
        if (cachedUrl) {
          return transformations 
            ? cacheService.optimizeUrlForCDN(cachedUrl, transformations)
            : cachedUrl;
        }
      }

      // Si pas en cache, récupérer depuis Storage
      const url = await storageService.getImageUrl(category, imageId, size);

      // Mettre en cache pour la prochaine fois
      if (useCache) {
        const allUrls = await storageService.getAllImageUrls(category, imageId);
        cacheService.setImageUrls(category, imageId, allUrls);
      }

      return transformations 
        ? cacheService.optimizeUrlForCDN(url, transformations)
        : url;
    } catch (error) {
      console.error('Erreur lors de la récupération d\'URL:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les URLs d'une image avec gestion du cache
   */
  public async getAllImageUrls(
    category: 'product' | 'recipe',
    imageId: string,
    useCache: boolean = true
  ): Promise<ImageUrls> {
    try {
      // Essayer d'abord le cache si activé
      if (useCache) {
        const cachedUrls = cacheService.getImageUrls(category, imageId);
        if (cachedUrls) {
          return cachedUrls;
        }
      }

      // Si pas en cache, récupérer depuis Storage
      const urls = await storageService.getAllImageUrls(category, imageId);

      // Mettre en cache pour la prochaine fois
      if (useCache) {
        cacheService.setImageUrls(category, imageId, urls);
      }

      return urls;
    } catch (error) {
      console.error('Erreur lors de la récupération des URLs:', error);
      throw error;
    }
  }

  /**
   * Supprime une image du storage et du cache
   */
  public async deleteImage(
    category: 'product' | 'recipe',
    imageId: string
  ): Promise<void> {
    try {
      // Supprimer du storage
      await storageService.deleteImage(category, imageId);

      // Supprimer du cache
      cacheService.removeImage(category, imageId);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images en parallèle
   */
  public async uploadMultipleImages(
    files: File[],
    category: 'product' | 'recipe',
    options: ImageUploadOptions = {}
  ): Promise<UploadResult[]> {
    try {
      const uploadPromises = files.map(file => 
        this.uploadImage(file, category, options)
      );

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Erreur lors de l\'upload multiple:', error);
      throw error;
    }
  }

  /**
   * Optimise une image existante
   */
  public async optimizeImage(
    category: 'product' | 'recipe',
    imageId: string
  ): Promise<ImageUrls> {
    try {
      // Regenerer les thumbnails
      const urls = await storageService.optimizeImage(category, imageId);

      // Mettre à jour le cache
      cacheService.setImageUrls(category, imageId, urls);

      return urls;
    } catch (error) {
      console.error('Erreur lors de l\'optimisation:', error);
      throw error;
    }
  }

  /**
   * Pré-charge les images les plus utilisées
   */
  public async preloadPopularImages(
    imageIds: { category: 'product' | 'recipe', id: string }[]
  ): Promise<void> {
    try {
      // Récupérer et mettre en cache les URLs
      const urlPromises = imageIds.map(async ({ category, id }) => {
        try {
          const urls = await this.getAllImageUrls(category, id, true);
          return { category, id, urls };
        } catch (error) {
          console.warn(`Impossible de précharger ${category}:${id}`, error);
          return null;
        }
      });

      const results = await Promise.all(urlPromises);
      const validResults = results.filter(Boolean);

      // Précharger les images dans le navigateur
      cacheService.preloadImages(validResults.map(r => ({ category: r!.category, id: r!.id })));
    } catch (error) {
      console.error('Erreur lors du préchargement:', error);
    }
  }

  /**
   * Nettoie les images non utilisées
   */
  public async cleanupUnusedImages(
    usedImages: {
      products: string[];
      recipes: string[];
    }
  ): Promise<{ deletedProducts: number; deletedRecipes: number }> {
    try {
      const [deletedProducts, deletedRecipes] = await Promise.all([
        storageService.cleanupUnusedImages('product', usedImages.products),
        storageService.cleanupUnusedImages('recipe', usedImages.recipes)
      ]);

      // Nettoyer aussi le cache
      this.cleanupCache();

      return { deletedProducts, deletedRecipes };
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      return { deletedProducts: 0, deletedRecipes: 0 };
    }
  }

  /**
   * Nettoie le cache
   */
  public cleanupCache(): void {
    // Le cache se nettoie automatiquement, mais on peut forcer
    cacheService.clearCache();
  }

  /**
   * Obtient les statistiques d'utilisation
   */
  public async getUsageStats(): Promise<ImageUsageStats> {
    try {
      const [productImages, recipeImages] = await Promise.all([
        storageService.listImages('product'),
        storageService.listImages('recipe')
      ]);

      const cacheStats = cacheService.getCacheStats();

      // Estimation grossière de l'utilisation storage (approximative)
      const totalImages = productImages.length + recipeImages.length;
      const estimatedSize = totalImages * 0.5; // ~500KB par image (moyenne avec thumbnails)

      return {
        totalImages,
        categoryBreakdown: {
          product: productImages.length,
          recipe: recipeImages.length
        },
        cacheStats: {
          size: cacheStats.size,
          maxSize: cacheStats.maxSize,
          hitRate: cacheStats.hitRate
        },
        storageUsage: {
          estimated: `${estimatedSize.toFixed(1)} MB`
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      return {
        totalImages: 0,
        categoryBreakdown: { product: 0, recipe: 0 },
        cacheStats: { size: 0, maxSize: 0, hitRate: 0 },
        storageUsage: { estimated: '0 MB' }
      };
    }
  }

  /**
   * Génère une URL optimisée pour l'affichage responsive
   */
  public async getResponsiveImageUrls(
    category: 'product' | 'recipe',
    imageId: string
  ): Promise<{
    src: string;
    srcSet: string;
    sizes: string;
  }> {
    try {
      const urls = await this.getAllImageUrls(category, imageId);

      // URL principale (medium par défaut)
      const src = urls.medium;

      // Set d'URLs pour différentes résolutions
      const srcSet = [
        `${urls.small} 300w`,
        `${urls.medium} 600w`,
        `${urls.large} 1200w`
      ].join(', ');

      // Règles de tailles pour l'affichage responsive
      const sizes = '(max-width: 300px) 300px, (max-width: 600px) 600px, 1200px';

      return { src, srcSet, sizes };
    } catch (error) {
      console.error('Erreur lors de la génération des URLs responsive:', error);
      throw error;
    }
  }

  /**
   * Vérifie la santé du service (diagnostic)
   */
  public async healthCheck(): Promise<{
    storage: boolean;
    cache: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let storage = false;
    let cache = false;

    try {
      // Test Storage
      await storageService.listImages('product');
      storage = true;
    } catch (error) {
      errors.push(`Storage error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Test Cache
      cacheService.getCacheStats();
      cache = true;
    } catch (error) {
      errors.push(`Cache error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { storage, cache, errors };
  }
}

// Export de l'instance singleton
export const imageService = ImageService.getInstance();

// Re-export des types utiles
export type { ImageUrls, ImageSize, UploadResult } from './storage.service';