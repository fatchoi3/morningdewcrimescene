// ─────────────────────────────────────────────────────────────────────────────
// 새벽이슬 — 시나리오 껍데기. **재수출만 한다.**
//
//   이 파일에는 콘텐츠가 한 글자도 없다. 기존 정본 네 곳을 그대로 다시 내보낼 뿐이다.
//   그래서 getScenario('morningdew') 의 결과가 오늘의 import 와 **같은 객체**임이
//   눈으로 보인다 — 파생도 복사도 변환도 없고, 아래 다섯 줄이 전부다.
//
//     scenario.evidenceMap    === gameData.evidenceMap     (같은 참조)
//     scenario.victim         === gameData.victim
//     scenario.suspects       === gameData.suspects
//     scenario.cctvClueCodes  === gameData.cctvClueCodes
//     scenario.tapRules       === gameData.tapRules
//     scenario.cast           === cast.cast
//     scenario.config         === gameConfig
//     scenario.secrets        === (@secrets 의 default)
//
//   기존 일곱 진입점은 이 파일을 거치지 않고 지금처럼 gameData 를 직접 import 한다.
//   이 껍데기는 「레지스트리로 옮겨도 무변화(no-op)」임을 보증하는 이주 경로일 뿐이다.
//
//   ※ '@secrets' 는 vite.config 가 거는 **빌드 시점 별칭**이다(secrets.js / secrets.demo.js /
//     secrets.example.js 중 하나). 그래서 이 파일은 src/services/index.js 와 마찬가지로
//     Vite 를 거쳐야 해석된다 — Node 로 직접 부르는 도구(tools/docgen·tools/audit)는
//     지금처럼 gameData.js 와 loadData.mjs 를 직접 쓴다.
// ─────────────────────────────────────────────────────────────────────────────
import { evidenceMap, victim, suspects, cctvClueCodes, tapRules } from '../../data/gameData.js';
import { cast } from '../../data/cast.js';
import { gameConfig } from '../../config/gameConfig.js';
import secrets from '@secrets';

export { evidenceMap, victim, suspects, cctvClueCodes, tapRules, cast, gameConfig, secrets };

export const morningdew = {
  id: 'morningdew',
  title: gameConfig.title,
  evidenceMap,
  victim,
  suspects,
  cctvClueCodes,
  tapRules,
  cast,
  config: gameConfig,
  secrets,
};

export default morningdew;
