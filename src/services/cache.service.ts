import { ImageUrls, ImageSize } from './storage.service';

// Interface pour les entrées de cache
interface CacheEntry {
  urls: ImageUrls;
  timestamp: number;
  lastAccessed: number;
}

// Configuration du cache
const CACHE_CONFIG = {
  MAX_ENTRIES: 200, // Maximum 200 images en cache
  TTL: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
  CLEANUP_INTERVAL: 30 * 60 * 1000, // Nettoyage toutes les 30 minutes
} as const;

class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Démarrer le nettoyage automatique
    this.startCleanupInterval();
    
    // Charger le cache depuis localStorage si disponible
    this.loadFromLocalStorage();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Génère une clé de cache unique
   */
  private generateCacheKey(category: string, imageId: string): string {
    return `${category}:${imageId}`;
  }

  /**
   * Vérifie si une entrée de cache est valide
   */
  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < CACHE_CONFIG.TTL;
  }

  /**
   * Met en cache les URLs d'une image
   */
  public setImageUrls(
    category: 'product' | 'recipe',
    imageId: string,
    urls: ImageUrls
  ): void {
    const key = this.generateCacheKey(category, imageId);
    const now = Date.now();

    const entry: CacheEntry = {
      urls,
      timestamp: now,
      lastAccessed: now
    };

    this.cache.set(key, entry);

    // Vérifier la limite de taille du cache
    this.enforceMaxSize();

    // Sauvegarder dans localStorage
    this.saveToLocalStorage();
  }

  /**
   * Récupère les URLs d'une image depuis le cache
   */
  public getImageUrls(
    category: 'product' | 'recipe',
    imageId: string
  ): ImageUrls | null {
    const key = this.generateCacheKey(category, imageId);
    const entry = this.cache.get(key);

    if (!entry || !this.isValidEntry(entry)) {
      // Supprimer l'entrée expirée
      this.cache.delete(key);
      return null;
    }

    // Mettre à jour le timestamp d'accès
    entry.lastAccessed = Date.now();

    return entry.urls;
  }

  /**
   * Récupère l'URL d'une taille spécifique depuis le cache
   */
  public getImageUrl(
    category: 'product' | 'recipe',
    imageId: string,
    size: ImageSize
  ): string | null {
    const urls = this.getImageUrls(category, imageId);
    return urls ? urls[size] : null;
  }

  /**
   * Supprime une image du cache
   */
  public removeImage(category: 'product' | 'recipe', imageId: string): void {
    const key = this.generateCacheKey(category, imageId);
    this.cache.delete(key);
    this.saveToLocalStorage();
  }

  /**
   * Vide complètement le cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.saveToLocalStorage();
  }

  /**
   * Applique la limite de taille du cache
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= CACHE_CONFIG.MAX_ENTRIES) {
      return;
    }

    // Trier par dernier accès (plus ancien en premier)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    // Supprimer les entrées les plus anciennes
    const toRemove = entries.slice(0, this.cache.size - CACHE_CONFIG.MAX_ENTRIES);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  /**
   * Nettoie les entrées expirées
   */
  private cleanupExpiredEntries(): void {
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValidEntry(entry)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.cache.delete(key));

    if (keysToRemove.length > 0) {
      this.saveToLocalStorage();
    }
  }

  /**
   * Démarre l'intervalle de nettoyage automatique
   */
  private startCleanupInterval(): void {
    if (typeof window === 'undefined') return; // Pas côté serveur

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, CACHE_CONFIG.CLEANUP_INTERVAL);
  }

  /**
   * Arrête l'intervalle de nettoyage
   */
  public stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Sauvegarde le cache dans localStorage
   */
  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('cuisinezen_image_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Impossible de sauvegarder le cache:', error);
    }
  }

  /**
   * Charge le cache depuis localStorage
   */
  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const cacheData = localStorage.getItem('cuisinezen_image_cache');
      if (!cacheData) return;

      const entries: [string, CacheEntry][] = JSON.parse(cacheData);
      
      // Filtrer les entrées valides
      const validEntries = entries.filter(([, entry]) => this.isValidEntry(entry));
      
      this.cache = new Map(validEntries);
    } catch (error) {
      console.warn('Impossible de charger le cache:', error);
      // En cas d'erreur, vider localStorage
      localStorage.removeItem('cuisinezen_image_cache');
    }
  }

  /**
   * Pré-charge les images les plus utilisées
   */
  public preloadImages(imageIds: { category: 'product' | 'recipe', id: string }[]): void {
    imageIds.forEach(({ category, id }) => {
      const cached = this.getImageUrls(category, id);
      if (cached) {
        // Preload des images les plus utilisées
        const img = new Image();
        img.src = cached.medium; // Charger la taille moyenne par défaut
      }
    });
  }

  /**
   * Obtient les statistiques du cache
   */
  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);

    return {
      size: this.cache.size,
      maxSize: CACHE_CONFIG.MAX_ENTRIES,
      hitRate: 0, // À implémenter si nécessaire
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }

  /**
   * Préfixe les URLs avec les paramètres CDN de Firebase
   */
  public optimizeUrlForCDN(url: string, transformations?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg';
  }): string {
    if (!transformations) return url;

    const params = new URLSearchParams();
    
    if (transformations.width) params.set('w', transformations.width.toString());
    if (transformations.height) params.set('h', transformations.height.toString());
    if (transformations.quality) params.set('q', transformations.quality.toString());
    if (transformations.format) params.set('f', transformations.format);

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }
}

// Export de l'instance singleton
export const cacheService = CacheService.getInstance();

// Export des types et constantes
export { CACHE_CONFIG, type CacheEntry };