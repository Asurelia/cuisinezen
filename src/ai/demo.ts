/**
 * Démonstration de l'Agent IA CuisineZen
 * Exécute l'analyse complète et affiche les résultats
 */

import { cuisineZenAgent } from './cuisinezen-ai-agent';

async function runDemo() {
  console.log('🚀 Démonstration Agent IA CuisineZen');
  console.log('=====================================\n');

  try {
    // 1. Statistiques rapides
    console.log('📊 1. Statistiques du projet...');
    const stats = await cuisineZenAgent.getQuickStats();
    console.log(`   📱 Composants: ${stats.components}`);
    console.log(`   🎯 Interactions: ${stats.interactions}`);
    console.log(`   🏢 Fonctionnalités métier: ${stats.businessFeatures}`);
    console.log(`   ⏱️ Temps estimé: ${stats.estimatedTestTime}\n`);

    // 2. Analyse rapide
    console.log('⚡ 2. Analyse rapide...');
    const quickResults = await cuisineZenAgent.runQuickAnalysis();
    
    if (quickResults.analysis && quickResults.validation) {
      console.log(`   ✅ Composants analysés: ${quickResults.analysis.totalComponents}`);
      console.log(`   📊 Score qualité: ${quickResults.validation.overallScore.toFixed(1)}%`);
      console.log(`   ✅ Fonctionnalités validées: ${quickResults.validation.passedFeatures}`);
      console.log(`   ⚠️ Fonctionnalités partielles: ${quickResults.validation.results.filter(r => r.status === 'warning').length}`);
      console.log(`   ❌ Fonctionnalités échouées: ${quickResults.validation.failedFeatures}\n`);
    }

    // 3. Tests pour composants spécifiques
    console.log('🎯 3. Génération de tests spécifiques...');
    try {
      const specificTests = await cuisineZenAgent.generateTestsForComponents(['AddProductDialog', 'RecipeFormDialog']);
      console.log(`   🧪 Tests générés: ${specificTests.testCases.length}`);
      console.log(`   📝 Code E2E généré: ${specificTests.e2eCode.length > 0 ? 'Oui' : 'Non'}\n`);
    } catch (error) {
      console.log(`   ⚠️ Composants spécifiques non trouvés, utilisation de tous les composants\n`);
    }

    // 4. Validation de fonctionnalités spécifiques
    console.log('🔍 4. Validation des fonctionnalités critiques...');
    try {
      const criticalFeatures = await cuisineZenAgent.validateSpecificFeatures([
        'Gestion des Produits',
        'Gestion des Recettes',
        'Scanner de Codes-barres'
      ]);
      
      criticalFeatures.forEach(feature => {
        const emoji = feature.status === 'pass' ? '✅' : feature.status === 'warning' ? '⚠️' : '❌';
        console.log(`   ${emoji} ${feature.feature}: ${feature.coverage}%`);
      });
      console.log();
    } catch (error) {
      console.log(`   ⚠️ Erreur validation spécifique: ${error}\n`);
    }

    // 5. Analyse complète (optionnelle)
    const runFullAnalysis = process.argv.includes('--full');
    if (runFullAnalysis) {
      console.log('🔬 5. Analyse complète (cela peut prendre quelques minutes)...');
      const fullResults = await cuisineZenAgent.runFullAnalysis();
      
      console.log('\n🎉 Résultats de l\'analyse complète:');
      console.log(`   📱 Composants: ${fullResults.analysis.totalComponents}`);
      console.log(`   🎯 Interactions: ${fullResults.analysis.totalInteractions}`);
      console.log(`   🧪 Tests générés: ${fullResults.tests.generated.length}`);
      console.log(`   📊 Score final: ${fullResults.validation.overallScore.toFixed(1)}%`);
      console.log(`   🔧 Améliorations suggérées: ${fullResults.improvements.suggestions.length}`);
      console.log(`   📋 Gaps de couverture: ${fullResults.improvements.coverageGaps.length}`);
      
      console.log('\n📋 Recommandations principales:');
      fullResults.improvements.recommendations.slice(0, 3).forEach(rec => {
        console.log(`   • ${rec}`);
      });
      
      console.log(`\n📁 Fichiers générés dans: tests/ai-generated/`);
    } else {
      console.log('💡 5. Pour l\'analyse complète, ajoutez --full');
    }

    console.log('\n✨ Démonstration terminée avec succès!');
    console.log('\n🚀 Commandes disponibles:');
    console.log('   npm run ai:analyze  - Analyse complète');
    console.log('   npm run ai:quick    - Analyse rapide');
    console.log('   npm run ai:stats    - Statistiques');
    console.log('   tsx src/ai/demo.ts --full  - Démo complète');

  } catch (error) {
    console.error('❌ Erreur lors de la démonstration:', error);
    process.exit(1);
  }
}

// Exécuter la démo
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };