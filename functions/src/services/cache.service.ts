import Redis from 'ioredis';

export class CacheService {
  private static redis: Redis;
  
  private static getRedis(): Redis {
    if (!this.redis) {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        
        // Configuration de performance
        connectTimeout: 10000,
        commandTimeout: 5000,
        
        // Pool de connexions
        family: 4,
        keepAlive: true,
      });

      this.redis.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      this.redis.on('connect', () => {
        console.log('Redis connected successfully');
      });
    }
    
    return this.redis;
  }

  /**
   * Récupère une valeur du cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const redis = this.getRedis();
      const value = await redis.get(key);
      
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Stocke une valeur dans le cache
   */
  static async set(
    key: string, 
    value: any, 
    ttlSeconds: number = 3600
  ): Promise<boolean> {
    try {
      const redis = this.getRedis();
      const serialized = JSON.stringify(value);
      
      await redis.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Supprime une clé du cache
   */
  static async delete(key: string): Promise<boolean> {
    try {
      const redis = this.getRedis();
      const result = await redis.del(key);
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Invalide toutes les clés correspondant à un pattern
   */
  static async invalidatePattern(pattern: string): Promise<number> {
    try {
      const redis = this.getRedis();
      const keys = await redis.keys(pattern);
      
      if (keys.length === 0) return 0;
      
      const result = await redis.del(...keys);
      return result;
    } catch (error) {
      console.error('Cache invalidatePattern error:', error);
      return 0;
    }
  }

  /**
   * Cache avec fonction de fallback
   */
  static async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    try {
      // Tentative de récupération depuis le cache
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Exécution de la fonction de fallback
      const value = await fallback();
      
      // Stockage en cache
      await this.set(key, value, ttlSeconds);
      
      return value;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      // En cas d'erreur de cache, exécuter quand même le fallback
      return fallback();
    }
  }

  /**
   * Cache avec verrouillage distribué pour éviter les cache stampede
   */
  static async getOrSetWithLock<T>(
    key: string,
    fallback: () => Promise<T>,
    ttlSeconds: number = 3600,
    lockTtlSeconds: number = 30
  ): Promise<T> {
    const lockKey = `lock:${key}`;
    
    try {
      // Vérifier le cache d'abord
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      const redis = this.getRedis();
      
      // Tentative d'acquisition du verrou
      const lockAcquired = await redis.set(
        lockKey,
        '1',
        'EX',
        lockTtlSeconds,
        'NX'
      );

      if (lockAcquired) {
        try {
          // Double vérification du cache après acquisition du verrou
          const cachedAfterLock = await this.get<T>(key);
          if (cachedAfterLock !== null) {
            return cachedAfterLock;
          }

          // Exécution de la fonction de fallback
          const value = await fallback();
          
          // Stockage en cache
          await this.set(key, value, ttlSeconds);
          
          return value;
        } finally {
          // Libération du verrou
          await redis.del(lockKey);
        }
      } else {
        // Attendre un peu et réessayer
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.getOrSetWithLock(key, fallback, ttlSeconds, lockTtlSeconds);
      }
    } catch (error) {
      console.error('Cache getOrSetWithLock error:', error);
      return fallback();
    }
  }

  /**
   * Mise en cache par lot
   */
  static async mset(entries: Array<[string, any, number]>): Promise<boolean> {
    try {
      const redis = this.getRedis();
      const pipeline = redis.pipeline();
      
      for (const [key, value, ttl] of entries) {
        const serialized = JSON.stringify(value);
        pipeline.setex(key, ttl, serialized);
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Récupération par lot
   */
  static async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const redis = this.getRedis();
      const values = await redis.mget(...keys);
      
      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Statistiques du cache
   */
  static async getStats(): Promise<any> {
    try {
      const redis = this.getRedis();
      const info = await redis.info('memory');
      const keyspace = await redis.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        connected: redis.status === 'ready'
      };
    } catch (error) {
      console.error('Cache getStats error:', error);
      return null;
    }
  }

  /**
   * Nettoyage du cache
   */
  static async flush(): Promise<boolean> {
    try {
      const redis = this.getRedis();
      await redis.flushall();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Fermeture de la connexion Redis
   */
  static async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}