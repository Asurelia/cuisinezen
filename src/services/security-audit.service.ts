/**
 * Service d'audit de sécurité et de logging pour CuisineZen
 * Implémente un système d'audit trail complet et sécurisé
 */

import { getFirestore, collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface SecurityEvent {
  id?: string;
  timestamp: Timestamp;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  result: 'success' | 'failure' | 'blocked';
  metadata?: Record<string, any>;
  message: string;
  hash?: string; // Pour l'intégrité des logs
}

export enum SecurityEventType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  SECURITY_VIOLATION = 'security_violation',
  SYSTEM_SECURITY = 'system_security',
  COMPLIANCE = 'compliance'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AuditConfig {
  enableRealTimeAlerts: boolean;
  retentionDays: number;
  enableIntegrityChecks: boolean;
  alertThresholds: {
    failedLogins: number;
    suspiciousActivity: number;
    dataBreachAttempts: number;
  };
}

export class SecurityAuditService {
  private firestore;
  private auth;
  private config: AuditConfig;
  private alertCallbacks: ((event: SecurityEvent) => void)[] = [];

  constructor(config: Partial<AuditConfig> = {}) {
    this.firestore = getFirestore();
    this.auth = getAuth();
    this.config = {
      enableRealTimeAlerts: true,
      retentionDays: 365,
      enableIntegrityChecks: true,
      alertThresholds: {
        failedLogins: 5,
        suspiciousActivity: 3,
        dataBreachAttempts: 1
      },
      ...config
    };
  }

  /**
   * Enregistre un événement de sécurité
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'hash'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        timestamp: Timestamp.now(),
        hash: this.generateEventHash(event)
      };

      // Ajouter des métadonnées contextuelles
      securityEvent.metadata = {
        ...securityEvent.metadata,
        userAgent: this.getUserAgent(),
        timestamp: Date.now(),
        version: '1.0'
      };

      // Enregistrer dans Firestore
      const docRef = await addDoc(collection(this.firestore, 'security-logs'), securityEvent);
      securityEvent.id = docRef.id;

      // Vérifier les seuils d'alerte
      if (this.config.enableRealTimeAlerts) {
        await this.checkAlertThresholds(securityEvent);
      }

      // Déclencher les callbacks d'alerte
      this.triggerAlertCallbacks(securityEvent);

      console.log(`[SECURITY AUDIT] ${event.eventType}: ${event.message}`);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'événement de sécurité:', error);
      // En cas d'erreur, enregistrer localement pour ne pas perdre l'événement
      this.logToLocalStorage(event);
    }
  }

  /**
   * Enregistre une tentative d'authentification
   */
  async logAuthenticationAttempt(
    result: 'success' | 'failure',
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: SecurityEventType.AUTHENTICATION,
      severity: result === 'failure' ? SecuritySeverity.MEDIUM : SecuritySeverity.LOW,
      userId,
      result,
      message: `Tentative d'authentification ${result === 'success' ? 'réussie' : 'échouée'}`,
      metadata: details
    });
  }

  /**
   * Enregistre un accès aux données
   */
  async logDataAccess(
    resource: string,
    action: string,
    result: 'success' | 'failure',
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: SecurityEventType.DATA_ACCESS,
      severity: SecuritySeverity.LOW,
      userId,
      resource,
      action,
      result,
      message: `Accès aux données: ${action} sur ${resource}`,
      metadata: details
    });
  }

  /**
   * Enregistre une modification de données
   */
  async logDataModification(
    resource: string,
    action: string,
    result: 'success' | 'failure',
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: SecurityEventType.DATA_MODIFICATION,
      severity: SecuritySeverity.MEDIUM,
      userId,
      resource,
      action,
      result,
      message: `Modification de données: ${action} sur ${resource}`,
      metadata: details
    });
  }

  /**
   * Enregistre une activité suspecte
   */
  async logSuspiciousActivity(
    description: string,
    severity: SecuritySeverity = SecuritySeverity.HIGH,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity,
      userId,
      result: 'blocked',
      message: `Activité suspecte détectée: ${description}`,
      metadata: details
    });
  }

  /**
   * Enregistre une violation de sécurité
   */
  async logSecurityViolation(
    violation: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: SecurityEventType.SECURITY_VIOLATION,
      severity: SecuritySeverity.CRITICAL,
      userId,
      result: 'blocked',
      message: `Violation de sécurité: ${violation}`,
      metadata: details
    });
  }

  /**
   * Récupère les événements de sécurité avec filtres
   */
  async getSecurityEvents(filters: {
    eventType?: SecurityEventType;
    severity?: SecuritySeverity;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limitCount?: number;
  } = {}): Promise<SecurityEvent[]> {
    try {
      let q = query(collection(this.firestore, 'security-logs'));

      // Appliquer les filtres
      if (filters.eventType) {
        q = query(q, where('eventType', '==', filters.eventType));
      }
      if (filters.severity) {
        q = query(q, where('severity', '==', filters.severity));
      }
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.startDate) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
      }
      if (filters.endDate) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
      }

      // Ordonner par timestamp décroissant
      q = query(q, orderBy('timestamp', 'desc'));

      // Limiter les résultats
      if (filters.limitCount) {
        q = query(q, limit(filters.limitCount));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SecurityEvent));
    } catch (error) {
      console.error('Erreur lors de la récupération des événements de sécurité:', error);
      return [];
    }
  }

  /**
   * Génère un rapport de sécurité
   */
  async generateSecurityReport(period: 'day' | 'week' | 'month' = 'week'): Promise<{
    summary: Record<string, number>;
    criticalEvents: SecurityEvent[];
    trends: Record<string, number>;
    recommendations: string[];
  }> {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }

    const events = await this.getSecurityEvents({ startDate, endDate });

    // Résumé par type d'événement
    const summary = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Événements critiques
    const criticalEvents = events.filter(
      event => event.severity === SecuritySeverity.CRITICAL || event.severity === SecuritySeverity.HIGH
    );

    // Tendances par jour
    const trends = events.reduce((acc, event) => {
      const date = event.timestamp.toDate().toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recommandations basées sur les événements
    const recommendations = this.generateRecommendations(events);

    return {
      summary,
      criticalEvents,
      trends,
      recommendations
    };
  }

  /**
   * Ajoute un callback d'alerte
   */
  addAlertCallback(callback: (event: SecurityEvent) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Supprime un callback d'alerte
   */
  removeAlertCallback(callback: (event: SecurityEvent) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  /**
   * Vérifie l'intégrité des logs
   */
  async verifyLogIntegrity(eventId: string): Promise<boolean> {
    if (!this.config.enableIntegrityChecks) {
      return true;
    }

    try {
      const events = await this.getSecurityEvents({ limitCount: 1 });
      const event = events.find(e => e.id === eventId);
      
      if (!event) {
        return false;
      }

      const calculatedHash = this.generateEventHash(event);
      return calculatedHash === event.hash;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'intégrité:', error);
      return false;
    }
  }

  /**
   * Nettoie les anciens logs selon la politique de rétention
   */
  async cleanupOldLogs(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const oldEvents = await this.getSecurityEvents({ 
      endDate: cutoffDate,
      limitCount: 1000 
    });

    // Note: En production, utiliser une Cloud Function pour le nettoyage
    console.log(`${oldEvents.length} anciens logs à nettoyer`);
  }

  /**
   * Détecte les anomalies dans les patterns d'activité
   */
  async detectAnomalies(userId: string): Promise<{
    isAnomaly: boolean;
    score: number;
    reasons: string[];
  }> {
    const recentEvents = await this.getSecurityEvents({
      userId,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h
      limitCount: 100
    });

    let anomalyScore = 0;
    const reasons: string[] = [];

    // Vérifier le nombre de tentatives d'authentification échouées
    const failedLogins = recentEvents.filter(
      e => e.eventType === SecurityEventType.AUTHENTICATION && e.result === 'failure'
    ).length;

    if (failedLogins > this.config.alertThresholds.failedLogins) {
      anomalyScore += 30;
      reasons.push(`${failedLogins} tentatives de connexion échouées`);
    }

    // Vérifier les accès aux données inhabituels
    const dataAccesses = recentEvents.filter(
      e => e.eventType === SecurityEventType.DATA_ACCESS
    );

    const uniqueResources = new Set(dataAccesses.map(e => e.resource));
    if (uniqueResources.size > 20) {
      anomalyScore += 20;
      reasons.push('Accès à un nombre inhabituel de ressources');
    }

    // Vérifier la fréquence des requêtes
    const requestsPerHour = recentEvents.length / 24;
    if (requestsPerHour > 100) {
      anomalyScore += 25;
      reasons.push('Fréquence de requêtes anormalement élevée');
    }

    return {
      isAnomaly: anomalyScore > 50,
      score: anomalyScore,
      reasons
    };
  }

  // Méthodes privées

  private generateEventHash(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'hash'>): string {
    const data = JSON.stringify({
      eventType: event.eventType,
      severity: event.severity,
      userId: event.userId,
      message: event.message,
      result: event.result
    });
    
    // Utilisation d'un hash simple pour l'exemple
    // En production, utiliser une fonction de hachage cryptographique
    return btoa(data).substr(0, 16);
  }

  private getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'Server';
  }

  private async checkAlertThresholds(event: SecurityEvent): Promise<void> {
    if (event.severity === SecuritySeverity.CRITICAL) {
      // Alerte immédiate pour les événements critiques
      this.sendImmedateAlert(event);
      return;
    }

    // Vérifier les seuils pour les tentatives de connexion échouées
    if (event.eventType === SecurityEventType.AUTHENTICATION && event.result === 'failure') {
      const recentFailures = await this.getSecurityEvents({
        eventType: SecurityEventType.AUTHENTICATION,
        userId: event.userId,
        startDate: new Date(Date.now() - 60 * 60 * 1000), // 1h
        limitCount: this.config.alertThresholds.failedLogins + 1
      });

      if (recentFailures.length >= this.config.alertThresholds.failedLogins) {
        this.sendThresholdAlert('failed_logins', event);
      }
    }
  }

  private triggerAlertCallbacks(event: SecurityEvent): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Erreur dans le callback d\'alerte:', error);
      }
    });
  }

  private sendImmedateAlert(event: SecurityEvent): void {
    console.warn(`[ALERTE CRITIQUE] ${event.message}`, event);
    // En production: envoyer email, SMS, notification push, etc.
  }

  private sendThresholdAlert(type: string, event: SecurityEvent): void {
    console.warn(`[ALERTE SEUIL] ${type} dépassé pour ${event.userId}`, event);
    // En production: envoyer alerte selon la politique de sécurité
  }

  private logToLocalStorage(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'hash'>): void {
    try {
      const localLogs = JSON.parse(localStorage.getItem('security-logs-backup') || '[]');
      localLogs.push({
        ...event,
        timestamp: Date.now(),
        source: 'local-backup'
      });
      
      // Garder seulement les 100 derniers événements
      if (localLogs.length > 100) {
        localLogs.splice(0, localLogs.length - 100);
      }
      
      localStorage.setItem('security-logs-backup', JSON.stringify(localLogs));
    } catch (error) {
      console.error('Impossible de sauvegarder localement:', error);
    }
  }

  private generateRecommendations(events: SecurityEvent[]): string[] {
    const recommendations: string[] = [];

    const failedLogins = events.filter(
      e => e.eventType === SecurityEventType.AUTHENTICATION && e.result === 'failure'
    ).length;

    if (failedLogins > 10) {
      recommendations.push('Mettre en place un système de CAPTCHA après 3 tentatives échouées');
      recommendations.push('Considérer l\'implémentation d\'une authentification à deux facteurs');
    }

    const suspiciousActivities = events.filter(
      e => e.eventType === SecurityEventType.SUSPICIOUS_ACTIVITY
    ).length;

    if (suspiciousActivities > 5) {
      recommendations.push('Renforcer le monitoring des activités suspectes');
      recommendations.push('Réviser les règles de détection d\'anomalies');
    }

    const securityViolations = events.filter(
      e => e.eventType === SecurityEventType.SECURITY_VIOLATION
    ).length;

    if (securityViolations > 0) {
      recommendations.push('Audit immédiat des permissions et accès');
      recommendations.push('Formation du personnel sur les bonnes pratiques de sécurité');
    }

    return recommendations;
  }
}

// Export d'instance singleton
export const securityAuditService = new SecurityAuditService();