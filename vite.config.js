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

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@secrets': secretsPath,
    },
  },
});
