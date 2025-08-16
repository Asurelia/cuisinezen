/**
 * CuisineZen Service Worker
 * Provides offline functionality, caching strategies, and push notifications
 */

const CACHE_NAME = 'cuisinezen-v1.0.0';
const API_CACHE = 'cuisinezen-api-v1.0.0';
const IMAGE_CACHE = 'cuisinezen-images-v1.0.0';

// Files to cache immediately when SW is installed
const STATIC_CACHE_URLS = [
  '/',
  '/inventory',
  '/recipes',
  '/menu',
  '/analytics',
  '/account',
  '/offline',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/inventory/,
  /^\/api\/recipes/,
  /^\/api\/analytics/,
  /^\/api\/menu/
];

// Image patterns to cache
const IMAGE_CACHE_PATTERNS = [
  /\.(jpg|jpeg|png|webp|svg|ico)$/i,
  /\/images\//,
  /\/photos\//,
  /storage\.googleapis\.com/
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

/**
 * Activate event - cleanup old caches
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== API_CACHE && name !== IMAGE_CACHE)
            .map((name) => {
              console.log('Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
  } else if (isApiRequest(url)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else if (isNavigationRequest(request)) {
    event.respondWith(navigationStrategy(request));
  }
});

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    image: data.image,
    tag: data.tag || 'cuisinezen-notification',
    data: data.data,
    actions: data.actions || [
      {
        action: 'open',
        title: 'Ouvrir',
        icon: '/icons/icon-open.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorer',
        icon: '/icons/icon-close.png'
      }
    ],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const { action, data } = event;
  
  if (action === 'dismiss') {
    return;
  }

  // Handle notification actions
  const urlToOpen = getNotificationUrl(action, data);
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Check if there's already a window open
        for (const client of clients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Background sync event for offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'inventory-sync') {
    event.waitUntil(syncInventoryData());
  } else if (event.tag === 'recipe-sync') {
    event.waitUntil(syncRecipeData());
  } else if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalyticsData());
  }
});

// Caching Strategies

/**
 * Cache First Strategy - Good for static assets that don't change often
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update cache in background
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return getOfflineFallback(request);
  }
}

/**
 * Network First Strategy - Good for API calls that need fresh data
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (networkError) {
      console.log('Network failed, trying cache:', networkError);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        // Add offline indicator to response
        return addOfflineHeader(cachedResponse);
      }
      
      throw networkError;
    }
    
  } catch (error) {
    console.error('Network first strategy failed:', error);
    return getOfflineFallback(request);
  }
}

/**
 * Navigation Strategy - Handle page navigation with offline support
 */
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('Navigation failed, serving offline page:', error);
    
    const cache = await caches.open(CACHE_NAME);
    const offlinePage = await cache.match('/offline');
    
    if (offlinePage) {
      return offlinePage;
    }
    
    // Fallback offline page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CuisineZen - Hors ligne</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; text-align: center; padding: 50px; }
            .offline-icon { font-size: 64px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="offline-icon">📱</div>
          <h1>Vous êtes hors ligne</h1>
          <p>Veuillez vérifier votre connexion internet et réessayer.</p>
          <button onclick="window.location.reload()">Réessayer</button>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Helper Functions

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/') || 
         url.pathname.includes('.js') ||
         url.pathname.includes('.css') ||
         url.pathname === '/manifest.json' ||
         url.pathname === '/favicon.ico';
}

function isApiRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isImageRequest(url) {
  return IMAGE_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function getNotificationUrl(action, data) {
  if (data && data.url) {
    return data.url;
  }
  
  switch (action) {
    case 'inventory':
      return '/inventory';
    case 'recipes':
      return '/recipes';
    case 'analytics':
      return '/analytics';
    default:
      return '/';
  }
}

async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response);
    }
  } catch (error) {
    console.log('Background cache update failed:', error);
  }
}

function addOfflineHeader(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Served-From', 'cache');
  newHeaders.set('X-Offline', 'true');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

function getOfflineFallback(request) {
  if (request.destination === 'image') {
    // Return placeholder image for failed image requests
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#999">Image indisponible</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  
  return new Response('Contenu indisponible hors ligne', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Background Sync Functions

async function syncInventoryData() {
  try {
    console.log('Syncing inventory data...');
    
    // Get pending inventory updates from IndexedDB
    const pendingUpdates = await getPendingUpdates('inventory');
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/api/inventory/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
        
        if (response.ok) {
          await removePendingUpdate('inventory', update.id);
        }
      } catch (error) {
        console.error('Failed to sync inventory update:', error);
      }
    }
    
    console.log('Inventory sync completed');
  } catch (error) {
    console.error('Inventory sync failed:', error);
    throw error;
  }
}

async function syncRecipeData() {
  try {
    console.log('Syncing recipe data...');
    
    const pendingUpdates = await getPendingUpdates('recipes');
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/api/recipes/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
        
        if (response.ok) {
          await removePendingUpdate('recipes', update.id);
        }
      } catch (error) {
        console.error('Failed to sync recipe update:', error);
      }
    }
    
    console.log('Recipe sync completed');
  } catch (error) {
    console.error('Recipe sync failed:', error);
    throw error;
  }
}

async function syncAnalyticsData() {
  try {
    console.log('Syncing analytics data...');
    
    const pendingEvents = await getPendingUpdates('analytics');
    
    for (const event of pendingEvents) {
      try {
        const response = await fetch('/api/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
        
        if (response.ok) {
          await removePendingUpdate('analytics', event.id);
        }
      } catch (error) {
        console.error('Failed to sync analytics event:', error);
      }
    }
    
    console.log('Analytics sync completed');
  } catch (error) {
    console.error('Analytics sync failed:', error);
    throw error;
  }
}

// IndexedDB helpers for offline data management
async function getPendingUpdates(type) {
  // This would integrate with the offline manager service
  return [];
}

async function removePendingUpdate(type, id) {
  // This would integrate with the offline manager service
  console.log(`Removing pending ${type} update:`, id);
}