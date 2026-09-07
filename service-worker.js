const CACHE_NAME = 'gearpc-conecta-offline-v24-1';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=23.0',
  './ideas-data.js?v=23.0',
  './app.js?v=23.0',
  './programacao.js?v=23.0',
  './attendance-offline-v24.js',
  './programming-permissions-v24.js',
  './config.js',
  './logo-grupo.jpeg',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

async function withRuntimeModules(response) {
  if (!response) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  let html = await response.text();
  const programmingTag = '<script src="programacao.js?v=23.0"></script>';
  if (!html.includes('programming-permissions-v24.js')) {
    html = html.replace(programmingTag, '<script src="programming-permissions-v24.js"></script>\n  ' + programmingTag);
  }
  if (!html.includes('attendance-offline-v24.js')) {
    html = html.replace('</body>', '  <script src="attendance-offline-v24.js"></script>\n</body>');
  }
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isDocument = request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  if (isDocument) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response?.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return await withRuntimeModules(response);
      } catch (_) {
        const cached = await caches.match(request) || await caches.match('./index.html');
        return await withRuntimeModules(cached);
      }
    })());
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
