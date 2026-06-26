// ── Service Worker — RastreaSPDA ──────────────────────────────────────────
const CACHE_NAME = 'rastrea-spda-v1';

// Assets estáticos para cache offline
const STATIC_ASSETS = [
  './',
  './index.html',
  './clientes.html',
  './areas.html',
  './tipos-ponto.html',
  './pontos.html',
  './ponto-detalhe.html',
  './inspecao.html',
  './scan.html',
  './nao-conformidade.html',
  './configuracoes.html',
  './css/style.css',
  './js/utils.js',
  './js/db.js',
  './js/dsp.js',
  './js/dashboard.js',
  './js/clientes.js',
  './js/areas.js',
  './js/tipos-ponto.js',
  './js/pontos.js',
  './js/ponto-detalhe.js',
  './js/inspecoes.js',
  './js/scan.js',
  './js/nao-conformidade.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json'
];

// ── Install: pré-carrega assets estáticos ─────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Tenta cachear cada asset individualmente para não falhar no todo
      return Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

// ── Activate: remove caches antigos ───────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first para Firestore, cache-first para estáticos ────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Deixa passar: Firebase, CDNs externos
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('jsdelivr.net') ||
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('cdnjs.cloudflare.com')
  ) {
    return; // sem interceptar — vai direto pra rede
  }

  // Cache-first para assets locais
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          // Clona e armazena no cache apenas respostas válidas
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Fallback para index.html quando offline
          if (request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
