const CACHE_NAME='op-csr-support-v1';
const ASSETS=['/OP-CSR-Support/','/OP-CSR-Support/index.html','/OP-CSR-Support/assets/styles.css','/OP-CSR-Support/assets/app.js','/OP-CSR-Support/assets/local-storage-db.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('fetch',event=>event.respondWith(caches.match(event.request).then(resp=>resp||fetch(event.request))));
