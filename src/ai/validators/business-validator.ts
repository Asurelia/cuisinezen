/**
 * Validateur de fonctionnalités métier pour CuisineZen
 * Teste tous les flows critiques de l'application
 */

import { ComponentAnalysis } from '../test-agent';

export interface BusinessValidationResult {
  feature: string;
  status: 'pass' | 'fail' | 'warning';
  details: string[];
  testCases: string[];
  coverage: number;
}

export class CuisineZenBusinessValidator {
  
  /**
   * Valide toutes les fonctionnalités métier de CuisineZen
   */
  async validateAllFeatures(analyses: ComponentAnalysis[]): Promise<BusinessValidationResult[]> {
    console.log('🏢 Validating CuisineZen business features...');
    
    const results: BusinessValidationResult[] = [];
    
    results.push(await this.validateProductManagement(analyses));
    results.push(await this.validateRecipeManagement(analyses));
    results.push(await this.validateInventoryTracking(analyses));
    results.push(await this.validateBarcodeScanning(analyses));
    results.push(await this.validateImageHandling(analyses));
    results.push(await this.validateFirestoreIntegration(analyses));
    results.push(await this.validateAnalytics(analyses));
    results.push(await this.validateUserInterface(analyses));
    
    return results;
  }

  /**
   * Valide la gestion des produits
   */
  private async validateProductManagement(analyses: ComponentAnalysis[]): Promise<BusinessValidationResult> {
    const productComponents = analyses.filter(a => 
      a.name.toLowerCase().includes('product') ||
      a.name.toLowerCase().includes('add-product') ||
      a.name.toLowerCase().includes('edit-product')
    );

    const details: string[] = [];
    const testCases: string[] = [];
    let coverage = 0;

    // Vérification de l'ajout de produit
    const addProductComponent = productComponents.find(c => c.name.includes('AddProduct'));
    if (addProductComponent) {
      details.push('✅ Composant d\'ajout de produit détecté');
      coverage += 20;
      
      // Vérifier les validations
      const hasValidation = addProductComponent.businessLogic.some(bl => 
        bl.validations.length > 0
      );
      if (hasValidation) {
        details.push('✅ Validations de formulaire présentes');
        coverage += 15;
      } else {
        details.push('⚠️ Validations de formulaire manquantes');
      }

      // Vérifier la suggestion de catégorie
      const hasAISuggestion = addProductComponent.imports.some(imp => 
        imp.includes('actions') || imp.includes('ai')
      );
      if (hasAISuggestion) {
        details.push('✅ Suggestion AI de catégorie intégrée');
        coverage += 15;
      }

      // Tests suggérés
      testCases.push(...[
        'Test d\'ajout de produit complet avec toutes les données',
        'Test de validation des champs obligatoires',
        'Test de suggestion automatique de catégorie',
        'Test d\'ajout de produit avec image',
        'Test d\'ajout de produit avec date d\'expiration',
        'Test de gestion des lots multiples'
      ]);
    } else {
      details.push('❌ Composant d\'ajout de produit non trouvé');
    }

    // Vérification de l'édition de produit
    const editProductComponent = productComponents.find(c => c.name.includes('EditProduct'));
    if (editProductComponent) {
      details.push('✅ Composant d\'édition de produit détecté');
      coverage += 20;
      
      testCases.push(...[
        'Test de modification des informations produit',
        'Test de gestion des lots existants',
        'Test de suppression de produit'
      ]);
    } else {
      details.push('⚠️ Composant d\'édition de produit non détecté');
    }

    // Vérification de l'affichage des produits
    const productDisplayComponents = analyses.filter(a => 
      a.name.includes('ProductCard') || a.name.includes('InventoryList')
    );
    if (productDisplayComponents.length > 0) {
      details.push('✅ Composants d\'affichage des produits détectés');
      coverage += 15;
      
      testCases.push(...[
        'Test d\'affichage de la liste des produits',
        'Test de filtrage par catégorie',
        'Test de recherche de produits',
        'Test d\'affichage des dates d\'expiration'
      ]);
    }

    // Vérification des catégories
    const hasCategories = analyses.some(a => 
      a.imports.some(imp => imp.includes('types')) &&
      a.interactions.some(i => i.selector.includes('category'))
    );
    if (hasCategories) {
      details.push('✅ Gestion des catégories implémentée');
      coverage += 15;
    }

    return {
      feature: 'Gestion des Produits',
      status: coverage >= 70 ? 'pass' : coverage >= 40 ? 'warning' : 'fail',
      details,
      testCases,
      coverage
    };
  }

  /**
   * Valide la gestion des recettes
   */
  private async validateRecipeManagement(analyses: ComponentAnalysis[]): Promise<BusinessValidationResult> {
    const recipeComponents = analyses.filter(a => 
      a.name.toLowerCase().includes('recipe')
    );

    const details: string[] = [];
    const testCases: string[] = [];
    let coverage = 0;

    // Vérification du formulaire de recette
    const recipeFormComponent = recipeComponents.find(c => 
      c.name.includes('RecipeForm') || c.name.includes('RecipeDialog')
    );
    if (recipeFormComponent) {
      details.push('✅ Formulaire de création/édition de recette détecté');
      coverage += 25;

      // Vérifier la gestion des ingrédients
      const hasIngredients = recipeFormComponent.interactions.some(i => 
        i.selector.includes('ingredients') || i.action.includes('ingredient')
      );
      if (hasIngredients) {
        details.push('✅ Gestion des ingrédients implémentée');
        coverage += 20;
      }

      // Vérifier les validations
      const hasValidations = recipeFormComponent.businessLogic.some(bl => 
        bl.validations.length > 0
      );
      if (hasValidations) {
        details.push('✅ Validations de recette présentes');
        coverage += 15;
      }

      testCases.push(...[
        'Test de création de recette avec ingrédients multiples',
        'Test de validation des ingrédients requis',
        'Test d\'édition de recette existante',
        'Test d\'ajout/suppression d\'ingrédients dynamique',
        'Test de calcul automatique du temps total',
        'Test d\'upload d\'image de recette'
      ]);
    } else {
      details.push('❌ Formulaire de recette non trouvé');
    }

    // Vérification de l'affichage des recettes
    const recipeDisplayComponents = recipeComponents.filter(c => 
      c.name.includes('RecipeCard') || c.name.includes('RecipeList')
    );
    if (recipeDisplayComponents.length > 0) {
      details.push('✅ Composants d\'affichage des recettes détectés');
      coverage += 20;

      testCases.push(...[
        'Test d\'affichage de la grille de recettes',
        'Test de recherche de recettes',
        'Test de filtrage par difficulté/temps',
        'Test de pagination des recettes'
      ]);
    }

    // Vérification de la logique métier recette
    const hasRecipeLogic = recipeComponents.some(c => 
      c.businessLogic.some(bl => bl.feature.toLowerCase().includes('recette'))
    );
    if (hasRecipeLogic) {
      details.push('✅ Logique métier des recettes implémentée');
      coverage += 20;
    }

    return {
      feature: 'Gestion des Recettes',
      status: coverage >= 70 ? 'pass' : coverage >= 40 ? 'warning' : 'fail',
      details,
      testCases,
      coverage
    };
  }

  /**
   * Valide le suivi d'inventaire
   */
  private async validateInventoryTracking(analyses: ComponentAnalysis[]): Promise<BusinessValidationResult> {
    const inventoryComponents = analyses.filter(a => 
      a.name.toLowerCase().includes('inventory') ||
      a.name.toLowerCase().includes('batch') ||
      a.name.toLowerCase().includes('expiry')
    );

    const details: string[] = [];
    const testCases: string[] = [];
    let coverage = 0;

    // Vérification de l'affichage de l'inventaire
    const inventoryListComponent = inventoryComponents.find(c => 
      c.name.includes('InventoryList') || c.name.includes('Inventory')
    );
    if (inventoryListComponent) {
      details.push('✅ Composant de liste d\'inventaire détecté');
      coverage += 30;

      testCases.push(...[
        'Test d\'affichage complet de l\'inventaire',
        'Test de tri par date d\'expiration',
        'Test de filtrage par catégorie',
        'Test d\'alertes d\'expiration'
      ]);
    }

    // Vérification de la gestion des lots
    const hasBatchManagement = analyses.some(a => 
      a.businessLogic.some(bl => 
        bl.flow.some(f => f.toLowerCase().includes('batch') || f.toLowerCase().includes('lot'))
      )
    );
    if (hasBatchManagement) {
      details.push('✅ Gestion des lots implémentée');
      coverage += 25;

      testCases.push(...[
        'Test d\'ajout de nouveaux lots',
        'Test de modification des quantités',
        'Test de gestion des dates d\'expiration par lot'
      ]);
    }

    // Vérification des alertes d'expiration
    const expiryComponents = analyses.filter(a => 
      a.name.toLowerCase().includes('expir') || 
      a.name.toLowerCase().includes('alert')
    );
    if (expiryComponents.length > 0) {
      details.push('✅ Système d\'alertes d\'expiration détecté');
      coverage += 25;

      testCases.push(...[
        'Test d\'alertes produits bientôt expirés',
        'Test d\'alertes produits expirés',
        'Test de notifications d\'expiration'
      ]);
    }

    // Vérification du calcul des stocks
    const hasStockCalculation = analyses.some(a => 
      a.businessLogic.some(bl => 
        bl.flow.some(f => f.toLowerCase().includes('stock') || f.toLowerCase().includes('quantit'))
      )
    );
    if (hasStockCalculation) {
      details.push('✅ Calculs de stock implémentés');
      coverage += 20;
    }

    return {
      feature: 'Suivi d\'Inventaire',
      status: coverage >= 70 ? 'pass' : coverage >= 40 ? 'warning' : 'fail',
      details,
      testCases,
      coverage
    };
  }

  /**
   * Valide le scanner de codes-barres
   */
  private async validateBarcodeScanning(analyses: ComponentAnalysis[]): Promise<BusinessValidationResult> {
    const barcodeComponents = analyses.filter(a => 
      a.name.toLowerCase().includes('barcode') ||
      a.name.toLowerCase().includes('scanner')
    );

    const details: string[] = [];
    const testCases: string[] = [];
    let coverage = 0;

    if (barcodeComponents.length > 0) {
      details.push('✅ Composant de scanner de codes-barres détecté');
      coverage += 40;

      // Vérifier l'intégration caméra
      const hasCameraIntegration = barcodeComponents.some(c => 
        c.imports.some(imp => imp.includes('zxing') || imp.includes('camera'))
      );
      if (hasCameraIntegration) {
        details.push('✅ Intégration caméra pour le scanning');
        coverage += 30;
      }

      // Vérifier la gestion des erreurs
      const hasErrorHandling = barcodeComponents.some(c => 
        c.businessLogic.some(bl => 
          bl.validations.some(v => v.toLowerCase().includes('code'))
        )
      );
      if (hasErrorHandling) {
        details.push('✅ Gestion d\'erreurs de scanning implémentée');
        coverage += 30;
      }

      testCases.push(...[
        'Test d\'ouverture du scanner de codes-barres',
        'Test de détection de code-barres valide',
        'Test de gestion des codes-barres invalides',
        'Test de permissions de caméra',
        'Test de fermeture du scanner',
        'Test d\'intégration avec l\'ajout de produit'
      ]);
    } else {
      details.push('❌ Scanner de codes-barres non détecté');
    }

    return {
      feature: 'Scanner de Codes-barres',
      status: coverage >= 70 ? 'pass' : coverage >= 40 ? 'warning' : 'fail',
      details,
      testCases,
      coverage
    };
  }

  /**
   * Valide la gestion des images
   */
  private async validateImageHandling(analyses: ComponentAnalysis[]): Promise<BusinessValidationResult> {
    const details: string[] = [];
    const testCases: string[] = [];
    let coverage = 0;

    // Vérifier les composants d'image optimisée
    const hasOptimizedImages = analyses.some(a => 
      a.imports.some(imp => imp.includes('optimized-image') || imp.includes('OptimizedImage'))
    );
    if (hasOptimizedImages) {
      details.push('✅ Composants d\'images optimisées détectés');
      coverage += 25;
    }

    // Vérifier les uploads d'images
    const hasImageUpload = analyses.some(a => 
      a.interactions.some(i => i.type === 'upload') ||
      a.imports.some(imp => imp.includes('image-upload'))
    );
    if (hasImageUpload) {
      details.push('✅ Fonctionnalité d\'upload d\'images détectée');
      coverage += 25;

      testCases.push(...[
        'Test d\'upload d\'image produit',
        'Test d\'upload d\'image recette',
        'Test de validation du format d\'image',
        'Test de compression automatique',
        'Test d\'aperçu avant upload'
      ]);
    }

    // Vérifier l'intégration Firebase Storage
    const hasFirebaseStorage = analyses.some(a => 
      a.businessLogic.some(bl => 
        bl.firebaseOperations.some(op => op.includes('upload') || op.includes('storage'))
      )
    );
    if (hasFirebaseStorage) {
      details.push('✅ Intégration Firebase Storage détectée');
      coverage += 25;

      testCases.push(...[
        'Test de sauvegarde d\'images dans Firebase Storage',
        'Test de génération d\'URLs d\'images',
        'Test de suppression d\'images du storage'
      ]);
    }

    // Vérifier l'optimisation des images
    const hasImageOptimization = analyses.some(a => 
      a.imports.some(imp => imp.includes('image-utils') || imp.includes('optimization'))
    );
    if (hasImageOptimization) {
      details.push('✅ Optimisation d\'images implémentée');
      coverage += 25;

      testCases.push(...[
        'Test de génération de placeholders blur',
        'Test de redimensionnement automatique',
        'Test de lazy loading des images'
      ]);
    }

    return {
      feature: 'Gestion des Images',
      status: coverage >= 70 ? 'pass' : coverage >= 40 ? 'warning' : 'fail',
      details,
      testCases,
      coverage
    };
  }

  /**
   * Valide l'intégration Firestore
   */
  private async validateFirestoreIntegration(analyses: ComponentAnalysis[]): Promise<BusinessValidationResult> {
    const details: string[] = [];
    const testCases: string[] = [];
    let coverage = 0;

    // Vérifier les opérations CRUD
    const hasFirestoreOps = analyses.some(a => 
      a.businessLogic.some(bl => bl.firebaseOperations.length > 0)
    );
    if (hasFirestoreOps) {
      details.push('✅ Opérations Firestore détectées');
      coverage += 30;
    }

    // Vérifier la synchronisation temps réel
    const hasRealtimeSync = analyses.some(a => 
      a.hooks.some(hook => hook.includes('useFirestore')) ||
      a.imports.some(imp => imp.includes('firebase-hooks'))
    );
    if (hasRealtimeSync) {
      details.push('✅ Synchronisation temps réel implémentée');
      coverage += 30;

      testCases.push(...[
        'Test de synchronisation temps réel des produits',
        'Test de synchronisation temps réel des recettes',
        'Test de gestion des déconnexions réseau'
      ]);
    }

    // Vérifier la gestion hors ligne
    const hasOfflineSupport = analyses.some(a => 
      a.imports.some(imp => imp.includes('offline')) ||
      a.businessLogic.some(bl => bl.flow.some(f => f.includes('offline')))
    );
    if (hasOfflineSupport) {
      details.push('✅ Support hors ligne détecté');
      coverage += 20;
    }

    // Vérifier la sécurité
    const hasSecurityRules = analyses.some(a => 
      a.businessLogic.some(bl => bl.validations.some(v => v.includes('permission')))
    );
    if (hasSecurityRules) {
      details.push('✅ Règles de sécurité implémentées');
      coverage += 20;

      testCases.push(...[
        'Test d\'accès autorisé aux données',
        'Test de refus d\'accès non autorisé',
        'Test de validation des permissions utilisateur'
      ]);
    }

    return {
      feature: 'Intégration Firestore',
      status: coverage >= 70 ? 'pass' : coverage >= 40 ? 'warning' : 'fail',
      details,
      testCases,
      coverage
    };
  }

  /**
   * Valide le système d'analytics
   */
  private async validateAnalytics(analyses: ComponentAnalysis[]): Promise<BusinessValidationResult> {
    const details: string[] = [];
    const testCases: string[] = [];
    let coverage = 0;

    // Vérifier l'intégration analytics
    const hasAnalytics = analyses.some(a => 
      a.imports.some(imp => imp.includes('analytics')) ||
      a.businessLogic.some(bl => bl.flow.some(f => f.includes('analytic')))
    );
    if (hasAnalytics) {
      details.push('✅ Système d\'analytics intégré');
      coverage += 40;

      testCases.push(...[
        'Test de tracking d\'ajout de produit',
        'Test de tracking de création de recette',
        'Test de tracking de scan de code-barres'
      ]);
    }

    // Vérifier les métriques de performance
    const hasPerformanceTracking = analyses.some(a => 
      a.imports.some(imp => imp.includes('performance'))
    );
    if (hasPerformanceTracking) {
      details.push('✅ Tracking des performances implémenté');
      coverage += 30;

      testCases.push(...[
        'Test de mesure des temps de réponse',
        'Test de tracking des erreurs',
        'Test de métriques de performance UI'
      ]);
    }

    // Vérifier les tableaux de bord
    const hasDashboard = analyses.some(a => 
      a.name.toLowerCase().includes('analytics') ||
      a.name.toLowerCase().includes('metrics')
    );
    if (hasDashboard) {
      details.push('✅ Tableaux de bord analytics détectés');
      coverage += 30;
    }

    return {
      feature: 'Système d\'Analytics',
      status: coverage >= 70 ? 'pass' : coverage >= 40 ? 'warning' : 'fail',
      details,
      testCases,
      coverage
    };
  }

  /**
   * Valide l'interface utilisateur
   */
  private async validateUserInterface(analyses: ComponentAnalysis[]): Promise<BusinessValidationResult> {
    const details: string[] = [];
    const testCases: string[] = [];
    let coverage = 0;

    // Vérifier la cohérence des composants UI
    const uiComponents = analyses.filter(a => a.filePath.includes('/ui/'));
    if (uiComponents.length > 10) {
      details.push('✅ Système de design cohérent avec composants UI');
      coverage += 25;
    }

    // Vérifier la responsivité
    const hasResponsiveDesign = analyses.some(a => 
      a.hooks.some(hook => hook.includes('mobile')) ||
      a.imports.some(imp => imp.includes('mobile'))
    );
    if (hasResponsiveDesign) {
      details.push('✅ Design responsive implémenté');
      coverage += 25;

      testCases.push(...[
        'Test de responsive design sur mobile',
        'Test de responsive design sur tablette',
        'Test d\'adaptation des dialogs sur mobile'
      ]);
    }

    // Vérifier l'accessibilité
    const hasAccessibilityFeatures = analyses.some(a => 
      a.interactions.some(i => i.selector.includes('aria-') || i.selector.includes('role='))
    );
    if (hasAccessibilityFeatures) {
      details.push('✅ Fonctionnalités d\'accessibilité détectées');
      coverage += 25;

      testCases.push(...[
        'Test de navigation au clavier',
        'Test de support des lecteurs d\'écran',
        'Test de contraste des couleurs'
      ]);
    }

    // Vérifier les interactions avancées
    const hasAdvancedInteractions = analyses.some(a => 
      a.interactions.length > 3
    );
    if (hasAdvancedInteractions) {
      details.push('✅ Interactions utilisateur riches implémentées');
      coverage += 25;
    }

    return {
      feature: 'Interface Utilisateur',
      status: coverage >= 70 ? 'pass' : coverage >= 40 ? 'warning' : 'fail',
      details,
      testCases,
      coverage
    };
  }

  /**
   * Génère un rapport de validation métier
   */
  generateBusinessValidationReport(results: BusinessValidationResult[]): string {
    const overallScore = results.reduce((sum, r) => sum + r.coverage, 0) / results.length;
    const passedFeatures = results.filter(r => r.status === 'pass').length;
    const warningFeatures = results.filter(r => r.status === 'warning').length;
    const failedFeatures = results.filter(r => r.status === 'fail').length;

    return `
# Rapport de Validation Métier - CuisineZen

## 📊 Score Global: ${overallScore.toFixed(1)}%

### 🎯 Résumé des Fonctionnalités
- ✅ **Validées**: ${passedFeatures} fonctionnalités
- ⚠️ **Partielles**: ${warningFeatures} fonctionnalités
- ❌ **Échouées**: ${failedFeatures} fonctionnalités

## 📋 Détail par Fonctionnalité

${results.map(result => `
### ${result.feature}
**Statut**: ${result.status === 'pass' ? '✅ VALIDÉ' : result.status === 'warning' ? '⚠️ PARTIEL' : '❌ ÉCHEC'}
**Couverture**: ${result.coverage}%

**Détails d'implémentation**:
${result.details.map(detail => `- ${detail}`).join('\n')}

**Tests recommandés** (${result.testCases.length} tests):
${result.testCases.map(test => `- [ ] ${test}`).join('\n')}

---
`).join('')}

## 🎯 Priorités d'Amélioration

### Actions Critiques
${results.filter(r => r.status === 'fail').map(r => `- **${r.feature}**: Implémentation requise (${r.coverage}% couverture)`).join('\n') || 'Aucune action critique requise'}

### Actions Recommandées  
${results.filter(r => r.status === 'warning').map(r => `- **${r.feature}**: Compléter l'implémentation (${r.coverage}% couverture)`).join('\n') || 'Aucune action recommandée'}

## 📈 Plan de Tests

### Tests à Implémenter en Priorité
${results.flatMap(r => r.testCases.slice(0, 3)).map(test => `- [ ] ${test}`).join('\n')}

### Tests de Régression
- [ ] Tests de non-régression sur toutes les fonctionnalités validées
- [ ] Tests de performance sur les opérations critiques
- [ ] Tests d'intégration cross-fonctionnalités

---
*Généré le ${new Date().toLocaleString('fr-FR')} par l'Agent IA CuisineZen*
`;
  }
}

export const businessValidator = new CuisineZenBusinessValidator();