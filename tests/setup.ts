import '@testing-library/jest-dom'
import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// Global test setup
beforeAll(() => {
  // Setup global test environment
})

afterAll(() => {
  // Cleanup global test environment
})

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: 'test-app' }))
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  addDoc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 }))
  }
}))

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  connectStorageEmulator: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
  listAll: vi.fn()
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  connectAuthEmulator: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  User: vi.fn()
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn()
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn(),
    toString: vi.fn()
  }),
  usePathname: () => '/test-path'
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    })
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
})