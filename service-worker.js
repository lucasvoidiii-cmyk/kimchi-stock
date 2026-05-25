// 대한김치 재고관리 앱 Service Worker
// 역할: 앱 파일 캐싱 및 자동 업데이트 관리

const CACHE_VERSION = 'daehan-kimchi-v2.2.0';
const CACHE_NAME = CACHE_VERSION;

// 캐시할 파일 목록
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/firebase.js',
  './js/i18n.js',
  './js/app.js',
  './js/home.js',
  './js/inventory.js',
  './js/inbound.js',
  './js/sales.js',
  './js/settle.js',
  './js/report.js',
  './js/export.js',
  './js/mgmt.js',
  './js/finance.js'
];

// Service Worker 설치 - 초기 캐시 생성
self.addEventListener('install', event => {
  console.log('[SW] 설치 중...', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 캐시 생성 완료');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Service Worker 활성화 - 구버전 캐시 삭제
self.addEventListener('activate', event => {
  console.log('[SW] 활성화 중...', CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 구버전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      ))
      .then(() => self.clients.claim())
  );
});

// 네트워크 요청 가로채기 - Cache First 전략
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.url.includes('firebaseio.com') || request.url.includes('googleapis.com')) {
    return;
  }
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          updateCache(request);
          return cachedResponse;
        }
        return fetch(request)
          .then(response => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
            }
            return response;
          })
          .catch(() => caches.match('./index.html'));
      })
  );
});

// 백그라운드 캐시 업데이트
function updateCache(request) {
  return fetch(request)
    .then(response => {
      if (response && response.status === 200) {
        return caches.open(CACHE_NAME).then(cache => cache.put(request, response));
      }
    })
    .catch(() => {});
}

// 클라이언트 메시지 수신 (업데이트 적용)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
