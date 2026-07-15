// 서비스워커 — 오프라인 실행용(런타임 캐시, 앱셸 폴백).
//   프로덕션에서만 등록됨(main.jsx). 개발(HMR)에는 등록 안 함.
const CACHE = 'morningdew-solo-v8';
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

// 같은 오리진 GET.
//   HTML/내비게이션 = 네트워크 우선(항상 최신 셸, 실패 시 캐시) — 재배포 후 옛 화면 방지.
//   해시 에셋 등 그 외 = 캐시 우선(빠름·오프라인), 없으면 네트워크(받아서 캐시).
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isHTML = req.mode === 'navigate' || url.pathname.endsWith('.html');
  if (isHTML) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match('/solo.html'))),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      // SPA 폴백(HTML)이 에셋 키로 캐싱되는 오염 방지 — 비HTML 요청엔 HTML 응답을 캐싱하지 않음
      const ct = (res && res.headers.get('content-type')) || '';
      if (res && res.status === 200 && res.type === 'basic' && !ct.includes('text/html')) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('/solo.html'))),
  );
});
