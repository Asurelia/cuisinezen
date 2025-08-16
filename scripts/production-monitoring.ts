/**
 * 📊 Production Monitoring System for CuisineZen
 * APM, Error Tracking, Business Metrics & Alerting
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getFunctions } from 'firebase-admin/functions';
import { getAuth } from 'firebase-admin/auth';

interface APMMetric {
  timestamp: Date;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
  error?: string;
  trace?: string;
}

interface ErrorLog {
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  userId?: string;
  sessionId?: string;
  component: string;
  environment: string;
  metadata?: Record<string, any>;
}

interface BusinessMetric {
  timestamp: Date;
  metric: string;
  value: number;
  tags: Record<string, string>;
  environment: string;
}

interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: ('slack' | 'email' | 'sms' | 'pagerduty')[];
  enabled: boolean;
}

export class ProductionMonitoringSystem {
  private db: FirebaseFirestore.Firestore;
  private alertRules: AlertRule[] = [];
  private isMonitoring = false;
  private metricsBuffer: APMMetric[] = [];
  private errorBuffer: ErrorLog[] = [];
  private businessBuffer: BusinessMetric[] = [];

  constructor() {
    // Initialize Firebase Admin
    if (!initializeApp.length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }

    this.db = getFirestore();
    this.initializeAlertRules();
  }

  /**
   * Start comprehensive monitoring
   */
  async startMonitoring(): Promise<void> {
    console.log('📊 Starting production monitoring system...');
    
    this.isMonitoring = true;
    
    // Start metric collection
    this.startAPMCollection();
    this.startErrorTracking();
    this.startBusinessMetricsCollection();
    
    // Start alert monitoring
    this.startAlertMonitoring();
    
    // Start periodic health checks
    this.startHealthChecks();
    
    // Setup graceful shutdown
    this.setupGracefulShutdown();
    
    console.log('✅ Production monitoring system started');
  }

  /**
   * Application Performance Monitoring (APM)
   */
  private startAPMCollection(): void {
    console.log('⚡ Starting APM collection...');
    
    // Monitor Next.js API routes
    this.monitorAPIRoutes();
    
    // Monitor Firebase Functions
    this.monitorCloudFunctions();
    
    // Monitor client-side performance
    this.monitorClientPerformance();
    
    // Core Web Vitals monitoring
    this.monitorCoreWebVitals();
    
    // Flush metrics buffer every 30 seconds
    setInterval(() => {
      this.flushAPMMetrics();
    }, 30000);
  }

  /**
   * Monitor Next.js API routes performance
   */
  private monitorAPIRoutes(): void {
    // This would integrate with Next.js middleware
    console.log('🔍 Monitoring API routes...');
    
    // Simulated API monitoring setup
    setInterval(async () => {
      const endpoints = [
        '/api/auth/session',
        '/api/inventory',
        '/api/recipes',
        '/api/analytics'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const startTime = Date.now();
          const response = await fetch(`${process.env.BASE_URL}${endpoint}`, {
            headers: {
              'User-Agent': 'MonitoringBot/1.0'
            }
          });
          const responseTime = Date.now() - startTime;
          
          this.recordAPMMetric({
            timestamp: new Date(),
            endpoint,
            method: 'GET',
            responseTime,
            statusCode: response.status,
            userAgent: 'MonitoringBot/1.0'
          });
          
        } catch (error) {
          this.recordAPMMetric({
            timestamp: new Date(),
            endpoint,
            method: 'GET',
            responseTime: -1,
            statusCode: 500,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Monitor Firebase Cloud Functions
   */
  private monitorCloudFunctions(): void {
    console.log('☁️ Monitoring Cloud Functions...');
    
    // Monitor function execution metrics
    setInterval(async () => {
      try {
        const functions = [
          'backup-data',
          'generate-reports',
          'send-notifications',
          'process-analytics'
        ];
        
        for (const functionName of functions) {
          // Monitor function health and performance
          await this.checkFunctionHealth(functionName);
        }
      } catch (error) {
        this.recordError({
          timestamp: new Date(),
          level: 'error',
          message: 'Failed to monitor Cloud Functions',
          component: 'monitoring',
          environment: process.env.NODE_ENV || 'production',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }, 120000); // Every 2 minutes
  }

  /**
   * Monitor client-side performance
   */
  private monitorClientPerformance(): void {
    console.log('💻 Setting up client-side performance monitoring...');
    
    // This would integrate with a client-side monitoring script
    // For now, we'll simulate by checking Lighthouse metrics
    setInterval(async () => {
      try {
        await this.collectLighthouseMetrics();
      } catch (error) {
        console.warn('Failed to collect Lighthouse metrics:', error);
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Monitor Core Web Vitals
   */
  private monitorCoreWebVitals(): void {
    console.log('📈 Monitoring Core Web Vitals...');
    
    setInterval(async () => {
      try {
        const vitals = await this.getCoreWebVitals();
        
        // Record as business metrics
        this.recordBusinessMetric({
          timestamp: new Date(),
          metric: 'core_web_vitals.lcp',
          value: vitals.lcp,
          tags: { page: 'all' },
          environment: process.env.NODE_ENV || 'production'
        });
        
        this.recordBusinessMetric({
          timestamp: new Date(),
          metric: 'core_web_vitals.fid',
          value: vitals.fid,
          tags: { page: 'all' },
          environment: process.env.NODE_ENV || 'production'
        });
        
        this.recordBusinessMetric({
          timestamp: new Date(),
          metric: 'core_web_vitals.cls',
          value: vitals.cls,
          tags: { page: 'all' },
          environment: process.env.NODE_ENV || 'production'
        });
        
      } catch (error) {
        this.recordError({
          timestamp: new Date(),
          level: 'warning',
          message: 'Failed to collect Core Web Vitals',
          component: 'monitoring',
          environment: process.env.NODE_ENV || 'production'
        });
      }
    }, 180000); // Every 3 minutes
  }

  /**
   * Error tracking and logging
   */
  private startErrorTracking(): void {
    console.log('🚨 Starting error tracking...');
    
    // Monitor application errors
    this.monitorApplicationErrors();
    
    // Monitor infrastructure errors
    this.monitorInfrastructureErrors();
    
    // Flush error buffer every 15 seconds
    setInterval(() => {
      this.flushErrorLogs();
    }, 15000);
  }

  /**
   * Monitor application-level errors
   */
  private monitorApplicationErrors(): void {
    // Monitor Firebase Auth errors
    setInterval(async () => {
      try {
        const authErrorsQuery = await this.db
          .collection('error_logs')
          .where('component', '==', 'auth')
          .where('timestamp', '>=', new Date(Date.now() - 300000)) // Last 5 minutes
          .get();
        
        const authErrors = authErrorsQuery.size;
        
        if (authErrors > 10) { // More than 10 auth errors in 5 minutes
          await this.triggerAlert('auth_errors_spike', {
            count: authErrors,
            timeframe: '5 minutes'
          });
        }
        
      } catch (error) {
        console.warn('Failed to monitor auth errors:', error);
      }
    }, 60000); // Every minute
  }

  /**
   * Monitor infrastructure errors
   */
  private monitorInfrastructureErrors(): void {
    // Monitor Firebase quota usage
    setInterval(async () => {
      try {
        await this.checkFirebaseQuotas();
      } catch (error) {
        this.recordError({
          timestamp: new Date(),
          level: 'error',
          message: 'Failed to check Firebase quotas',
          component: 'infrastructure',
          environment: process.env.NODE_ENV || 'production',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Business metrics collection
   */
  private startBusinessMetricsCollection(): void {
    console.log('💼 Starting business metrics collection...');
    
    // User engagement metrics
    this.collectUserEngagementMetrics();
    
    // Feature usage metrics
    this.collectFeatureUsageMetrics();
    
    // Performance impact on business metrics
    this.collectPerformanceBusinessMetrics();
    
    // Flush business metrics every 60 seconds
    setInterval(() => {
      this.flushBusinessMetrics();
    }, 60000);
  }

  /**
   * Collect user engagement metrics
   */
  private collectUserEngagementMetrics(): void {
    setInterval(async () => {
      try {
        // Active users in last hour
        const activeUsersQuery = await this.db
          .collection('user_sessions')
          .where('last_activity', '>=', new Date(Date.now() - 3600000))
          .get();
        
        this.recordBusinessMetric({
          timestamp: new Date(),
          metric: 'active_users_1h',
          value: activeUsersQuery.size,
          tags: { period: '1h' },
          environment: process.env.NODE_ENV || 'production'
        });
        
        // Recipe views in last hour
        const recipeViewsQuery = await this.db
          .collection('analytics')
          .where('event', '==', 'recipe_view')
          .where('timestamp', '>=', new Date(Date.now() - 3600000))
          .get();
        
        this.recordBusinessMetric({
          timestamp: new Date(),
          metric: 'recipe_views_1h',
          value: recipeViewsQuery.size,
          tags: { period: '1h' },
          environment: process.env.NODE_ENV || 'production'
        });
        
      } catch (error) {
        this.recordError({
          timestamp: new Date(),
          level: 'warning',
          message: 'Failed to collect user engagement metrics',
          component: 'business-metrics',
          environment: process.env.NODE_ENV || 'production'
        });
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Collect feature usage metrics
   */
  private collectFeatureUsageMetrics(): void {
    setInterval(async () => {
      try {
        const features = [
          'inventory_add_product',
          'recipe_create',
          'barcode_scan',
          'menu_generate',
          'analytics_view'
        ];
        
        for (const feature of features) {
          const usageQuery = await this.db
            .collection('analytics')
            .where('event', '==', feature)
            .where('timestamp', '>=', new Date(Date.now() - 3600000))
            .get();
          
          this.recordBusinessMetric({
            timestamp: new Date(),
            metric: `feature_usage.${feature}`,
            value: usageQuery.size,
            tags: { feature, period: '1h' },
            environment: process.env.NODE_ENV || 'production'
          });
        }
        
      } catch (error) {
        this.recordError({
          timestamp: new Date(),
          level: 'warning',
          message: 'Failed to collect feature usage metrics',
          component: 'business-metrics',
          environment: process.env.NODE_ENV || 'production'
        });
      }
    }, 600000); // Every 10 minutes
  }

  /**
   * Alert monitoring and triggering
   */
  private startAlertMonitoring(): void {
    console.log('🔔 Starting alert monitoring...');
    
    setInterval(async () => {
      for (const rule of this.alertRules) {
        if (rule.enabled) {
          await this.evaluateAlertRule(rule);
        }
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Evaluate individual alert rule
   */
  private async evaluateAlertRule(rule: AlertRule): Promise<void> {
    try {
      let shouldAlert = false;
      let alertData: any = {};
      
      switch (rule.condition) {
        case 'response_time_high':
          const avgResponseTime = await this.getAverageResponseTime(rule.duration);
          shouldAlert = avgResponseTime > rule.threshold;
          alertData = { averageResponseTime: avgResponseTime, threshold: rule.threshold };
          break;
          
        case 'error_rate_high':
          const errorRate = await this.getErrorRate(rule.duration);
          shouldAlert = errorRate > rule.threshold;
          alertData = { errorRate: errorRate, threshold: rule.threshold };
          break;
          
        case 'active_users_low':
          const activeUsers = await this.getActiveUsers(rule.duration);
          shouldAlert = activeUsers < rule.threshold;
          alertData = { activeUsers: activeUsers, threshold: rule.threshold };
          break;
          
        case 'core_web_vitals_poor':
          const vitals = await this.getCoreWebVitals();
          shouldAlert = vitals.lcp > rule.threshold;
          alertData = { lcp: vitals.lcp, threshold: rule.threshold };
          break;
      }
      
      if (shouldAlert) {
        await this.triggerAlert(rule.name, alertData, rule.severity, rule.channels);
      }
      
    } catch (error) {
      console.warn(`Failed to evaluate alert rule ${rule.name}:`, error);
    }
  }

  /**
   * Trigger alert notification
   */
  private async triggerAlert(
    alertName: string, 
    data: any, 
    severity: string = 'medium',
    channels: string[] = ['slack']
  ): Promise<void> {
    console.log(`🚨 Triggering alert: ${alertName} (${severity})`);
    
    const alert = {
      name: alertName,
      severity,
      timestamp: new Date(),
      data,
      environment: process.env.NODE_ENV || 'production'
    };
    
    // Store alert in Firestore
    await this.db.collection('alerts').add(alert);
    
    // Send notifications
    for (const channel of channels) {
      await this.sendAlertNotification(alert, channel);
    }
  }

  /**
   * Send alert notification to specific channel
   */
  private async sendAlertNotification(alert: any, channel: string): Promise<void> {
    try {
      switch (channel) {
        case 'slack':
          await this.sendSlackAlert(alert);
          break;
        case 'email':
          await this.sendEmailAlert(alert);
          break;
        case 'sms':
          await this.sendSMSAlert(alert);
          break;
        case 'pagerduty':
          await this.sendPagerDutyAlert(alert);
          break;
      }
    } catch (error) {
      console.error(`Failed to send ${channel} alert:`, error);
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: any): Promise<void> {
    if (!process.env.SLACK_WEBHOOK) return;
    
    const color = {
      low: 'good',
      medium: 'warning',
      high: 'danger',
      critical: 'danger'
    }[alert.severity] || 'warning';
    
    const message = {
      text: `🚨 CuisineZen Alert: ${alert.name}`,
      attachments: [{
        color,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Environment',
            value: alert.environment,
            short: true
          },
          {
            title: 'Timestamp',
            value: alert.timestamp.toISOString(),
            short: true
          },
          {
            title: 'Data',
            value: JSON.stringify(alert.data, null, 2),
            short: false
          }
        ]
      }]
    };
    
    await fetch(process.env.SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  }

  /**
   * Health checks for critical systems
   */
  private startHealthChecks(): void {
    console.log('🏥 Starting health checks...');
    
    setInterval(async () => {
      await this.performHealthChecks();
    }, 60000); // Every minute
  }

  /**
   * Perform comprehensive health checks
   */
  private async performHealthChecks(): Promise<void> {
    const healthChecks = [
      this.checkFirebaseConnection(),
      this.checkNextJSHealth(),
      this.checkDatabaseHealth(),
      this.checkStorageHealth()
    ];
    
    const results = await Promise.allSettled(healthChecks);
    
    results.forEach((result, index) => {
      const checkNames = ['Firebase', 'Next.js', 'Database', 'Storage'];
      
      if (result.status === 'rejected') {
        this.recordError({
          timestamp: new Date(),
          level: 'error',
          message: `Health check failed: ${checkNames[index]}`,
          component: 'health-check',
          environment: process.env.NODE_ENV || 'production',
          metadata: { check: checkNames[index] }
        });
      }
    });
  }

  // Helper methods for metric collection
  private recordAPMMetric(metric: APMMetric): void {
    this.metricsBuffer.push(metric);
  }

  private recordError(error: ErrorLog): void {
    this.errorBuffer.push(error);
    console.error(`[${error.level.toUpperCase()}] ${error.component}: ${error.message}`);
  }

  private recordBusinessMetric(metric: BusinessMetric): void {
    this.businessBuffer.push(metric);
  }

  private async flushAPMMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;
    
    try {
      const batch = this.db.batch();
      
      for (const metric of this.metricsBuffer) {
        const ref = this.db.collection('apm_metrics').doc();
        batch.set(ref, {
          ...metric,
          timestamp: Timestamp.fromDate(metric.timestamp)
        });
      }
      
      await batch.commit();
      this.metricsBuffer = [];
      
    } catch (error) {
      console.error('Failed to flush APM metrics:', error);
    }
  }

  private async flushErrorLogs(): Promise<void> {
    if (this.errorBuffer.length === 0) return;
    
    try {
      const batch = this.db.batch();
      
      for (const error of this.errorBuffer) {
        const ref = this.db.collection('error_logs').doc();
        batch.set(ref, {
          ...error,
          timestamp: Timestamp.fromDate(error.timestamp)
        });
      }
      
      await batch.commit();
      this.errorBuffer = [];
      
    } catch (error) {
      console.error('Failed to flush error logs:', error);
    }
  }

  private async flushBusinessMetrics(): Promise<void> {
    if (this.businessBuffer.length === 0) return;
    
    try {
      const batch = this.db.batch();
      
      for (const metric of this.businessBuffer) {
        const ref = this.db.collection('business_metrics').doc();
        batch.set(ref, {
          ...metric,
          timestamp: Timestamp.fromDate(metric.timestamp)
        });
      }
      
      await batch.commit();
      this.businessBuffer = [];
      
    } catch (error) {
      console.error('Failed to flush business metrics:', error);
    }
  }

  // Initialize default alert rules
  private initializeAlertRules(): void {
    this.alertRules = [
      {
        name: 'High Response Time',
        condition: 'response_time_high',
        threshold: 3000, // 3 seconds
        duration: 300000, // 5 minutes
        severity: 'high',
        channels: ['slack', 'email'],
        enabled: true
      },
      {
        name: 'High Error Rate',
        condition: 'error_rate_high',
        threshold: 5, // 5%
        duration: 600000, // 10 minutes
        severity: 'critical',
        channels: ['slack', 'email', 'pagerduty'],
        enabled: true
      },
      {
        name: 'Low Active Users',
        condition: 'active_users_low',
        threshold: 10,
        duration: 1800000, // 30 minutes
        severity: 'medium',
        channels: ['slack'],
        enabled: true
      },
      {
        name: 'Poor Core Web Vitals',
        condition: 'core_web_vitals_poor',
        threshold: 2500, // LCP > 2.5s
        duration: 600000, // 10 minutes
        severity: 'high',
        channels: ['slack', 'email'],
        enabled: true
      }
    ];
  }

  // Placeholder implementations for metric getters
  private async getAverageResponseTime(duration: number): Promise<number> {
    // Implementation would query APM metrics
    return 1500; // Placeholder
  }

  private async getErrorRate(duration: number): Promise<number> {
    // Implementation would calculate error rate from metrics
    return 2; // Placeholder
  }

  private async getActiveUsers(duration: number): Promise<number> {
    // Implementation would query user sessions
    return 25; // Placeholder
  }

  private async getCoreWebVitals(): Promise<{ lcp: number; fid: number; cls: number }> {
    // Implementation would query real user monitoring data
    return { lcp: 2100, fid: 80, cls: 0.05 };
  }

  private async collectLighthouseMetrics(): Promise<void> {
    // Implementation would run Lighthouse programmatically
  }

  private async checkFunctionHealth(functionName: string): Promise<void> {
    // Implementation would check function execution metrics
  }

  private async checkFirebaseQuotas(): Promise<void> {
    // Implementation would check Firebase quota usage
  }

  private async checkFirebaseConnection(): Promise<void> {
    await this.db.collection('_health').limit(1).get();
  }

  private async checkNextJSHealth(): Promise<void> {
    const response = await fetch(`${process.env.BASE_URL}/api/health`);
    if (!response.ok) throw new Error('Next.js health check failed');
  }

  private async checkDatabaseHealth(): Promise<void> {
    await this.db.runTransaction(async (t) => {
      const doc = await t.get(this.db.collection('_health').doc('test'));
      return doc.exists;
    });
  }

  private async checkStorageHealth(): Promise<void> {
    // Implementation would check Firebase Storage health
  }

  private async sendEmailAlert(alert: any): Promise<void> {
    // Implementation would send email via SendGrid/SES
  }

  private async sendSMSAlert(alert: any): Promise<void> {
    // Implementation would send SMS via Twilio
  }

  private async sendPagerDutyAlert(alert: any): Promise<void> {
    // Implementation would trigger PagerDuty incident
  }

  private setupGracefulShutdown(): void {
    process.on('SIGTERM', async () => {
      console.log('📊 Shutting down monitoring system...');
      this.isMonitoring = false;
      
      // Flush remaining metrics
      await Promise.all([
        this.flushAPMMetrics(),
        this.flushErrorLogs(),
        this.flushBusinessMetrics()
      ]);
      
      console.log('✅ Monitoring system shutdown complete');
      process.exit(0);
    });
  }
}

// CLI Interface
if (require.main === module) {
  const monitoring = new ProductionMonitoringSystem();
  
  monitoring.startMonitoring()
    .then(() => {
      console.log('🎉 Production monitoring system is running!');
    })
    .catch(error => {
      console.error('💥 Failed to start monitoring:', error);
      process.exit(1);
    });
}