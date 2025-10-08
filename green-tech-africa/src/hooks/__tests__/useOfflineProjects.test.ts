// Tests for offline projects hook
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineProjects } from '../useOfflineProjects';
import { PROJECTS } from '@/mocks/projects';

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

// Mock offline storage
vi.mock('@/lib/offlineStorage', () => ({
  offlineStorage: {
    init: vi.fn().mockResolvedValue(undefined),
    addOfflineAction: vi.fn().mockResolvedValue(undefined)
  },
  isOnline: vi.fn(() => navigator.onLine),
  waitForOnline: vi.fn().mockResolvedValue(undefined)
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

describe('useOfflineProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    
    // Setup mock implementations
    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);
    mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);
    
    // Mock successful operations
    const successRequest = { ...mockIDBRequest };
    mockIDBObjectStore.add.mockReturnValue(successRequest);
    mockIDBObjectStore.put.mockReturnValue(successRequest);
    mockIDBObjectStore.getAll.mockReturnValue({ ...mockIDBRequest, result: PROJECTS });
    mockIDBObjectStore.clear.mockReturnValue(successRequest);
    
    setTimeout(() => {
      if (successRequest.onsuccess) successRequest.onsuccess({ target: successRequest });
    }, 0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useOfflineProjects());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.projects).toEqual([]);
    expect(result.current.pendingUpdates).toBe(0);
  });

  it('should load projects when online', async () => {
    const { result } = renderHook(() => useOfflineProjects());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toEqual(PROJECTS);
    expect(result.current.isOffline).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load cached projects when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    const { result } = renderHook(() => useOfflineProjects());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isOffline).toBe(true);
    expect(result.current.projects).toEqual(PROJECTS);
  });

  it('should add project update', async () => {
    const { result } = renderHook(() => useOfflineProjects());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addProjectUpdate(
        'PRJ-88',
        'Test Update',
        'This is a test update',
        ['image1.jpg']
      );
    });

    expect(mockIDBObjectStore.add).toHaveBeenCalled();
  });

  it('should update milestone', async () => {
    const { result } = renderHook(() => useOfflineProjects());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateMilestone(
        'PRJ-88',
        'Foundation pour',
        true,
        'Completed successfully'
      );
    });

    expect(mockIDBObjectStore.add).toHaveBeenCalled();
    
    // Check that local state was updated
    const project = result.current.projects.find(p => p.id === 'PRJ-88');
    const milestone = project?.milestones.find(m => m.title === 'Foundation pour');
    expect(milestone?.done).toBe(true);
  });

  it('should sync pending updates when online', async () => {
    // Mock unsynced updates
    const unsyncedUpdates = [
      {
        id: 'update1',
        projectId: 'PRJ-88',
        title: 'Test Update',
        content: 'Test content',
        images: [],
        timestamp: Date.now(),
        synced: false
      }
    ];

    const mockIndex = {
      getAll: vi.fn().mockReturnValue({
        ...mockIDBRequest,
        result: unsyncedUpdates,
        onsuccess: null
      })
    };
    mockIDBObjectStore.index.mockReturnValue(mockIndex);

    const { result } = renderHook(() => useOfflineProjects());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.syncPendingUpdates();
    });

    expect(mockIndex.getAll).toHaveBeenCalledWith(false);
  });

  it('should not sync when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    const { result } = renderHook(() => useOfflineProjects());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.syncPendingUpdates();
    });

    // Should not attempt to sync when offline
    expect(result.current.isOffline).toBe(true);
  });

  it('should get project updates', async () => {
    const mockUpdates = [
      {
        id: 'update1',
        projectId: 'PRJ-88',
        title: 'Test Update',
        content: 'Test content',
        images: [],
        timestamp: Date.now(),
        synced: true
      }
    ];

    const mockIndex = {
      getAll: vi.fn().mockReturnValue({
        ...mockIDBRequest,
        result: mockUpdates,
        onsuccess: null
      })
    };
    mockIDBObjectStore.index.mockReturnValue(mockIndex);

    const { result } = renderHook(() => useOfflineProjects());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const updates = await result.current.getProjectUpdates('PRJ-88');
      expect(updates).toEqual(mockUpdates);
    });
  });

  it('should refresh projects when online', async () => {
    const { result } = renderHook(() => useOfflineProjects());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshProjects();
    });

    expect(mockIDBObjectStore.clear).toHaveBeenCalled();
    expect(mockIDBObjectStore.add).toHaveBeenCalledTimes(PROJECTS.length);
  });

  it('should not refresh projects when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    const { result } = renderHook(() => useOfflineProjects());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshProjects();
    });

    // Should not attempt to refresh when offline
    expect(result.current.isOffline).toBe(true);
  });

  it('should handle project update errors', async () => {
    const errorRequest = {
      ...mockIDBRequest,
      error: new Error('Storage error')
    };
    mockIDBObjectStore.add.mockReturnValue(errorRequest);

    setTimeout(() => {
      if (errorRequest.onerror) errorRequest.onerror({ target: errorRequest });
    }, 0);

    const { result } = renderHook(() => useOfflineProjects());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(act(async () => {
      await result.current.addProjectUpdate('PRJ-88', 'Test', 'Content');
    })).rejects.toThrow('Failed to add project update');
  });

  it('should handle milestone update errors', async () => {
    const errorRequest = {
      ...mockIDBRequest,
      error: new Error('Storage error')
    };
    mockIDBObjectStore.add.mockReturnValue(errorRequest);

    setTimeout(() => {
      if (errorRequest.onerror) errorRequest.onerror({ target: errorRequest });
    }, 0);

    const { result } = renderHook(() => useOfflineProjects());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(act(async () => {
      await result.current.updateMilestone('PRJ-88', 'Test Milestone', true);
    })).rejects.toThrow('Failed to update milestone');
  });

  it('should register online/offline event listeners', () => {
    renderHook(() => useOfflineProjects());
    
    expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() => useOfflineProjects());
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should auto-sync when coming back online', async () => {
    const { result } = renderHook(() => useOfflineProjects());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simulate going offline then online
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    // Get the online event handler
    const onlineHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'online'
    )?.[1];

    expect(onlineHandler).toBeDefined();

    // Simulate coming back online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    
    await act(async () => {
      if (onlineHandler) onlineHandler();
    });

    expect(result.current.isOffline).toBe(false);
  });
});