#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script d'initialisation rapide du système QA CuisineZen
 */
class QAInitializer {
  constructor() {
    this.projectRoot = process.cwd();
    this.qaPath = path.join(this.projectRoot, 'qa-automation');
  }

  async initialize() {
    console.log('🚀 Initialisation du système QA CuisineZen...');
    
    try {
      await this.checkPrerequisites();
      await this.setupDirectories();
      await this.runInitialScan();
      await this.generateInitialTests();
      await this.createSampleConfiguration();
      await this.runInitialAudit();
      
      console.log('✅ Système QA initialisé avec succès !');
      this.printNextSteps();
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation :', error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Vérification des prérequis...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      throw new Error('Node.js 18+ requis. Version actuelle : ' + nodeVersion);
    }
    
    // Check if package.json exists
    if (!fs.existsSync(path.join(this.projectRoot, 'package.json'))) {
      throw new Error('package.json non trouvé. Exécutez ce script depuis la racine du projet.');
    }
    
    // Check if src directory exists
    if (!fs.existsSync(path.join(this.projectRoot, 'src'))) {
      throw new Error('Répertoire src/ non trouvé. Ce script est conçu pour les projets Next.js.');
    }
    
    console.log('✅ Prérequis validés');
  }

  async setupDirectories() {
    console.log('📁 Configuration des répertoires...');
    
    const directories = [
      'reports',
      'reports/coverage',
      'reports/lighthouse',
      'reports/mutation',
      'reports/gates',
      'tests/generated',
      'templates'
    ];
    
    directories.forEach(dir => {
      const fullPath = path.join(this.qaPath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
    
    console.log('✅ Structure de répertoires créée');
  }

  async runInitialScan() {
    console.log('🔍 Scan initial des composants...');
    
    try {
      execSync('npm run qa:scan-components', { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
      console.log('✅ Scan des composants terminé');
    } catch (error) {
      console.warn('⚠️ Erreur lors du scan des composants:', error.message);
    }
  }

  async generateInitialTests() {
    console.log('🧪 Génération des tests initiaux...');
    
    try {
      execSync('npm run qa:generate-tests', { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
      console.log('✅ Tests générés');
    } catch (error) {
      console.warn('⚠️ Erreur lors de la génération des tests:', error.message);
    }
  }

  async createSampleConfiguration() {
    console.log('⚙️ Création de la configuration d\'exemple...');
    
    // Create .env.qa.example
    const qaEnvExample = `# Configuration QA pour CuisineZen
# Copiez ce fichier vers .env.local pour les tests

# Firebase Emulators
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199

# Test Environment
NODE_ENV=test
NEXT_PUBLIC_APP_ENV=test

# AI Testing (optionnel)
# OPENAI_API_KEY=your_openai_key
# ANTHROPIC_API_KEY=your_anthropic_key

# Lighthouse CI (optionnel)
# LHCI_GITHUB_APP_TOKEN=your_token

# Slack Notifications (optionnel)
# SLACK_WEBHOOK=your_webhook_url
`;
    
    fs.writeFileSync(
      path.join(this.projectRoot, '.env.qa.example'),
      qaEnvExample
    );
    
    console.log('✅ Configuration d\'exemple créée');
  }

  async runInitialAudit() {
    console.log('🔍 Audit initial de qualité...');
    
    try {
      execSync('npm run qa:ai-audit', { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
      console.log('✅ Audit initial terminé');
    } catch (error) {
      console.warn('⚠️ Erreur lors de l\'audit initial:', error.message);
    }
  }

  printNextSteps() {
    console.log('\n📋 Prochaines étapes :');
    console.log('═'.repeat(50));
    console.log('1. Copiez .env.qa.example vers .env.local');
    console.log('2. Configurez les émulateurs Firebase si nécessaire');
    console.log('3. Lancez les tests : npm run test');
    console.log('4. Vérifiez les gates de qualité : npm run gates:check');
    console.log('5. Consultez les rapports dans qa-automation/reports/');
    console.log('');
    console.log('📚 Documentation :');
    console.log('   - README: qa-automation/README.md');
    console.log('   - Policies DoD: qa-automation/policies/cuisinezen-dod.yaml');
    console.log('   - Configuration: qa-automation/configs/');
    console.log('');
    console.log('🚀 Pour lancer tous les gates de qualité :');
    console.log('   npm run gates:all');
    console.log('');
    console.log('🆘 En cas de problème :');
    console.log('   npm run gates:check  # Diagnostic des gates');
    console.log('   npm run qa:ai-audit  # Audit détaillé');
  }
}

// Exécuter l'initialisation si le script est appelé directement
if (require.main === module) {
  const initializer = new QAInitializer();
  initializer.initialize().catch(console.error);
}

module.exports = QAInitializer;