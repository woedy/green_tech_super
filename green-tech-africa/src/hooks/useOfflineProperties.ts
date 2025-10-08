// Hook for offline property search with Ghana location data
import { useState, useEffect, useCallback } from 'react';
import { Property } from '@/mocks/properties';
import { GhanaRegion, EcoFeature } from '@/mocks/construction';
import { offlineStorage, PropertyFilters, isOnline } from '@/lib/offlineStorage';
import { PROPERTIES } from '@/mocks/properties';
import { GHANA_REGIONS, ECO_FEATURES } from '@/mocks/construction';

export interface UseOfflinePropertiesReturn {
  properties: Property[];
  ghanaRegions: GhanaRegion[];
  ecoFeatures: EcoFeature[];
  isLoading: boolean;
  isOffline: boolean;
  error: string | null;
  searchProperties: (filters: PropertyFilters) => Promise<Property[]>;
  refreshData: () => Promise<void>;
  cacheStatus: {
    properties: number;
    regions: number;
    features: number;
    actions: number;
  } | null;
}

export const useOfflineProperties = (): UseOfflinePropertiesReturn => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [ghanaRegions, setGhanaRegions] = useState<GhanaRegion[]>([]);
  const [ecoFeatures, setEcoFeatures] = useState<EcoFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<{
    properties: number;
    regions: number;
    features: number;
    actions: number;
  } | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      refreshData(); // Refresh data when coming back online
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize data and cache
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOnline()) {
        // Online: Load fresh data and cache it
        await loadFreshData();
      } else {
        // Offline: Load from cache
        await loadCachedData();
      }

      // Update cache status
      const stats = await offlineStorage.getStorageStats();
      setCacheStatus(stats);
    } catch (err) {
      console.error('Failed to initialize data:', err);
      setError('Failed to load property data');
      
      // Try to load cached data as fallback
      try {
        await loadCachedData();
      } catch (cacheErr) {
        console.error('Failed to load cached data:', cacheErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadFreshData = async () => {
    // In a real app, these would be API calls
    // For now, we'll use mock data and cache it
    
    // Cache the data for offline use
    await offlineStorage.cacheProperties(PROPERTIES);
    await offlineStorage.cacheGhanaRegions(GHANA_REGIONS);
    await offlineStorage.cacheEcoFeatures(ECO_FEATURES);

    setProperties(PROPERTIES);
    setGhanaRegions(GHANA_REGIONS);
    setEcoFeatures(ECO_FEATURES);

    console.log('[useOfflineProperties] Fresh data loaded and cached');
  };

  const loadCachedData = async () => {
    const [cachedProperties, cachedRegions, cachedFeatures] = await Promise.all([
      offlineStorage.searchPropertiesOffline({}), // Get all properties
      offlineStorage.getGhanaRegionsOffline(),
      offlineStorage.getEcoFeaturesOffline()
    ]);

    // If no cached data, use mock data as fallback
    setProperties(cachedProperties.length > 0 ? cachedProperties : PROPERTIES);
    setGhanaRegions(cachedRegions.length > 0 ? cachedRegions : GHANA_REGIONS);
    setEcoFeatures(cachedFeatures.length > 0 ? cachedFeatures : ECO_FEATURES);

    console.log('[useOfflineProperties] Cached data loaded');
  };

  const searchProperties = useCallback(async (filters: PropertyFilters): Promise<Property[]> => {
    try {
      let results: Property[];

      if (isOnline()) {
        // Online: Try to get fresh results
        // In a real app, this would be an API call
        results = PROPERTIES.filter(property => {
          // Apply filters (simplified version)
          if (filters.location && !property.location.city.toLowerCase().includes(filters.location.toLowerCase())) {
            return false;
          }
          if (filters.region && property.region !== filters.region) {
            return false;
          }
          if (filters.listingType && property.listingType !== filters.listingType) {
            return false;
          }
          if (filters.propertyType && property.type !== filters.propertyType) {
            return false;
          }
          if (filters.greenScoreMin && (!property.greenScore || property.greenScore < filters.greenScoreMin)) {
            return false;
          }
          return true;
        });

        // Cache the search results
        const queryKey = JSON.stringify(filters);
        await offlineStorage.cacheSearchResults(queryKey, filters, results);
      } else {
        // Offline: Search cached data
        results = await offlineStorage.searchPropertiesOffline(filters);
      }

      return results;
    } catch (err) {
      console.error('Property search failed:', err);
      
      // Fallback to offline search
      try {
        return await offlineStorage.searchPropertiesOffline(filters);
      } catch (offlineErr) {
        console.error('Offline search failed:', offlineErr);
        throw new Error('Property search unavailable');
      }
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!isOnline()) {
      console.log('[useOfflineProperties] Cannot refresh data while offline');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await loadFreshData();
      
      // Update cache status
      const stats = await offlineStorage.getStorageStats();
      setCacheStatus(stats);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    properties,
    ghanaRegions,
    ecoFeatures,
    isLoading,
    isOffline,
    error,
    searchProperties,
    refreshData,
    cacheStatus
  };
};

// Hook for managing offline actions
export const useOfflineActions = () => {
  const [pendingActions, setPendingActions] = useState<number>(0);

  useEffect(() => {
    updatePendingCount();
  }, []);

  const updatePendingCount = async () => {
    try {
      const actions = await offlineStorage.getPendingActions();
      setPendingActions(actions.length);
    } catch (error) {
      console.error('Failed to get pending actions:', error);
    }
  };

  const addOfflineAction = async (
    type: 'property_inquiry' | 'construction_request' | 'project_update' | 'favorite_property',
    data: any,
    endpoint: string
  ) => {
    try {
      await offlineStorage.addOfflineAction({ type, data, endpoint });
      await updatePendingCount();
    } catch (error) {
      console.error('Failed to add offline action:', error);
      throw error;
    }
  };

  return {
    pendingActions,
    addOfflineAction,
    updatePendingCount
  };
};