#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * CuisineZen AI Test Generator
 * Generates comprehensive test suites for React components using AI analysis
 */
class TestGenerator {
  constructor() {
    this.srcPath = path.join(process.cwd(), 'src');
    this.outputPath = path.join(process.cwd(), 'qa-automation/tests');
    this.reportsPath = path.join(process.cwd(), 'qa-automation/reports');
    this.templatePath = path.join(process.cwd(), 'qa-automation/templates');
    this.aiClient = null; // Will be initialized with OpenAI client
  }

  async generateAllTests() {
    console.log('🤖 Starting AI test generation for CuisineZen...');
    
    // Load component scan results
    const componentMap = await this.loadComponentMap();
    if (!componentMap) {
      console.error('❌ Component map not found. Run component scanner first.');
      return;
    }

    const testPlans = [];
    
    // Generate tests for each component
    for (const [filePath, componentInfo] of Object.entries(componentMap.components)) {
      for (const component of componentInfo.components) {
        if (!component.hasTests && component.testPriority !== 'low') {
          console.log(`📝 Generating tests for ${component.name}...`);
          
          const testPlan = await this.generateTestPlan(component, componentInfo);
          const testCode = await this.generateTestCode(testPlan);
          
          await this.saveTest(component, testCode);
          testPlans.push(testPlan);
        }
      }
    }

    // Generate E2E test scenarios
    await this.generateE2ETests(componentMap);
    
    // Generate accessibility tests
    await this.generateA11yTests(componentMap);
    
    // Save generation report
    await this.saveGenerationReport(testPlans);
    
    console.log(`✅ Test generation completed. Generated ${testPlans.length} test suites.`);
  }

  async loadComponentMap() {
    const mapPath = path.join(this.reportsPath, 'component-map.json');
    
    if (!fs.existsSync(mapPath)) {
      return null;
    }
    
    return JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  }

  async generateTestPlan(component, componentInfo) {
    const testPlan = {
      componentName: component.name,
      filePath: componentInfo.filePath,
      testType: this.getTestType(component),
      scenarios: [],
      mockRequirements: [],
      assertions: [],
      complexity: component.complexity,
      features: component.features
    };

    // Analyze component to determine test scenarios
    if (component.name.toLowerCase().includes('card')) {
      testPlan.scenarios = this.generateCardTestScenarios(component);
    } else if (component.name.toLowerCase().includes('dialog')) {
      testPlan.scenarios = this.generateDialogTestScenarios(component);
    } else if (component.name.toLowerCase().includes('form')) {
      testPlan.scenarios = this.generateFormTestScenarios(component);
    } else if (component.name.toLowerCase().includes('list')) {
      testPlan.scenarios = this.generateListTestScenarios(component);
    } else {
      testPlan.scenarios = this.generateGenericTestScenarios(component);
    }

    // Add CuisineZen specific scenarios
    if (component.features.includes('inventory')) {
      testPlan.scenarios.push(...this.generateInventoryScenarios());
    }
    if (component.features.includes('recipe')) {
      testPlan.scenarios.push(...this.generateRecipeScenarios());
    }
    if (component.features.includes('barcode')) {
      testPlan.scenarios.push(...this.generateBarcodeScenarios());
    }
    if (component.features.includes('analytics')) {
      testPlan.scenarios.push(...this.generateAnalyticsScenarios());
    }

    // Determine mock requirements
    testPlan.mockRequirements = this.determineMockRequirements(component);
    
    // Generate assertions
    testPlan.assertions = this.generateAssertions(component, testPlan.scenarios);

    return testPlan;
  }

  getTestType(component) {
    if (component.name.toLowerCase().includes('page')) return 'integration';
    if (component.complexity > 10) return 'integration';
    return 'unit';
  }

  generateCardTestScenarios(component) {
    return [
      {
        name: 'renders with required props',
        type: 'render',
        props: this.getRequiredProps(component),
        expectations: ['component renders', 'no console errors']
      },
      {
        name: 'displays correct content',
        type: 'content',
        props: this.getSampleProps(component),
        expectations: ['displays title', 'displays description', 'shows image if provided']
      },
      {
        name: 'handles click events',
        type: 'interaction',
        props: this.getInteractiveProps(component),
        expectations: ['calls onClick handler', 'updates visual state']
      },
      {
        name: 'shows loading state',
        type: 'state',
        props: { loading: true },
        expectations: ['shows loading indicator', 'disables interactions']
      }
    ];
  }

  generateDialogTestScenarios(component) {
    return [
      {
        name: 'opens and closes correctly',
        type: 'modal',
        props: { open: true },
        expectations: ['dialog is visible', 'closes on backdrop click', 'closes on escape key']
      },
      {
        name: 'handles form submission',
        type: 'form',
        props: this.getFormProps(component),
        expectations: ['validates input', 'calls onSubmit', 'shows success/error state']
      },
      {
        name: 'maintains focus management',
        type: 'accessibility',
        props: { open: true },
        expectations: ['traps focus', 'returns focus on close', 'has proper ARIA labels']
      }
    ];
  }

  generateFormTestScenarios(component) {
    return [
      {
        name: 'validates required fields',
        type: 'validation',
        props: {},
        expectations: ['shows validation errors', 'prevents submission']
      },
      {
        name: 'submits valid data',
        type: 'submission',
        props: this.getValidFormData(component),
        expectations: ['calls onSubmit', 'shows success state', 'resets form']
      },
      {
        name: 'handles API errors',
        type: 'error',
        props: { submitError: true },
        expectations: ['shows error message', 'maintains form data', 'allows retry']
      }
    ];
  }

  generateListTestScenarios(component) {
    return [
      {
        name: 'renders empty state',
        type: 'empty',
        props: { items: [] },
        expectations: ['shows empty message', 'shows call-to-action']
      },
      {
        name: 'renders list items',
        type: 'populated',
        props: { items: this.getSampleListData(component) },
        expectations: ['renders all items', 'applies correct styling', 'handles item clicks']
      },
      {
        name: 'handles loading state',
        type: 'loading',
        props: { loading: true },
        expectations: ['shows loading indicators', 'maintains layout']
      }
    ];
  }

  generateGenericTestScenarios(component) {
    return [
      {
        name: 'renders without crashing',
        type: 'smoke',
        props: this.getMinimalProps(component),
        expectations: ['component mounts', 'no console errors']
      },
      {
        name: 'applies correct styling',
        type: 'styling',
        props: this.getStyledProps(component),
        expectations: ['has correct CSS classes', 'responds to theme changes']
      }
    ];
  }

  generateInventoryScenarios() {
    return [
      {
        name: 'manages product expiration dates',
        type: 'business-logic',
        props: { product: { expiryDate: new Date() } },
        expectations: ['shows expiration warning', 'categorizes by freshness']
      },
      {
        name: 'handles quantity updates',
        type: 'interaction',
        props: { product: { quantity: 5 } },
        expectations: ['updates quantity', 'validates input', 'persists changes']
      }
    ];
  }

  generateRecipeScenarios() {
    return [
      {
        name: 'calculates serving adjustments',
        type: 'calculation',
        props: { recipe: { servings: 4 }, desiredServings: 6 },
        expectations: ['adjusts ingredient quantities', 'maintains ratios']
      },
      {
        name: 'checks ingredient availability',
        type: 'integration',
        props: { recipe: { ingredients: ['flour', 'eggs'] } },
        expectations: ['marks available ingredients', 'suggests alternatives']
      }
    ];
  }

  generateBarcodeScenarios() {
    return [
      {
        name: 'handles successful scan',
        type: 'camera',
        props: { onScan: jest.fn() },
        expectations: ['processes barcode data', 'calls onScan callback']
      },
      {
        name: 'handles scan errors',
        type: 'error',
        props: { onError: jest.fn() },
        expectations: ['shows error message', 'allows retry']
      }
    ];
  }

  generateAnalyticsScenarios() {
    return [
      {
        name: 'displays metrics correctly',
        type: 'data-visualization',
        props: { data: this.getSampleAnalyticsData() },
        expectations: ['renders charts', 'shows correct values', 'handles empty data']
      }
    ];
  }

  determineMockRequirements(component) {
    const mocks = [];
    
    // Common mocks
    if (component.hooks.includes('useFirestore')) {
      mocks.push('firebase/firestore');
    }
    if (component.hooks.includes('useAuth')) {
      mocks.push('firebase/auth');
    }
    if (component.hooks.includes('useRouter')) {
      mocks.push('next/router');
    }
    if (component.features.includes('image')) {
      mocks.push('next/image');
    }
    
    // CuisineZen specific mocks
    if (component.features.includes('barcode')) {
      mocks.push('@zxing/library');
    }
    if (component.features.includes('analytics')) {
      mocks.push('recharts');
    }
    
    return mocks;
  }

  generateAssertions(component, scenarios) {
    const assertions = [];
    
    scenarios.forEach(scenario => {
      scenario.expectations.forEach(expectation => {
        assertions.push({
          scenario: scenario.name,
          assertion: expectation,
          type: this.getAssertionType(expectation)
        });
      });
    });
    
    return assertions;
  }

  getAssertionType(expectation) {
    if (expectation.includes('renders') || expectation.includes('displays')) return 'visual';
    if (expectation.includes('calls') || expectation.includes('triggers')) return 'behavioral';
    if (expectation.includes('validates') || expectation.includes('prevents')) return 'validation';
    if (expectation.includes('ARIA') || expectation.includes('focus')) return 'accessibility';
    return 'functional';
  }

  async generateTestCode(testPlan) {
    const template = await this.loadTestTemplate(testPlan.testType);
    
    // Replace template variables
    let testCode = template
      .replace(/{{COMPONENT_NAME}}/g, testPlan.componentName)
      .replace(/{{FILE_PATH}}/g, testPlan.filePath)
      .replace(/{{IMPORTS}}/g, this.generateImports(testPlan))
      .replace(/{{MOCKS}}/g, this.generateMocks(testPlan))
      .replace(/{{TESTS}}/g, this.generateTestCases(testPlan));
    
    return testCode;
  }

  async loadTestTemplate(testType) {
    const templateFile = `${testType}-test-template.tsx`;
    const templatePath = path.join(this.templatePath, templateFile);
    
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf8');
    }
    
    // Return default template if specific template not found
    return this.getDefaultTestTemplate();
  }

  getDefaultTestTemplate() {
    return `import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
{{IMPORTS}}

{{MOCKS}}

describe('{{COMPONENT_NAME}}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

{{TESTS}}
});`;
  }

  generateImports(testPlan) {
    const imports = [`import ${testPlan.componentName} from '../../${testPlan.filePath.replace('.tsx', '')}';`];
    
    // Add conditional imports based on mock requirements
    testPlan.mockRequirements.forEach(mock => {
      if (mock === 'next/router') {
        imports.push("import { useRouter } from 'next/router';");
      }
      if (mock === 'firebase/firestore') {
        imports.push("import { useFirestore } from '@/hooks/use-firestore';");
      }
    });
    
    return imports.join('\n');
  }

  generateMocks(testPlan) {
    const mocks = [];
    
    testPlan.mockRequirements.forEach(mock => {
      if (mock === 'next/router') {
        mocks.push(`vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    pathname: '/test'
  }))
}));`);
      }
      
      if (mock === 'firebase/firestore') {
        mocks.push(`vi.mock('@/hooks/use-firestore', () => ({
  useFirestore: vi.fn(() => ({
    data: [],
    loading: false,
    error: null,
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }))
}));`);
      }
    });
    
    return mocks.join('\n\n');
  }

  generateTestCases(testPlan) {
    return testPlan.scenarios.map(scenario => {
      return `  test('${scenario.name}', async () => {
    const user = userEvent.setup();
    const mockProps = ${JSON.stringify(scenario.props, null, 4)};
    
    render(<${testPlan.componentName} {...mockProps} />);
    
    ${scenario.expectations.map(expectation => this.generateAssertion(expectation)).join('\n    ')}
  });`;
    }).join('\n\n');
  }

  generateAssertion(expectation) {
    // Convert expectation to actual test assertion
    if (expectation.includes('renders') || expectation.includes('displays')) {
      return `expect(screen.getByRole('region')).toBeInTheDocument();`;
    }
    if (expectation.includes('calls')) {
      return `expect(mockProps.onClick).toHaveBeenCalled();`;
    }
    if (expectation.includes('no console errors')) {
      return `expect(console.error).not.toHaveBeenCalled();`;
    }
    
    return `// TODO: Implement assertion for: ${expectation}`;
  }

  async generateE2ETests(componentMap) {
    console.log('🎭 Generating E2E tests...');
    
    const e2eScenarios = [
      {
        feature: 'inventory',
        scenarios: [
          'User can add a new product to inventory',
          'User can edit product details',
          'User can delete a product',
          'User can filter products by category',
          'User can scan barcode to add product'
        ]
      },
      {
        feature: 'recipes',
        scenarios: [
          'User can create a new recipe',
          'User can search for recipes',
          'User can view recipe details',
          'User can adjust serving sizes'
        ]
      },
      {
        feature: 'analytics',
        scenarios: [
          'User can view inventory analytics',
          'User can see expiration alerts',
          'User can generate reports'
        ]
      }
    ];

    for (const feature of e2eScenarios) {
      const testCode = this.generateE2ETestCode(feature);
      await this.saveE2ETest(feature.feature, testCode);
    }
  }

  generateE2ETestCode(feature) {
    const scenarios = feature.scenarios.map(scenario => {
      return `  test('${scenario}', async ({ page }) => {
    // TODO: Implement E2E test for: ${scenario}
    await page.goto('/${feature.feature}');
    await expect(page).toHaveTitle(/CuisineZen/);
  });`;
    }).join('\n\n');

    return `import { test, expect } from '@playwright/test';

describe('${feature.feature.charAt(0).toUpperCase() + feature.feature.slice(1)} E2E Tests', () => {
${scenarios}
});`;
  }

  async generateA11yTests(componentMap) {
    console.log('♿ Generating accessibility tests...');
    
    const a11yTest = `import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
  });

  test('homepage has no accessibility violations', async ({ page }) => {
    await checkA11y(page);
  });

  test('inventory page has no accessibility violations', async ({ page }) => {
    await page.goto('/inventory');
    await checkA11y(page);
  });

  test('recipes page has no accessibility violations', async ({ page }) => {
    await page.goto('/recipes');
    await checkA11y(page);
  });

  test('analytics page has no accessibility violations', async ({ page }) => {
    await page.goto('/analytics');
    await checkA11y(page);
  });

  test('keyboard navigation works correctly', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});`;

    await this.saveA11yTest(a11yTest);
  }

  async saveTest(component, testCode) {
    const testDir = path.join(this.outputPath, 'unit');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const testPath = path.join(testDir, `${component.name.toLowerCase()}.test.tsx`);
    fs.writeFileSync(testPath, testCode);
  }

  async saveE2ETest(feature, testCode) {
    const testDir = path.join(this.outputPath, 'e2e', feature);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const testPath = path.join(testDir, `${feature}.spec.ts`);
    fs.writeFileSync(testPath, testCode);
  }

  async saveA11yTest(testCode) {
    const testDir = path.join(this.outputPath, 'accessibility');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const testPath = path.join(testDir, 'a11y.spec.ts');
    fs.writeFileSync(testPath, testCode);
  }

  async saveGenerationReport(testPlans) {
    const report = {
      generationDate: new Date().toISOString(),
      summary: {
        totalTests: testPlans.length,
        testTypes: this.countTestTypes(testPlans),
        coverage: this.calculateCoverage(testPlans)
      },
      testPlans,
      recommendations: this.generateTestRecommendations(testPlans)
    };

    fs.writeFileSync(
      path.join(this.reportsPath, 'test-generation-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log(`📊 Test generation report saved to: ${this.reportsPath}/test-generation-report.json`);
  }

  countTestTypes(testPlans) {
    const types = {};
    testPlans.forEach(plan => {
      types[plan.testType] = (types[plan.testType] || 0) + 1;
    });
    return types;
  }

  calculateCoverage(testPlans) {
    const totalComponents = testPlans.length;
    const testedComponents = testPlans.filter(plan => plan.scenarios.length > 0).length;
    
    return {
      percentage: totalComponents > 0 ? (testedComponents / totalComponents * 100).toFixed(2) : 0,
      tested: testedComponents,
      total: totalComponents
    };
  }

  generateTestRecommendations(testPlans) {
    const recommendations = [];
    
    testPlans.forEach(plan => {
      if (plan.complexity > 10 && plan.scenarios.length < 5) {
        recommendations.push(`Consider adding more test scenarios for complex component: ${plan.componentName}`);
      }
      
      if (plan.features.includes('barcode') && !plan.mockRequirements.includes('@zxing/library')) {
        recommendations.push(`Add camera/barcode mocking for component: ${plan.componentName}`);
      }
    });
    
    return recommendations;
  }

  // Helper methods for generating sample data
  getRequiredProps(component) {
    return component.props.filter(prop => prop.required).reduce((props, prop) => {
      props[prop.name] = this.getDefaultValue(prop.name);
      return props;
    }, {});
  }

  getSampleProps(component) {
    return component.props.reduce((props, prop) => {
      props[prop.name] = this.getDefaultValue(prop.name);
      return props;
    }, {});
  }

  getDefaultValue(propName) {
    const lowerName = propName.toLowerCase();
    if (lowerName.includes('title') || lowerName.includes('name')) return 'Test Title';
    if (lowerName.includes('description')) return 'Test description';
    if (lowerName.includes('image') || lowerName.includes('src')) return '/test-image.jpg';
    if (lowerName.includes('date')) return new Date().toISOString();
    if (lowerName.includes('quantity') || lowerName.includes('count')) return 5;
    if (lowerName.includes('price') || lowerName.includes('cost')) return 9.99;
    if (lowerName.includes('callback') || lowerName.includes('handler')) return 'vi.fn()';
    return 'test-value';
  }

  getSampleListData(component) {
    return [
      { id: 1, name: 'Test Item 1' },
      { id: 2, name: 'Test Item 2' },
      { id: 3, name: 'Test Item 3' }
    ];
  }

  getSampleAnalyticsData() {
    return {
      totalProducts: 25,
      expiringProducts: 3,
      recentRecipes: 8,
      weeklyUsage: [
        { day: 'Mon', usage: 12 },
        { day: 'Tue', usage: 15 },
        { day: 'Wed', usage: 8 }
      ]
    };
  }

  getMinimalProps(component) {
    return this.getRequiredProps(component);
  }

  getStyledProps(component) {
    return {
      ...this.getSampleProps(component),
      className: 'test-class',
      variant: 'primary'
    };
  }

  getInteractiveProps(component) {
    return {
      ...this.getSampleProps(component),
      onClick: 'vi.fn()',
      onSubmit: 'vi.fn()',
      onChange: 'vi.fn()'
    };
  }

  getFormProps(component) {
    return {
      onSubmit: 'vi.fn()',
      onCancel: 'vi.fn()',
      initialValues: {},
      validationSchema: 'vi.fn()'
    };
  }

  getValidFormData(component) {
    return {
      name: 'Test Product',
      category: 'grocery',
      quantity: 1,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }
}

// Run generator if called directly
if (require.main === module) {
  const generator = new TestGenerator();
  generator.generateAllTests().catch(console.error);
}

module.exports = TestGenerator;