/**
 * Système d'auto-correction et d'amélioration des tests pour CuisineZen
 * Analyse les échecs, propose des corrections et identifie les gaps
 */

import { ComponentAnalysis, TestCase } from '../test-agent';
import { BusinessValidationResult } from '../validators/business-validator';

export interface TestResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  component: string;
  type: 'e2e' | 'unit' | 'integration' | 'accessibility';
}

export interface TestImprovement {
  type: 'fix' | 'optimize' | 'enhance' | 'add';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  component: string;
  originalTest?: string;
  suggestedCode: string;
  reasoning: string;
}

export interface CoverageGap {
  component: string;
  missingTestTypes: string[];
  missingInteractions: string[];
  missingBusinessLogic: string[];
  suggestedTests: TestCase[];
}

export class CuisineZenTestImprover {
  
  /**
   * Analyse les résultats de tests et propose des améliorations
   */
  async analyzeAndImprove(
    testResults: TestResult[],
    analyses: ComponentAnalysis[],
    businessValidation: BusinessValidationResult[]
  ): Promise<{
    improvements: TestImprovement[];
    coverageGaps: CoverageGap[];
    qualityScore: number;
    recommendations: string[];
  }> {
    console.log('🔧 Analyzing test results and suggesting improvements...');
    
    const improvements = await this.generateImprovements(testResults, analyses);
    const coverageGaps = await this.identifyCoverageGaps(testResults, analyses);
    const qualityScore = this.calculateQualityScore(testResults, businessValidation);
    const recommendations = this.generateRecommendations(testResults, improvements, coverageGaps);
    
    return {
      improvements,
      coverageGaps,
      qualityScore,
      recommendations
    };
  }

  /**
   * Génère des améliorations basées sur les échecs de tests
   */
  private async generateImprovements(
    testResults: TestResult[],
    analyses: ComponentAnalysis[]
  ): Promise<TestImprovement[]> {
    const improvements: TestImprovement[] = [];
    
    // Analyser les tests échoués
    const failedTests = testResults.filter(t => t.status === 'fail');
    
    for (const failedTest of failedTests) {
      const analysis = analyses.find(a => a.name === failedTest.component);
      if (!analysis) continue;
      
      const improvement = this.generateFixForFailedTest(failedTest, analysis);
      if (improvement) {
        improvements.push(improvement);
      }
    }
    
    // Analyser les tests lents
    const slowTests = testResults.filter(t => t.duration > 5000); // Plus de 5 secondes
    for (const slowTest of slowTests) {
      const optimization = this.generateOptimizationForSlowTest(slowTest, analyses);
      if (optimization) {
        improvements.push(optimization);
      }
    }
    
    // Proposer des améliorations préventives
    improvements.push(...this.generatePreventiveImprovements(analyses));
    
    return improvements.sort((a, b) => this.getPriorityScore(a.priority) - this.getPriorityScore(b.priority));
  }

  /**
   * Génère une correction pour un test échoué
   */
  private generateFixForFailedTest(failedTest: TestResult, analysis: ComponentAnalysis): TestImprovement | null {
    if (!failedTest.error) return null;
    
    const error = failedTest.error.toLowerCase();
    
    // Erreurs communes et leurs corrections
    if (error.includes('element not visible') || error.includes('not found')) {
      return {
        type: 'fix',
        priority: 'high',
        description: 'Corriger la sélection d\'élément non trouvé',
        component: failedTest.component,
        originalTest: failedTest.name,
        suggestedCode: this.generateWaitForElementFix(failedTest, analysis),
        reasoning: 'L\'élément n\'est pas visible au moment du test. Ajouter des attentes explicites.'
      };
    }
    
    if (error.includes('timeout') || error.includes('timed out')) {
      return {
        type: 'fix',
        priority: 'high',
        description: 'Optimiser les timeouts et attentes',
        component: failedTest.component,
        originalTest: failedTest.name,
        suggestedCode: this.generateTimeoutFix(failedTest, analysis),
        reasoning: 'Le test dépasse le timeout. Ajuster les attentes ou optimiser le code testé.'
      };
    }
    
    if (error.includes('permission') || error.includes('access denied')) {
      return {
        type: 'fix',
        priority: 'critical',
        description: 'Corriger les problèmes de permissions',
        component: failedTest.component,
        originalTest: failedTest.name,
        suggestedCode: this.generatePermissionFix(failedTest, analysis),
        reasoning: 'Problème de permissions. Ajouter la configuration des permissions de test.'
      };
    }
    
    if (error.includes('validation') || error.includes('required')) {
      return {
        type: 'fix',
        priority: 'medium',
        description: 'Ajuster les validations de formulaire',
        component: failedTest.component,
        originalTest: failedTest.name,
        suggestedCode: this.generateValidationFix(failedTest, analysis),
        reasoning: 'Erreur de validation. Adapter les données de test aux validations actuelles.'
      };
    }
    
    return null;
  }

  /**
   * Génère une optimisation pour un test lent
   */
  private generateOptimizationForSlowTest(slowTest: TestResult, analyses: ComponentAnalysis[]): TestImprovement | null {
    const analysis = analyses.find(a => a.name === slowTest.component);
    if (!analysis) return null;
    
    return {
      type: 'optimize',
      priority: 'medium',
      description: `Optimiser le test lent (${slowTest.duration}ms)`,
      component: slowTest.component,
      originalTest: slowTest.name,
      suggestedCode: this.generatePerformanceOptimization(slowTest, analysis),
      reasoning: 'Test trop lent. Optimiser les sélecteurs et réduire les attentes inutiles.'
    };
  }

  /**
   * Génère des améliorations préventives
   */
  private generatePreventiveImprovements(analyses: ComponentAnalysis[]): TestImprovement[] {
    const improvements: TestImprovement[] = [];
    
    for (const analysis of analyses) {
      // Suggérer des tests de performance pour les composants complexes
      if (analysis.interactions.length > 5) {
        improvements.push({
          type: 'add',
          priority: 'medium',
          description: 'Ajouter des tests de performance pour composant complexe',
          component: analysis.name,
          suggestedCode: this.generatePerformanceTest(analysis),
          reasoning: 'Composant avec beaucoup d\'interactions. Tester les performances.'
        });
      }
      
      // Suggérer des tests d'erreur pour les composants avec validations
      if (analysis.businessLogic.some(bl => bl.validations.length > 0)) {
        improvements.push({
          type: 'enhance',
          priority: 'low',
          description: 'Améliorer la couverture des cas d\'erreur',
          component: analysis.name,
          suggestedCode: this.generateErrorCaseTests(analysis),
          reasoning: 'Composant avec validations. Tester tous les cas d\'erreur.'
        });
      }
      
      // Suggérer des tests d'accessibilité pour les composants interactifs
      if (analysis.interactions.some(i => ['button', 'form', 'dialog'].includes(i.type))) {
        improvements.push({
          type: 'add',
          priority: 'medium',
          description: 'Ajouter des tests d\'accessibilité spécifiques',
          component: analysis.name,
          suggestedCode: this.generateAccessibilityTest(analysis),
          reasoning: 'Composant interactif. Tester l\'accessibilité en détail.'
        });
      }
    }
    
    return improvements;
  }

  /**
   * Identifie les gaps de couverture
   */
  private async identifyCoverageGaps(
    testResults: TestResult[],
    analyses: ComponentAnalysis[]
  ): Promise<CoverageGap[]> {
    const gaps: CoverageGap[] = [];
    
    for (const analysis of analyses) {
      const componentTests = testResults.filter(t => t.component === analysis.name);
      
      const gap: CoverageGap = {
        component: analysis.name,
        missingTestTypes: [],
        missingInteractions: [],
        missingBusinessLogic: [],
        suggestedTests: []
      };
      
      // Vérifier les types de tests manquants
      const testTypes = ['e2e', 'unit', 'integration', 'accessibility'];
      for (const type of testTypes) {
        if (!componentTests.some(t => t.type === type)) {
          gap.missingTestTypes.push(type);
        }
      }
      
      // Vérifier les interactions non testées
      for (const interaction of analysis.interactions) {
        const isTestedInteraction = componentTests.some(t => 
          t.name.toLowerCase().includes(interaction.type) ||
          t.name.toLowerCase().includes(interaction.action)
        );
        
        if (!isTestedInteraction) {
          gap.missingInteractions.push(`${interaction.type}: ${interaction.action}`);
        }
      }
      
      // Vérifier la logique métier non testée
      for (const businessLogic of analysis.businessLogic) {
        const isTestedLogic = componentTests.some(t => 
          t.name.toLowerCase().includes(businessLogic.feature.toLowerCase())
        );
        
        if (!isTestedLogic) {
          gap.missingBusinessLogic.push(businessLogic.feature);
        }
      }
      
      // Générer des tests suggérés pour combler les gaps
      if (gap.missingTestTypes.length > 0 || gap.missingInteractions.length > 0) {
        gap.suggestedTests = this.generateTestsForGaps(analysis, gap);
      }
      
      // Ajouter le gap seulement s'il y a des manques
      if (gap.missingTestTypes.length > 0 || 
          gap.missingInteractions.length > 0 || 
          gap.missingBusinessLogic.length > 0) {
        gaps.push(gap);
      }
    }
    
    return gaps;
  }

  /**
   * Calcule le score de qualité global
   */
  private calculateQualityScore(
    testResults: TestResult[],
    businessValidation: BusinessValidationResult[]
  ): number {
    const passRate = testResults.length > 0 ? 
      (testResults.filter(t => t.status === 'pass').length / testResults.length) * 100 : 0;
    
    const avgCoverage = businessValidation.length > 0 ?
      businessValidation.reduce((sum, bv) => sum + bv.coverage, 0) / businessValidation.length : 0;
    
    const performanceScore = testResults.length > 0 ?
      Math.max(0, 100 - (testResults.reduce((sum, t) => sum + t.duration, 0) / testResults.length / 100)) : 0;
    
    // Score pondéré
    return Math.round((passRate * 0.4) + (avgCoverage * 0.4) + (performanceScore * 0.2));
  }

  /**
   * Génère des recommandations globales
   */
  private generateRecommendations(
    testResults: TestResult[],
    improvements: TestImprovement[],
    coverageGaps: CoverageGap[]
  ): string[] {
    const recommendations: string[] = [];
    
    const failedCount = testResults.filter(t => t.status === 'fail').length;
    const slowTestCount = testResults.filter(t => t.duration > 5000).length;
    
    // Recommandations basées sur les échecs
    if (failedCount > 0) {
      recommendations.push(`🔥 PRIORITÉ CRITIQUE: Corriger ${failedCount} test(s) échoué(s)`);
    }
    
    if (slowTestCount > 0) {
      recommendations.push(`⚡ Optimiser ${slowTestCount} test(s) lent(s) pour améliorer la vitesse d'exécution`);
    }
    
    // Recommandations basées sur la couverture
    const componentsWithGaps = coverageGaps.length;
    if (componentsWithGaps > 0) {
      recommendations.push(`📊 Améliorer la couverture de tests sur ${componentsWithGaps} composant(s)`);
    }
    
    // Recommandations spécifiques à CuisineZen
    const criticalImprovements = improvements.filter(i => i.priority === 'critical');
    if (criticalImprovements.length > 0) {
      recommendations.push(`🚨 Implémenter ${criticalImprovements.length} amélioration(s) critique(s)`);
    }
    
    // Recommandations préventives
    recommendations.push('🛡️ Ajouter des tests de régression pour éviter les futures régressions');
    recommendations.push('🚀 Intégrer les tests dans la CI/CD pour une validation continue');
    recommendations.push('📱 Étendre les tests sur différents devices et navigateurs');
    
    return recommendations;
  }

  // Méthodes de génération de code pour les corrections

  private generateWaitForElementFix(failedTest: TestResult, analysis: ComponentAnalysis): string {
    return `
// Correction pour l'attente d'éléments
test('${failedTest.name} - Fixed', async ({ page }) => {
  // Attendre explicitement que l'élément soit visible
  await page.waitForSelector('[data-testid="${analysis.name.toLowerCase()}"]', { 
    state: 'visible',
    timeout: 10000 
  });
  
  // Attendre que la page soit complètement chargée
  await page.waitForLoadState('networkidle');
  
  // Votre test original ici...
});`;
  }

  private generateTimeoutFix(failedTest: TestResult, analysis: ComponentAnalysis): string {
    return `
// Correction pour les timeouts
test('${failedTest.name} - Optimized', async ({ page }) => {
  // Augmenter le timeout pour les opérations lentes
  test.setTimeout(30000);
  
  // Attendre les opérations async spécifiques
  await page.waitForFunction(() => {
    return document.readyState === 'complete';
  });
  
  // Attendre les requêtes réseau spécifiques
  await page.waitForResponse(response => 
    response.url().includes('firebase') && response.status() === 200
  );
  
  // Votre test original ici...
});`;
  }

  private generatePermissionFix(failedTest: TestResult, analysis: ComponentAnalysis): string {
    return `
// Correction pour les permissions
test('${failedTest.name} - With Permissions', async ({ page, context }) => {
  // Accorder les permissions nécessaires
  await context.grantPermissions(['camera', 'microphone', 'geolocation']);
  
  // Mock des APIs si nécessaire
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: () => Promise.resolve(new MediaStream())
      }
    });
  });
  
  // Votre test original ici...
});`;
  }

  private generateValidationFix(failedTest: TestResult, analysis: ComponentAnalysis): string {
    return `
// Correction pour les validations
test('${failedTest.name} - Valid Data', async ({ page }) => {
  // Données de test valides basées sur les validations actuelles
  const validTestData = {
    name: 'Produit Test Valide',
    category: 'frais',
    quantity: 1,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours dans le futur
  };
  
  // Remplir avec des données valides
  await page.fill('input[name="name"]', validTestData.name);
  await page.selectOption('select[name="category"]', validTestData.category);
  await page.fill('input[name="quantity"]', validTestData.quantity.toString());
  
  // Votre test original ici...
});`;
  }

  private generatePerformanceOptimization(slowTest: TestResult, analysis: ComponentAnalysis): string {
    return `
// Optimisation performance
test('${slowTest.name} - Optimized', async ({ page }) => {
  // Désactiver les images et CSS pour accélérer
  await page.route('**/*.{png,jpg,jpeg,gif,css}', route => route.abort());
  
  // Utiliser des sélecteurs plus spécifiques
  const specificSelector = '[data-testid="${analysis.name.toLowerCase()}-main"]';
  
  // Réduire les attentes inutiles
  await page.locator(specificSelector).waitFor({ state: 'visible' });
  
  // Votre test original optimisé ici...
});`;
  }

  private generatePerformanceTest(analysis: ComponentAnalysis): string {
    return `
// Test de performance pour ${analysis.name}
test('${analysis.name} - Performance Test', async ({ page }) => {
  const startTime = Date.now();
  
  // Mesurer le temps de chargement
  await page.goto('/');
  const loadTime = Date.now() - startTime;
  
  // Vérifier que le chargement est sous 3 secondes
  expect(loadTime).toBeLessThan(3000);
  
  // Mesurer le temps de rendu du composant
  const renderStart = Date.now();
  await page.locator('[data-testid="${analysis.name.toLowerCase()}"]').waitFor();
  const renderTime = Date.now() - renderStart;
  
  expect(renderTime).toBeLessThan(1000);
});`;
  }

  private generateErrorCaseTests(analysis: ComponentAnalysis): string {
    return `
// Tests des cas d'erreur pour ${analysis.name}
test.describe('${analysis.name} - Error Cases', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simuler une panne réseau
    await page.route('**/api/**', route => route.abort('failed'));
    
    // Vérifier la gestion d'erreur
    await expect(page.locator('.error-message')).toBeVisible();
  });
  
  test('should handle invalid data gracefully', async ({ page }) => {
    // Tester avec des données invalides
    await page.fill('input[name="name"]', ''); // Champ requis vide
    await page.click('button[type="submit"]');
    
    // Vérifier l'affichage des erreurs
    await expect(page.locator('.field-error')).toBeVisible();
  });
});`;
  }

  private generateAccessibilityTest(analysis: ComponentAnalysis): string {
    return `
// Tests d'accessibilité spécifiques pour ${analysis.name}
test('${analysis.name} - Accessibility', async ({ page }) => {
  // Test de navigation au clavier
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  
  // Test des labels ARIA
  const interactiveElements = page.locator('button, input, select');
  const count = await interactiveElements.count();
  
  for (let i = 0; i < count; i++) {
    const element = interactiveElements.nth(i);
    const hasAccessibleName = await element.evaluate(el => {
      return el.hasAttribute('aria-label') || 
             el.hasAttribute('aria-labelledby') ||
             el.textContent?.trim() !== '';
    });
    expect(hasAccessibleName).toBe(true);
  }
  
  // Test du contraste
  await expect(page.locator('body')).toHaveCSS('color', /rgb\\(\\d+, \\d+, \\d+\\)/);
});`;
  }

  private generateTestsForGaps(analysis: ComponentAnalysis, gap: CoverageGap): TestCase[] {
    const tests: TestCase[] = [];
    
    // Générer des tests pour les types manquants
    for (const missingType of gap.missingTestTypes) {
      tests.push({
        id: `${analysis.name}-${missingType}-gap`,
        name: `${analysis.name} - ${missingType} test`,
        description: `Test ${missingType} généré pour combler un gap de couverture`,
        type: missingType as any,
        component: analysis.name,
        scenario: {
          given: `Le composant ${analysis.name} est rendu`,
          when: `L'utilisateur interagit avec le composant`,
          then: `Le comportement attendu se produit`
        },
        assertions: [
          {
            type: 'visibility',
            target: 'component',
            expected: 'renders correctly'
          }
        ]
      });
    }
    
    return tests;
  }

  private getPriorityScore(priority: string): number {
    const scores = { critical: 1, high: 2, medium: 3, low: 4 };
    return scores[priority as keyof typeof scores] || 5;
  }

  /**
   * Génère un rapport complet d'amélioration
   */
  generateImprovementReport(
    improvements: TestImprovement[],
    coverageGaps: CoverageGap[],
    qualityScore: number,
    recommendations: string[]
  ): string {
    return `
# Rapport d'Amélioration des Tests - CuisineZen

## 📊 Score de Qualité Global: ${qualityScore}%

${qualityScore >= 80 ? '🏆 Excellent!' : qualityScore >= 60 ? '👍 Bon' : qualityScore >= 40 ? '⚠️ À améliorer' : '🚨 Critique'}

## 🎯 Recommandations Prioritaires

${recommendations.map(rec => `- ${rec}`).join('\n')}

## 🔧 Améliorations Suggérées (${improvements.length} items)

### Critiques (${improvements.filter(i => i.priority === 'critical').length})
${improvements.filter(i => i.priority === 'critical').map(imp => `
**${imp.component}**: ${imp.description}
- Type: ${imp.type}
- Raison: ${imp.reasoning}
- Test original: ${imp.originalTest || 'N/A'}
`).join('\n') || 'Aucune amélioration critique requise'}

### Hautes Priorités (${improvements.filter(i => i.priority === 'high').length})
${improvements.filter(i => i.priority === 'high').map(imp => `
**${imp.component}**: ${imp.description}
- Type: ${imp.type}
- Raison: ${imp.reasoning}
`).join('\n') || 'Aucune amélioration haute priorité'}

## 📈 Gaps de Couverture (${coverageGaps.length} composants)

${coverageGaps.map(gap => `
### ${gap.component}
- **Types de tests manquants**: ${gap.missingTestTypes.join(', ') || 'Aucun'}
- **Interactions non testées**: ${gap.missingInteractions.join(', ') || 'Aucune'}
- **Logique métier non testée**: ${gap.missingBusinessLogic.join(', ') || 'Aucune'}
- **Tests suggérés**: ${gap.suggestedTests.length} nouveaux tests
`).join('\n') || 'Aucun gap de couverture détecté'}

## 🚀 Plan d'Action

### Phase 1 - Corrections Critiques
1. Corriger tous les tests échoués
2. Résoudre les problèmes de permissions
3. Optimiser les tests les plus lents

### Phase 2 - Amélioration de la Couverture  
1. Ajouter les tests manquants pour les composants critiques
2. Implémenter les tests d'accessibilité
3. Ajouter les tests de performance

### Phase 3 - Optimisation Continue
1. Automatiser l'exécution des tests
2. Mettre en place des alertes de régression
3. Intégrer l'agent d'amélioration dans la CI/CD

---
*Généré le ${new Date().toLocaleString('fr-FR')} par l'Agent d'Amélioration CuisineZen*
`;
  }
}

export const testImprover = new CuisineZenTestImprover();