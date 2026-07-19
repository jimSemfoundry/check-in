const CACHE = 'soft-habit-v3';
const PRECACHE_URLS = ['/', '/today', '/game'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isCacheableResponse(request, url, response) {
  if (!response || !response.ok) return false;
  const contentType = response.headers.get('content-type') || '';
  if (url.pathname.endsWith('.js') || request.destination === 'script' || request.destination === 'worker')
    return contentType.includes('javascript') || contentType.includes('ecmascript');
  if (url.pathname.endsWith('.css') || request.destination === 'style') return contentType.includes('text/css');
  return true;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (url.pathname.startsWith('/assets/')) return response;
        if (!isCacheableResponse(event.request, url, response)) return response;
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((match) => {
          if (match && isCacheableResponse(event.request, url, match)) return match;
          if (event.request.mode === 'navigate') return caches.match('/');
          return new Response('Asset unavailable', {
            status: 504,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
          });
        }),
      ),
  );
});
