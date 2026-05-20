// 대한김치 재고관리 앱 Service Worker
// 역할: 앱 파일 캐싱 및 자동 업데이트 관리

const CACHE_VERSION = 'daehan-kimchi-v1.0.1';
const CACHE_NAME = CACHE_VERSION;

// 캐시할 파일 목록
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
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
      .then(() => {
        // 즉시 활성화
        return self.skipWaiting();
      })
  );
});

// Service Worker 활성화 - 구버전 캐시 삭제
self.addEventListener('activate', event => {
  console.log('[SW] 활성화 중...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] 구버전 캐시 삭제:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 모든 클라이언트 즉시 제어
        return self.clients.claim();
      })
  );
});

// 네트워크 요청 가로채기 - Cache First 전략
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Firebase API 요청은 캐싱하지 않음
  if (request.url.includes('firebaseio.com') || 
      request.url.includes('googleapis.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // 캐시에 있으면 캐시 반환하고, 백그라운드에서 업데이트 확인
          updateCache(request);
          return cachedResponse;
        }
        
        // 캐시에 없으면 네트워크에서 가져오기
        return fetch(request)
          .then(response => {
            // 유효한 응답인 경우 캐시에 저장
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseToCache);
                });
            }
            return response;
          })
          .catch(error => {
            console.log('[SW] 네트워크 요청 실패:', error);
            // 오프라인 시 캐시된 버전 반환 시도
            return caches.match('./index.html');
          });
      })
  );
});

// 백그라운드에서 캐시 업데이트 확인
function updateCache(request) {
  return fetch(request)
    .then(response => {
      if (response && response.status === 200) {
        return caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(request, response);
          });
      }
    })
    .catch(() => {
      // 네트워크 오류 무시
    });
}

// 클라이언트에게 메시지 전송 (업데이트 알림용)
function notifyClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

// 새 Service Worker 대기 중일 때 클라이언트에 알림
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
