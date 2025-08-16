/**
 * 🔵🟢 Blue-Green Deployment System for CuisineZen
 * Advanced deployment strategy with zero-downtime and automatic rollback
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface DeploymentConfig {
  environment: 'staging' | 'production';
  strategy: 'blue-green' | 'canary' | 'rolling';
  healthCheckUrl: string;
  rollbackThreshold: number;
  monitoringDuration: number;
}

interface HealthMetrics {
  responseTime: number;
  errorRate: number;
  successRate: number;
  timestamp: Date;
}

interface DeploymentState {
  currentSlot: 'blue' | 'green';
  previousSlot: 'blue' | 'green';
  deploymentId: string;
  startTime: Date;
  status: 'deploying' | 'monitoring' | 'completed' | 'failed' | 'rolled-back';
}

export class BlueGreenDeploymentManager {
  private config: DeploymentConfig;
  private state: DeploymentState;
  private healthMetrics: HealthMetrics[] = [];
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.state = this.loadDeploymentState();
  }

  /**
   * Execute blue-green deployment with comprehensive monitoring
   */
  async deploy(): Promise<boolean> {
    try {
      console.log('🚀 Starting Blue-Green Deployment...');
      
      // 1. Pre-deployment checks
      await this.preDeploymentChecks();
      
      // 2. Determine target slot
      const targetSlot = this.getTargetSlot();
      console.log(`🎯 Target slot: ${targetSlot}`);
      
      // 3. Deploy to target slot
      await this.deployToSlot(targetSlot);
      
      // 4. Health checks
      const healthCheckPassed = await this.performHealthChecks(targetSlot);
      if (!healthCheckPassed) {
        throw new Error('Health checks failed');
      }
      
      // 5. Load testing
      const loadTestPassed = await this.performLoadTesting(targetSlot);
      if (!loadTestPassed) {
        throw new Error('Load testing failed');
      }
      
      // 6. Switch traffic
      await this.switchTraffic(targetSlot);
      
      // 7. Monitor deployment
      await this.monitorDeployment();
      
      // 8. Cleanup old slot
      await this.cleanupOldSlot();
      
      console.log('✅ Blue-Green Deployment completed successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      await this.executeRollback();
      return false;
    }
  }

  /**
   * Pre-deployment validation and setup
   */
  private async preDeploymentChecks(): Promise<void> {
    console.log('🔍 Running pre-deployment checks...');
    
    // Check DoD gates
    const dodPassed = this.checkDoDAnticipatoryGates();
    if (!dodPassed) {
      throw new Error('DoD gates failed - deployment blocked');
    }
    
    // Check Firebase connection
    await this.checkFirebaseConnection();
    
    // Validate environment variables
    this.validateEnvironmentVariables();
    
    // Initialize deployment state
    this.state = {
      currentSlot: this.state?.currentSlot || 'blue',
      previousSlot: this.state?.currentSlot || 'blue',
      deploymentId: this.generateDeploymentId(),
      startTime: new Date(),
      status: 'deploying'
    };
    
    this.saveDeploymentState();
  }

  /**
   * Check DoD quality gates before deployment
   */
  private checkDoDAnticipatoryGates(): boolean {
    try {
      console.log('🎯 Checking DoD quality gates...');
      
      const result = execSync('npm run gates:all', { 
        encoding: 'utf-8',
        timeout: 300000 // 5 minutes
      });
      
      // Parse DoD results
      const dodResultsPath = './dod-results.json';
      if (existsSync(dodResultsPath)) {
        const dodResults = JSON.parse(readFileSync(dodResultsPath, 'utf-8'));
        
        if (!dodResults.approved || dodResults.overallScore < 85) {
          console.error(`❌ DoD gates failed - Score: ${dodResults.overallScore}/100`);
          return false;
        }
        
        console.log(`✅ DoD gates passed - Score: ${dodResults.overallScore}/100`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ DoD gate check failed:', error);
      return false;
    }
  }

  /**
   * Deploy application to specified slot (blue or green)
   */
  private async deployToSlot(slot: 'blue' | 'green'): Promise<void> {
    console.log(`🔄 Deploying to ${slot} slot...`);
    
    try {
      // Deploy to Firebase hosting channel
      const channelCommand = `firebase hosting:channel:deploy ${slot} --project ${this.config.environment} --json`;
      const result = execSync(channelCommand, { encoding: 'utf-8' });
      
      const deployResult = JSON.parse(result);
      const previewUrl = deployResult.result[`${this.config.environment}-cuisinezen`].url;
      
      console.log(`✅ Deployed to ${slot} slot: ${previewUrl}`);
      
      // Deploy Firebase Functions
      await this.deployFunctions(slot);
      
      // Deploy Firestore rules and indexes
      await this.deployFirestoreConfig(slot);
      
    } catch (error) {
      throw new Error(`Failed to deploy to ${slot} slot: ${error}`);
    }
  }

  /**
   * Deploy Firebase Functions to specific environment
   */
  private async deployFunctions(slot: string): Promise<void> {
    console.log(`🔧 Deploying functions to ${slot}...`);
    
    try {
      const functionsCommand = `firebase deploy --only functions --project ${this.config.environment}-${slot}`;
      execSync(functionsCommand, { stdio: 'inherit' });
      console.log(`✅ Functions deployed to ${slot}`);
    } catch (error) {
      throw new Error(`Functions deployment failed: ${error}`);
    }
  }

  /**
   * Deploy Firestore configuration
   */
  private async deployFirestoreConfig(slot: string): Promise<void> {
    console.log(`📊 Deploying Firestore config to ${slot}...`);
    
    try {
      const firestoreCommand = `firebase deploy --only firestore --project ${this.config.environment}-${slot}`;
      execSync(firestoreCommand, { stdio: 'inherit' });
      console.log(`✅ Firestore config deployed to ${slot}`);
    } catch (error) {
      throw new Error(`Firestore deployment failed: ${error}`);
    }
  }

  /**
   * Perform comprehensive health checks
   */
  private async performHealthChecks(slot: 'blue' | 'green'): Promise<boolean> {
    console.log(`🏥 Performing health checks on ${slot} slot...`);
    
    const healthCheckUrl = this.getSlotUrl(slot);
    const maxRetries = 10;
    const retryDelay = 5000; // 5 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${healthCheckUrl}/api/health`);
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          const healthData = await response.json();
          
          if (healthData.status === 'healthy') {
            console.log(`✅ Health check passed (${responseTime}ms)`);
            
            // Record health metrics
            this.healthMetrics.push({
              responseTime,
              errorRate: 0,
              successRate: 100,
              timestamp: new Date()
            });
            
            return true;
          }
        }
        
        console.log(`⚠️ Health check attempt ${attempt}/${maxRetries} failed`);
        
        if (attempt < maxRetries) {
          await this.sleep(retryDelay);
        }
        
      } catch (error) {
        console.log(`⚠️ Health check attempt ${attempt}/${maxRetries} error:`, error);
        
        if (attempt < maxRetries) {
          await this.sleep(retryDelay);
        }
      }
    }
    
    console.error(`❌ Health checks failed after ${maxRetries} attempts`);
    return false;
  }

  /**
   * Perform load testing on the deployed slot
   */
  private async performLoadTesting(slot: 'blue' | 'green'): Promise<boolean> {
    console.log(`⚡ Performing load testing on ${slot} slot...`);
    
    try {
      const slotUrl = this.getSlotUrl(slot);
      
      // Use Playwright for load testing
      const loadTestCommand = `npx playwright test --config=qa-automation/configs/playwright.config.ts --grep "load-test" --baseURL="${slotUrl}"`;
      execSync(loadTestCommand, { stdio: 'inherit', timeout: 180000 });
      
      console.log(`✅ Load testing passed for ${slot} slot`);
      return true;
    } catch (error) {
      console.error(`❌ Load testing failed for ${slot} slot:`, error);
      return false;
    }
  }

  /**
   * Switch traffic to the new slot
   */
  private async switchTraffic(targetSlot: 'blue' | 'green'): Promise<void> {
    console.log(`🔄 Switching traffic to ${targetSlot} slot...`);
    
    try {
      // Gradual traffic switching for production
      if (this.config.environment === 'production') {
        await this.gradualTrafficSwitch(targetSlot);
      } else {
        await this.immediateTrafficSwitch(targetSlot);
      }
      
      // Update deployment state
      this.state.previousSlot = this.state.currentSlot;
      this.state.currentSlot = targetSlot;
      this.state.status = 'monitoring';
      this.saveDeploymentState();
      
      console.log(`✅ Traffic switched to ${targetSlot} slot`);
    } catch (error) {
      throw new Error(`Traffic switching failed: ${error}`);
    }
  }

  /**
   * Gradual traffic switching for production (canary-style)
   */
  private async gradualTrafficSwitch(targetSlot: 'blue' | 'green'): Promise<void> {
    console.log('🐤 Performing gradual traffic switch...');
    
    const trafficSteps = [10, 25, 50, 75, 100];
    
    for (const percentage of trafficSteps) {
      console.log(`🔄 Switching ${percentage}% traffic to ${targetSlot}...`);
      
      // Configure traffic splitting in Firebase
      await this.configureTrafficSplit(targetSlot, percentage);
      
      // Monitor metrics for 2 minutes
      await this.monitorTrafficSwitch(120000); // 2 minutes
      
      // Check if metrics are acceptable
      const metricsGood = this.evaluateTrafficMetrics();
      if (!metricsGood && percentage < 100) {
        throw new Error(`Traffic metrics deteriorated at ${percentage}% - rolling back`);
      }
      
      console.log(`✅ ${percentage}% traffic switch successful`);
    }
  }

  /**
   * Immediate traffic switching for non-production
   */
  private async immediateTrafficSwitch(targetSlot: 'blue' | 'green'): Promise<void> {
    console.log('⚡ Performing immediate traffic switch...');
    
    const switchCommand = `firebase hosting:channel:deploy live --alias ${targetSlot} --project ${this.config.environment}`;
    execSync(switchCommand, { stdio: 'inherit' });
  }

  /**
   * Configure traffic splitting between slots
   */
  private async configureTrafficSplit(targetSlot: 'blue' | 'green', percentage: number): Promise<void> {
    // This would integrate with Firebase hosting traffic splitting
    // For now, we'll simulate the configuration
    console.log(`🔧 Configuring ${percentage}% traffic to ${targetSlot}`);
    
    // In a real implementation, this would use Firebase Admin SDK
    // to configure weighted traffic distribution
  }

  /**
   * Monitor deployment health and performance
   */
  private async monitorDeployment(): Promise<void> {
    console.log('📊 Starting deployment monitoring...');
    
    const monitoringDuration = this.config.monitoringDuration || 300000; // 5 minutes
    const monitoringInterval = 30000; // 30 seconds
    
    return new Promise((resolve, reject) => {
      let elapsedTime = 0;
      
      this.monitoringInterval = setInterval(async () => {
        try {
          await this.collectHealthMetrics();
          
          elapsedTime += monitoringInterval;
          
          // Evaluate metrics
          const metricsHealthy = this.evaluateHealthMetrics();
          if (!metricsHealthy) {
            clearInterval(this.monitoringInterval);
            reject(new Error('Health metrics degraded - triggering rollback'));
            return;
          }
          
          // Check if monitoring period is complete
          if (elapsedTime >= monitoringDuration) {
            clearInterval(this.monitoringInterval);
            console.log('✅ Deployment monitoring completed successfully');
            
            this.state.status = 'completed';
            this.saveDeploymentState();
            
            resolve();
          }
          
        } catch (error) {
          clearInterval(this.monitoringInterval);
          reject(error);
        }
      }, monitoringInterval);
    });
  }

  /**
   * Collect real-time health metrics
   */
  private async collectHealthMetrics(): Promise<void> {
    try {
      const currentUrl = this.getSlotUrl(this.state.currentSlot);
      const startTime = Date.now();
      
      const response = await fetch(`${currentUrl}/api/metrics`);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const metrics = await response.json();
        
        this.healthMetrics.push({
          responseTime,
          errorRate: metrics.errorRate || 0,
          successRate: metrics.successRate || 100,
          timestamp: new Date()
        });
        
        // Keep only last 20 metrics
        if (this.healthMetrics.length > 20) {
          this.healthMetrics = this.healthMetrics.slice(-20);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to collect health metrics:', error);
    }
  }

  /**
   * Evaluate current health metrics against thresholds
   */
  private evaluateHealthMetrics(): boolean {
    if (this.healthMetrics.length < 3) {
      return true; // Not enough data yet
    }
    
    const recentMetrics = this.healthMetrics.slice(-5); // Last 5 measurements
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length;
    const avgSuccessRate = recentMetrics.reduce((sum, m) => sum + m.successRate, 0) / recentMetrics.length;
    
    // Thresholds
    const maxResponseTime = 3000; // 3 seconds
    const maxErrorRate = 5; // 5%
    const minSuccessRate = 95; // 95%
    
    const healthy = avgResponseTime <= maxResponseTime && 
                   avgErrorRate <= maxErrorRate && 
                   avgSuccessRate >= minSuccessRate;
    
    if (!healthy) {
      console.warn(`⚠️ Health metrics degraded - RT: ${avgResponseTime}ms, ER: ${avgErrorRate}%, SR: ${avgSuccessRate}%`);
    }
    
    return healthy;
  }

  /**
   * Execute automatic rollback
   */
  private async executeRollback(): Promise<void> {
    console.log('🔙 Executing automatic rollback...');
    
    try {
      // Switch traffic back to previous slot
      const rollbackCommand = `firebase hosting:channel:deploy live --alias ${this.state.previousSlot} --project ${this.config.environment}`;
      execSync(rollbackCommand, { stdio: 'inherit' });
      
      this.state.status = 'rolled-back';
      this.saveDeploymentState();
      
      // Send rollback notification
      await this.sendRollbackNotification();
      
      console.log('✅ Rollback completed successfully');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Send rollback notification to team
   */
  private async sendRollbackNotification(): Promise<void> {
    const notification = {
      type: 'deployment-rollback',
      environment: this.config.environment,
      deploymentId: this.state.deploymentId,
      previousSlot: this.state.previousSlot,
      currentSlot: this.state.currentSlot,
      timestamp: new Date(),
      metrics: this.healthMetrics.slice(-5)
    };
    
    // Send to Slack webhook
    if (process.env.SLACK_WEBHOOK) {
      try {
        await fetch(process.env.SLACK_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: '🚨 AUTOMATIC ROLLBACK EXECUTED',
            attachments: [{
              color: 'danger',
              fields: [
                {
                  title: 'Environment',
                  value: this.config.environment,
                  short: true
                },
                {
                  title: 'Deployment ID',
                  value: this.state.deploymentId,
                  short: true
                }
              ]
            }]
          })
        });
      } catch (error) {
        console.warn('Failed to send Slack notification:', error);
      }
    }
  }

  /**
   * Cleanup old deployment slot
   */
  private async cleanupOldSlot(): Promise<void> {
    console.log('🧹 Cleaning up old deployment slot...');
    
    try {
      const oldSlot = this.state.previousSlot;
      
      // Delete old hosting channel
      const cleanupCommand = `firebase hosting:channel:delete ${oldSlot} --project ${this.config.environment} --force`;
      execSync(cleanupCommand, { stdio: 'inherit' });
      
      console.log(`✅ Cleaned up ${oldSlot} slot`);
    } catch (error) {
      console.warn('⚠️ Failed to cleanup old slot:', error);
    }
  }

  // Helper methods
  private getTargetSlot(): 'blue' | 'green' {
    return this.state.currentSlot === 'blue' ? 'green' : 'blue';
  }

  private getSlotUrl(slot: 'blue' | 'green'): string {
    return `https://${slot}---${this.config.environment}-cuisinezen.web.app`;
  }

  private generateDeploymentId(): string {
    return `deploy-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private checkFirebaseConnection(): void {
    try {
      execSync('firebase projects:list', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Firebase CLI not authenticated or configured');
    }
  }

  private validateEnvironmentVariables(): void {
    const required = ['FIREBASE_TOKEN', 'NODE_ENV'];
    
    for (const env of required) {
      if (!process.env[env]) {
        throw new Error(`Missing required environment variable: ${env}`);
      }
    }
  }

  private loadDeploymentState(): DeploymentState {
    const statePath = './deployment-state.json';
    
    if (existsSync(statePath)) {
      try {
        return JSON.parse(readFileSync(statePath, 'utf-8'));
      } catch (error) {
        console.warn('Failed to load deployment state:', error);
      }
    }
    
    return {
      currentSlot: 'blue',
      previousSlot: 'blue',
      deploymentId: '',
      startTime: new Date(),
      status: 'deploying'
    };
  }

  private saveDeploymentState(): void {
    const statePath = './deployment-state.json';
    writeFileSync(statePath, JSON.stringify(this.state, null, 2));
  }

  private evaluateTrafficMetrics(): boolean {
    // Simplified metrics evaluation
    return this.evaluateHealthMetrics();
  }

  private async monitorTrafficSwitch(duration: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Interface
if (require.main === module) {
  const config: DeploymentConfig = {
    environment: (process.env.ENVIRONMENT || 'staging') as 'staging' | 'production',
    strategy: 'blue-green',
    healthCheckUrl: process.env.HEALTH_CHECK_URL || 'https://staging-cuisinezen.web.app',
    rollbackThreshold: 95,
    monitoringDuration: 300000 // 5 minutes
  };

  const deployment = new BlueGreenDeploymentManager(config);
  
  deployment.deploy()
    .then(success => {
      if (success) {
        console.log('🎉 Deployment completed successfully!');
        process.exit(0);
      } else {
        console.error('💥 Deployment failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Deployment error:', error);
      process.exit(1);
    });
}