// ═══════════════════════════════════════════════
// PropManager Service Worker v2
// Network-first for HTML (updates reach users instantly)
// Cache-first for assets (icons, manifest — stable files)
// ═══════════════════════════════════════════════

const CACHE_NAME = 'propmanager-v2';
const ASSETS     = ['./manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];

// ── Install: pre-cache static assets only (not HTML) ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch strategy ──
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document'
              || url.pathname.endsWith('.html')
              || url.pathname.endsWith('/');

  if (isHTML) {
    // ── NETWORK FIRST for HTML ──
    // Always try to fetch the latest version from Netlify
    // Fall back to cache only when offline
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, toCache));
          return response;
        })
        .catch(() =>
          caches.match(e.request)
            .then(cached => cached || caches.match('./index.html'))
        )
    );
  } else {
    // ── CACHE FIRST for assets (icons, manifest) ──
    // These rarely change — serve instantly from cache
    e.respondWith(
      caches.match(e.request)
        .then(cached => {
          if (cached) return cached;
          return fetch(e.request)
            .then(response => {
              if (!response || response.status !== 200 || response.type === 'opaque') return response;
              const toCache = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(e.request, toCache));
              return response;
            })
            .catch(() => caches.match('./index.html'));
        })
    );
  }
});

// ── Message handler ──
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
