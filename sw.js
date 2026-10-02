// PropManager service worker with offline app-shell support.

const CACHE_NAME = 'propmanager-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];
const APP_SHELL_URL = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith('propmanager-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === 'navigate'
    || request.destination === 'document'
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('/index.html');

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok && response.type !== 'opaque') {
            const cacheWrite = caches.open(CACHE_NAME)
              .then(cache => cache.put(APP_SHELL_URL, response.clone()));
            event.waitUntil(cacheWrite);
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(APP_SHELL_URL);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request)
          .then(response => {
            if (response.ok && response.type !== 'opaque') {
              const cacheWrite = caches.open(CACHE_NAME)
                .then(cache => cache.put(request, response.clone()));
              event.waitUntil(cacheWrite);
            }
            return response;
          });
      })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
