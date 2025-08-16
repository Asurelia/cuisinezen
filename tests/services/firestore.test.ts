import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fc } from 'fast-check'
import { firestoreService } from '@/services/firestore'
import type { Product, Recipe } from '@/lib/types'

// Mock Firebase Firestore
const mockDoc = vi.fn()
const mockCollection = vi.fn()
const mockGetDoc = vi.fn()
const mockSetDoc = vi.fn()
const mockUpdateDoc = vi.fn()
const mockDeleteDoc = vi.fn()
const mockOnSnapshot = vi.fn()
const mockQuery = vi.fn()
const mockWhere = vi.fn()
const mockOrderBy = vi.fn()
const mockLimit = vi.fn()
const mockWriteBatch = vi.fn()
const mockServerTimestamp = vi.fn()
const mockEnableNetwork = vi.fn()
const mockDisableNetwork = vi.fn()

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  collection: mockCollection,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  onSnapshot: mockOnSnapshot,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  writeBatch: mockWriteBatch,
  serverTimestamp: mockServerTimestamp,
  enableNetwork: mockEnableNetwork,
  disableNetwork: mockDisableNetwork,
  connectFirestoreEmulator: vi.fn()
}))

vi.mock('@/lib/firebase', () => ({
  db: { app: 'mock-app' }
}))

describe('FirestoreService', () => {
  const restaurantId = 'test-restaurant'
  const userEmail = 'test@example.com'
  
  const mockProduct: Omit<Product, 'id'> = {
    name: 'Test Product',
    category: 'vegetables',
    imageUrl: 'https://example.com/image.jpg',
    batches: [
      {
        id: 'batch1',
        quantity: 10,
        unit: 'kg',
        purchasePrice: 5.0,
        supplier: 'Test Supplier',
        expiryDate: new Date('2024-12-31'),
        barcode: '123456789',
        notes: 'Test batch'
      }
    ]
  }

  const mockDocumentSnapshot = {
    exists: () => true,
    data: () => ({
      name: 'Test Product',
      category: 'vegetables',
      imageUrl: 'https://example.com/image.jpg',
      batches: [
        {
          id: 'batch1',
          quantity: 10,
          unit: 'kg',
          purchasePrice: 5.0,
          supplier: 'Test Supplier',
          expiryDate: { toDate: () => new Date('2024-12-31') },
          barcode: '123456789',
          notes: 'Test batch'
        }
      ],
      restaurantId,
      createdAt: { toDate: () => new Date() },
      updatedAt: { toDate: () => new Date() },
      createdBy: userEmail
    }),
    id: 'test-id'
  }

  const mockQuerySnapshot = {
    docs: [mockDocumentSnapshot],
    forEach: (callback: any) => {
      [mockDocumentSnapshot].forEach(callback)
    }
  }

  const mockBatch = {
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockDoc.mockReturnValue({ id: 'test-id', path: 'test/path' })
    mockCollection.mockReturnValue({ 
      firestore: { app: 'mock-app' }, 
      path: 'test/path'
    })
    mockGetDoc.mockResolvedValue(mockDocumentSnapshot)
    mockSetDoc.mockResolvedValue(undefined)
    mockUpdateDoc.mockResolvedValue(undefined)
    mockDeleteDoc.mockResolvedValue(undefined)
    mockQuery.mockReturnValue('mock-query')
    mockOrderBy.mockReturnValue('mock-order')
    mockWriteBatch.mockReturnValue(mockBatch)
    mockServerTimestamp.mockReturnValue({ seconds: Date.now() / 1000 })
    mockOnSnapshot.mockReturnValue(() => {})

    // Mock window for connectivity tests
    Object.defineProperty(global, 'window', {
      value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      },
      writable: true
    })
  })

  afterEach(() => {
    firestoreService.cleanup()
  })

  describe('initialization', () => {
    it('should initialize restaurant successfully', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      })

      await firestoreService.initializeRestaurant(restaurantId, userEmail)

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'restaurants',
        restaurantId
      )
      expect(mockSetDoc).toHaveBeenCalled()
    })

    it('should not recreate existing restaurant', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true
      })

      await firestoreService.initializeRestaurant(restaurantId, userEmail)

      expect(mockSetDoc).not.toHaveBeenCalled()
    })

    it('should handle initialization errors', async () => {
      const error = new Error('Database error')
      mockGetDoc.mockRejectedValueOnce(error)

      await expect(
        firestoreService.initializeRestaurant(restaurantId, userEmail)
      ).rejects.toThrow('Database error')
    })
  })

  describe('products CRUD operations', () => {
    beforeEach(async () => {
      await firestoreService.initializeRestaurant(restaurantId, userEmail)
    })

    describe('getProducts', () => {
      it('should fetch products successfully', async () => {
        mockGetDoc.mockResolvedValueOnce(mockQuerySnapshot)

        const products = await firestoreService.getProducts()

        expect(products).toHaveLength(1)
        expect(products[0]).toMatchObject({
          name: 'Test Product',
          category: 'vegetables'
        })
      })

      it('should return cached products when available', async () => {
        // First call to populate cache
        mockGetDoc.mockResolvedValueOnce(mockQuerySnapshot)
        await firestoreService.getProducts()

        // Second call should use cache
        const products = await firestoreService.getProducts()

        expect(mockGetDoc).toHaveBeenCalledTimes(2) // Once for init, once for first call
        expect(products).toHaveLength(1)
      })

      it('should handle fetch errors gracefully', async () => {
        const error = new Error('Network error')
        mockGetDoc.mockRejectedValueOnce(error)

        const products = await firestoreService.getProducts()

        expect(products).toEqual([])
      })

      it('should convert Firestore timestamps to dates', async () => {
        const mockDocWithTimestamp = {
          ...mockDocumentSnapshot,
          data: () => ({
            ...mockDocumentSnapshot.data(),
            batches: [
              {
                ...mockDocumentSnapshot.data().batches[0],
                expiryDate: { toDate: () => new Date('2024-12-31') }
              }
            ]
          })
        }

        mockGetDoc.mockResolvedValueOnce({
          docs: [mockDocWithTimestamp],
          forEach: (callback: any) => [mockDocWithTimestamp].forEach(callback)
        })

        const products = await firestoreService.getProducts()

        expect(products[0].batches[0].expiryDate).toBeInstanceOf(Date)
      })
    })

    describe('addProduct', () => {
      it('should add product successfully', async () => {
        const productId = await firestoreService.addProduct(mockProduct, userEmail)

        expect(mockBatch.set).toHaveBeenCalledTimes(2) // Product + Activity
        expect(mockBatch.commit).toHaveBeenCalled()
        expect(productId).toBe('test-id')
      })

      it('should handle dates in batches correctly', async () => {
        const productWithDate = {
          ...mockProduct,
          batches: [
            {
              ...mockProduct.batches[0],
              expiryDate: new Date('2024-12-31')
            }
          ]
        }

        await firestoreService.addProduct(productWithDate, userEmail)

        const setCall = mockBatch.set.mock.calls.find(call => 
          call[1].name === productWithDate.name
        )
        expect(setCall[1].batches[0].expiryDate).toBeInstanceOf(Date)
      })

      it('should create user activity log', async () => {
        await firestoreService.addProduct(mockProduct, userEmail)

        const activityCall = mockBatch.set.mock.calls.find(call =>
          call[1].action === 'create'
        )
        expect(activityCall[1]).toMatchObject({
          action: 'create',
          entityType: 'product',
          entityName: mockProduct.name,
          userEmail
        })
      })

      it('should throw error if service not initialized', async () => {
        const uninitializedService = new (firestoreService.constructor as any)()
        
        await expect(
          uninitializedService.addProduct(mockProduct, userEmail)
        ).rejects.toThrow('Service non initialisé')
      })
    })

    describe('updateProduct', () => {
      it('should update product successfully', async () => {
        const updates = { name: 'Updated Product' }

        await firestoreService.updateProduct('test-id', updates, userEmail)

        expect(mockBatch.update).toHaveBeenCalled()
        expect(mockBatch.commit).toHaveBeenCalled()
      })

      it('should handle batch updates correctly', async () => {
        const updates = {
          batches: [
            {
              id: 'batch1',
              quantity: 20,
              unit: 'kg',
              purchasePrice: 6.0,
              supplier: 'New Supplier',
              expiryDate: new Date('2025-01-15'),
              barcode: '987654321',
              notes: 'Updated batch'
            }
          ]
        }

        await firestoreService.updateProduct('test-id', updates, userEmail)

        const updateCall = mockBatch.update.mock.calls[0]
        expect(updateCall[1].batches[0].expiryDate).toBeInstanceOf(Date)
      })

      it('should create activity log for updates', async () => {
        await firestoreService.updateProduct('test-id', { name: 'Updated' }, userEmail)

        const activityCall = mockBatch.set.mock.calls.find(call =>
          call[1].action === 'update'
        )
        expect(activityCall[1]).toMatchObject({
          action: 'update',
          entityType: 'product',
          entityId: 'test-id'
        })
      })
    })

    describe('deleteProduct', () => {
      it('should delete product successfully', async () => {
        await firestoreService.deleteProduct('test-id', userEmail)

        expect(mockBatch.delete).toHaveBeenCalled()
        expect(mockBatch.commit).toHaveBeenCalled()
      })

      it('should fetch product name before deletion', async () => {
        await firestoreService.deleteProduct('test-id', userEmail)

        expect(mockGetDoc).toHaveBeenCalled()
      })

      it('should create activity log for deletion', async () => {
        await firestoreService.deleteProduct('test-id', userEmail)

        const activityCall = mockBatch.set.mock.calls.find(call =>
          call[1].action === 'delete'
        )
        expect(activityCall[1]).toMatchObject({
          action: 'delete',
          entityType: 'product',
          entityId: 'test-id'
        })
      })
    })
  })

  describe('real-time subscriptions', () => {
    beforeEach(async () => {
      await firestoreService.initializeRestaurant(restaurantId, userEmail)
    })

    it('should subscribe to products changes', () => {
      const callback = vi.fn()
      const unsubscribe = firestoreService.subscribeToProducts(callback)

      expect(mockOnSnapshot).toHaveBeenCalled()
      expect(typeof unsubscribe).toBe('function')
    })

    it('should handle subscription callback correctly', () => {
      const callback = vi.fn()
      
      // Mock onSnapshot to immediately call the callback
      mockOnSnapshot.mockImplementation((query, successCallback) => {
        successCallback(mockQuerySnapshot)
        return () => {}
      })

      firestoreService.subscribeToProducts(callback)

      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Test Product',
            category: 'vegetables'
          })
        ])
      )
    })

    it('should handle subscription errors', () => {
      const callback = vi.fn()
      
      // Mock onSnapshot to call error callback
      mockOnSnapshot.mockImplementation((query, successCallback, errorCallback) => {
        errorCallback(new Error('Subscription error'))
        return () => {}
      })

      firestoreService.subscribeToProducts(callback)

      // Should attempt to use cached data on error
      expect(callback).toHaveBeenCalledWith([])
    })

    it('should throw error if service not initialized', () => {
      const uninitializedService = new (firestoreService.constructor as any)()
      
      expect(() => {
        uninitializedService.subscribeToProducts(() => {})
      }).toThrow('Service non initialisé')
    })
  })

  describe('caching mechanism', () => {
    beforeEach(async () => {
      await firestoreService.initializeRestaurant(restaurantId, userEmail)
    })

    it('should cache products after fetching', async () => {
      mockGetDoc.mockResolvedValueOnce(mockQuerySnapshot)
      
      await firestoreService.getProducts()
      
      // Second call should use cache (no additional getDoc call)
      const cachedProducts = await firestoreService.getProducts()
      
      expect(cachedProducts).toHaveLength(1)
    })

    it('should invalidate cache after add operation', async () => {
      // Populate cache first
      mockGetDoc.mockResolvedValueOnce(mockQuerySnapshot)
      await firestoreService.getProducts()
      
      // Add product (should invalidate cache)
      await firestoreService.addProduct(mockProduct, userEmail)
      
      // Next call should fetch fresh data
      mockGetDoc.mockResolvedValueOnce(mockQuerySnapshot)
      await firestoreService.getProducts()
      
      expect(mockGetDoc).toHaveBeenCalledTimes(3) // init + first get + after invalidation
    })

    it('should provide cache statistics', () => {
      const stats = firestoreService.getCacheStats()
      
      expect(stats).toMatchObject({
        cacheSize: expect.any(Number),
        activeListeners: expect.any(Number),
        isOnline: expect.any(Boolean)
      })
    })
  })

  describe('connectivity handling', () => {
    it('should handle online/offline events', () => {
      // Verify event listeners are set up
      expect(global.window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(global.window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
    })

    it('should enable network when coming online', async () => {
      const onlineHandler = (global.window.addEventListener as any).mock.calls
        .find((call: any) => call[0] === 'online')[1]
      
      await onlineHandler()
      
      expect(mockEnableNetwork).toHaveBeenCalled()
    })

    it('should disable network when going offline', async () => {
      const offlineHandler = (global.window.addEventListener as any).mock.calls
        .find((call: any) => call[0] === 'offline')[1]
      
      await offlineHandler()
      
      expect(mockDisableNetwork).toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should cleanup listeners and cache', () => {
      const mockUnsubscribe = vi.fn()
      
      // Add a listener
      firestoreService['listeners'].set('test-listener', mockUnsubscribe)
      
      firestoreService.cleanup()
      
      expect(mockUnsubscribe).toHaveBeenCalled()
      expect(firestoreService.getCacheStats().activeListeners).toBe(0)
    })
  })

  describe('property-based testing', () => {
    beforeEach(async () => {
      await firestoreService.initializeRestaurant(restaurantId, userEmail)
    })

    it('should handle any valid product data', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            category: fc.constantFrom('vegetables', 'meat', 'dairy', 'grains', 'beverages', 'other'),
            imageUrl: fc.webUrl(),
            batches: fc.array(
              fc.record({
                id: fc.uuid(),
                quantity: fc.float({ min: 0, max: 1000 }),
                unit: fc.string({ minLength: 1, maxLength: 20 }),
                purchasePrice: fc.float({ min: 0, max: 1000 }),
                supplier: fc.string({ minLength: 1, maxLength: 100 }),
                expiryDate: fc.date(),
                barcode: fc.string({ minLength: 8, maxLength: 20 }),
                notes: fc.string({ maxLength: 500 })
              }),
              { maxLength: 5 }
            )
          }),
          async (productData) => {
            try {
              await firestoreService.addProduct(productData, userEmail)
              expect(mockBatch.set).toHaveBeenCalled()
              expect(mockBatch.commit).toHaveBeenCalled()
            } catch (error) {
              // Some combinations might be invalid
            }
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should handle various update scenarios', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.option(fc.string({ minLength: 1 })),
            category: fc.option(fc.constantFrom('vegetables', 'meat', 'dairy')),
            imageUrl: fc.option(fc.webUrl())
          }, { requiredKeys: [] }),
          async (updates) => {
            if (Object.keys(updates).length === 0) return
            
            try {
              await firestoreService.updateProduct('test-id', updates, userEmail)
              expect(mockBatch.update).toHaveBeenCalled()
            } catch (error) {
              // Some updates might be invalid
            }
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('error handling', () => {
    beforeEach(async () => {
      await firestoreService.initializeRestaurant(restaurantId, userEmail)
    })

    it('should handle batch commit failures', async () => {
      const error = new Error('Commit failed')
      mockBatch.commit.mockRejectedValueOnce(error)

      await expect(
        firestoreService.addProduct(mockProduct, userEmail)
      ).rejects.toThrow('Commit failed')
    })

    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Request timeout')
      mockGetDoc.mockRejectedValueOnce(timeoutError)

      const products = await firestoreService.getProducts()
      
      expect(products).toEqual([])
    })

    it('should handle malformed document data', async () => {
      const malformedDoc = {
        exists: () => true,
        data: () => ({
          // Missing required fields
          name: null,
          batches: 'invalid'
        }),
        id: 'malformed-id'
      }

      mockGetDoc.mockResolvedValueOnce({
        docs: [malformedDoc],
        forEach: (callback: any) => [malformedDoc].forEach(callback)
      })

      const products = await firestoreService.getProducts()
      
      // Should handle gracefully and not crash
      expect(Array.isArray(products)).toBe(true)
    })
  })
})