import { test, expect, Page } from '@playwright/test';

/**
 * A/B Testing Framework pour l'optimisation UX
 * Framework automatisé pour tester les variantes d'interface et mesurer l'impact UX
 */

interface ABTestConfig {
  testId: string;
  name: string;
  description: string;
  variants: ABVariant[];
  metrics: ABMetric[];
  trafficSplit: number[]; // Pourcentage de trafic pour chaque variante
  duration: number; // Durée du test en ms
  significanceThreshold: number; // Seuil de significativité statistique
}

interface ABVariant {
  id: string;
  name: string;
  description: string;
  changes: ABChange[];
  expectedImpact: string;
}

interface ABChange {
  type: 'css' | 'text' | 'element' | 'attribute' | 'script';
  selector: string;
  value: string;
  action: 'replace' | 'add' | 'remove' | 'modify';
}

interface ABMetric {
  name: string;
  type: 'conversion' | 'time' | 'clicks' | 'scroll' | 'satisfaction';
  target: string; // Sélecteur CSS ou événement à mesurer
  goal: 'increase' | 'decrease';
  baseline?: number;
}

interface ABTestResult {
  variantId: string;
  metrics: Record<string, number>;
  sampleSize: number;
  conversionRate: number;
  userSatisfaction: number;
  completionTime: number;
  errorRate: number;
  engagementScore: number;
}

class ABTestingEngine {
  private page: Page;
  private results: Map<string, ABTestResult[]> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  async runABTest(config: ABTestConfig): Promise<Map<string, ABTestResult[]>> {
    console.log(`\n🧪 Starting A/B Test: ${config.name}`);
    console.log(`📊 Variants: ${config.variants.map(v => v.name).join(', ')}`);
    
    const testResults = new Map<string, ABTestResult[]>();

    // Exécuter chaque variante
    for (const [index, variant] of config.variants.entries()) {
      console.log(`\n🔀 Testing Variant: ${variant.name}`);
      
      const variantResults: ABTestResult[] = [];
      const iterations = Math.ceil(10 * (config.trafficSplit[index] / 100)); // Simulation d'utilisateurs
      
      for (let i = 0; i < iterations; i++) {
        const result = await this.testVariant(variant, config.metrics);
        variantResults.push(result);
      }
      
      testResults.set(variant.id, variantResults);
    }

    this.results = testResults;
    return testResults;
  }

  private async testVariant(variant: ABVariant, metrics: ABMetric[]): Promise<ABTestResult> {
    const startTime = Date.now();
    
    // Réinitialiser la page
    await this.page.goto('/', { waitUntil: 'networkidle' });
    
    // Appliquer les modifications de la variante
    await this.applyVariantChanges(variant);
    
    // Mesurer les métriques
    const metricsResults: Record<string, number> = {};
    let conversionRate = 0;
    let errorRate = 0;
    let engagementScore = 0;
    
    for (const metric of metrics) {
      const value = await this.measureMetric(metric);
      metricsResults[metric.name] = value;
      
      if (metric.type === 'conversion') {
        conversionRate = value;
      }
    }
    
    // Mesurer la satisfaction utilisateur (simulation basée sur les interactions)
    const userSatisfaction = await this.calculateUserSatisfaction();
    
    // Mesurer le score d'engagement
    engagementScore = await this.calculateEngagementScore();
    
    // Détecter les erreurs JavaScript
    errorRate = await this.measureErrorRate();
    
    const completionTime = Date.now() - startTime;

    return {
      variantId: variant.id,
      metrics: metricsResults,
      sampleSize: 1,
      conversionRate,
      userSatisfaction,
      completionTime,
      errorRate,
      engagementScore
    };
  }

  private async applyVariantChanges(variant: ABVariant): Promise<void> {
    for (const change of variant.changes) {
      try {
        switch (change.type) {
          case 'css':
            await this.page.addStyleTag({ content: `${change.selector} { ${change.value} }` });
            break;
            
          case 'text':
            await this.page.locator(change.selector).first().fill(change.value);
            break;
            
          case 'element':
            if (change.action === 'add') {
              await this.page.evaluate(({ selector, value }) => {
                const parent = document.querySelector(selector);
                if (parent) {
                  parent.insertAdjacentHTML('beforeend', value);
                }
              }, { selector: change.selector, value: change.value });
            } else if (change.action === 'remove') {
              await this.page.locator(change.selector).first().remove();
            }
            break;
            
          case 'attribute':
            await this.page.locator(change.selector).first().setAttribute(change.value.split('=')[0], change.value.split('=')[1]);
            break;
            
          case 'script':
            await this.page.evaluate(change.value);
            break;
        }
      } catch (error) {
        console.warn(`Failed to apply change: ${change.type} - ${error}`);
      }
    }
    
    // Attendre que les changements soient appliqués
    await this.page.waitForTimeout(500);
  }

  private async measureMetric(metric: ABMetric): Promise<number> {
    switch (metric.type) {
      case 'conversion':
        return await this.measureConversion(metric.target);
        
      case 'time':
        return await this.measureTime(metric.target);
        
      case 'clicks':
        return await this.measureClicks(metric.target);
        
      case 'scroll':
        return await this.measureScrollDepth();
        
      case 'satisfaction':
        return await this.calculateUserSatisfaction();
        
      default:
        return 0;
    }
  }

  private async measureConversion(target: string): Promise<number> {
    try {
      // Simuler une action utilisateur vers la conversion
      const conversionElement = this.page.locator(target);
      
      if (await conversionElement.isVisible()) {
        await conversionElement.click();
        await this.page.waitForTimeout(1000);
        
        // Vérifier si la conversion a eu lieu (exemple: redirection ou élément de succès)
        const conversionSuccess = await this.page.locator('[data-testid="success"], .success, .confirmation').isVisible();
        return conversionSuccess ? 1 : 0;
      }
      
      return 0;
    } catch {
      return 0;
    }
  }

  private async measureTime(target: string): Promise<number> {
    const startTime = Date.now();
    
    try {
      await this.page.locator(target).waitFor({ timeout: 10000 });
      return Date.now() - startTime;
    } catch {
      return 10000; // Timeout
    }
  }

  private async measureClicks(target: string): Promise<number> {
    try {
      // Compter les éléments cliquables correspondant au sélecteur
      const clickableElements = await this.page.locator(target).count();
      
      // Simuler quelques clics et mesurer la réactivité
      let successfulClicks = 0;
      const elementsToTest = Math.min(3, clickableElements);
      
      for (let i = 0; i < elementsToTest; i++) {
        try {
          await this.page.locator(target).nth(i).click({ timeout: 2000 });
          successfulClicks++;
        } catch {
          // Clic échoué
        }
      }
      
      return successfulClicks;
    } catch {
      return 0;
    }
  }

  private async measureScrollDepth(): Promise<number> {
    return await this.page.evaluate(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Simuler un scroll et calculer la profondeur
      window.scrollTo(0, documentHeight * 0.5);
      
      const scrollDepth = (scrollTop + windowHeight) / documentHeight;
      return Math.min(1, scrollDepth) * 100; // Pourcentage
    });
  }

  private async calculateUserSatisfaction(): Promise<number> {
    // Calcul basé sur plusieurs facteurs UX
    const factors = await this.page.evaluate(() => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      const interactive = document.querySelectorAll('button, a, input').length;
      const errors = (window as any).jsErrors?.length || 0;
      const responsive = window.innerWidth > 768 ? 1 : 0.8; // Bonus pour desktop
      
      return {
        loadTime: Math.max(0, 100 - (loadTime / 50)), // Pénalité pour temps de chargement
        interactivity: Math.min(100, interactive * 5), // Bonus pour éléments interactifs
        reliability: Math.max(0, 100 - (errors * 25)), // Pénalité pour erreurs
        responsive
      };
    });
    
    const satisfaction = (
      factors.loadTime * 0.3 + 
      factors.interactivity * 0.2 + 
      factors.reliability * 0.4 + 
      factors.responsive * 0.1
    );
    
    return Math.max(0, Math.min(100, satisfaction));
  }

  private async calculateEngagementScore(): Promise<number> {
    return await this.page.evaluate(() => {
      const timeOnPage = Date.now() - (performance.timing.navigationStart || Date.now());
      const interactions = (document.body.querySelectorAll('*:hover').length || 0) + 
                          (document.body.querySelectorAll('*:focus').length || 0);
      const scrollDepth = (window.pageYOffset + window.innerHeight) / document.documentElement.scrollHeight;
      
      // Score basé sur le temps passé, les interactions et le scroll
      const timeScore = Math.min(50, timeOnPage / 1000); // Max 50 pour le temps
      const interactionScore = Math.min(30, interactions * 5); // Max 30 pour les interactions
      const scrollScore = scrollDepth * 20; // Max 20 pour le scroll
      
      return timeScore + interactionScore + scrollScore;
    });
  }

  private async measureErrorRate(): Promise<number> {
    return await this.page.evaluate(() => {
      return (window as any).jsErrors?.length || 0;
    });
  }

  analyzeResults(results: Map<string, ABTestResult[]>): ABAnalysis {
    const analysis: ABAnalysis = {
      summary: {},
      winner: '',
      confidence: 0,
      recommendations: []
    };

    // Calculer les moyennes pour chaque variante
    for (const [variantId, variantResults] of results.entries()) {
      const avg = this.calculateAverages(variantResults);
      analysis.summary[variantId] = avg;
    }

    // Déterminer le gagnant
    const variants = Object.entries(analysis.summary);
    const winner = variants.reduce((best, current) => {
      const [currentId, currentAvg] = current;
      const [bestId, bestAvg] = best;
      
      // Score composite pour déterminer le gagnant
      const currentScore = currentAvg.conversionRate * 0.4 + 
                          currentAvg.userSatisfaction * 0.3 + 
                          currentAvg.engagementScore * 0.2 + 
                          (100 - currentAvg.errorRate) * 0.1;
                          
      const bestScore = bestAvg.conversionRate * 0.4 + 
                       bestAvg.userSatisfaction * 0.3 + 
                       bestAvg.engagementScore * 0.2 + 
                       (100 - bestAvg.errorRate) * 0.1;
      
      return currentScore > bestScore ? current : best;
    });

    analysis.winner = winner[0];
    analysis.confidence = this.calculateStatisticalSignificance(results);

    // Générer des recommandations
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  private calculateAverages(results: ABTestResult[]): ABTestResult {
    const count = results.length;
    
    return {
      variantId: results[0].variantId,
      metrics: {},
      sampleSize: count,
      conversionRate: results.reduce((sum, r) => sum + r.conversionRate, 0) / count,
      userSatisfaction: results.reduce((sum, r) => sum + r.userSatisfaction, 0) / count,
      completionTime: results.reduce((sum, r) => sum + r.completionTime, 0) / count,
      errorRate: results.reduce((sum, r) => sum + r.errorRate, 0) / count,
      engagementScore: results.reduce((sum, r) => sum + r.engagementScore, 0) / count
    };
  }

  private calculateStatisticalSignificance(results: Map<string, ABTestResult[]>): number {
    // Calcul simplifié de la significativité statistique
    const variants = Array.from(results.values());
    
    if (variants.length < 2) return 0;
    
    const sampleSizes = variants.map(v => v.length);
    const minSampleSize = Math.min(...sampleSizes);
    
    // Confiance basée sur la taille d'échantillon et la différence entre variantes
    const baseConfidence = Math.min(95, minSampleSize * 5); // Max 95%
    
    return baseConfidence;
  }

  private generateRecommendations(analysis: ABAnalysis): string[] {
    const recommendations: string[] = [];
    const variants = Object.entries(analysis.summary);
    
    if (analysis.confidence < 80) {
      recommendations.push('Augmenter la taille d\'échantillon pour une meilleure significativité statistique');
    }
    
    // Analyser les performances par métrique
    const conversionRates = variants.map(([id, avg]) => ({ id, value: avg.conversionRate }));
    const satisfactionScores = variants.map(([id, avg]) => ({ id, value: avg.userSatisfaction }));
    
    const bestConversion = conversionRates.reduce((best, current) => 
      current.value > best.value ? current : best
    );
    
    const bestSatisfaction = satisfactionScores.reduce((best, current) => 
      current.value > best.value ? current : best
    );
    
    if (bestConversion.id !== analysis.winner) {
      recommendations.push(`Variante ${bestConversion.id} a le meilleur taux de conversion mais n'est pas le gagnant global`);
    }
    
    if (bestSatisfaction.id !== analysis.winner) {
      recommendations.push(`Variante ${bestSatisfaction.id} a la meilleure satisfaction utilisateur`);
    }
    
    // Recommandations basées sur les métriques
    for (const [variantId, avg] of variants) {
      if (avg.errorRate > 2) {
        recommendations.push(`Variante ${variantId}: Réduire le taux d'erreur (${avg.errorRate.toFixed(1)}%)`);
      }
      
      if (avg.completionTime > 5000) {
        recommendations.push(`Variante ${variantId}: Optimiser le temps de completion (${avg.completionTime.toFixed(0)}ms)`);
      }
      
      if (avg.userSatisfaction < 70) {
        recommendations.push(`Variante ${variantId}: Améliorer l'expérience utilisateur (satisfaction: ${avg.userSatisfaction.toFixed(1)}%)`);
      }
    }
    
    return recommendations;
  }
}

interface ABAnalysis {
  summary: Record<string, ABTestResult>;
  winner: string;
  confidence: number;
  recommendations: string[];
}

// Configuration des tests A/B
const abTestConfigs: ABTestConfig[] = [
  {
    testId: 'homepage-hero-cta',
    name: 'Homepage Hero CTA Optimization',
    description: 'Test different call-to-action buttons on homepage hero section',
    variants: [
      {
        id: 'control',
        name: 'Control (Original)',
        description: 'Original CTA button',
        changes: [],
        expectedImpact: 'Baseline performance'
      },
      {
        id: 'variant-a',
        name: 'Larger CTA Button',
        description: 'Increase CTA button size by 20%',
        changes: [
          {
            type: 'css',
            selector: '.hero-cta, [data-testid="hero-cta"]',
            value: 'transform: scale(1.2); font-weight: bold;',
            action: 'add'
          }
        ],
        expectedImpact: 'Increase click-through rate'
      },
      {
        id: 'variant-b',
        name: 'Different CTA Color',
        description: 'Change CTA button to green color',
        changes: [
          {
            type: 'css',
            selector: '.hero-cta, [data-testid="hero-cta"]',
            value: 'background-color: #10B981 !important; border-color: #10B981 !important;',
            action: 'add'
          }
        ],
        expectedImpact: 'Improve visual prominence'
      }
    ],
    metrics: [
      {
        name: 'cta-clicks',
        type: 'clicks',
        target: '.hero-cta, [data-testid="hero-cta"]',
        goal: 'increase'
      },
      {
        name: 'conversion',
        type: 'conversion',
        target: '.hero-cta, [data-testid="hero-cta"]',
        goal: 'increase'
      }
    ],
    trafficSplit: [33, 33, 34],
    duration: 60000, // 1 minute pour les tests
    significanceThreshold: 0.05
  },
  
  {
    testId: 'inventory-add-form',
    name: 'Inventory Add Product Form Layout',
    description: 'Test different layouts for add product form',
    variants: [
      {
        id: 'control',
        name: 'Vertical Layout (Control)',
        description: 'Original vertical form layout',
        changes: [],
        expectedImpact: 'Baseline completion rate'
      },
      {
        id: 'variant-a',
        name: 'Horizontal Layout',
        description: 'Change form to horizontal layout',
        changes: [
          {
            type: 'css',
            selector: '.product-form, [data-testid="product-form"]',
            value: 'display: flex; flex-direction: row; gap: 1rem; flex-wrap: wrap;',
            action: 'add'
          },
          {
            type: 'css',
            selector: '.product-form > div, .product-form .form-group',
            value: 'flex: 1; min-width: 200px;',
            action: 'add'
          }
        ],
        expectedImpact: 'Faster form completion'
      }
    ],
    metrics: [
      {
        name: 'form-completion',
        type: 'conversion',
        target: 'button[type="submit"]',
        goal: 'increase'
      },
      {
        name: 'completion-time',
        type: 'time',
        target: '.success, [data-testid="success"]',
        goal: 'decrease'
      }
    ],
    trafficSplit: [50, 50],
    duration: 90000,
    significanceThreshold: 0.05
  },

  {
    testId: 'recipe-card-design',
    name: 'Recipe Card Design Optimization',
    description: 'Test different recipe card designs for better engagement',
    variants: [
      {
        id: 'control',
        name: 'Current Design',
        description: 'Current recipe card design',
        changes: [],
        expectedImpact: 'Baseline engagement'
      },
      {
        id: 'variant-a',
        name: 'Image-First Design',
        description: 'Larger images with reduced text',
        changes: [
          {
            type: 'css',
            selector: '.recipe-card img, [data-testid="recipe-card"] img',
            value: 'height: 200px; object-fit: cover;',
            action: 'add'
          },
          {
            type: 'css',
            selector: '.recipe-card .description, [data-testid="recipe-card"] .description',
            value: 'display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;',
            action: 'add'
          }
        ],
        expectedImpact: 'Higher visual appeal and engagement'
      }
    ],
    metrics: [
      {
        name: 'card-clicks',
        type: 'clicks',
        target: '.recipe-card, [data-testid="recipe-card"]',
        goal: 'increase'
      },
      {
        name: 'scroll-depth',
        type: 'scroll',
        target: '',
        goal: 'increase'
      }
    ],
    trafficSplit: [50, 50],
    duration: 75000,
    significanceThreshold: 0.05
  }
];

test.describe('A/B Testing Framework', () => {
  let abEngine: ABTestingEngine;

  test.beforeEach(async ({ page }) => {
    abEngine = new ABTestingEngine(page);
    
    // Setup error tracking
    await page.addInitScript(() => {
      (window as any).jsErrors = [];
      window.addEventListener('error', (event) => {
        (window as any).jsErrors.push(event.error?.toString() || event.message);
      });
    });
  });

  abTestConfigs.forEach((config) => {
    test(`A/B Test: ${config.name}`, async ({ page }) => {
      console.log(`\n🧪 Running A/B Test: ${config.name}`);
      console.log(`📝 Description: ${config.description}`);
      
      // Exécuter le test A/B
      const results = await abEngine.runABTest(config);
      
      // Analyser les résultats
      const analysis = abEngine.analyzeResults(results);
      
      // Afficher les résultats détaillés
      console.log('\n📊 A/B Test Results:');
      console.table(Object.entries(analysis.summary).map(([variantId, avg]) => ({
        Variant: variantId,
        'Conversion Rate': `${avg.conversionRate.toFixed(2)}%`,
        'User Satisfaction': `${avg.userSatisfaction.toFixed(1)}%`,
        'Completion Time': `${avg.completionTime.toFixed(0)}ms`,
        'Error Rate': `${avg.errorRate.toFixed(1)}%`,
        'Engagement Score': avg.engagementScore.toFixed(1)
      })));
      
      console.log(`\n🏆 Winner: ${analysis.winner}`);
      console.log(`📈 Confidence: ${analysis.confidence.toFixed(1)}%`);
      
      if (analysis.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        analysis.recommendations.forEach(rec => console.log(`  • ${rec}`));
      }
      
      // Assertions sur la qualité du test
      expect(analysis.confidence, 'Statistical confidence too low').toBeGreaterThanOrEqual(60);
      
      // Vérifier qu'il y a un gagnant clair
      expect(analysis.winner, 'No winner determined').toBeTruthy();
      
      // Vérifier que tous les variants ont été testés
      expect(Object.keys(analysis.summary).length, 'Not all variants tested').toBe(config.variants.length);
      
      // Vérifier les seuils de performance minimum
      for (const [variantId, result] of Object.entries(analysis.summary)) {
        expect(result.errorRate, `Variant ${variantId} has too many errors`).toBeLessThanOrEqual(10);
        expect(result.userSatisfaction, `Variant ${variantId} satisfaction too low`).toBeGreaterThanOrEqual(50);
        expect(result.completionTime, `Variant ${variantId} completion time too slow`).toBeLessThan(15000);
      }
      
      // Exporter les résultats pour analyse ultérieure
      await page.evaluate((testResults) => {
        if (typeof window !== 'undefined') {
          (window as any).abTestResults = (window as any).abTestResults || {};
          (window as any).abTestResults[testResults.testId] = testResults.analysis;
        }
      }, { testId: config.testId, analysis });
      
      // Log des métriques gagnantes pour implémentation
      const winnerResult = analysis.summary[analysis.winner];
      console.log(`\n✅ Winner Metrics for Implementation:`);
      console.log(`   Conversion Rate: ${winnerResult.conversionRate.toFixed(2)}%`);
      console.log(`   User Satisfaction: ${winnerResult.userSatisfaction.toFixed(1)}%`);
      console.log(`   Engagement Score: ${winnerResult.engagementScore.toFixed(1)}`);
    });
  });

  test('A/B Testing Performance Summary', async ({ page }) => {
    console.log('\n📈 Running A/B Testing Performance Summary');
    
    const summaryResults: Record<string, any> = {};
    
    // Exécuter tous les tests A/B de manière condensée
    for (const config of abTestConfigs.slice(0, 2)) { // Limite pour les performances
      const results = await abEngine.runABTest(config);
      const analysis = abEngine.analyzeResults(results);
      
      summaryResults[config.testId] = {
        name: config.name,
        winner: analysis.winner,
        confidence: analysis.confidence,
        improvement: this.calculateImprovement(analysis),
        recommendations: analysis.recommendations.length
      };
    }
    
    // Afficher le résumé global
    console.log('\n🎯 A/B Testing Summary Report:');
    console.table(summaryResults);
    
    // Vérifications globales
    const highConfidenceTests = Object.values(summaryResults).filter((result: any) => result.confidence >= 80);
    const testsWithRecommendations = Object.values(summaryResults).filter((result: any) => result.recommendations > 0);
    
    expect(highConfidenceTests.length, 'Not enough high-confidence test results').toBeGreaterThanOrEqual(1);
    
    console.log(`\n📊 Summary Statistics:`);
    console.log(`   High Confidence Tests: ${highConfidenceTests.length}/${Object.keys(summaryResults).length}`);
    console.log(`   Tests with Recommendations: ${testsWithRecommendations.length}/${Object.keys(summaryResults).length}`);
    console.log(`   Average Confidence: ${Object.values(summaryResults).reduce((sum: number, result: any) => sum + result.confidence, 0) / Object.keys(summaryResults).length}%`);
  });

  private calculateImprovement(analysis: ABAnalysis): number {
    const variants = Object.entries(analysis.summary);
    if (variants.length < 2) return 0;
    
    const control = variants.find(([id]) => id === 'control')?.[1];
    const winner = analysis.summary[analysis.winner];
    
    if (!control || control === winner) return 0;
    
    // Calcul d'amélioration basé sur le taux de conversion
    return ((winner.conversionRate - control.conversionRate) / control.conversionRate) * 100;
  }
});