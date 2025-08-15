/**
 * Agent IA intelligent pour CuisineZen
 * Scanne l'interface, génère des tests automatiquement et valide les fonctionnalités métier
 */

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

// Types pour l'analyse des composants
export interface ComponentAnalysis {
  name: string;
  filePath: string;
  exports: string[];
  imports: string[];
  hooks: string[];
  props: ComponentProp[];
  interactions: ComponentInteraction[];
  businessLogic: BusinessLogic[];
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface ComponentInteraction {
  type: 'button' | 'form' | 'input' | 'dialog' | 'dropdown' | 'upload';
  selector: string;
  action: string;
  validation?: string;
  analytics?: string;
}

export interface BusinessLogic {
  feature: string;
  flow: string[];
  validations: string[];
  firebaseOperations: string[];
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: 'e2e' | 'unit' | 'integration' | 'accessibility';
  component: string;
  scenario: TestScenario;
  assertions: TestAssertion[];
  setup?: string[];
  teardown?: string[];
}

export interface TestScenario {
  given: string;
  when: string;
  then: string;
}

export interface TestAssertion {
  type: 'visibility' | 'content' | 'interaction' | 'data' | 'accessibility';
  target: string;
  expected: any;
  selector?: string;
}

export class CuisineZenTestAgent {
  private componentsDir: string;
  private analysisCache: Map<string, ComponentAnalysis> = new Map();
  
  constructor(projectRoot: string) {
    this.componentsDir = path.join(projectRoot, 'src', 'components');
  }

  /**
   * Scanne tous les composants React de l'interface utilisateur
   */
  async scanInterface(): Promise<ComponentAnalysis[]> {
    console.log('🔍 Scanning CuisineZen interface...');
    
    const componentFiles = await this.findComponentFiles();
    const analyses: ComponentAnalysis[] = [];
    
    for (const filePath of componentFiles) {
      try {
        const analysis = await this.analyzeComponent(filePath);
        analyses.push(analysis);
        this.analysisCache.set(filePath, analysis);
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ${filePath}:`, error);
      }
    }
    
    console.log(`✅ Analyzed ${analyses.length} components`);
    return analyses;
  }

  /**
   * Trouve tous les fichiers de composants React
   */
  private async findComponentFiles(): Promise<string[]> {
    const files: string[] = [];
    
    async function scanDirectory(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    }
    
    await scanDirectory(this.componentsDir);
    return files;
  }

  /**
   * Analyse un composant React spécifique
   */
  private async analyzeComponent(filePath: string): Promise<ComponentAnalysis> {
    const content = await fs.readFile(filePath, 'utf-8');
    const name = path.basename(filePath, path.extname(filePath));
    
    return {
      name,
      filePath,
      exports: this.extractExports(content),
      imports: this.extractImports(content),
      hooks: this.extractHooks(content),
      props: this.extractProps(content),
      interactions: this.extractInteractions(content),
      businessLogic: this.extractBusinessLogic(content, name)
    };
  }

  /**
   * Extrait les exports du composant
   */
  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g;
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  }

  /**
   * Extrait les imports du composant
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  /**
   * Extrait les hooks React utilisés
   */
  private extractHooks(content: string): string[] {
    const hooks: string[] = [];
    const hookPatterns = [
      /use\w+/g,
      /useForm\(/g,
      /useFieldArray\(/g,
      /useToast\(/g,
      /useFirestore\(/g
    ];
    
    for (const pattern of hookPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (!hooks.includes(match[0])) {
          hooks.push(match[0]);
        }
      }
    }
    
    return hooks;
  }

  /**
   * Extrait les props du composant
   */
  private extractProps(content: string): ComponentProp[] {
    const props: ComponentProp[] = [];
    
    // Recherche des interfaces de props
    const interfaceRegex = /interface\s+(\w+Props)\s*{([^}]+)}/g;
    let match;
    
    while ((match = interfaceRegex.exec(content)) !== null) {
      const propsContent = match[2];
      const propRegex = /(\w+)(\?)?:\s*([^;]+);/g;
      let propMatch;
      
      while ((propMatch = propRegex.exec(propsContent)) !== null) {
        props.push({
          name: propMatch[1],
          type: propMatch[3].trim(),
          required: !propMatch[2]
        });
      }
    }
    
    return props;
  }

  /**
   * Extrait les interactions utilisateur du composant
   */
  private extractInteractions(content: string): ComponentInteraction[] {
    const interactions: ComponentInteraction[] = [];
    
    // Boutons avec onClick
    const buttonRegex = /<Button[^>]*onClick={([^}]+)}[^>]*>(.*?)<\/Button>/g;
    let match;
    
    while ((match = buttonRegex.exec(content)) !== null) {
      interactions.push({
        type: 'button',
        selector: `button:contains("${match[2].replace(/<[^>]*>/g, '').trim()}")`,
        action: 'click',
        validation: this.extractValidationFromHandler(match[1])
      });
    }
    
    // Formulaires
    if (content.includes('useForm') || content.includes('<form')) {
      interactions.push({
        type: 'form',
        selector: 'form',
        action: 'submit',
        validation: 'form validation schema'
      });
    }
    
    // Inputs
    const inputRegex = /<Input[^>]*(?:id|name)="([^"]+)"[^>]*>/g;
    while ((match = inputRegex.exec(content)) !== null) {
      interactions.push({
        type: 'input',
        selector: `input[id="${match[1]}"], input[name="${match[1]}"]`,
        action: 'type'
      });
    }
    
    // Dialogs
    if (content.includes('Dialog') && content.includes('isOpen')) {
      interactions.push({
        type: 'dialog',
        selector: '[role="dialog"]',
        action: 'open/close'
      });
    }
    
    // File uploads
    if (content.includes('type="file"') || content.includes('fileInputRef')) {
      interactions.push({
        type: 'upload',
        selector: 'input[type="file"]',
        action: 'upload'
      });
    }
    
    return interactions;
  }

  /**
   * Extrait la logique métier du composant
   */
  private extractBusinessLogic(content: string, componentName: string): BusinessLogic[] {
    const businessLogic: BusinessLogic[] = [];
    
    // Logique produit
    if (componentName.toLowerCase().includes('product')) {
      businessLogic.push({
        feature: 'Gestion des produits',
        flow: ['Validation des données', 'Ajout au stock', 'Mise à jour analytics'],
        validations: this.extractValidations(content),
        firebaseOperations: this.extractFirebaseOperations(content)
      });
    }
    
    // Logique recette
    if (componentName.toLowerCase().includes('recipe')) {
      businessLogic.push({
        feature: 'Gestion des recettes',
        flow: ['Validation des ingrédients', 'Vérification du stock', 'Sauvegarde'],
        validations: this.extractValidations(content),
        firebaseOperations: this.extractFirebaseOperations(content)
      });
    }
    
    // Scanner de codes-barres
    if (content.includes('barcode') || content.includes('scanner')) {
      businessLogic.push({
        feature: 'Scanner de codes-barres',
        flow: ['Activation de la caméra', 'Détection du code', 'Recherche produit'],
        validations: ['Format du code-barres'],
        firebaseOperations: ['Recherche en base']
      });
    }
    
    return businessLogic;
  }

  /**
   * Extrait les validations du code
   */
  private extractValidations(content: string): string[] {
    const validations: string[] = [];
    
    // Validations Zod
    const zodRegex = /z\.(\w+)\(\)\.([^,)]+)/g;
    let match;
    
    while ((match = zodRegex.exec(content)) !== null) {
      validations.push(`${match[1]}: ${match[2]}`);
    }
    
    return validations;
  }

  /**
   * Extrait les opérations Firebase
   */
  private extractFirebaseOperations(content: string): string[] {
    const operations: string[] = [];
    
    if (content.includes('addDoc') || content.includes('setDoc')) {
      operations.push('Create/Update document');
    }
    if (content.includes('getDocs') || content.includes('getDoc')) {
      operations.push('Read document(s)');
    }
    if (content.includes('deleteDoc')) {
      operations.push('Delete document');
    }
    if (content.includes('uploadBytes') || content.includes('storage')) {
      operations.push('File upload');
    }
    
    return operations;
  }

  /**
   * Extrait les validations d'un handler
   */
  private extractValidationFromHandler(handler: string): string | undefined {
    if (handler.includes('form.handleSubmit')) {
      return 'Form validation';
    }
    if (handler.includes('validate')) {
      return 'Custom validation';
    }
    return undefined;
  }

  /**
   * Génère des tests automatiquement basés sur l'analyse
   */
  async generateTests(analyses: ComponentAnalysis[]): Promise<TestCase[]> {
    console.log('🧪 Generating automated tests...');
    
    const testCases: TestCase[] = [];
    
    for (const analysis of analyses) {
      // Tests d'accessibilité pour chaque composant
      testCases.push(...this.generateAccessibilityTests(analysis));
      
      // Tests d'interaction pour les composants interactifs
      testCases.push(...this.generateInteractionTests(analysis));
      
      // Tests métier pour les composants avec logique business
      testCases.push(...this.generateBusinessTests(analysis));
      
      // Tests de régression
      testCases.push(...this.generateRegressionTests(analysis));
    }
    
    console.log(`✅ Generated ${testCases.length} test cases`);
    return testCases;
  }

  /**
   * Génère des tests d'accessibilité
   */
  private generateAccessibilityTests(analysis: ComponentAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    
    tests.push({
      id: `${analysis.name}-accessibility-basic`,
      name: `${analysis.name} - Basic Accessibility`,
      description: `Vérifie l'accessibilité de base du composant ${analysis.name}`,
      type: 'accessibility',
      component: analysis.name,
      scenario: {
        given: `Le composant ${analysis.name} est rendu`,
        when: 'L\'utilisateur navigue avec le clavier',
        then: 'Tous les éléments sont accessibles et ont les bons attributs ARIA'
      },
      assertions: [
        {
          type: 'accessibility',
          target: 'component',
          expected: 'no accessibility violations'
        },
        {
          type: 'accessibility',
          target: 'interactive elements',
          expected: 'proper focus management'
        }
      ]
    });
    
    return tests;
  }

  /**
   * Génère des tests d'interaction
   */
  private generateInteractionTests(analysis: ComponentAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    
    for (const interaction of analysis.interactions) {
      tests.push({
        id: `${analysis.name}-interaction-${interaction.type}`,
        name: `${analysis.name} - ${interaction.type} interaction`,
        description: `Teste l'interaction ${interaction.action} sur ${interaction.type}`,
        type: 'e2e',
        component: analysis.name,
        scenario: {
          given: `Le composant ${analysis.name} est ouvert`,
          when: `L'utilisateur effectue ${interaction.action} sur ${interaction.selector}`,
          then: 'L\'action est exécutée correctement'
        },
        assertions: [
          {
            type: 'interaction',
            target: interaction.selector,
            expected: 'responds to user action',
            selector: interaction.selector
          }
        ]
      });
    }
    
    return tests;
  }

  /**
   * Génère des tests métier
   */
  private generateBusinessTests(analysis: ComponentAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    
    for (const logic of analysis.businessLogic) {
      // Test du flow complet
      tests.push({
        id: `${analysis.name}-business-${logic.feature.toLowerCase().replace(/\s+/g, '-')}`,
        name: `${analysis.name} - ${logic.feature}`,
        description: `Teste le flow complet de ${logic.feature}`,
        type: 'integration',
        component: analysis.name,
        scenario: {
          given: 'L\'utilisateur a les permissions nécessaires',
          when: `L'utilisateur utilise la fonctionnalité ${logic.feature}`,
          then: 'Le flow métier se déroule correctement'
        },
        assertions: logic.flow.map(step => ({
          type: 'data' as const,
          target: step,
          expected: 'completed successfully'
        }))
      });
      
      // Tests des validations
      for (const validation of logic.validations) {
        tests.push({
          id: `${analysis.name}-validation-${validation.replace(/[^a-zA-Z0-9]/g, '-')}`,
          name: `${analysis.name} - Validation: ${validation}`,
          description: `Teste la validation: ${validation}`,
          type: 'unit',
          component: analysis.name,
          scenario: {
            given: 'Des données invalides sont soumises',
            when: 'La validation est exécutée',
            then: 'L\'erreur appropriée est affichée'
          },
          assertions: [
            {
              type: 'content',
              target: 'error message',
              expected: 'validation error displayed'
            }
          ]
        });
      }
    }
    
    return tests;
  }

  /**
   * Génère des tests de régression
   */
  private generateRegressionTests(analysis: ComponentAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    
    // Tests de rendu de base
    tests.push({
      id: `${analysis.name}-regression-render`,
      name: `${analysis.name} - Regression: Basic Render`,
      description: `Vérifie que ${analysis.name} se rend sans erreur`,
      type: 'unit',
      component: analysis.name,
      scenario: {
        given: 'Le composant reçoit les props valides',
        when: 'Le composant est rendu',
        then: 'Aucune erreur n\'est lancée'
      },
      assertions: [
        {
          type: 'visibility',
          target: 'component',
          expected: 'renders without crashing'
        }
      ]
    });
    
    return tests;
  }

  /**
   * Valide les fonctionnalités métier spécifiques à CuisineZen
   */
  async validateBusinessFeatures(): Promise<{
    productManagement: boolean;
    recipeCreation: boolean;
    barcodeScanning: boolean;
    imageUpload: boolean;
    firestoreSync: boolean;
  }> {
    console.log('🔧 Validating CuisineZen business features...');
    
    const analyses = Array.from(this.analysisCache.values());
    
    return {
      productManagement: this.validateProductManagement(analyses),
      recipeCreation: this.validateRecipeCreation(analyses),
      barcodeScanning: this.validateBarcodeScanning(analyses),
      imageUpload: this.validateImageUpload(analyses),
      firestoreSync: this.validateFirestoreSync(analyses)
    };
  }

  private validateProductManagement(analyses: ComponentAnalysis[]): boolean {
    return analyses.some(a => 
      a.name.toLowerCase().includes('product') &&
      a.interactions.some(i => i.type === 'form') &&
      a.businessLogic.some(bl => bl.feature.toLowerCase().includes('produit'))
    );
  }

  private validateRecipeCreation(analyses: ComponentAnalysis[]): boolean {
    return analyses.some(a => 
      a.name.toLowerCase().includes('recipe') &&
      a.interactions.some(i => i.type === 'form') &&
      a.businessLogic.some(bl => bl.feature.toLowerCase().includes('recette'))
    );
  }

  private validateBarcodeScanning(analyses: ComponentAnalysis[]): boolean {
    return analyses.some(a => 
      a.name.toLowerCase().includes('barcode') ||
      a.businessLogic.some(bl => bl.feature.toLowerCase().includes('scanner'))
    );
  }

  private validateImageUpload(analyses: ComponentAnalysis[]): boolean {
    return analyses.some(a => 
      a.interactions.some(i => i.type === 'upload') ||
      a.imports.includes('@/components/ui/optimized-image')
    );
  }

  private validateFirestoreSync(analyses: ComponentAnalysis[]): boolean {
    return analyses.some(a => 
      a.imports.some(imp => imp.includes('firebase')) ||
      a.businessLogic.some(bl => bl.firebaseOperations.length > 0)
    );
  }

  /**
   * Auto-correction et amélioration des tests
   */
  async autoCorrectAndImprove(testResults: any[]): Promise<{
    corrections: string[];
    improvements: string[];
    missingTests: TestCase[];
  }> {
    console.log('🛠️ Auto-correcting and improving tests...');
    
    const corrections: string[] = [];
    const improvements: string[] = [];
    const missingTests: TestCase[] = [];
    
    // Analyse des échecs de tests
    for (const result of testResults) {
      if (result.status === 'failed') {
        corrections.push(`Fix test "${result.name}": ${result.error}`);
      }
    }
    
    // Identification des gaps de couverture
    const analyses = Array.from(this.analysisCache.values());
    for (const analysis of analyses) {
      const existingTests = testResults.filter(r => r.component === analysis.name);
      
      // Vérification de la couverture des interactions
      for (const interaction of analysis.interactions) {
        const hasTest = existingTests.some(t => 
          t.name.includes(interaction.type) || 
          t.description.includes(interaction.action)
        );
        
        if (!hasTest) {
          missingTests.push(...this.generateInteractionTests(analysis));
        }
      }
    }
    
    // Suggestions d'amélioration
    improvements.push(
      'Ajouter des tests de performance pour les opérations Firebase',
      'Implémenter des tests de charge pour l\'upload d\'images',
      'Ajouter des tests de compatibilité mobile'
    );
    
    return { corrections, improvements, missingTests };
  }

  /**
   * Génère un rapport complet de l'analyse et des tests
   */
  async generateReport(analyses: ComponentAnalysis[], testCases: TestCase[]): Promise<string> {
    const report = `
# Rapport d'Analyse et de Tests - CuisineZen

## 📊 Résumé Exécutif
- **Composants analysés**: ${analyses.length}
- **Tests générés**: ${testCases.length}
- **Interactions détectées**: ${analyses.reduce((sum, a) => sum + a.interactions.length, 0)}
- **Fonctionnalités métier**: ${analyses.reduce((sum, a) => sum + a.businessLogic.length, 0)}

## 🏗️ Architecture des Composants

${analyses.map(a => `
### ${a.name}
- **Fichier**: ${a.filePath}
- **Hooks**: ${a.hooks.join(', ')}
- **Interactions**: ${a.interactions.length}
- **Logique métier**: ${a.businessLogic.map(bl => bl.feature).join(', ')}
`).join('')}

## 🧪 Tests Générés par Type

${Object.entries(testCases.reduce((acc, test) => {
  acc[test.type] = (acc[test.type] || 0) + 1;
  return acc;
}, {} as Record<string, number>)).map(([type, count]) => `- **${type}**: ${count} tests`).join('\n')}

## 🎯 Couverture des Fonctionnalités Métier

${analyses.filter(a => a.businessLogic.length > 0).map(a => `
### ${a.name}
${a.businessLogic.map(bl => `
- **${bl.feature}**
  - Flow: ${bl.flow.join(' → ')}
  - Validations: ${bl.validations.length}
  - Opérations Firebase: ${bl.firebaseOperations.length}
`).join('')}
`).join('')}

## 📝 Recommandations

1. **Tests prioritaires à implémenter**:
   - Tests E2E pour les flows critiques (ajout produit, création recette)
   - Tests de régression pour les composants les plus complexes
   - Tests d'accessibilité pour tous les composants interactifs

2. **Améliorations suggérées**:
   - Ajouter des tests de performance pour Firebase
   - Implémenter des tests de compatibilité mobile
   - Créer des tests de charge pour l'upload d'images

3. **Maintenance continue**:
   - Exécuter l'agent après chaque nouveau composant
   - Mettre à jour les tests lors des modifications d'API
   - Surveiller la couverture de code

---
*Généré automatiquement par l'Agent IA CuisineZen - ${new Date().toISOString()}*
`;

    return report;
  }
}

// Export de l'agent principal
export const testAgent = new CuisineZenTestAgent(process.cwd());