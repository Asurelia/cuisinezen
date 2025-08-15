#!/usr/bin/env node

/**
 * Script de maintenance pour Firebase Storage
 * 
 * Fonctionnalités :
 * - Nettoyage des images non utilisées
 * - Optimisation des images existantes
 * - Statistiques d'utilisation
 * - Vérification de l'intégrité
 */

import { imageService } from '@/services/image.service';
import { storageService } from '@/services/storage.service';
import { cacheService } from '@/services/cache.service';

interface MaintenanceOptions {
  dryRun?: boolean;
  verbose?: boolean;
  category?: 'product' | 'recipe' | 'all';
}

class StorageMaintenance {
  private options: MaintenanceOptions;

  constructor(options: MaintenanceOptions = {}) {
    this.options = {
      dryRun: false,
      verbose: false,
      category: 'all',
      ...options
    };
  }

  private log(message: string, force = false) {
    if (this.options.verbose || force) {
      console.log(`[${new Date().toISOString()}] ${message}`);
    }
  }

  /**
   * Exécute un nettoyage complet
   */
  async cleanup(usedImages: {
    products: string[];
    recipes: string[];
  }): Promise<void> {
    this.log('🧹 Début du nettoyage...', true);

    const categories = this.options.category === 'all' 
      ? ['product', 'recipe'] as const
      : [this.options.category] as const;

    let totalDeleted = 0;

    for (const category of categories) {
      this.log(`📁 Nettoyage de la catégorie: ${category}`);
      
      const used = category === 'product' ? usedImages.products : usedImages.recipes;
      const allImages = await storageService.listImages(category);
      const unused = allImages.filter(id => !used.includes(id));

      this.log(`   - Images totales: ${allImages.length}`);
      this.log(`   - Images utilisées: ${used.length}`);
      this.log(`   - Images non utilisées: ${unused.length}`);

      if (unused.length === 0) {
        this.log('   ✅ Aucune image à supprimer');
        continue;
      }

      if (this.options.dryRun) {
        this.log(`   🔍 [DRY RUN] Supprimerait ${unused.length} images:`, true);
        unused.forEach(id => this.log(`     - ${id}`));
      } else {
        this.log(`   🗑️  Suppression de ${unused.length} images...`);
        
        for (const imageId of unused) {
          try {
            await storageService.deleteImage(category, imageId);
            totalDeleted++;
            this.log(`     ✅ Supprimé: ${imageId}`);
          } catch (error) {
            this.log(`     ❌ Erreur lors de la suppression de ${imageId}: ${error}`);
          }
        }
      }
    }

    if (!this.options.dryRun) {
      // Nettoyer le cache
      this.log('🧽 Nettoyage du cache...');
      cacheService.clearCache();
    }

    this.log(`✨ Nettoyage terminé. ${totalDeleted} images supprimées.`, true);
  }

  /**
   * Optimise toutes les images existantes
   */
  async optimizeAll(): Promise<void> {
    this.log('⚡ Début de l\'optimisation...', true);

    const categories = this.options.category === 'all' 
      ? ['product', 'recipe'] as const
      : [this.options.category] as const;

    let totalOptimized = 0;

    for (const category of categories) {
      this.log(`📁 Optimisation de la catégorie: ${category}`);
      
      const allImages = await storageService.listImages(category);
      this.log(`   - Images à optimiser: ${allImages.length}`);

      if (this.options.dryRun) {
        this.log(`   🔍 [DRY RUN] Optimiserait ${allImages.length} images`, true);
        continue;
      }

      for (const imageId of allImages) {
        try {
          this.log(`     🔄 Optimisation: ${imageId}`);
          await storageService.optimizeImage(category, imageId);
          totalOptimized++;
          this.log(`     ✅ Optimisé: ${imageId}`);
        } catch (error) {
          this.log(`     ❌ Erreur lors de l'optimisation de ${imageId}: ${error}`);
        }
      }
    }

    this.log(`✨ Optimisation terminée. ${totalOptimized} images optimisées.`, true);
  }

  /**
   * Affiche les statistiques détaillées
   */
  async showStats(): Promise<void> {
    this.log('📊 Collecte des statistiques...', true);

    try {
      const stats = await imageService.getUsageStats();
      const health = await imageService.healthCheck();

      console.log('\n📈 STATISTIQUES D\'UTILISATION');
      console.log('================================');
      console.log(`Images totales: ${stats.totalImages}`);
      console.log(`├─ Produits: ${stats.categoryBreakdown.product}`);
      console.log(`└─ Recettes: ${stats.categoryBreakdown.recipe}`);
      
      console.log('\n💾 CACHE');
      console.log('=======');
      console.log(`Entrées en cache: ${stats.cacheStats.size}/${stats.cacheStats.maxSize}`);
      console.log(`Taux de réussite: ${stats.cacheStats.hitRate}%`);
      
      console.log('\n💽 STOCKAGE');
      console.log('===========');
      console.log(`Utilisation estimée: ${stats.storageUsage.estimated}`);
      
      console.log('\n🏥 ÉTAT DES SERVICES');
      console.log('===================');
      console.log(`Storage: ${health.storage ? '✅ OK' : '❌ Erreur'}`);
      console.log(`Cache: ${health.cache ? '✅ OK' : '❌ Erreur'}`);
      
      if (health.errors.length > 0) {
        console.log('\n⚠️  ERREURS DÉTECTÉES');
        console.log('====================');
        health.errors.forEach(error => console.log(`- ${error}`));
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la collecte des statistiques:', error);
    }
  }

  /**
   * Vérifie l'intégrité des données
   */
  async checkIntegrity(): Promise<void> {
    this.log('🔍 Vérification de l\'intégrité...', true);

    const categories = this.options.category === 'all' 
      ? ['product', 'recipe'] as const
      : [this.options.category] as const;

    const issues: string[] = [];

    for (const category of categories) {
      this.log(`📁 Vérification de la catégorie: ${category}`);
      
      const allImages = await storageService.listImages(category);
      
      for (const imageId of allImages) {
        try {
          const urls = await storageService.getAllImageUrls(category, imageId);
          
          // Vérifier que toutes les tailles existent
          const sizes = ['original', 'large', 'medium', 'small'] as const;
          const missingSizes = sizes.filter(size => !urls[size]);
          
          if (missingSizes.length > 0) {
            issues.push(`${category}/${imageId}: Tailles manquantes: ${missingSizes.join(', ')}`);
          }
          
          this.log(`     ✅ ${imageId}: OK`);
        } catch (error) {
          issues.push(`${category}/${imageId}: Erreur d'accès - ${error}`);
          this.log(`     ❌ ${imageId}: Erreur`);
        }
      }
    }

    if (issues.length === 0) {
      this.log('✅ Aucun problème d\'intégrité détecté', true);
    } else {
      this.log(`❌ ${issues.length} problèmes détectés:`, true);
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
  }

  /**
   * Exécute toutes les tâches de maintenance
   */
  async runAll(usedImages: {
    products: string[];
    recipes: string[];
  }): Promise<void> {
    console.log('🚀 MAINTENANCE COMPLÈTE DE FIREBASE STORAGE');
    console.log('===========================================\n');

    await this.showStats();
    await this.checkIntegrity();
    await this.cleanup(usedImages);
    
    if (!this.options.dryRun) {
      await this.optimizeAll();
    }

    console.log('\n✨ Maintenance terminée!');
  }
}

// Interface CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const options: MaintenanceOptions = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    category: args.includes('--products') ? 'product' 
             : args.includes('--recipes') ? 'recipe' 
             : 'all'
  };

  const maintenance = new StorageMaintenance(options);

  // Images utilisées (à adapter selon votre base de données)
  const usedImages = {
    products: [], // Récupérer depuis votre DB
    recipes: []   // Récupérer depuis votre DB
  };

  try {
    switch (command) {
      case 'cleanup':
        await maintenance.cleanup(usedImages);
        break;
      case 'optimize':
        await maintenance.optimizeAll();
        break;
      case 'stats':
        await maintenance.showStats();
        break;
      case 'check':
        await maintenance.checkIntegrity();
        break;
      case 'all':
        await maintenance.runAll(usedImages);
        break;
      default:
        console.log(`
Usage: node storage-maintenance.js <command> [options]

Commands:
  cleanup   - Supprime les images non utilisées
  optimize  - Régénère les thumbnails
  stats     - Affiche les statistiques
  check     - Vérifie l'intégrité
  all       - Exécute toutes les tâches

Options:
  --dry-run    - Simule les actions sans les exécuter
  --verbose    - Affichage détaillé
  --products   - Traite uniquement les produits
  --recipes    - Traite uniquement les recettes

Examples:
  node storage-maintenance.js stats
  node storage-maintenance.js cleanup --dry-run --verbose
  node storage-maintenance.js all --products
        `);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Export pour utilisation programmatique
export { StorageMaintenance, type MaintenanceOptions };

// Exécution CLI si appelé directement
if (require.main === module) {
  main();
}