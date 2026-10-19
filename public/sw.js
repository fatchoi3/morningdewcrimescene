// 서비스워커 — 오프라인 실행용(런타임 캐시, 앱셸 폴백).
//   프로덕션에서만 등록됨(main.jsx). 개발(HMR)에는 등록 안 함.
const CACHE = 'morningdew-solo-v14'; // v14 — 경로를 등록 범위 기준으로(dawndew.org/crimescene/ 아래 판)

// 등록 범위 — 루트 판이면 '/', dawndew.org 안에 넣은 판이면 '/crimescene/'. 모든 셸 경로를 여기에 붙인다.
const B = new URL(self.registration.scope).pathname;
const SHELL = ['solo.html', 'play.html', 'yaganjo-solo.html', 'manifest.webmanifest', 'icon.svg', 'favicon2.png'].map((p) => B + p);

// 보기 좋은 주소 → 미리 받아 둔 셸(오프라인에서 /solo-play 를 열면 새벽이슬이 아니라 고르는 화면이 떠야 한다)
const SHELL_OF = { 'solo-play': 'play.html', 'morningdew-solo': 'solo.html', 'yaganjo-solo': 'yaganjo-solo.html' };
const shellFor = (pathname) => B + (SHELL_OF[pathname.slice(B.length).replace(/\/$/, '')] || 'solo.html');

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
      }).catch(() => caches.match(req).then((hit) => hit || caches.match(shellFor(url.pathname)))),
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
    }).catch(() => caches.match(B + 'solo.html'))),
  );
});
