// ─────────────────────────────────────────────────────────────────────────────
// 야간조 — 단서 데이터팩 조립부
//
//   여섯 장(章) 파일을 하나의 evidenceMap 으로 합친다. 보드판 카드 109장 전량이다.
//
//     clues-abe.js     A 서장현 6 · B 차민우 5 · E 윤도경 6            = 17
//     clues-cdf.js     C 오정숙 6 · D 흐엉 6 · F 임기석 5              = 17
//     clues-scene.js   X 현장 10 · P 조장의 칸 3 · 공개 게시물 2        = 15
//     clues-space.js   W 6 · N 5 · J 5 · U 5 · T 조장 태블릿 1          = 22
//     clues-camera.js  V 카메라 14                                     = 14
//     clues-lab.js     L 감식 9 · S 특수 8 · Q 기록 대조 7              = 24
//                                                                   ───────
//                                                                       109
//
//   여기에 앱 전용 항목이 더 붙는다. 보드 카드가 아니라 카드가 놓인 **자리**다.
//
//     rooms.js         방 13(ROOM-A~F · X · P · W · N · J · U · V)     = 13
//                                                                   ───────
//                                                             evidenceMap 122
//
//   새벽이슬도 같은 모양이다 — gameData.js 의 evidenceMap 안에 ROOM-JH 같은
//   형식 밖 키가 함께 산다. 109장만 따로 볼 일이 있으면 clueCodes 를 쓴다.
//
//   ── cast 의존을 만들지 않는다 ──────────────────────────────────────────────
//   gameData.js 는 `withAssetBase(resolveTokens({…}, cast))` 로 감싼 결과를 곧장
//   export 하지만, 여기서 같은 짓을 하면 야간조 데이터팩이 특정 cast 파일에 묶인다.
//   야간조용 cast 는 아직 없고(dp-mapping.md §9-2-1), 새벽이슬 cast 를 끌어오면
//   {{S1}} 이 '최종현' 으로 풀려 조용히 틀린 데이터가 나온다.
//
//   그래서 이 파일이 export 하는 `evidenceMap` 은 **토큰이 풀리지 않은 날것**이다.
//   resolveTokens 는 cast 를 인자로 받으므로(tokens.js), 조립은 cast 가 생긴 뒤
//   아래 `buildEvidenceMap(cast)` 한 줄로 끝난다. tokens.js·assets.js 는 둘 다
//   의존이 없는 순수 유틸이라 여기서 import 해도 결합이 늘지 않는다.
//
//     import { buildEvidenceMap } from './yaganjo/index.js';
//     import { cast } from './yaganjo/cast.js';           // 아직 없음
//     export const evidenceMap = buildEvidenceMap(cast);
//
//   ── 아직 없는 것(이 파일 밖) ───────────────────────────────────────────────
//   Q2-b(110번째 코드) · 야간조용 cast/gameConfig ·
//   secrets(감식 비번 9 · 폰 잠금 5 · 태블릿 lookup 1).
//   전부 dp-mapping.md §9-2 의 항목이고 보드 카드 109장 밖이다.
// ─────────────────────────────────────────────────────────────────────────────
import { resolveTokens } from '../tokens.js';
import { withAssetBase } from '../assets.js';

import { cluesABE } from './clues-abe.js';
import { cluesCDF } from './clues-cdf.js';
import { cluesScene } from './clues-scene.js';
import { cluesSpace } from './clues-space.js';
import { cluesCamera } from './clues-camera.js';
import { cluesLab } from './clues-lab.js';
import { rooms } from './rooms.js';

// 합치기 전에 같은 코드가 두 장에 있는지 본다.
// 객체 전개(spread)는 뒤엣것이 앞엣것을 조용히 덮어써서, 중복이 있어도 개수만 줄고 끝난다.
// 콘텐츠가 통째로 사라지는 사고라 빌드 때 바로 터지게 둔다.
function mergeStrict(parts) {
  const out = {};
  const seen = new Map(); // code → 먼저 차지한 파일 이름
  for (const [source, map] of parts) {
    for (const code of Object.keys(map)) {
      if (seen.has(code)) {
        throw new Error(
          `[yaganjo] 단서 코드 중복: '${code}' 가 ${seen.get(code)} 와 ${source} 양쪽에 있다.`
        );
      }
      seen.set(code, source);
      out[code] = map[code];
    }
  }
  return out;
}

// 보드 카드 109장. 토큰이 풀리지 않은 원본이다.
const boardClues = mergeStrict([
  ['clues-abe.js', cluesABE],
  ['clues-cdf.js', cluesCDF],
  ['clues-scene.js', cluesScene],
  ['clues-space.js', cluesSpace],
  ['clues-camera.js', cluesCamera],
  ['clues-lab.js', cluesLab],
]);

// 카드 109장 + 방 13개 = 122. 방도 같은 맵에 산다(gameData.js 의 ROOM-* 와 같은 자리).
// 방 코드는 ROOM- 접두사라 카드 코드(^[A-Z]{4}-\d{2}$)와 형식이 겹치지 않지만,
// 그래도 mergeStrict 를 통과시킨다 — 가드는 「겹칠 리 없다」를 믿지 않을 때만 값어치가 있다.
export const evidenceMap = mergeStrict([
  ['(보드 카드 109장)', boardClues],
  ['rooms.js', rooms],
]);

// cast 가 생긴 뒤 이 한 줄로 앱에 넣을 모양이 된다.
// gameData.js 의 `withAssetBase(resolveTokens(…, cast))` 와 같은 순서·같은 헬퍼다.
export function buildEvidenceMap(cast, onMissingToken) {
  return withAssetBase(resolveTokens(evidenceMap, cast, onMissingToken));
}

// ── 코드 목록 ────────────────────────────────────────────────────────────────
// 새벽이슬은 cctvClueCodes 를 SIAH-72.cctv.timeline 에서 파생하지만,
// 야간조의 카메라는 통행 계수 로그 14장이라 파생할 timeline 이 없다.
// EvidenceList 의 CCTV 탭은 `cctv` 필드가 아니라 이 코드 배열 소속만 보므로,
// V 14장을 그대로 나열하면 컴포넌트를 고치지 않고 탭이 성립한다(dp-mapping.md §5-2).
export const cctvClueCodes = Object.keys(cluesCamera);

// 보드 카드 109장의 코드 / 방 13개의 코드. 발급표 대조와 정합성 점검이 둘을 갈라 본다.
export const clueCodes = Object.keys(boardClues);
export const roomCodes = Object.keys(rooms);

// 방 항목 원본도 그대로 내보낸다 — 인쇄물 생성기가 「어느 더미가 어느 방인가」를 읽는다.
export { rooms };

// 자동 해금 엔진(rules.computeAutoUnlocked)이 실제로 보는 두 종류.
export const gamsikCodes = Object.keys(evidenceMap).filter((c) => evidenceMap[c].type === '감식');
export const specialCodes = Object.keys(evidenceMap).filter((c) => evidenceMap[c].type === '특수');

// 시작 보유 단서 — 공개① 안전감사 사전자료 요청 공문(현장 상식 3줄이 여기 실려 있다).
// 공개② VEVM-47 은 이벤트① 시점에 진행자가 배포한다.
export const startingClueCodes = ['UTAY-40'];

// 야간조에는 새벽이슬의 「양쪽 톡서랍 교차 복구」 같은 열람 흔적 조합이 없다(§9-2-6).
export const tapRules = [];

export default evidenceMap;
