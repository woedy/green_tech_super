// Tests for offline storage functionality
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { offlineStorage, PropertyFilters } from '../offlineStorage';
import { PROPERTIES } from '@/mocks/properties';
import { GHANA_REGIONS, ECO_FEATURES } from '@/mocks/construction';

// Mock IndexedDB
const mockIDBDatabase = {
  transaction: vi.fn(),
  objectStoreNames: { contains: vi.fn() },
  createObjectStore: vi.fn(),
  close: vi.fn()
};

const mockIDBTransaction = {
  objectStore: vi.fn(),
  oncomplete: null,
  onerror: null,
  onabort: null
};

const mockIDBObjectStore = {
  add: vi.fn(),
  put: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  count: vi.fn(),
  createIndex: vi.fn(),
  index: vi.fn()
};

const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null
};

// Mock IndexedDB globally
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: vi.fn(() => {
      const request = { ...mockIDBRequest };
      setTimeout(() => {
        request.result = mockIDBDatabase;
        if (request.onsuccess) request.onsuccess({ target: request });
      }, 0);
      return request;
    }),
    deleteDatabase: vi.fn()
  }
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('OfflineStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock implementations
    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);
    mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);
    
    // Mock successful operations
    mockIDBObjectStore.add.mockReturnValue({ ...mockIDBRequest, onsuccess: null });
    mockIDBObjectStore.put.mockReturnValue({ ...mockIDBRequest, onsuccess: null });
    mockIDBObjectStore.get.mockReturnValue({ ...mockIDBRequest, onsuccess: null });
    mockIDBObjectStore.getAll.mockReturnValue({ ...mockIDBRequest, onsuccess: null });
    mockIDBObjectStore.count.mockReturnValue({ ...mockIDBRequest, onsuccess: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize IndexedDB successfully', async () => {
      await expect(offlineStorage.init()).resolves.not.toThrow();
    });

    it('should handle IndexedDB initialization errors', async () => {
      const mockErrorRequest = {
        ...mockIDBRequest,
        error: new Error('DB initialization failed')
      };
      
      window.indexedDB.open = vi.fn(() => {
        const request = mockErrorRequest;
        setTimeout(() => {
          if (request.onerror) request.onerror({ target: request });
        }, 0);
        return request;
      });

      await expect(offlineStorage.init()).rejects.toThrow();
    });
  });

  describe('Property Caching', () => {
    it('should cache properties successfully', async () => {
      const mockSuccessRequest = { ...mockIDBRequest };
      mockIDBObjectStore.put.mockReturnValue(mockSuccessRequest);

      // Simulate successful put operations
      setTimeout(() => {
        if (mockSuccessRequest.onsuccess) mockSuccessRequest.onsuccess({ target: mockSuccessRequest });
      }, 0);

      await expect(offlineStorage.cacheProperties(PROPERTIES)).resolves.not.toThrow();
      expect(mockIDBObjectStore.put).toHaveBeenCalledTimes(PROPERTIES.length);
    });

    it('should handle caching errors gracefully', async () => {
      const mockErrorRequest = {
        ...mockIDBRequest,
        error: new Error('Cache write failed')
      };
      mockIDBObjectStore.put.mockReturnValue(mockErrorRequest);

      setTimeout(() => {
        if (mockErrorRequest.onerror) mockErrorRequest.onerror({ target: mockErrorRequest });
      }, 0);

      // Should not throw but log error
      await expect(offlineStorage.cacheProperties(PROPERTIES)).resolves.not.toThrow();
    });
  });

  describe('Ghana Regions Caching', () => {
    it('should cache Ghana regions successfully', async () => {
      const mockSuccessRequest = { ...mockIDBRequest };
      mockIDBObjectStore.put.mockReturnValue(mockSuccessRequest);

      setTimeout(() => {
        if (mockSuccessRequest.onsuccess) mockSuccessRequest.onsuccess({ target: mockSuccessRequest });
      }, 0);

      await expect(offlineStorage.cacheGhanaRegions(GHANA_REGIONS)).resolves.not.toThrow();
      expect(mockIDBObjectStore.put).toHaveBeenCalledTimes(GHANA_REGIONS.length);
    });
  });

  describe('Eco Features Caching', () => {
    it('should cache eco features successfully', async () => {
      const mockSuccessRequest = { ...mockIDBRequest };
      mockIDBObjectStore.put.mockReturnValue(mockSuccessRequest);

      setTimeout(() => {
        if (mockSuccessRequest.onsuccess) mockSuccessRequest.onsuccess({ target: mockSuccessRequest });
      }, 0);

      await expect(offlineStorage.cacheEcoFeatures(ECO_FEATURES)).resolves.not.toThrow();
      expect(mockIDBObjectStore.put).toHaveBeenCalledTimes(ECO_FEATURES.length);
    });
  });

  describe('Offline Property Search', () => {
    beforeEach(() => {
      // Mock getAll to return cached properties
      const mockGetAllRequest = { ...mockIDBRequest, result: PROPERTIES };
      mockIDBObjectStore.getAll.mockReturnValue(mockGetAllRequest);
      
      setTimeout(() => {
        if (mockGetAllRequest.onsuccess) mockGetAllRequest.onsuccess({ target: mockGetAllRequest });
      }, 0);
    });

    it('should search properties offline with no filters', async () => {
      const filters: PropertyFilters = {};
      const results = await offlineStorage.searchPropertiesOffline(filters);
      
      expect(results).toHaveLength(PROPERTIES.length);
      expect(mockIDBObjectStore.getAll).toHaveBeenCalled();
    });

    it('should filter properties by location', async () => {
      const filters: PropertyFilters = { location: 'Accra' };
      const results = await offlineStorage.searchPropertiesOffline(filters);
      
      // Should return properties in Accra
      const expectedResults = PROPERTIES.filter(p => 
        p.location.city.toLowerCase().includes('accra')
      );
      expect(results).toHaveLength(expectedResults.length);
    });

    it('should filter properties by region (Ghana-specific)', async () => {
      const filters: PropertyFilters = { region: 'Greater Accra' };
      const results = await offlineStorage.searchPropertiesOffline(filters);
      
      const expectedResults = PROPERTIES.filter(p => p.region === 'Greater Accra');
      expect(results).toHaveLength(expectedResults.length);
    });

    it('should filter properties by listing type', async () => {
      const filters: PropertyFilters = { listingType: 'sale' };
      const results = await offlineStorage.searchPropertiesOffline(filters);
      
      const expectedResults = PROPERTIES.filter(p => p.listingType === 'sale');
      expect(results).toHaveLength(expectedResults.length);
    });

    it('should filter properties by green score', async () => {
      const filters: PropertyFilters = { greenScoreMin: 70 };
      const results = await offlineStorage.searchPropertiesOffline(filters);
      
      const expectedResults = PROPERTIES.filter(p => 
        p.greenScore && p.greenScore >= 70
      );
      expect(results).toHaveLength(expectedResults.length);
    });

    it('should filter properties by eco features', async () => {
      const filters: PropertyFilters = { ecoFeatures: ['Solar'] };
      const results = await offlineStorage.searchPropertiesOffline(filters);
      
      const expectedResults = PROPERTIES.filter(p => 
        p.ecoFeatures && p.ecoFeatures.includes('Solar')
      );
      expect(results).toHaveLength(expectedResults.length);
    });

    it('should combine multiple filters', async () => {
      const filters: PropertyFilters = {
        listingType: 'sale',
        greenScoreMin: 60,
        ecoFeatures: ['LED Lighting']
      };
      const results = await offlineStorage.searchPropertiesOffline(filters);
      
      const expectedResults = PROPERTIES.filter(p => 
        p.listingType === 'sale' &&
        p.greenScore && p.greenScore >= 60 &&
        p.ecoFeatures && p.ecoFeatures.includes('LED Lighting')
      );
      expect(results).toHaveLength(expectedResults.length);
    });
  });

  describe('Offline Actions Queue', () => {
    it('should add offline action to sync queue', async () => {
      const mockAddRequest = { ...mockIDBRequest };
      mockIDBObjectStore.add.mockReturnValue(mockAddRequest);

      setTimeout(() => {
        if (mockAddRequest.onsuccess) mockAddRequest.onsuccess({ target: mockAddRequest });
      }, 0);

      const action = {
        type: 'property_inquiry' as const,
        data: { propertyId: '1', message: 'Test inquiry' },
        endpoint: '/api/properties/1/inquire'
      };

      await expect(offlineStorage.addOfflineAction(action)).resolves.not.toThrow();
      expect(mockIDBObjectStore.add).toHaveBeenCalled();
    });

    it('should get pending offline actions', async () => {
      const mockActions = [
        {
          id: 'action1',
          type: 'property_inquiry',
          data: {},
          endpoint: '/api/test',
          timestamp: Date.now(),
          retryCount: 0
        }
      ];

      const mockGetAllRequest = { ...mockIDBRequest, result: mockActions };
      mockIDBObjectStore.getAll.mockReturnValue(mockGetAllRequest);

      setTimeout(() => {
        if (mockGetAllRequest.onsuccess) mockGetAllRequest.onsuccess({ target: mockGetAllRequest });
      }, 0);

      const actions = await offlineStorage.getPendingActions();
      expect(actions).toEqual(mockActions);
    });
  });

  describe('Search Results Caching', () => {
    it('should cache search results', async () => {
      const mockPutRequest = { ...mockIDBRequest };
      mockIDBObjectStore.put.mockReturnValue(mockPutRequest);

      setTimeout(() => {
        if (mockPutRequest.onsuccess) mockPutRequest.onsuccess({ target: mockPutRequest });
      }, 0);

      const query = 'test-search';
      const filters: PropertyFilters = { location: 'Accra' };
      const results = PROPERTIES.slice(0, 2);

      await expect(offlineStorage.cacheSearchResults(query, filters, results)).resolves.not.toThrow();
      expect(mockIDBObjectStore.put).toHaveBeenCalled();
    });

    it('should retrieve cached search results', async () => {
      const cachedResult = {
        query: 'test-search',
        filters: { location: 'Accra' },
        results: PROPERTIES.slice(0, 2),
        timestamp: Date.now()
      };

      const mockGetRequest = { ...mockIDBRequest, result: cachedResult };
      mockIDBObjectStore.get.mockReturnValue(mockGetRequest);

      setTimeout(() => {
        if (mockGetRequest.onsuccess) mockGetRequest.onsuccess({ target: mockGetRequest });
      }, 0);

      const result = await offlineStorage.getCachedSearchResults('test-search');
      expect(result).toEqual(cachedResult);
    });

    it('should return null for expired cached results', async () => {
      const expiredResult = {
        query: 'test-search',
        filters: { location: 'Accra' },
        results: PROPERTIES.slice(0, 2),
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      const mockGetRequest = { ...mockIDBRequest, result: expiredResult };
      mockIDBObjectStore.get.mockReturnValue(mockGetRequest);

      setTimeout(() => {
        if (mockGetRequest.onsuccess) mockGetRequest.onsuccess({ target: mockGetRequest });
      }, 0);

      const result = await offlineStorage.getCachedSearchResults('test-search');
      expect(result).toBeNull();
    });
  });

  describe('Storage Statistics', () => {
    it('should get storage statistics', async () => {
      const mockCountRequest = { ...mockIDBRequest, result: 5 };
      mockIDBObjectStore.count.mockReturnValue(mockCountRequest);

      setTimeout(() => {
        if (mockCountRequest.onsuccess) mockCountRequest.onsuccess({ target: mockCountRequest });
      }, 0);

      const stats = await offlineStorage.getStorageStats();
      expect(stats).toEqual({
        properties: 5,
        regions: 5,
        features: 5,
        actions: 5
      });
    });
  });

  describe('Cache Cleanup', () => {
    it('should clear old cache entries', async () => {
      const mockIndex = {
        openCursor: vi.fn()
      };
      mockIDBObjectStore.index.mockReturnValue(mockIndex);

      const mockCursor = {
        delete: vi.fn(),
        continue: vi.fn()
      };

      const mockCursorRequest = { ...mockIDBRequest, result: mockCursor };
      mockIndex.openCursor.mockReturnValue(mockCursorRequest);

      setTimeout(() => {
        if (mockCursorRequest.onsuccess) {
          mockCursorRequest.onsuccess({ target: mockCursorRequest });
          // Simulate cursor ending
          mockCursorRequest.result = null;
          if (mockCursorRequest.onsuccess) mockCursorRequest.onsuccess({ target: mockCursorRequest });
        }
      }, 0);

      await expect(offlineStorage.clearOldCache()).resolves.not.toThrow();
      expect(mockIndex.openCursor).toHaveBeenCalled();
    });
  });
});

describe('Utility Functions', () => {
  describe('isOnline', () => {
    it('should return true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      
      const { isOnline } = require('../offlineStorage');
      expect(isOnline()).toBe(true);
    });

    it('should return false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      const { isOnline } = require('../offlineStorage');
      expect(isOnline()).toBe(false);
    });
  });

  describe('waitForOnline', () => {
    it('should resolve immediately when already online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      
      const { waitForOnline } = require('../offlineStorage');
      await expect(waitForOnline()).resolves.not.toThrow();
    });

    it('should wait for online event when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      const { waitForOnline } = require('../offlineStorage');
      
      // Simulate going online after a delay
      setTimeout(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        window.dispatchEvent(new Event('online'));
      }, 100);

      await expect(waitForOnline()).resolves.not.toThrow();
    });
  });
});