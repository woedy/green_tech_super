// Tests for offline properties hook
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineProperties, useOfflineActions } from '../useOfflineProperties';
import { PROPERTIES } from '@/mocks/properties';
import { GHANA_REGIONS, ECO_FEATURES } from '@/mocks/construction';

// Mock the offline storage module
vi.mock('@/lib/offlineStorage', () => ({
  offlineStorage: {
    init: vi.fn().mockResolvedValue(undefined),
    cacheProperties: vi.fn().mockResolvedValue(undefined),
    cacheGhanaRegions: vi.fn().mockResolvedValue(undefined),
    cacheEcoFeatures: vi.fn().mockResolvedValue(undefined),
    searchPropertiesOffline: vi.fn().mockResolvedValue(PROPERTIES),
    getGhanaRegionsOffline: vi.fn().mockResolvedValue(GHANA_REGIONS),
    getEcoFeaturesOffline: vi.fn().mockResolvedValue(ECO_FEATURES),
    cacheSearchResults: vi.fn().mockResolvedValue(undefined),
    getStorageStats: vi.fn().mockResolvedValue({
      properties: 4,
      regions: 4,
      features: 16,
      actions: 0
    }),
    addOfflineAction: vi.fn().mockResolvedValue(undefined),
    getPendingActions: vi.fn().mockResolvedValue([])
  },
  isOnline: vi.fn(() => navigator.onLine),
  PropertyFilters: {}
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock window events
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener });
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener });

describe('useOfflineProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useOfflineProperties());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.properties).toEqual([]);
    expect(result.current.ghanaRegions).toEqual([]);
    expect(result.current.ecoFeatures).toEqual([]);
  });

  it('should load fresh data when online', async () => {
    const { result } = renderHook(() => useOfflineProperties());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.properties).toEqual(PROPERTIES);
    expect(result.current.ghanaRegions).toEqual(GHANA_REGIONS);
    expect(result.current.ecoFeatures).toEqual(ECO_FEATURES);
    expect(result.current.isOffline).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load cached data when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    const { result } = renderHook(() => useOfflineProperties());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isOffline).toBe(true);
    expect(result.current.properties).toEqual(PROPERTIES);
  });

  it('should handle initialization errors gracefully', async () => {
    const { offlineStorage } = await import('@/lib/offlineStorage');
    vi.mocked(offlineStorage.getStorageStats).mockRejectedValueOnce(new Error('Storage error'));
    
    const { result } = renderHook(() => useOfflineProperties());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load property data');
  });

  it('should search properties with filters', async () => {
    const { result } = renderHook(() => useOfflineProperties());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const filters = { location: 'Accra', listingType: 'sale' as const };
    
    await act(async () => {
      const results = await result.current.searchProperties(filters);
      expect(results).toBeDefined();
    });
  });

  it('should refresh data when online', async () => {
    const { result } = renderHook(() => useOfflineProperties());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshData();
    });

    const { offlineStorage } = await import('@/lib/offlineStorage');
    expect(offlineStorage.cacheProperties).toHaveBeenCalled();
  });

  it('should not refresh data when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    const { result } = renderHook(() => useOfflineProperties());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshData();
    });

    // Should not attempt to load fresh data when offline
    expect(result.current.isOffline).toBe(true);
  });

  it('should update cache status', async () => {
    const { result } = renderHook(() => useOfflineProperties());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.cacheStatus).toEqual({
      properties: 4,
      regions: 4,
      features: 16,
      actions: 0
    });
  });

  it('should register online/offline event listeners', () => {
    renderHook(() => useOfflineProperties());
    
    expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() => useOfflineProperties());
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});

describe('useOfflineActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with zero pending actions', async () => {
    const { result } = renderHook(() => useOfflineActions());
    
    await waitFor(() => {
      expect(result.current.pendingActions).toBe(0);
    });
  });

  it('should add offline action', async () => {
    const { result } = renderHook(() => useOfflineActions());
    
    await act(async () => {
      await result.current.addOfflineAction(
        'property_inquiry',
        { propertyId: '1', message: 'Test' },
        '/api/properties/1/inquire'
      );
    });

    const { offlineStorage } = await import('@/lib/offlineStorage');
    expect(offlineStorage.addOfflineAction).toHaveBeenCalledWith({
      type: 'property_inquiry',
      data: { propertyId: '1', message: 'Test' },
      endpoint: '/api/properties/1/inquire'
    });
  });

  it('should handle add offline action errors', async () => {
    const { offlineStorage } = await import('@/lib/offlineStorage');
    vi.mocked(offlineStorage.addOfflineAction).mockRejectedValueOnce(new Error('Storage error'));
    
    const { result } = renderHook(() => useOfflineActions());
    
    await expect(act(async () => {
      await result.current.addOfflineAction(
        'property_inquiry',
        { propertyId: '1' },
        '/api/test'
      );
    })).rejects.toThrow('Storage error');
  });

  it('should update pending count', async () => {
    const { offlineStorage } = await import('@/lib/offlineStorage');
    vi.mocked(offlineStorage.getPendingActions).mockResolvedValueOnce([
      {
        id: 'action1',
        type: 'property_inquiry',
        data: {},
        endpoint: '/api/test',
        timestamp: Date.now(),
        retryCount: 0
      }
    ]);
    
    const { result } = renderHook(() => useOfflineActions());
    
    await act(async () => {
      await result.current.updatePendingCount();
    });

    await waitFor(() => {
      expect(result.current.pendingActions).toBe(1);
    });
  });

  it('should handle pending count update errors', async () => {
    const { offlineStorage } = await import('@/lib/offlineStorage');
    vi.mocked(offlineStorage.getPendingActions).mockRejectedValueOnce(new Error('Storage error'));
    
    const { result } = renderHook(() => useOfflineActions());
    
    await act(async () => {
      await result.current.updatePendingCount();
    });

    // Should handle error gracefully without throwing
    expect(result.current.pendingActions).toBe(0);
  });
});