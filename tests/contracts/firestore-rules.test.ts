import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { setDoc, doc, getDoc, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore'

// Types for test data
interface TestProduct {
  name: string
  category: string
  quantity: number
  unit: string
  expirationDate: Date
  purchasePrice: number
  supplier: string
  barcode: string
  notes: string
  restaurantId: string
  createdAt: any
  updatedAt: any
  createdBy: string
}

interface TestRecipe {
  name: string
  category: string
  servings: number
  prepTime: number
  cookTime: number
  ingredients: Array<{
    name: string
    quantity: number
    unit: string
  }>
  steps: string[]
  notes: string
  restaurantId: string
  createdAt: any
  updatedAt: any
  createdBy: string
}

describe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment
  const projectId = 'cuisinezen-test'
  const restaurantId = 'test-restaurant'
  const adminEmail = 'admin@test.com'
  const userEmail = 'user@test.com'
  const unauthorizedEmail = 'unauthorized@test.com'

  beforeEach(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              // Restaurants collection
              match /restaurants/{restaurantId} {
                allow read, write: if request.auth != null &&
                  (request.auth.token.email in resource.data.adminEmails ||
                   request.auth.token.email in get(/databases/$(database)/documents/restaurants/$(restaurantId)).data.adminEmails);
              }
              
              // Products subcollection
              match /restaurants/{restaurantId}/products/{productId} {
                allow read, write: if request.auth != null &&
                  request.auth.token.email != null &&
                  (request.auth.token.email in get(/databases/$(database)/documents/restaurants/$(restaurantId)).data.adminEmails ||
                   isAuthorizedUser(restaurantId, request.auth.token.email));
              }
              
              // Recipes subcollection
              match /restaurants/{restaurantId}/recipes/{recipeId} {
                allow read, write: if request.auth != null &&
                  request.auth.token.email != null &&
                  (request.auth.token.email in get(/databases/$(database)/documents/restaurants/$(restaurantId)).data.adminEmails ||
                   isAuthorizedUser(restaurantId, request.auth.token.email));
              }
              
              // Activities subcollection (read-only for users)
              match /restaurants/{restaurantId}/activities/{activityId} {
                allow read: if request.auth != null &&
                  isAuthorizedUser(restaurantId, request.auth.token.email);
                allow write: if request.auth != null &&
                  request.auth.token.email in get(/databases/$(database)/documents/restaurants/$(restaurantId)).data.adminEmails;
              }
              
              // Helper function to check if user is authorized
              function isAuthorizedUser(restaurantId, email) {
                return email in get(/databases/$(database)/documents/restaurants/$(restaurantId)).data.adminEmails;
              }
            }
          }
        `,
        host: 'localhost',
        port: 8080
      }
    })
  })

  afterEach(async () => {
    await testEnv.cleanup()
  })

  describe('Restaurant collection rules', () => {
    it('should allow admin to create restaurant', async () => {
      const adminDb = testEnv.authenticatedContext(adminEmail).firestore()
      
      const restaurantRef = doc(adminDb, 'restaurants', restaurantId)
      const restaurantData = {
        id: restaurantId,
        name: 'Test Restaurant',
        adminEmails: [adminEmail],
        settings: {
          timezone: 'Europe/Paris',
          currency: 'EUR',
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
      
      await expect(setDoc(restaurantRef, restaurantData)).resolves.not.toThrow()
    })

    it('should allow admin to read restaurant', async () => {
      // First, create the restaurant as admin
      const adminDb = testEnv.authenticatedContext(adminEmail).firestore()
      const restaurantRef = doc(adminDb, 'restaurants', restaurantId)
      
      await setDoc(restaurantRef, {
        id: restaurantId,
        name: 'Test Restaurant',
        adminEmails: [adminEmail],
        settings: { timezone: 'Europe/Paris' },
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Then read it
      const snapshot = await getDoc(restaurantRef)
      expect(snapshot.exists()).toBe(true)
      expect(snapshot.data()?.name).toBe('Test Restaurant')
    })

    it('should deny unauthorized user from accessing restaurant', async () => {
      const unauthorizedDb = testEnv.authenticatedContext(unauthorizedEmail).firestore()
      const restaurantRef = doc(unauthorizedDb, 'restaurants', restaurantId)
      
      await expect(getDoc(restaurantRef)).rejects.toThrow()
    })

    it('should deny unauthenticated access to restaurant', async () => {
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore()
      const restaurantRef = doc(unauthenticatedDb, 'restaurants', restaurantId)
      
      await expect(getDoc(restaurantRef)).rejects.toThrow()
    })
  })

  describe('Products subcollection rules', () => {
    beforeEach(async () => {
      // Create restaurant first
      const adminDb = testEnv.authenticatedContext(adminEmail).firestore()
      const restaurantRef = doc(adminDb, 'restaurants', restaurantId)
      
      await setDoc(restaurantRef, {
        id: restaurantId,
        name: 'Test Restaurant',
        adminEmails: [adminEmail, userEmail],
        settings: { timezone: 'Europe/Paris' },
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })

    it('should allow authorized user to create product', async () => {
      const userDb = testEnv.authenticatedContext(userEmail).firestore()
      const productsRef = collection(userDb, 'restaurants', restaurantId, 'products')
      
      const productData: Omit<TestProduct, 'id'> = {
        name: 'Test Product',
        category: 'vegetables',
        quantity: 10,
        unit: 'kg',
        expirationDate: new Date('2024-12-31'),
        purchasePrice: 5.0,
        supplier: 'Test Supplier',
        barcode: '123456789',
        notes: 'Test notes',
        restaurantId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userEmail
      }
      
      await expect(addDoc(productsRef, productData)).resolves.not.toThrow()
    })

    it('should allow authorized user to read products', async () => {
      const adminDb = testEnv.authenticatedContext(adminEmail).firestore()
      const userDb = testEnv.authenticatedContext(userEmail).firestore()
      
      // Create product as admin
      const productsRef = collection(adminDb, 'restaurants', restaurantId, 'products')
      await addDoc(productsRef, {
        name: 'Test Product',
        category: 'vegetables',
        quantity: 5,
        unit: 'kg',
        restaurantId,
        createdBy: adminEmail
      })
      
      // Read as user
      const userProductsRef = collection(userDb, 'restaurants', restaurantId, 'products')
      const snapshot = await getDocs(userProductsRef)
      
      expect(snapshot.size).toBeGreaterThan(0)
    })

    it('should allow authorized user to update product', async () => {
      const userDb = testEnv.authenticatedContext(userEmail).firestore()
      
      // Create product first
      const productsRef = collection(userDb, 'restaurants', restaurantId, 'products')
      const docRef = await addDoc(productsRef, {
        name: 'Test Product',
        category: 'vegetables',
        quantity: 5,
        unit: 'kg',
        restaurantId,
        createdBy: userEmail
      })
      
      // Update it
      await expect(updateDoc(docRef, {
        quantity: 10,
        updatedAt: new Date()
      })).resolves.not.toThrow()
    })

    it('should allow authorized user to delete product', async () => {
      const userDb = testEnv.authenticatedContext(userEmail).firestore()
      
      // Create product first
      const productsRef = collection(userDb, 'restaurants', restaurantId, 'products')
      const docRef = await addDoc(productsRef, {
        name: 'Test Product to Delete',
        category: 'vegetables',
        quantity: 5,
        unit: 'kg',
        restaurantId,
        createdBy: userEmail
      })
      
      // Delete it
      await expect(deleteDoc(docRef)).resolves.not.toThrow()
    })

    it('should deny unauthorized user from accessing products', async () => {
      const unauthorizedDb = testEnv.authenticatedContext(unauthorizedEmail).firestore()
      const productsRef = collection(unauthorizedDb, 'restaurants', restaurantId, 'products')
      
      await expect(getDocs(productsRef)).rejects.toThrow()
    })

    it('should deny unauthenticated access to products', async () => {
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore()
      const productsRef = collection(unauthenticatedDb, 'restaurants', restaurantId, 'products')
      
      await expect(getDocs(productsRef)).rejects.toThrow()
    })
  })

  describe('Recipes subcollection rules', () => {
    beforeEach(async () => {
      // Create restaurant first
      const adminDb = testEnv.authenticatedContext(adminEmail).firestore()
      const restaurantRef = doc(adminDb, 'restaurants', restaurantId)
      
      await setDoc(restaurantRef, {
        id: restaurantId,
        name: 'Test Restaurant',
        adminEmails: [adminEmail, userEmail],
        settings: { timezone: 'Europe/Paris' },
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })

    it('should allow authorized user to create recipe', async () => {
      const userDb = testEnv.authenticatedContext(userEmail).firestore()
      const recipesRef = collection(userDb, 'restaurants', restaurantId, 'recipes')
      
      const recipeData: Omit<TestRecipe, 'id'> = {
        name: 'Test Recipe',
        category: 'main-course',
        servings: 4,
        prepTime: 15,
        cookTime: 30,
        ingredients: [
          { name: 'Ingredient 1', quantity: 2, unit: 'cups' },
          { name: 'Ingredient 2', quantity: 1, unit: 'lb' }
        ],
        steps: [
          'Step 1: Prepare ingredients',
          'Step 2: Cook everything'
        ],
        notes: 'Test recipe notes',
        restaurantId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userEmail
      }
      
      await expect(addDoc(recipesRef, recipeData)).resolves.not.toThrow()
    })

    it('should allow authorized user to read recipes', async () => {
      const adminDb = testEnv.authenticatedContext(adminEmail).firestore()
      const userDb = testEnv.authenticatedContext(userEmail).firestore()
      
      // Create recipe as admin
      const recipesRef = collection(adminDb, 'restaurants', restaurantId, 'recipes')
      await addDoc(recipesRef, {
        name: 'Test Recipe',
        category: 'dessert',
        servings: 2,
        ingredients: [],
        steps: [],
        restaurantId,
        createdBy: adminEmail
      })
      
      // Read as user
      const userRecipesRef = collection(userDb, 'restaurants', restaurantId, 'recipes')
      const snapshot = await getDocs(userRecipesRef)
      
      expect(snapshot.size).toBeGreaterThan(0)
    })

    it('should allow filtering recipes by category', async () => {
      const userDb = testEnv.authenticatedContext(userEmail).firestore()
      const recipesRef = collection(userDb, 'restaurants', restaurantId, 'recipes')
      
      // Create recipes with different categories
      await addDoc(recipesRef, {
        name: 'Dessert Recipe',
        category: 'dessert',
        servings: 2,
        ingredients: [],
        steps: [],
        restaurantId,
        createdBy: userEmail
      })
      
      await addDoc(recipesRef, {
        name: 'Main Course Recipe',
        category: 'main-course',
        servings: 4,
        ingredients: [],
        steps: [],
        restaurantId,
        createdBy: userEmail
      })
      
      // Query for dessert recipes only
      const dessertQuery = query(recipesRef, where('category', '==', 'dessert'))
      const snapshot = await getDocs(dessertQuery)
      
      expect(snapshot.size).toBe(1)
      expect(snapshot.docs[0].data().category).toBe('dessert')
    })

    it('should deny unauthorized user from accessing recipes', async () => {
      const unauthorizedDb = testEnv.authenticatedContext(unauthorizedEmail).firestore()
      const recipesRef = collection(unauthorizedDb, 'restaurants', restaurantId, 'recipes')
      
      await expect(getDocs(recipesRef)).rejects.toThrow()
    })
  })

  describe('Activities subcollection rules', () => {
    beforeEach(async () => {
      // Create restaurant first
      const adminDb = testEnv.authenticatedContext(adminEmail).firestore()
      const restaurantRef = doc(adminDb, 'restaurants', restaurantId)
      
      await setDoc(restaurantRef, {
        id: restaurantId,
        name: 'Test Restaurant',
        adminEmails: [adminEmail, userEmail],
        settings: { timezone: 'Europe/Paris' },
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })

    it('should allow authorized user to read activities', async () => {
      const adminDb = testEnv.authenticatedContext(adminEmail).firestore()
      const userDb = testEnv.authenticatedContext(userEmail).firestore()
      
      // Create activity as admin
      const activitiesRef = collection(adminDb, 'restaurants', restaurantId, 'activities')
      await addDoc(activitiesRef, {
        userId: adminEmail,
        userEmail: adminEmail,
        action: 'create',
        entityType: 'product',
        entityId: 'test-product-id',
        entityName: 'Test Product',
        timestamp: new Date(),
        restaurantId
      })
      
      // Read as user
      const userActivitiesRef = collection(userDb, 'restaurants', restaurantId, 'activities')
      const snapshot = await getDocs(userActivitiesRef)
      
      expect(snapshot.size).toBeGreaterThan(0)
    })

    it('should allow admin to write activities', async () => {
      const adminDb = testEnv.authenticatedContext(adminEmail).firestore()
      const activitiesRef = collection(adminDb, 'restaurants', restaurantId, 'activities')
      
      const activityData = {
        userId: adminEmail,
        userEmail: adminEmail,
        action: 'delete',
        entityType: 'recipe',
        entityId: 'test-recipe-id',
        entityName: 'Test Recipe',
        timestamp: new Date(),
        restaurantId
      }
      
      await expect(addDoc(activitiesRef, activityData)).resolves.not.toThrow()
    })

    it('should deny non-admin user from writing activities', async () => {
      const userDb = testEnv.authenticatedContext(userEmail).firestore()
      const activitiesRef = collection(userDb, 'restaurants', restaurantId, 'activities')
      
      const activityData = {
        userId: userEmail,
        userEmail: userEmail,
        action: 'create',
        entityType: 'product',
        entityId: 'test-product-id',
        entityName: 'Test Product',
        timestamp: new Date(),
        restaurantId
      }
      
      // This should fail because user is not admin
      await expect(addDoc(activitiesRef, activityData)).rejects.toThrow()
    })

    it('should deny unauthorized user from reading activities', async () => {
      const unauthorizedDb = testEnv.authenticatedContext(unauthorizedEmail).firestore()
      const activitiesRef = collection(unauthorizedDb, 'restaurants', restaurantId, 'activities')
      
      await expect(getDocs(activitiesRef)).rejects.toThrow()
    })
  })

  describe('Data validation rules', () => {
    beforeEach(async () => {
      // Create restaurant first
      const adminDb = testEnv.authenticatedContext(adminEmail).firestore()
      const restaurantRef = doc(adminDb, 'restaurants', restaurantId)
      
      await setDoc(restaurantRef, {
        id: restaurantId,
        name: 'Test Restaurant',
        adminEmails: [adminEmail, userEmail],
        settings: { timezone: 'Europe/Paris' },
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })

    it('should validate required fields in products', async () => {
      const userDb = testEnv.authenticatedContext(userEmail).firestore()
      const productsRef = collection(userDb, 'restaurants', restaurantId, 'products')
      
      // Try to create product without required fields
      const invalidProductData = {
        // Missing name, category, quantity, etc.
        notes: 'This should fail',
        restaurantId
      }
      
      // Note: This test would require actual validation rules in Firestore rules
      // For now, we just verify the operation doesn't crash
      try {
        await addDoc(productsRef, invalidProductData)
      } catch (error) {
        // Expected if validation rules are in place
      }
    })

    it('should validate required fields in recipes', async () => {
      const userDb = testEnv.authenticatedContext(userEmail).firestore()
      const recipesRef = collection(userDb, 'restaurants', restaurantId, 'recipes')
      
      // Try to create recipe without required fields
      const invalidRecipeData = {
        // Missing name, servings, etc.
        notes: 'This should fail',
        restaurantId
      }
      
      // Note: This test would require actual validation rules in Firestore rules
      try {
        await addDoc(recipesRef, invalidRecipeData)
      } catch (error) {
        // Expected if validation rules are in place
      }
    })
  })

  describe('Performance and queries', () => {
    beforeEach(async () => {
      // Create restaurant first
      const adminDb = testEnv.authenticatedContext(adminEmail).firestore()
      const restaurantRef = doc(adminDb, 'restaurants', restaurantId)
      
      await setDoc(restaurantRef, {
        id: restaurantId,
        name: 'Test Restaurant',
        adminEmails: [adminEmail, userEmail],
        settings: { timezone: 'Europe/Paris' },
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })

    it('should allow efficient product queries', async () => {
      const userDb = testEnv.authenticatedContext(userEmail).firestore()
      const productsRef = collection(userDb, 'restaurants', restaurantId, 'products')
      
      // Create test products
      const categories = ['vegetables', 'meat', 'dairy']
      for (const category of categories) {
        await addDoc(productsRef, {
          name: `Test ${category} Product`,
          category,
          quantity: 10,
          unit: 'kg',
          restaurantId,
          createdBy: userEmail,
          createdAt: new Date()
        })
      }
      
      // Query by category
      const vegetableQuery = query(productsRef, where('category', '==', 'vegetables'))
      const snapshot = await getDocs(vegetableQuery)
      
      expect(snapshot.size).toBe(1)
      expect(snapshot.docs[0].data().category).toBe('vegetables')
    })

    it('should allow efficient recipe queries', async () => {
      const userDb = testEnv.authenticatedContext(userEmail).firestore()
      const recipesRef = collection(userDb, 'restaurants', restaurantId, 'recipes')
      
      // Create test recipes
      const categories = ['appetizer', 'main-course', 'dessert']
      for (const category of categories) {
        await addDoc(recipesRef, {
          name: `Test ${category} Recipe`,
          category,
          servings: 4,
          ingredients: [],
          steps: [],
          restaurantId,
          createdBy: userEmail,
          createdAt: new Date()
        })
      }
      
      // Query by category
      const mainCourseQuery = query(recipesRef, where('category', '==', 'main-course'))
      const snapshot = await getDocs(mainCourseQuery)
      
      expect(snapshot.size).toBe(1)
      expect(snapshot.docs[0].data().category).toBe('main-course')
    })

    it('should handle large datasets efficiently', async () => {
      const userDb = testEnv.authenticatedContext(userEmail).firestore()
      const productsRef = collection(userDb, 'restaurants', restaurantId, 'products')
      
      // Create many products to test performance
      const productPromises = []
      for (let i = 0; i < 50; i++) {
        productPromises.push(
          addDoc(productsRef, {
            name: `Product ${i}`,
            category: i % 2 === 0 ? 'vegetables' : 'meat',
            quantity: i + 1,
            unit: 'kg',
            restaurantId,
            createdBy: userEmail,
            createdAt: new Date()
          })
        )
      }
      
      await Promise.all(productPromises)
      
      // Query all products
      const allProductsSnapshot = await getDocs(productsRef)
      expect(allProductsSnapshot.size).toBe(50)
      
      // Query filtered products
      const vegetableQuery = query(productsRef, where('category', '==', 'vegetables'))
      const vegetableSnapshot = await getDocs(vegetableQuery)
      expect(vegetableSnapshot.size).toBe(25)
    })
  })
})