// ─────────────────────────────────────────────────────────────────────────────
// 야간조 솔로 — 콘텐츠 레이어. src/solo/soloContent.js 의 야간조판이다.
//
//   새벽이슬판은 「방에 안 들어간 단서」를 성격별로 모아 CCTV 열람실·감식 의뢰실을
//   **합성해서** 만들었다. 야간조는 그럴 필요가 적다 — 데이터팩이 이미 방 13개를
//   가지고 있고, 그 안에 공용 공간 넷(서쪽·충전소·동쪽·2층)과 **관제실 열람대**가
//   들어 있다. 그래서 여기서 합성하는 장소는 **감식 의뢰실 하나뿐**이다.
//
//   ── 단계는 보드판 「부」를 그대로 따른다 ──────────────────────────────────
//     1차 탐문  = 1부 · 인물의 칸 A~F
//     중간 점검 = 2부 현장 X·조장의 칸 P + 3부 공용 W·N·J·U + 4부 카메라 V + 감식
//     2차 심문  = 5부 기록 대조 Q 7장 (그때 도착한다)
//   보드판에서 2부에 배포되는 Q 를 솔로에서 3단계로 미루는 것은, 새벽이슬이
//   휴대폰을 3단계로 미룬 것과 같은 이유다 — 2차 심문에 들고 갈 패가 있어야 한다.
// ─────────────────────────────────────────────────────────────────────────────
import { provider, scenario } from './services.js';
import { keyByPersonName } from '../../scenarios/yaganjo/cast.js';
import { TESTIMONY } from './interrogation.js';

const all = provider.getAllClues();
const byCode = Object.fromEntries(all.map((c) => [c.code, c]));

// 증언 단서(대화로 확보) — 단서 조회에서 함께 해석되도록 code 형태로 정규화.
const testimonyByCode = Object.fromEntries(
  Object.entries(TESTIMONY).map(([code, t]) => [code, { code, title: t.title, type: '증언', person: t.person, desc: t.detail, detail: t.detail }]),
);

// 2차 심문에 도착하는 기록 대조 7장(보드판 Q1~Q7). 1·2단계에서는 장소에 뿌리지 않는다.
const RECORD_CODES = ['MCAD-69', 'GELH-98', 'MKYI-94', 'NPQD-05', 'KBPA-97', 'KFTR-79', 'TEWB-88'];
const recordSet = new Set(RECORD_CODES);

// 조장 태블릿은 2층 사무실 거치대에 있던 물건이다(정본 §10 · 단서 본문).
// 데이터팩에서 어느 방 objects 에도 안 들어가 있어서, 여기서 2층 방에 얹는다.
const TABLET_CODE = 'ZVLJ-37';
const TABLET_ROOM = 'ROOM-U';

// 공개 게시물 2장 — 가져갈 수 없는 판 위의 물건이다. 솔로에서는 사건 기록에 기본 수록.
const PUBLIC_CODES = ['UTAY-40', 'VEVM-47'];

// 방 배경 톤. 심야 물류센터라 전체가 차갑고, 사람 칸만 조금씩 다르다.
//   조회 키가 단서의 person(이름)이라 cast 에서 뽑는다 — 캐스팅을 바꿔도 따라온다.
const ROOM_BG = {
  ...keyByPersonName({
    S1: 'linear-gradient(160deg,#152232,#080e16)', // 서장현 — 형광등 아래 파랑
    S2: 'linear-gradient(160deg,#101f1c,#06110e)', // 차민우 — 초록빛
    S3: 'linear-gradient(160deg,#241611,#110907)', // 오정숙 — 붉은 기
    S4: 'linear-gradient(160deg,#1d1730,#0d0a18)', // 흐엉   — 보라
    S5: 'linear-gradient(160deg,#261320,#120810)', // 윤도경 — 자주
    S6: 'linear-gradient(160deg,#1d2012,#0d0f08)', // 임기석 — 올리브
  }),
  조장: 'linear-gradient(160deg,#1a1a1d,#0b0b0d)',
  공용: 'linear-gradient(160deg,#141a20,#080c10)',
};

const clueIcon = (c) => {
  if (!c) return '📦';
  if (c.type === '증언') return '🗣';
  if (c.cctv) return '📹';
  if (c.phone) return '📱';
  if (c.type === '감식') return '🔬';
  if (c.type === '특수') return '⭐';
  if (c.pages) return '📖';
  if (/일지|명부|전표|장부|공문|각서|통지/.test(c.title || '')) return '📄';
  if (/열쇠|키/.test(c.title || '')) return '🔑';
  return '🔎';
};

// ── 장소(scene) 구성 ─────────────────────────────────────────────────────────
//   방 13개는 데이터팩이 준 그대로 쓴다. 단계만 여기서 매긴다.
const STAGE_BY_ROOM = {
  'ROOM-A': 1, 'ROOM-B': 1, 'ROOM-C': 1, 'ROOM-D': 1, 'ROOM-E': 1, 'ROOM-F': 1,
  'ROOM-X': 2, 'ROOM-P': 2, 'ROOM-W': 2, 'ROOM-N': 2, 'ROOM-J': 2, 'ROOM-U': 2,
  'ROOM-V': 2,
};

function buildLocations() {
  const roomEntries = all.filter((c) => c.type === '방');

  const rooms = roomEntries.map((r) => {
    const objects = (r.room?.objects || [])
      .map((o) => (typeof o === 'string' ? o : o.code))
      .filter((code) => byCode[code]);
    if (r.code === TABLET_ROOM && byCode[TABLET_CODE] && !objects.includes(TABLET_CODE)) {
      objects.push(TABLET_CODE);
    }
    return {
      id: r.code,
      kind: r.code === 'ROOM-V' ? 'cctv' : 'room',
      label: r.room?.label || r.title,
      person: r.person,
      stage: STAGE_BY_ROOM[r.code] ?? 2,
      bg: ROOM_BG[r.person] || 'linear-gradient(160deg,#141a20,#080c10)',
      showBody: !!r.room?.showBody,
      body: r.room?.body || null,
      objects,
    };
  });

  // 감식 의뢰실 — 유일하게 합성하는 장소다. 채취물을 모아야 의뢰가 열린다.
  const gamsik = all.filter((c) => c.type === '감식').map((c) => c.code);
  const tools = [];
  if (gamsik.length) {
    tools.push({
      id: 'LOC-LAB', kind: 'lab', label: '감식 의뢰실', stage: 2,
      bg: 'linear-gradient(160deg,#0e1a1c,#070f10)', objects: gamsik,
    });
  }

  return { rooms, tools, all: [...rooms, ...tools], starting: PUBLIC_CODES.filter((c) => byCode[c]) };
}

// ── 브리핑(스포일러 없음) ────────────────────────────────────────────────────
const briefing = {
  title: '야간조',
  subtitle: '심야 물류센터에서 벌어진 죽음 — 당신은 수사관입니다',
  victim: scenario.victim,
  lines: [
    'GH로지스 3센터. 심야조 스물다섯이 밤새 돌아가는 물류창고입니다.',
    `04:10, 동쪽 C통로 안쪽에서 심야조 조장 ${scenario.victim.name}(47)이 넘어진 파렛트 아래에서 발견되었습니다.`,
    '1차 소견은 압사이고, 사망 추정 시각은 03:00~03:30입니다. 사고로 보입니다.',
    '그러나 C-3 카메라는 00:30부터 04:11까지 검은 화면이었고, 지게차는 70분간 자리를 비웠으며, 잠겨 있어야 할 사무실이 열려 있었습니다.',
    '그날 밤 동쪽에 닿을 수 있었던 여섯 명이 용의자입니다. 각 칸과 현장을 탐색해 단서를 모으고, 여섯을 심문해, 누가·어떻게·왜 죽였는지 밝혀내세요.',
  ],
};

// ── 용의자/피해자 ────────────────────────────────────────────────────────────
const suspects = scenario.suspects.map((s) => ({ ...s }));
const victim = { ...scenario.victim };

// ── 채점 정답표 (정본 §5 「다섯 개의 구멍」 · §6 인물) ────────────────────────
//   야간조는 공범이 없다. 한 사람이 죽였고, 나머지 다섯은 각자 다른 이유로 그날 밤
//   구멍을 하나씩 냈다 — 죽일 생각은 아무도 없었다. 그래서 역할은 셋뿐이고,
//   변별은 「그날 밤 무엇을 했는가(method)」와 「왜(motive)」가 진다.
const ROLES = ['진범', '구멍을 낸 사람', '무관'];
const METHODS = [
  { id: 'm_kill', label: '뒤에서 가격하고 파렛트를 넘어뜨려 사고로 위장' },
  { id: 'm_tumbler', label: '조장 텀블러에 약을 타 졸게 만듦' },
  { id: 'm_lens', label: 'C-3 카메라에 빈 상자를 얹어 렌즈를 가림' },
  { id: 'm_key', label: '마스터키를 가져가 사무실을 열어 둠' },
  { id: 'm_void', label: '조장 계정으로 반출 전표 3건을 취소' },
  { id: 'm_absent', label: '지게차를 70분간 비우고 배터리실에서 잠' },
  { id: 'm_none', label: '한 일이 없음(무관)' },
];
const MOTIVES = [
  { id: 'mo_draft', label: '감사 진술 초안에 자기 이름이 적혀 있었다' },
  { id: 'mo_turn', label: '오늘 밤 자기 차례가 오지 않게' },
  { id: 'mo_theft', label: '지난 일 년치 절도를 감추려고' },
  { id: 'mo_passport', label: '사물함 속 여권을 찍으려고' },
  { id: 'mo_review', label: '전환 심사에 반출 건이 걸릴까 봐' },
  { id: 'mo_license', label: '무면허가 드러날 공포 — 술과 혈압약' },
  { id: 'mo_none', label: '동기 없음(무관)' },
];
// id(S1..S6) 기준 정답
const caseAnswers = {
  S1: { role: '진범', method: 'm_kill', motive: 'mo_draft' },              // 서장현
  S2: { role: '구멍을 낸 사람', method: 'm_tumbler', motive: 'mo_turn' },   // 차민우
  S3: { role: '구멍을 낸 사람', method: 'm_lens', motive: 'mo_theft' },     // 오정숙
  S4: { role: '구멍을 낸 사람', method: 'm_key', motive: 'mo_passport' },   // 흐엉
  S5: { role: '구멍을 낸 사람', method: 'm_void', motive: 'mo_review' },    // 윤도경
  S6: { role: '구멍을 낸 사람', method: 'm_absent', motive: 'mo_license' }, // 임기석
};

const _locations = buildLocations();

export const soloContent = {
  briefing,
  suspects,
  victim,
  locations: _locations,
  // 현장(C통로) 단서 코드 — 단계 2→3 진행 판정에 쓴다
  crimeSceneCodes: (_locations.rooms.find((r) => r.id === 'ROOM-X')?.objects) || [],
  suspectIds: suspects.map((s) => s.id),
  // 시작 시 사건 기록에 기본 수록되는 단서(공개 게시물 2장)
  startingClues: _locations.starting || [],
  // 2차 심문 개방 때 도착하는 기록 대조 7장
  recordCodes: RECORD_CODES.filter((c) => byCode[c]),
  isRecordCode: (code) => recordSet.has(code),
  caseKey: { roles: ROLES, methods: METHODS, motives: MOTIVES, answers: caseAnswers },
  getClue: (code) => byCode[code] || testimonyByCode[code] || null,
  clueIcon,
  computeAutoUnlocked: (codeSet) => provider.computeAutoUnlocked(codeSet),
  gamsikCodes: new Set(all.filter((c) => c.type === '감식').map((c) => c.code)),
  gamsikReady: (code, collected) => {
    const s = new Set(collected);
    provider.computeAutoUnlocked(s);
    return s.has(code);
  },
  provider,
};

export default soloContent;
