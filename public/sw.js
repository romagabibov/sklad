const CACHE_NAME = 'anbar-store-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force the new service worker to activate immediately
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key); // clear old caches
        }
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Network first, fallback to cache (or offline page)
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
