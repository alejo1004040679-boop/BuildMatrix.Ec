const CACHE_NAME = 'pwa-cache-v1';

const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap'
];

// Instalación: Cache-First con Promise.allSettled para tolerancia a fallos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        ASSETS.map(url =>
          cache.add(url).catch(err => console.warn(`No se pudo cachear: ${url}`, err))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// Activación: elimina cachés antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Cache-First, solo GET, actualiza caché en segundo plano si respuesta 200
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => null);

      return cached || networkFetch;
    })
  );
});
