const CACHE_NAME = 'resolvenow-v2.1-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/logo_192.png',
  '/logo_512.png',
  '/offline.html'
];

// Install Event — Pre-cache critical core shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event — Clean up stale previous caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event — Stale-While-Revalidate for app shell & Cache-First for static fonts/images
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 1. Bypass backend API and realtime sockets
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io') || url.hostname.includes('supabase.co')) {
    return;
  }

  // 2. Cache-First for Google Fonts and static media
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com') || url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff2?)$/i)) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          }
          return networkResponse;
        }).catch(() => caches.match('/favicon.svg'));
      })
    );
    return;
  }

  // 3. Stale-While-Revalidate for local app assets
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        const fetchPromise = fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
            }
            return networkResponse;
          })
          .catch(() => {
            if (e.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
