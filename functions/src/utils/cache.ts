/**
 * Système de cache simple pour optimiser les performances et réduire les coûts
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  
  /**
   * Obtenir une valeur du cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Vérifier si le cache a expiré
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  /**
   * Mettre une valeur en cache
   */
  set<T>(key: string, data: T, ttl: number = 3600000): void { // TTL par défaut: 1 heure
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  /**
   * Supprimer une valeur du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Vider tout le cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Nettoyer les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Obtenir des statistiques du cache
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Instance globale du cache
export const cache = new MemoryCache();

/**
 * Décorateur pour mettre en cache les résultats de fonction
 */
export function cached(ttl: number = 3600000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyName}:${JSON.stringify(args)}`;
      
      // Vérifier le cache
      const cachedResult = cache.get(cacheKey);
      if (cachedResult !== null) {
        console.log(`Cache hit pour ${cacheKey}`);
        return cachedResult;
      }
      
      // Exécuter la fonction
      console.log(`Cache miss pour ${cacheKey}`);
      const result = await method.apply(this, args);
      
      // Mettre en cache le résultat
      cache.set(cacheKey, result, ttl);
      
      return result;
    };
  };
}

/**
 * Utilitaire pour gérer le cache avec clé personnalisée
 */
export async function withCache<T>(
  key: string,
  factory: () => Promise<T>,
  ttl: number = 3600000
): Promise<T> {
  // Vérifier le cache
  const cached = cache.get<T>(key);
  if (cached !== null) {
    console.log(`Cache hit: ${key}`);
    return cached;
  }
  
  // Générer les données
  console.log(`Cache miss: ${key}`);
  const data = await factory();
  
  // Mettre en cache
  cache.set(key, data, ttl);
  
  return data;
}

/**
 * Nettoyer automatiquement le cache toutes les heures
 */
setInterval(() => {
  cache.cleanup();
  console.log("Cache nettoyé automatiquement");
}, 3600000); // 1 heure