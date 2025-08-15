/**
 * Rate limiter pour contrôler les appels et optimiser les coûts
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests = new Map<string, RequestRecord>();
  private config: RateLimitConfig;
  
  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Nettoyer les anciens enregistrements toutes les minutes
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }
  
  /**
   * Vérifier si une requête est autorisée
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);
    
    // Si pas d'enregistrement ou fenêtre expirée
    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }
    
    // Si limite atteinte
    if (record.count >= this.config.maxRequests) {
      return false;
    }
    
    // Incrémenter le compteur
    record.count++;
    return true;
  }
  
  /**
   * Obtenir les informations de rate limiting
   */
  getInfo(identifier: string): {
    limit: number;
    remaining: number;
    resetTime: number;
  } {
    const record = this.requests.get(identifier);
    const now = Date.now();
    
    if (!record || now > record.resetTime) {
      return {
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }
    
    return {
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - record.count),
      resetTime: record.resetTime,
    };
  }
  
  /**
   * Nettoyer les anciens enregistrements
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
  
  /**
   * Réinitialiser le compteur pour un identifiant
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
  
  /**
   * Obtenir des statistiques
   */
  getStats() {
    return {
      activeUsers: this.requests.size,
      config: this.config,
    };
  }
}

// Rate limiters prédéfinis pour différents cas d'usage
export const rateLimiters = {
  // API générale: 100 requêtes par minute
  api: new RateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000,
  }),
  
  // Backup: 5 requêtes par heure
  backup: new RateLimiter({
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
  }),
  
  // PDF generation: 10 requêtes par heure
  pdf: new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  }),
  
  // Webhook POS: 1000 requêtes par minute (pour les pics de vente)
  webhook: new RateLimiter({
    maxRequests: 1000,
    windowMs: 60 * 1000,
  }),
};

/**
 * Middleware de rate limiting pour les fonctions HTTPS
 */
export function rateLimitMiddleware(limiter: RateLimiter) {
  return (req: any, res: any, next: () => void) => {
    const identifier = req.ip || req.headers["x-forwarded-for"] || "unknown";
    
    if (!limiter.isAllowed(identifier)) {
      const info = limiter.getInfo(identifier);
      
      res.set({
        "X-RateLimit-Limit": info.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": Math.ceil(info.resetTime / 1000).toString(),
        "Retry-After": Math.ceil((info.resetTime - Date.now()) / 1000).toString(),
      });
      
      res.status(429).json({
        error: "Trop de requêtes",
        message: "Limite de taux dépassée. Veuillez réessayer plus tard.",
        retryAfter: Math.ceil((info.resetTime - Date.now()) / 1000),
      });
      return;
    }
    
    const info = limiter.getInfo(identifier);
    res.set({
      "X-RateLimit-Limit": info.limit.toString(),
      "X-RateLimit-Remaining": info.remaining.toString(),
      "X-RateLimit-Reset": Math.ceil(info.resetTime / 1000).toString(),
    });
    
    next();
  };
}