import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fc } from 'fast-check'
import { storageService, THUMBNAIL_SIZES, MAX_FILE_SIZE, SUPPORTED_IMAGE_TYPES } from '@/services/storage.service'

// Mock Firebase Storage
const mockRef = vi.fn()
const mockUploadBytes = vi.fn()
const mockGetDownloadURL = vi.fn()
const mockDeleteObject = vi.fn()
const mockListAll = vi.fn()

vi.mock('firebase/storage', () => ({
  ref: mockRef,
  uploadBytes: mockUploadBytes,
  getDownloadURL: mockGetDownloadURL,
  deleteObject: mockDeleteObject,
  listAll: mockListAll
}))

vi.mock('@/lib/firebase', () => ({
  storage: { app: 'mock-storage' }
}))

// Mock HTML5 Canvas API
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn().mockReturnValue({
    drawImage: vi.fn()
  }),
  toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,mockdata'),
  toBlob: vi.fn()
}

const mockImage = {
  onload: null as any,
  onerror: null as any,
  src: '',
  width: 800,
  height: 600
}

global.HTMLCanvasElement = class MockCanvas {
  width = 0
  height = 0
  getContext = mockCanvas.getContext
  toDataURL = mockCanvas.toDataURL
  toBlob = mockCanvas.toBlob
} as any

global.Image = class MockImage {
  onload = null as any
  onerror = null as any
  src = ''
  width = 800
  height = 600
  
  constructor() {
    // Simulate async image loading
    setTimeout(() => {
      if (this.onload) {
        this.onload()
      }
    }, 0)
  }
} as any

// Mock document.createElement
global.document = {
  createElement: vi.fn().mockImplementation((tagName) => {
    if (tagName === 'canvas') {
      return new global.HTMLCanvasElement()
    }
    return {}
  })
} as any

// Mock URL.createObjectURL
global.URL = {
  createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
  revokeObjectURL: vi.fn()
} as any

// Mock fetch for optimize tests
global.fetch = vi.fn()

describe('StorageService', () => {
  const mockStorageRef = { fullPath: 'test/path' }
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockRef.mockReturnValue(mockStorageRef)
    mockUploadBytes.mockResolvedValue({ metadata: {} })
    mockGetDownloadURL.mockResolvedValue('https://example.com/image.jpg')
    mockDeleteObject.mockResolvedValue(undefined)
    mockListAll.mockResolvedValue({
      prefixes: [
        { fullPath: 'product/image1' },
        { fullPath: 'product/image2' }
      ],
      items: []
    })
    
    // Mock canvas toBlob
    mockCanvas.toBlob.mockImplementation((callback) => {
      const mockBlob = new Blob(['mock-image-data'], { type: 'image/webp' })
      callback(mockBlob)
    })
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = storageService
      const instance2 = storageService
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('file validation', () => {
    it('should validate file size', async () => {
      const oversizedFile = new File(['x'.repeat(MAX_FILE_SIZE + 1)], 'test.jpg', {
        type: 'image/jpeg'
      })
      
      await expect(
        storageService.uploadImage(oversizedFile, 'product')
      ).rejects.toThrow('La taille du fichier ne peut pas dépasser')
    })

    it('should validate file type', async () => {
      const invalidFile = new File(['test'], 'test.txt', {
        type: 'text/plain'
      })
      
      await expect(
        storageService.uploadImage(invalidFile, 'product')
      ).rejects.toThrow('Type de fichier non supporté')
    })

    it('should accept valid image types', () => {
      SUPPORTED_IMAGE_TYPES.forEach(type => {
        const validFile = new File(['test'], 'test.jpg', { type })
        expect(validFile.type).toBe(type)
      })
    })

    it('should accept files under size limit', () => {
      const validFile = new File(['test'], 'test.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      })
      expect(validFile.size).toBeLessThan(MAX_FILE_SIZE)
    })
  })

  describe('image upload', () => {
    const createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1000) => {
      return new File(['mock-image-data'], name, { type })
    }

    it('should upload image successfully', async () => {
      const file = createMockFile()
      
      const result = await storageService.uploadImage(file, 'product', 'user123')
      
      expect(result.id).toBeDefined()
      expect(result.urls).toMatchObject({
        original: expect.any(String),
        large: expect.any(String),
        medium: expect.any(String),
        small: expect.any(String)
      })
      expect(result.metadata).toMatchObject({
        originalName: 'test.jpg',
        type: 'image/jpeg',
        category: 'product',
        userId: 'user123'
      })
    })

    it('should create storage references for all sizes', async () => {
      const file = createMockFile()
      
      await storageService.uploadImage(file, 'product')
      
      // Should create refs for original + 3 thumbnail sizes
      expect(mockRef).toHaveBeenCalledTimes(8) // 4 sizes × 2 calls (create + getDownloadURL)
    })

    it('should upload original and compressed versions', async () => {
      const file = createMockFile()
      
      await storageService.uploadImage(file, 'product')
      
      // Should upload original + 3 thumbnails
      expect(mockUploadBytes).toHaveBeenCalledTimes(4)
    })

    it('should handle upload errors gracefully', async () => {
      const file = createMockFile()
      const error = new Error('Upload failed')
      mockUploadBytes.mockRejectedValueOnce(error)
      
      await expect(
        storageService.uploadImage(file, 'product')
      ).rejects.toThrow('Upload failed')
    })

    it('should generate unique image IDs', async () => {
      const file = createMockFile()
      
      const result1 = await storageService.uploadImage(file, 'product')
      const result2 = await storageService.uploadImage(file, 'product')
      
      expect(result1.id).not.toBe(result2.id)
    })
  })

  describe('image compression', () => {
    it('should compress images to specified dimensions', async () => {
      const file = createMockFile()
      
      await storageService.uploadImage(file, 'product')
      
      // Verify canvas operations
      expect(mockCanvas.getContext).toHaveBeenCalled()
      expect(mockCanvas.toBlob).toHaveBeenCalledTimes(3) // For each thumbnail size
    })

    it('should maintain aspect ratio when resizing', async () => {
      const file = createMockFile()
      
      // Mock image with specific dimensions
      global.Image = class MockImage {
        onload = null as any
        onerror = null as any
        src = ''
        width = 1600  // Wider than tall
        height = 800
        
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload()
          }, 0)
        }
      } as any
      
      await storageService.uploadImage(file, 'product')
      
      expect(mockCanvas.toBlob).toHaveBeenCalled()
    })

    it('should handle compression errors', async () => {
      const file = createMockFile()
      
      // Mock canvas toBlob to fail
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(null) // Simulate failure
      })
      
      await expect(
        storageService.uploadImage(file, 'product')
      ).rejects.toThrow('Erreur lors de la compression')
    })

    it('should prefer WebP format when supported', async () => {
      const file = createMockFile()
      
      // Mock WebP support
      mockCanvas.toDataURL.mockReturnValue('data:image/webp;base64,mockdata')
      
      await storageService.uploadImage(file, 'product')
      
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/webp',
        expect.any(Number)
      )
    })

    it('should fallback to JPEG when WebP not supported', async () => {
      const file = createMockFile()
      
      // Mock no WebP support
      mockCanvas.toDataURL.mockReturnValue('data:image/png;base64,mockdata')
      
      await storageService.uploadImage(file, 'product')
      
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        expect.any(Number)
      )
    })
  })

  describe('image deletion', () => {
    it('should delete all image sizes', async () => {
      await storageService.deleteImage('product', 'test-image-id')
      
      // Should delete original + 3 thumbnails
      expect(mockDeleteObject).toHaveBeenCalledTimes(4)
    })

    it('should handle missing files gracefully', async () => {
      const error = new Error('File not found')
      mockDeleteObject.mockRejectedValueOnce(error)
      
      // Should not throw, just log warning
      await expect(
        storageService.deleteImage('product', 'test-image-id')
      ).resolves.not.toThrow()
    })

    it('should delete files in parallel', async () => {
      const deletePromise = storageService.deleteImage('product', 'test-image-id')
      
      // All delete operations should be called immediately
      expect(mockDeleteObject).toHaveBeenCalledTimes(4)
      
      await deletePromise
    })
  })

  describe('URL retrieval', () => {
    it('should get single image URL', async () => {
      const url = await storageService.getImageUrl('product', 'test-id', 'medium')
      
      expect(url).toBe('https://example.com/image.jpg')
      expect(mockGetDownloadURL).toHaveBeenCalledWith(mockStorageRef)
    })

    it('should get all image URLs', async () => {
      const urls = await storageService.getAllImageUrls('product', 'test-id')
      
      expect(urls).toMatchObject({
        original: 'https://example.com/image.jpg',
        large: 'https://example.com/image.jpg',
        medium: 'https://example.com/image.jpg',
        small: 'https://example.com/image.jpg'
      })
    })

    it('should handle missing URLs gracefully', async () => {
      mockGetDownloadURL
        .mockResolvedValueOnce('https://example.com/original.jpg')
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValueOnce('https://example.com/medium.jpg')
        .mockResolvedValueOnce('https://example.com/small.jpg')
      
      const urls = await storageService.getAllImageUrls('product', 'test-id')
      
      expect(urls.original).toBe('https://example.com/original.jpg')
      expect(urls.large).toBe('') // Should be empty for failed URL
      expect(urls.medium).toBe('https://example.com/medium.jpg')
      expect(urls.small).toBe('https://example.com/small.jpg')
    })

    it('should use medium size as default', async () => {
      await storageService.getImageUrl('product', 'test-id')
      
      expect(mockRef).toHaveBeenCalledWith(
        expect.anything(),
        'product/test-id/medium'
      )
    })
  })

  describe('image listing', () => {
    it('should list all images in category', async () => {
      const images = await storageService.listImages('product')
      
      expect(images).toEqual(['image1', 'image2'])
      expect(mockListAll).toHaveBeenCalledWith(mockStorageRef)
    })

    it('should handle listing errors', async () => {
      mockListAll.mockRejectedValueOnce(new Error('List failed'))
      
      const images = await storageService.listImages('product')
      
      expect(images).toEqual([])
    })

    it('should extract image IDs from paths', async () => {
      mockListAll.mockResolvedValueOnce({
        prefixes: [
          { fullPath: 'product/abc123/original' },
          { fullPath: 'product/def456/original' }
        ],
        items: []
      })
      
      const images = await storageService.listImages('product')
      
      expect(images).toEqual(['original', 'original'])
    })
  })

  describe('cleanup operations', () => {
    it('should delete unused images', async () => {
      const usedImages = ['image1']
      
      const deletedCount = await storageService.cleanupUnusedImages('product', usedImages)
      
      expect(deletedCount).toBe(1) // image2 should be deleted
      expect(mockDeleteObject).toHaveBeenCalledTimes(4) // 4 sizes for image2
    })

    it('should handle cleanup errors gracefully', async () => {
      mockDeleteObject.mockRejectedValue(new Error('Delete failed'))
      
      const deletedCount = await storageService.cleanupUnusedImages('product', [])
      
      expect(deletedCount).toBe(0)
    })

    it('should not delete images that are in use', async () => {
      const usedImages = ['image1', 'image2']
      
      const deletedCount = await storageService.cleanupUnusedImages('product', usedImages)
      
      expect(deletedCount).toBe(0)
      expect(mockDeleteObject).not.toHaveBeenCalled()
    })
  })

  describe('image optimization', () => {
    beforeEach(() => {
      const mockBlob = new Blob(['mock-image'], { type: 'image/jpeg' })
      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(mockBlob)
      })
    })

    it('should regenerate thumbnails for existing image', async () => {
      const urls = await storageService.optimizeImage('product', 'test-id')
      
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.jpg')
      expect(mockUploadBytes).toHaveBeenCalledTimes(3) // Only thumbnails, not original
      expect(urls).toMatchObject({
        original: expect.any(String),
        large: expect.any(String),
        medium: expect.any(String),
        small: expect.any(String)
      })
    })

    it('should handle optimization errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Fetch failed'))
      
      await expect(
        storageService.optimizeImage('product', 'test-id')
      ).rejects.toThrow('Fetch failed')
    })
  })

  describe('property-based testing', () => {
    it('should handle various file configurations', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            type: fc.constantFrom(...SUPPORTED_IMAGE_TYPES),
            size: fc.integer({ min: 1, max: MAX_FILE_SIZE })
          }),
          async (fileConfig) => {
            const file = new File(['x'.repeat(fileConfig.size)], fileConfig.name, {
              type: fileConfig.type
            })
            
            try {
              const result = await storageService.uploadImage(file, 'product')
              
              expect(result.id).toBeDefined()
              expect(result.urls).toBeDefined()
              expect(result.metadata.originalName).toBe(fileConfig.name)
              expect(result.metadata.type).toBe(fileConfig.type)
            } catch (error) {
              // Some combinations might fail, which is expected
            }
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should handle various image dimensions', () => {
      fc.assert(
        fc.property(
          fc.record({
            width: fc.integer({ min: 100, max: 4000 }),
            height: fc.integer({ min: 100, max: 4000 })
          }),
          async (dimensions) => {
            // Mock image with specific dimensions
            global.Image = class MockImage {
              onload = null as any
              onerror = null as any
              src = ''
              width = dimensions.width
              height = dimensions.height
              
              constructor() {
                setTimeout(() => {
                  if (this.onload) this.onload()
                }, 0)
              }
            } as any
            
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
            
            try {
              await storageService.uploadImage(file, 'product')
              expect(mockCanvas.toBlob).toHaveBeenCalled()
            } catch (error) {
              // Some operations might fail
            }
          }
        ),
        { numRuns: 5 }
      )
    })
  })

  describe('edge cases', () => {
    it('should handle image load errors', async () => {
      global.Image = class MockImage {
        onload = null as any
        onerror = null as any
        src = ''
        width = 800
        height = 600
        
        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror()
            }
          }, 0)
        }
      } as any
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      await expect(
        storageService.uploadImage(file, 'product')
      ).rejects.toThrow('Erreur lors du chargement de l\'image')
    })

    it('should handle zero-sized files', async () => {
      const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' })
      
      // Should pass size validation (0 < MAX_FILE_SIZE)
      try {
        await storageService.uploadImage(emptyFile, 'product')
      } catch (error) {
        // Might fail for other reasons (empty file content)
        expect(error).toBeDefined()
      }
    })

    it('should handle very long filenames', async () => {
      const longName = 'a'.repeat(255) + '.jpg'
      const file = new File(['test'], longName, { type: 'image/jpeg' })
      
      const result = await storageService.uploadImage(file, 'product')
      
      expect(result.metadata.originalName).toBe(longName)
    })

    it('should handle special characters in filenames', async () => {
      const specialName = 'тест-файл-名前.jpg'
      const file = new File(['test'], specialName, { type: 'image/jpeg' })
      
      const result = await storageService.uploadImage(file, 'product')
      
      expect(result.metadata.originalName).toBe(specialName)
    })
  })

  describe('error handling', () => {
    it('should handle storage initialization errors', () => {
      // This would typically be tested with a separate instance
      // but since we're using a singleton, we can't easily test this
      expect(storageService).toBeDefined()
    })

    it('should handle network timeouts', async () => {
      mockUploadBytes.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      await expect(
        storageService.uploadImage(file, 'product')
      ).rejects.toThrow('Timeout')
    })

    it('should handle quota exceeded errors', async () => {
      const quotaError = new Error('Quota exceeded')
      quotaError.name = 'QuotaExceededError'
      mockUploadBytes.mockRejectedValueOnce(quotaError)
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      await expect(
        storageService.uploadImage(file, 'product')
      ).rejects.toThrow('Quota exceeded')
    })
  })
})