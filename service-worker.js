const CACHE_NAME = 'gearpc-conecta-offline-v24-3';
const PROFILE_CACHE = 'gearpc-conecta-profile-v24-3';
const SUPABASE_LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
const SUPABASE_HOST = 'wewbwrdqubypuwuyvwmv.supabase.co';

const APP_SHELL = [
  './',
  './index.html',
  './offline.html',
  './styles.css?v=23.0',
  './ideas-data.js?v=23.0',
  './app.js?v=23.0',
  './programacao.js?v=23.0',
  './offline-bootstrap-v24.js',
  './offline-access-marker-v24.js',
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
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    try { await cache.add(SUPABASE_LIB); } catch (_) {}
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([CACHE_NAME, PROFILE_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith('gearpc-conecta-') && !keep.has(key))
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function withRuntimeModules(response) {
  if (!response) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  let html = await response.text();
  const supabaseTag = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>';
  const programmingTag = '<script src="programacao.js?v=23.0"></script>';

  if (!html.includes('offline-bootstrap-v24.js')) {
    html = html.replace(supabaseTag, `${supabaseTag}\n  <script src="offline-bootstrap-v24.js"></script>`);
  }
  if (!html.includes('programming-permissions-v24.js')) {
    html = html.replace(programmingTag, `<script src="programming-permissions-v24.js"></script>\n  ${programmingTag}`);
  }
  if (!html.includes('offline-access-marker-v24.js')) {
    html = html.replace('</body>', '  <script src="offline-access-marker-v24.js"></script>\n</body>');
  }
  if (!html.includes('attendance-offline-v24.js')) {
    html = html.replace('</body>', '  <script src="attendance-offline-v24.js"></script>\n</body>');
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cachedSupabaseLibrary(request) {
  const cached = await caches.match(request) || await caches.match(SUPABASE_LIB);
  if (cached) {
    fetch(request).then(async (response) => {
      if (response?.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
    }).catch(() => {});
    return cached;
  }

  const response = await fetch(request);
  if (response?.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.origin === 'https://cdn.jsdelivr.net' && url.pathname.includes('/@supabase/supabase-js@2')) {
    event.respondWith(cachedSupabaseLibrary(request));
    return;
  }

  if (url.hostname === SUPABASE_HOST && url.pathname === '/rest/v1/perfis_usuarios') {
    event.respondWith(networkFirst(request, PROFILE_CACHE));
    return;
  }

  if (url.origin !== self.location.origin) return;

  const isDocument = request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  if (isDocument) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response?.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return await withRuntimeModules(response);
      } catch (_) {
        // Sem internet, abre diretamente a tela local de Presença.
        // Ela não depende do Supabase para iniciar e grava as marcações
        // na mesma fila usada pelo módulo de sincronização do app normal.
        return await caches.match('./offline.html') || await caches.match('./index.html');
      }
    })());
    return;
  }

  event.respondWith(networkFirst(request, CACHE_NAME));
});
