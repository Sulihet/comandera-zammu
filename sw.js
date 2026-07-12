/* Service worker: estrategia "primero la red" para que las actualizaciones
   lleguen solas cuando hay wifi; el caché es solo respaldo sin conexión. */
const CACHE = 'zw-comandera-v14';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/menu-data.js',
  './js/store.js',
  './js/app.js',
  './manifest.webmanifest',
  './icon.png',
  './perro.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // recursos externos: sin tocar

  // PRIMERO LA RED: trae siempre lo último; si no hay internet, usa el caché.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html')))
  );
});
