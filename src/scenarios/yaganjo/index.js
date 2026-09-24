// ─────────────────────────────────────────────────────────────────────────────
// 야간조 — 시나리오 객체 조립부.
//
//   데이터팩(src/data/yaganjo/ — 보드 카드 109장 + 방 13개) + cast + config + secrets 를
//   합쳐 **객체 하나**로 만든다. 그 모양은 오늘 열두 곳이 gameData 에서 꺼내 가는 것과 같다
//   (dp-architecture §1):
//
//     { id, title, evidenceMap, victim, suspects, cctvClueCodes, tapRules,
//       cast, config, secrets }
//
//   ── 여기서 토큰이 풀린다 ──────────────────────────────────────────────────
//   src/data/yaganjo/index.js 는 일부러 cast 를 모른다. {{S1}} 이 남의 시나리오
//   이름으로 조용히 풀리는 사고를 막으려고 **토큰이 풀리지 않은 날것**을 export 한다.
//   야간조 cast 가 생긴 지금, 그 조립이 아래 buildEvidenceMap(cast) 한 줄이다.
//   gameData.js 의 `withAssetBase(resolveTokens(…, cast))` 와 같은 순서·같은 헬퍼다.
//
//   ── 미해결 토큰은 그 자리에서 터뜨린다 ────────────────────────────────────
//   resolveTokens 는 못 푼 토큰을 **그대로 남기고** 지나간다. 그러면 화면에
//   「{{S7}}의 폰」 같은 글자가 그대로 찍히고, 그 전에 아무도 모른다.
//   109장 × 토큰 170여 개를 눈으로 볼 수는 없으므로 import 시점에 세어 던진다.
// ─────────────────────────────────────────────────────────────────────────────
import {
  buildEvidenceMap,
  cctvClueCodes,
  tapRules,
  gamsikCodes,
  specialCodes,
  startingClueCodes,
  clueCodes,
  roomCodes,
} from '../../data/yaganjo/index.js';
import { cast, victimRecord, suspectRecords, investigatorRecord } from './cast.js';
import { gameConfig } from './config.js';

// 비밀팩. **여기서는 상대경로로 실팩을 직접 물린다** — '@yaganjo-secrets' 별칭이 아니다.
//   별칭은 Vite 에서만 풀린다. 이 파일은 tools/audit/yaganjo.mjs 와 tools/docgen/yaganjo/
//   가 raw node 로 import 하므로, 별칭을 쓰면 그 도구들이 ERR_INVALID_MODULE_SPECIFIER 로
//   죽는다(실제로 겪었다).
//
//   브라우저 진입점(src/yaganjo/clue/main.js)은 반대로 **별칭을 쓴다** — 그쪽은 Vite 를
//   반드시 거치고, 별칭이라야 secrets.yaganjo.js 가 없는 저장소에서 example 로 폴백한다.
//   둘은 같은 파일을 가리키므로 값이 갈리지 않는다.
//
//   ★ **이 import 는 폴백하지 않는다.** 정적 import 라 파일이 없으면 폴백이 아니라
//     해석 실패다 — 야간조 셋만이 아니라 새벽이슬 일곱까지 빌드가 통째로 죽는다.
//     그래서 src/data/secrets.yaganjo.js 는 **항상 있어야 하는 파일**이다.
//     정답을 저장소에서 빼려면 지우지 말고 **내용을 secrets.example.js 로 덮어쓴다.**
//     데모 빌드(VITE_DEMO=1)에서는 vite.config.js 의 정규식 별칭이 이 경로를
//     secrets.yaganjo.demo.js 로 갈아 끼운다 — 그래서 데모 번들에는 정답이 없다.
import secrets from '../../data/secrets.yaganjo.js';

// ── 토큰 해석 ────────────────────────────────────────────────────────────────
const unresolved = [];
export const evidenceMap = buildEvidenceMap(cast, (token, why) => {
  unresolved.push(`${token} (${why})`);
});

if (unresolved.length > 0) {
  const seen = [...new Set(unresolved)];
  throw new Error(
    `[yaganjo] 풀리지 않은 인물 토큰 ${unresolved.length}건: ${seen.join(' · ')}\n` +
      '  cast.js 의 id 배정(S1~S6 · victim)과 데이터팩의 토큰이 어긋났다.'
  );
}

// ── 인물 ─────────────────────────────────────────────────────────────────────
export const victim = victimRecord;
export const suspects = suspectRecords;

// 7인 모드 전용. 용의자가 아니므로 suspects 와 섞지 않는다.
export const investigator = investigatorRecord;

export {
  cctvClueCodes, tapRules, gamsikCodes, specialCodes, startingClueCodes,
  clueCodes, roomCodes, cast, gameConfig, secrets,
};

// ── 시나리오 객체 ────────────────────────────────────────────────────────────
// 앞의 열 개가 두 시나리오가 함께 지키는 계약이고, 뒤의 여섯은 야간조에만 있는 것이다.
// (새벽이슬은 시작 보유 단서·감식/특수 코드 목록을 데이터에서 파생해 쓰지 않는다)
//
// evidenceMap 은 **122개**다 — 보드 카드 109장(clueCodes) + 방 13개(roomCodes).
// 새벽이슬도 같은 모양이라 gameData 의 evidenceMap 안에 ROOM-JH 같은 키가 함께 산다.
// 발급표 109행과 대조할 일이 있으면 evidenceMap 이 아니라 clueCodes 를 센다.
export const yaganjo = {
  id: 'yaganjo',
  title: gameConfig.title,
  evidenceMap,
  victim,
  suspects,
  cctvClueCodes,
  tapRules,
  cast,
  config: gameConfig,
  secrets,

  // 야간조 전용
  investigator,
  gamsikCodes,
  specialCodes,
  startingClueCodes,
  clueCodes, // 보드 카드 109장
  roomCodes, // 방 13개(ROOM-*)
};

export default yaganjo;
