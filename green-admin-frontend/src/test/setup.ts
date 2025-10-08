import '@testing-library/jest-dom'

// Mock ResizeObserver for recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  },
  writable: true,
})

// Mock WebSocket for build request feed
global.WebSocket = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  onmessage: null,
  onerror: null,
}))