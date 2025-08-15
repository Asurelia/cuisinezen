/**
 * Script de test simple pour l'Agent IA CuisineZen
 * Version JavaScript pour éviter les problèmes de dépendances
 */

const fs = require('fs').promises;
const path = require('path');

// Simulation de l'agent IA
class SimpleTestAgent {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.componentsDir = path.join(projectRoot, 'src', 'components');
  }

  async scanComponents() {
    console.log('🔍 Scanning CuisineZen components...');
    
    try {
      const componentFiles = await this.findComponentFiles();
      const components = [];
      
      for (const filePath of componentFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const analysis = this.analyzeComponent(filePath, content);
          components.push(analysis);
        } catch (error) {
          console.warn(`⚠️ Could not analyze ${filePath}`);
        }
      }
      
      return components;
    } catch (error) {
      console.error('❌ Error scanning components:', error.message);
      return [];
    }
  }

  async findComponentFiles() {
    const files = [];
    
    async function scanDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Ignore errors for non-existent directories
      }
    }
    
    await scanDirectory(this.componentsDir);
    return files;
  }

  analyzeComponent(filePath, content) {
    const name = path.basename(filePath, path.extname(filePath));
    
    return {
      name,
      filePath: path.relative(this.projectRoot, filePath),
      size: content.length,
      hasForm: content.includes('useForm') || content.includes('<form'),
      hasDialog: content.includes('Dialog'),
      hasFirebase: content.includes('firebase') || content.includes('firestore'),
      hasValidation: content.includes('zod') || content.includes('zodResolver'),
      hasHooks: this.extractHooks(content),
      interactions: this.countInteractions(content),
      businessLogic: this.detectBusinessLogic(name, content)
    };
  }

  extractHooks(content) {
    const hooks = [];
    const hookPattern = /use[A-Z]\w*/g;
    let match;
    
    while ((match = hookPattern.exec(content)) !== null) {
      if (!hooks.includes(match[0])) {
        hooks.push(match[0]);
      }
    }
    
    return hooks;
  }

  countInteractions(content) {
    let count = 0;
    
    // Count buttons
    count += (content.match(/<Button/g) || []).length;
    
    // Count inputs
    count += (content.match(/<Input/g) || []).length;
    
    // Count selects
    count += (content.match(/<Select/g) || []).length;
    
    // Count file uploads
    count += (content.match(/type="file"/g) || []).length;
    
    return count;
  }

  detectBusinessLogic(name, content) {
    const features = [];
    
    if (name.toLowerCase().includes('product')) {
      features.push('Product Management');
    }
    
    if (name.toLowerCase().includes('recipe')) {
      features.push('Recipe Management');
    }
    
    if (name.toLowerCase().includes('barcode') || content.includes('scanner')) {
      features.push('Barcode Scanning');
    }
    
    if (content.includes('upload') || content.includes('fileInputRef')) {
      features.push('File Upload');
    }
    
    if (content.includes('analytics')) {
      features.push('Analytics Tracking');
    }
    
    return features;
  }

  generateTestSuggestions(components) {
    const suggestions = [];
    
    for (const component of components) {
      if (component.hasForm) {
        suggestions.push({
          component: component.name,
          type: 'Form Validation Test',
          description: `Test form submission and validation for ${component.name}`,
          priority: 'high'
        });
      }
      
      if (component.hasDialog) {
        suggestions.push({
          component: component.name,
          type: 'Dialog Interaction Test',
          description: `Test dialog open/close and user interactions for ${component.name}`,
          priority: 'medium'
        });
      }
      
      if (component.businessLogic.length > 0) {
        suggestions.push({
          component: component.name,
          type: 'Business Logic Test',
          description: `Test business logic: ${component.businessLogic.join(', ')}`,
          priority: 'critical'
        });
      }
      
      if (component.interactions > 5) {
        suggestions.push({
          component: component.name,
          type: 'Performance Test',
          description: `Test performance for complex component with ${component.interactions} interactions`,
          priority: 'medium'
        });
      }
    }
    
    return suggestions;
  }

  validateBusinessFeatures(components) {
    const features = {
      'Product Management': false,
      'Recipe Management': false,
      'Barcode Scanning': false,
      'File Upload': false,
      'Analytics Tracking': false,
      'Form Validation': false,
      'Firebase Integration': false
    };
    
    for (const component of components) {
      component.businessLogic.forEach(logic => {
        if (features.hasOwnProperty(logic)) {
          features[logic] = true;
        }
      });
      
      if (component.hasValidation) {
        features['Form Validation'] = true;
      }
      
      if (component.hasFirebase) {
        features['Firebase Integration'] = true;
      }
    }
    
    return features;
  }

  generateReport(components, suggestions, features) {
    const totalComponents = components.length;
    const totalInteractions = components.reduce((sum, c) => sum + c.interactions, 0);
    const complexComponents = components.filter(c => c.interactions > 3).length;
    const validatedFeatures = Object.values(features).filter(Boolean).length;
    const totalFeatures = Object.keys(features).length;
    const qualityScore = Math.round((validatedFeatures / totalFeatures) * 100);
    
    return {
      summary: {
        totalComponents,
        totalInteractions,
        complexComponents,
        validatedFeatures,
        totalFeatures,
        qualityScore,
        suggestedTests: suggestions.length
      },
      components,
      suggestions,
      features
    };
  }
}

async function runDemo() {
  console.log('🚀 CuisineZen AI Agent Demo');
  console.log('============================\n');

  const agent = new SimpleTestAgent(process.cwd());
  
  try {
    // 1. Scan components
    console.log('📱 1. Scanning React components...');
    const components = await agent.scanComponents();
    console.log(`   Found ${components.length} components\n`);

    if (components.length === 0) {
      console.log('⚠️ No components found. Make sure you\'re in the CuisineZen project root.');
      return;
    }

    // 2. Analyze most complex components
    console.log('🔍 2. Most complex components:');
    const sortedComponents = components
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 5);
    
    sortedComponents.forEach(comp => {
      console.log(`   📦 ${comp.name}: ${comp.interactions} interactions, ${comp.businessLogic.length} business features`);
    });
    console.log();

    // 3. Generate test suggestions
    console.log('🧪 3. Generating test suggestions...');
    const suggestions = agent.generateTestSuggestions(components);
    const criticalTests = suggestions.filter(s => s.priority === 'critical');
    const highTests = suggestions.filter(s => s.priority === 'high');
    
    console.log(`   🚨 Critical: ${criticalTests.length} tests`);
    console.log(`   🔥 High: ${highTests.length} tests`);
    console.log(`   📊 Total suggested: ${suggestions.length} tests\n`);

    // 4. Validate business features
    console.log('🏢 4. Business feature validation:');
    const features = agent.validateBusinessFeatures(components);
    
    Object.entries(features).forEach(([feature, validated]) => {
      const emoji = validated ? '✅' : '❌';
      console.log(`   ${emoji} ${feature}`);
    });
    console.log();

    // 5. Generate final report
    console.log('📋 5. Final report:');
    const report = agent.generateReport(components, suggestions, features);
    
    console.log(`   📊 Quality Score: ${report.summary.qualityScore}%`);
    console.log(`   📱 Components: ${report.summary.totalComponents}`);
    console.log(`   🎯 Interactions: ${report.summary.totalInteractions}`);
    console.log(`   🏗️ Complex components: ${report.summary.complexComponents}`);
    console.log(`   ✅ Validated features: ${report.summary.validatedFeatures}/${report.summary.totalFeatures}`);
    console.log(`   🧪 Suggested tests: ${report.summary.suggestedTests}\n`);

    // 6. Top recommendations
    console.log('🎯 6. Top recommendations:');
    
    if (criticalTests.length > 0) {
      console.log('   🚨 CRITICAL:');
      criticalTests.slice(0, 3).forEach(test => {
        console.log(`      • ${test.description}`);
      });
    }
    
    if (highTests.length > 0) {
      console.log('   🔥 HIGH PRIORITY:');
      highTests.slice(0, 3).forEach(test => {
        console.log(`      • ${test.description}`);
      });
    }

    console.log('\n✨ Demo completed successfully!');
    console.log('\n🚀 Next steps:');
    console.log('   1. Install test dependencies (Playwright, Testing Library)');
    console.log('   2. Implement the suggested critical tests');
    console.log('   3. Set up CI/CD integration');
    console.log('   4. Run the full TypeScript agent for complete analysis');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { SimpleTestAgent, runDemo };