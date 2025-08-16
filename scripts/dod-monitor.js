#!/usr/bin/env node

/**
 * 🔍 DoD Monitor - Surveillance continue de la qualité
 * 
 * Ce script surveille en continu la qualité du code et déclenche
 * des alertes en cas de dégradation des métriques DoD.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const WebSocket = require('ws');

class DoDAnticipatoryMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
    this.thresholds = this.loadThresholds();
    this.watchers = new Map();
    this.isRunning = false;
    this.wsClients = new Set();
    
    this.setupWebSocketServer();
  }

  loadThresholds() {
    try {
      const configPath = path.join(process.cwd(), 'dod.config.js');
      if (fs.existsSync(configPath)) {
        const config = require(configPath);
        return config.thresholds;
      }
    } catch (error) {
      console.warn('⚠️ Configuration DoD non trouvée, utilisation des valeurs par défaut');
    }

    return {
      coverage: { global: 85 },
      performance: { lighthouse: { performance: 90 } },
      security: { vulnerabilities: { critical: 0, high: 0 } }
    };
  }

  setupWebSocketServer() {
    this.wss = new WebSocket.Server({ port: 8080 });
    
    this.wss.on('connection', (ws) => {
      this.wsClients.add(ws);
      console.log('📡 Client connecté au monitoring DoD');
      
      // Envoyer les métriques actuelles
      ws.send(JSON.stringify({
        type: 'metrics',
        data: this.getCurrentMetrics()
      }));
      
      ws.on('close', () => {
        this.wsClients.delete(ws);
      });
    });
    
    console.log('🚀 Serveur WebSocket DoD démarré sur le port 8080');
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Monitor DoD déjà en cours d\'exécution');
      return;
    }

    this.isRunning = true;
    console.log('🎯 Démarrage du monitor DoD...');

    // Surveillance des fichiers
    this.startFileWatching();
    
    // Métriques périodiques
    this.startPeriodicMonitoring();
    
    // Surveillance Git
    this.startGitMonitoring();
    
    // Surveillance des performances
    this.startPerformanceMonitoring();

    console.log('✅ Monitor DoD démarré avec succès');
    
    // Métriques initiales
    await this.collectAllMetrics();
  }

  stop() {
    if (!this.isRunning) return;
    
    console.log('🛑 Arrêt du monitor DoD...');
    this.isRunning = false;
    
    // Arrêter tous les watchers
    this.watchers.forEach(watcher => watcher.close());
    this.watchers.clear();
    
    // Fermer le serveur WebSocket
    this.wss.close();
    
    console.log('✅ Monitor DoD arrêté');
  }

  startFileWatching() {
    const chokidar = require('chokidar');
    
    const watcher = chokidar.watch([
      'src/**/*.{ts,tsx,js,jsx}',
      'tests/**/*.{ts,tsx,js,jsx}',
      'package.json',
      'package-lock.json'
    ], {
      ignored: /node_modules/,
      persistent: true
    });

    watcher.on('change', async (filePath) => {
      console.log(`📝 Fichier modifié: ${filePath}`);
      
      if (filePath.includes('.test.') || filePath.includes('.spec.')) {
        await this.onTestFileChanged(filePath);
      } else if (filePath.includes('package')) {
        await this.onDependencyChanged();
      } else {
        await this.onSourceFileChanged(filePath);
      }
    });

    this.watchers.set('files', watcher);
  }

  startPeriodicMonitoring() {
    // Collecte des métriques toutes les 5 minutes
    const interval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }
      
      await this.collectAllMetrics();
    }, 5 * 60 * 1000);

    this.watchers.set('periodic', { close: () => clearInterval(interval) });
  }

  startGitMonitoring() {
    // Surveillance des commits
    const interval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }
      
      await this.checkGitChanges();
    }, 30 * 1000); // Toutes les 30 secondes

    this.watchers.set('git', { close: () => clearInterval(interval) });
  }

  startPerformanceMonitoring() {
    // Surveillance de l'usage système
    const interval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }
      
      this.checkSystemPerformance();
    }, 60 * 1000); // Toutes les minutes

    this.watchers.set('performance', { close: () => clearInterval(interval) });
  }

  async onSourceFileChanged(filePath) {
    console.log(`🔍 Analyse du fichier modifié: ${filePath}`);
    
    try {
      // Tests rapides sur le fichier modifié
      await this.runQuickAnalysis(filePath);
      
      // Vérification TypeScript
      await this.checkTypeScript();
      
      this.broadcast({
        type: 'file-changed',
        data: { filePath, timestamp: new Date().toISOString() }
      });
      
    } catch (error) {
      this.createAlert('error', `Erreur lors de l'analyse de ${filePath}: ${error.message}`);
    }
  }

  async onTestFileChanged(filePath) {
    console.log(`🧪 Fichier de test modifié: ${filePath}`);
    
    try {
      // Exécuter les tests du fichier modifié
      const result = await this.runSpecificTests(filePath);
      
      this.broadcast({
        type: 'test-changed',
        data: { filePath, result, timestamp: new Date().toISOString() }
      });
      
    } catch (error) {
      this.createAlert('warning', `Tests en échec dans ${filePath}: ${error.message}`);
    }
  }

  async onDependencyChanged() {
    console.log('📦 Dépendances modifiées, vérification de sécurité...');
    
    try {
      await this.checkSecurityVulnerabilities();
      await this.checkOutdatedDependencies();
      
      this.broadcast({
        type: 'dependencies-changed',
        data: { timestamp: new Date().toISOString() }
      });
      
    } catch (error) {
      this.createAlert('critical', `Problème de sécurité détecté: ${error.message}`);
    }
  }

  async collectAllMetrics() {
    console.log('📊 Collecte des métriques DoD...');
    
    const metrics = {
      timestamp: new Date().toISOString(),
      coverage: await this.getCoverageMetrics(),
      performance: await this.getPerformanceMetrics(),
      security: await this.getSecurityMetrics(),
      quality: await this.getQualityMetrics(),
      build: await this.getBuildMetrics()
    };

    this.metrics.set('current', metrics);
    this.analyzeMetrics(metrics);
    
    this.broadcast({
      type: 'metrics-updated',
      data: metrics
    });

    return metrics;
  }

  async getCoverageMetrics() {
    try {
      console.log('🧪 Calcul de la couverture de tests...');
      
      const output = execSync('npm run test:coverage -- --silent --passWithNoTests', {
        encoding: 'utf8',
        timeout: 60000
      });

      const coverage = this.parseCoverageOutput(output);
      
      if (coverage.global < this.thresholds.coverage.global) {
        this.createAlert('warning', 
          `Couverture de tests: ${coverage.global}% (objectif: ${this.thresholds.coverage.global}%)`
        );
      }

      return coverage;
    } catch (error) {
      this.createAlert('error', `Échec du calcul de couverture: ${error.message}`);
      return { global: 0, error: error.message };
    }
  }

  async getPerformanceMetrics() {
    try {
      console.log('⚡ Analyse des performances...');
      
      // Vérifier la taille du bundle
      const bundleSize = await this.getBundleSize();
      
      // Performance Lighthouse (si disponible)
      let lighthouse = null;
      try {
        lighthouse = await this.runLighthouse();
      } catch (error) {
        console.warn('⚠️ Lighthouse non disponible:', error.message);
      }

      const metrics = {
        bundleSize,
        lighthouse,
        buildTime: await this.measureBuildTime()
      };

      // Alertes performance
      if (bundleSize > 1024 * 1024) { // 1MB
        this.createAlert('warning', `Taille du bundle: ${(bundleSize / 1024 / 1024).toFixed(2)}MB (>1MB)`);
      }

      return metrics;
    } catch (error) {
      return { error: error.message };
    }
  }

  async getSecurityMetrics() {
    try {
      console.log('🔒 Audit de sécurité...');
      
      const auditOutput = execSync('npm audit --json', {
        encoding: 'utf8',
        timeout: 30000
      });

      const audit = JSON.parse(auditOutput);
      const vulnerabilities = audit.metadata.vulnerabilities;

      // Alertes sécurité
      if (vulnerabilities.critical > 0) {
        this.createAlert('critical', `${vulnerabilities.critical} vulnérabilité(s) critique(s) détectée(s)`);
      }
      if (vulnerabilities.high > 0) {
        this.createAlert('warning', `${vulnerabilities.high} vulnérabilité(s) haute(s) détectée(s)`);
      }

      return {
        vulnerabilities,
        total: vulnerabilities.total,
        lastAudit: new Date().toISOString()
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getQualityMetrics() {
    try {
      console.log('📊 Analyse de la qualité du code...');
      
      // Exécuter l'agent IA si disponible
      let aiAnalysis = null;
      try {
        const { DoDAIAgent } = require('./dod-agent');
        const agent = new DoDAIAgent();
        aiAnalysis = await agent.analyzeProject();
      } catch (error) {
        console.warn('⚠️ Agent IA non disponible:', error.message);
      }

      // Métriques de base
      const metrics = {
        aiAnalysis,
        linting: await this.runLinting(),
        typeCheck: await this.runTypeCheck(),
        complexity: await this.analyzeComplexity()
      };

      return metrics;
    } catch (error) {
      return { error: error.message };
    }
  }

  async getBuildMetrics() {
    try {
      console.log('🏗️ Métriques de build...');
      
      const startTime = Date.now();
      
      execSync('npm run build', {
        encoding: 'utf8',
        timeout: 300000 // 5 minutes max
      });
      
      const buildTime = Date.now() - startTime;
      
      if (buildTime > 180000) { // 3 minutes
        this.createAlert('warning', `Build lent: ${(buildTime / 1000).toFixed(1)}s (>3min)`);
      }

      return {
        duration: buildTime,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.createAlert('critical', `Échec du build: ${error.message}`);
      return {
        duration: 0,
        success: false,
        error: error.message
      };
    }
  }

  analyzeMetrics(metrics) {
    // Analyse des tendances
    const previous = this.metrics.get('previous');
    if (previous) {
      this.analyzeTrends(previous, metrics);
    }
    
    this.metrics.set('previous', metrics);
    
    // Calcul du score global
    const score = this.calculateOverallScore(metrics);
    metrics.overallScore = score;
    
    if (score < 70) {
      this.createAlert('critical', `Score DoD critique: ${score}/100`);
    } else if (score < 80) {
      this.createAlert('warning', `Score DoD en baisse: ${score}/100`);
    }
  }

  analyzeTrends(previous, current) {
    const trends = {};
    
    // Tendance de couverture
    if (previous.coverage && current.coverage) {
      const diff = current.coverage.global - previous.coverage.global;
      trends.coverage = {
        direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
        change: diff
      };
      
      if (diff < -5) {
        this.createAlert('warning', `Couverture en baisse: -${Math.abs(diff).toFixed(1)}%`);
      }
    }
    
    // Tendance de performance
    if (previous.performance && current.performance) {
      const prevSize = previous.performance.bundleSize || 0;
      const currSize = current.performance.bundleSize || 0;
      const diff = currSize - prevSize;
      
      if (diff > 50000) { // 50KB d'augmentation
        this.createAlert('warning', `Taille du bundle en augmentation: +${(diff / 1024).toFixed(1)}KB`);
      }
    }
    
    current.trends = trends;
  }

  calculateOverallScore(metrics) {
    let score = 100;
    let factors = 0;
    
    // Couverture (30%)
    if (metrics.coverage && typeof metrics.coverage.global === 'number') {
      score += (metrics.coverage.global - 85) * 0.3;
      factors++;
    }
    
    // Sécurité (25%)
    if (metrics.security && metrics.security.vulnerabilities) {
      const vuln = metrics.security.vulnerabilities;
      const securityScore = Math.max(0, 100 - (vuln.critical * 50 + vuln.high * 20 + vuln.medium * 5));
      score += (securityScore - 100) * 0.25;
      factors++;
    }
    
    // Performance (25%)
    if (metrics.performance && metrics.performance.bundleSize) {
      const sizeScore = Math.max(0, 100 - Math.max(0, (metrics.performance.bundleSize - 1024 * 1024) / 10240));
      score += (sizeScore - 100) * 0.25;
      factors++;
    }
    
    // Build (20%)
    if (metrics.build) {
      const buildScore = metrics.build.success ? 100 : 0;
      score += (buildScore - 100) * 0.2;
      factors++;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  createAlert(level, message) {
    const alert = {
      id: Date.now().toString(),
      level,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };
    
    this.alerts.unshift(alert);
    
    // Garder seulement les 100 dernières alertes
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }
    
    console.log(`🚨 [${level.toUpperCase()}] ${message}`);
    
    this.broadcast({
      type: 'alert',
      data: alert
    });
    
    // Notifications externes
    this.sendNotification(alert);
  }

  async sendNotification(alert) {
    if (alert.level === 'critical') {
      // Slack, email, etc.
      try {
        if (process.env.SLACK_DOD_WEBHOOK) {
          await this.sendSlackNotification(alert);
        }
      } catch (error) {
        console.error('Erreur notification:', error.message);
      }
    }
  }

  async sendSlackNotification(alert) {
    const webhook = process.env.SLACK_DOD_WEBHOOK;
    const payload = {
      text: `🚨 *Alerte DoD ${alert.level.toUpperCase()}*`,
      attachments: [{
        color: alert.level === 'critical' ? 'danger' : 'warning',
        fields: [{
          title: 'Message',
          value: alert.message,
          short: false
        }, {
          title: 'Timestamp',
          value: alert.timestamp,
          short: true
        }]
      }]
    };
    
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Erreur Slack: ${response.status}`);
    }
  }

  getCurrentMetrics() {
    return this.metrics.get('current') || {};
  }

  getAlerts(limit = 50) {
    return this.alerts.slice(0, limit);
  }

  // Méthodes utilitaires
  parseCoverageOutput(output) {
    const match = output.match(/All files[^|]*\|\s*(\d+\.?\d*)/);
    return { global: match ? parseFloat(match[1]) : 0 };
  }

  async getBundleSize() {
    try {
      const stats = fs.statSync('.next');
      return stats.size;
    } catch {
      return 0;
    }
  }

  async measureBuildTime() {
    const start = Date.now();
    try {
      execSync('npm run build', { stdio: 'ignore', timeout: 300000 });
      return Date.now() - start;
    } catch {
      return -1;
    }
  }

  async runQuickAnalysis(filePath) {
    // Analyse rapide du fichier
    execSync(`npx eslint "${filePath}"`, { stdio: 'ignore' });
  }

  async checkTypeScript() {
    execSync('npx tsc --noEmit', { stdio: 'ignore' });
  }

  async runSpecificTests(filePath) {
    const output = execSync(`npm test -- "${filePath}" --passWithNoTests`, {
      encoding: 'utf8'
    });
    return { success: true, output };
  }

  async checkSecurityVulnerabilities() {
    const output = execSync('npm audit --json', { encoding: 'utf8' });
    return JSON.parse(output);
  }

  async checkOutdatedDependencies() {
    const output = execSync('npm outdated --json', { encoding: 'utf8' });
    return JSON.parse(output);
  }

  async checkGitChanges() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        // Des fichiers ont été modifiés
        this.broadcast({
          type: 'git-changes',
          data: { hasChanges: true, files: status.trim().split('\n').length }
        });
      }
    } catch (error) {
      // Ignore les erreurs Git
    }
  }

  checkSystemPerformance() {
    const usage = process.memoryUsage();
    const metrics = {
      memory: {
        used: usage.heapUsed,
        total: usage.heapTotal,
        percentage: (usage.heapUsed / usage.heapTotal) * 100
      },
      uptime: process.uptime()
    };
    
    this.broadcast({
      type: 'system-performance',
      data: metrics
    });
  }

  async runLinting() {
    try {
      execSync('npm run lint', { stdio: 'ignore' });
      return { success: true, errors: 0 };
    } catch (error) {
      return { success: false, errors: 1 };
    }
  }

  async runTypeCheck() {
    try {
      execSync('npm run typecheck', { stdio: 'ignore' });
      return { success: true, errors: 0 };
    } catch (error) {
      return { success: false, errors: 1 };
    }
  }

  async analyzeComplexity() {
    // Analyse simplifiée de complexité
    return { averageComplexity: 5, maxComplexity: 15 };
  }

  async runLighthouse() {
    // Lighthouse si serveur disponible
    return null;
  }
}

// CLI
if (require.main === module) {
  const monitor = new DoDAnticipatoryMonitor();
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du monitor DoD...');
    monitor.stop();
    process.exit(0);
  });
  
  monitor.start().catch(console.error);
}

module.exports = DoDAnticipatoryMonitor;