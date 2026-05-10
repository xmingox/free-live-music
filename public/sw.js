// Free Live Music — Service Worker
// Note: icon-192.png and icon-512.png need to be created before PWA install prompts will show icons.

const CACHE_NAME = 'flm-v1';
const CURRENT_CACHES = ['flm-v1'];

const SHELL_URLS = [
  '/',
  '/concerts/new-york',
  '/concerts/los-angeles',
  '/concerts/chicago',
  '/manifest.json',
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API routes: network-only, never cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets: cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
          return response;
        });
      })
    );
    return;
  }

  // Navigation requests (HTML pages): network-first, fall back to cache, then /
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached || caches.match('/')
          )
        )
    );
    return;
  }

  // Everything else: network-first with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
