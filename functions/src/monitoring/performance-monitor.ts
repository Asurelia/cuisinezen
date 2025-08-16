import { performance } from 'perf_hooks';
import { logger } from 'firebase-functions';

export interface PerformanceMetrics {
  functionName: string;
  executionTime: number;
  memoryUsed: number;
  timestamp: number;
  userId?: string;
  status: 'success' | 'error';
  errorMessage?: string;
  customMetrics?: Record<string, number>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetricsInMemory = 1000;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Mesure les performances d'une fonction
   */
  async measureFunction<T>(
    functionName: string,
    fn: () => Promise<T>,
    userId?: string,
    customMetrics?: Record<string, number>
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    let result: T;
    let status: 'success' | 'error' = 'success';
    let errorMessage: string | undefined;

    try {
      result = await fn();
      return result;
    } catch (error: any) {
      status = 'error';
      errorMessage = error.message;
      throw error;
    } finally {
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      const metrics: PerformanceMetrics = {
        functionName,
        executionTime: endTime - startTime,
        memoryUsed: endMemory - startMemory,
        timestamp: Date.now(),
        userId,
        status,
        errorMessage,
        customMetrics
      };

      this.recordMetrics(metrics);
    }
  }

  /**
   * Décorateur pour mesurer automatiquement les performances
   */
  static measurePerformance(functionName?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      const actualFunctionName = functionName || `${target.constructor.name}.${propertyKey}`;

      descriptor.value = async function (...args: any[]) {
        const monitor = PerformanceMonitor.getInstance();
        return monitor.measureFunction(
          actualFunctionName,
          () => originalMethod.apply(this, args)
        );
      };

      return descriptor;
    };
  }

  /**
   * Enregistre les métriques
   */
  private recordMetrics(metrics: PerformanceMetrics): void {
    // Ajouter aux métriques en mémoire
    this.metrics.push(metrics);
    
    // Limiter le nombre de métriques en mémoire
    if (this.metrics.length > this.maxMetricsInMemory) {
      this.metrics = this.metrics.slice(-this.maxMetricsInMemory);
    }

    // Log structuré pour Cloud Logging
    logger.info('Performance metrics', {
      functionName: metrics.functionName,
      executionTime: metrics.executionTime,
      memoryUsed: metrics.memoryUsed,
      status: metrics.status,
      userId: metrics.userId,
      errorMessage: metrics.errorMessage,
      customMetrics: metrics.customMetrics
    });

    // Alertes pour les performances dégradées
    this.checkPerformanceAlerts(metrics);
  }

  /**
   * Vérifie et envoie des alertes pour les performances dégradées
   */
  private checkPerformanceAlerts(metrics: PerformanceMetrics): void {
    const thresholds = {
      executionTime: 10000, // 10 secondes
      memoryUsage: 100 * 1024 * 1024, // 100 MB
    };

    if (metrics.executionTime > thresholds.executionTime) {
      logger.warn('Slow function execution detected', {
        functionName: metrics.functionName,
        executionTime: metrics.executionTime,
        threshold: thresholds.executionTime
      });
    }

    if (metrics.memoryUsed > thresholds.memoryUsage) {
      logger.warn('High memory usage detected', {
        functionName: metrics.functionName,
        memoryUsed: metrics.memoryUsed,
        threshold: thresholds.memoryUsage
      });
    }
  }

  /**
   * Obtient les statistiques de performance
   */
  getPerformanceStats(functionName?: string): {
    averageExecutionTime: number;
    medianExecutionTime: number;
    p95ExecutionTime: number;
    errorRate: number;
    totalCalls: number;
    averageMemoryUsage: number;
  } {
    let relevantMetrics = this.metrics;
    
    if (functionName) {
      relevantMetrics = this.metrics.filter(m => m.functionName === functionName);
    }

    if (relevantMetrics.length === 0) {
      return {
        averageExecutionTime: 0,
        medianExecutionTime: 0,
        p95ExecutionTime: 0,
        errorRate: 0,
        totalCalls: 0,
        averageMemoryUsage: 0
      };
    }

    const executionTimes = relevantMetrics.map(m => m.executionTime).sort((a, b) => a - b);
    const memoryUsages = relevantMetrics.map(m => m.memoryUsed);
    const errorCount = relevantMetrics.filter(m => m.status === 'error').length;

    return {
      averageExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
      medianExecutionTime: executionTimes[Math.floor(executionTimes.length / 2)],
      p95ExecutionTime: executionTimes[Math.floor(executionTimes.length * 0.95)],
      errorRate: errorCount / relevantMetrics.length,
      totalCalls: relevantMetrics.length,
      averageMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
    };
  }

  /**
   * Obtient les métriques détaillées
   */
  getDetailedMetrics(limit: number = 100): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Analyse des tendances de performance
   */
  analyzePerformanceTrends(
    functionName: string,
    timeWindowMinutes: number = 60
  ): {
    trend: 'improving' | 'degrading' | 'stable';
    trendPercentage: number;
    recommendation: string;
  } {
    const cutoffTime = Date.now() - (timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(
      m => m.functionName === functionName && m.timestamp >= cutoffTime
    );

    if (recentMetrics.length < 10) {
      return {
        trend: 'stable',
        trendPercentage: 0,
        recommendation: 'Pas assez de données pour analyser la tendance'
      };
    }

    // Diviser en deux moitiés pour comparer
    const midpoint = Math.floor(recentMetrics.length / 2);
    const firstHalf = recentMetrics.slice(0, midpoint);
    const secondHalf = recentMetrics.slice(midpoint);

    const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.executionTime, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.executionTime, 0) / secondHalf.length;

    const changePercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    let trend: 'improving' | 'degrading' | 'stable';
    let recommendation: string;

    if (changePercentage > 10) {
      trend = 'degrading';
      recommendation = 'Performance se dégrade - considérer l\'optimisation ou l\'augmentation des ressources';
    } else if (changePercentage < -10) {
      trend = 'improving';
      recommendation = 'Performance s\'améliore - bon travail!';
    } else {
      trend = 'stable';
      recommendation = 'Performance stable';
    }

    return {
      trend,
      trendPercentage: Math.abs(changePercentage),
      recommendation
    };
  }

  /**
   * Rapport de performance global
   */
  generatePerformanceReport(): {
    overview: any;
    topSlowFunctions: Array<{ functionName: string; avgTime: number; calls: number }>;
    topMemoryConsumers: Array<{ functionName: string; avgMemory: number; calls: number }>;
    errorSummary: Array<{ functionName: string; errorRate: number; errorCount: number }>;
    recommendations: string[];
  } {
    const functionStats = new Map<string, {
      executionTimes: number[];
      memoryUsages: number[];
      errorCount: number;
      totalCalls: number;
    }>();

    // Agréger les statistiques par fonction
    this.metrics.forEach(metric => {
      if (!functionStats.has(metric.functionName)) {
        functionStats.set(metric.functionName, {
          executionTimes: [],
          memoryUsages: [],
          errorCount: 0,
          totalCalls: 0
        });
      }

      const stats = functionStats.get(metric.functionName)!;
      stats.executionTimes.push(metric.executionTime);
      stats.memoryUsages.push(metric.memoryUsed);
      if (metric.status === 'error') stats.errorCount++;
      stats.totalCalls++;
    });

    // Calculer les top performers/consumers
    const topSlowFunctions = Array.from(functionStats.entries())
      .map(([name, stats]) => ({
        functionName: name,
        avgTime: stats.executionTimes.reduce((a, b) => a + b, 0) / stats.executionTimes.length,
        calls: stats.totalCalls
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);

    const topMemoryConsumers = Array.from(functionStats.entries())
      .map(([name, stats]) => ({
        functionName: name,
        avgMemory: stats.memoryUsages.reduce((a, b) => a + b, 0) / stats.memoryUsages.length,
        calls: stats.totalCalls
      }))
      .sort((a, b) => b.avgMemory - a.avgMemory)
      .slice(0, 10);

    const errorSummary = Array.from(functionStats.entries())
      .map(([name, stats]) => ({
        functionName: name,
        errorRate: stats.errorCount / stats.totalCalls,
        errorCount: stats.errorCount
      }))
      .filter(item => item.errorCount > 0)
      .sort((a, b) => b.errorRate - a.errorRate);

    // Générer des recommendations
    const recommendations: string[] = [];
    
    if (topSlowFunctions[0]?.avgTime > 5000) {
      recommendations.push(`Optimiser ${topSlowFunctions[0].functionName} - temps d'exécution très élevé`);
    }
    
    if (topMemoryConsumers[0]?.avgMemory > 50 * 1024 * 1024) {
      recommendations.push(`Réduire l'utilisation mémoire de ${topMemoryConsumers[0].functionName}`);
    }
    
    if (errorSummary[0]?.errorRate > 0.05) {
      recommendations.push(`Corriger les erreurs dans ${errorSummary[0].functionName} - taux d'erreur élevé`);
    }

    return {
      overview: this.getPerformanceStats(),
      topSlowFunctions,
      topMemoryConsumers,
      errorSummary,
      recommendations
    };
  }

  /**
   * Nettoie les anciennes métriques
   */
  cleanup(olderThanMinutes: number = 1440): void { // 24 heures par défaut
    const cutoffTime = Date.now() - (olderThanMinutes * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
  }
}