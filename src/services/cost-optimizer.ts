'use client';

import { collection, query, where, orderBy, limit, startAfter, endBefore } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CostMetrics {
  dailyReads: number;
  dailyWrites: number;
  dailyDeletes: number;
  monthlyCost: number;
  recommendations: string[];
}

export interface QueryOptimization {
  useCache: boolean;
  cacheTTL: number;
  batchSize: number;
  enablePagination: boolean;
  limitResults: number;
}

class CostOptimizer {
  private metrics = {
    reads: 0,
    writes: 0,
    deletes: 0,
    lastReset: Date.now()
  };

  private readonly FREE_TIER_LIMITS = {
    dailyReads: 50000,
    dailyWrites: 20000,
    dailyDeletes: 20000
  };

  private readonly COST_PER_OPERATION = {
    read: 0.00006, // $0.06 per 100k reads
    write: 0.00018, // $0.18 per 100k writes
    delete: 0.00002 // $0.02 per 100k deletes
  };

  // Comptabiliser les opérations
  trackOperation(type: 'read' | 'write' | 'delete', count: number = 1) {
    this.resetIfNewDay();
    this.metrics[type === 'read' ? 'reads' : type === 'write' ? 'writes' : 'deletes'] += count;
    
    // Sauvegarder en localStorage pour persistance
    this.saveMetrics();
    
    // Alerte si approche des limites
    this.checkLimits();
  }

  private resetIfNewDay() {
    const now = Date.now();
    const lastReset = this.metrics.lastReset;
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    if (now - lastReset > oneDayMs) {
      this.metrics = {
        reads: 0,
        writes: 0,
        deletes: 0,
        lastReset: now
      };
    }
  }

  private saveMetrics() {
    try {
      localStorage.setItem('firestore_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.warn('Impossible de sauvegarder les métriques:', error);
    }
  }

  private loadMetrics() {
    try {
      const saved = localStorage.getItem('firestore_metrics');
      if (saved) {
        this.metrics = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Impossible de charger les métriques:', error);
    }
  }

  private checkLimits() {
    const warnings = [];
    
    if (this.metrics.reads > this.FREE_TIER_LIMITS.dailyReads * 0.8) {
      warnings.push('⚠️ Approche de la limite de lectures (80%)');
    }
    
    if (this.metrics.writes > this.FREE_TIER_LIMITS.dailyWrites * 0.8) {
      warnings.push('⚠️ Approche de la limite d\'écritures (80%)');
    }
    
    if (warnings.length > 0) {
      console.warn('Limits Firebase:', warnings);
    }
  }

  // Optimiser une requête selon le contexte
  optimizeQuery(context: 'list' | 'search' | 'realtime' | 'analytics'): QueryOptimization {
    const baseOptimization: QueryOptimization = {
      useCache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      batchSize: 25,
      enablePagination: true,
      limitResults: 50
    };

    switch (context) {
      case 'list':
        // Listes de produits/recettes : cache agressif
        return {
          ...baseOptimization,
          cacheTTL: 10 * 60 * 1000, // 10 minutes
          limitResults: 25,
          batchSize: 25
        };

      case 'search':
        // Recherche : cache court, pagination
        return {
          ...baseOptimization,
          cacheTTL: 2 * 60 * 1000, // 2 minutes
          limitResults: 15,
          batchSize: 15
        };

      case 'realtime':
        // Temps réel : pas de cache, limite stricte
        return {
          ...baseOptimization,
          useCache: false,
          limitResults: 10,
          batchSize: 10
        };

      case 'analytics':
        // Analytics : cache très long
        return {
          ...baseOptimization,
          cacheTTL: 60 * 60 * 1000, // 1 heure
          limitResults: 100,
          batchSize: 50
        };

      default:
        return baseOptimization;
    }
  }

  // Créer une requête optimisée
  createOptimizedQuery(
    collectionPath: string,
    optimization: QueryOptimization,
    filters?: Array<{ field: string; operator: any; value: any }>,
    orderField?: string,
    orderDirection: 'asc' | 'desc' = 'desc'
  ) {
    if (!db) throw new Error('Firestore non initialisé');

    let q = query(collection(db, collectionPath));

    // Ajouter les filtres
    if (filters) {
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
    }

    // Ajouter le tri
    if (orderField) {
      q = query(q, orderBy(orderField, orderDirection));
    }

    // Limiter les résultats
    q = query(q, limit(optimization.limitResults));

    return q;
  }

  // Stratégies de pagination économiques
  createPaginatedQuery(
    baseQuery: any,
    optimization: QueryOptimization,
    lastDocument?: any,
    direction: 'next' | 'prev' = 'next'
  ) {
    let q = query(baseQuery, limit(optimization.batchSize));

    if (lastDocument) {
      if (direction === 'next') {
        q = query(q, startAfter(lastDocument));
      } else {
        q = query(q, endBefore(lastDocument));
      }
    }

    return q;
  }

  // Calculer les métriques de coût
  getCostMetrics(): CostMetrics {
    this.resetIfNewDay();
    
    const dailyReads = this.metrics.reads;
    const dailyWrites = this.metrics.writes;
    const dailyDeletes = this.metrics.deletes;
    
    // Calculer le coût mensuel estimé (30 jours)
    const monthlyReads = dailyReads * 30;
    const monthlyWrites = dailyWrites * 30;
    const monthlyDeletes = dailyDeletes * 30;
    
    const monthlyCost = 
      (monthlyReads / 100000) * this.COST_PER_OPERATION.read +
      (monthlyWrites / 100000) * this.COST_PER_OPERATION.write +
      (monthlyDeletes / 100000) * this.COST_PER_OPERATION.delete;

    // Générer des recommandations
    const recommendations = this.generateRecommendations(dailyReads, dailyWrites, dailyDeletes);

    return {
      dailyReads,
      dailyWrites,
      dailyDeletes,
      monthlyCost,
      recommendations
    };
  }

  private generateRecommendations(reads: number, writes: number, deletes: number): string[] {
    const recommendations = [];

    if (reads > this.FREE_TIER_LIMITS.dailyReads * 0.5) {
      recommendations.push('Augmenter la durée de cache pour réduire les lectures');
      recommendations.push('Implémenter la pagination pour limiter les résultats');
    }

    if (writes > this.FREE_TIER_LIMITS.dailyWrites * 0.5) {
      recommendations.push('Grouper les écritures avec writeBatch()');
      recommendations.push('Réduire la fréquence des mises à jour automatiques');
    }

    if (reads + writes + deletes > 1000) {
      recommendations.push('Considérer l\'utilisation d\'un cache Redis pour les données fréquentes');
    }

    if (reads > writes * 10) {
      recommendations.push('Excellent ratio lecture/écriture pour une app de restaurant');
    }

    return recommendations;
  }

  // Stratégies d'optimisation automatique
  shouldUseCache(operationType: 'read' | 'write', frequency: 'high' | 'medium' | 'low'): boolean {
    const currentUsage = this.metrics.reads / this.FREE_TIER_LIMITS.dailyReads;
    
    if (operationType === 'read' && currentUsage > 0.7) {
      return true; // Cache agressif si près des limites
    }
    
    return frequency === 'high';
  }

  // Batch les opérations pour optimiser les coûts
  createBatchOperation() {
    if (!db) throw new Error('Firestore non initialisé');
    
    const { writeBatch } = require('firebase/firestore');
    return writeBatch(db);
  }

  // Suggestions spécifiques pour CuisineZen
  getRestaurantOptimizations(): string[] {
    return [
      '📊 Charger les produits par catégorie pour réduire les lectures',
      '🔄 Synchroniser seulement les données modifiées récemment',
      '📱 Utiliser le cache local pour les données rarement modifiées',
      '⏰ Programmer les synchronisations aux heures creuses',
      '📦 Grouper les mises à jour d\'inventaire en fin de service',
      '🎯 Limiter les listeners temps réel aux données critiques',
      '💾 Implémenter un cache intelligent basé sur les habitudes d\'utilisation'
    ];
  }

  constructor() {
    this.loadMetrics();
  }
}

// Instance singleton
export const costOptimizer = new CostOptimizer();

// Wrapper pour les opérations Firestore qui comptabilise automatiquement
export class TrackedFirestoreOperations {
  static async read(operation: () => Promise<any>) {
    const result = await operation();
    costOptimizer.trackOperation('read');
    return result;
  }

  static async write(operation: () => Promise<any>) {
    const result = await operation();
    costOptimizer.trackOperation('write');
    return result;
  }

  static async delete(operation: () => Promise<any>) {
    const result = await operation();
    costOptimizer.trackOperation('delete');
    return result;
  }

  static async batchWrite(operations: Array<() => Promise<any>>) {
    const results = await Promise.all(operations.map(op => op()));
    costOptimizer.trackOperation('write', operations.length);
    return results;
  }
}

// Hook React pour surveiller les coûts
export function useCostMonitoring() {
  const [metrics, setMetrics] = React.useState<CostMetrics>({
    dailyReads: 0,
    dailyWrites: 0,
    dailyDeletes: 0,
    monthlyCost: 0,
    recommendations: []
  });

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(costOptimizer.getCostMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    optimizations: costOptimizer.getRestaurantOptimizations(),
    isNearLimit: (metrics.dailyReads > 40000 || metrics.dailyWrites > 16000)
  };
}

import React from 'react';