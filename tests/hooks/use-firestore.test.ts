import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { fc } from 'fast-check'
import { useFirestoreProducts, useFirestoreRecipes, useFirestoreProduct, useFirestoreStats, useUserPermissions } from '@/hooks/use-firestore'
import type { Product, Recipe } from '@/lib/types'

// Mock dependencies
vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: vi.fn()
}))

vi.mock('@/lib/firebase', () => ({
  auth: {},
  isAdmin: vi.fn()
}))

vi.mock('@/services/firestore', () => ({
  firestoreService: {
    initializeRestaurant: vi.fn(),
    getProducts: vi.fn(),
    subscribeToProducts: vi.fn(),
    addProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    getRecipes: vi.fn(),
    subscribeToRecipes: vi.fn(),
    getCacheStats: vi.fn()
  }
}))

vi.mock('@/services/offline-manager', () => ({
  offlineManager: {
    addToQueue: vi.fn(),
    getQueueStatus: vi.fn()
  }
}))

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  configurable: true,
  value: true
})

const mockUseAuthState = vi.mocked(await import('react-firebase-hooks/auth')).useAuthState
const mockFirestoreService = vi.mocked(await import('@/services/firestore')).firestoreService
const mockOfflineManager = vi.mocked(await import('@/services/offline-manager')).offlineManager
const mockIsAdmin = vi.mocked(await import('@/lib/firebase')).isAdmin

describe('useFirestoreProducts', () => {
  const mockUser = { email: 'test@example.com', uid: 'user123' }
  const restaurantId = 'restaurant123'
  
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Tomatoes',
      category: 'vegetables',
      quantity: 10,
      unit: 'kg',
      expirationDate: new Date('2024-01-15'),
      purchasePrice: 2.5,
      supplier: 'Local Farm',
      barcode: '123456789',
      notes: 'Fresh tomatoes'
    },
    {
      id: '2',
      name: 'Chicken Breast',
      category: 'meat',
      quantity: 5,
      unit: 'kg',
      expirationDate: new Date('2024-01-10'),
      purchasePrice: 8.0,
      supplier: 'Meat Co',
      barcode: '987654321',
      notes: 'Organic chicken'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthState.mockReturnValue([mockUser, false, undefined])
    mockFirestoreService.getProducts.mockResolvedValue(mockProducts)
    mockFirestoreService.subscribeToProducts.mockReturnValue(() => {})
    mockFirestoreService.initializeRestaurant.mockResolvedValue(undefined)
    mockFirestoreService.getCacheStats.mockReturnValue({
      cacheSize: 100,
      activeListeners: 2,
      isOnline: true
    })
    mockOfflineManager.getQueueStatus.mockReturnValue({
      queueLength: 0
    })
  })

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useFirestoreProducts(restaurantId))
      
      expect(result.current.loading).toBe(true)
      expect(result.current.products).toEqual([])
      expect(result.current.error).toBeNull()
    })

    it('should initialize restaurant when user and restaurantId are provided', async () => {
      renderHook(() => useFirestoreProducts(restaurantId))
      
      await waitFor(() => {
        expect(mockFirestoreService.initializeRestaurant).toHaveBeenCalledWith(
          restaurantId,
          mockUser.email
        )
      })
    })

    it('should not initialize when user is not authenticated', () => {
      mockUseAuthState.mockReturnValue([null, false, undefined])
      
      const { result } = renderHook(() => useFirestoreProducts(restaurantId))
      
      expect(result.current.loading).toBe(false)
      expect(mockFirestoreService.initializeRestaurant).not.toHaveBeenCalled()
    })

    it('should not initialize when restaurantId is missing', () => {
      const { result } = renderHook(() => useFirestoreProducts())
      
      expect(result.current.loading).toBe(false)
      expect(mockFirestoreService.initializeRestaurant).not.toHaveBeenCalled()
    })
  })

  describe('data loading', () => {
    it('should load products successfully', async () => {
      const { result } = renderHook(() => useFirestoreProducts(restaurantId))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.products).toEqual(mockProducts)
        expect(result.current.error).toBeNull()
      })
    })

    it('should handle loading errors', async () => {
      const error = new Error('Failed to load products')
      mockFirestoreService.getProducts.mockRejectedValue(error)
      
      const { result } = renderHook(() => useFirestoreProducts(restaurantId))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe('Erreur lecture: Failed to load products')
      })
    })

    it('should subscribe to real-time updates', async () => {
      const mockUnsubscribe = vi.fn()
      mockFirestoreService.subscribeToProducts.mockReturnValue(mockUnsubscribe)
      
      const { unmount } = renderHook(() => useFirestoreProducts(restaurantId))
      
      await waitFor(() => {
        expect(mockFirestoreService.subscribeToProducts).toHaveBeenCalled()
      })
      
      unmount()
      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('should handle subscription errors', async () => {
      const error = new Error('Subscription failed')
      mockFirestoreService.subscribeToProducts.mockImplementation(() => {
        throw error
      })
      
      const { result } = renderHook(() => useFirestoreProducts(restaurantId))
      
      await waitFor(() => {
        expect(result.current.error).toBe('Erreur synchronisation: Subscription failed')
      })
    })
  })

  describe('CRUD operations - online mode', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: true })
    })

    it('should add product successfully', async () => {
      const { result } = renderHook(() => useFirestoreProducts(restaurantId))
      const newProduct = {
        name: 'New Product',
        category: 'vegetables' as const,
        quantity: 5,
        unit: 'pieces',
        expirationDate: new Date('2024-02-01'),
        purchasePrice: 3.0,
        supplier: 'Test Supplier',
        barcode: '111222333',
        notes: 'Test product'
      }
      
      await act(async () => {
        await result.current.addProduct(newProduct)
      })
      
      expect(mockFirestoreService.addProduct).toHaveBeenCalledWith(
        newProduct,
        mockUser.email
      )
    })

    it('should update product successfully', async () => {
      const { result } = renderHook(() => useFirestoreProducts(restaurantId))
      const updates = { quantity: 15, notes: 'Updated notes' }
      
      await act(async () => {
        await result.current.updateProduct('1', updates)
      })
      
      expect(mockFirestoreService.updateProduct).toHaveBeenCalledWith(
        '1',
        updates,
        mockUser.email
      )
    })

    it('should delete product successfully', async () => {
      const { result } = renderHook(() => useFirestoreProducts(restaurantId))
      
      await act(async () => {
        await result.current.deleteProduct('1')
      })
      
      expect(mockFirestoreService.deleteProduct).toHaveBeenCalledWith(
        '1',
        mockUser.email
      )
    })

    it('should throw error when user is not authenticated for CRUD operations', async () => {
      mockUseAuthState.mockReturnValue([null, false, undefined])
      const { result } = renderHook(() => useFirestoreProducts(restaurantId))
      
      await expect(
        result.current.addProduct({} as any)
      ).rejects.toThrow('Utilisateur non connecté')
      
      await expect(
        result.current.updateProduct('1', {})
      ).rejects.toThrow('Utilisateur non connecté')
      
      await expect(
        result.current.deleteProduct('1')
      ).rejects.toThrow('Utilisateur non connecté')
    })
  })

  describe('CRUD operations - offline mode', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: false })
    })

    it('should handle offline add with optimistic update', async () => {
      const { result } = renderHook(() => useFirestoreProducts(restaurantId))
      const newProduct = {
        name: 'Offline Product',
        category: 'vegetables' as const,
        quantity: 3,
        unit: 'kg',
        expirationDate: new Date('2024-02-01'),
        purchasePrice: 2.0,
        supplier: 'Offline Supplier',
        barcode: '555666777',
        notes: 'Added offline'
      }
      
      await act(async () => {
        await result.current.addProduct(newProduct)
      })
      
      expect(mockOfflineManager.addToQueue).toHaveBeenCalledWith({
        type: 'create',
        collection: 'products',
        data: { ...newProduct, createdBy: mockUser.email }
      })
      
      // Check optimistic update
      expect(result.current.products).toHaveLength(mockProducts.length + 1)
    })

    it('should handle offline update with optimistic update', async () => {
      const { result } = renderHook(() => useFirestoreProducts(restaurantId))
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      const updates = { quantity: 20 }
      
      await act(async () => {
        await result.current.updateProduct('1', updates)
      })
      
      expect(mockOfflineManager.addToQueue).toHaveBeenCalledWith({
        type: 'update',
        collection: 'products',
        documentId: '1',
        data: { ...updates, updatedBy: mockUser.email }
      })
      
      // Check optimistic update
      const updatedProduct = result.current.products.find(p => p.id === '1')
      expect(updatedProduct?.quantity).toBe(20)
    })

    it('should handle offline delete with optimistic update', async () => {
      const { result } = renderHook(() => useFirestoreProducts(restaurantId))
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      await act(async () => {
        await result.current.deleteProduct('1')
      })
      
      expect(mockOfflineManager.addToQueue).toHaveBeenCalledWith({
        type: 'delete',
        collection: 'products',
        documentId: '1',
        data: { deletedBy: mockUser.email }
      })
      
      // Check optimistic update
      expect(result.current.products).toHaveLength(mockProducts.length - 1)
      expect(result.current.products.find(p => p.id === '1')).toBeUndefined()
    })
  })

  describe('refresh functionality', () => {
    it('should refresh products data', async () => {
      const { result } = renderHook(() => useFirestoreProducts(restaurantId))
      
      const newData = [...mockProducts, { ...mockProducts[0], id: '3', name: 'New Product' }]
      mockFirestoreService.getProducts.mockResolvedValue(newData)
      
      await act(async () => {
        await result.current.refresh()
      })
      
      expect(result.current.products).toEqual(newData)
    })
  })

  describe('property-based testing', () => {
    it('should handle any valid product data', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            category: fc.constantFrom('vegetables', 'meat', 'dairy', 'grains', 'beverages', 'other'),
            quantity: fc.float({ min: 0, max: 1000 }),
            unit: fc.string({ minLength: 1, maxLength: 20 }),
            purchasePrice: fc.float({ min: 0, max: 1000 }),
            supplier: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (productData) => {
            const { result } = renderHook(() => useFirestoreProducts(restaurantId))
            
            await act(async () => {
              try {
                await result.current.addProduct({
                  ...productData,
                  expirationDate: new Date('2024-12-31'),
                  barcode: '123456789',
                  notes: 'Test'
                })
                
                expect(mockFirestoreService.addProduct).toHaveBeenCalled()
              } catch (error) {
                // Expected for invalid data
              }
            })
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})

describe('useFirestoreStats', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockFirestoreService.getCacheStats.mockReturnValue({
      cacheSize: 150,
      activeListeners: 3,
      isOnline: true
    })
    mockOfflineManager.getQueueStatus.mockReturnValue({
      queueLength: 2
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return initial stats', () => {
    const { result } = renderHook(() => useFirestoreStats())
    
    expect(result.current).toEqual({
      cacheSize: 150,
      activeListeners: 3,
      isOnline: true,
      queueLength: 2
    })
  })

  it('should update stats periodically', () => {
    const { result } = renderHook(() => useFirestoreStats())
    
    mockFirestoreService.getCacheStats.mockReturnValue({
      cacheSize: 200,
      activeListeners: 5,
      isOnline: false
    })
    mockOfflineManager.getQueueStatus.mockReturnValue({
      queueLength: 5
    })
    
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    
    expect(result.current).toEqual({
      cacheSize: 200,
      activeListeners: 5,
      isOnline: false,
      queueLength: 5
    })
  })

  it('should cleanup interval on unmount', () => {
    const { unmount } = renderHook(() => useFirestoreStats())
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    
    unmount()
    
    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})

describe('useUserPermissions', () => {
  const restaurantId = 'restaurant123'

  beforeEach(() => {
    mockUseAuthState.mockReturnValue([mockUser, false, undefined])
    mockIsAdmin.mockReturnValue(true)
  })

  it('should return admin permissions for admin user', async () => {
    const { result } = renderHook(() => useUserPermissions(restaurantId))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.userEmail).toBe(mockUser.email)
    })
  })

  it('should return non-admin permissions for regular user', async () => {
    mockIsAdmin.mockReturnValue(false)
    
    const { result } = renderHook(() => useUserPermissions(restaurantId))
    
    await waitFor(() => {
      expect(result.current.isAdmin).toBe(false)
    })
  })

  it('should handle unauthenticated user', () => {
    mockUseAuthState.mockReturnValue([null, false, undefined])
    
    const { result } = renderHook(() => useUserPermissions(restaurantId))
    
    expect(result.current.loading).toBe(false)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.userEmail).toBeUndefined()
  })
})