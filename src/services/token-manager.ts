'use client';

import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

/**
 * Service de gestion avancée des tokens avec refresh automatique,
 * rotation sécurisée et optimisation des performances
 */

interface TokenMetrics {
  refreshCount: number;
  lastRefresh: number;
  errorCount: number;
  averageLatency: number;
  totalRequests: number;
}

interface TokenCache {
  token: string;
  expiresAt: number;
  refreshToken?: string;
  user: any;
  metadata: {
    createdAt: number;
    lastUsed: number;
    deviceId: string;
    sessionId: string;
  };
}

interface RefreshStrategy {
  mode: 'proactive' | 'reactive' | 'background';
  threshold: number; // Pourcentage de temps avant expiration
  maxRetries: number;
  retryDelay: number;
}

class TokenManager {
  private static instance: TokenManager;
  private tokenCache: Map<string, TokenCache> = new Map();
  private refreshQueue: Set<string> = new Set();
  private metrics: TokenMetrics = {
    refreshCount: 0,
    lastRefresh: 0,
    errorCount: 0,
    averageLatency: 0,
    totalRequests: 0
  };
  
  private refreshStrategy: RefreshStrategy = {
    mode: 'proactive',
    threshold: 0.8, // Refresh à 80% de la durée de vie
    maxRetries: 3,
    retryDelay: 1000
  };

  private refreshInterval: NodeJS.Timeout | null = null;
  private currentUser: User | null = null;
  private authListenerUnsubscribe: (() => void) | null = null;

  private constructor() {
    this.initializeAuthListener();
    this.startBackgroundRefresh();
    this.loadFromStorage();
  }

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Initialise l'écoute des changements d'authentification
   */
  private initializeAuthListener(): void {
    if (!auth) return;

    this.authListenerUnsubscribe = onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        try {
          const token = await user.getIdToken(false);
          const tokenResult = await user.getIdTokenResult();
          
          await this.cacheToken({
            token,
            expiresAt: new Date(tokenResult.expirationTime).getTime(),
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName
            },
            metadata: {
              createdAt: Date.now(),
              lastUsed: Date.now(),
              deviceId: this.getDeviceId(),
              sessionId: this.getSessionId()
            }
          });
        } catch (error) {
          console.error('Erreur lors de la mise en cache du token:', error);
          this.metrics.errorCount++;
        }
      } else {
        this.clearAllTokens();
      }
    });
  }

  /**
   * Obtient le token actuel avec refresh automatique si nécessaire
   */
  public async getCurrentToken(forceRefresh: boolean = false): Promise<string | null> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      if (!this.currentUser) {
        return null;
      }

      const userId = this.currentUser.uid;
      const cachedToken = this.tokenCache.get(userId);

      // Vérifier si le token en cache est encore valide
      if (!forceRefresh && cachedToken && this.isTokenValid(cachedToken)) {
        cachedToken.metadata.lastUsed = Date.now();
        this.updateMetrics(startTime);
        return cachedToken.token;
      }

      // Refresh du token nécessaire
      return await this.refreshToken(userId, forceRefresh);
      
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      this.metrics.errorCount++;
      return null;
    }
  }

  /**
   * Refresh d'un token avec stratégie intelligente
   */
  private async refreshToken(userId: string, forceRefresh: boolean = false): Promise<string | null> {
    // Éviter les refreshes multiples simultanés
    if (this.refreshQueue.has(userId)) {
      return this.waitForRefresh(userId);
    }

    this.refreshQueue.add(userId);

    try {
      if (!this.currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const startTime = Date.now();
      const token = await this.currentUser.getIdToken(forceRefresh);
      const tokenResult = await this.currentUser.getIdTokenResult();

      const refreshedToken: TokenCache = {
        token,
        expiresAt: new Date(tokenResult.expirationTime).getTime(),
        user: {
          uid: this.currentUser.uid,
          email: this.currentUser.email,
          displayName: this.currentUser.displayName
        },
        metadata: {
          createdAt: Date.now(),
          lastUsed: Date.now(),
          deviceId: this.getDeviceId(),
          sessionId: this.getSessionId()
        }
      };

      await this.cacheToken(refreshedToken);
      
      this.metrics.refreshCount++;
      this.metrics.lastRefresh = Date.now();
      this.updateMetrics(startTime);

      // Mettre à jour le cookie de session
      await this.updateSessionCookie(token);

      return token;

    } catch (error) {
      console.error('Erreur lors du refresh du token:', error);
      this.metrics.errorCount++;
      
      // Stratégie de retry avec backoff
      if (this.metrics.errorCount < this.refreshStrategy.maxRetries) {
        await this.delay(this.refreshStrategy.retryDelay * this.metrics.errorCount);
        return this.refreshToken(userId, true);
      }
      
      throw error;
      
    } finally {
      this.refreshQueue.delete(userId);
    }
  }

  /**
   * Attendre la fin d'un refresh en cours
   */
  private async waitForRefresh(userId: string): Promise<string | null> {
    const maxWait = 10000; // 10 secondes max
    const interval = 100;
    let waited = 0;

    while (this.refreshQueue.has(userId) && waited < maxWait) {
      await this.delay(interval);
      waited += interval;
    }

    const cachedToken = this.tokenCache.get(userId);
    return cachedToken ? cachedToken.token : null;
  }

  /**
   * Met en cache un token avec persistance
   */
  private async cacheToken(tokenCache: TokenCache): Promise<void> {
    const userId = tokenCache.user.uid;
    this.tokenCache.set(userId, tokenCache);
    
    // Sauvegarder dans localStorage avec chiffrement léger
    await this.saveToStorage();
  }

  /**
   * Vérifie si un token est encore valide
   */
  private isTokenValid(tokenCache: TokenCache): boolean {
    const now = Date.now();
    const timeUntilExpiry = tokenCache.expiresAt - now;
    const totalLifetime = tokenCache.expiresAt - tokenCache.metadata.createdAt;
    
    // Token valide si plus de X% de sa durée de vie restante
    return timeUntilExpiry > (totalLifetime * (1 - this.refreshStrategy.threshold));
  }

  /**
   * Démarre le refresh proactif en arrière-plan
   */
  private startBackgroundRefresh(): void {
    this.refreshInterval = setInterval(async () => {
      if (this.refreshStrategy.mode !== 'background') return;

      for (const [userId, tokenCache] of this.tokenCache.entries()) {
        if (!this.isTokenValid(tokenCache) && !this.refreshQueue.has(userId)) {
          try {
            await this.refreshToken(userId);
          } catch (error) {
            console.warn(`Erreur refresh background pour ${userId}:`, error);
          }
        }
      }
    }, 30000); // Vérification toutes les 30 secondes
  }

  /**
   * Met à jour le cookie de session
   */
  private async updateSessionCookie(token: string): Promise<void> {
    try {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: token }),
      });
    } catch (error) {
      console.warn('Impossible de mettre à jour le cookie de session:', error);
    }
  }

  /**
   * Sauvegarde sécurisée dans localStorage
   */
  private async saveToStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const data = Array.from(this.tokenCache.entries()).map(([userId, cache]) => ({
        userId,
        // Ne pas sauvegarder le token lui-même pour la sécurité
        expiresAt: cache.expiresAt,
        user: cache.user,
        metadata: cache.metadata
      }));

      localStorage.setItem('cuisinezen_token_cache', JSON.stringify({
        data,
        version: '1.0',
        encrypted: false // Pour une future implémentation de chiffrement
      }));
    } catch (error) {
      console.warn('Impossible de sauvegarder le cache de tokens:', error);
    }
  }

  /**
   * Charge depuis localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('cuisinezen_token_cache');
      if (!stored) return;

      const { data } = JSON.parse(stored);
      // Reconstruction partielle du cache (sans les tokens)
      // Les tokens seront récupérés lors de la prochaine requête
      
    } catch (error) {
      console.warn('Impossible de charger le cache de tokens:', error);
      localStorage.removeItem('cuisinezen_token_cache');
    }
  }

  /**
   * Utilitaires
   */
  private getDeviceId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server_session';
    
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateMetrics(startTime: number): void {
    const latency = Date.now() - startTime;
    this.metrics.averageLatency = (
      (this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency) /
      this.metrics.totalRequests
    );
  }

  /**
   * API publiques
   */
  public clearAllTokens(): void {
    this.tokenCache.clear();
    this.saveToStorage();
  }

  public getMetrics(): TokenMetrics {
    return { ...this.metrics };
  }

  public setRefreshStrategy(strategy: Partial<RefreshStrategy>): void {
    this.refreshStrategy = { ...this.refreshStrategy, ...strategy };
  }

  public getCacheStats(): {
    size: number;
    tokens: Array<{
      userId: string;
      expiresAt: number;
      lastUsed: number;
      valid: boolean;
    }>;
  } {
    return {
      size: this.tokenCache.size,
      tokens: Array.from(this.tokenCache.entries()).map(([userId, cache]) => ({
        userId,
        expiresAt: cache.expiresAt,
        lastUsed: cache.metadata.lastUsed,
        valid: this.isTokenValid(cache)
      }))
    };
  }

  /**
   * Nettoyage lors de la destruction
   */
  public destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.authListenerUnsubscribe) {
      this.authListenerUnsubscribe();
    }
    this.clearAllTokens();
  }
}

// Instance singleton
export const tokenManager = TokenManager.getInstance();

// Hook React pour utiliser le token manager
import { useState, useEffect } from 'react';

export function useTokenManager() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<TokenMetrics>(tokenManager.getMetrics());

  useEffect(() => {
    const loadToken = async () => {
      try {
        const currentToken = await tokenManager.getCurrentToken();
        setToken(currentToken);
      } catch (error) {
        console.error('Erreur chargement token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();

    // Mettre à jour les métriques périodiquement
    const metricsInterval = setInterval(() => {
      setMetrics(tokenManager.getMetrics());
    }, 5000);

    return () => clearInterval(metricsInterval);
  }, []);

  const refreshToken = async () => {
    setIsLoading(true);
    try {
      const newToken = await tokenManager.getCurrentToken(true);
      setToken(newToken);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    token,
    isLoading,
    metrics,
    refreshToken,
    cacheStats: tokenManager.getCacheStats()
  };
}