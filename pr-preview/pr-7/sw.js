// Offline support: network first so new builds show up right away,
// falling back to the cache when there is no connection.
const CACHE = 'lod-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // PR previews live below the main game; leave them to the network.
  if (url.pathname.includes('/pr-preview/') && !self.registration.scope.includes('/pr-preview/')) return;
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cache.match(req, { ignoreSearch: true }).then((hit) => hit || Response.error())),
    ),
  );
});
