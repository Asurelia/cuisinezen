'use client';

/**
 * Système de cache intelligent multi-niveaux avec invalidation sémantique,
 * compression différentielle et prédiction des accès
 */

interface CacheLayer {
  name: string;
  maxSize: number;
  ttl: number;
  compressionEnabled: boolean;
  persistenceEnabled: boolean;
  priority: number;
}

interface CacheEntry<T = any> {
  key: string;
  data: T;
  metadata: {
    createdAt: number;
    lastAccessed: number;
    accessCount: number;
    size: number;
    compressed: boolean;
    layer: string;
    tags: string[];
    dependencies: string[];
    version: number;
  };
  ttl: number;
  priority: number;
}

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  compressionRatio: number;
  averageResponseTime: number;
  memoryUsage: number;
  evictionCount: number;
  layerStats: Record<string, {
    size: number;
    hitRate: number;
    evictions: number;
  }>;
}

interface PredictionModel {
  patterns: Map<string, {
    frequency: number;
    lastAccessed: number;
    nextPredictedAccess: number;
    confidence: number;
  }>;
  trends: Array<{
    pattern: string;
    weight: number;
    accuracy: number;
  }>;
}

class SmartCacheManager {
  private static instance: SmartCacheManager;
  private layers: Map<string, Map<string, CacheEntry>> = new Map();
  private layerConfig: Map<string, CacheLayer> = new Map();
  private metrics: CacheMetrics = {
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
    compressionRatio: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    evictionCount: 0,
    layerStats: {}
  };
  private predictionModel: PredictionModel = {
    patterns: new Map(),
    trends: []
  };
  private compressionWorker: Worker | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private predictionInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeLayers();
    this.initializeCompression();
    this.startBackgroundTasks();
    this.loadFromPersistence();
  }

  public static getInstance(): SmartCacheManager {
    if (!SmartCacheManager.instance) {
      SmartCacheManager.instance = new SmartCacheManager();
    }
    return SmartCacheManager.instance;
  }

  /**
   * Initialise les couches de cache avec configuration optimisée
   */
  private initializeLayers(): void {
    const layers: CacheLayer[] = [
      {
        name: 'memory',
        maxSize: 50, // 50 entrées en mémoire
        ttl: 5 * 60 * 1000, // 5 minutes
        compressionEnabled: false,
        persistenceEnabled: false,
        priority: 1
      },
      {
        name: 'local',
        maxSize: 200, // 200 entrées localStorage
        ttl: 30 * 60 * 1000, // 30 minutes
        compressionEnabled: true,
        persistenceEnabled: true,
        priority: 2
      },
      {
        name: 'session',
        maxSize: 100, // 100 entrées sessionStorage
        ttl: 60 * 60 * 1000, // 1 heure
        compressionEnabled: true,
        persistenceEnabled: true,
        priority: 3
      },
      {
        name: 'indexeddb',
        maxSize: 1000, // 1000 entrées IndexedDB
        ttl: 24 * 60 * 60 * 1000, // 24 heures
        compressionEnabled: true,
        persistenceEnabled: true,
        priority: 4
      }
    ];

    layers.forEach(layer => {
      this.layerConfig.set(layer.name, layer);
      this.layers.set(layer.name, new Map());
      this.metrics.layerStats[layer.name] = {
        size: 0,
        hitRate: 0,
        evictions: 0
      };
    });
  }

  /**
   * Initialise le worker de compression
   */
  private initializeCompression(): void {
    if (typeof window === 'undefined' || !window.Worker) return;

    try {
      // Worker inline pour compression/décompression
      const workerCode = `
        self.onmessage = function(e) {
          const { action, data, id } = e.data;
          
          try {
            if (action === 'compress') {
              const compressed = JSON.stringify(data);
              // Simulation de compression (à remplacer par une vraie compression)
              const result = btoa(compressed);
              self.postMessage({ id, result, compressed: true });
            } else if (action === 'decompress') {
              const decompressed = JSON.parse(atob(data));
              self.postMessage({ id, result: decompressed, compressed: false });
            }
          } catch (error) {
            self.postMessage({ id, error: error.message });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));
    } catch (error) {
      console.warn('Compression worker non disponible:', error);
    }
  }

  /**
   * Démarre les tâches de fond
   */
  private startBackgroundTasks(): void {
    // Nettoyage automatique toutes les 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
      this.optimizeMemoryUsage();
    }, 10 * 60 * 1000);

    // Mise à jour du modèle de prédiction toutes les 5 minutes
    this.predictionInterval = setInterval(() => {
      this.updatePredictionModel();
      this.preloadPredictedData();
    }, 5 * 60 * 1000);
  }

  /**
   * Récupère une valeur du cache avec stratégie intelligente
   */
  public async get<T>(key: string, tags?: string[]): Promise<T | null> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Recherche dans les couches par ordre de priorité
      for (const [layerName, layer] of this.layers.entries()) {
        const entry = layer.get(key);
        
        if (entry && this.isEntryValid(entry)) {
          // Mise à jour des métadonnées d'accès
          entry.metadata.lastAccessed = Date.now();
          entry.metadata.accessCount++;
          
          // Promotion vers une couche plus rapide si accès fréquent
          await this.promoteEntry(key, entry, layerName);
          
          // Mise à jour des métriques
          this.metrics.totalHits++;
          this.updateLayerMetrics(layerName, true);
          this.updatePredictionData(key);
          
          this.updateMetrics(startTime, true);
          
          return this.deserializeData(entry.data, entry.metadata.compressed);
        }
      }

      // Cache miss
      this.metrics.totalMisses++;
      this.updateMetrics(startTime, false);
      
      return null;
      
    } catch (error) {
      console.error('Erreur lors de la récupération du cache:', error);
      return null;
    }
  }

  /**
   * Stocke une valeur dans le cache avec optimisation automatique
   */
  public async set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      tags?: string[];
      dependencies?: string[];
      layer?: string;
      priority?: number;
    } = {}
  ): Promise<void> {
    try {
      const serializedData = await this.serializeData(data);
      const targetLayer = this.selectOptimalLayer(serializedData.size, options);
      
      const entry: CacheEntry<T> = {
        key,
        data: serializedData.data,
        metadata: {
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          accessCount: 1,
          size: serializedData.size,
          compressed: serializedData.compressed,
          layer: targetLayer,
          tags: options.tags || [],
          dependencies: options.dependencies || [],
          version: this.generateVersion()
        },
        ttl: options.ttl || this.layerConfig.get(targetLayer)?.ttl || 60000,
        priority: options.priority || 1
      };

      // Insertion dans la couche optimale
      await this.insertIntoLayer(targetLayer, key, entry);
      
      // Mise à jour du modèle de prédiction
      this.updatePredictionData(key);
      
    } catch (error) {
      console.error('Erreur lors de la mise en cache:', error);
    }
  }

  /**
   * Invalidation sémantique par tags
   */
  public async invalidateByTags(tags: string[]): Promise<void> {
    for (const [layerName, layer] of this.layers.entries()) {
      const keysToRemove: string[] = [];
      
      for (const [key, entry] of layer.entries()) {
        if (entry.metadata.tags.some(tag => tags.includes(tag))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => layer.delete(key));
      await this.persistLayer(layerName);
    }
  }

  /**
   * Invalidation en cascade basée sur les dépendances
   */
  public async invalidateDependencies(changedKey: string): Promise<void> {
    for (const [layerName, layer] of this.layers.entries()) {
      const keysToRemove: string[] = [];
      
      for (const [key, entry] of layer.entries()) {
        if (entry.metadata.dependencies.includes(changedKey)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => layer.delete(key));
      await this.persistLayer(layerName);
    }
  }

  /**
   * Sélectionne la couche optimale pour un élément
   */
  private selectOptimalLayer(size: number, options: any): string {
    // Priorité explicite
    if (options.layer && this.layerConfig.has(options.layer)) {
      return options.layer;
    }

    // Sélection basée sur la taille et la fréquence d'accès prédite
    const prediction = this.predictionModel.patterns.get(options.key);
    const frequencyScore = prediction ? prediction.frequency : 0;

    if (frequencyScore > 10 && size < 1024) {
      return 'memory'; // Données fréquentes et petites en mémoire
    } else if (size < 10240) {
      return 'local'; // Données moyennes en localStorage
    } else if (size < 102400) {
      return 'session'; // Grandes données en sessionStorage
    } else {
      return 'indexeddb'; // Très grandes données en IndexedDB
    }
  }

  /**
   * Insère un élément dans une couche avec gestion de la taille
   */
  private async insertIntoLayer(layerName: string, key: string, entry: CacheEntry): Promise<void> {
    const layer = this.layers.get(layerName);
    const config = this.layerConfig.get(layerName);
    
    if (!layer || !config) return;

    // Vérifier la limite de taille
    if (layer.size >= config.maxSize) {
      await this.evictEntries(layerName, 1);
    }

    layer.set(key, entry);
    
    // Persister si nécessaire
    if (config.persistenceEnabled) {
      await this.persistLayer(layerName);
    }
    
    this.updateMemoryUsage();
  }

  /**
   * Éviction intelligente avec algorithme LFU + LRU hybride
   */
  private async evictEntries(layerName: string, count: number): Promise<void> {
    const layer = this.layers.get(layerName);
    if (!layer) return;

    const entries = Array.from(layer.entries()).map(([key, entry]) => ({
      key,
      entry,
      score: this.calculateEvictionScore(entry)
    }));

    // Trier par score d'éviction (plus bas = candidat à l'éviction)
    entries.sort((a, b) => a.score - b.score);

    // Évincer les entrées avec le plus bas score
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      layer.delete(entries[i].key);
      this.metrics.evictionCount++;
      this.metrics.layerStats[layerName].evictions++;
    }
  }

  /**
   * Calcule le score d'éviction (plus bas = plus candidat à l'éviction)
   */
  private calculateEvictionScore(entry: CacheEntry): number {
    const now = Date.now();
    const age = now - entry.metadata.createdAt;
    const timeSinceLastAccess = now - entry.metadata.lastAccessed;
    const frequency = entry.metadata.accessCount;
    
    // Formule hybride LFU + LRU avec pondération temporelle
    const ageWeight = 0.3;
    const frequencyWeight = 0.4;
    const recencyWeight = 0.3;
    
    const ageScore = age / (24 * 60 * 60 * 1000); // Normalisé sur 24h
    const frequencyScore = Math.log(frequency + 1); // Log pour éviter la domination
    const recencyScore = timeSinceLastAccess / (60 * 60 * 1000); // Normalisé sur 1h
    
    return (ageScore * ageWeight) - (frequencyScore * frequencyWeight) + (recencyScore * recencyWeight);
  }

  /**
   * Promotion d'entrée vers une couche plus rapide
   */
  private async promoteEntry(key: string, entry: CacheEntry, currentLayer: string): Promise<void> {
    // Critères de promotion : accès fréquent et taille appropriée
    if (entry.metadata.accessCount < 5) return;
    
    const targetLayer = this.getPromotionTarget(currentLayer, entry);
    if (targetLayer && targetLayer !== currentLayer) {
      // Déplacer vers la couche cible
      const layer = this.layers.get(currentLayer);
      const targetLayerMap = this.layers.get(targetLayer);
      
      if (layer && targetLayerMap) {
        layer.delete(key);
        entry.metadata.layer = targetLayer;
        await this.insertIntoLayer(targetLayer, key, entry);
      }
    }
  }

  /**
   * Détermine la couche cible pour la promotion
   */
  private getPromotionTarget(currentLayer: string, entry: CacheEntry): string | null {
    const layerPriorities = ['memory', 'local', 'session', 'indexeddb'];
    const currentIndex = layerPriorities.indexOf(currentLayer);
    
    if (currentIndex > 0 && entry.metadata.size < 1024) {
      return layerPriorities[currentIndex - 1]; // Promotion vers couche plus rapide
    }
    
    return null;
  }

  /**
   * Sérialisation optimisée avec compression
   */
  private async serializeData(data: any): Promise<{
    data: any;
    size: number;
    compressed: boolean;
  }> {
    const jsonString = JSON.stringify(data);
    const uncompressedSize = new Blob([jsonString]).size;
    
    // Compression si la taille dépasse 1KB
    if (uncompressedSize > 1024 && this.compressionWorker) {
      try {
        const compressed = await this.compressData(data);
        const compressedSize = new Blob([compressed]).size;
        
        if (compressedSize < uncompressedSize * 0.8) { // 20% de gain minimum
          return {
            data: compressed,
            size: compressedSize,
            compressed: true
          };
        }
      } catch (error) {
        console.warn('Erreur de compression:', error);
      }
    }
    
    return {
      data: jsonString,
      size: uncompressedSize,
      compressed: false
    };
  }

  /**
   * Désérialisation avec décompression
   */
  private async deserializeData(data: any, compressed: boolean): Promise<any> {
    if (!compressed) {
      return typeof data === 'string' ? JSON.parse(data) : data;
    }
    
    if (this.compressionWorker) {
      try {
        return await this.decompressData(data);
      } catch (error) {
        console.warn('Erreur de décompression:', error);
      }
    }
    
    return data;
  }

  /**
   * Compression asynchrone via Worker
   */
  private compressData(data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.compressionWorker) {
        reject(new Error('Worker de compression non disponible'));
        return;
      }
      
      const id = Math.random().toString(36);
      
      const handleMessage = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.compressionWorker!.removeEventListener('message', handleMessage);
          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            resolve(e.data.result);
          }
        }
      };
      
      this.compressionWorker.addEventListener('message', handleMessage);
      this.compressionWorker.postMessage({ action: 'compress', data, id });
      
      // Timeout après 5 secondes
      setTimeout(() => {
        this.compressionWorker!.removeEventListener('message', handleMessage);
        reject(new Error('Timeout de compression'));
      }, 5000);
    });
  }

  /**
   * Décompression asynchrone via Worker
   */
  private decompressData(data: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.compressionWorker) {
        reject(new Error('Worker de décompression non disponible'));
        return;
      }
      
      const id = Math.random().toString(36);
      
      const handleMessage = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.compressionWorker!.removeEventListener('message', handleMessage);
          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            resolve(e.data.result);
          }
        }
      };
      
      this.compressionWorker.addEventListener('message', handleMessage);
      this.compressionWorker.postMessage({ action: 'decompress', data, id });
      
      // Timeout après 5 secondes
      setTimeout(() => {
        this.compressionWorker!.removeEventListener('message', handleMessage);
        reject(new Error('Timeout de décompression'));
      }, 5000);
    });
  }

  /**
   * Nettoyage des entrées expirées
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    
    for (const [layerName, layer] of this.layers.entries()) {
      const keysToRemove: string[] = [];
      
      for (const [key, entry] of layer.entries()) {
        if (!this.isEntryValid(entry, now)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => layer.delete(key));
      
      if (keysToRemove.length > 0) {
        this.persistLayer(layerName);
      }
    }
  }

  /**
   * Vérifie si une entrée est encore valide
   */
  private isEntryValid(entry: CacheEntry, currentTime: number = Date.now()): boolean {
    return (currentTime - entry.metadata.createdAt) < entry.ttl;
  }

  /**
   * Met à jour le modèle de prédiction
   */
  private updatePredictionData(key: string): void {
    const now = Date.now();
    const pattern = this.predictionModel.patterns.get(key);
    
    if (pattern) {
      pattern.frequency++;
      pattern.lastAccessed = now;
      // Prédiction simple : prochain accès basé sur la fréquence
      pattern.nextPredictedAccess = now + (now - pattern.lastAccessed) / pattern.frequency;
      pattern.confidence = Math.min(pattern.frequency / 10, 1);
    } else {
      this.predictionModel.patterns.set(key, {
        frequency: 1,
        lastAccessed: now,
        nextPredictedAccess: now + 60000, // 1 minute par défaut
        confidence: 0.1
      });
    }
  }

  /**
   * Met à jour le modèle de prédiction global
   */
  private updatePredictionModel(): void {
    // Analyser les patterns d'accès et ajuster les prédictions
    const patterns = Array.from(this.predictionModel.patterns.entries());
    
    patterns.forEach(([key, pattern]) => {
      // Dégrader la confiance pour les patterns anciens
      const timeSinceLastAccess = Date.now() - pattern.lastAccessed;
      if (timeSinceLastAccess > 24 * 60 * 60 * 1000) { // 24h
        pattern.confidence *= 0.9;
        pattern.frequency *= 0.95;
      }
    });
    
    // Supprimer les patterns avec très faible confiance
    for (const [key, pattern] of this.predictionModel.patterns.entries()) {
      if (pattern.confidence < 0.05) {
        this.predictionModel.patterns.delete(key);
      }
    }
  }

  /**
   * Précharge les données prédites
   */
  private preloadPredictedData(): void {
    const now = Date.now();
    const predictions = Array.from(this.predictionModel.patterns.entries())
      .filter(([key, pattern]) => {
        return pattern.nextPredictedAccess <= now + 60000 && // Dans la prochaine minute
               pattern.confidence > 0.7; // Avec bonne confiance
      })
      .sort((a, b) => b[1].confidence - a[1].confidence)
      .slice(0, 5); // Top 5 prédictions
    
    // Ici on pourrait déclencher le préchargement des données prédites
    predictions.forEach(([key, pattern]) => {
      console.log(`Prédiction de préchargement pour ${key} avec confiance ${pattern.confidence}`);
    });
  }

  /**
   * Optimisation de l'usage mémoire
   */
  private optimizeMemoryUsage(): void {
    const memoryLayer = this.layers.get('memory');
    if (!memoryLayer) return;
    
    // Si l'usage mémoire est élevé, forcer l'éviction
    if (this.metrics.memoryUsage > 0.8) { // 80% de la limite
      const targetEvictions = Math.ceil(memoryLayer.size * 0.2); // Évincer 20%
      this.evictEntries('memory', targetEvictions);
    }
  }

  /**
   * Persistance des couches
   */
  private async persistLayer(layerName: string): Promise<void> {
    const layer = this.layers.get(layerName);
    const config = this.layerConfig.get(layerName);
    
    if (!layer || !config || !config.persistenceEnabled) return;
    if (typeof window === 'undefined') return;
    
    try {
      const data = Array.from(layer.entries());
      const key = `cuisinezen_cache_${layerName}`;
      
      switch (layerName) {
        case 'local':
          localStorage.setItem(key, JSON.stringify(data));
          break;
        case 'session':
          sessionStorage.setItem(key, JSON.stringify(data));
          break;
        case 'indexeddb':
          // Implémentation IndexedDB à ajouter si nécessaire
          break;
      }
    } catch (error) {
      console.warn(`Erreur persistance couche ${layerName}:`, error);
    }
  }

  /**
   * Chargement depuis la persistance
   */
  private loadFromPersistence(): void {
    if (typeof window === 'undefined') return;
    
    for (const [layerName, config] of this.layerConfig.entries()) {
      if (!config.persistenceEnabled) continue;
      
      try {
        const key = `cuisinezen_cache_${layerName}`;
        let data: string | null = null;
        
        switch (layerName) {
          case 'local':
            data = localStorage.getItem(key);
            break;
          case 'session':
            data = sessionStorage.getItem(key);
            break;
        }
        
        if (data) {
          const entries: [string, CacheEntry][] = JSON.parse(data);
          const layer = this.layers.get(layerName);
          
          if (layer) {
            // Filtrer les entrées expirées
            const validEntries = entries.filter(([, entry]) => this.isEntryValid(entry));
            validEntries.forEach(([key, entry]) => layer.set(key, entry));
          }
        }
      } catch (error) {
        console.warn(`Erreur chargement couche ${layerName}:`, error);
      }
    }
  }

  /**
   * Mise à jour des métriques
   */
  private updateMetrics(startTime: number, isHit: boolean): void {
    const responseTime = Date.now() - startTime;
    
    this.metrics.averageResponseTime = (
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) /
      this.metrics.totalRequests
    );
    
    this.metrics.hitRate = this.metrics.totalHits / this.metrics.totalRequests;
    this.metrics.missRate = this.metrics.totalMisses / this.metrics.totalRequests;
  }

  private updateLayerMetrics(layerName: string, isHit: boolean): void {
    const stats = this.metrics.layerStats[layerName];
    if (stats) {
      // Mise à jour simple du hit rate par couche
      const layer = this.layers.get(layerName);
      stats.size = layer ? layer.size : 0;
    }
  }

  private updateMemoryUsage(): void {
    let totalSize = 0;
    for (const layer of this.layers.values()) {
      for (const entry of layer.values()) {
        totalSize += entry.metadata.size;
      }
    }
    
    // Estimation de l'usage mémoire (en Mo)
    this.metrics.memoryUsage = totalSize / (1024 * 1024);
  }

  private generateVersion(): number {
    return Date.now();
  }

  /**
   * API publiques
   */
  public getMetrics(): CacheMetrics {
    this.updateMemoryUsage();
    return { ...this.metrics };
  }

  public clearLayer(layerName: string): void {
    const layer = this.layers.get(layerName);
    if (layer) {
      layer.clear();
      this.persistLayer(layerName);
    }
  }

  public clearAll(): void {
    for (const layerName of this.layers.keys()) {
      this.clearLayer(layerName);
    }
  }

  public async warmup(keys: string[]): Promise<void> {
    // Préchargement de clés spécifiques
    const promises = keys.map(key => this.get(key));
    await Promise.allSettled(promises);
  }

  public getLayerStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [layerName, layer] of this.layers.entries()) {
      stats[layerName] = {
        size: layer.size,
        maxSize: this.layerConfig.get(layerName)?.maxSize,
        entries: Array.from(layer.values()).map(entry => ({
          key: entry.key,
          size: entry.metadata.size,
          accessCount: entry.metadata.accessCount,
          age: Date.now() - entry.metadata.createdAt
        }))
      };
    }
    
    return stats;
  }

  /**
   * Nettoyage lors de la destruction
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.predictionInterval) {
      clearInterval(this.predictionInterval);
    }
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }
    this.clearAll();
  }
}

// Instance singleton
export const smartCache = SmartCacheManager.getInstance();

// Hook React pour utiliser le cache intelligent
import { useState, useEffect } from 'react';

export function useSmartCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    tags?: string[];
    dependencies?: string[];
    enabled?: boolean;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options.enabled === false) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Vérifier le cache
        let cachedData = await smartCache.get<T>(key, options.tags);
        
        if (cachedData) {
          setData(cachedData);
          setIsLoading(false);
        } else {
          // Charger depuis la source
          const freshData = await fetcher();
          
          // Mettre en cache
          await smartCache.set(key, freshData, {
            ttl: options.ttl,
            tags: options.tags,
            dependencies: options.dependencies
          });
          
          setData(freshData);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [key, options.enabled]);

  const invalidate = async () => {
    if (options.tags) {
      await smartCache.invalidateByTags(options.tags);
    }
    // Recharger les données
    const freshData = await fetcher();
    await smartCache.set(key, freshData, options);
    setData(freshData);
  };

  return {
    data,
    isLoading,
    error,
    invalidate,
    metrics: smartCache.getMetrics()
  };
}