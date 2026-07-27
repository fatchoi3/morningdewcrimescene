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

// 배포 위치. 도메인 루트면 '/' (기본), GitHub Pages 프로젝트 사이트처럼
// 하위 경로에 놓이면 VITE_BASE='/저장소이름/' 을 주면 된다.
// (Pages 워크플로가 configure-pages 의 base_path 를 그대로 넘겨준다.)
const base = (process.env.VITE_BASE || '/').replace(/\/*$/, '/');

export default defineConfig({
  base,
  plugins: [react()],
  // 로컬 폰 테스트(ngrok 등 터널) 시 외부 호스트 접근 허용
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
  resolve: {
    alias: {
      '@secrets': secretsPath,
    },
  },
  // 멀티페이지: QR 게임(index.html) + 솔로 추리게임(solo.html) + 운영자 캐스팅 편집(cast.html)
  build: {
    rollupOptions: {
      input: {
        main: resolvePath('./index.html'),
        solo: resolvePath('./solo.html'),
        cast: resolvePath('./cast.html'),
      },
    },
  },
});
