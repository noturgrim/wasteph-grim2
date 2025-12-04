// Service Worker for Universal Caching
// Works with any hosting provider (Appwrite, Netlify, Vercel, etc.)

const CACHE_VERSION = "v1";
const CACHE_NAME = `wasteph-cache-${CACHE_VERSION}`;

// Assets to cache immediately on install
const PRECACHE_ASSETS = ["/", "/index.html"];

// Cache strategies by file type
const CACHE_STRATEGIES = {
  images: {
    cacheName: `${CACHE_NAME}-images`,
    maxAge: 365 * 24 * 60 * 60, // 1 year
    maxEntries: 100,
  },
  assets: {
    cacheName: `${CACHE_NAME}-assets`,
    maxAge: 365 * 24 * 60 * 60, // 1 year
    maxEntries: 100,
  },
  api: {
    cacheName: `${CACHE_NAME}-api`,
    maxAge: 5 * 60, // 5 minutes
    maxEntries: 50,
  },
};

// Install event - cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(
            (name) => name.startsWith("wasteph-cache-") && name !== CACHE_NAME
          )
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Determine caching strategy based on file type
  let strategy = null;

  if (/\.(png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname)) {
    strategy = CACHE_STRATEGIES.images;
  } else if (/\.(js|css|woff|woff2|ttf)$/i.test(url.pathname)) {
    strategy = CACHE_STRATEGIES.assets;
  }

  if (strategy) {
    event.respondWith(cacheFirst(request, strategy));
  } else {
    event.respondWith(networkFirst(request));
  }
});

// Cache First Strategy (for images, fonts, static assets)
async function cacheFirst(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // Return cached version, update in background
    fetchAndCache(request, strategy);
    return cached;
  }

  // Not in cache, fetch from network
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error("Fetch failed:", error);
    throw error;
  }
}

// Network First Strategy (for HTML, API calls)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Background fetch and cache update
async function fetchAndCache(request, strategy) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(strategy.cacheName);
      cache.put(request, response.clone());
    }
  } catch (error) {
    // Silent fail for background updates
  }
}
