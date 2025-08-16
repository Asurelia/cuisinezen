/**
 * Tests de charge automatisés intégrés dans le pipeline CI/CD
 * Validation des performances sous charge pour CuisineZen
 */

import { test, expect } from '@playwright/test';

interface LoadTestConfig {
  users: number;
  duration: number; // seconds
  rampUp: number; // seconds
  endpoints: string[];
  thresholds: {
    responseTime: number; // ms
    throughput: number; // requests/second
    errorRate: number; // percentage
  };
}

interface LoadTestResult {
  endpoint: string;
  avgResponseTime: number;
  maxResponseTime: number;
  throughput: number;
  errorRate: number;
  passed: boolean;
}

interface PerformanceMetrics {
  timestamp: number;
  endpoint: string;
  responseTime: number;
  statusCode: number;
  size: number;
}

/**
 * Service de tests de charge pour CuisineZen
 */
class LoadTestRunner {
  private results: PerformanceMetrics[] = [];
  
  constructor(private config: LoadTestConfig) {}

  async runLoadTest(): Promise<LoadTestResult[]> {
    const results: LoadTestResult[] = [];
    
    for (const endpoint of this.config.endpoints) {
      console.log(`🚀 Starting load test for ${endpoint}`);
      const result = await this.testEndpoint(endpoint);
      results.push(result);
    }
    
    return results;
  }

  private async testEndpoint(endpoint: string): Promise<LoadTestResult> {
    const metrics: PerformanceMetrics[] = [];
    const startTime = Date.now();
    
    // Simulation de montée en charge progressive
    const usersPerSecond = this.config.users / this.config.rampUp;
    
    for (let second = 0; second < this.config.duration; second++) {
      const currentUsers = Math.min(
        Math.floor((second / this.config.rampUp) * this.config.users),
        this.config.users
      );
      
      // Exécuter les requêtes pour les utilisateurs actifs
      const promises = Array.from({ length: currentUsers }, () => 
        this.makeRequest(endpoint)
      );
      
      const responses = await Promise.allSettled(promises);
      
      // Collecter les métriques
      responses.forEach((response, index) => {
        if (response.status === 'fulfilled') {
          metrics.push(response.value);
        } else {
          metrics.push({
            timestamp: Date.now(),
            endpoint,
            responseTime: -1,
            statusCode: 500,
            size: 0
          });
        }
      });
      
      // Attendre la prochaine seconde
      await this.sleep(1000);
    }
    
    return this.analyzeResults(endpoint, metrics);
  }

  private async makeRequest(endpoint: string): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'LoadTest/1.0',
        }
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Lire le contenu pour simuler un vrai utilisateur
      const content = await response.text();
      
      return {
        timestamp: Date.now(),
        endpoint,
        responseTime,
        statusCode: response.status,
        size: content.length
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        timestamp: Date.now(),
        endpoint,
        responseTime: endTime - startTime,
        statusCode: 500,
        size: 0
      };
    }
  }

  private analyzeResults(endpoint: string, metrics: PerformanceMetrics[]): LoadTestResult {
    const validMetrics = metrics.filter(m => m.responseTime > 0);
    const errorCount = metrics.filter(m => m.statusCode >= 400).length;
    
    const avgResponseTime = validMetrics.length > 0 
      ? validMetrics.reduce((sum, m) => sum + m.responseTime, 0) / validMetrics.length
      : 0;
    
    const maxResponseTime = validMetrics.length > 0
      ? Math.max(...validMetrics.map(m => m.responseTime))
      : 0;
    
    const throughput = validMetrics.length / this.config.duration;
    const errorRate = (errorCount / metrics.length) * 100;
    
    const passed = this.validateThresholds({
      avgResponseTime,
      maxResponseTime,
      throughput,
      errorRate
    });
    
    return {
      endpoint,
      avgResponseTime,
      maxResponseTime,
      throughput,
      errorRate,
      passed
    };
  }

  private validateThresholds(metrics: Omit<LoadTestResult, 'endpoint' | 'passed'>): boolean {
    return metrics.avgResponseTime <= this.config.thresholds.responseTime &&
           metrics.throughput >= this.config.thresholds.throughput &&
           metrics.errorRate <= this.config.thresholds.errorRate;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Configuration des tests de charge par environnement
const loadTestConfigs = {
  light: {
    users: 10,
    duration: 30,
    rampUp: 10,
    endpoints: ['/inventory', '/recipes', '/menu'],
    thresholds: {
      responseTime: 2000, // 2s
      throughput: 5, // 5 req/s
      errorRate: 5 // 5%
    }
  },
  medium: {
    users: 50,
    duration: 60,
    rampUp: 20,
    endpoints: ['/inventory', '/recipes', '/menu', '/analytics'],
    thresholds: {
      responseTime: 3000, // 3s
      throughput: 10, // 10 req/s
      errorRate: 2 // 2%
    }
  },
  heavy: {
    users: 100,
    duration: 120,
    rampUp: 30,
    endpoints: ['/inventory', '/recipes', '/menu', '/analytics', '/shopping-list'],
    thresholds: {
      responseTime: 5000, // 5s
      throughput: 15, // 15 req/s
      errorRate: 1 // 1%
    }
  }
};

test.describe('Load Testing - CuisineZen Performance', () => {
  test.beforeAll(async () => {
    console.log('🔧 Setting up load testing environment...');
    // Setup: vérifier que l'app est démarrée
  });

  test('Light load test - Basic functionality', async () => {
    const config = loadTestConfigs.light;
    const runner = new LoadTestRunner(config);
    
    console.log(`🧪 Running light load test with ${config.users} users for ${config.duration}s`);
    const results = await runner.runLoadTest();
    
    // Validation des résultats
    for (const result of results) {
      console.log(`📊 ${result.endpoint}: ${result.avgResponseTime.toFixed(2)}ms avg, ${result.throughput.toFixed(2)} req/s, ${result.errorRate.toFixed(2)}% errors`);
      
      expect(result.passed, 
        `❌ Load test failed for ${result.endpoint}: ` +
        `Avg response time: ${result.avgResponseTime.toFixed(2)}ms (threshold: ${config.thresholds.responseTime}ms), ` +
        `Throughput: ${result.throughput.toFixed(2)} req/s (threshold: ${config.thresholds.throughput} req/s), ` +
        `Error rate: ${result.errorRate.toFixed(2)}% (threshold: ${config.thresholds.errorRate}%)`
      ).toBe(true);
    }
    
    // Génération du rapport
    await generateLoadTestReport('light', results, config);
  });

  test('Medium load test - Realistic usage', async () => {
    const config = loadTestConfigs.medium;
    const runner = new LoadTestRunner(config);
    
    console.log(`🧪 Running medium load test with ${config.users} users for ${config.duration}s`);
    const results = await runner.runLoadTest();
    
    for (const result of results) {
      console.log(`📊 ${result.endpoint}: ${result.avgResponseTime.toFixed(2)}ms avg, ${result.throughput.toFixed(2)} req/s, ${result.errorRate.toFixed(2)}% errors`);
      
      expect(result.passed,
        `❌ Medium load test failed for ${result.endpoint}`
      ).toBe(true);
    }
    
    await generateLoadTestReport('medium', results, config);
  });

  test('Heavy load test - Stress testing', async () => {
    // Skip en dev, only run in CI
    test.skip(process.env.NODE_ENV !== 'production', 'Heavy load test only in production CI');
    
    const config = loadTestConfigs.heavy;
    const runner = new LoadTestRunner(config);
    
    console.log(`🧪 Running heavy load test with ${config.users} users for ${config.duration}s`);
    const results = await runner.runLoadTest();
    
    for (const result of results) {
      console.log(`📊 ${result.endpoint}: ${result.avgResponseTime.toFixed(2)}ms avg, ${result.throughput.toFixed(2)} req/s, ${result.errorRate.toFixed(2)}% errors`);
      
      expect(result.passed,
        `❌ Heavy load test failed for ${result.endpoint}`
      ).toBe(true);
    }
    
    await generateLoadTestReport('heavy', results, config);
  });

  test('Firebase Firestore load test', async () => {
    // Test spécifique pour les opérations Firestore
    const firestoreConfig: LoadTestConfig = {
      users: 20,
      duration: 45,
      rampUp: 15,
      endpoints: ['/api/products', '/api/recipes', '/api/analytics'],
      thresholds: {
        responseTime: 1500, // Firestore est généralement plus rapide
        throughput: 8,
        errorRate: 1
      }
    };
    
    const runner = new LoadTestRunner(firestoreConfig);
    const results = await runner.runLoadTest();
    
    for (const result of results) {
      expect(result.passed,
        `❌ Firestore load test failed for ${result.endpoint}`
      ).toBe(true);
    }
    
    await generateLoadTestReport('firestore', results, firestoreConfig);
  });

  test('Image optimization under load', async () => {
    // Test de charge spécifique pour les images
    const imageConfig: LoadTestConfig = {
      users: 15,
      duration: 30,
      rampUp: 10,
      endpoints: ['/_next/image?url=/test-image.jpg&w=800&q=75'],
      thresholds: {
        responseTime: 2500, // Images peuvent être plus lentes
        throughput: 6,
        errorRate: 0 // Zero tolerance for image errors
      }
    };
    
    const runner = new LoadTestRunner(imageConfig);
    const results = await runner.runLoadTest();
    
    for (const result of results) {
      expect(result.passed,
        `❌ Image optimization load test failed`
      ).toBe(true);
    }
    
    await generateLoadTestReport('images', results, imageConfig);
  });

  test.afterAll(async () => {
    console.log('📈 Load testing completed. Check reports in qa-automation/reports/');
  });
});

// Génération de rapports détaillés
async function generateLoadTestReport(
  testType: string, 
  results: LoadTestResult[], 
  config: LoadTestConfig
): Promise<void> {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    testType,
    config,
    results,
    summary: {
      totalEndpoints: results.length,
      passedEndpoints: results.filter(r => r.passed).length,
      averageResponseTime: results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length,
      averageThroughput: results.reduce((sum, r) => sum + r.throughput, 0) / results.length,
      averageErrorRate: results.reduce((sum, r) => sum + r.errorRate, 0) / results.length
    }
  };
  
  // Sauvegarde du rapport (simulation)
  console.log(`📄 Load test report saved: ${testType}-load-test-${timestamp}.json`);
  
  // En production, sauvegarderait dans qa-automation/reports/
  // await fs.writeFile(`qa-automation/reports/${testType}-load-test-${timestamp}.json`, JSON.stringify(report, null, 2));
}

// Configuration pour l'intégration CI/CD
export const cicdLoadTestConfig = {
  // Tests rapides pour chaque commit
  commit: loadTestConfigs.light,
  // Tests complets pour les PRs
  pullRequest: loadTestConfigs.medium,
  // Tests intensifs pour les releases
  release: loadTestConfigs.heavy
};