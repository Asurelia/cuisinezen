import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fc } from 'fast-check'
import {
  BLUR_PLACEHOLDERS,
  getBlurPlaceholder,
  generateResponsiveSizes,
  getOptimizedImageSrc,
  preloadImage,
  preloadImages,
  supportsWebP,
  supportsAVIF,
  getOptimalImageFormat,
  imageFormatCache
} from '@/lib/image-utils'

// Mock Image constructor
const mockImages: any[] = []
const MockImage = class {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  src = ''
  height = 0
  width = 0
  loading: 'eager' | 'lazy' = 'lazy'
  
  constructor() {
    mockImages.push(this)
  }
}

global.Image = MockImage as any

describe('image-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockImages.length = 0
    // Clear the format cache
    imageFormatCache['cache'].clear()
  })

  describe('blur placeholders', () => {
    it('should have all required placeholder types', () => {
      expect(BLUR_PLACEHOLDERS.default).toBeDefined()
      expect(BLUR_PLACEHOLDERS.food).toBeDefined()
      expect(BLUR_PLACEHOLDERS.recipe).toBeDefined()
    })

    it('should return correct placeholder for each type', () => {
      expect(getBlurPlaceholder('default')).toBe(BLUR_PLACEHOLDERS.default)
      expect(getBlurPlaceholder('food')).toBe(BLUR_PLACEHOLDERS.food)
      expect(getBlurPlaceholder('recipe')).toBe(BLUR_PLACEHOLDERS.recipe)
    })

    it('should fallback to default for invalid type', () => {
      expect(getBlurPlaceholder('invalid' as any)).toBe(BLUR_PLACEHOLDERS.default)
    })

    it('should use default when no type provided', () => {
      expect(getBlurPlaceholder()).toBe(BLUR_PLACEHOLDERS.default)
    })

    it('should return valid base64 data URLs', () => {
      Object.values(BLUR_PLACEHOLDERS).forEach(placeholder => {
        expect(placeholder).toMatch(/^data:image\/jpeg;base64,/)
      })
    })
  })

  describe('responsive sizes generation', () => {
    it('should generate proper responsive sizes string', () => {
      const sizes = generateResponsiveSizes(800)
      
      expect(sizes).toContain('(max-width: 640px) 640px')
      expect(sizes).toContain('(max-width: 750px) 750px')
      expect(sizes).toContain('(max-width: 828px) 828px')
      expect(sizes).toContain('(max-width: 1080px) 1080px')
      expect(sizes).toContain('(max-width: 1200px) 1200px')
      expect(sizes).toContain('800px') // Default size at the end
    })

    it('should filter breakpoints based on base width', () => {
      const smallSizes = generateResponsiveSizes(400)
      
      // Should not include breakpoints larger than 2x base width (800px)
      expect(smallSizes).not.toContain('1080px')
      expect(smallSizes).not.toContain('1200px')
      expect(smallSizes).not.toContain('1920px')
      expect(smallSizes).toContain('400px')
    })

    it('should handle large base widths', () => {
      const largeSizes = generateResponsiveSizes(1500)
      
      expect(largeSizes).toContain('(max-width: 1920px) 1920px')
      expect(largeSizes).toContain('1500px')
    })

    it('should handle edge cases', () => {
      expect(generateResponsiveSizes(0)).toContain('0px')
      expect(generateResponsiveSizes(1)).toContain('1px')
      expect(generateResponsiveSizes(10000)).toContain('10000px')
    })

    it('should maintain proper ordering', () => {
      const sizes = generateResponsiveSizes(1000)
      const parts = sizes.split(', ')
      
      // Should end with the base width
      expect(parts[parts.length - 1]).toBe('1000px')
      
      // Should have media queries before base width
      expect(parts[0]).toMatch(/^\(max-width:/)
    })
  })

  describe('optimized image source generation', () => {
    it('should return external URLs unchanged', () => {
      const externalUrl = 'https://example.com/image.jpg'
      expect(getOptimizedImageSrc(externalUrl)).toBe(externalUrl)
    })

    it('should return data URLs unchanged', () => {
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQ...'
      expect(getOptimizedImageSrc(dataUrl)).toBe(dataUrl)
    })

    it('should add optimization parameters to local URLs', () => {
      const localUrl = '/images/product.jpg'
      const optimized = getOptimizedImageSrc(localUrl, {
        width: 400,
        height: 300,
        quality: 90,
        format: 'webp'
      })
      
      expect(optimized).toBe('/images/product.jpg?w=400&h=300&q=90&f=webp')
    })

    it('should use default quality and format', () => {
      const localUrl = '/images/product.jpg'
      const optimized = getOptimizedImageSrc(localUrl)
      
      expect(optimized).toBe('/images/product.jpg?q=85&f=webp')
    })

    it('should handle partial options', () => {
      const localUrl = '/images/product.jpg'
      const optimized = getOptimizedImageSrc(localUrl, {
        width: 500,
        quality: 95
      })
      
      expect(optimized).toBe('/images/product.jpg?w=500&q=95&f=webp')
    })

    it('should handle special characters in URLs', () => {
      const specialUrl = '/images/café-special@2x.jpg'
      const optimized = getOptimizedImageSrc(specialUrl, { width: 200 })
      
      expect(optimized).toBe('/images/café-special@2x.jpg?w=200&q=85&f=webp')
    })
  })

  describe('image preloading', () => {
    it('should preload single image successfully', async () => {
      const preloadPromise = preloadImage('/test-image.jpg', 'high')
      
      // Simulate successful load
      const img = mockImages[0]
      img.onload!()
      
      await expect(preloadPromise).resolves.toBeUndefined()
      expect(img.src).toBe('/test-image.jpg')
      expect(img.loading).toBe('eager')
    })

    it('should handle image load errors', async () => {
      const preloadPromise = preloadImage('/nonexistent.jpg')
      
      // Simulate error
      const img = mockImages[0]
      img.onerror!()
      
      await expect(preloadPromise).rejects.toThrow('Failed to preload image: /nonexistent.jpg')
    })

    it('should set appropriate loading attribute', async () => {
      preloadImage('/test1.jpg', 'high')
      preloadImage('/test2.jpg', 'low')
      
      expect(mockImages[0].loading).toBe('eager')
      expect(mockImages[1].loading).toBe('lazy')
    })

    it('should handle browsers without loading attribute support', async () => {
      // Remove loading property
      const originalLoading = MockImage.prototype.loading
      delete (MockImage.prototype as any).loading
      
      const preloadPromise = preloadImage('/test.jpg', 'high')
      
      // Should not throw
      expect(mockImages[0].loading).toBeUndefined()
      
      // Restore property
      MockImage.prototype.loading = originalLoading
      
      // Complete the load
      mockImages[0].onload!()
      await expect(preloadPromise).resolves.toBeUndefined()
    })
  })

  describe('batch image preloading', () => {
    it('should preload high priority images first', async () => {
      const images = [
        { src: '/low1.jpg', priority: 'low' as const },
        { src: '/high1.jpg', priority: 'high' as const },
        { src: '/low2.jpg', priority: 'low' as const },
        { src: '/high2.jpg', priority: 'high' as const }
      ]
      
      const preloadPromise = preloadImages(images, 2)
      
      // Should start with high priority images
      expect(mockImages).toHaveLength(2)
      expect(mockImages[0].src).toBe('/high1.jpg')
      expect(mockImages[1].src).toBe('/high2.jpg')
      
      // Complete high priority loads
      mockImages[0].onload!()
      mockImages[1].onload!()
      
      // Wait a bit for the next batch
      await new Promise(resolve => setTimeout(resolve, 0))
      
      // Should start low priority images
      expect(mockImages).toHaveLength(4)
      
      // Complete remaining loads
      mockImages[2].onload!()
      mockImages[3].onload!()
      
      await preloadPromise
    })

    it('should respect concurrency limit', async () => {
      const images = Array.from({ length: 10 }, (_, i) => ({
        src: `/image${i}.jpg`,
        priority: 'low' as const
      }))
      
      const preloadPromise = preloadImages(images, 3)
      
      // Should start with first batch
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(mockImages).toHaveLength(3)
      
      // Complete first batch
      mockImages.forEach(img => img.onload!())
      
      await preloadPromise
    })

    it('should handle mixed success and failures', async () => {
      const images = [
        { src: '/success1.jpg' },
        { src: '/fail.jpg' },
        { src: '/success2.jpg' }
      ]
      
      const preloadPromise = preloadImages(images)
      
      // Simulate mixed results
      mockImages[0].onload!()
      mockImages[1].onerror!()
      mockImages[2].onload!()
      
      // Should not throw despite one failure
      await expect(preloadPromise).resolves.toBeUndefined()
    })

    it('should handle empty array', async () => {
      await expect(preloadImages([])).resolves.toBeUndefined()
      expect(mockImages).toHaveLength(0)
    })
  })

  describe('format support detection', () => {
    describe('WebP support', () => {
      it('should detect WebP support correctly', async () => {
        const supportPromise = supportsWebP()
        
        // Simulate WebP support
        const img = mockImages[0]
        img.height = 2
        img.onload!()
        
        const isSupported = await supportPromise
        expect(isSupported).toBe(true)
      })

      it('should detect lack of WebP support', async () => {
        const supportPromise = supportsWebP()
        
        // Simulate no WebP support
        const img = mockImages[0]
        img.height = 0
        img.onerror!()
        
        const isSupported = await supportPromise
        expect(isSupported).toBe(false)
      })

      it('should use correct WebP test image', async () => {
        supportsWebP()
        
        const img = mockImages[0]
        expect(img.src).toMatch(/^data:image\/webp;base64,/)
      })
    })

    describe('AVIF support', () => {
      it('should detect AVIF support correctly', async () => {
        const supportPromise = supportsAVIF()
        
        // Simulate AVIF support
        const img = mockImages[0]
        img.height = 2
        img.onload!()
        
        const isSupported = await supportPromise
        expect(isSupported).toBe(true)
      })

      it('should detect lack of AVIF support', async () => {
        const supportPromise = supportsAVIF()
        
        // Simulate no AVIF support
        const img = mockImages[0]
        img.height = 0
        img.onerror!()
        
        const isSupported = await supportPromise
        expect(isSupported).toBe(false)
      })

      it('should use correct AVIF test image', async () => {
        supportsAVIF()
        
        const img = mockImages[0]
        expect(img.src).toMatch(/^data:image\/avif;base64,/)
      })
    })

    describe('optimal format detection', () => {
      it('should prefer AVIF when supported', async () => {
        // Mock AVIF support
        const avifPromise = supportsAVIF()
        mockImages[0].height = 2
        mockImages[0].onload!()
        await avifPromise
        
        const format = await getOptimalImageFormat()
        expect(format).toBe('avif')
      })

      it('should fallback to WebP when AVIF not supported', async () => {
        // Mock no AVIF support, but WebP support
        const avifPromise = supportsAVIF()
        mockImages[0].height = 0
        mockImages[0].onload!()
        await avifPromise
        
        const webpPromise = supportsWebP()
        mockImages[1].height = 2
        mockImages[1].onload!()
        await webpPromise
        
        const format = await getOptimalImageFormat()
        expect(format).toBe('webp')
      })

      it('should fallback to JPG when neither format supported', async () => {
        // Mock no support for either format
        const avifPromise = supportsAVIF()
        mockImages[0].height = 0
        mockImages[0].onload!()
        await avifPromise
        
        const webpPromise = supportsWebP()
        mockImages[1].height = 0
        mockImages[1].onload!()
        await webpPromise
        
        const format = await getOptimalImageFormat()
        expect(format).toBe('jpg')
      })

      it('should handle detection errors gracefully', async () => {
        // Mock error in detection
        const originalSupportsAVIF = supportsAVIF
        vi.mocked(supportsAVIF).mockRejectedValue(new Error('Detection failed'))
        
        const format = await getOptimalImageFormat()
        expect(format).toBe('jpg')
      })
    })
  })

  describe('image format cache', () => {
    it('should cache format support results', async () => {
      // First call
      const promise1 = imageFormatCache.isSupported('webp')
      mockImages[0].height = 2
      mockImages[0].onload!()
      const result1 = await promise1
      
      // Second call should use cache (no new image created)
      const result2 = await imageFormatCache.isSupported('webp')
      
      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(mockImages).toHaveLength(1) // Only one image created
    })

    it('should cache different formats separately', async () => {
      // Test WebP
      const webpPromise = imageFormatCache.isSupported('webp')
      mockImages[0].height = 2
      mockImages[0].onload!()
      await webpPromise
      
      // Test AVIF (should create new image)
      const avifPromise = imageFormatCache.isSupported('avif')
      mockImages[1].height = 0
      mockImages[1].onload!()
      await avifPromise
      
      expect(mockImages).toHaveLength(2)
    })

    it('should handle false results correctly', async () => {
      const promise = imageFormatCache.isSupported('avif')
      mockImages[0].height = 0
      mockImages[0].onerror!()
      const result = await promise
      
      expect(result).toBe(false)
      
      // Second call should use cached false result
      const result2 = await imageFormatCache.isSupported('avif')
      expect(result2).toBe(false)
      expect(mockImages).toHaveLength(1)
    })
  })

  describe('property-based testing', () => {
    it('should handle various base widths for responsive sizes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          (baseWidth) => {
            const sizes = generateResponsiveSizes(baseWidth)
            
            // Should always include the base width
            expect(sizes).toContain(`${baseWidth}px`)
            
            // Should not be empty
            expect(sizes.length).toBeGreaterThan(0)
            
            // Should have proper format
            expect(sizes).toMatch(/\d+px$/)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle various optimization parameters', () => {
      fc.assert(
        fc.property(
          fc.record({
            width: fc.option(fc.integer({ min: 1, max: 5000 })),
            height: fc.option(fc.integer({ min: 1, max: 5000 })),
            quality: fc.option(fc.integer({ min: 1, max: 100 })),
            format: fc.option(fc.constantFrom('webp', 'avif', 'jpg'))
          }),
          (options) => {
            const localUrl = '/test/image.jpg'
            const optimized = getOptimizedImageSrc(localUrl, options)
            
            // Should start with original URL
            expect(optimized).toMatch(/^\/test\/image\.jpg\?/)
            
            // Should contain valid parameters
            if (options.width) {
              expect(optimized).toContain(`w=${options.width}`)
            }
            if (options.height) {
              expect(optimized).toContain(`h=${options.height}`)
            }
            if (options.quality) {
              expect(optimized).toContain(`q=${options.quality}`)
            }
            if (options.format) {
              expect(optimized).toContain(`f=${options.format}`)
            }
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should handle various image URLs for preloading', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          fc.constantFrom('high', 'low'),
          async (url, priority) => {
            const preloadPromise = preloadImage(url, priority)
            
            // Should create an image element
            expect(mockImages).toHaveLength(1)
            
            const img = mockImages[mockImages.length - 1]
            expect(img.src).toBe(url)
            expect(img.loading).toBe(priority === 'high' ? 'eager' : 'lazy')
            
            // Simulate successful load
            img.onload!()
            
            await expect(preloadPromise).resolves.toBeUndefined()
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle malformed URLs gracefully', () => {
      const malformedUrls = [
        '',
        '   ',
        'not-a-url',
        '://invalid',
        'file:///local/path'
      ]
      
      malformedUrls.forEach(url => {
        expect(() => getOptimizedImageSrc(url)).not.toThrow()
      })
    })

    it('should handle extreme parameter values', () => {
      expect(() => getOptimizedImageSrc('/test.jpg', {
        width: 0,
        height: -1,
        quality: 101
      })).not.toThrow()
      
      expect(() => generateResponsiveSizes(-1)).not.toThrow()
      expect(() => generateResponsiveSizes(0)).not.toThrow()
    })

    it('should handle concurrent preload requests', async () => {
      const urls = Array.from({ length: 100 }, (_, i) => `/image${i}.jpg`)
      
      const promises = urls.map(url => preloadImage(url))
      
      // Simulate all loads succeeding
      mockImages.forEach(img => img.onload!())
      
      await expect(Promise.all(promises)).resolves.toHaveLength(100)
    })

    it('should handle memory pressure during batch preloading', async () => {
      const manyImages = Array.from({ length: 1000 }, (_, i) => ({
        src: `/image${i}.jpg`
      }))
      
      // Should not create all images at once due to concurrency limit
      const preloadPromise = preloadImages(manyImages, 5)
      
      expect(mockImages.length).toBeLessThanOrEqual(5)
      
      // Complete all loads
      const completeAllLoads = () => {
        mockImages.forEach(img => {
          if (img.onload) img.onload()
        })
      }
      
      // Need to complete loads in batches
      let completed = 0
      while (completed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 0))
        completeAllLoads()
        completed += Math.min(5, 1000 - completed)
      }
      
      await preloadPromise
    })

    it('should handle browser compatibility issues', async () => {
      // Test without Image constructor
      const originalImage = global.Image
      delete (global as any).Image
      
      expect(() => preloadImage('/test.jpg')).toThrow()
      
      // Restore
      global.Image = originalImage
    })
  })
})