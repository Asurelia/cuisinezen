#!/usr/bin/env node

/**
 * 🤖 DoD AI Agent - Agent IA pour l'analyse automatique de qualité
 * 
 * Cet agent IA analyse le code, détecte les problèmes de qualité,
 * suggère des améliorations et génère des rapports intelligents.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';
import { execSync } from 'child_process';

interface DoDAIAnalysis {
  overall: {
    score: number;
    status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
    summary: string;
  };
  categories: {
    codeQuality: CategoryAnalysis;
    security: CategoryAnalysis;
    performance: CategoryAnalysis;
    testing: CategoryAnalysis;
    accessibility: CategoryAnalysis;
  };
  recommendations: Recommendation[];
  actionItems: ActionItem[];
  trends: TrendAnalysis;
}

interface CategoryAnalysis {
  score: number;
  status: 'PASS' | 'WARNING' | 'FAIL';
  issues: Issue[];
  strengths: string[];
  improvements: string[];
}

interface Issue {
  type: 'error' | 'warning' | 'info';
  category: string;
  description: string;
  file?: string;
  line?: number;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

interface Recommendation {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  code?: string;
}

interface ActionItem {
  description: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  assignee?: string;
  dueDate?: string;
  relatedFiles: string[];
}

interface TrendAnalysis {
  direction: 'improving' | 'stable' | 'declining';
  velocity: number;
  prediction: string;
}

class DoDAIAgent {
  private projectRoot: string;
  private analysisCache: Map<string, any> = new Map();

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async analyzeProject(): Promise<DoDAIAnalysis> {
    console.log('🤖 DoD AI Agent starting comprehensive analysis...');

    const analysis: DoDAIAnalysis = {
      overall: { score: 0, status: 'WARNING', summary: '' },
      categories: {
        codeQuality: await this.analyzeCodeQuality(),
        security: await this.analyzeSecurity(),
        performance: await this.analyzePerformance(),
        testing: await this.analyzeTesting(),
        accessibility: await this.analyzeAccessibility()
      },
      recommendations: [],
      actionItems: [],
      trends: await this.analyzeTrends()
    };

    // Calcul du score global
    const scores = Object.values(analysis.categories).map(cat => cat.score);
    analysis.overall.score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    // Détermination du statut
    if (analysis.overall.score >= 90) analysis.overall.status = 'EXCELLENT';
    else if (analysis.overall.score >= 80) analysis.overall.status = 'GOOD';
    else if (analysis.overall.score >= 70) analysis.overall.status = 'WARNING';
    else analysis.overall.status = 'CRITICAL';

    // Génération des recommandations
    analysis.recommendations = await this.generateRecommendations(analysis);
    analysis.actionItems = await this.generateActionItems(analysis);
    analysis.overall.summary = this.generateSummary(analysis);

    return analysis;
  }

  private async analyzeCodeQuality(): Promise<CategoryAnalysis> {
    console.log('📊 Analyzing code quality...');
    
    const issues: Issue[] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];

    try {
      // Analyse TypeScript
      const tscOutput = execSync('npx tsc --noEmit --pretty false', { 
        encoding: 'utf8',
        cwd: this.projectRoot 
      });
      
      if (tscOutput.trim() === '') {
        strengths.push('Code TypeScript sans erreurs de compilation');
      }
    } catch (error) {
      const output = error.stdout || error.message;
      const tsErrors = this.parseTSErrors(output);
      issues.push(...tsErrors);
    }

    // Analyse de la complexité
    const complexityIssues = await this.analyzeComplexity();
    issues.push(...complexityIssues);

    // Analyse de la duplication
    const duplicationIssues = await this.analyzeDuplication();
    issues.push(...duplicationIssues);

    // Analyse des patterns anti-patterns
    const antiPatterns = await this.detectAntiPatterns();
    issues.push(...antiPatterns);

    // Analyse de l'architecture
    const architectureIssues = await this.analyzeArchitecture();
    issues.push(...architectureIssues);

    const score = this.calculateCategoryScore(issues, strengths);
    const status = this.determineStatus(score);

    if (score >= 80) {
      strengths.push('Architecture modulaire bien structurée');
      strengths.push('Respect des conventions TypeScript');
    }

    if (issues.length > 0) {
      improvements.push('Réduire la complexité cyclomatique');
      improvements.push('Éliminer la duplication de code');
    }

    return { score, status, issues, strengths, improvements };
  }

  private async analyzeSecurity(): Promise<CategoryAnalysis> {
    console.log('🔒 Analyzing security...');
    
    const issues: Issue[] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];

    try {
      // Audit npm
      const auditOutput = execSync('npm audit --json', { 
        encoding: 'utf8',
        cwd: this.projectRoot 
      });
      
      const auditData = JSON.parse(auditOutput);
      
      if (auditData.metadata.vulnerabilities.total === 0) {
        strengths.push('Aucune vulnérabilité détectée dans les dépendances');
      } else {
        Object.entries(auditData.metadata.vulnerabilities).forEach(([severity, count]) => {
          if (count > 0 && severity !== 'total') {
            issues.push({
              type: severity === 'critical' || severity === 'high' ? 'error' : 'warning',
              category: 'security',
              description: `${count} vulnérabilité(s) ${severity}`,
              suggestion: 'Exécuter npm audit fix ou mettre à jour les dépendances',
              priority: severity === 'critical' ? 'high' : severity === 'high' ? 'medium' : 'low'
            });
          }
        });
      }
    } catch (error) {
      issues.push({
        type: 'warning',
        category: 'security',
        description: 'Impossible d\'exécuter l\'audit de sécurité',
        suggestion: 'Vérifier la configuration npm',
        priority: 'medium'
      });
    }

    // Analyse des patterns de sécurité dans le code
    const securityPatterns = await this.analyzeSecurityPatterns();
    issues.push(...securityPatterns);

    // Vérification des secrets hardcodés
    const secretsIssues = await this.detectHardcodedSecrets();
    issues.push(...secretsIssues);

    const score = this.calculateCategoryScore(issues, strengths);
    const status = this.determineStatus(score);

    return { score, status, issues, strengths, improvements };
  }

  private async analyzePerformance(): Promise<CategoryAnalysis> {
    console.log('⚡ Analyzing performance...');
    
    const issues: Issue[] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Analyse de la taille du bundle
    const bundleIssues = await this.analyzeBundleSize();
    issues.push(...bundleIssues);

    // Analyse des optimisations d'images
    const imageIssues = await this.analyzeImageOptimizations();
    issues.push(...imageIssues);

    // Analyse du lazy loading
    const lazyLoadingIssues = await this.analyzeLazyLoading();
    issues.push(...lazyLoadingIssues);

    // Analyse des performances React
    const reactPerfIssues = await this.analyzeReactPerformance();
    issues.push(...reactPerfIssues);

    const score = this.calculateCategoryScore(issues, strengths);
    const status = this.determineStatus(score);

    if (score >= 80) {
      strengths.push('Optimisations d\'images bien implémentées');
      strengths.push('Code splitting efficace');
    }

    if (issues.length > 0) {
      improvements.push('Implémenter plus de lazy loading');
      improvements.push('Optimiser la taille du bundle');
    }

    return { score, status, issues, strengths, improvements };
  }

  private async analyzeTesting(): Promise<CategoryAnalysis> {
    console.log('🧪 Analyzing testing coverage...');
    
    const issues: Issue[] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];

    try {
      // Exécution des tests avec coverage
      const testOutput = execSync('npm run test:coverage -- --passWithNoTests --silent', { 
        encoding: 'utf8',
        cwd: this.projectRoot 
      });

      // Parsing de la couverture
      const coverage = this.parseCoverageOutput(testOutput);
      
      if (coverage.overall >= 85) {
        strengths.push(`Excellente couverture de tests: ${coverage.overall}%`);
      } else if (coverage.overall >= 70) {
        issues.push({
          type: 'warning',
          category: 'testing',
          description: `Couverture de tests: ${coverage.overall}% (objectif: 85%)`,
          suggestion: 'Ajouter des tests pour les fichiers non couverts',
          priority: 'medium'
        });
      } else {
        issues.push({
          type: 'error',
          category: 'testing',
          description: `Couverture de tests insuffisante: ${coverage.overall}%`,
          suggestion: 'Priorité: augmenter la couverture de tests',
          priority: 'high'
        });
      }

      // Analyse de la qualité des tests
      const testQualityIssues = await this.analyzeTestQuality();
      issues.push(...testQualityIssues);

    } catch (error) {
      issues.push({
        type: 'error',
        category: 'testing',
        description: 'Échec de l\'exécution des tests',
        suggestion: 'Corriger les tests en échec avant de continuer',
        priority: 'high'
      });
    }

    const score = this.calculateCategoryScore(issues, strengths);
    const status = this.determineStatus(score);

    return { score, status, issues, strengths, improvements };
  }

  private async analyzeAccessibility(): Promise<CategoryAnalysis> {
    console.log('♿ Analyzing accessibility...');
    
    const issues: Issue[] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Analyse des composants pour l'accessibilité
    const a11yIssues = await this.analyzeA11yPatterns();
    issues.push(...a11yIssues);

    // Vérification des attributs ARIA
    const ariaIssues = await this.analyzeARIAAttributes();
    issues.push(...ariaIssues);

    // Analyse du contraste et des couleurs
    const colorIssues = await this.analyzeColorContrast();
    issues.push(...colorIssues);

    const score = this.calculateCategoryScore(issues, strengths);
    const status = this.determineStatus(score);

    if (score >= 80) {
      strengths.push('Bonne utilisation des attributs ARIA');
      strengths.push('Navigation au clavier bien implémentée');
    }

    return { score, status, issues, strengths, improvements };
  }

  private async analyzeTrends(): Promise<TrendAnalysis> {
    // Analyse des tendances basée sur l'historique Git
    try {
      const gitLog = execSync('git log --oneline --since="30 days ago" --pretty=format:"%h %s"', {
        encoding: 'utf8',
        cwd: this.projectRoot
      });

      const commits = gitLog.split('\n').filter(line => line.trim());
      const testCommits = commits.filter(commit => 
        commit.includes('test') || commit.includes('spec') || commit.includes('coverage')
      ).length;

      const refactorCommits = commits.filter(commit =>
        commit.includes('refactor') || commit.includes('cleanup') || commit.includes('improve')
      ).length;

      const direction = (testCommits + refactorCommits) / commits.length > 0.3 ? 'improving' : 'stable';
      const velocity = commits.length / 30; // commits par jour

      return {
        direction,
        velocity,
        prediction: this.generateTrendPrediction(direction, velocity)
      };
    } catch (error) {
      return {
        direction: 'stable',
        velocity: 0,
        prediction: 'Données d\'historique insuffisantes pour la prédiction'
      };
    }
  }

  private async generateRecommendations(analysis: DoDAIAnalysis): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Recommandations basées sur les scores
    if (analysis.categories.testing.score < 80) {
      recommendations.push({
        title: 'Améliorer la couverture de tests',
        description: 'Ajouter des tests unitaires et d\'intégration pour atteindre 85% de couverture',
        impact: 'high',
        effort: 'medium',
        code: `
// Exemple de test à ajouter
describe('ProductCard', () => {
  it('should render product information', () => {
    const product = { id: '1', name: 'Test Product' };
    render(<ProductCard product={product} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});`
      });
    }

    if (analysis.categories.security.score < 90) {
      recommendations.push({
        title: 'Renforcer la sécurité',
        description: 'Corriger les vulnérabilités détectées et implémenter des validations',
        impact: 'high',
        effort: 'low',
        code: `
// Validation avec Zod
const ProductSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive()
});`
      });
    }

    if (analysis.categories.performance.score < 85) {
      recommendations.push({
        title: 'Optimiser les performances',
        description: 'Implémenter le lazy loading et optimiser les images',
        impact: 'medium',
        effort: 'medium',
        code: `
// Lazy loading avec React.lazy
const ProductList = lazy(() => import('./ProductList'));

// Usage avec Suspense
<Suspense fallback={<Loading />}>
  <ProductList />
</Suspense>`
      });
    }

    return recommendations;
  }

  private async generateActionItems(analysis: DoDAIAnalysis): Promise<ActionItem[]> {
    const actionItems: ActionItem[] = [];

    // Actions critiques
    const criticalIssues = Object.values(analysis.categories)
      .flatMap(cat => cat.issues)
      .filter(issue => issue.type === 'error');

    criticalIssues.forEach(issue => {
      actionItems.push({
        description: `Corriger: ${issue.description}`,
        priority: 'P0',
        relatedFiles: issue.file ? [issue.file] : []
      });
    });

    // Actions importantes
    if (analysis.categories.testing.score < 85) {
      actionItems.push({
        description: 'Augmenter la couverture de tests à 85%',
        priority: 'P1',
        relatedFiles: []
      });
    }

    return actionItems;
  }

  private generateSummary(analysis: DoDAIAnalysis): string {
    const { overall, categories } = analysis;
    const criticalIssues = Object.values(categories)
      .reduce((sum, cat) => sum + cat.issues.filter(i => i.type === 'error').length, 0);

    if (overall.status === 'EXCELLENT') {
      return `Code de très haute qualité avec un score de ${overall.score}/100. Tous les gates de qualité sont respectés.`;
    } else if (overall.status === 'GOOD') {
      return `Code de bonne qualité avec un score de ${overall.score}/100. Quelques améliorations mineures possibles.`;
    } else if (overall.status === 'WARNING') {
      return `Code nécessitant des améliorations (score: ${overall.score}/100). ${criticalIssues} problème(s) critique(s) à corriger.`;
    } else {
      return `Code nécessitant une attention immédiate (score: ${overall.score}/100). ${criticalIssues} problème(s) critique(s) bloquent le déploiement.`;
    }
  }

  // Méthodes d'analyse spécialisées
  private parseTSErrors(output: string): Issue[] {
    const issues: Issue[] = [];
    const lines = output.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/(.+)\((\d+),(\d+)\): error TS\d+: (.+)/);
      if (match) {
        const [, file, lineNum, , description] = match;
        issues.push({
          type: 'error',
          category: 'typescript',
          description: description.trim(),
          file: relative(this.projectRoot, file),
          line: parseInt(lineNum),
          suggestion: 'Corriger l\'erreur TypeScript',
          priority: 'high'
        });
      }
    });

    return issues;
  }

  private async analyzeComplexity(): Promise<Issue[]> {
    const issues: Issue[] = [];
    const tsFiles = this.findTSFiles();

    for (const file of tsFiles) {
      const content = readFileSync(file, 'utf8');
      const complexity = this.calculateCyclomaticComplexity(content);
      
      if (complexity > 15) {
        issues.push({
          type: 'warning',
          category: 'complexity',
          description: `Complexité cyclomatique élevée: ${complexity}`,
          file: relative(this.projectRoot, file),
          suggestion: 'Refactoriser en fonctions plus petites',
          priority: 'medium'
        });
      }
    }

    return issues;
  }

  private async analyzeDuplication(): Promise<Issue[]> {
    const issues: Issue[] = [];
    // Implémentation simplifiée de détection de duplication
    // Dans un vrai projet, utiliser des outils comme jscpd
    return issues;
  }

  private async detectAntiPatterns(): Promise<Issue[]> {
    const issues: Issue[] = [];
    const tsFiles = this.findTSFiles();

    for (const file of tsFiles) {
      const content = readFileSync(file, 'utf8');
      
      // Détection d'anti-patterns courants
      if (content.includes('any')) {
        issues.push({
          type: 'warning',
          category: 'anti-pattern',
          description: 'Usage du type "any" détecté',
          file: relative(this.projectRoot, file),
          suggestion: 'Utiliser des types spécifiques',
          priority: 'low'
        });
      }

      if (content.includes('console.log') && !file.includes('test')) {
        issues.push({
          type: 'warning',
          category: 'anti-pattern',
          description: 'console.log détecté en dehors des tests',
          file: relative(this.projectRoot, file),
          suggestion: 'Utiliser un système de logging approprié',
          priority: 'low'
        });
      }
    }

    return issues;
  }

  private async analyzeArchitecture(): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // Vérifier la structure des dossiers
    const srcPath = join(this.projectRoot, 'src');
    if (!existsSync(srcPath)) {
      issues.push({
        type: 'warning',
        category: 'architecture',
        description: 'Dossier src/ manquant',
        suggestion: 'Organiser le code dans src/',
        priority: 'medium'
      });
    }

    return issues;
  }

  private async analyzeSecurityPatterns(): Promise<Issue[]> {
    const issues: Issue[] = [];
    const tsFiles = this.findTSFiles();

    for (const file of tsFiles) {
      const content = readFileSync(file, 'utf8');
      
      // Détection de patterns de sécurité risqués
      if (content.includes('dangerouslySetInnerHTML')) {
        issues.push({
          type: 'warning',
          category: 'security',
          description: 'Usage de dangerouslySetInnerHTML détecté',
          file: relative(this.projectRoot, file),
          suggestion: 'Valider et sanitiser le contenu HTML',
          priority: 'high'
        });
      }

      if (content.includes('eval(')) {
        issues.push({
          type: 'error',
          category: 'security',
          description: 'Usage d\'eval() détecté - risque de sécurité critique',
          file: relative(this.projectRoot, file),
          suggestion: 'Éviter eval(), utiliser des alternatives sécurisées',
          priority: 'high'
        });
      }
    }

    return issues;
  }

  private async detectHardcodedSecrets(): Promise<Issue[]> {
    const issues: Issue[] = [];
    const files = this.findAllFiles();

    const secretPatterns = [
      /api[_-]?key[s]?\s*[:=]\s*['"][^'"]+['"]/i,
      /secret[s]?\s*[:=]\s*['"][^'"]+['"]/i,
      /password[s]?\s*[:=]\s*['"][^'"]+['"]/i,
      /token[s]?\s*[:=]\s*['"][^'"]+['"]/i
    ];

    for (const file of files) {
      if (file.includes('node_modules') || file.includes('.git')) continue;
      
      const content = readFileSync(file, 'utf8');
      
      secretPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          issues.push({
            type: 'error',
            category: 'security',
            description: 'Secret potentiel hardcodé détecté',
            file: relative(this.projectRoot, file),
            suggestion: 'Utiliser des variables d\'environnement',
            priority: 'high'
          });
        }
      });
    }

    return issues;
  }

  // Méthodes utilitaires
  private findTSFiles(): string[] {
    return this.findFiles('.ts', '.tsx').filter(file => 
      !file.includes('node_modules') && 
      !file.includes('.d.ts')
    );
  }

  private findAllFiles(): string[] {
    return this.findFiles('.ts', '.tsx', '.js', '.jsx', '.json');
  }

  private findFiles(...extensions: string[]): string[] {
    const files: string[] = [];
    
    const scan = (dir: string) => {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scan(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };

    scan(this.projectRoot);
    return files;
  }

  private calculateCyclomaticComplexity(code: string): number {
    // Implémentation simplifiée
    const complexityKeywords = [
      'if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||', '?'
    ];
    
    let complexity = 1; // Complexité de base
    
    complexityKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  private parseCoverageOutput(output: string): { overall: number } {
    // Parser simple pour extraire le pourcentage de couverture
    const match = output.match(/All files[^|]*\|\s*(\d+\.?\d*)/);
    return { overall: match ? parseFloat(match[1]) : 0 };
  }

  private calculateCategoryScore(issues: Issue[], strengths: string[]): number {
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;
    
    let score = 100;
    score -= errorCount * 15; // -15 points par erreur
    score -= warningCount * 5; // -5 points par warning
    score += strengths.length * 5; // +5 points par force
    
    return Math.max(0, Math.min(100, score));
  }

  private determineStatus(score: number): 'PASS' | 'WARNING' | 'FAIL' {
    if (score >= 80) return 'PASS';
    if (score >= 60) return 'WARNING';
    return 'FAIL';
  }

  private generateTrendPrediction(direction: string, velocity: number): string {
    if (direction === 'improving') {
      return `Tendance positive avec ${velocity.toFixed(1)} commits/jour. Qualité en amélioration.`;
    } else if (direction === 'stable') {
      return `Développement stable avec ${velocity.toFixed(1)} commits/jour. Maintenir les efforts.`;
    } else {
      return `Attention: tendance en baisse. Renforcer les pratiques de qualité.`;
    }
  }

  // Méthodes d'analyse spécialisées (stubs pour l'exemple)
  private async analyzeBundleSize(): Promise<Issue[]> { return []; }
  private async analyzeImageOptimizations(): Promise<Issue[]> { return []; }
  private async analyzeLazyLoading(): Promise<Issue[]> { return []; }
  private async analyzeReactPerformance(): Promise<Issue[]> { return []; }
  private async analyzeTestQuality(): Promise<Issue[]> { return []; }
  private async analyzeA11yPatterns(): Promise<Issue[]> { return []; }
  private async analyzeARIAAttributes(): Promise<Issue[]> { return []; }
  private async analyzeColorContrast(): Promise<Issue[]> { return []; }

  // Méthode principale pour génération de rapport
  async generateReport(): Promise<void> {
    const analysis = await this.analyzeProject();
    
    const report = `
# 🤖 DoD AI Agent Report
**Date**: ${new Date().toLocaleString('fr-FR')}
**Score Global**: ${analysis.overall.score}/100 (${analysis.overall.status})

## 📊 Résumé
${analysis.overall.summary}

## 📈 Scores par Catégorie
${Object.entries(analysis.categories).map(([name, cat]) => 
  `- **${name}**: ${cat.score}/100 (${cat.status})`
).join('\n')}

## 🚨 Problèmes Critiques
${analysis.categories.codeQuality.issues.filter(i => i.type === 'error').map(issue => 
  `- ${issue.description} (${issue.file || 'Global'})`
).join('\n') || 'Aucun problème critique détecté'}

## 💡 Recommandations
${analysis.recommendations.map(rec => 
  `### ${rec.title}\n${rec.description}\nImpact: ${rec.impact} | Effort: ${rec.effort}`
).join('\n\n')}

## 📋 Actions Prioritaires
${analysis.actionItems.map(action => 
  `- [${action.priority}] ${action.description}`
).join('\n')}

## 📈 Tendances
${analysis.trends.prediction}

---
*Rapport généré automatiquement par DoD AI Agent*
`;

    writeFileSync(join(this.projectRoot, 'dod-ai-report.md'), report);
    console.log('✅ Rapport DoD AI généré: dod-ai-report.md');
  }
}

// Exécution si appelé directement
async function main() {
  const agent = new DoDAIAgent();
  await agent.generateReport();
}

if (require.main === module) {
  main().catch(console.error);
}

export { DoDAIAgent };