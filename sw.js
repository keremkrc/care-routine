const CACHE_NAME = 'careroutine-premium-v2.0';
const STATIC_CACHE = 'static-v2.0';
const DYNAMIC_CACHE = 'dynamic-v2.0';

// Statik dosyalar (her zaman önbelleklenecek)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap'
];

// Firebase domainleri (network-first)
const FIREBASE_DOMAINS = [
  'firebase.google.com',
  'firebaseapp.com',
  'googleapis.com',
  'gstatic.com'
];

// Görsel CDN'leri (cache-first)
const IMAGE_CDNS = [
  'images.unsplash.com',
  'via.placeholder.com',
  'ui-avatars.com',
  'cdn-icons-png.flaticon.com'
];

/* =====================================
   INSTALL EVENT - Önbelleği Hazırla
   ===================================== */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Yükleniyor...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Statik dosyalar önbelleğe alınıyor');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Yükleme tamamlandı');
        return self.skipWaiting(); // Hemen aktif et
      })
      .catch((error) => {
        console.error('❌ Service Worker: Yükleme hatası', error);
      })
  );
});

/* =====================================
   ACTIVATE EVENT - Eski Önbellekleri Temizle
   ===================================== */
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Aktifleştiriliyor...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Mevcut cache'ler dışındaki tüm eski cache'leri sil
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName.startsWith('careroutine');
            })
            .map((cacheName) => {
              console.log('🗑️ Service Worker: Eski önbellek siliniyor:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Aktifleştirildi');
        return self.clients.claim(); // Tüm sayfalarda kontrolü al
      })
  );
});

/* =====================================
   FETCH EVENT - İstek Stratejileri
   ===================================== */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Sadece HTTP/HTTPS isteklerini işle
  if (!request.url.startsWith('http')) {
    return;
  }

  // Strateji 1: Firebase istekleri için NETWORK FIRST
  if (isFirebaseRequest(url)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Strateji 2: Görseller için CACHE FIRST
  if (isImageRequest(request) || isImageCDN(url)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Strateji 3: Statik dosyalar için CACHE FIRST with NETWORK FALLBACK
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Strateji 4: Diğer her şey için NETWORK FIRST with CACHE FALLBACK
  event.respondWith(networkFirstStrategy(request));
});

/* =====================================
   CACHING STRATEGIES
   ===================================== */

// Network First: Önce internet, başarısız olursa cache
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Başarılı network yanıtı, cache'e ekle
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network başarısız, cache'e bak
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('📦 Service Worker: Cache\'ten sunuluyor:', request.url);
      return cachedResponse;
    }
    
    // Hem network hem cache başarısız
    console.error('❌ Service Worker: İstek başarısız:', request.url);
    
    // HTML sayfası için offline sayfası döndür
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    
    throw error;
  }
}

// Cache First: Önce cache, yoksa internet
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('📦 Service Worker: Cache\'ten sunuluyor:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Service Worker: İstek başarısız:', request.url);
    throw error;
  }
}

/* =====================================
   HELPER FUNCTIONS
   ===================================== */

function isFirebaseRequest(url) {
  return FIREBASE_DOMAINS.some(domain => url.hostname.includes(domain));
}

function isImageRequest(request) {
  return request.destination === 'image';
}

function isImageCDN(url) {
  return IMAGE_CDNS.some(cdn => url.hostname.includes(cdn));
}

function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.pathname === asset || url.href === asset);
}

/* =====================================
   BACKGROUND SYNC (Opsiyonel)
   ===================================== */
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync:', event.tag);
  
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  // Çevrimdışı yapılan işlemleri senkronize et
  console.log('🔄 Service Worker: Görevler senkronize ediliyor...');
  // Burada offline sırasında yapılan değişiklikleri Firestore'a gönderebilirsiniz
}

/* =====================================
   PUSH NOTIFICATIONS (Opsiyonel)
   ===================================== */
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push bildirimi alındı');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'CareRoutine';
  const options = {
    body: data.body || 'Yeni bir bildiriminiz var',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    tag: 'careroutine-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Bildirime tıklandı');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

/* =====================================
   MESSAGE HANDLER
   ===================================== */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('🚀 Service Worker: Script yüklendi');
