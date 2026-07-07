// ─────────────────────────────────────────────────────────────────────────────
// services — 모드 스위치. VITE_MODE(기본 'local')로 provider/store 구현을 고른다.
//   local  : 이 기기 localStorage + 번들 콘텐츠/비밀 (오프라인 단독 · A 배포)
//   online : server.js 방 서버(서버가 정답 소유) — B 단계에서 배선
//   싱글턴으로 만들어 컴포넌트가 import 해서 쓴다(런타임 모드 전환 없음).
//   비밀팩은 '@secrets' 별칭으로 주입(vite.config): 기본=secrets.js / 데모=secrets.demo.js.
// ─────────────────────────────────────────────────────────────────────────────
import { createLocalProvider } from './localProvider.js';
import { createLocalStore } from './localStore.js';
import { createRemoteProvider } from './remoteProvider.js';
import { createRemoteStore } from './remoteStore.js';
import { evidenceMap, cctvClueCodes, tapRules } from '../data/gameData.js';
import { mergeSecrets } from '../data/mergeSecrets.js';
import { gameConfig } from '../config/gameConfig.js';
import secrets from '@secrets';

const MODE = import.meta.env.VITE_MODE ?? 'local';

function build() {
  if (MODE === 'online') {
    return { provider: createRemoteProvider(), store: createRemoteStore() };
  }
  const clueMap = mergeSecrets(evidenceMap, secrets);
  return {
    provider: createLocalProvider({
      clueMap,
      cctvClueCodes,
      tapRules,
      adminOpenCode: gameConfig.adminOpenCode,
      adminCloseCode: gameConfig.adminCloseCode,
    }),
    store: createLocalStore(),
  };
}

const services = build();
export const provider = services.provider;
export const store = services.store;
export default services;
