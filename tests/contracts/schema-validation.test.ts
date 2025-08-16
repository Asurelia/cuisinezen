import { describe, it, expect } from 'vitest'
import { fc } from 'fast-check'
import { z } from 'zod'

// Import type definitions
import type { Product, Recipe, Batch, UserActivity, RestaurantData } from '@/lib/types'

// Zod schemas for validation
const BatchSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  purchasePrice: z.number().min(0),
  supplier: z.string().min(1),
  expiryDate: z.date().nullable(),
  barcode: z.string().optional(),
  notes: z.string().optional()
})

const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  category: z.enum(['vegetables', 'meat', 'dairy', 'grains', 'beverages', 'other']),
  imageUrl: z.string().url().optional(),
  batches: z.array(BatchSchema).min(0)
})

const RecipeIngredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1)
})

const RecipeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  category: z.enum(['appetizer', 'main-course', 'side-dish', 'dessert', 'beverage', 'snack']),
  servings: z.number().int().positive(),
  prepTime: z.number().int().min(0),
  cookTime: z.number().int().min(0),
  ingredients: z.array(RecipeIngredientSchema).min(1),
  steps: z.array(z.string().min(1)).min(1),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional()
})

const UserActivitySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email(),
  action: z.enum(['create', 'update', 'delete']),
  entityType: z.enum(['product', 'recipe', 'menu']),
  entityId: z.string().min(1),
  entityName: z.string().min(1),
  timestamp: z.date(),
  restaurantId: z.string().min(1)
})

const RestaurantDataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  adminEmails: z.array(z.string().email()).min(1),
  settings: z.object({
    timezone: z.string().min(1),
    currency: z.string().length(3),
    features: z.object({
      inventory: z.boolean(),
      recipes: z.boolean(),
      menu: z.boolean(),
      shoppingList: z.boolean()
    })
  }),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Firebase Firestore schema (with server timestamps)
const FirestoreProductSchema = ProductSchema.extend({
  batches: z.array(BatchSchema.extend({
    expiryDate: z.any() // Firebase Timestamp or null
  })),
  restaurantId: z.string().min(1),
  createdAt: z.any(), // Firebase server timestamp
  updatedAt: z.any(), // Firebase server timestamp
  createdBy: z.string().email()
})

const FirestoreRecipeSchema = RecipeSchema.extend({
  restaurantId: z.string().min(1),
  createdAt: z.any(), // Firebase server timestamp
  updatedAt: z.any(), // Firebase server timestamp
  createdBy: z.string().email()
})

describe('Schema Validation Contracts', () => {
  describe('Product Schema Validation', () => {
    it('should validate valid product data', () => {
      const validProduct: Product = {
        id: 'product-123',
        name: 'Fresh Tomatoes',
        category: 'vegetables',
        imageUrl: 'https://example.com/tomatoes.jpg',
        batches: [
          {
            id: 'batch-1',
            quantity: 5,
            unit: 'kg',
            purchasePrice: 10.50,
            supplier: 'Local Farm',
            expiryDate: new Date('2024-12-31'),
            barcode: '1234567890123',
            notes: 'Organic tomatoes'
          }
        ]
      }

      expect(() => ProductSchema.parse(validProduct)).not.toThrow()
    })

    it('should reject invalid product data', () => {
      const invalidProducts = [
        // Missing required fields
        { id: '', name: 'Test', category: 'vegetables', batches: [] },
        // Invalid category
        { id: 'test', name: 'Test', category: 'invalid', batches: [] },
        // Invalid batch data
        { 
          id: 'test', 
          name: 'Test', 
          category: 'vegetables', 
          batches: [{ id: '', quantity: -1, unit: '', purchasePrice: -5 }] 
        },
        // Name too long
        { 
          id: 'test', 
          name: 'x'.repeat(101), 
          category: 'vegetables', 
          batches: [] 
        }
      ]

      invalidProducts.forEach(product => {
        expect(() => ProductSchema.parse(product)).toThrow()
      })
    })

    it('should validate product with empty batches', () => {
      const productWithoutBatches: Product = {
        id: 'product-123',
        name: 'Generic Product',
        category: 'other',
        batches: []
      }

      expect(() => ProductSchema.parse(productWithoutBatches)).not.toThrow()
    })

    it('should validate product with multiple batches', () => {
      const productWithMultipleBatches: Product = {
        id: 'product-123',
        name: 'Milk',
        category: 'dairy',
        batches: [
          {
            id: 'batch-1',
            quantity: 2,
            unit: 'liters',
            purchasePrice: 3.50,
            supplier: 'Dairy Co',
            expiryDate: new Date('2024-01-15'),
            barcode: '1111111111111'
          },
          {
            id: 'batch-2',
            quantity: 3,
            unit: 'liters',
            purchasePrice: 4.00,
            supplier: 'Dairy Co',
            expiryDate: new Date('2024-01-18'),
            barcode: '2222222222222'
          }
        ]
      }

      expect(() => ProductSchema.parse(productWithMultipleBatches)).not.toThrow()
    })

    it('should handle optional fields correctly', () => {
      const productWithOptionals: Product = {
        id: 'product-123',
        name: 'Product with optionals',
        category: 'other',
        imageUrl: 'https://example.com/image.jpg',
        batches: [
          {
            id: 'batch-1',
            quantity: 1,
            unit: 'piece',
            purchasePrice: 5.00,
            supplier: 'Supplier',
            expiryDate: null,
            barcode: '1234567890123',
            notes: 'Some notes'
          }
        ]
      }

      expect(() => ProductSchema.parse(productWithOptionals)).not.toThrow()
    })
  })

  describe('Recipe Schema Validation', () => {
    it('should validate valid recipe data', () => {
      const validRecipe: Recipe = {
        id: 'recipe-123',
        name: 'Pasta Carbonara',
        category: 'main-course',
        servings: 4,
        prepTime: 15,
        cookTime: 20,
        ingredients: [
          { name: 'Spaghetti', quantity: 400, unit: 'g' },
          { name: 'Bacon', quantity: 200, unit: 'g' },
          { name: 'Eggs', quantity: 3, unit: 'pieces' }
        ],
        steps: [
          'Cook spaghetti until al dente',
          'Cook bacon until crispy',
          'Mix eggs with cheese',
          'Combine everything'
        ],
        notes: 'Traditional Italian recipe',
        imageUrl: 'https://example.com/carbonara.jpg',
        tags: ['pasta', 'italian', 'quick']
      }

      expect(() => RecipeSchema.parse(validRecipe)).not.toThrow()
    })

    it('should reject invalid recipe data', () => {
      const invalidRecipes = [
        // Missing required fields
        { id: '', name: 'Test', category: 'main-course', servings: 0 },
        // Invalid category
        { 
          id: 'test', 
          name: 'Test', 
          category: 'invalid', 
          servings: 4, 
          ingredients: [{ name: 'Test', quantity: 1, unit: 'cup' }],
          steps: ['Step 1']
        },
        // No ingredients
        { 
          id: 'test', 
          name: 'Test', 
          category: 'main-course', 
          servings: 4, 
          ingredients: [],
          steps: ['Step 1']
        },
        // No steps
        { 
          id: 'test', 
          name: 'Test', 
          category: 'main-course', 
          servings: 4, 
          ingredients: [{ name: 'Test', quantity: 1, unit: 'cup' }],
          steps: []
        },
        // Negative servings
        { 
          id: 'test', 
          name: 'Test', 
          category: 'main-course', 
          servings: -1, 
          ingredients: [{ name: 'Test', quantity: 1, unit: 'cup' }],
          steps: ['Step 1']
        }
      ]

      invalidRecipes.forEach(recipe => {
        expect(() => RecipeSchema.parse(recipe)).toThrow()
      })
    })

    it('should validate recipe with minimum required fields', () => {
      const minimalRecipe: Recipe = {
        id: 'recipe-123',
        name: 'Simple Recipe',
        category: 'snack',
        servings: 1,
        prepTime: 0,
        cookTime: 0,
        ingredients: [
          { name: 'Ingredient', quantity: 1, unit: 'piece' }
        ],
        steps: ['Do something']
      }

      expect(() => RecipeSchema.parse(minimalRecipe)).not.toThrow()
    })

    it('should validate ingredient quantities and units', () => {
      const recipeWithVariousIngredients: Recipe = {
        id: 'recipe-123',
        name: 'Complex Recipe',
        category: 'main-course',
        servings: 4,
        prepTime: 30,
        cookTime: 45,
        ingredients: [
          { name: 'Flour', quantity: 2.5, unit: 'cups' },
          { name: 'Salt', quantity: 0.5, unit: 'tsp' },
          { name: 'Eggs', quantity: 3, unit: 'large' },
          { name: 'Milk', quantity: 1.25, unit: 'cups' }
        ],
        steps: [
          'Mix dry ingredients',
          'Beat eggs and milk',
          'Combine wet and dry ingredients',
          'Cook until done'
        ]
      }

      expect(() => RecipeSchema.parse(recipeWithVariousIngredients)).not.toThrow()
    })
  })

  describe('User Activity Schema Validation', () => {
    it('should validate valid user activity data', () => {
      const validActivity: UserActivity = {
        id: 'activity-123',
        userId: 'user-456',
        userEmail: 'user@example.com',
        action: 'create',
        entityType: 'product',
        entityId: 'product-789',
        entityName: 'New Product',
        timestamp: new Date(),
        restaurantId: 'restaurant-abc'
      }

      expect(() => UserActivitySchema.parse(validActivity)).not.toThrow()
    })

    it('should reject invalid user activity data', () => {
      const invalidActivities = [
        // Invalid email
        { 
          id: 'test', 
          userId: 'user', 
          userEmail: 'invalid-email',
          action: 'create',
          entityType: 'product',
          entityId: 'entity',
          entityName: 'name',
          timestamp: new Date(),
          restaurantId: 'restaurant'
        },
        // Invalid action
        { 
          id: 'test', 
          userId: 'user', 
          userEmail: 'user@example.com',
          action: 'invalid',
          entityType: 'product',
          entityId: 'entity',
          entityName: 'name',
          timestamp: new Date(),
          restaurantId: 'restaurant'
        },
        // Invalid entity type
        { 
          id: 'test', 
          userId: 'user', 
          userEmail: 'user@example.com',
          action: 'create',
          entityType: 'invalid',
          entityId: 'entity',
          entityName: 'name',
          timestamp: new Date(),
          restaurantId: 'restaurant'
        }
      ]

      invalidActivities.forEach(activity => {
        expect(() => UserActivitySchema.parse(activity)).toThrow()
      })
    })
  })

  describe('Restaurant Data Schema Validation', () => {
    it('should validate valid restaurant data', () => {
      const validRestaurant: RestaurantData = {
        id: 'restaurant-123',
        name: 'Test Restaurant',
        adminEmails: ['admin@example.com', 'owner@example.com'],
        settings: {
          timezone: 'Europe/Paris',
          currency: 'EUR',
          features: {
            inventory: true,
            recipes: true,
            menu: false,
            shoppingList: true
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(() => RestaurantDataSchema.parse(validRestaurant)).not.toThrow()
    })

    it('should reject invalid restaurant data', () => {
      const invalidRestaurants = [
        // No admin emails
        {
          id: 'test',
          name: 'Test',
          adminEmails: [],
          settings: {
            timezone: 'UTC',
            currency: 'USD',
            features: { inventory: true, recipes: true, menu: true, shoppingList: true }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        // Invalid currency code
        {
          id: 'test',
          name: 'Test',
          adminEmails: ['admin@example.com'],
          settings: {
            timezone: 'UTC',
            currency: 'INVALID',
            features: { inventory: true, recipes: true, menu: true, shoppingList: true }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        // Invalid email format
        {
          id: 'test',
          name: 'Test',
          adminEmails: ['invalid-email'],
          settings: {
            timezone: 'UTC',
            currency: 'USD',
            features: { inventory: true, recipes: true, menu: true, shoppingList: true }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      invalidRestaurants.forEach(restaurant => {
        expect(() => RestaurantDataSchema.parse(restaurant)).toThrow()
      })
    })
  })

  describe('Firestore Schema Validation', () => {
    it('should validate Firestore product with server timestamps', () => {
      const firestoreProduct = {
        id: 'product-123',
        name: 'Test Product',
        category: 'vegetables',
        batches: [
          {
            id: 'batch-1',
            quantity: 5,
            unit: 'kg',
            purchasePrice: 10.50,
            supplier: 'Supplier',
            expiryDate: { seconds: 1672531200, nanoseconds: 0 } // Firebase Timestamp
          }
        ],
        restaurantId: 'restaurant-123',
        createdAt: { seconds: 1672531200, nanoseconds: 0 },
        updatedAt: { seconds: 1672531200, nanoseconds: 0 },
        createdBy: 'user@example.com'
      }

      expect(() => FirestoreProductSchema.parse(firestoreProduct)).not.toThrow()
    })

    it('should validate Firestore recipe with server timestamps', () => {
      const firestoreRecipe = {
        id: 'recipe-123',
        name: 'Test Recipe',
        category: 'main-course',
        servings: 4,
        prepTime: 15,
        cookTime: 30,
        ingredients: [
          { name: 'Ingredient', quantity: 1, unit: 'cup' }
        ],
        steps: ['Step 1'],
        restaurantId: 'restaurant-123',
        createdAt: { seconds: 1672531200, nanoseconds: 0 },
        updatedAt: { seconds: 1672531200, nanoseconds: 0 },
        createdBy: 'user@example.com'
      }

      expect(() => FirestoreRecipeSchema.parse(firestoreRecipe)).not.toThrow()
    })
  })

  describe('Property-based testing', () => {
    it('should validate any valid product category', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('vegetables', 'meat', 'dairy', 'grains', 'beverages', 'other'),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 1000 }),
          (category, name, quantity) => {
            const product = {
              id: 'test-id',
              name,
              category,
              batches: [
                {
                  id: 'batch-1',
                  quantity,
                  unit: 'kg',
                  purchasePrice: 10.0,
                  supplier: 'Test Supplier',
                  expiryDate: new Date()
                }
              ]
            }

            expect(() => ProductSchema.parse(product)).not.toThrow()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should validate any valid recipe category', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('appetizer', 'main-course', 'side-dish', 'dessert', 'beverage', 'snack'),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 20 }),
          (category, name, servings) => {
            const recipe = {
              id: 'test-id',
              name,
              category,
              servings,
              prepTime: 0,
              cookTime: 0,
              ingredients: [
                { name: 'Ingredient', quantity: 1, unit: 'cup' }
              ],
              steps: ['Step 1']
            }

            expect(() => RecipeSchema.parse(recipe)).not.toThrow()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should validate various email formats for admin emails', () => {
      fc.assert(
        fc.property(
          fc.array(fc.emailAddress(), { minLength: 1, maxLength: 5 }),
          (adminEmails) => {
            const restaurant = {
              id: 'test-id',
              name: 'Test Restaurant',
              adminEmails,
              settings: {
                timezone: 'UTC',
                currency: 'USD',
                features: {
                  inventory: true,
                  recipes: true,
                  menu: true,
                  shoppingList: true
                }
              },
              createdAt: new Date(),
              updatedAt: new Date()
            }

            expect(() => RestaurantDataSchema.parse(restaurant)).not.toThrow()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should validate various ingredient quantities and units', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              quantity: fc.float({ min: 0.1, max: 100 }),
              unit: fc.string({ minLength: 1, maxLength: 20 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (ingredients) => {
            const recipe = {
              id: 'test-id',
              name: 'Test Recipe',
              category: 'main-course' as const,
              servings: 4,
              prepTime: 0,
              cookTime: 0,
              ingredients,
              steps: ['Step 1']
            }

            expect(() => RecipeSchema.parse(recipe)).not.toThrow()
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Edge cases and boundary conditions', () => {
    it('should handle minimum valid values', () => {
      const minimalProduct = {
        id: '1',
        name: 'x',
        category: 'other' as const,
        batches: []
      }

      expect(() => ProductSchema.parse(minimalProduct)).not.toThrow()
    })

    it('should handle maximum valid values', () => {
      const maximalProduct = {
        id: 'x'.repeat(100),
        name: 'x'.repeat(100),
        category: 'vegetables' as const,
        imageUrl: 'https://example.com/' + 'x'.repeat(1000),
        batches: Array.from({ length: 100 }, (_, i) => ({
          id: `batch-${i}`,
          quantity: 9999.99,
          unit: 'x'.repeat(50),
          purchasePrice: 99999.99,
          supplier: 'x'.repeat(100),
          expiryDate: new Date('2099-12-31'),
          barcode: '1'.repeat(50),
          notes: 'x'.repeat(1000)
        }))
      }

      expect(() => ProductSchema.parse(maximalProduct)).not.toThrow()
    })

    it('should reject values at boundaries', () => {
      // Empty string for required field
      expect(() => ProductSchema.parse({
        id: '',
        name: 'Test',
        category: 'other',
        batches: []
      })).toThrow()

      // Name too long
      expect(() => ProductSchema.parse({
        id: 'test',
        name: 'x'.repeat(101),
        category: 'other',
        batches: []
      })).toThrow()

      // Zero servings
      expect(() => RecipeSchema.parse({
        id: 'test',
        name: 'Test',
        category: 'main-course',
        servings: 0,
        prepTime: 0,
        cookTime: 0,
        ingredients: [{ name: 'Test', quantity: 1, unit: 'cup' }],
        steps: ['Step 1']
      })).toThrow()

      // Negative quantity
      expect(() => RecipeSchema.parse({
        id: 'test',
        name: 'Test',
        category: 'main-course',
        servings: 4,
        prepTime: 0,
        cookTime: 0,
        ingredients: [{ name: 'Test', quantity: -1, unit: 'cup' }],
        steps: ['Step 1']
      })).toThrow()
    })
  })
})