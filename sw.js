const CACHE_NAME = 'ec-appraisal-portal-v13';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/photo-guide.png',
  '/es.js?v=2',
  '/app.js?v=12',
  '/app.css?v=7'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('script.google.com')) {
    return;
  }

  // Pages: always try the network first so a new version shows right away; the cache is only for offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((r) => { const c = r.clone(); caches.open(CACHE_NAME).then((cache) => cache.put('/', c)); return r; }).catch(() => caches.match('/')));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
