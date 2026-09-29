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
import { keyByPersonName, t as castT } from '../../scenarios/yaganjo/cast.js';
import { TESTIMONY } from './interrogation.js';

const all = provider.getAllClues();
// 공개 게시물 ①(UTAY-40) — 보드판은 진행자가 펴 두는 글이라 해설이 붙어 있다. 솔로는 한 줄씩, 말한 사람을 제목에.
//   줄마다 실마리가 하나씩 있다 — 빈 자리를 누가 대신 대답했다(차민우 태그) · 키는 컵홀더(흐엉) · 자격 대장(임기석 무면허).
{
  const i = all.findIndex((c) => c.code === 'UTAY-40');
  if (i >= 0 && all[i].pages?.length === 4) {
    const [p1] = all[i].pages;
    all[i] = { ...all[i], pages: [p1,
      { title: castT('22:40 조회 — 조장 {{victim|이/가}} 한 말'),
        content: '· 다음 주 본사 감사. 근태 기록도 전수로 본다.\n\n· 기록에 걸릴 게 있으면 오늘 밤부터 조장에게 와서 말하라 — 조장이 정리해 올린다.\n\n· 그날 조회에 한 자리가 비었고, 다른 사람이 대신 대답했다.' },
      { title: '해산길에 돈 말 — 누가 했는지는 모른다',
        content: '· "CCTV도 이번에 싹 본다더라" — 공문에는 없는 말이다.' },
      { title: '현장 상식 — 이 센터에서는',
        content: '· 반품 사유 스티커는 셋: 「반품·단순변심」 「파손」 「오배송」\n\n· 지게차 키는 컵홀더에 꽂아 두고, 아침에 다음 사람이 꺼내 간다\n\n· 자격 대장에는 지게차 운전기능사 사본과 운전면허 사본이 함께 붙는다' },
    ] };
  }
}
const byCode = Object.fromEntries(all.map((c) => [c.code, c]));

// 증언 단서(대화로 확보) — 단서 조회에서 함께 해석되도록 code 형태로 정규화.
const testimonyByCode = Object.fromEntries(
  Object.entries(TESTIMONY).map(([code, t]) => [code, { code, title: t.title, type: '증언', person: t.person, desc: t.detail, detail: t.detail }]),
);

// ── 솔로에서 새로 생기는 기록 ───────────────────────────────────────────────
//   보드판에서는 사람이 소리 내어 읽으면 그만인 것이, 앱에서는 「들고 있는 것」이어야
//   인물에게 들이밀 수 있다. 그래서 기록으로 만든다. **본문은 지어내지 않는다** —
//   전부 데이터팩이나 보드판 진행물의 문장 그대로다.
const tabletLookup = byCode['ZVLJ-37']?.phone?.apps?.find((a) => a.type === 'browser')?.lookup;
const q2seg = byCode['GELH-98']?.segment2;
const NL = String.fromCharCode(10);
export const LOOKUP_CODE = 'LOOKUP-ZVLJ-37';
export const AUTOPSY1_CODE = 'AUTOPSY-1';
export const AUTOPSY_CODE = 'AUTOPSY-2';
// 텀블러 감식(IJEO-08)을 받은 판에만 붙는 2차 부검 보충 — 맡기지 않은 사람에게 텀블러 성분을 공짜로 알리던 것(5회차 #1)
export const AUTOPSY_TUMBLER_CODE = 'AUTOPSY-2T';
export const Q2SEG_CODE = 'GELH-98-2';
const DERIVED = {
  // 태블릿 lookup.result 그대로 — 관리자 조회에 성공하면 들어온다
  [LOOKUP_CODE]: {
    code: LOOKUP_CODE, type: '보통', person: '조장',
    title: '조장 태블릿 — 관리자 조회 결과',
    description: '관리자 사번과 네 자리로 연 「전표 상태 · 조회 이력」 화면.',
    detail: (tabletLookup?.result?.lines || []).join(NL),
  },
  // 보드판 6인 시작 시트 절 ④-1 그대로 — 시작부터 사건 기록에 있다. 2차 부검 뒤에 다시 읽을 자리다.
  [AUTOPSY1_CODE]: {
    code: AUTOPSY1_CODE, type: '보통', person: '조장',
    title: '1차 검안 소견서',
    description: '여섯 줄. 판단은 붙어 있지 않다. 검안의는 압사라고 적었다.',
    detail: [
      '1. 사망 추정 03:00~03:30. 직장 온도와 강직 정도로 잡은 범위다.',
      '2. 후두부에 타박흔 하나. 함몰은 없다. 검안의는 「전도 시 2차 충격 가능」으로 적었다.',
      '3. 얼굴 전면에 옅고 고른 눌림 자국. 검안의는 「판재 압박흔으로 추정」으로 적었다.',
      '4. 양쪽 눈꺼풀 안쪽에 점상 출혈. 검안의는 「흉부 압박에 의한 것으로 추정」으로 적었다.',
      '5. 손톱 밑에 투명한 조각. 현장에 랩이 널려 있어 채취만 하고 판단은 보류했다.',
      '6. 안전화는 제대로 신겨져 있었고 끈이 묶여 있었다.',
      '',
      '소지품은 수첩 · 무전기 · 사원증 · 휴대폰 · 사무실 열쇠 · 담배와 라이터. 현재까지 없어진 것은 없다고 보고 있다.',
    ].join(NL),
  },
  // 보드판 진행물 「④ 2차 부검」 앞면·뒷면 그대로 — 2차 심문이 열릴 때 들어온다
  [AUTOPSY_CODE]: {
    code: AUTOPSY_CODE, type: '보통', person: '조장',
    title: '2차 부검 소견',
    description: '국과수 정밀 부검 결과. 1차 소견(압사)이 뒤집혔다.',
    detail: [
      '사인은 질식입니다. 얼굴에 랩이 감겨 있었습니다. 후두부를 뒤에서 맞으셨고요.',
      '돌아가신 시각은 03:00에서 03:30 사이. 1차 소견과 같습니다.',
      '파렛트에 눌린 흔적은 사후입니다. 얼굴과 코 주변에서 필름 점착 성분이 나왔고, 손톱 밑에서 랩 조각이 나왔습니다.',
    ].join(NL + NL),
  },
  [AUTOPSY_TUMBLER_CODE]: {
    code: AUTOPSY_TUMBLER_CODE, type: '보통', person: '조장',
    title: '2차 부검 보충 — 텀블러',
    description: '맡긴 텀블러 잔여물 감식과 정밀 부검을 맞대 본 보충 소견.',
    detail: '텀블러에서 나온 성분은 사인과 관계없습니다. …뒤에서 오는 건 멀쩡한 사람도 못 봤을 겁니다.',
  },
  // 데이터팩 GELH-98.segment2 그대로 — 「없어진 두 달」(AOBI-88)이 선 뒤에 들어온다
  ...(q2seg ? { [Q2SEG_CODE]: { code: Q2SEG_CODE, type: '보통', person: byCode['GELH-98'].person, ...q2seg } } : {}),
};

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
      label: r.code === 'ROOM-P' ? '조장 사물함'
        : (r.person && r.person !== '조장' && r.person !== '공용' && !r.room?.showBody) ? `${r.person} — 사물함과 소지품`
        : (r.room?.label || r.title),
      person: r.person,
      stage: STAGE_BY_ROOM[r.code] ?? 2,
      bg: ROOM_BG[r.person] || 'linear-gradient(160deg,#141a20,#080c10)',
      showBody: !!r.room?.showBody,
      body: r.room?.body || null,
      objects,
      // 조장의 칸 — 보드판 이벤트 ② 「사물함은 자물쇠가 걸려 있고 열쇠가 나오지 않아 아직 열지 못했다」.
      //   흐엉의 칸에서 나오는 사물함 마스터키(D1)가 있어야 연다.
      ...(r.code === 'ROOM-P' ? { lockedBy: 'OIXS-24', lockedMsg: '🔒 조장 사물함은 자물쇠가 걸려 있다 — 열쇠가 아직 나오지 않았다' } : {}),
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
    '1차 소견은 압사이고, 사망 추정 시각은 03:00~03:30입니다. 사고로 보고 있습니다.',
    // 아래 두 줄은 보드판 6인 시작 시트 절③·⑦ 문장이다. 「지게차 70분」·「잠겨 있어야 할
    //   사무실」은 틀린 말이라 뺐다 — 지게차가 자리를 비운 것은 30분이고(70분은 기사 본인),
    //   사무실은 원래 잠그지 않는다. C-3 의 검은 화면은 중간 점검 때 카메라 원본이 알려 준다.
    '최초 발견자는 오정숙입니다. 04:11 비명을 듣고 사람들이 모였고, 04:15 서장현 안전관리자가 112와 119에 신고했습니다.',
    '정문 기록에 22:30 이후 04:15까지 출입이 없습니다. 스물다섯 중 열여덟은 그 밤 공정 기록이 한 번도 끊기지 않았습니다. 단말을 들지 않는 자리 셋과 기록에 공백이 있는 넷 — 그중 한 사람이 죽었습니다. 남는 사람은 여섯입니다.',
    '1차 검안 소견서는 사건 기록에 들어 있습니다. 나중에 다시 읽어도 됩니다.',
    '센터 곳곳과 현장을 탐색해 단서를 모으고, 여섯을 심문해, 누가·어떻게·왜 죽였는지 밝혀내세요.',
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
  { id: 'm_key', label: '사무실 열쇠함에서 사물함 마스터키를 가져감' },
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
// 사건 파일에 보이는 선택지 — 위 METHODS/MOTIVES(해설·정답표)를 그대로 보이면 다섯 구멍의 요약이 되어
//   지워 나가기만 해도 풀렸다(3회차 #1). 여기는 **이 판에서 그럴듯한 살해 가설**만 둔다.
//   정답은 m_kill · mo_draft 하나씩. 수법 미끼는 2차 부검과 다 맞으면서 **다른 물증으로만** 떨어진다(4회차 #4):
//   m_jackdrag ← 파렛트 잭 감식·포크 자국 · m_hand ← 파렛트 무게·포크 자국 · m_return ← 03:28 입구의 빈 지게차·03:43 자동문.
//   m_drugfork · m_wrap 은 차민우·윤도경 쪽으로 기운 사람의 오답 이야기로 남긴다. 정답을 맨 앞에 두지 않는다.
const CHOICE_METHODS = [
  { id: 'm_jackdrag', label: '뒤에서 후두부를 쳐 쓰러뜨리고 랩으로 얼굴을 감아 질식시킨 뒤, 파렛트 잭으로 1단 파렛트를 끌어내려 덮었다' },
  { id: 'm_drugfork', label: '텀블러의 약으로 느려진 조장을 지게차로 파렛트를 밀어 깔리게 했다' },
  { id: 'm_kill', label: '뒤에서 후두부를 쳐 쓰러뜨린 뒤 랩으로 얼굴을 감아 질식시키고, 지게차로 파렛트를 넘어뜨린 뒤 지게차는 시동을 켠 채 통로 입구에 두고 나왔다' },
  { id: 'm_return', label: '뒤에서 후두부를 쳐 쓰러뜨린 뒤 랩으로 얼굴을 감아 질식시키고, 지게차로 파렛트를 넘어뜨린 뒤 지게차를 충전소 제자리에 되돌려 놓았다' },
  { id: 'm_wrap', label: '말다툼 끝에 랩으로 질식시켰고, 뒷머리 상처는 쓰러지며 생겼다' },
  { id: 'm_hand', label: '뒤에서 후두부를 쳐 쓰러뜨린 뒤 랩으로 얼굴을 감아 질식시키고, 1단 파렛트를 손으로 밀어 넘어뜨렸다' },
];
const CHOICE_MOTIVES = [
  { id: 'mo_tag', label: '대리 출퇴근이 근태 전수 점검에 걸릴까 봐' },
  { id: 'mo_grudge', label: '전환 심사에서 밀려난 원한' },
  { id: 'mo_injury', label: '산재를 각서로 덮은 조장에게 쌓인 원한' },
  { id: 'mo_draft', label: '감사 진술 초안에 자기 이름이 적혀 있었다' },
  { id: 'mo_license', label: '조장이 감사 자료를 정리해 올리면서 자격 대장까지 올릴까 봐 — 무면허가 드러날 공포' },
  { id: 'mo_passport', label: '조장이 맡아 둔 여권을 되찾으려고' },
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
  startingClues: [...(_locations.starting || []), AUTOPSY1_CODE],
  // 2차 심문 개방 때 도착하는 기록 대조 7장
  recordCodes: RECORD_CODES.filter((c) => byCode[c]),
  isRecordCode: (code) => recordSet.has(code),
  caseKey: { roles: ROLES, methods: METHODS, motives: MOTIVES, answers: caseAnswers,
    choiceMethods: CHOICE_METHODS, choiceMotives: CHOICE_MOTIVES },
  getClue: (code) => byCode[code] || testimonyByCode[code] || DERIVED[code] || null,
  lookupCode: LOOKUP_CODE,
  autopsyCode: AUTOPSY_CODE,
  autopsyTumblerCode: AUTOPSY_TUMBLER_CODE,
  q2segCode: Q2SEG_CODE,
  // 기록 대조가 배달되는 조건 — 보드판처럼 **2차 심문 + 심야조 명부(U4)**. 명부에 사번이 있어야 조회가 된다.
  recordGate: 'KVUN-12',
  // Q2 둘째 구간이 배달되는 조건 — 「없어진 두 달」(S7)
  q2segGate: 'AOBI-88',
  clueIcon,
  computeAutoUnlocked: (codeSet) => provider.computeAutoUnlocked(codeSet),
  gamsikCodes: new Set(all.filter((c) => c.type === '감식').map((c) => c.code)),
  // 맡기는 즉시 도착하는 감식 — 질식·흉기·랩·시신을 말하지 않는 셋(텀블러·약봉투·보온병)
  earlyLab: new Set(['IJEO-08', 'FBWD-37', 'PNOQ-92']),
  gamsikReady: (code, collected) => {
    const s = new Set(collected);
    provider.computeAutoUnlocked(s);
    return s.has(code);
  },
  provider,
};

export default soloContent;
