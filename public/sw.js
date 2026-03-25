// HabitFlow for CEO - Service Worker
// キャッシュ名（バージョン更新時に変更）
const CACHE_NAME = 'habitflow-ceo-v1';

// プリキャッシュするファイル
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
];

// インストール時: 基本ファイルをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// アクティベート時: 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// フェッチ時: Network First戦略（ネットワーク優先、失敗時はキャッシュ）
self.addEventListener('fetch', (event) => {
  // ナビゲーションリクエストとAPIリクエストはネットワーク優先
  if (event.request.mode === 'navigate' || event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 成功したレスポンスをキャッシュに保存
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // オフライン時はキャッシュから返す
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // 静的アセットはCache First戦略（キャッシュ優先）
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // バックグラウンドでキャッシュを更新
        fetch(event.request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      // キャッシュにない場合はネットワークから取得
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
