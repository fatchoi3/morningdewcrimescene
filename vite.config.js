import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

// '@secrets' 별칭 — 어떤 비밀팩을 번들할지 빌드 시점에 고른다.
//   VITE_DEMO=1        → secrets.demo.js (실제 정답 미포함, 공개 데모용)
//   secrets.js 있음    → secrets.js      (실제 정답 · 운영 빌드)
//   secrets.js 없음    → secrets.example.js (플레이스홀더 · 정답을 커밋하지 않는 저장소용)
const resolvePath = (p) => fileURLToPath(new URL(p, import.meta.url));
const demo = process.env.VITE_DEMO === '1';
const realSecrets = resolvePath('./src/data/secrets.js');
const secretsPath = demo
  ? resolvePath('./src/data/secrets.demo.js')
  : (existsSync(realSecrets) ? realSecrets : resolvePath('./src/data/secrets.example.js'));

// '@yaganjo-secrets' — 야간조 비밀팩. 같은 분기, 다른 시나리오.
//   이름이 '@secrets/야간조' 가 아닌 이유가 있다. Vite 의 별칭 매칭은 정확 일치 아니면
//   '패턴 + /' 로 시작하는지를 본다(rollup plugin-alias 의 matches). '@secrets/야간조' 는
//   '@secrets/' 로 시작하므로 위의 '@secrets' 별칭이 먼저 잡아 <secrets.js경로>/야간조 라는
//   없는 경로로 바꿔 버린다 — 에러가 엉뚱한 곳을 가리켜 한참 헤맨다.
const realYaganjoSecrets = resolvePath('./src/data/secrets.yaganjo.js');
const yaganjoSecretsPath = demo
  ? resolvePath('./src/data/secrets.yaganjo.demo.js')
  : (existsSync(realYaganjoSecrets)
      ? realYaganjoSecrets
      : resolvePath('./src/scenarios/yaganjo/secrets.example.js'));

// 야간조 시나리오 조립부(src/scenarios/yaganjo/index.js)는 별칭이 아니라 **상대경로로**
// 실팩을 문다 — raw node 로 그 파일을 읽는 tools/audit · tools/docgen 이 별칭을 못 풀기
// 때문이다. 그래서 위 별칭만으로는 **데모 빌드에도 실팩이 그대로 섞여 들어간다.**
// 그 경로까지 같이 갈아 끼운다. plugin-alias 는 정규식이면 **맞은 부분만** 치환하므로
// 지정자 전체를 무는 `^.*` 로 써야 한다 — 안 그러면 앞의 `../../data` 가 남아 경로가 깨진다.
const yaganjoRelAlias = demo
  ? [{ find: /^.*secrets\.yaganjo\.js$/, replacement: yaganjoSecretsPath }]
  : [];

// 배포 위치. 도메인 루트면 '/' (기본), GitHub Pages 프로젝트 사이트처럼
// 하위 경로에 놓이면 VITE_BASE='/저장소이름/' 을 주면 된다.
// (Pages 워크플로가 configure-pages 의 base_path 를 그대로 넘겨준다.)
const base = (process.env.VITE_BASE || '/').replace(/\/*$/, '/');

// 보기 좋은 주소 — /solo-play 로 들어와도 솔로 게임(solo.html)이 열린다.
//   개발·프리뷰 서버에서 경로만 바꿔치기한다(리다이렉트가 아니라 내부 rewrite라 주소가 그대로 남는다).
//   운영(S3+CloudFront)에서는 배포 워크플로가 solo.html 을 'solo-play' 키로 한 번 더 올려 같은 주소를 만든다.
const prettyPaths = () => {
  //   야간조 세 줄 — 카드 QR 이 확장자 없는 주소를 가리키므로 이 항목이 없으면 QR 열아홉 장이 전부 404 다.
  const MAP = { '/solo-play': '/solo.html', '/solo-play/': '/solo.html', '/cast-edit': '/cast.html', '/board-kit': '/board.html', '/cctv': '/cctv.html', '/unlock': '/unlock.html', '/clue': '/clue.html', '/yaganjo-kit': '/yaganjo-board.html', '/yaganjo-clue': '/yaganjo-clue.html', '/yaganjo-cctv': '/yaganjo-cctv.html' };
  // 값을 반환하면 Vite가 '내부 미들웨어 뒤에 붙일 후처리 훅'으로 오해한다(use()는 connect 앱을
  //   돌려주는데 그것도 함수라서). 중괄호로 감싸 반환값을 버린다.
  const rewrite = (server) => {
    server.middlewares.use((req, _res, next) => {
      const path = (req.url || '').split('?')[0];
      if (MAP[path]) req.url = MAP[path] + (req.url.slice(path.length) || '');
      next();
    });
  };
  return { name: 'pretty-paths', configureServer: rewrite, configurePreviewServer: rewrite };
};

export default defineConfig({
  base,
  plugins: [react(), prettyPaths()],
  // 로컬 폰 테스트(ngrok 등 터널) 시 외부 호스트 접근 허용
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
  resolve: {
    // 배열 꼴이라야 정규식 별칭을 섞을 수 있다. 순서가 곧 우선순위이므로
    // 정규식을 앞에 두어 상대경로 import 가 먼저 잡히게 한다.
    alias: [
      ...yaganjoRelAlias,
      { find: '@secrets', replacement: secretsPath },
      { find: '@yaganjo-secrets', replacement: yaganjoSecretsPath },
    ],
  },
  // 멀티페이지: QR 게임(index.html) + 솔로 추리게임(solo.html)
  //   + 운영자 캐스팅 편집(cast.html) + 보드게임 인쇄물 키트(board.html)
  build: {
    rollupOptions: {
      input: {
        main: resolvePath('./index.html'),
        solo: resolvePath('./solo.html'),
        cast: resolvePath('./cast.html'),
        board: resolvePath('./board.html'),
        cctv: resolvePath('./cctv.html'),
        unlock: resolvePath('./unlock.html'),
        clue: resolvePath('./clue.html'),
        // 야간조 — 인쇄물 키트 · 🔒 카드 QR(폰·태블릿) · V 카드 QR(카메라)
        yaganjoBoard: resolvePath('./yaganjo-board.html'),
        yaganjoClue: resolvePath('./yaganjo-clue.html'),
        yaganjoCctv: resolvePath('./yaganjo-cctv.html'),
      },
    },
  },
});
