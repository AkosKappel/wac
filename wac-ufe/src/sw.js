// Service worker: the app keeps working offline with what it has seen, and stays current online.
// Pages, API answers and files come from the network first and fall back to the cache, so the
// demo never shows stale data while online and a deploy is picked up at once. Stencil's chunks
// (build/p-<hash>.js) never change under the same URL, so they come from the cache. Google Fonts
// are left to the browser's HTTP cache: the Content-Security-Policy (connect-src 'self') also
// applies to this worker, and it stays strict.
const CACHE = 'ambulance-v1';
const SHELL = [
  '/',
  '/build/ambulance-ufe.esm.js',
  '/manifest.webmanifest',
  '/assets/favicon.svg',
  '/assets/icon-192.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = (await cache.match(request)) || (fallbackUrl && (await cache.match(fallbackUrl)));
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  // the health check and the Swagger page are for monitors and developers, always live
  if (url.pathname === '/api/health' || url.pathname.startsWith('/api-docs')) return;
  if (/\/build\/p-[\w-]+\.(js|css)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else {
    // an app route offline gets the cached shell, which routes in the browser
    event.respondWith(networkFirst(request, request.mode === 'navigate' ? '/' : undefined));
  }
});
