import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import Redis from 'ioredis';

export class RateLimiterService {
  private rateLimiters: Map<string, any> = new Map();
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
    });

    this.initializeLimiters();
  }

  private initializeLimiters() {
    // Rate limiter pour les requêtes GraphQL générales
    this.rateLimiters.set('graphql', new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl_graphql',
      points: 100, // Nombre de requêtes
      duration: 60, // Par minute
      blockDuration: 60, // Blocage pendant 1 minute
    }));

    // Rate limiter pour les mutations (plus restrictif)
    this.rateLimiters.set('mutation', new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl_mutation',
      points: 20, // Nombre de mutations
      duration: 60, // Par minute
      blockDuration: 120, // Blocage pendant 2 minutes
    }));

    // Rate limiter pour les requêtes d'authentification
    this.rateLimiters.set('auth', new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl_auth',
      points: 5, // Tentatives d'authentification
      duration: 300, // Sur 5 minutes
      blockDuration: 900, // Blocage pendant 15 minutes
    }));

    // Rate limiter pour les uploads de fichiers
    this.rateLimiters.set('upload', new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl_upload',
      points: 10, // Uploads
      duration: 60, // Par minute
      blockDuration: 300, // Blocage pendant 5 minutes
    }));

    // Rate limiter pour les requêtes analytiques (coûteuses)
    this.rateLimiters.set('analytics', new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl_analytics',
      points: 5, // Requêtes analytiques
      duration: 60, // Par minute
      blockDuration: 60,
    }));

    // Rate limiter pour les recherches
    this.rateLimiters.set('search', new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl_search',
      points: 30, // Recherches
      duration: 60, // Par minute
      blockDuration: 30,
    }));

    // Fallback en mémoire si Redis n'est pas disponible
    this.rateLimiters.set('fallback', new RateLimiterMemory({
      points: 50,
      duration: 60,
      blockDuration: 60,
    }));
  }

  /**
   * Vérifie la limite pour un type d'opération donné
   */
  async checkLimit(
    userId: string, 
    ip: string, 
    operation: string = 'graphql'
  ): Promise<void> {
    const limiter = this.rateLimiters.get(operation) || this.rateLimiters.get('fallback');
    
    try {
      // Vérification par utilisateur
      await limiter.consume(userId);
      
      // Vérification par IP (protection supplémentaire)
      const ipLimiter = this.rateLimiters.get('fallback');
      await ipLimiter.consume(ip);
      
    } catch (rejRes: any) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      throw new Error(`Trop de requêtes. Réessayez dans ${secs} secondes.`);
    }
  }

  /**
   * Vérifie spécifiquement les mutations
   */
  async checkMutationLimit(userId: string, ip: string): Promise<void> {
    return this.checkLimit(userId, ip, 'mutation');
  }

  /**
   * Vérifie les requêtes d'authentification
   */
  async checkAuthLimit(identifier: string): Promise<void> {
    const limiter = this.rateLimiters.get('auth');
    
    try {
      await limiter.consume(identifier);
    } catch (rejRes: any) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      throw new Error(`Trop de tentatives d'authentification. Réessayez dans ${secs} secondes.`);
    }
  }

  /**
   * Vérifie les uploads
   */
  async checkUploadLimit(userId: string): Promise<void> {
    return this.checkLimit(userId, '', 'upload');
  }

  /**
   * Vérifie les requêtes analytiques
   */
  async checkAnalyticsLimit(userId: string, ip: string): Promise<void> {
    return this.checkLimit(userId, ip, 'analytics');
  }

  /**
   * Vérifie les recherches
   */
  async checkSearchLimit(userId: string, ip: string): Promise<void> {
    return this.checkLimit(userId, ip, 'search');
  }

  /**
   * Obtient le statut actuel des limites pour un utilisateur
   */
  async getLimitStatus(userId: string, operation: string = 'graphql'): Promise<any> {
    const limiter = this.rateLimiters.get(operation);
    if (!limiter) return null;

    try {
      const res = await limiter.get(userId);
      return {
        operation,
        remainingPoints: res ? res.remainingPoints : null,
        msBeforeNext: res ? res.msBeforeNext : null,
        totalHits: res ? res.totalHits : 0,
      };
    } catch (error) {
      console.error('Error getting limit status:', error);
      return null;
    }
  }

  /**
   * Réinitialise les limites pour un utilisateur (admin uniquement)
   */
  async resetLimits(userId: string): Promise<boolean> {
    try {
      const promises = Array.from(this.rateLimiters.values()).map(limiter =>
        limiter.delete(userId)
      );
      
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error resetting limits:', error);
      return false;
    }
  }

  /**
   * Rate limiter adaptatif basé sur la charge du système
   */
  async checkAdaptiveLimit(
    userId: string, 
    ip: string, 
    systemLoad: number = 0.5
  ): Promise<void> {
    // Ajuster les limites en fonction de la charge système
    const adjustedPoints = Math.floor(100 * (1 - systemLoad * 0.5));
    
    const adaptiveLimiter = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl_adaptive',
      points: Math.max(adjustedPoints, 10), // Minimum 10 requêtes
      duration: 60,
      blockDuration: 60,
    });

    try {
      await adaptiveLimiter.consume(userId);
    } catch (rejRes: any) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      throw new Error(`Système surchargé. Réessayez dans ${secs} secondes.`);
    }
  }

  /**
   * Rate limiter par coût d'opération
   */
  async checkCostBasedLimit(
    userId: string, 
    operationCost: number = 1
  ): Promise<void> {
    const costLimiter = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl_cost',
      points: 1000, // Budget de points par minute
      duration: 60,
      blockDuration: 60,
    });

    try {
      await costLimiter.consume(userId, operationCost);
    } catch (rejRes: any) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      throw new Error(`Budget d'opérations épuisé. Réessayez dans ${secs} secondes.`);
    }
  }

  /**
   * Statistiques des rate limiters
   */
  async getStats(): Promise<any> {
    const stats: any = {};
    
    for (const [name, limiter] of this.rateLimiters.entries()) {
      try {
        // Ces méthodes peuvent ne pas être disponibles sur tous les types de limiters
        stats[name] = {
          type: limiter.constructor.name,
          // Ajouter d'autres stats si disponibles
        };
      } catch (error) {
        stats[name] = { error: 'Unable to get stats' };
      }
    }
    
    return stats;
  }

  /**
   * Nettoyage et fermeture
   */
  async cleanup(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}