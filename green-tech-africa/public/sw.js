// Service Worker for Green Tech Africa PWA
// Provides offline caching for essential property and project data

const CACHE_NAME = 'green-tech-africa-v1';
const STATIC_CACHE_NAME = 'green-tech-africa-static-v1';
const DATA_CACHE_NAME = 'green-tech-africa-data-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/src/App.css',
  // Essential pages
  '/properties',
  '/plans',
  '/projects',
  '/account/dashboard',
  // Assets
  '/src/assets/hero-construction.jpg',
  '/src/assets/project-commercial.jpg',
  '/src/assets/property-luxury.jpg',
  '/src/assets/team-construction.jpg'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/properties',
  '/api/construction/features',
  '/api/ghana/regions',
  '/api/projects',
  '/api/user/profile'
];

// Ghana-specific data to cache
const GHANA_DATA_KEYS = [
  'ghana-regions',
  'ghana-properties',
  'eco-features',
  'construction-options'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache Ghana-specific data
      caches.open(DATA_CACHE_NAME).then((cache) => {
        console.log('[SW] Preparing data cache');
        return Promise.resolve();
      })
    ])
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DATA_CACHE_NAME &&
              cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static assets and pages
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with cache-first strategy for essential data
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(DATA_CACHE_NAME);
  
  // For essential Ghana data, try cache first
  if (isEssentialGhanaData(url.pathname)) {
    try {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log('[SW] Serving cached API data:', url.pathname);
        
        // Update cache in background if online
        if (navigator.onLine) {
          updateCacheInBackground(request, cache);
        }
        
        return cachedResponse;
      }
    } catch (error) {
      console.log('[SW] Cache lookup failed:', error);
    }
  }
  
  // Try network first for fresh data
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      if (isEssentialGhanaData(url.pathname) || request.method === 'GET') {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
    
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Network failed, serving cached data:', url.pathname);
      return cachedResponse;
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed:', error);
    
    // Return cached response if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving cached data (offline):', url.pathname);
      return cachedResponse;
    }
    
    // Return offline fallback
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This data is not available offline',
        cached: false 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving cached static asset:', request.url);
      return cachedResponse;
    }
    
    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Static request failed:', error);
    
    // For navigation requests, return cached index.html
    if (request.mode === 'navigate') {
      const cachedIndex = await cache.match('/index.html');
      if (cachedIndex) {
        return cachedIndex;
      }
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Check if the API endpoint contains essential Ghana data
function isEssentialGhanaData(pathname) {
  const essentialPaths = [
    '/api/properties',
    '/api/construction/features',
    '/api/ghana/regions',
    '/api/projects'
  ];
  
  return essentialPaths.some(path => pathname.startsWith(path));
}

// Update cache in background
async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      console.log('[SW] Background cache update completed:', request.url);
    }
  } catch (error) {
    console.log('[SW] Background cache update failed:', error);
  }
}

// Handle sync events for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions when connection is restored
async function syncOfflineActions() {
  try {
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await processOfflineAction(action);
        await removeOfflineAction(action.id);
        console.log('[SW] Synced offline action:', action.type);
      } catch (error) {
        console.log('[SW] Failed to sync action:', action.type, error);
      }
    }
  } catch (error) {
    console.log('[SW] Sync process failed:', error);
  }
}

// Get offline actions from IndexedDB
async function getOfflineActions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GreenTechOffline', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const getAll = store.getAll();
      
      getAll.onsuccess = () => resolve(getAll.result || []);
      getAll.onerror = () => reject(getAll.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('actions')) {
        db.createObjectStore('actions', { keyPath: 'id' });
      }
    };
  });
}

// Process individual offline action
async function processOfflineAction(action) {
  const { type, data, endpoint } = action;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
  
  return response.json();
}

// Remove synced offline action
async function removeOfflineAction(actionId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GreenTechOffline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const deleteRequest = store.delete(actionId);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CACHE_GHANA_DATA':
      cacheGhanaData(data);
      break;
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
    case 'CLEAR_CACHE':
      clearCache().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
  }
});

// Cache Ghana-specific data
async function cacheGhanaData(data) {
  const cache = await caches.open(DATA_CACHE_NAME);
  
  for (const [key, value] of Object.entries(data)) {
    const response = new Response(JSON.stringify(value), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(`/offline-data/${key}`, response);
  }
  
  console.log('[SW] Ghana data cached successfully');
}

// Get cache status
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
}

// Clear all caches
async function clearCache() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}