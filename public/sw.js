const CACHE = 'revelo-v2.3';

const STATIC = [
  '/js/chroma.min.js',
  '/js/sampler-core.js',
];

// Installation : mise en cache des assets statiques
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .catch(() => {}) // échec silencieux — le SW s'installe quand même
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Ignorer les requêtes non-GET et les extensions navigateur
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  const url = new URL(e.request.url);

  // API couleurs : network first, fallback cache
  if (url.pathname === '/api/couleurs/all') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Pages HTML dynamiques : network only (back-office + pages publiques avec données fraîches)
  if (!url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$/)) {
    return; // laisse le navigateur faire la requête normalement
  }

  // Assets statiques : cache first, fallback network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
