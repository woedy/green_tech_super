// Hook for offline project management with sync queue
import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/mocks/projects';
import { offlineStorage, isOnline, waitForOnline } from '@/lib/offlineStorage';
import { PROJECTS } from '@/mocks/projects';

export interface ProjectUpdate {
  id: string;
  projectId: string;
  title: string;
  content: string;
  images?: string[];
  timestamp: number;
  synced: boolean;
}

export interface MilestoneUpdate {
  id: string;
  projectId: string;
  milestoneTitle: string;
  completed: boolean;
  notes?: string;
  timestamp: number;
  synced: boolean;
}

export interface UseOfflineProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  isOffline: boolean;
  error: string | null;
  pendingUpdates: number;
  addProjectUpdate: (projectId: string, title: string, content: string, images?: string[]) => Promise<void>;
  updateMilestone: (projectId: string, milestoneTitle: string, completed: boolean, notes?: string) => Promise<void>;
  syncPendingUpdates: () => Promise<void>;
  getProjectUpdates: (projectId: string) => Promise<ProjectUpdate[]>;
  refreshProjects: () => Promise<void>;
}

export const useOfflineProjects = (): UseOfflineProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState(0);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncPendingUpdates(); // Auto-sync when coming back online
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

  // Initialize projects data
  useEffect(() => {
    initializeProjects();
  }, []);

  const initializeProjects = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOnline()) {
        await loadFreshProjects();
      } else {
        await loadCachedProjects();
      }

      await updatePendingCount();
    } catch (err) {
      console.error('Failed to initialize projects:', err);
      setError('Failed to load project data');
      
      // Fallback to mock data
      setProjects(PROJECTS);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFreshProjects = async () => {
    // In a real app, this would be an API call
    // For now, we'll use mock data and cache it
    await cacheProjects(PROJECTS);
    setProjects(PROJECTS);
    console.log('[useOfflineProjects] Fresh projects loaded and cached');
  };

  const loadCachedProjects = async () => {
    try {
      const cachedProjects = await getCachedProjects();
      setProjects(cachedProjects.length > 0 ? cachedProjects : PROJECTS);
      console.log('[useOfflineProjects] Cached projects loaded');
    } catch (error) {
      console.error('Failed to load cached projects:', error);
      setProjects(PROJECTS);
    }
  };

  const cacheProjects = async (projectsData: Project[]) => {
    try {
      await offlineStorage.init();
      
      // Store projects in IndexedDB
      const db = await openProjectsDB();
      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      
      // Clear existing projects
      await store.clear();
      
      // Add new projects
      for (const project of projectsData) {
        await store.add(project);
      }
      
      console.log(`[useOfflineProjects] Cached ${projectsData.length} projects`);
    } catch (error) {
      console.error('Failed to cache projects:', error);
    }
  };

  const getCachedProjects = async (): Promise<Project[]> => {
    try {
      const db = await openProjectsDB();
      const transaction = db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as Project[]);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get cached projects:', error);
      return [];
    }
  };

  const openProjectsDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GreenTechProjects', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('projectUpdates')) {
          const updatesStore = db.createObjectStore('projectUpdates', { keyPath: 'id' });
          updatesStore.createIndex('projectId', 'projectId', { unique: false });
          updatesStore.createIndex('synced', 'synced', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('milestoneUpdates')) {
          const milestonesStore = db.createObjectStore('milestoneUpdates', { keyPath: 'id' });
          milestonesStore.createIndex('projectId', 'projectId', { unique: false });
          milestonesStore.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  };

  const addProjectUpdate = useCallback(async (
    projectId: string,
    title: string,
    content: string,
    images?: string[]
  ) => {
    const update: ProjectUpdate = {
      id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      title,
      content,
      images: images || [],
      timestamp: Date.now(),
      synced: false
    };

    try {
      // Store update locally
      const db = await openProjectsDB();
      const transaction = db.transaction(['projectUpdates'], 'readwrite');
      const store = transaction.objectStore('projectUpdates');
      await store.add(update);

      console.log('[useOfflineProjects] Project update added locally:', update.id);

      // If online, try to sync immediately
      if (isOnline()) {
        try {
          await syncProjectUpdate(update);
        } catch (syncError) {
          console.log('[useOfflineProjects] Immediate sync failed, will retry later:', syncError);
        }
      } else {
        // Add to offline actions queue
        await offlineStorage.addOfflineAction({
          type: 'project_update',
          data: update,
          endpoint: `/api/projects/${projectId}/updates`
        });
      }

      await updatePendingCount();
    } catch (error) {
      console.error('Failed to add project update:', error);
      throw new Error('Failed to add project update');
    }
  }, []);

  const updateMilestone = useCallback(async (
    projectId: string,
    milestoneTitle: string,
    completed: boolean,
    notes?: string
  ) => {
    const milestoneUpdate: MilestoneUpdate = {
      id: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      milestoneTitle,
      completed,
      notes,
      timestamp: Date.now(),
      synced: false
    };

    try {
      // Store milestone update locally
      const db = await openProjectsDB();
      const transaction = db.transaction(['milestoneUpdates'], 'readwrite');
      const store = transaction.objectStore('milestoneUpdates');
      await store.add(milestoneUpdate);

      // Update local project data
      setProjects(prevProjects => 
        prevProjects.map(project => {
          if (project.id === projectId) {
            const updatedMilestones = project.milestones.map(milestone => {
              if (milestone.title === milestoneTitle) {
                return { ...milestone, done: completed };
              }
              return milestone;
            });
            return { ...project, milestones: updatedMilestones };
          }
          return project;
        })
      );

      console.log('[useOfflineProjects] Milestone update added locally:', milestoneUpdate.id);

      // If online, try to sync immediately
      if (isOnline()) {
        try {
          await syncMilestoneUpdate(milestoneUpdate);
        } catch (syncError) {
          console.log('[useOfflineProjects] Immediate milestone sync failed, will retry later:', syncError);
        }
      } else {
        // Add to offline actions queue
        await offlineStorage.addOfflineAction({
          type: 'project_update',
          data: milestoneUpdate,
          endpoint: `/api/projects/${projectId}/milestones`
        });
      }

      await updatePendingCount();
    } catch (error) {
      console.error('Failed to update milestone:', error);
      throw new Error('Failed to update milestone');
    }
  }, []);

  const syncProjectUpdate = async (update: ProjectUpdate): Promise<void> => {
    // In a real app, this would make an API call
    // For demo purposes, we'll simulate the sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mark as synced
    const db = await openProjectsDB();
    const transaction = db.transaction(['projectUpdates'], 'readwrite');
    const store = transaction.objectStore('projectUpdates');
    
    const syncedUpdate = { ...update, synced: true };
    await store.put(syncedUpdate);
    
    console.log('[useOfflineProjects] Project update synced:', update.id);
  };

  const syncMilestoneUpdate = async (update: MilestoneUpdate): Promise<void> => {
    // In a real app, this would make an API call
    // For demo purposes, we'll simulate the sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mark as synced
    const db = await openProjectsDB();
    const transaction = db.transaction(['milestoneUpdates'], 'readwrite');
    const store = transaction.objectStore('milestoneUpdates');
    
    const syncedUpdate = { ...update, synced: true };
    await store.put(syncedUpdate);
    
    console.log('[useOfflineProjects] Milestone update synced:', update.id);
  };

  const syncPendingUpdates = useCallback(async () => {
    if (!isOnline()) {
      console.log('[useOfflineProjects] Cannot sync while offline');
      return;
    }

    try {
      const db = await openProjectsDB();
      
      // Sync project updates
      const projectUpdatesTransaction = db.transaction(['projectUpdates'], 'readonly');
      const projectUpdatesStore = projectUpdatesTransaction.objectStore('projectUpdates');
      const unsyncedProjectUpdates = await new Promise<ProjectUpdate[]>((resolve, reject) => {
        const request = projectUpdatesStore.index('synced').getAll(false);
        request.onsuccess = () => resolve(request.result as ProjectUpdate[]);
        request.onerror = () => reject(request.error);
      });

      for (const update of unsyncedProjectUpdates) {
        try {
          await syncProjectUpdate(update);
        } catch (error) {
          console.error('Failed to sync project update:', update.id, error);
        }
      }

      // Sync milestone updates
      const milestoneUpdatesTransaction = db.transaction(['milestoneUpdates'], 'readonly');
      const milestoneUpdatesStore = milestoneUpdatesTransaction.objectStore('milestoneUpdates');
      const unsyncedMilestoneUpdates = await new Promise<MilestoneUpdate[]>((resolve, reject) => {
        const request = milestoneUpdatesStore.index('synced').getAll(false);
        request.onsuccess = () => resolve(request.result as MilestoneUpdate[]);
        request.onerror = () => reject(request.error);
      });

      for (const update of unsyncedMilestoneUpdates) {
        try {
          await syncMilestoneUpdate(update);
        } catch (error) {
          console.error('Failed to sync milestone update:', update.id, error);
        }
      }

      await updatePendingCount();
      console.log('[useOfflineProjects] Sync completed');
    } catch (error) {
      console.error('Failed to sync pending updates:', error);
    }
  }, []);

  const getProjectUpdates = useCallback(async (projectId: string): Promise<ProjectUpdate[]> => {
    try {
      const db = await openProjectsDB();
      const transaction = db.transaction(['projectUpdates'], 'readonly');
      const store = transaction.objectStore('projectUpdates');
      
      return new Promise((resolve, reject) => {
        const request = store.index('projectId').getAll(projectId);
        request.onsuccess = () => {
          const updates = request.result as ProjectUpdate[];
          // Sort by timestamp, newest first
          updates.sort((a, b) => b.timestamp - a.timestamp);
          resolve(updates);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get project updates:', error);
      return [];
    }
  }, []);

  const updatePendingCount = async () => {
    try {
      const db = await openProjectsDB();
      
      // Count unsynced project updates
      const projectUpdatesTransaction = db.transaction(['projectUpdates'], 'readonly');
      const projectUpdatesStore = projectUpdatesTransaction.objectStore('projectUpdates');
      const projectUpdatesCount = await new Promise<number>((resolve, reject) => {
        const request = projectUpdatesStore.index('synced').count(false);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // Count unsynced milestone updates
      const milestoneUpdatesTransaction = db.transaction(['milestoneUpdates'], 'readonly');
      const milestoneUpdatesStore = milestoneUpdatesTransaction.objectStore('milestoneUpdates');
      const milestoneUpdatesCount = await new Promise<number>((resolve, reject) => {
        const request = milestoneUpdatesStore.index('synced').count(false);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      setPendingUpdates(projectUpdatesCount + milestoneUpdatesCount);
    } catch (error) {
      console.error('Failed to update pending count:', error);
    }
  };

  const refreshProjects = useCallback(async () => {
    if (!isOnline()) {
      console.log('[useOfflineProjects] Cannot refresh projects while offline');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await loadFreshProjects();
    } catch (err) {
      console.error('Failed to refresh projects:', err);
      setError('Failed to refresh projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    projects,
    isLoading,
    isOffline,
    error,
    pendingUpdates,
    addProjectUpdate,
    updateMilestone,
    syncPendingUpdates,
    getProjectUpdates,
    refreshProjects
  };
};