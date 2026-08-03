// ─────────────────────────────────────────────────────────────────────────────
// soloContent — 솔로 추리게임용 콘텐츠 레이어.
//   같은 정본(gameData) + provider(단서 조회·비번검증·해금계산)를 재활용해,
//   "장소(장면)→물건(단서)" 배치와 용의자/피해자/브리핑/채점정답을 구성한다.
//   QR/운영자 흐름을 "혼자 탐색+퍼즐 해금"으로 재해석하되 콘텐츠는 100% 재사용.
// ─────────────────────────────────────────────────────────────────────────────
import { provider } from '../services/index.js';
import { victim as _victim, suspects as _suspects } from '../data/gameData.js';
import { keyByPersonName } from '../data/cast.js';
import { TESTIMONY } from './interrogation.js';

const all = provider.getAllClues();
const byCode = Object.fromEntries(all.map((c) => [c.code, c]));
const cctvSet = new Set(provider.getCctvClueCodes());

// 증언 단서(대화로 확보) — 단서 조회에서 함께 해석되도록 code 형태로 정규화.
const testimonyByCode = Object.fromEntries(
  Object.entries(TESTIMONY).map(([code, t]) => [code, { code, title: t.title, type: '증언', person: t.person, desc: t.detail, detail: t.detail }]),
);

// 게임 메타(설명서 등) — 솔로는 자체 브리핑/튜토리얼이 있으므로 인게임 단서에서 제외
const META_CODES = new Set(['LSUX-91']);

// 방(장소) 항목: type '방'
const roomEntries = all.filter((c) => c.type === '방');
const roomObjectCodes = new Set(
  roomEntries.flatMap((r) => (r.room?.objects || []).map((o) => (typeof o === 'string' ? o : o.code))),
);

// 다른 단서의 페이지를 펼치면 확보되는 하위 단서(예: 성경책 속 아이 그림) — 방 소품으로 따로 뿌리지 않는다.
const pageUnlockCodes = new Set(all.flatMap((c) => (c.pages || []).map((p) => p.unlocks).filter(Boolean)));

// 인물명 → 방 코드 (해당 인물 방에 소품 배치용)
const personRoom = Object.fromEntries(roomEntries.map((r) => [r.person, r.code]));

// 방 배경 톤(스타일라이즈드) — 인물/피해자별 분위기
// 조회 키가 단서의 person(이름)이라 cast 에서 뽑는다 — 캐스팅을 바꿔도 따라온다.
const ROOM_BG = keyByPersonName({
  S1: 'linear-gradient(160deg,#1b2430,#0d141c)',
  S2: 'linear-gradient(160deg,#241b2e,#120d1a)',
  S3: 'linear-gradient(160deg,#0f2422,#08140f)',
  S4: 'linear-gradient(160deg,#2a2410,#14110a)',
  S5: 'linear-gradient(160deg,#2b1620,#160a10)',
  S6: 'linear-gradient(160deg,#1a1730,#0c0a18)',
  '목사': 'linear-gradient(160deg,#241012,#12080a)',
});

const clueIcon = (c) => {
  if (!c) return '📦';
  if (c.type === '증언') return '🗣';
  if (c.cctv) return '📹';
  if (c.phone) return '📱';
  if (c.type === '감식') return '🔬';
  if (c.type === '특수') return '⭐';
  if (c.pages) return '📖';
  if (c.wallet) return '👛';
  if (c.schedule) return '📅';
  if (/약|정|캡슐|통/.test(c.title || '')) return '💊';
  return '🔎';
};

// ── 장소(scene) 구성 ─────────────────────────────────────────────────────────
// 1) 각 인물 방 = room.objects
// 2) 방에 안 속한 나머지 단서를 성격별 특수 장소로 편입:
//    CCTV 열람실 / 압수 소지품(폰) / 감식 의뢰실 / 공용 현장. (특수=자동해금, 미배치)
function buildLocations() {
  // 수사 단계(stage): 1=탐문(용의자 방·소지품) · 2=중간점검(목사방 현장·감식·CCTV) · 3=2부(폰)
  const rooms = roomEntries.map((r) => ({
    id: r.code,
    kind: 'room',
    label: r.room?.label || r.title,
    person: r.person,
    stage: r.person === '목사' ? 2 : 1,   // 목사방(현장)은 중간점검에 개방
    bg: ROOM_BG[r.person] || 'linear-gradient(160deg,#1c2230,#0c1018)',
    showBody: !!r.room?.showBody,
    body: r.room?.body || null,
    objects: (r.room?.objects || []).map((o) => (typeof o === 'string' ? o : o.code)).filter((code) => byCode[code]),
  }));

  const cctv = [], cctvInner = [], gamsik = [], common = [];
  for (const c of all) {
    if (META_CODES.has(c.code)) continue;
    if (c.type === '방') continue;
    if (pageUnlockCodes.has(c.code)) continue;         // 다른 단서 속에서 열리는 하위 단서(성경책 속 아이 그림 등)
    if (roomObjectCodes.has(c.code)) continue;         // 이미 방에 배치됨
    if (c.type === '특수') continue;                    // 자동 해금(수첩에 등장)
    if (c.cctv) { cctv.push(c.code); continue; }        // CCTV 열람대(공용대·뷰어) = 방 핫스팟 1개
    if (cctvSet.has(c.code)) { cctvInner.push(c.code); continue; }  // CCTV로 확보되는 하위 단서 — 방에 안 뿌리고 inner 로만(아래)
    if (c.type === '감식') { gamsik.push(c.code); continue; }
    // 휴대폰(c.phone)·방 없는 보통/기타 → 인물 방이 있으면 그 방에(폰은 2차 심문에 해금), 없으면 공용 현장
    const pr = personRoom[c.person];
    const room = rooms.find((r) => r.id === pr);
    if (room) room.objects.push(c.code); else common.push(c.code);
  }

  const tools = [];
  // inner = 그 장소의 단서지만 방 화면에 핫스팟으로 뿌리지 않는 것(열람대 안에서 확보하는 CCTV 컷).
  //   objects 에 넣으면 열람실 벽에 핫스팟이 16개 생기고, 빼면 열람대 하나로 '탐색완료'가 되어
  //   2·3막 모순 대부분이 든 컷들을 다 본 것처럼 보인다 → 렌더는 objects, 진척·알림은 objects+inner.
  if (cctv.length) tools.push({ id: 'LOC-CCTV', kind: 'cctv', label: 'CCTV 열람실', stage: 2, bg: 'linear-gradient(160deg,#101820,#080c10)', objects: cctv, inner: cctvInner });
  if (gamsik.length) tools.push({ id: 'LOC-LAB', kind: 'lab', label: '감식 의뢰실', stage: 2, bg: 'linear-gradient(160deg,#0e1a1c,#070f10)', objects: gamsik });
  // 공용 현장(LOC-COMMON)은 폐지 — 방/시설에 안 속한 단서(사건 브리핑 등)는 시작 시 사건 기록에 기본 수록.

  return { rooms, tools, all: [...rooms, ...tools], starting: common };
}

// ── 브리핑(스포일러 없음) ────────────────────────────────────────────────────
const briefing = {
  title: '새벽이슬 크라임씬',
  subtitle: '수련회에서 벌어진 죽음 — 당신은 수사관입니다',
  victim: _victim,
  lines: [
    `수련회 마지막 날, 샛별이슬 교회 청년부 담임 ${_victim.name}(${_victim.age})이 개인 방에서 숨진 채 발견되었습니다.`,
    '협심증 병력이 있었지만, 1차 부검은 단순 발작사로 보기 어려운 정황을 남겼습니다.',
    '사건 당시 현장에 있던 청년부 임원 6명이 용의자입니다.',
    '각 방과 현장을 탐색해 단서를 모으고, 용의자를 심문해, 누가·어떻게·왜 죽였는지 밝혀내세요.',
  ],
};

// ── 용의자/피해자 ────────────────────────────────────────────────────────────
const suspects = _suspects.map((s) => ({ ...s }));
const victim = { ..._victim };

// ── 채점 정답표 (진상해설서 기준) ────────────────────────────────────────────
//   역할 + 결정적 행위(method) + 동기(motive). 오답 보기를 섞어 추리 퀴즈로.
const ROLES = ['진범', '가담', '증거인멸', '무고'];
const METHODS = [
  { id: 'm_pillow', label: '베개로 질식시킴' },
  { id: 'm_label', label: '보충제 라벨을 바꿔 요힘빈을 먹게 함' },
  { id: 'm_sleep', label: '텀블러에 수면제를 탐' },
  { id: 'm_pill', label: '설하정(응급약)을 비타민으로 바꿔치기' },
  { id: 'm_delete', label: '피해자 폰의 기록을 삭제함' },
  { id: 'm_poison', label: '음료에 독극물을 직접 넣음' },
  { id: 'm_none', label: '가담하지 않음(무고)' },
];
const MOTIVES = [
  { id: 'mo_cert', label: '위조 수료증이 들통날 위기' },
  { id: 'mo_debt', label: '횡령·빚이 드러날 위기' },
  { id: 'mo_sister', label: '동생을 지키기 위해' },
  { id: 'mo_engage', label: '파혼·숨긴 비밀을 지키려고' },
  { id: 'mo_song', label: '찬양곡 갈등의 앙심' },
  { id: 'mo_diet', label: '다이어트 보충제 관련' },
  { id: 'mo_none', label: '동기 없음(무고)' },
];
// id(S1..S6) 기준 정답
const caseAnswers = {
  S4: { role: '진범', method: 'm_pillow', motive: 'mo_cert' },      // 박희원
  S5: { role: '가담', method: 'm_label', motive: 'mo_debt' },        // 이사랑
  S3: { role: '가담', method: 'm_sleep', motive: 'mo_sister' },      // 이현지
  S6: { role: '증거인멸', method: 'm_delete', motive: 'mo_engage' }, // 이가현
  S1: { role: '무고', method: 'm_none', motive: 'mo_none' },         // 최종현
  S2: { role: '무고', method: 'm_none', motive: 'mo_none' },         // 윤은재
};

const _locations = buildLocations();

export const soloContent = {
  briefing,
  suspects,
  victim,
  locations: _locations,
  // 목사방(현장) 단서 코드 — 단계 2→3 진행 판정에 사용
  crimeSceneCodes: (_locations.rooms.find((r) => r.person === '목사')?.objects) || [],
  suspectIds: suspects.map((s) => s.id),
  // 시작 시 사건 기록에 기본 수록되는 단서(사건 브리핑 등) — 공용 현장 폐지 대체
  startingClues: _locations.starting || [],
  caseKey: { roles: ROLES, methods: METHODS, motives: MOTIVES, answers: caseAnswers },
  getClue: (code) => byCode[code] || testimonyByCode[code] || null,
  clueIcon,
  // 특수 단서: 현재 보유 단서로 자동 해금되는 코드 목록
  computeAutoUnlocked: (codeSet) => provider.computeAutoUnlocked(codeSet),
  // 감식 단서 코드 집합 — 자동 수령 대신 '의뢰 → 2차 심문 때 결과 도착' 흐름에 사용
  gamsikCodes: new Set(all.filter((c) => c.type === '감식').map((c) => c.code)),
  // 이 감식이 지금 의뢰 가능한가(채취물=선행 단서를 모았는가)
  gamsikReady: (code, collected) => {
    const s = new Set(collected);
    provider.computeAutoUnlocked(s);
    return s.has(code);
  },
  provider,
};

export default soloContent;
