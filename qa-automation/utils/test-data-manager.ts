/**
 * CuisineZen Test Data Management System
 * Automated test data generation and seeding
 */

import { faker } from '@faker-js/faker';
import { Product, Recipe, User, AnalyticsData } from '../../src/lib/types';

export interface TestDataScenario {
  name: string;
  description: string;
  products: Product[];
  recipes: Recipe[];
  users: User[];
  analytics: AnalyticsData;
}

export class TestDataManager {
  private scenarios: Map<string, TestDataScenario> = new Map();
  private currentScenario: string | null = null;

  constructor() {
    this.initializeScenarios();
  }

  private initializeScenarios(): void {
    // Default test scenario
    this.scenarios.set('default', this.createDefaultScenario());
    
    // Empty inventory scenario
    this.scenarios.set('empty-inventory', this.createEmptyInventoryScenario());
    
    // Full inventory scenario
    this.scenarios.set('full-inventory', this.createFullInventoryScenario());
    
    // Expiring products scenario
    this.scenarios.set('expiring-products', this.createExpiringProductsScenario());
    
    // Recipe testing scenario
    this.scenarios.set('recipe-testing', this.createRecipeTestingScenario());
    
    // Analytics scenario
    this.scenarios.set('analytics-rich', this.createAnalyticsRichScenario());
    
    // Performance testing scenario
    this.scenarios.set('performance-load', this.createPerformanceLoadScenario());
    
    // Error scenarios
    this.scenarios.set('error-conditions', this.createErrorConditionsScenario());
  }

  async initializeTestData(): Promise<void> {
    console.log('🌱 Initializing CuisineZen test data...');
    
    // Set default scenario
    await this.seedScenario('default');
  }

  async seedScenario(scenarioName: string): Promise<void> {
    const scenario = this.scenarios.get(scenarioName);
    if (!scenario) {
      throw new Error(`Unknown test scenario: ${scenarioName}`);
    }

    console.log(`🌱 Seeding scenario: ${scenario.name}`);
    
    // Clear existing data
    await this.clearAll();
    
    // Seed new data
    await this.seedProducts(scenario.products);
    await this.seedRecipes(scenario.recipes);
    await this.seedUsers(scenario.users);
    await this.seedAnalytics(scenario.analytics);
    
    this.currentScenario = scenarioName;
    console.log(`✅ Scenario '${scenario.name}' seeded successfully`);
  }

  private createDefaultScenario(): TestDataScenario {
    return {
      name: 'Default Test Scenario',
      description: 'Balanced test data for general testing',
      products: this.generateProducts(10),
      recipes: this.generateRecipes(5),
      users: this.generateUsers(3),
      analytics: this.generateAnalytics('balanced'),
    };
  }

  private createEmptyInventoryScenario(): TestDataScenario {
    return {
      name: 'Empty Inventory',
      description: 'No products in inventory for testing empty states',
      products: [],
      recipes: this.generateRecipes(2),
      users: this.generateUsers(1),
      analytics: this.generateAnalytics('empty'),
    };
  }

  private createFullInventoryScenario(): TestDataScenario {
    return {
      name: 'Full Inventory',
      description: 'Large inventory for testing performance and pagination',
      products: this.generateProducts(100),
      recipes: this.generateRecipes(50),
      users: this.generateUsers(5),
      analytics: this.generateAnalytics('full'),
    };
  }

  private createExpiringProductsScenario(): TestDataScenario {
    const products = this.generateProducts(15);
    
    // Make some products expire soon
    products.slice(0, 5).forEach(product => {
      product.expiryDate = faker.date.soon({ days: 3 });
    });
    
    // Make some products already expired
    products.slice(5, 8).forEach(product => {
      product.expiryDate = faker.date.recent({ days: 5 });
    });

    return {
      name: 'Expiring Products',
      description: 'Products with various expiry dates for testing alerts',
      products,
      recipes: this.generateRecipes(8),
      users: this.generateUsers(2),
      analytics: this.generateAnalytics('expiring'),
    };
  }

  private createRecipeTestingScenario(): TestDataScenario {
    const products = this.generateProducts(20);
    const recipes = this.generateRecipes(15);
    
    // Ensure recipes have ingredients that match products
    recipes.forEach(recipe => {
      recipe.ingredients = products
        .slice(0, faker.number.int({ min: 3, max: 8 }))
        .map(product => ({
          id: product.id,
          name: product.name,
          quantity: faker.number.float({ min: 0.1, max: 5, precision: 0.1 }),
          unit: product.unit || 'pieces',
        }));
    });

    return {
      name: 'Recipe Testing',
      description: 'Comprehensive recipe and ingredient testing data',
      products,
      recipes,
      users: this.generateUsers(3),
      analytics: this.generateAnalytics('recipe-focused'),
    };
  }

  private createAnalyticsRichScenario(): TestDataScenario {
    return {
      name: 'Analytics Rich',
      description: 'Rich analytics data for dashboard testing',
      products: this.generateProducts(50),
      recipes: this.generateRecipes(25),
      users: this.generateUsers(10),
      analytics: this.generateAnalytics('rich'),
    };
  }

  private createPerformanceLoadScenario(): TestDataScenario {
    return {
      name: 'Performance Load',
      description: 'Large dataset for performance testing',
      products: this.generateProducts(1000),
      recipes: this.generateRecipes(500),
      users: this.generateUsers(50),
      analytics: this.generateAnalytics('performance'),
    };
  }

  private createErrorConditionsScenario(): TestDataScenario {
    const products = this.generateProducts(5);
    
    // Create products with potential error conditions
    products[0].name = ''; // Empty name
    products[1].price = -10; // Negative price
    products[2].quantity = NaN; // Invalid quantity
    products[3].expiryDate = new Date('invalid'); // Invalid date
    
    return {
      name: 'Error Conditions',
      description: 'Data with potential error conditions for testing validation',
      products,
      recipes: [],
      users: this.generateUsers(1),
      analytics: this.generateAnalytics('minimal'),
    };
  }

  private generateProducts(count: number): Product[] {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      category: faker.helpers.arrayElement([
        'Fruits', 'Vegetables', 'Dairy', 'Meat', 'Grains', 'Beverages'
      ]),
      price: faker.number.float({ min: 0.5, max: 50, precision: 0.01 }),
      quantity: faker.number.int({ min: 0, max: 100 }),
      unit: faker.helpers.arrayElement(['kg', 'g', 'l', 'ml', 'pieces']),
      barcode: faker.string.numeric(13),
      expiryDate: faker.date.future({ years: 1 }),
      location: faker.helpers.arrayElement(['Fridge', 'Pantry', 'Freezer']),
      image: faker.image.url({ width: 300, height: 300 }),
      createdAt: faker.date.recent({ days: 30 }),
      updatedAt: faker.date.recent({ days: 7 }),
      userId: 'test-user-id',
    }));
  }

  private generateRecipes(count: number): Recipe[] {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      name: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
      category: faker.helpers.arrayElement([
        'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'
      ]),
      prepTime: faker.number.int({ min: 5, max: 120 }),
      cookTime: faker.number.int({ min: 0, max: 180 }),
      servings: faker.number.int({ min: 1, max: 12 }),
      difficulty: faker.helpers.arrayElement(['Easy', 'Medium', 'Hard']),
      ingredients: [], // Will be populated in scenarios
      instructions: Array.from({ length: faker.number.int({ min: 3, max: 10 }) }, () =>
        faker.lorem.sentence()
      ),
      tags: faker.helpers.arrayElements(
        ['Vegetarian', 'Vegan', 'Gluten-Free', 'Quick', 'Healthy', 'Comfort Food'],
        { min: 0, max: 3 }
      ),
      image: faker.image.url({ width: 400, height: 300 }),
      rating: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
      reviews: faker.number.int({ min: 0, max: 100 }),
      createdAt: faker.date.recent({ days: 60 }),
      updatedAt: faker.date.recent({ days: 14 }),
      userId: 'test-user-id',
    }));
  }

  private generateUsers(count: number): User[] {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      avatar: faker.image.avatar(),
      preferences: {
        theme: faker.helpers.arrayElement(['light', 'dark']),
        language: 'fr',
        notifications: {
          email: faker.datatype.boolean(),
          push: faker.datatype.boolean(),
          expiry: faker.datatype.boolean(),
        },
      },
      createdAt: faker.date.recent({ days: 90 }),
      updatedAt: faker.date.recent({ days: 7 }),
    }));
  }

  private generateAnalytics(type: string): AnalyticsData {
    const baseData = {
      totalProducts: 0,
      totalRecipes: 0,
      expiringProducts: 0,
      lowStockProducts: 0,
      monthlyExpenses: 0,
      topCategories: [],
      weeklyActivity: [],
      performanceMetrics: {
        avgPageLoad: faker.number.float({ min: 0.5, max: 3, precision: 0.1 }),
        errorRate: faker.number.float({ min: 0, max: 0.05, precision: 0.001 }),
        uptime: faker.number.float({ min: 0.95, max: 1, precision: 0.001 }),
      },
    };

    switch (type) {
      case 'empty':
        return { ...baseData };
      
      case 'full':
        return {
          ...baseData,
          totalProducts: 100,
          totalRecipes: 50,
          expiringProducts: 5,
          lowStockProducts: 10,
          monthlyExpenses: 450.75,
          topCategories: [
            { name: 'Vegetables', count: 25 },
            { name: 'Fruits', count: 20 },
            { name: 'Dairy', count: 15 },
          ],
          weeklyActivity: Array.from({ length: 7 }, (_, i) => ({
            day: i,
            activities: faker.number.int({ min: 5, max: 25 }),
          })),
        };
      
      default:
        return {
          ...baseData,
          totalProducts: faker.number.int({ min: 5, max: 30 }),
          totalRecipes: faker.number.int({ min: 2, max: 15 }),
          expiringProducts: faker.number.int({ min: 0, max: 5 }),
          lowStockProducts: faker.number.int({ min: 0, max: 8 }),
          monthlyExpenses: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
        };
    }
  }

  // Data seeding methods
  private async seedProducts(products: Product[]): Promise<void> {
    // In a real implementation, this would interact with the database
    // For now, we'll store in memory for testing
    (globalThis as any).__testData = (globalThis as any).__testData || {};
    (globalThis as any).__testData.products = products;
  }

  private async seedRecipes(recipes: Recipe[]): Promise<void> {
    (globalThis as any).__testData = (globalThis as any).__testData || {};
    (globalThis as any).__testData.recipes = recipes;
  }

  private async seedUsers(users: User[]): Promise<void> {
    (globalThis as any).__testData = (globalThis as any).__testData || {};
    (globalThis as any).__testData.users = users;
  }

  private async seedAnalytics(analytics: AnalyticsData): Promise<void> {
    (globalThis as any).__testData = (globalThis as any).__testData || {};
    (globalThis as any).__testData.analytics = analytics;
  }

  // Data retrieval methods for MSW handlers
  getTestProducts(): Product[] {
    return (globalThis as any).__testData?.products || [];
  }

  getTestRecipes(): Recipe[] {
    return (globalThis as any).__testData?.recipes || [];
  }

  getTestUsers(): User[] {
    return (globalThis as any).__testData?.users || [];
  }

  getTestAnalytics(): AnalyticsData {
    return (globalThis as any).__testData?.analytics || {};
  }

  getProductByBarcode(barcode: string): Product | null {
    const products = this.getTestProducts();
    return products.find(p => p.barcode === barcode) || null;
  }

  async clearAll(): Promise<void> {
    (globalThis as any).__testData = {
      products: [],
      recipes: [],
      users: [],
      analytics: {},
    };
  }

  // Utility methods
  getCurrentScenario(): string | null {
    return this.currentScenario;
  }

  getAvailableScenarios(): string[] {
    return Array.from(this.scenarios.keys());
  }

  getScenarioDescription(scenarioName: string): string {
    const scenario = this.scenarios.get(scenarioName);
    return scenario?.description || 'Unknown scenario';
  }

  // Dynamic data generation
  generateRandomProduct(): Product {
    return this.generateProducts(1)[0];
  }

  generateRandomRecipe(): Recipe {
    return this.generateRecipes(1)[0];
  }

  // Data validation helpers
  validateProductData(product: Product): boolean {
    return !!(
      product.id &&
      product.name &&
      product.price >= 0 &&
      product.quantity >= 0 &&
      product.category
    );
  }

  validateRecipeData(recipe: Recipe): boolean {
    return !!(
      recipe.id &&
      recipe.name &&
      recipe.ingredients &&
      recipe.instructions &&
      recipe.prepTime >= 0
    );
  }

  async cleanup(): Promise<void> {
    await this.clearAll();
    this.currentScenario = null;
    console.log('🧹 Test data manager cleaned up');
  }
}