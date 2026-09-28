import { cast } from '../../../scenarios/yaganjo/cast.js';
import { resolveTokens } from '../../../data/tokens.js';
// ─────────────────────────────────────────────────────────────────────────────
// lib/game — 순수 상수 + 게임 규칙(진행 단계·핫스팟 좌표·채점 등). JSX 없음.
//   콘텐츠(용의자 수·현장 단서 코드)에 의존하므로 content.js만 참조한다.
// ─────────────────────────────────────────────────────────────────────────────
import { crimeSceneCodes, suspectIds } from '../content.js';

export const STAGE_LABEL = { 1: '제1장 · 1차 탐문 (인물의 칸)', 2: '제2장 · 중간 점검 (현장·카메라·감식)', 3: '제3장 · 2차 심문 (휴대폰·감식·추궁)' };
export const STAGE_BANNER = {
  2: '🔓 중간 점검 — 현장 감식이 끝났습니다. C통로 현장·공용 공간·관제실 열람대·감식 의뢰실이 열렸습니다(조장의 칸은 자물쇠 — 사물함 열쇠가 필요합니다). 사인은 아직 압사로 보고 있습니다',
  3: '🔓 2차 심문 — 휴대전화 영장이 나왔고 감식 결과가 도착했습니다. 2차 부검: 사인은 질식. 다시 방을 둘러보고, 물증으로 추궁하세요',
};
export const SCENE_NEEDED = 3; // 단계 2→3: C통로 현장 단서 이만큼 확보
export const TRUST_MAX = 5;    // 신뢰도(HP)

export function interrogatedCount(state) {
  const asked = state.askedQ || {}, pressed = state.pressed || {}, broke = state.broke || {};
  const topics = state.askedT || {}, clues = state.askedC || {};
  // 무엇이든 하나라도 물어봤으면(=대화함) 심문한 것으로 인정 — 질문·화제·단서·추궁·모순 전부.
  //   (press/present만 인정하던 때는 6명과 대화만 하면 단계가 안 열리는 '진행 불능 함정'이 있었다.
  //    화제·단서만 물은 경로도 대화한 것이므로 같이 센다.)
  const any = (m, id) => (m[id] || []).length >= 1;
  return suspectIds.filter((id) => any(asked, id) || any(pressed, id) || any(broke, id)
    || any(topics, id) || any(clues, id)).length;
}
export function sceneClueCount(state) {
  const got = new Set(state.collected || []);
  return crimeSceneCodes.filter((c) => got.has(c)).length;
}
// 진행도로부터 도달 단계 계산(단조 증가)
export function computeStage(state) {
  if (interrogatedCount(state) < suspectIds.length) return 1;   // 6인 모두 심문해야 중간점검
  if (sceneClueCount(state) < SCENE_NEEDED) return 2;           // 현장 조사해야 2부(폰)
  // 감식을 한 건도 안 맡기고 넘어가면 차민우가 먼저 자백하는 함정(정본 §6-2)이 서지 않는다 — 3회차 #6
  if (!(state.labReq || []).length) return 2;
  return 3;
}
export const stageHint = (locStage) => locStage === 2
  ? `🔒 1차 심문 후 개방 — 용의자 ${suspectIds.length}명을 모두 심문하세요`
  : locStage === 3
    ? `🔒 2차 심문 때 개방 — C통로 현장에서 단서 ${SCENE_NEEDED}개를 찾고 감식을 한 건 이상 맡기세요`
    : '🔒 잠김';

// 난이도 선택은 없앴다 — 규칙은 하나(비번·연결을 스스로 푼다).
//   '탐정'은 '퍼즐'과 코드가 완전히 같았고, '가이드'는 전 구역을 미리 열어 2막 구조를 무너뜨렸다.
//   막힌 사람을 돕는 건 난이도가 아니라 '3번 틀리면 힌트'(features/clues.jsx)가 맡는다.

// 장면 종류별 '표면 앵커' — 배경 가구/바닥에 맞춰 배치(깊을수록 s 작게).
//   x,y = 화면 % (하단 대사창을 피해 y≤70), s = 원근 배율. index로 결정적 매핑 → 늘 같은 자리.
//   인물이 있는 방은 우측(78%~)을 인물 자리로 비워둠.
const ANCHORS = {
  room: [
    { x: 15, y: 62, s: 1.06 }, { x: 70, y: 55, s: 1.0 }, { x: 39, y: 26, s: 0.68 }, { x: 45, y: 68, s: 1.04 },
    { x: 20, y: 31, s: 0.72 }, { x: 60, y: 66, s: 1.0 }, { x: 30, y: 56, s: 0.9 }, { x: 55, y: 42, s: 0.8 },
    { x: 24, y: 45, s: 0.84 }, { x: 66, y: 34, s: 0.74 }, { x: 50, y: 60, s: 0.96 }, { x: 12, y: 48, s: 0.85 },
  ],
  crime: [
    { x: 52, y: 50, s: 1.0 }, { x: 33, y: 63, s: 1.05 }, { x: 71, y: 60, s: 1.03 }, { x: 21, y: 47, s: 0.85 },
    { x: 60, y: 40, s: 0.78 }, { x: 44, y: 66, s: 1.04 }, { x: 82, y: 50, s: 0.9 }, { x: 15, y: 61, s: 1.0 },
    { x: 38, y: 37, s: 0.75 }, { x: 75, y: 35, s: 0.72 }, { x: 28, y: 55, s: 0.9 }, { x: 64, y: 55, s: 0.95 },
  ],
  cctv: [
    { x: 22, y: 30, s: 0.8 }, { x: 44, y: 30, s: 0.8 }, { x: 66, y: 31, s: 0.8 }, { x: 33, y: 52, s: 0.9 },
    { x: 55, y: 52, s: 0.9 }, { x: 77, y: 42, s: 0.82 }, { x: 20, y: 52, s: 0.88 }, { x: 50, y: 66, s: 1.0 },
    { x: 70, y: 64, s: 1.0 },
  ],
  lab: [
    { x: 24, y: 55, s: 0.95 }, { x: 40, y: 53, s: 0.92 }, { x: 56, y: 52, s: 0.9 }, { x: 70, y: 52, s: 0.9 },
    { x: 32, y: 66, s: 1.0 }, { x: 60, y: 64, s: 1.0 }, { x: 82, y: 57, s: 0.9 }, { x: 16, y: 59, s: 0.95 },
  ],
  phone: [
    { x: 20, y: 57, s: 0.95 }, { x: 37, y: 56, s: 0.95 }, { x: 54, y: 56, s: 0.95 }, { x: 71, y: 56, s: 0.95 },
    { x: 86, y: 57, s: 0.95 }, { x: 30, y: 68, s: 1.02 }, { x: 62, y: 68, s: 1.02 },
  ],
  common: [
    { x: 18, y: 52, s: 1.0 }, { x: 82, y: 52, s: 1.0 }, { x: 35, y: 44, s: 0.85 }, { x: 65, y: 44, s: 0.85 },
    { x: 50, y: 60, s: 1.05 }, { x: 26, y: 38, s: 0.72 }, { x: 74, y: 38, s: 0.72 }, { x: 50, y: 34, s: 0.66 },
  ],
};
const anchorKind = (loc) => loc.showBody ? 'crime' : (ANCHORS[loc.kind] ? loc.kind : 'room');
const posFor = (loc, i) => { const a = ANCHORS[anchorKind(loc)]; return a[i % a.length]; };

// 방별 단서 핫스팟 정밀 좌표 — 그림 속 실제 소품 위치(전체 이미지 기준 %). 없는 코드는 posFor 스캐터로 폴백.
//   x,y = 이미지(16:9) 내 위치(%), s = 원근 배율. 그림에 소품이 없는 단서는 가구 위 등 자연스러운 위치에 배치.
// ── 방별 핫스팟 좌표표 ───────────────────────────────────────────────────────
//   **야간조는 아직 비어 있다.** 이 표는 방 배경 그림(/images/yaganjo/scenes/<id>.jpg)이
//   생긴 뒤에, 단서 사진과 배경 물체를 눈으로 대조해 한 칸씩 채우는 자리다.
//   비어 있으면 hotspotFor 가 freeSpot → posFor 순으로 **자동 배치**한다. 놀 수는 있고,
//   물건이 그림 속 제자리에 앉지 않을 뿐이다.
//   (새벽이슬 좌표를 물려받지 않는다 — 방 id 도 다르고, 남의 단서 코드가 번들에 실린다.)
export const ROOM_HOTSPOTS = {
  // 사물함 칸 — scenes/ROOM-X.jpg(1376x768) 속 물건 자리
  'ROOM-A': {
    'NUMF-40': { x: 37, y: 21 },  // A1 윗선반 클립보드
    'TXCD-86': { x: 53, y: 21 },  // A3 윗선반 누런 봉투
    'GZUX-14': { x: 53, y: 57 },  // A4 걸린 조끼(문 안쪽 사진은 그 곁)
    'CFKD-36': { x: 35.5, y: 78 },  // A2 공구 파우치
    'MQDV-92': { x: 46.5, y: 83 },  // A5 무전기·사원증 끈
    'GYQV-38': { x: 56, y: 88 },  // A6 휴대폰
  },
  'ROOM-B': {
    'VFUK-55': { x: 46.5, y: 33 },  // B3 교재·파란 바인더
    'GKGE-32': { x: 57, y: 34 },  // B1 흰 약봉투
    'MLPZ-57': { x: 70.5, y: 51 },  // B2 문에 꽂힌 종이
    'IYPZ-09': { x: 47, y: 70 },  // B4 손목 보호대·학생증
    'TLBI-94': { x: 55, y: 83 },  // B5 휴대폰
  },
  'ROOM-C': {
    'VSTN-59': { x: 58, y: 35 },  // C1 윗선반 화장품 세트
    'YTDK-27': { x: 44, y: 44 },  // C2 흰 봉투
    'QYHA-34': { x: 74.5, y: 50 },  // C3 문 안쪽 일정표
    'EFJB-22': { x: 43, y: 82 },  // C4 초록 장바구니 가방
    'XWNR-11': { x: 63.5, y: 75 },  // C5 앞치마
    'DMYX-34': { x: 56.5, y: 85 },  // C6 앞치마 위 휴대폰
  },
  'ROOM-D': {
    'EBEZ-58': { x: 54, y: 30 },  // D4 사진 액자
    'CHOH-86': { x: 54, y: 43 },  // D5 상담 카드
    'GOCI-93': { x: 64.5, y: 43 },  // D3 붉은 여권
    'OIXS-24': { x: 79.5, y: 52 },  // D1 문 안쪽 열쇠 꾸러미(마스터키)
    'HIEV-34': { x: 62, y: 72 },  // D2 작업화 한 짝
    'LIPT-58': { x: 54.5, y: 86 },  // D6 휴대폰
  },
  'ROOM-F': {
    'LHMX-66': { x: 27.5, y: 48 },  // F1 문 안쪽 지게차 키
    'ZFDF-11': { x: 47, y: 28 },  // F2 지갑·접힌 통지서
    'LKQM-22': { x: 60, y: 30 },  // F3 귀마개·약통
    'VRVO-38': { x: 48, y: 66 },  // F4 보온병
    'DMKO-85': { x: 58, y: 70 },  // F5 휴대폰
  },
  'ROOM-P': {
    'GZME-70': { x: 44, y: 37 },  // P1 칸 나뉜 보관함
    'XNHC-45': { x: 56.5, y: 41 },  // P2 각서 다발
  },
  // C통로 현장 — 폰(X10)은 그림에 없어 빈자리로 떨어진다
  'ROOM-X': {
    'ITYT-34': { x: 47, y: 64 },  // X1 넘어진 파렛트
    '__body__': { x: 39, y: 76 },  // 파렛트 아래
    'JZXT-21': { x: 56, y: 93 },  // X2 바닥 자국
    'PIMY-01': { x: 49, y: 82.5 },  // X3 수첩(표식 3)
    'TUTI-57': { x: 57, y: 79.5 },  // X4 소지품(표식 4)
    'HFIQ-89': { x: 64, y: 76 },  // X9 시신 채취(표식 5)
    'ATXE-85': { x: 70.5, y: 85.5 },  // X5 흩어진 전표
    'VXHP-68': { x: 20, y: 77 },  // X6 파렛트 잭
    'HPUZ-03': { x: 12, y: 80 },  // X7 랩 롤
    'OZRC-07': { x: 23.5, y: 20 },  // X8 랙 위 랩 덩어리
  },
  'ROOM-E': {
    'RGXM-52': { x: 49.5, y: 39 },  // E4 누런 봉투(탈락 통지)
    'QHOU-15': { x: 62.5, y: 36, s: 0.85 },  // E1 검은 상자(커플링)·안내문
    'NQGW-82': { x: 66, y: 46.5, s: 0.85 },  // E2 명함
    'SXMG-82': { x: 47, y: 69 },  // E3 집품 단말
    'FKRI-82': { x: 56, y: 79 },  // E5 접힌 메모
    'TQMO-65': { x: 64.5, y: 78.5 },  // E6 휴대폰
  },
  // 공용 공간
  'ROOM-W': {
    'CTBT-25': { x: 56.5, y: 59 },  // W1 탁자 위 텀블러
    'EKLZ-98': { x: 47.5, y: 50 },  // W2 벽에 기댄 끝자리 의자
    'HOJI-48': { x: 31, y: 60 },  // W3 휴게실 탁자
    'CRZR-18': { x: 93, y: 47 },  // W4 열린 문 너머 사물함 열
    'NQGX-52': { x: 4.5, y: 50 },  // W6 구석 철제 캐비닛
    'OVGS-58': { x: 86, y: 30, s: 0.85 },  // W5 흡연장(문간 게시판 옆으로 나가는 길)
  },
  'ROOM-N': {
    'QJUT-13': { x: 37, y: 52 },  // N1 지게차
    'BKZO-68': { x: 57.5, y: 42 },  // N3 충전기와 커넥터
    'UTVE-09': { x: 71.5, y: 50 },  // N2 거치대의 무전기
    'TEXV-97': { x: 84, y: 55 },  // N4 열린 문 안 배터리실
    'KDBK-22': { x: 92.5, y: 48 },  // N5 배터리실 문
  },
  'ROOM-J': {
    'LZOB-18': { x: 14, y: 44 },  // J1 갈림 랙 기둥
    'QWRS-35': { x: 20, y: 83 },  // J2 기둥 밑 빈 상자
    'QRDK-68': { x: 51, y: 52 },  // J3 안쪽 작업대
    'UDBD-88': { x: 79, y: 61 },  // J4 폐기 파렛트
    'TALG-77': { x: 93, y: 52 },  // J5 비상구 뒷문
  },
  'ROOM-U': {
    'ATQK-74': { x: 46, y: 30 },  // U1 선반의 순찰 일지 묶음
    'OPGY-02': { x: 33.5, y: 41 },  // U2 벽의 열쇠함
    'NWVL-86': { x: 48, y: 64 },  // U6 캐비닛 속 초안
    'OWBV-26': { x: 65.5, y: 52 },  // U5 열린 문과 계단
    'ASWY-11': { x: 90, y: 40 },  // U3 유리창 너머 관제실
    'ZVLJ-37': { x: 30, y: 67 },  // 거치대의 조장 태블릿
    'KVUN-12': { x: 84, y: 84 },  // U4 오른쪽 책상 위 명부
  },
  // 관제실 열람대 — 모니터 여섯(위: G-1 · M-1 · M-2 / 아래: L-1 · W-1 · C-3, C-3 만 검다)에 그 카메라의 카드를 모은다.
  //   scenes/ROOM-V.jpg 의 모니터 자리다(art.jsx CCTV_WALL 순서와 같다).
  'ROOM-V': {
    'DRZS-30': { x: 37, y: 26, s: 0.6 }, 'LYZR-15': { x: 41.5, y: 26, s: 0.6 },           // G-1 정문
    'VABS-05': { x: 50.3, y: 26, s: 0.65 },                                                // M-1 주통로 서
    'JPAD-03': { x: 58, y: 22.5, s: 0.55 }, 'JSFS-29': { x: 61.5, y: 22.5, s: 0.55 }, 'MPXG-54': { x: 65, y: 22.5, s: 0.55 },
    'QNWA-14': { x: 59.5, y: 29.5, s: 0.55 }, 'EMSY-33': { x: 63.5, y: 29.5, s: 0.55 },  // M-2 자동문
    'AHSG-34': { x: 39.3, y: 43.5, s: 0.65 },                                              // L-1 탈의실 입구
    'ZDHT-35': { x: 50.3, y: 43.5, s: 0.65 },                                              // W-1 출고 리프트
    'VOSB-03': { x: 59.5, y: 40, s: 0.55 }, 'ZFDP-41': { x: 63.5, y: 40, s: 0.55 },
    'PAOX-30': { x: 59.5, y: 47, s: 0.55 }, 'KADA-11': { x: 63.5, y: 47, s: 0.55 },      // C-3 갈림(검은 화면)
  },
  // 감식 의뢰실 — 작업대 앞 비닐 봉투 아홉에 감식 아홉
  'LOC-LAB': {
    'IJEO-08': { x: 10, y: 75, s: 0.8 }, 'FBWD-37': { x: 19.5, y: 75, s: 0.8 }, 'MJKI-42': { x: 29, y: 75, s: 0.8 },
    'VHVX-45': { x: 38.5, y: 75, s: 0.8 }, 'GAPY-25': { x: 48, y: 75, s: 0.8 }, 'ZUKG-03': { x: 57.5, y: 75, s: 0.8 },
    'PKNM-32': { x: 67, y: 75, s: 0.8 }, 'JRKW-82': { x: 76.5, y: 75, s: 0.8 }, 'PNOQ-92': { x: 86, y: 75, s: 0.8 },
  },
};
// 좌표 없는 단서(주로 2차에 열리는 휴대폰)는 스캐터 앵커로 떨어지는데, 그 자리가 손으로
//   매핑해 둔 소품 위일 수 있다. 폰은 objects 맨 뒤라 나중에 그려지고 z-index가 같아
//   클릭을 가로채므로, 겹침이 가장 적은 앵커를 고른다.
//   s형 상자는 CSS(.s-zone-wrap 6.7%x12%)와 같은 크기로 잡는다 — ±3%로 잡던 때는
//   세로를 절반으로 얕잡아 '겹침 최소' 계산 자체가 빗나갔다.
const boxOf = (p) => (p.w != null
  ? { x1: p.x - p.w / 2, x2: p.x + p.w / 2, y1: p.y - p.h / 2, y2: p.y + p.h / 2 }
  : { x1: p.x - 3.35 * (p.s || 1), x2: p.x + 3.35 * (p.s || 1), y1: p.y - 6 * (p.s || 1), y2: p.y + 6 * (p.s || 1) });
const overlap = (a, b) => Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1))
  * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));

const freeSpot = (loc, code) => {
  const mapped = ROOM_HOTSPOTS[loc.id] || {};
  // 인물 터치존·시신존도 '이미 찬 자리'다 — 그 위에 떨어지면 z10 터치존이 탭을 먼저 가져간다
  const taken = [...(loc.objects || []), '__talk__', '__body__']
    .filter((c) => mapped[c]).map((c) => boxOf(mapped[c]));
  const anchors = ANCHORS[anchorKind(loc)];
  // 좌표 없는 코드들끼리도 겹치지 않게, objects 순서대로 앞선 것들이 잡은 앵커는 뺀다
  const unmapped = (loc.objects || []).filter((c) => !mapped[c]);
  const used = new Set();
  let mine = anchors[0];
  for (const c of unmapped) {
    let best = null, bestScore = Infinity;
    for (let k = 0; k < anchors.length; k++) {
      if (used.has(k)) continue;
      const score = taken.reduce((s, t) => s + overlap(boxOf(anchors[k]), t), 0);
      if (score < bestScore) { bestScore = score; best = k; }
    }
    if (best == null) best = 0;
    used.add(best);
    if (c === code) { mine = anchors[best]; break; }
  }
  return mine;
};

export const hotspotFor = (loc, code, i) => ROOM_HOTSPOTS[loc.id]?.[code] || freeSpot(loc, code) || posFor(loc, i);

// ── 터치 판정(폰 세로 375x812 기준) ──────────────────────────────────────────
//   방 트랙은 화면보다 크게 깔린다(가로 1775px · 세로 990px). 그림 %좌표를 px로 옮기는 기준이자,
//   '손가락으로 누를 수 있는가'를 재는 자. 데스크톱은 트랙이 더 작아도 손이 아닌 마우스라 문제없다.
const TRACK_PX = { w: 1775, h: 990 };
const TOUCH_MIN = 44;                              // 손가락 최소 터치 크기
const MIN_W = TOUCH_MIN / TRACK_PX.w * 100;        // ≈2.48%
const MIN_H = TOUCH_MIN / TRACK_PX.h * 100;        // ≈4.44%
// 대사창(z8)은 핫스팟(z7)을 덮는다. 최대 하단 팬에서도 이 아래 %는 화면에 못 올라온다 —
//   좌표를 여기 두면 그 단서는 사실상 획득 불가다(지후방 운동화 흙이 그랬다).
const DIALOGUE_LIMIT_Y = 82;

// 히트박스 — 보이는 실루엣(테두리 SVG)은 그대로 두고 '누르는 판정'만 44px까지 넓힌다.
//   ① 44px 미달인 물건은 poly 클립을 벗긴다. 클립은 판정을 실루엣 안으로 더 깎아서,
//      가뜩이나 작은 물건을 절반 폭으로 만들어 버린다(풀 35px → 20px).
//   ② 넓히는 폭은 이웃(인물 터치존 포함)과의 간격까지. 넓혔더니 옆 단서가 눌리는
//      새 오탭을 만들면 안 되므로, 한 축이라도 떨어져 있으면 그대로 두고 아니면 줄인다.
//   ③ 네 방향을 따로 잡는다. 좌우(상하)를 똑같이 넓히면 이미 겹쳐 있던 이웃 쪽으로도 같이
//      커져서 원래 겹침이 확장분만큼 깊어졌다(종현방 수납통↔책더미 0.8%→5.1%).
//      막힌 쪽은 접고 반대쪽으로 몰아주면, 겹침을 그대로 둔 채 44px을 채울 수 있다.
const HIT_CACHE = new Map();
/** 폴리곤으로 깎고 나서도 44px 이 남는가 — poly 는 상자 안 로컬%라 그 실제 범위로 잰다. */
const polyKeepsTouch = (p, l, r, t, b) => {
  if (p.w == null) return true;                        // s형(고정 상자)은 애초에 클립이 없다
  if (!p.poly?.length) return true;
  const xs = p.poly.map((q) => q[0]), ys = p.poly.map((q) => q[1]);
  const fx = (Math.max(...xs) - Math.min(...xs)) / 100, fy = (Math.max(...ys) - Math.min(...ys)) / 100;
  return (p.w + l + r) / 100 * TRACK_PX.w * fx >= TOUCH_MIN
    && (p.h + t + b) / 100 * TRACK_PX.h * fy >= TOUCH_MIN;
};
// 확장분 배분 — 44px은 '어느 쪽으로 넓혔나'가 아니라 총 폭의 문제라, 한쪽이 막히면 반대쪽이 대신 받는다
const spread = (n, c1, c2) => {
  const a = Math.min(n, c1), b = Math.min(n, c2);
  return [Math.min(c1, a + (n - b)), Math.min(c2, b + (n - a))];
};
function buildHits(loc) {
  const mapped = ROOM_HOTSPOTS[loc.id] || {};
  const zones = [...(loc.objects || []), '__talk__', '__body__']
    .filter((c) => mapped[c]).map((c) => ({ c, p: mapped[c], b: boxOf(mapped[c]) }));
  const need = {}, cap = {};
  for (const z of zones) {
    need[z.c] = {
      x: z.p.w != null ? Math.max(0, (MIN_W - z.p.w) / 2) : 0,
      y: z.p.w != null ? Math.max(0, (MIN_H - z.p.h) / 2) : 0,
    };
    cap[z.c] = { l: Infinity, r: Infinity, t: Infinity, b: Infinity };
  }
  const lim = (c, side, v) => { cap[c][side] = Math.min(cap[c][side], Math.max(0, v)); };
  for (let i = 0; i < zones.length; i++) for (let j = i + 1; j < zones.length; j++) {
    const a = zones[i], b = zones[j];
    const gx = Math.max(b.b.x1 - a.b.x2, a.b.x1 - b.b.x2);   // 음수면 그 축으로 이미 겹친 깊이
    const gy = Math.max(b.b.y1 - a.b.y2, a.b.y1 - b.b.y2);
    if (gx < 0 && gy < 0) {
      // 이미 겹친 쌍 — 겹침 자체는 좌표로 풀 문제지만, 확장이 그걸 더 키우게 두면 안 된다.
      //   이웃 안쪽을 향한 면(넓히면 겹침이 깊어지는 면)만 막고, 바깥으로 나가는 면은 연다.
      if (a.b.x1 > b.b.x1) lim(a.c, 'l', 0);
      if (a.b.x2 < b.b.x2) lim(a.c, 'r', 0);
      if (a.b.y1 > b.b.y1) lim(a.c, 't', 0);
      if (a.b.y2 < b.b.y2) lim(a.c, 'b', 0);
      if (b.b.x1 > a.b.x1) lim(b.c, 'l', 0);
      if (b.b.x2 < a.b.x2) lim(b.c, 'r', 0);
      if (b.b.y1 > a.b.y1) lim(b.c, 't', 0);
      if (b.b.y2 < a.b.y2) lim(b.c, 'b', 0);
      continue;
    }
    const sx = need[a.c].x + need[b.c].x, sy = need[a.c].y + need[b.c].y;
    if ((gx >= 0 && gx >= sx) || (gy >= 0 && gy >= sy)) continue;  // 넓혀도 한 축은 떨어져 있다
    // 두 축 다 먹히면 간격이 더 넉넉한 축만 남겨 딱 맞닿는 데까지 줄인다(새 겹침 0)
    const rx = gx >= 0 && sx > 0 ? gx / sx : -1, ry = gy >= 0 && sy > 0 ? gy / sy : -1;
    const useX = rx >= ry, k = useX ? 'x' : 'y';
    const [as, bs] = useX ? (a.b.x2 <= b.b.x1 ? ['r', 'l'] : ['l', 'r'])
      : (a.b.y2 <= b.b.y1 ? ['b', 't'] : ['t', 'b']);
    lim(a.c, as, need[a.c][k] * (useX ? rx : ry));
    lim(b.c, bs, need[b.c][k] * (useX ? rx : ry));
  }
  const hits = {};
  for (const z of zones) {
    const [l, r] = spread(need[z.c].x, cap[z.c].l, cap[z.c].r);
    const [t, b] = spread(need[z.c].y, cap[z.c].t, cap[z.c].b);
    // 클립을 벗길지는 '클램프가 끝난 뒤' 최종 확장으로 정한다 — 클램프 전 수요로 정하던 때는
    //   이웃에 막혀 0.1px만 넓히고도 폴리곤 클립을 통째로 잃었다(종현방 파우치 YPYZ-13).
    //   상자 크기가 아니라 **폴리곤이 실제로 덮는 넓이**로 따져야 한다 — 상자가 딱 44px 이어도
    //   폴리곤이 그 안을 깎으면 판정은 44px 아래로 떨어진다(YPYZ-13 은 세로 44→38.7px 이었다).
    const grew = (l + r) / 100 * TRACK_PX.w >= 1 || (t + b) / 100 * TRACK_PX.h >= 1;
    hits[z.c] = { l, r, t, b, clip: !grew && polyKeepsTouch(z.p, l, r, t, b) };
  }
  return hits;
}
const NO_HIT = { l: 0, r: 0, t: 0, b: 0, clip: true };
export function hitBoxFor(loc, code) {
  let m = HIT_CACHE.get(loc.id);
  if (!m) { m = buildHits(loc); HIT_CACHE.set(loc.id, m); }
  return m[code] || NO_HIT;
}

// 좌표를 만질 때 바로 알아채라고 개발 빌드에서만 훑는다 — 화면에 뜨지도 않는 핫스팟은
//   플레이 중엔 '없는 단서'와 구별되지 않아, 실제로 눌러보기 전엔 아무도 모른다.
if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
  for (const [rid, map] of Object.entries(ROOM_HOTSPOTS)) {
    for (const [code, p] of Object.entries(map)) {
      if (code === '__talk__' || code === '__body__') continue;   // 인물·시신존은 커서 위쪽이 늘 보인다
      const b = boxOf(p);
      if (b.y2 > DIALOGUE_LIMIT_Y) console.warn(`[hotspot] ${rid} ${code}: 아래끝 ${b.y2.toFixed(1)}% — 대사창에 가려 못 누른다(${DIALOGUE_LIMIT_Y}% 이하로)`);
    }
  }
}

export const REVEAL = resolveTokens({
  order: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
  people: {
    S1: { role: '진범 · 직접 살해', text: '조장의 감사 진술 초안에서 자기 이름을 본 뒤 23:20에 결심했다. 03:05 후두부를 가격하고, 3분을 서서 지켜본 뒤 질식시켰다. 03:17 랩과 파렛트로 사고처럼 놓고 나왔다. 끝까지 부인한다.' },
    S2: { role: '구멍① · 졸음', text: '그날 밤 불려가고 싶지 않아 조장 텀블러에 자기 손목약을 서너 알 넣었다. 사인과는 무관하다 — 그 약이 한 일은 03:05에 등 뒤 발소리를 놓치게 한 것뿐이다.' },
    S3: { role: '구멍② · 가려진 렌즈', text: '「일 년 치를 다 본다」는 말을 듣고 00:30 C-3 카메라에 빈 상자를 얹었다. 감춘 것은 일 년치 절도다. 그 상자가 세 시간 사십일 분의 빈 화면을 만들었다.' },
    S4: { role: '구멍③ · 사라진 마스터키', text: '22:45 조장의 「여권 가지고 왔어」를 듣고, 그 여권이 조장 사물함에 있었다는 「상태」를 찍으려고 01:15 2층 열쇠함에서 사물함 마스터키를 가져갔다. 03:28 C통로에서 아직 따뜻한 조장과 시동 켜진 빈 지게차를 봤다. 조장 바지 주머니의 자기 여권을 빼냈지만 신고하지 않았다. 03:35 조장 사물함의 보관함을 찍었다.' },
    S5: { role: '구멍④ · 세러 간 조장', text: '전환 심사에 반출 건이 걸릴까 봐 조장 계정으로 전표 3건을 취소했다. 그 취소가 조장을 02:55에 C구역으로 보냈다. 가장 먼저 지목당하지만 무고하다.' },
    S6: { role: '구멍⑤ · 빈 지게차', text: '무면허가 드러날 공포에 다섯 달 만에 술을 마시고 혈압약과 함께 일찍 누웠다. 70분간 자리를 비웠고, 그사이 지게차를 누가 몰았는지 모른다. 03:41 갈림에서 시동 걸린 빈 지게차와 넘어진 파렛트를 봤지만 가 버렸다 — 20m 밖이라 그 아래는 보지 못했다.' },
  },
  essence: '다섯 사람이 각자 다른 이유로, 서로 모르게, 같은 밤에 구멍을 하나씩 냈다. 아무도 사람을 죽일 생각이 없었다. 여섯 번째 사람이 그 다섯을 전부 썼고 — 그것이 남의 손으로 만들어진 줄 지금도 모른다. 그는 그저 오늘 밤이 유난히 조용하다고 느꼈을 뿐이다.',
}, cast);

// 그날의 진실 — 시간 순(엔딩 공개용)
export const TIMELINE = resolveTokens([
  ['22:30', '교대. 게이트에 사원증이 스물다섯 번 찍힌다 — 한 사람이 두 번 찍는다({{S3}}이 {{S2}} 것을 대신).'],
  ['22:40', '조회. 「다음 주 본사 감사. 근태 기록도 전수로 봅니다. 걸릴 사람은 오늘 밤부터 오세요.」'],
  ['22:47', '부풀려진 소문이 B구역 랙 사이를 지난다 — 「전수로 본대. 일 년 치를 다.」 {{S3|이/가}} 굳는다.'],
  ['22:50', '흡연장. 조장이 {{S5}}에게 「이번엔 어렵겠다」. 목소리가 커진다 — 여럿이 봤다.'],
  ['23:20', '흡연장. {{S1|이/가}} 조장에게서 「어제 이미 말씀드렸다」를 듣는다. **여기서 결심한다.**'],
  ['00:30', '{{S3|이/가}} 1단 빔에 올라서 C-3 렌즈에 빈 상자를 얹는다. 04:11까지 검은 화면.'],
  ['01:15', '{{S4|이/가}} 2층 사무실 열쇠함에서 사물함 마스터키를 가져간다.'],
  ['01:40', '{{S5|이/가}} 조장 계정으로 자재 반출 전표 3건을 취소한다. 01:46 B구역으로 돌아온다.'],
  ['02:30', '{{S6|이/가}} 지게차 충전을 걸고 배터리실에 눕는다 — 03:40까지 70분간 자리를 비운다.'],
  ['02:35', '조장이 휴게실 끝자리에 내려앉는다. {{S2}}가 탄 약이 도는 시간이다.'],
  ['02:50', '조장이 태블릿 관리자 조회에서 「내 이름으로 취소된 전표 3건」을 본다. 동시에 센터장 카톡 — 「내일 오전 감사팀이 자재 실사부터」.'],
  ['02:52', '조장이 무전으로 행선지를 알린다 — C구역. 숨길 일이 아니었다. {{S1|이/가}} 그 무전을 듣는다.'],
  ['02:55~03:04', '조장이 전표 목록 3장을 들고 하나씩 센다. 세 줄 다 「없음」. 수첩에 「→ 도경이랑 얘기」를 덧붙인다.'],
  ['03:05', '{{S1|이/가}} 후두부를 가격한다. 조장이 의식을 잃는다. **여기서 걸어 나갔다면 사고였다.**'],
  ['03:05~08', '3분. {{S1|은/는}} 그 자리에 서서 지켜본다.'],
  ['03:08~12', '질식. 03:13 사망.'],
  ['03:13', '{{S1|이/가}} 수첩에서 6~7월을 찢는다. 거기 적혀 있던 것은 「장현 6/3~7/28 (출산)」이었다.'],
  ['03:17', '파렛트를 넘어뜨려 사고처럼 놓는다. 「쿵, 끌림」 — {{S4|이/가}} D 작업대에서 그 소리를 듣는다. 지게차 소리로 안다.'],
  ['03:24', '{{S1|이/가}} 조장 태블릿에서 관리자 조회를 누른다. 취소 이력이 로그에 남는다.'],
  ['03:28', '{{S4|이/가}} 탈의실로 가던 길, 갈림에서 시동 켜진 빈 지게차를 보고 C통로에 들어간다. 몸이 아직 따뜻했다. 바지 주머니의 자기 여권을 빼내고, 신고하지 않는다.'],
  ['03:35', '{{S4|이/가}} 조장 사물함의 여권 보관함 — 자기 이름표가 붙은 빈 칸 — 을 찍는다.'],
  ['03:41', '{{S6|이/가}} 갈림에서 시동 걸린 빈 지게차와 넘어진 파렛트를 본다. 20m 밖이라 그 아래는 보지 못했다. 가지 않는다 — 03:43 지게차를 되돌리고 키를 뽑는다.'],
  ['04:10', '{{S3|이/가}} 발견한다. 03:17부터 53분이 지나 있었다.'],
  ['04:11', 'C-3 카메라에서 상자가 걷힌다. 손과 작업복 가슴의 이름표가 렌즈를 스친다.'],
  ['04:15', '{{S1|이/가}} 112와 119에 신고한다.'],
], cast);
// 풀블리드 VN 화면: 버튼·시트·오버레이가 아닌 곳을 탭하면 대사 넘김(대사창 tap 위임)
export const isUiTap = (e) => !!e.target.closest('button, .aa-ask, .aa-present, .aa-dialogue, .aa-hud, .aa-hp, .s-modal');

// 채점 — 범인 한 명만 지목(S1 = 서장현, 진범)
//   야간조는 공범이 없다. 나머지 다섯은 구멍을 냈을 뿐이라 지목 대상이 아니다.
// 정답/오답은 범인으로 가른다. 수법·동기는 범인을 맞혔을 때만 진범(S1)의 것과 맞는지 매긴다 —
//   범인을 틀리고 「✓ 수법」이 뜨면 부분 점수처럼 보이지만 아무것도 가르지 못했다(3회차 #2).
export function scoreCase(casefile) {
  const pick = casefile?.culprit || null;   // S1 = 서장현(진범)
  const right = pick === 'S1';
  return {
    culpritRight: right, pick,
    method: casefile?.method || null, methodRight: right && casefile?.method === 'm_kill',
    motive: casefile?.motive || null, motiveRight: right && casefile?.motive === 'mo_draft',
  };
}
