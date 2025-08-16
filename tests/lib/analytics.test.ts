import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fc } from 'fast-check'
import { AnalyticsService, analyticsService } from '@/lib/analytics'

// Mock Firebase Analytics
const mockLogEvent = vi.fn()

vi.mock('firebase/analytics', () => ({
  logEvent: mockLogEvent
}))

vi.mock('@/lib/firebase', () => ({
  analytics: { app: 'mock-analytics' }
}))

// Mock window and navigator
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)'
}

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
})

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock window for client-side only operations
    Object.defineProperty(global, 'window', {
      value: {
        navigator: mockNavigator
      },
      writable: true
    })
  })

  afterEach(() => {
    // Reset singleton for clean tests
    ;(AnalyticsService as any).instance = undefined
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AnalyticsService.getInstance()
      const instance2 = AnalyticsService.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('should use the exported singleton', () => {
      const instance = AnalyticsService.getInstance()
      expect(analyticsService).toBe(instance)
    })
  })

  describe('initialization', () => {
    it('should initialize analytics only on client side', () => {
      const service = AnalyticsService.getInstance()
      expect(service['analyticsInstance']).toBeDefined()
    })

    it('should not initialize analytics on server side', () => {
      // Mock server environment
      delete (global as any).window
      
      const ServerAnalyticsService = class extends AnalyticsService {
        constructor() {
          super()
        }
      }
      
      const service = new ServerAnalyticsService()
      expect(service['analyticsInstance']).toBeNull()
      
      // Restore window
      Object.defineProperty(global, 'window', {
        value: { navigator: mockNavigator },
        writable: true
      })
    })
  })

  describe('generic event logging', () => {
    let service: AnalyticsService

    beforeEach(() => {
      service = AnalyticsService.getInstance()
    })

    it('should log events with correct parameters', () => {
      const eventName = 'product_added'
      const params = { product_name: 'Test Product', quantity: 5 }
      
      service.logEvent(eventName, params)
      
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(), // analytics instance
        eventName,
        expect.objectContaining({
          ...params,
          timestamp: expect.any(Number),
          user_agent: mockNavigator.userAgent
        })
      )
    })

    it('should log events without additional parameters', () => {
      service.logEvent('inventory_viewed')
      
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        'inventory_viewed',
        expect.objectContaining({
          timestamp: expect.any(Number),
          user_agent: mockNavigator.userAgent
        })
      )
    })

    it('should not throw when analytics fails', () => {
      mockLogEvent.mockImplementation(() => {
        throw new Error('Analytics error')
      })
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      expect(() => {
        service.logEvent('product_added', { test: 'value' })
      }).not.toThrow()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erreur lors du logging de l\'événement:',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })

    it('should not log when on server side', () => {
      delete (global as any).window
      
      service.logEvent('test_event' as any)
      
      expect(mockLogEvent).not.toHaveBeenCalled()
      
      // Restore window
      Object.defineProperty(global, 'window', {
        value: { navigator: mockNavigator },
        writable: true
      })
    })

    it('should not log when analytics instance is null', () => {
      service['analyticsInstance'] = null
      
      service.logEvent('test_event' as any)
      
      expect(mockLogEvent).not.toHaveBeenCalled()
    })
  })

  describe('product tracking', () => {
    let service: AnalyticsService

    beforeEach(() => {
      service = AnalyticsService.getInstance()
    })

    describe('trackProductAdded', () => {
      it('should track product addition with correct parameters', () => {
        service.trackProductAdded('Tomatoes', 'vegetables', 10)
        
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.anything(),
          'product_added',
          expect.objectContaining({
            product_name: 'Tomatoes',
            category: 'vegetables',
            quantity: 10,
            method: 'manual'
          })
        )
      })

      it('should handle special characters in product names', () => {
        service.trackProductAdded('Café français', 'beverages', 1)
        
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.anything(),
          'product_added',
          expect.objectContaining({
            product_name: 'Café français',
            category: 'beverages'
          })
        )
      })
    })

    describe('trackProductScanned', () => {
      it('should track successful scan', () => {
        service.trackProductScanned('Milk', '123456789', true)
        
        expect(mockLogEvent).toHaveBeenCalledTimes(2)
        expect(mockLogEvent).toHaveBeenNthCalledWith(
          1,
          expect.anything(),
          'product_scanned',
          expect.objectContaining({
            product_name: 'Milk',
            barcode: '123456789',
            scan_method: 'barcode'
          })
        )
        expect(mockLogEvent).toHaveBeenNthCalledWith(
          2,
          expect.anything(),
          'barcode_scan_success',
          expect.objectContaining({
            barcode: '123456789',
            product_name: 'Milk'
          })
        )
      })

      it('should track failed scan', () => {
        service.trackProductScanned('Unknown', '999999999', false)
        
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.anything(),
          'barcode_scan_failed',
          expect.objectContaining({
            barcode: '999999999',
            error_reason: 'product_not_found'
          })
        )
      })

      it('should handle empty barcode gracefully', () => {
        service.trackProductScanned('Product', '', false)
        
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.anything(),
          'barcode_scan_failed',
          expect.objectContaining({
            barcode: '',
            error_reason: 'product_not_found'
          })
        )
      })
    })
  })

  describe('recipe tracking', () => {
    let service: AnalyticsService

    beforeEach(() => {
      service = AnalyticsService.getInstance()
    })

    describe('trackRecipeCreated', () => {
      it('should track recipe creation with metrics', () => {
        service.trackRecipeCreated('Pasta Carbonara', 8, 25)
        
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.anything(),
          'recipe_created',
          expect.objectContaining({
            recipe_name: 'Pasta Carbonara',
            ingredients_count: 8,
            cooking_time_minutes: 25,
            creation_method: 'manual'
          })
        )
      })

      it('should handle zero values', () => {
        service.trackRecipeCreated('Simple Recipe', 0, 0)
        
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.anything(),
          'recipe_created',
          expect.objectContaining({
            ingredients_count: 0,
            cooking_time_minutes: 0
          })
        )
      })
    })

    describe('trackRecipeViewed', () => {
      it('should track recipe views', () => {
        service.trackRecipeViewed('Chocolate Cake', 'desserts')
        
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.anything(),
          'recipe_viewed',
          expect.objectContaining({
            recipe_name: 'Chocolate Cake',
            category: 'desserts',
            view_source: 'recipe_list'
          })
        )
      })
    })
  })

  describe('menu tracking', () => {
    let service: AnalyticsService

    beforeEach(() => {
      service = AnalyticsService.getInstance()
    })

    it('should track menu creation', () => {
      service.trackMenuCreated('2024-01-15', 5)
      
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        'menu_created',
        expect.objectContaining({
          menu_date: '2024-01-15',
          recipes_count: 5,
          planning_method: 'manual'
        })
      )
    })

    it('should handle future dates', () => {
      const futureDate = '2025-12-31'
      service.trackMenuCreated(futureDate, 10)
      
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        'menu_created',
        expect.objectContaining({
          menu_date: futureDate,
          recipes_count: 10
        })
      )
    })
  })

  describe('alert tracking', () => {
    let service: AnalyticsService

    beforeEach(() => {
      service = AnalyticsService.getInstance()
    })

    it('should track expiration alerts', () => {
      service.trackExpirationAlert('Milk', 2)
      
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        'product_expired_alert',
        expect.objectContaining({
          product_name: 'Milk',
          days_until_expiry: 2,
          alert_type: 'expiration_warning'
        })
      )
    })

    it('should handle negative days (expired products)', () => {
      service.trackExpirationAlert('Expired Bread', -1)
      
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        'product_expired_alert',
        expect.objectContaining({
          days_until_expiry: -1
        })
      )
    })
  })

  describe('navigation tracking', () => {
    let service: AnalyticsService

    beforeEach(() => {
      service = AnalyticsService.getInstance()
    })

    describe('trackPageView', () => {
      it('should track page views', () => {
        service.trackPageView('inventory')
        
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.anything(),
          'dashboard_viewed',
          expect.objectContaining({
            page_name: 'inventory',
            view_time: expect.any(Number)
          })
        )
      })
    })

    describe('trackInventoryView', () => {
      it('should track inventory views with product count', () => {
        service.trackInventoryView(25)
        
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.anything(),
          'inventory_viewed',
          expect.objectContaining({
            product_count: 25,
            view_source: 'navigation'
          })
        )
      })

      it('should handle empty inventory', () => {
        service.trackInventoryView(0)
        
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.anything(),
          'inventory_viewed',
          expect.objectContaining({
            product_count: 0
          })
        )
      })
    })
  })

  describe('authentication tracking', () => {
    let service: AnalyticsService

    beforeEach(() => {
      service = AnalyticsService.getInstance()
    })

    it('should track user login', () => {
      service.trackUserLogin('user@example.com', 'email')
      
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        'user_login',
        expect.objectContaining({
          user_email: 'user@example.com',
          login_method: 'email',
          login_time: expect.any(Number)
        })
      )
    })

    it('should handle different login methods', () => {
      const methods = ['email', 'google', 'github', 'anonymous']
      
      methods.forEach(method => {
        service.trackUserLogin('test@example.com', method)
        
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.anything(),
          'user_login',
          expect.objectContaining({
            login_method: method
          })
        )
      })
    })
  })

  describe('shopping list tracking', () => {
    let service: AnalyticsService

    beforeEach(() => {
      service = AnalyticsService.getInstance()
    })

    it('should track shopping list creation', () => {
      service.trackShoppingListCreated(8)
      
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        'shopping_list_created',
        expect.objectContaining({
          items_count: 8,
          creation_source: 'inventory_shortage'
        })
      )
    })

    it('should handle empty shopping lists', () => {
      service.trackShoppingListCreated(0)
      
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        'shopping_list_created',
        expect.objectContaining({
          items_count: 0
        })
      )
    })
  })

  describe('property-based testing', () => {
    let service: AnalyticsService

    beforeEach(() => {
      service = AnalyticsService.getInstance()
    })

    it('should handle various product names and categories', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('vegetables', 'meat', 'dairy', 'grains', 'beverages', 'other'),
          fc.integer({ min: 0, max: 1000 }),
          (productName, category, quantity) => {
            service.trackProductAdded(productName, category, quantity)
            
            expect(mockLogEvent).toHaveBeenCalledWith(
              expect.anything(),
              'product_added',
              expect.objectContaining({
                product_name: productName,
                category,
                quantity
              })
            )
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should handle various recipe parameters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 0, max: 50 }),
          fc.integer({ min: 0, max: 480 }),
          (recipeName, ingredients, cookingTime) => {
            service.trackRecipeCreated(recipeName, ingredients, cookingTime)
            
            expect(mockLogEvent).toHaveBeenCalledWith(
              expect.anything(),
              'recipe_created',
              expect.objectContaining({
                recipe_name: recipeName,
                ingredients_count: ingredients,
                cooking_time_minutes: cookingTime
              })
            )
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should handle various email addresses and login methods', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 20 }),
          (email, method) => {
            service.trackUserLogin(email, method)
            
            expect(mockLogEvent).toHaveBeenCalledWith(
              expect.anything(),
              'user_login',
              expect.objectContaining({
                user_email: email,
                login_method: method
              })
            )
          }
        ),
        { numRuns: 15 }
      )
    })

    it('should handle various expiration scenarios', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: -30, max: 30 }),
          (productName, daysUntilExpiry) => {
            service.trackExpirationAlert(productName, daysUntilExpiry)
            
            expect(mockLogEvent).toHaveBeenCalledWith(
              expect.anything(),
              'product_expired_alert',
              expect.objectContaining({
                product_name: productName,
                days_until_expiry: daysUntilExpiry
              })
            )
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('edge cases and error handling', () => {
    let service: AnalyticsService

    beforeEach(() => {
      service = AnalyticsService.getInstance()
    })

    it('should handle empty strings gracefully', () => {
      service.trackProductAdded('', '', 0)
      service.trackRecipeCreated('', 0, 0)
      service.trackUserLogin('', '')
      
      expect(mockLogEvent).toHaveBeenCalledTimes(3)
    })

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000)
      
      service.trackProductAdded(longString, 'category', 1)
      
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        'product_added',
        expect.objectContaining({
          product_name: longString
        })
      )
    })

    it('should handle special characters and unicode', () => {
      const specialNames = [
        '🍅 Tomatoes',
        'Café français',
        'Ñame con pimienta',
        '中国菜',
        'Москва'
      ]
      
      specialNames.forEach(name => {
        service.trackProductAdded(name, 'test', 1)
        
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.anything(),
          'product_added',
          expect.objectContaining({
            product_name: name
          })
        )
      })
    })

    it('should handle numeric edge cases', () => {
      const edgeCases = [
        { quantity: Number.MAX_SAFE_INTEGER },
        { quantity: Number.MIN_SAFE_INTEGER },
        { quantity: 0 },
        { quantity: -1 },
        { quantity: 0.5 },
        { quantity: Infinity },
        { quantity: -Infinity },
        { quantity: NaN }
      ]
      
      edgeCases.forEach(({ quantity }) => {
        service.trackProductAdded('Test', 'test', quantity)
        
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.anything(),
          'product_added',
          expect.objectContaining({
            quantity
          })
        )
      })
    })

    it('should handle analytics service failures', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Simulate various Firebase errors
      const errors = [
        new Error('Network error'),
        new Error('Permission denied'),
        new Error('Analytics disabled'),
        new Error('Quota exceeded')
      ]
      
      errors.forEach(error => {
        mockLogEvent.mockImplementationOnce(() => {
          throw error
        })
        
        expect(() => {
          service.trackProductAdded('Test', 'test', 1)
        }).not.toThrow()
        
        expect(consoleSpy).toHaveBeenCalledWith(
          'Erreur lors du logging de l\'événement:',
          error
        )
      })
      
      consoleSpy.mockRestore()
    })

    it('should handle missing navigator gracefully', () => {
      const originalNavigator = global.navigator
      delete (global as any).navigator
      
      service.trackProductAdded('Test', 'test', 1)
      
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        'product_added',
        expect.objectContaining({
          user_agent: undefined
        })
      )
      
      // Restore navigator
      global.navigator = originalNavigator
    })

    it('should handle date edge cases', () => {
      const edgeDates = [
        '1970-01-01',
        '2038-01-19',
        '9999-12-31',
        '',
        'invalid-date',
        '2024-02-29', // Leap year
        '2024-13-01'  // Invalid month
      ]
      
      edgeDates.forEach(date => {
        service.trackMenuCreated(date, 1)
        
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.anything(),
          'menu_created',
          expect.objectContaining({
            menu_date: date
          })
        )
      })
    })
  })
})