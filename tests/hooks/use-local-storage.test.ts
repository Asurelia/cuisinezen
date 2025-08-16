import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { fc } from 'fast-check'
import { useLocalStorage } from '@/hooks/use-local-storage'

describe('useLocalStorage', () => {
  const TEST_KEY = 'test-key'
  
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('initialization', () => {
    it('should return initial value when localStorage is empty', () => {
      const initialValue = 'initial'
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, initialValue))
      
      expect(result.current[0]).toBe(initialValue)
    })

    it('should return stored value when localStorage has data', async () => {
      const storedValue = { name: 'John', age: 30 }
      localStorage.setItem(TEST_KEY, JSON.stringify(storedValue))
      
      const { result, rerender } = renderHook(() => useLocalStorage(TEST_KEY, {}))
      
      // Initially returns initial value (SSR/hydration)
      expect(result.current[0]).toEqual({})
      
      // After mount, should read from localStorage
      rerender()
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      expect(result.current[0]).toEqual(storedValue)
    })

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem(TEST_KEY, 'invalid-json{')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'default'))
      
      expect(result.current[0]).toBe('default')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse JSON from localStorage',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('date parsing', () => {
    it('should parse ISO date strings to Date objects', async () => {
      const date = new Date('2023-12-25T10:30:00.000Z')
      const objectWithDate = { createdAt: date, name: 'test' }
      localStorage.setItem(TEST_KEY, JSON.stringify(objectWithDate))
      
      const { result, rerender } = renderHook(() => useLocalStorage(TEST_KEY, {}))
      
      rerender()
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      expect(result.current[0]).toEqual(objectWithDate)
      expect(result.current[0].createdAt).toBeInstanceOf(Date)
    })

    it('should not parse invalid date strings', async () => {
      const objectWithInvalidDate = { createdAt: '2023-13-45T25:70:00.000Z', name: 'test' }
      localStorage.setItem(TEST_KEY, JSON.stringify(objectWithInvalidDate))
      
      const { result, rerender } = renderHook(() => useLocalStorage(TEST_KEY, {}))
      
      rerender()
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      expect(result.current[0].createdAt).toBe('2023-13-45T25:70:00.000Z')
      expect(result.current[0].createdAt).not.toBeInstanceOf(Date)
    })
  })

  describe('setValue functionality', () => {
    it('should update localStorage when setting value', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'initial'))
      
      act(() => {
        result.current[1]('new value')
      })
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        TEST_KEY,
        JSON.stringify('new value')
      )
      expect(result.current[0]).toBe('new value')
    })

    it('should handle function updates', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, 10))
      
      act(() => {
        result.current[1](prev => prev + 5)
      })
      
      expect(result.current[0]).toBe(15)
      expect(localStorage.setItem).toHaveBeenCalledWith(
        TEST_KEY,
        JSON.stringify(15)
      )
    })

    it('should not update when component is not mounted', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'initial'))
      
      // Before component is mounted, setValue should not work
      const [, setValue] = result.current
      setValue('should not work')
      
      expect(localStorage.setItem).not.toHaveBeenCalled()
    })

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const mockError = new Error('QuotaExceededError')
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw mockError
      })
      
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'initial'))
      
      act(() => {
        result.current[1]('new value')
      })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        `Error setting localStorage key "${TEST_KEY}":`,
        mockError
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('storage event listener', () => {
    it('should update value when storage event is triggered', async () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'initial'))
      
      const newValue = 'updated from another tab'
      const storageEvent = new StorageEvent('storage', {
        key: TEST_KEY,
        newValue: JSON.stringify(newValue)
      })
      
      act(() => {
        window.dispatchEvent(storageEvent)
      })
      
      expect(result.current[0]).toBe(newValue)
    })

    it('should ignore storage events for different keys', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'initial'))
      
      const storageEvent = new StorageEvent('storage', {
        key: 'different-key',
        newValue: JSON.stringify('should not update')
      })
      
      act(() => {
        window.dispatchEvent(storageEvent)
      })
      
      expect(result.current[0]).toBe('initial')
    })

    it('should handle storage events with null newValue', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'initial'))
      
      const storageEvent = new StorageEvent('storage', {
        key: TEST_KEY,
        newValue: null
      })
      
      act(() => {
        window.dispatchEvent(storageEvent)
      })
      
      expect(result.current[0]).toBe('initial')
    })
  })

  describe('property-based testing', () => {
    it('should handle any serializable value', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.array(fc.string()),
            fc.record({ name: fc.string(), age: fc.integer() })
          ),
          (value) => {
            const { result } = renderHook(() => useLocalStorage(TEST_KEY, null))
            
            act(() => {
              result.current[1](value)
            })
            
            expect(localStorage.setItem).toHaveBeenCalledWith(
              TEST_KEY,
              JSON.stringify(value)
            )
            expect(result.current[0]).toEqual(value)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should maintain type consistency across operations', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          (initialValue, newValue) => {
            const { result } = renderHook(() => useLocalStorage(TEST_KEY, initialValue))
            
            act(() => {
              result.current[1](newValue)
            })
            
            expect(typeof result.current[0]).toBe('string')
            expect(result.current[0]).toBe(newValue)
          }
        ),
        { numRuns: 30 }
      )
    })
  })

  describe('edge cases', () => {
    it('should handle empty string key', () => {
      const { result } = renderHook(() => useLocalStorage('', 'test'))
      
      act(() => {
        result.current[1]('new value')
      })
      
      expect(localStorage.setItem).toHaveBeenCalledWith('', JSON.stringify('new value'))
    })

    it('should handle complex nested objects', () => {
      const complexObject = {
        user: {
          profile: {
            name: 'John',
            preferences: {
              theme: 'dark',
              notifications: {
                email: true,
                push: false
              }
            }
          }
        },
        data: [1, 2, { nested: true }]
      }
      
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, {}))
      
      act(() => {
        result.current[1](complexObject)
      })
      
      expect(result.current[0]).toEqual(complexObject)
    })

    it('should handle undefined and null values', () => {
      const { result } = renderHook(() => useLocalStorage(TEST_KEY, null))
      
      act(() => {
        result.current[1](undefined as any)
      })
      
      expect(result.current[0]).toBeUndefined()
      
      act(() => {
        result.current[1](null)
      })
      
      expect(result.current[0]).toBeNull()
    })
  })
})