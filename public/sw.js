const CACHE_NAME = 'booksurfer-cache-v1';

const PRECACHE_ASSETS = [
  '/',
  '/favicon.png',
  '/manifest.json'
];

// URLs to use a chunked, network-first strategy (HTML, Next.js page data)
const NETWORK_FIRST_ROUTES = [
  '/_next/data/',
  '/api/'
];

// URLs to aggressively cache (covers, images, external texts)
const CACHE_FIRST_ROUTES = [
  'covers.openlibrary.org',
  'api-inference.huggingface.co',
  'gutenberg.org/cache/epub'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for non-GET requests or chrome extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  const isCacheFirst = CACHE_FIRST_ROUTES.some((route) => url.href.includes(route));
  const acceptHeader = request.headers.get('accept') || '';
  const isHtmlNavigation =
    request.mode === 'navigate' ||
    url.pathname === '/' ||
    acceptHeader.includes('text/html');

  // HTML navigations should be network-first to avoid serving stale/broken cached HTML.
  const isNetworkFirst =
    isHtmlNavigation ||
    NETWORK_FIRST_ROUTES.some((route) => url.href.includes(route));

  if (isCacheFirst) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
  } else if (isNetworkFirst) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cache on network failure
          return caches.match(request);
        })
    );
  } else {
    // Default Stale-While-Revalidate
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
