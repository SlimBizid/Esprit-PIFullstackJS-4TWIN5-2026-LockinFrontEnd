import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

function createStorageMock() {
  let store = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
    clear: vi.fn(() => {
      store = new Map()
    }),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    get length() {
      return store.size
    },
  }
}

const localStorageMock = createStorageMock()
const sessionStorageMock = createStorageMock()

vi.stubGlobal('localStorage', localStorageMock)
vi.stubGlobal('sessionStorage', sessionStorageMock)
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  window.sessionStorage.clear()
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})
