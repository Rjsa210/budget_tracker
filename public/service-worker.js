const FILES_TO_CACHE = [
  '/',
  'index.html',
  'styles.css',
  'index.js',
  'db.js',
  'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

const STATIC_CACHE = 'static-cache-v2';
const RUNTIME_CACHE = 'runtime-cache';

self.addEventListener("install", event => {
  console.log('installing service worker');
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  console.log('beginning activation');
  event.waitUntil(
    caches
    .keys()
    .then(cacheNames => {
      return cacheNames.filter(
        cacheName => !currentCaches.includes(cacheName)
      );
    }) 
    .then(cachesToDelete => {
      return Promise.all(
        cachesToDelete.map(cacheToDelete => {
          console.log('deleting', cacheToDelete);
          return caches.delete(cacheToDelete);
        })
      );
    })
    .then(() => self.clients.claim())
  );
});


self.addEventListener('fetch', (event) => {
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return caches.open(RUNTIME_CACHE).then((cache) => {
          return fetch(event.request).then((response) => {
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  }
});