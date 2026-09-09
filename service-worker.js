const CACHE_NAME = 'gearpc-conecta-offline-v28-2';
const PROFILE_CACHE = 'gearpc-conecta-profile-v28-2';
const SUPABASE_LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
const SUPABASE_HOST = 'wewbwrdqubypuwuyvwmv.supabase.co';

const CRITICAL_OFFLINE = [
  './offline.html',
  './launcher-v24.html',
  './manifest.webmanifest'
];

const APP_SHELL = [
  './',
  './index.html',
  './launcher-v24.html',
  './offline.html',
  './styles.css?v=23.0',
  './ideas-data.js?v=23.0',
  './app.js?v=23.0',
  './programacao.js?v=23.0',
  './offline-bootstrap-v24.js',
  './offline-access-marker-v24.js',
  './attendance-offline-v24.js',
  './programming-permissions-v24.js',
  './programming-ai-fixes-v27-1.js',
  './programming-review-v28.js',
  './programming-deadline-v28-1.js',
  './programming-release-v28-2.js',
  './first-access-v25.js',
  './mandatory-password-v26.js',
  './admin-activity-v27.js',
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
    await cache.addAll(CRITICAL_OFFLINE);
    await Promise.allSettled(APP_SHELL.map((asset) => cache.add(asset)));
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
    html = html.replace(programmingTag, `<script src="programming-permissions-v24.js"></script>\n  ${programmingTag}\n  <script src="programming-ai-fixes-v27-1.js"></script>`);
  } else if (!html.includes('programming-ai-fixes-v27-1.js')) {
    html = html.replace(programmingTag, `${programmingTag}\n  <script src="programming-ai-fixes-v27-1.js"></script>`);
  }
  if (!html.includes('offline-access-marker-v24.js')) {
    html = html.replace('</body>', '  <script src="offline-access-marker-v24.js"></script>\n</body>');
  }
  if (!html.includes('attendance-offline-v24.js')) {
    html = html.replace('</body>', '  <script src="attendance-offline-v24.js"></script>\n</body>');
  }
  if (!html.includes('first-access-v25.js')) {
    html = html.replace('</body>', '  <script src="first-access-v25.js"></script>\n</body>');
  }
  if (!html.includes('mandatory-password-v26.js')) {
    html = html.replace('</body>', '  <script src="mandatory-password-v26.js"></script>\n</body>');
  }
  if (!html.includes('admin-activity-v27.js')) {
    html = html.replace('</body>', '  <script src="admin-activity-v27.js"></script>\n</body>');
  }
  if (!html.includes('programming-review-v28.js')) {
    html = html.replace('</body>', '  <script src="programming-review-v28.js"></script>\n</body>');
  }
  if (!html.includes('programming-deadline-v28-1.js')) {
    html = html.replace('</body>', '  <script src="programming-deadline-v28-1.js"></script>\n</body>');
  }
  if (!html.includes('programming-release-v28-2.js')) {
    html = html.replace('</body>', '  <script src="programming-release-v28-2.js"></script>\n</body>');
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

  const isDocument = request.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/launcher-v24.html') ||
    url.pathname.endsWith('/offline.html');

  if (isDocument) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response?.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }

        if (url.pathname.endsWith('/launcher-v24.html') || url.pathname.endsWith('/offline.html')) {
          return response;
        }
        return await withRuntimeModules(response);
      } catch (_) {
        const offline = await caches.match('./offline.html');
        if (offline) return offline;

        const launcher = await caches.match('./launcher-v24.html');
        if (launcher) return launcher;

        const index = await caches.match('./index.html');
        if (index) return index;

        return new Response(
          '<!doctype html><meta charset="utf-8"><title>GEArPC Conecta</title><h1>GEArPC Conecta</h1><p>Sem internet e o modo offline ainda não foi preparado neste aparelho.</p>',
          { headers: { 'content-type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  event.respondWith(networkFirst(request, CACHE_NAME));
});
