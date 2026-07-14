// 서비스워커 — 오프라인 실행용(런타임 캐시, 앱셸 폴백).
//   프로덕션에서만 등록됨(main.jsx). 개발(HMR)에는 등록 안 함.
const CACHE = 'morningdew-solo-v3';
const SHELL = ['/solo.html', '/manifest.webmanifest', '/icon.svg', '/favicon2.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL).catch(() => {})) // 일부 실패해도 설치 진행
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// 같은 오리진 GET: 캐시 우선, 없으면 네트워크(받아서 캐시), 실패 시 앱셸 폴백.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('/solo.html'))),
  );
});
