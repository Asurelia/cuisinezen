import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { CacheService } from '../services/cache.service';

export interface CostMetrics {
  functionName: string;
  invocations: number;
  executionTime: number;
  memoryUsed: number;
  estimatedCost: number;
  timestamp: number;
  costCategory: 'compute' | 'storage' | 'network' | 'database';
}

export interface CostOptimizationRecommendation {
  type: 'memory' | 'timeout' | 'caching' | 'batching' | 'scheduling';
  description: string;
  estimatedSavings: number;
  priority: 'high' | 'medium' | 'low';
  implementation: string;
}

export class CostOptimizer {
  private static instance: CostOptimizer;
  private db = getFirestore();
  private costMetrics: CostMetrics[] = [];

  // Tarifs Firebase (approximatifs en USD)
  private readonly pricing = {
    compute: {
      gbSecond: 0.0000025, // Par GB-seconde
      invocation: 0.0000004, // Par invocation
    },
    storage: {
      read: 0.00006, // Par 100k lectures
      write: 0.00018, // Par 100k écritures
      delete: 0.00002, // Par 100k suppressions
    },
    network: {
      egress: 0.12, // Par GB sortant
    }
  };

  private constructor() {}

  static getInstance(): CostOptimizer {
    if (!CostOptimizer.instance) {
      CostOptimizer.instance = new CostOptimizer();
    }
    return CostOptimizer.instance;
  }

  /**
   * Enregistre les métriques de coût
   */
  recordCostMetrics(
    functionName: string,
    executionTime: number,
    memoryMB: number,
    customMetrics?: Record<string, number>
  ): void {
    const gbSeconds = (memoryMB / 1024) * (executionTime / 1000);
    const estimatedCost = 
      (gbSeconds * this.pricing.compute.gbSecond) + 
      this.pricing.compute.invocation;

    const metrics: CostMetrics = {
      functionName,
      invocations: 1,
      executionTime,
      memoryUsed: memoryMB,
      estimatedCost,
      timestamp: Date.now(),
      costCategory: 'compute'
    };

    this.costMetrics.push(metrics);

    // Garder seulement les 10000 dernières métriques
    if (this.costMetrics.length > 10000) {
      this.costMetrics = this.costMetrics.slice(-10000);
    }

    // Log pour monitoring
    logger.info('Cost metrics recorded', {
      functionName,
      estimatedCost,
      executionTime,
      memoryUsed: memoryMB,
      ...customMetrics
    });
  }

  /**
   * Analyse les coûts par fonction
   */
  analyzeFunctionCosts(timeWindowHours: number = 24): {
    totalCost: number;
    functionBreakdown: Array<{
      functionName: string;
      totalCost: number;
      invocations: number;
      avgCostPerInvocation: number;
      costTrend: 'increasing' | 'decreasing' | 'stable';
    }>;
    recommendations: CostOptimizationRecommendation[];
  } {
    const cutoffTime = Date.now() - (timeWindowHours * 60 * 60 * 1000);
    const recentMetrics = this.costMetrics.filter(m => m.timestamp >= cutoffTime);

    const functionStats = new Map<string, {
      totalCost: number;
      invocations: number;
      executionTimes: number[];
      memoryUsages: number[];
      timestamps: number[];
    }>();

    // Agréger les statistiques par fonction
    recentMetrics.forEach(metric => {
      if (!functionStats.has(metric.functionName)) {
        functionStats.set(metric.functionName, {
          totalCost: 0,
          invocations: 0,
          executionTimes: [],
          memoryUsages: [],
          timestamps: []
        });
      }

      const stats = functionStats.get(metric.functionName)!;
      stats.totalCost += metric.estimatedCost;
      stats.invocations += metric.invocations;
      stats.executionTimes.push(metric.executionTime);
      stats.memoryUsages.push(metric.memoryUsed);
      stats.timestamps.push(metric.timestamp);
    });

    const functionBreakdown = Array.from(functionStats.entries()).map(([functionName, stats]) => {
      const avgCostPerInvocation = stats.totalCost / stats.invocations;
      const costTrend = this.calculateCostTrend(stats.timestamps, stats.totalCost);

      return {
        functionName,
        totalCost: stats.totalCost,
        invocations: stats.invocations,
        avgCostPerInvocation,
        costTrend
      };
    }).sort((a, b) => b.totalCost - a.totalCost);

    const totalCost = functionBreakdown.reduce((sum, func) => sum + func.totalCost, 0);
    const recommendations = this.generateCostOptimizationRecommendations(functionStats);

    return {
      totalCost,
      functionBreakdown,
      recommendations
    };
  }

  /**
   * Calcule la tendance des coûts
   */
  private calculateCostTrend(
    timestamps: number[],
    totalCost: number
  ): 'increasing' | 'decreasing' | 'stable' {
    if (timestamps.length < 10) return 'stable';

    // Diviser en deux moitiés temporelles
    const sortedData = timestamps
      .map((ts, i) => ({ timestamp: ts, cost: totalCost / timestamps.length }))
      .sort((a, b) => a.timestamp - b.timestamp);

    const midpoint = Math.floor(sortedData.length / 2);
    const firstHalf = sortedData.slice(0, midpoint);
    const secondHalf = sortedData.slice(midpoint);

    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.cost, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.cost, 0) / secondHalf.length;

    const change = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Génère des recommandations d'optimisation des coûts
   */
  private generateCostOptimizationRecommendations(
    functionStats: Map<string, any>
  ): CostOptimizationRecommendation[] {
    const recommendations: CostOptimizationRecommendation[] = [];

    functionStats.forEach((stats, functionName) => {
      const avgExecutionTime = stats.executionTimes.reduce((a: number, b: number) => a + b, 0) / stats.executionTimes.length;
      const avgMemoryUsage = stats.memoryUsages.reduce((a: number, b: number) => a + b, 0) / stats.memoryUsages.length;
      const costPerInvocation = stats.totalCost / stats.invocations;

      // Recommandation de réduction de mémoire
      if (avgMemoryUsage > 512 && avgExecutionTime < 5000) {
        recommendations.push({
          type: 'memory',
          description: `Réduire l'allocation mémoire de ${functionName} de ${avgMemoryUsage}MB à 256MB`,
          estimatedSavings: stats.totalCost * 0.3, // 30% d'économie estimée
          priority: 'high',
          implementation: 'Modifier la configuration de la fonction pour utiliser moins de mémoire'
        });
      }

      // Recommandation de mise en cache
      if (costPerInvocation > 0.001 && stats.invocations > 1000) {
        recommendations.push({
          type: 'caching',
          description: `Implémenter la mise en cache pour ${functionName}`,
          estimatedSavings: stats.totalCost * 0.5, // 50% d'économie estimée
          priority: 'high',
          implementation: 'Ajouter une couche de cache Redis avec TTL approprié'
        });
      }

      // Recommandation de batching
      if (stats.invocations > 10000 && avgExecutionTime < 1000) {
        recommendations.push({
          type: 'batching',
          description: `Traiter les requêtes par lots pour ${functionName}`,
          estimatedSavings: stats.totalCost * 0.4, // 40% d'économie estimée
          priority: 'medium',
          implementation: 'Grouper plusieurs opérations en une seule invocation'
        });
      }

      // Recommandation de timeout
      if (avgExecutionTime > 30000) {
        recommendations.push({
          type: 'timeout',
          description: `Optimiser le timeout de ${functionName}`,
          estimatedSavings: stats.totalCost * 0.2, // 20% d'économie estimée
          priority: 'medium',
          implementation: 'Réduire le timeout et optimiser les opérations longues'
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Surveille et alerte sur les coûts
   */
  async monitorCostAlerts(): Promise<void> {
    const dailyBudget = parseFloat(process.env.DAILY_COST_BUDGET || '10'); // $10 par défaut
    const last24Hours = this.analyzeFunctionCosts(24);

    if (last24Hours.totalCost > dailyBudget * 0.8) {
      logger.warn('Cost alert: Approaching daily budget', {
        currentCost: last24Hours.totalCost,
        budget: dailyBudget,
        percentage: (last24Hours.totalCost / dailyBudget) * 100
      });

      // Envoyer une notification (à implémenter selon les besoins)
      await this.sendCostAlert({
        type: 'budget_warning',
        currentCost: last24Hours.totalCost,
        budget: dailyBudget,
        topCostlyFunctions: last24Hours.functionBreakdown.slice(0, 5)
      });
    }

    if (last24Hours.totalCost > dailyBudget) {
      logger.error('Cost alert: Daily budget exceeded', {
        currentCost: last24Hours.totalCost,
        budget: dailyBudget,
        overage: last24Hours.totalCost - dailyBudget
      });

      await this.sendCostAlert({
        type: 'budget_exceeded',
        currentCost: last24Hours.totalCost,
        budget: dailyBudget,
        overage: last24Hours.totalCost - dailyBudget
      });
    }
  }

  /**
   * Envoie une alerte de coût
   */
  private async sendCostAlert(alertData: any): Promise<void> {
    // Stocker l'alerte dans Firestore pour le dashboard
    try {
      await this.db.collection('cost_alerts').add({
        ...alertData,
        timestamp: new Date(),
        status: 'active'
      });
    } catch (error) {
      logger.error('Failed to store cost alert', error);
    }
  }

  /**
   * Optimise automatiquement certaines fonctions
   */
  async autoOptimize(): Promise<{
    optimizationsApplied: string[];
    estimatedSavings: number;
  }> {
    const analysis = this.analyzeFunctionCosts(24);
    const optimizationsApplied: string[] = [];
    let estimatedSavings = 0;

    // Auto-optimisations sûres
    for (const recommendation of analysis.recommendations) {
      if (recommendation.priority === 'high' && recommendation.type === 'caching') {
        // Activer le cache automatiquement pour les fonctions éligibles
        const cacheKey = `auto_cache_${recommendation.description}`;
        await CacheService.set(cacheKey, true, 3600);
        
        optimizationsApplied.push(recommendation.description);
        estimatedSavings += recommendation.estimatedSavings;
      }
    }

    if (optimizationsApplied.length > 0) {
      logger.info('Auto-optimizations applied', {
        optimizations: optimizationsApplied,
        estimatedSavings
      });
    }

    return {
      optimizationsApplied,
      estimatedSavings
    };
  }

  /**
   * Génère un rapport de coûts détaillé
   */
  generateCostReport(days: number = 7): {
    summary: {
      totalCost: number;
      averageDailyCost: number;
      projectedMonthlyCost: number;
      topCostDrivers: string[];
    };
    trends: Array<{
      date: string;
      totalCost: number;
      breakdown: Record<string, number>;
    }>;
    optimizationOpportunities: {
      totalPotentialSavings: number;
      recommendations: CostOptimizationRecommendation[];
    };
  } {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const relevantMetrics = this.costMetrics.filter(m => m.timestamp >= cutoffTime);

    // Calculer le résumé
    const totalCost = relevantMetrics.reduce((sum, m) => sum + m.estimatedCost, 0);
    const averageDailyCost = totalCost / days;
    const projectedMonthlyCost = averageDailyCost * 30;

    // Top cost drivers
    const functionCosts = new Map<string, number>();
    relevantMetrics.forEach(m => {
      functionCosts.set(m.functionName, (functionCosts.get(m.functionName) || 0) + m.estimatedCost);
    });
    const topCostDrivers = Array.from(functionCosts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Tendances quotidiennes
    const dailyBreakdown = new Map<string, Map<string, number>>();
    relevantMetrics.forEach(m => {
      const date = new Date(m.timestamp).toISOString().split('T')[0];
      if (!dailyBreakdown.has(date)) {
        dailyBreakdown.set(date, new Map());
      }
      const dayData = dailyBreakdown.get(date)!;
      dayData.set(m.functionName, (dayData.get(m.functionName) || 0) + m.estimatedCost);
    });

    const trends = Array.from(dailyBreakdown.entries()).map(([date, breakdown]) => ({
      date,
      totalCost: Array.from(breakdown.values()).reduce((sum, cost) => sum + cost, 0),
      breakdown: Object.fromEntries(breakdown)
    }));

    // Opportunités d'optimisation
    const recommendations = this.generateCostOptimizationRecommendations(
      new Map(Array.from(functionCosts.entries()).map(([name, cost]) => [
        name,
        {
          totalCost: cost,
          invocations: relevantMetrics.filter(m => m.functionName === name).length,
          executionTimes: relevantMetrics.filter(m => m.functionName === name).map(m => m.executionTime),
          memoryUsages: relevantMetrics.filter(m => m.functionName === name).map(m => m.memoryUsed),
          timestamps: relevantMetrics.filter(m => m.functionName === name).map(m => m.timestamp)
        }
      ]))
    );

    const totalPotentialSavings = recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0);

    return {
      summary: {
        totalCost,
        averageDailyCost,
        projectedMonthlyCost,
        topCostDrivers
      },
      trends,
      optimizationOpportunities: {
        totalPotentialSavings,
        recommendations
      }
    };
  }
}