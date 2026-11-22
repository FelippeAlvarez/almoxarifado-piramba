// Almoxarifado da Piramba — service worker (funcionamento off-line)
// © 2026 Felippe Alvarez. Todos os direitos reservados.
const CACHE = 'almox-v1.2.0';
const ARQUIVOS = ['./', 'index.html', 'info.html', 'css/app.css', 'js/app.js', 'js/config.js', 'js/store-local.js',
  'js/store-firebase.js', 'js/exporta.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const proprio = url.origin === self.location.origin;
  const sdk = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  if (!proprio && !sdk) return; // Firestore/Auth seguem direto para a rede
  if (sdk) { // SDK com versão fixa: cache primeiro
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
      const copia = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return res;
    })));
    return;
  }
  // arquivos do app: rede primeiro (pega atualizações), cache se estiver off-line
  e.respondWith(fetch(e.request).then((res) => {
    const copia = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return res;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
});
