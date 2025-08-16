import { describe, it, expect } from 'vitest'
import { 
  categories, 
  categoryNames, 
  type Category, 
  type Product, 
  type Batch, 
  type Ingredient, 
  type Recipe, 
  type Difficulty 
} from '@/lib/types'

describe('Types validation', () => {
  describe('Category types', () => {
    it('should contain all expected categories', () => {
      const expectedCategories = ['frais', 'surgelé', 'épicerie', 'boisson', 'entretien']
      expect(categories).toEqual(expectedCategories)
      expect(categories).toHaveLength(5)
    })

    it('should have category names for all categories', () => {
      categories.forEach(category => {
        expect(categoryNames[category]).toBeDefined()
        expect(typeof categoryNames[category]).toBe('string')
        expect(categoryNames[category].length).toBeGreaterThan(0)
      })
    })

    it('should have proper French category names', () => {
      expect(categoryNames.frais).toBe('Frais')
      expect(categoryNames.surgelé).toBe('Surgelé')
      expect(categoryNames.épicerie).toBe('Épicerie')
      expect(categoryNames.boisson).toBe('Boissons')
      expect(categoryNames.entretien).toBe('Entretien')
    })
  })

  describe('Batch interface', () => {
    it('should accept valid batch object', () => {
      const validBatch: Batch = {
        id: 'batch-1',
        quantity: 10,
        expiryDate: new Date('2024-12-31')
      }

      expect(validBatch.id).toBe('batch-1')
      expect(validBatch.quantity).toBe(10)
      expect(validBatch.expiryDate).toBeInstanceOf(Date)
    })

    it('should accept batch with null expiry date', () => {
      const batchWithoutExpiry: Batch = {
        id: 'batch-2',
        quantity: 5,
        expiryDate: null
      }

      expect(batchWithoutExpiry.expiryDate).toBeNull()
    })

    it('should validate quantity is a number', () => {
      const batch: Batch = {
        id: 'test',
        quantity: 0,
        expiryDate: null
      }

      expect(typeof batch.quantity).toBe('number')
      expect(batch.quantity).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Product interface', () => {
    it('should accept valid product object', () => {
      const validProduct: Product = {
        id: 'product-1',
        name: 'Pommes',
        category: 'frais',
        imageUrl: 'https://example.com/pommes.jpg',
        batches: [
          {
            id: 'batch-1',
            quantity: 10,
            expiryDate: new Date('2024-12-31')
          }
        ]
      }

      expect(validProduct.id).toBe('product-1')
      expect(validProduct.name).toBe('Pommes')
      expect(categories.includes(validProduct.category)).toBe(true)
      expect(Array.isArray(validProduct.batches)).toBe(true)
    })

    it('should accept product without imageUrl', () => {
      const productWithoutImage: Product = {
        id: 'product-2',
        name: 'Bananes',
        category: 'frais',
        batches: []
      }

      expect(productWithoutImage.imageUrl).toBeUndefined()
      expect(productWithoutImage.batches).toEqual([])
    })

    it('should validate category is one of allowed values', () => {
      categories.forEach(category => {
        const product: Product = {
          id: 'test',
          name: 'Test Product',
          category,
          batches: []
        }
        
        expect(categories.includes(product.category)).toBe(true)
      })
    })
  })

  describe('Ingredient interface', () => {
    it('should accept valid ingredient object', () => {
      const validIngredient: Ingredient = {
        productId: 'product-1',
        quantity: 250,
        unit: 'g'
      }

      expect(validIngredient.productId).toBe('product-1')
      expect(validIngredient.quantity).toBe(250)
      expect(['g', 'ml', 'piece'].includes(validIngredient.unit)).toBe(true)
    })

    it('should accept all valid units', () => {
      const units: Array<'g' | 'ml' | 'piece'> = ['g', 'ml', 'piece']
      
      units.forEach(unit => {
        const ingredient: Ingredient = {
          productId: 'test',
          quantity: 1,
          unit
        }
        
        expect(ingredient.unit).toBe(unit)
      })
    })

    it('should validate quantity is positive', () => {
      const ingredient: Ingredient = {
        productId: 'test',
        quantity: 100,
        unit: 'g'
      }

      expect(ingredient.quantity).toBeGreaterThan(0)
      expect(typeof ingredient.quantity).toBe('number')
    })
  })

  describe('Recipe interface', () => {
    it('should accept valid recipe object', () => {
      const validRecipe: Recipe = {
        id: 'recipe-1',
        name: 'Tarte aux pommes',
        description: 'Une délicieuse tarte aux pommes maison',
        imageUrl: 'https://example.com/tarte.jpg',
        ingredients: [
          {
            productId: 'pommes',
            quantity: 500,
            unit: 'g'
          }
        ],
        preparationTime: 30,
        cookingTime: 45,
        difficulty: 'moyen'
      }

      expect(validRecipe.id).toBe('recipe-1')
      expect(validRecipe.name).toBe('Tarte aux pommes')
      expect(Array.isArray(validRecipe.ingredients)).toBe(true)
      expect(validRecipe.preparationTime).toBe(30)
      expect(validRecipe.cookingTime).toBe(45)
    })

    it('should accept recipe with minimal required fields', () => {
      const minimalRecipe: Recipe = {
        id: 'recipe-2',
        name: 'Recette simple',
        description: 'Description simple',
        ingredients: []
      }

      expect(minimalRecipe.imageUrl).toBeUndefined()
      expect(minimalRecipe.preparationTime).toBeUndefined()
      expect(minimalRecipe.cookingTime).toBeUndefined()
      expect(minimalRecipe.difficulty).toBeUndefined()
    })

    it('should validate difficulty levels', () => {
      const difficulties: Difficulty[] = ['facile', 'moyen', 'difficile']
      
      difficulties.forEach(difficulty => {
        const recipe: Recipe = {
          id: 'test',
          name: 'Test Recipe',
          description: 'Test',
          ingredients: [],
          difficulty
        }
        
        expect(['facile', 'moyen', 'difficile'].includes(recipe.difficulty!)).toBe(true)
      })
    })

    it('should validate time fields are positive numbers', () => {
      const recipe: Recipe = {
        id: 'test',
        name: 'Test Recipe',
        description: 'Test',
        ingredients: [],
        preparationTime: 15,
        cookingTime: 30
      }

      if (recipe.preparationTime !== undefined) {
        expect(recipe.preparationTime).toBeGreaterThan(0)
        expect(typeof recipe.preparationTime).toBe('number')
      }
      
      if (recipe.cookingTime !== undefined) {
        expect(recipe.cookingTime).toBeGreaterThan(0)
        expect(typeof recipe.cookingTime).toBe('number')
      }
    })
  })

  describe('Data consistency', () => {
    it('should have consistent category keys between array and names object', () => {
      const categoryKeys = Object.keys(categoryNames) as Category[]
      expect(categoryKeys.sort()).toEqual(categories.sort())
    })

    it('should maintain type safety for nested objects', () => {
      const product: Product = {
        id: 'test-product',
        name: 'Test Product',
        category: 'frais',
        batches: [
          {
            id: 'test-batch',
            quantity: 10,
            expiryDate: new Date()
          }
        ]
      }

      const recipe: Recipe = {
        id: 'test-recipe',
        name: 'Test Recipe',
        description: 'Test Description',
        ingredients: [
          {
            productId: product.id,
            quantity: 100,
            unit: 'g'
          }
        ]
      }

      expect(recipe.ingredients[0].productId).toBe(product.id)
      expect(product.batches[0].quantity).toBeGreaterThan(0)
    })
  })
})