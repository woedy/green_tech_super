// Offline storage utilities for Ghana-specific data and property search
import { Property } from '@/mocks/properties';
import { EcoFeature, GhanaRegion } from '@/mocks/construction';

export interface OfflineAction {
  id: string;
  type: 'property_inquiry' | 'construction_request' | 'project_update' | 'favorite_property';
  data: any;
  endpoint: string;
  timestamp: number;
  retryCount: number;
}

export interface CachedSearchResult {
  query: string;
  filters: PropertyFilters;
  results: Property[];
  timestamp: number;
}

export interface PropertyFilters {
  location?: string;
  region?: string;
  priceRange?: [number, number];
  propertyType?: string;
  listingType?: 'sale' | 'rent';
  ecoFeatures?: string[];
  greenScoreMin?: number;
  beds?: number;
  baths?: number;
}

class OfflineStorageManager {
  private dbName = 'GreenTechOffline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  // Initialize IndexedDB
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for offline actions (sync queue)
        if (!db.objectStoreNames.contains('actions')) {
          const actionsStore = db.createObjectStore('actions', { keyPath: 'id' });
          actionsStore.createIndex('type', 'type', { unique: false });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for cached properties
        if (!db.objectStoreNames.contains('properties')) {
          const propertiesStore = db.createObjectStore('properties', { keyPath: 'id' });
          propertiesStore.createIndex('location', 'location.city', { unique: false });
          propertiesStore.createIndex('region', 'region', { unique: false });
          propertiesStore.createIndex('listingType', 'listingType', { unique: false });
        }

        // Store for Ghana regions data
        if (!db.objectStoreNames.contains('ghanaRegions')) {
          db.createObjectStore('ghanaRegions', { keyPath: 'id' });
        }

        // Store for eco features
        if (!db.objectStoreNames.contains('ecoFeatures')) {
          const ecoStore = db.createObjectStore('ecoFeatures', { keyPath: 'id' });
          ecoStore.createIndex('category', 'category', { unique: false });
          ecoStore.createIndex('availableInGhana', 'availableInGhana', { unique: false });
        }

        // Store for cached search results
        if (!db.objectStoreNames.contains('searchCache')) {
          const searchStore = db.createObjectStore('searchCache', { keyPath: 'query' });
          searchStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for user preferences and offline state
        if (!db.objectStoreNames.contains('userState')) {
          db.createObjectStore('userState', { keyPath: 'key' });
        }
      };
    });
  }

  // Cache properties for offline search
  async cacheProperties(properties: Property[]): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['properties'], 'readwrite');
    const store = transaction.objectStore('properties');

    for (const property of properties) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(property);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log(`[OfflineStorage] Cached ${properties.length} properties`);
  }

  // Cache Ghana regions data
  async cacheGhanaRegions(regions: GhanaRegion[]): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['ghanaRegions'], 'readwrite');
    const store = transaction.objectStore('ghanaRegions');

    for (const region of regions) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(region);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log(`[OfflineStorage] Cached ${regions.length} Ghana regions`);
  }

  // Cache eco features
  async cacheEcoFeatures(features: EcoFeature[]): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['ecoFeatures'], 'readwrite');
    const store = transaction.objectStore('ecoFeatures');

    for (const feature of features) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(feature);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log(`[OfflineStorage] Cached ${features.length} eco features`);
  }

  // Search properties offline
  async searchPropertiesOffline(filters: PropertyFilters): Promise<Property[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['properties'], 'readonly');
      const store = transaction.objectStore('properties');
      const request = store.getAll();

      request.onsuccess = () => {
        const allProperties = request.result as Property[];
        const filteredProperties = this.filterProperties(allProperties, filters);
        resolve(filteredProperties);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Filter properties based on criteria
  private filterProperties(properties: Property[], filters: PropertyFilters): Property[] {
    return properties.filter(property => {
      // Location filter
      if (filters.location && !property.location.city.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Region filter (Ghana-specific)
      if (filters.region && property.region !== filters.region) {
        return false;
      }

      // Property type filter
      if (filters.propertyType && property.type !== filters.propertyType) {
        return false;
      }

      // Listing type filter
      if (filters.listingType && property.listingType !== filters.listingType) {
        return false;
      }

      // Beds filter
      if (filters.beds && property.beds < filters.beds) {
        return false;
      }

      // Baths filter
      if (filters.baths && property.baths < filters.baths) {
        return false;
      }

      // Green score filter
      if (filters.greenScoreMin && (!property.greenScore || property.greenScore < filters.greenScoreMin)) {
        return false;
      }

      // Eco features filter
      if (filters.ecoFeatures && filters.ecoFeatures.length > 0) {
        if (!property.ecoFeatures || !filters.ecoFeatures.some(feature => 
          property.ecoFeatures!.includes(feature)
        )) {
          return false;
        }
      }

      // Price range filter (basic implementation)
      if (filters.priceRange) {
        const priceStr = property.price.replace(/[^0-9]/g, '');
        const price = parseInt(priceStr);
        if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
          return false;
        }
      }

      return true;
    });
  }

  // Get Ghana regions for offline use
  async getGhanaRegionsOffline(): Promise<GhanaRegion[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['ghanaRegions'], 'readonly');
      const store = transaction.objectStore('ghanaRegions');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as GhanaRegion[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Get eco features for offline use
  async getEcoFeaturesOffline(): Promise<EcoFeature[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['ecoFeatures'], 'readonly');
      const store = transaction.objectStore('ecoFeatures');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as EcoFeature[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Cache search results
  async cacheSearchResults(query: string, filters: PropertyFilters, results: Property[]): Promise<void> {
    if (!this.db) await this.init();

    const cacheEntry: CachedSearchResult = {
      query,
      filters,
      results,
      timestamp: Date.now()
    };

    const transaction = this.db!.transaction(['searchCache'], 'readwrite');
    const store = transaction.objectStore('searchCache');

    await new Promise<void>((resolve, reject) => {
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached search results
  async getCachedSearchResults(query: string): Promise<CachedSearchResult | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['searchCache'], 'readonly');
      const store = transaction.objectStore('searchCache');
      const request = store.get(query);

      request.onsuccess = () => {
        const result = request.result as CachedSearchResult;
        // Check if cache is still valid (24 hours)
        if (result && Date.now() - result.timestamp < 24 * 60 * 60 * 1000) {
          resolve(result);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Add offline action to sync queue
  async addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    if (!this.db) await this.init();

    const fullAction: OfflineAction = {
      ...action,
      id: `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    const transaction = this.db!.transaction(['actions'], 'readwrite');
    const store = transaction.objectStore('actions');

    await new Promise<void>((resolve, reject) => {
      const request = store.add(fullAction);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log(`[OfflineStorage] Added offline action: ${action.type}`);

    // Register for background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-offline-actions');
      } catch (error) {
        console.log('[OfflineStorage] Background sync registration failed:', error);
      }
    }
  }

  // Get pending offline actions
  async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as OfflineAction[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear old cache entries
  async clearOldCache(): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['searchCache'], 'readwrite');
    const store = transaction.objectStore('searchCache');
    const index = store.index('timestamp');
    
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    const range = IDBKeyRange.upperBound(cutoffTime);
    
    const request = index.openCursor(range);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }

  // Get storage usage statistics
  async getStorageStats(): Promise<{ properties: number; regions: number; features: number; actions: number }> {
    if (!this.db) await this.init();

    const stats = { properties: 0, regions: 0, features: 0, actions: 0 };

    const transaction = this.db!.transaction(['properties', 'ghanaRegions', 'ecoFeatures', 'actions'], 'readonly');

    const promises = [
      this.getStoreCount(transaction.objectStore('properties')),
      this.getStoreCount(transaction.objectStore('ghanaRegions')),
      this.getStoreCount(transaction.objectStore('ecoFeatures')),
      this.getStoreCount(transaction.objectStore('actions'))
    ];

    const [properties, regions, features, actions] = await Promise.all(promises);

    return { properties, regions, features, actions };
  }

  private getStoreCount(store: IDBObjectStore): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageManager();

// Utility functions for offline detection and management
export const isOnline = (): boolean => navigator.onLine;

export const waitForOnline = (): Promise<void> => {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve();
      return;
    }

    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };

    window.addEventListener('online', handleOnline);
  });
};

// Initialize offline storage when module loads
offlineStorage.init().catch(console.error);