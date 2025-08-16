#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

/**
 * CuisineZen Component Scanner
 * Scans React components to map structure, props, and testing opportunities
 */
class ComponentScanner {
  constructor() {
    this.components = new Map();
    this.srcPath = path.join(process.cwd(), 'src');
    this.outputPath = path.join(process.cwd(), 'qa-automation/reports');
    this.cuisineZenFeatures = [
      'inventory',
      'recipe',
      'barcode',
      'analytics',
      'product',
      'auth',
      'image',
      'upload'
    ];
  }

  async scanAll() {
    console.log('🔍 Starting CuisineZen component scan...');
    
    await this.scanDirectory(path.join(this.srcPath, 'components'));
    await this.scanDirectory(path.join(this.srcPath, 'app'));
    await this.scanDirectory(path.join(this.srcPath, 'hooks'));
    
    const report = this.generateReport();
    await this.saveReport(report);
    
    console.log(`✅ Scan completed. Found ${this.components.size} components.`);
    console.log(`📊 Report saved to: ${this.outputPath}/component-map.json`);
  }

  async scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (this.isReactFile(file.name)) {
        await this.scanFile(fullPath);
      }
    }
  }

  isReactFile(filename) {
    return /\.(tsx|jsx)$/.test(filename) && !filename.includes('.test.') && !filename.includes('.spec.');
  }

  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy']
      });

      const componentInfo = {
        filePath: path.relative(process.cwd(), filePath),
        components: [],
        hooks: [],
        features: [],
        testability: {
          score: 0,
          issues: [],
          suggestions: []
        }
      };

      traverse(ast, {
        // Scan React functional components
        FunctionDeclaration: (path) => {
          if (this.isReactComponent(path.node)) {
            const component = this.analyzeComponent(path.node, content);
            componentInfo.components.push(component);
          }
        },
        
        // Scan arrow function components
        VariableDeclarator: (path) => {
          if (path.node.init && 
              (path.node.init.type === 'ArrowFunctionExpression' || 
               path.node.init.type === 'FunctionExpression')) {
            if (this.isReactComponent(path.node.init)) {
              const component = this.analyzeComponent(path.node.init, content, path.node.id.name);
              componentInfo.components.push(component);
            }
          }
        },

        // Scan custom hooks
        FunctionDeclaration: (path) => {
          if (this.isCustomHook(path.node)) {
            const hook = this.analyzeHook(path.node);
            componentInfo.hooks.push(hook);
          }
        }
      });

      // Identify CuisineZen specific features
      componentInfo.features = this.identifyFeatures(filePath, content);
      
      // Calculate testability score
      componentInfo.testability = this.calculateTestability(componentInfo, content);

      this.components.set(filePath, componentInfo);

    } catch (error) {
      console.warn(`⚠️ Error scanning ${filePath}:`, error.message);
    }
  }

  isReactComponent(node) {
    // Check if function returns JSX
    if (node.body && node.body.type === 'BlockStatement') {
      return node.body.body.some(stmt => 
        stmt.type === 'ReturnStatement' && 
        stmt.argument && 
        (stmt.argument.type === 'JSXElement' || stmt.argument.type === 'JSXFragment')
      );
    }
    
    // Arrow function returning JSX
    if (node.body && (node.body.type === 'JSXElement' || node.body.type === 'JSXFragment')) {
      return true;
    }

    return false;
  }

  isCustomHook(node) {
    return node.id && node.id.name && node.id.name.startsWith('use');
  }

  analyzeComponent(node, content, name = null) {
    const componentName = name || node.id?.name || 'Anonymous';
    
    return {
      name: componentName,
      type: this.getComponentType(componentName),
      props: this.extractProps(node),
      hooks: this.extractHooksUsage(content),
      complexity: this.calculateComplexity(node),
      hasTests: this.hasExistingTests(componentName),
      testPriority: this.getTestPriority(componentName),
      features: this.getComponentFeatures(componentName, content)
    };
  }

  analyzeHook(node) {
    return {
      name: node.id.name,
      parameters: node.params.map(param => param.name || 'unknown'),
      complexity: this.calculateComplexity(node),
      hasTests: this.hasExistingTests(node.id.name)
    };
  }

  getComponentType(name) {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('card')) return 'card';
    if (lowerName.includes('dialog') || lowerName.includes('modal')) return 'dialog';
    if (lowerName.includes('form')) return 'form';
    if (lowerName.includes('list')) return 'list';
    if (lowerName.includes('button')) return 'button';
    if (lowerName.includes('input')) return 'input';
    if (lowerName.includes('nav') || lowerName.includes('sidebar')) return 'navigation';
    if (lowerName.includes('page')) return 'page';
    if (lowerName.includes('layout')) return 'layout';
    
    return 'component';
  }

  extractProps(node) {
    const props = [];
    
    if (node.params && node.params[0] && node.params[0].type === 'ObjectPattern') {
      node.params[0].properties.forEach(prop => {
        if (prop.key) {
          props.push({
            name: prop.key.name,
            required: !prop.value || prop.value.type !== 'AssignmentPattern',
            defaultValue: prop.value?.right?.value || null
          });
        }
      });
    }
    
    return props;
  }

  extractHooksUsage(content) {
    const hooks = [];
    const hookMatches = content.match(/use[A-Z][a-zA-Z]*\(/g);
    
    if (hookMatches) {
      hookMatches.forEach(match => {
        const hookName = match.slice(0, -1);
        if (!hooks.includes(hookName)) {
          hooks.push(hookName);
        }
      });
    }
    
    return hooks;
  }

  calculateComplexity(node) {
    let complexity = 1;
    
    // Count conditional statements, loops, etc.
    traverse(node, {
      IfStatement: () => complexity++,
      ConditionalExpression: () => complexity++,
      LogicalExpression: () => complexity++,
      ForStatement: () => complexity++,
      WhileStatement: () => complexity++,
      SwitchCase: () => complexity++
    });
    
    return complexity;
  }

  hasExistingTests(componentName) {
    const testPatterns = [
      `${componentName.toLowerCase()}.test.tsx`,
      `${componentName.toLowerCase()}.spec.tsx`,
      `${componentName}.test.tsx`,
      `${componentName}.spec.tsx`
    ];
    
    return testPatterns.some(pattern => {
      const testPath = path.join(process.cwd(), 'qa-automation', 'tests', '**', pattern);
      return fs.existsSync(testPath);
    });
  }

  getTestPriority(componentName) {
    const lowerName = componentName.toLowerCase();
    
    // High priority CuisineZen components
    if (lowerName.includes('product') || lowerName.includes('recipe') || 
        lowerName.includes('barcode') || lowerName.includes('analytics')) {
      return 'high';
    }
    
    // Medium priority UI components
    if (lowerName.includes('dialog') || lowerName.includes('form') || 
        lowerName.includes('card')) {
      return 'medium';
    }
    
    return 'low';
  }

  getComponentFeatures(componentName, content) {
    const features = [];
    const lowerName = componentName.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    this.cuisineZenFeatures.forEach(feature => {
      if (lowerName.includes(feature) || lowerContent.includes(feature)) {
        features.push(feature);
      }
    });
    
    return features;
  }

  identifyFeatures(filePath, content) {
    const features = [];
    const lowerPath = filePath.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    this.cuisineZenFeatures.forEach(feature => {
      if (lowerPath.includes(feature) || lowerContent.includes(feature)) {
        features.push(feature);
      }
    });
    
    return features;
  }

  calculateTestability(componentInfo, content) {
    let score = 0;
    const issues = [];
    const suggestions = [];
    
    // Base score for having components
    score += componentInfo.components.length * 10;
    
    // Bonus for existing tests
    componentInfo.components.forEach(comp => {
      if (comp.hasTests) score += 20;
      else issues.push(`Missing tests for ${comp.name}`);
    });
    
    // Penalty for high complexity
    componentInfo.components.forEach(comp => {
      if (comp.complexity > 10) {
        score -= 10;
        issues.push(`High complexity in ${comp.name} (${comp.complexity})`);
        suggestions.push(`Consider breaking down ${comp.name} into smaller components`);
      }
    });
    
    // Bonus for using testing-friendly patterns
    if (content.includes('data-testid')) score += 10;
    if (content.includes('aria-label')) score += 10;
    if (content.includes('role=')) score += 5;
    
    // Suggestions for improvement
    if (!content.includes('data-testid')) {
      suggestions.push('Add data-testid attributes for better E2E testing');
    }
    if (!content.includes('aria-')) {
      suggestions.push('Add ARIA attributes for accessibility testing');
    }
    
    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      suggestions
    };
  }

  generateReport() {
    const componentsByFeature = {};
    const componentsByType = {};
    const testCoverage = {
      total: 0,
      tested: 0,
      untested: []
    };
    
    this.components.forEach((info, filePath) => {
      info.components.forEach(comp => {
        testCoverage.total++;
        if (comp.hasTests) {
          testCoverage.tested++;
        } else {
          testCoverage.untested.push({
            name: comp.name,
            filePath: info.filePath,
            priority: comp.testPriority
          });
        }
        
        // Group by features
        comp.features.forEach(feature => {
          if (!componentsByFeature[feature]) componentsByFeature[feature] = [];
          componentsByFeature[feature].push({
            name: comp.name,
            filePath: info.filePath,
            complexity: comp.complexity
          });
        });
        
        // Group by type
        if (!componentsByType[comp.type]) componentsByType[comp.type] = [];
        componentsByType[comp.type].push({
          name: comp.name,
          filePath: info.filePath
        });
      });
    });
    
    return {
      scanDate: new Date().toISOString(),
      summary: {
        totalFiles: this.components.size,
        totalComponents: testCoverage.total,
        testCoverage: {
          percentage: testCoverage.total > 0 ? (testCoverage.tested / testCoverage.total * 100).toFixed(2) : 0,
          tested: testCoverage.tested,
          untested: testCoverage.untested.length
        }
      },
      componentsByFeature,
      componentsByType,
      testCoverage,
      components: Object.fromEntries(this.components),
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Find high-priority untested components
    this.components.forEach((info) => {
      info.components.forEach(comp => {
        if (!comp.hasTests && comp.testPriority === 'high') {
          recommendations.push({
            type: 'urgent',
            message: `Add tests for high-priority component: ${comp.name}`,
            component: comp.name,
            filePath: info.filePath
          });
        }
      });
    });
    
    // Find complex components that need refactoring
    this.components.forEach((info) => {
      info.components.forEach(comp => {
        if (comp.complexity > 15) {
          recommendations.push({
            type: 'refactor',
            message: `Consider breaking down complex component: ${comp.name} (complexity: ${comp.complexity})`,
            component: comp.name,
            filePath: info.filePath
          });
        }
      });
    });
    
    return recommendations;
  }

  async saveReport(report) {
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
    
    // Save JSON report
    fs.writeFileSync(
      path.join(this.outputPath, 'component-map.json'),
      JSON.stringify(report, null, 2)
    );
    
    // Save markdown summary
    const markdown = this.generateMarkdownSummary(report);
    fs.writeFileSync(
      path.join(this.outputPath, 'component-scan-summary.md'),
      markdown
    );
  }

  generateMarkdownSummary(report) {
    return `# CuisineZen Component Scan Report

## Summary
- **Total Files Scanned**: ${report.summary.totalFiles}
- **Total Components**: ${report.summary.totalComponents}
- **Test Coverage**: ${report.summary.testCoverage.percentage}%
- **Tested Components**: ${report.summary.testCoverage.tested}
- **Untested Components**: ${report.summary.testCoverage.untested}

## Components by Feature
${Object.entries(report.componentsByFeature).map(([feature, components]) => 
  `### ${feature.charAt(0).toUpperCase() + feature.slice(1)}
${components.map(comp => `- ${comp.name} (${comp.filePath})`).join('\n')}`
).join('\n\n')}

## High Priority Testing Recommendations
${report.testCoverage.untested
  .filter(comp => comp.priority === 'high')
  .map(comp => `- **${comp.name}** (${comp.filePath})`)
  .join('\n')}

## Urgent Recommendations
${report.recommendations
  .filter(rec => rec.type === 'urgent')
  .map(rec => `- ${rec.message}`)
  .join('\n')}

---
*Report generated on ${new Date(report.scanDate).toLocaleString()}*
`;
  }
}

// Run scanner if called directly
if (require.main === module) {
  const scanner = new ComponentScanner();
  scanner.scanAll().catch(console.error);
}

module.exports = ComponentScanner;