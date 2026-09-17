// ─────────────────────────────────────────────────────────────────────────────
// 야간조 — 방(장소) 항목 13개
//
//   보드 카드 109장 **밖**의 앱 전용 항목이다. 보드판에서는 더미를 집어 드는 것이
//   곧 장소를 뒤지는 일이지만, 앱에는 더미가 없다. 그 자리를 이 13개가 맡는다.
//   근거: dp-mapping.md §9-2-2 · 스키마는 src/data/gameData.js 의 ROOM-* 일곱을 그대로 따랐다.
//
//   ── 스키마(gameData.js ROOM-JH · ROOM-PS 에서 읽은 것) ─────────────────────
//     { title, description?, type: '방', person,
//       room: { label, objects: [코드…], showBody, body?: { label, detail }, people: [] } }
//   RoomModal.jsx 가 실제로 읽는 것은 room.label · room.objects · room.showBody ·
//   room.body · room.image 다. `image` 는 새벽이슬 일곱도 쓰지 않으므로 두지 않았다
//   (없으면 RoomModal 이 스타일 배경으로 떨어진다. 배경 이미지가 생기면 그때 한 줄씩 붙인다).
//
//   ── objects 는 「그 더미의 카드 전량」이다 ──────────────────────────────────
//   발급표(dp-mapping.md §11)에서 더미 글자로 골라낸 것이고, 합이 82장이다.
//
//     ROOM-A 6 · ROOM-B 5 · ROOM-C 6 · ROOM-D 6 · ROOM-E 6 · ROOM-F 5   = 34
//     ROOM-X 10 · ROOM-P 3                                              = 13
//     ROOM-W 6 · ROOM-N 5 · ROOM-J 5 · ROOM-U 5                         = 21
//     ROOM-V 14                                                         = 14
//                                                                     ───────
//                                                                        82
//
//   나머지 27장은 어느 방에도 두지 않는다. 보드판에서도 칸을 뒤져 얻는 카드가 아니다 —
//   L 감식 9(의뢰해서 받는다) · S 특수 8(재료가 모이면 열린다) · Q 기록 대조 7(2부 배포) ·
//   T1 조장 태블릿(판 옆에 편다) · 공개 게시물 2(가져갈 수 없다). 합 27 = 109 − 82.
//
//   ── ROOM-V 가 왜 필요한가 ─────────────────────────────────────────────────
//   src/solo/soloContent.js 의 buildLocations() 는 CCTV 열람실(LOC-CCTV)을
//   `if (c.cctv) cctv.push(…)` 로만 만들고, 마지막에 `if (cctv.length)` 일 때만 장소를
//   붙인다. 야간조의 카메라 14장은 `cctv` 필드가 없는 독립 단서라(dp-mapping.md §5)
//   전부 `cctvInner` 로만 들어가고 `cctv.length === 0` 이 된다 → **LOC-CCTV 자체가
//   만들어지지 않아 V 14장이 솔로판에서 통째로 사라진다.**
//   ROOM-V 를 두면 그보다 먼저 있는 `if (roomObjectCodes.has(c.code)) continue;` 검사에
//   걸려 14장이 이 방의 소품으로 정상 배치된다. ROOM-V 는 선택이 아니라 필수다.
//
//   ── 선언 순서에 뜻이 있다(soloContent 의 나머지 처리) ──────────────────────
//   buildLocations() 는 방에 안 속한 단서를 `personRoom[c.person]` 으로 흘려보내는데,
//   personRoom 은 Object.fromEntries 라 **같은 person 을 가진 방 중 마지막 것이 이긴다.**
//   야간조는 '조장' 이 둘(X·P) · '공용' 이 다섯(W·N·J·U·V)이라 아래 순서에서
//   Q1(MCAD-69)은 ROOM-P 로, T1·공개①·공개②는 ROOM-V 로 떨어진다.
//   솔로판을 붙일 때(3단계) 이 넷은 손으로 배치하는 편이 낫다 — 여기 적어 둔다.
// ─────────────────────────────────────────────────────────────────────────────

export const rooms = {
  // ── 1부 · 여섯 사람의 칸 (탈의실 사물함 열 + 압수 소지품) ────────────────────
  'ROOM-A': {
    title: '{{S1}}의 칸',
    description: '탈의실 사물함 한 칸과 압수 소지품 상자.',
    type: '방',
    person: '{{S1}}',
    room: {
      label: '{{S1}}의 칸',
      // A1 순찰 일지 클립보드 · A2 공구 파우치와 커터 · A3 재해조사 보고서 사본 ·
      // A4 여벌 조끼와 아들 사진 · A5 무전기와 사원증 · A6 휴대폰
      objects: ['NUMF-40', 'CFKD-36', 'TXCD-86', 'GZUX-14', 'MQDV-92', 'GYQV-38'],
      showBody: false,
      people: [],
    },
  },
  'ROOM-B': {
    title: '{{S2}}의 칸',
    description: '탈의실 사물함 한 칸과 압수 소지품 상자.',
    type: '방',
    person: '{{S2}}',
    room: {
      label: '{{S2}}의 칸',
      // B1 약봉투 · B2 각서 · B3 교재와 시험 요약 노트 · B4 손목 보호대와 학생증 · B5 휴대폰
      objects: ['GKGE-32', 'MLPZ-57', 'VFUK-55', 'IYPZ-09', 'TLBI-94'],
      showBody: false,
      people: [],
    },
  },
  'ROOM-C': {
    title: '{{S3}}의 칸',
    description: '탈의실 사물함 한 칸과 압수 소지품 상자.',
    type: '방',
    person: '{{S3}}',
    room: {
      label: '{{S3}}의 칸',
      // C1 화장품 세트 넷 · C2 봉인된 흰 봉투 · C3 준호 재활 일정표 ·
      // C4 빈 장바구니 가방 · C5 앞치마 · C6 폰
      objects: ['VSTN-59', 'YTDK-27', 'QYHA-34', 'EFJB-22', 'XWNR-11', 'DMYX-34'],
      showBody: false,
      people: [],
    },
  },
  'ROOM-D': {
    title: '{{S4}}의 칸',
    description: '탈의실 사물함 한 칸과 압수 소지품 상자.',
    type: '방',
    person: '{{S4}}',
    room: {
      label: '{{S4}}의 칸',
      // D1 사물함 마스터키 · D2 작업화 한 짝 · D3 여권 · D4 딸 사진 ·
      // D5 지원센터 상담 카드 · D6 폰
      objects: ['OIXS-24', 'HIEV-34', 'GOCI-93', 'EBEZ-58', 'CHOH-86', 'LIPT-58'],
      showBody: false,
      people: [],
    },
  },
  'ROOM-E': {
    title: '{{S5}}의 칸',
    description: '탈의실 사물함 한 칸과 압수 소지품 상자.',
    type: '방',
    person: '{{S5}}',
    room: {
      label: '{{S5}}의 칸',
      // E1 전환 심사 안내문과 커플링 · E2 명함과 담뱃갑 · E3 집품 단말 ·
      // E4 전환 심사 탈락 통지 · E5 반출 적재 메모 · E6 휴대폰
      objects: ['QHOU-15', 'NQGW-82', 'SXMG-82', 'RGXM-52', 'FKRI-82', 'TQMO-65'],
      showBody: false,
      people: [],
    },
  },
  'ROOM-F': {
    title: '{{S6}}의 칸',
    description: '탈의실 사물함 한 칸과 압수 소지품 상자.',
    type: '방',
    person: '{{S6}}',
    room: {
      label: '{{S6}}의 칸',
      // F1 지게차 키 · F2 운전면허증과 접힌 통지서 · F3 귀마개와 혈압약 ·
      // F4 보온병 · F5 폰
      objects: ['LHMX-66', 'ZFDF-11', 'LKQM-22', 'VRVO-38', 'DMKO-85'],
      showBody: false,
      people: [],
    },
  },

  // ── 2부 · 현장과 조장의 칸 ──────────────────────────────────────────────────
  'ROOM-X': {
    title: 'C통로 현장',
    description: '04:11에 발견된 자리. 입구에서 20m 안쪽.',
    type: '방',
    person: '조장',
    room: {
      label: 'C통로 현장',
      // X1 넘어진 파렛트와 시신 · X2 바닥의 자국 · X3 수첩 · X4 피해자 소지품 ·
      // X5 반출 전표 목록 3장 · X6 파렛트 잭 · X7 쓰던 랩 롤 · X8 랩 덩어리 ·
      // X9 시신 채취 · X10 폰
      objects: [
        'ITYT-34', 'JZXT-21', 'PIMY-01', 'TUTI-57', 'ATXE-85',
        'VXHP-68', 'HPUZ-03', 'OZRC-07', 'HFIQ-89', 'KZBP-76',
      ],
      showBody: true,
      body: {
        label: '{{victim}} 시신',
        detail:
          '랙 1단에 얹혀 있던 장척 화물용 파렛트 한 매가 통로 쪽으로 넘어져 머리와 가슴을 덮었다. 골반 아래와 왼팔이 통로 쪽으로 나와 있고, 두 발끝이 통로를 향한다. 머리는 랙 쪽에 있다.\n\n시신에서 한 걸음 떨어진 바닥에 종이 몇 장이 흩어져 있다. (사인·채취 결과는 개별 감식 단서로 확인한다)',
      },
      people: [],
    },
  },
  'ROOM-P': {
    title: '조장의 칸',
    description: '사물함 마스터키가 공개된 뒤에 열린다.',
    type: '방',
    person: '조장',
    room: {
      label: '조장의 칸',
      // P1 여권 보관함 · P2 각서 다발 · P3 감사 진술 초안
      objects: ['GZME-70', 'XNHC-45', 'NWVL-86'],
      showBody: false,
      people: [],
    },
  },

  // ── 3부 · 공용 공간 ────────────────────────────────────────────────────────
  'ROOM-W': {
    title: '서쪽 — 휴게실 · 탈의실 · 흡연장',
    description: '교대 전후로 사람이 모이는 자리.',
    type: '방',
    person: '공용',
    room: {
      label: '서쪽 — 휴게실 · 탈의실 · 흡연장',
      // W1 조장 텀블러 · W2 휴게실 끝자리 의자 · W3 휴게실 탁자 ·
      // W4 탈의실 사물함 열 · W5 흡연장 · W6 조장 캐비닛
      objects: ['CTBT-25', 'EKLZ-98', 'HOJI-48', 'CRZR-18', 'OVGS-58', 'NQGX-52'],
      showBody: false,
      people: [],
    },
  },
  'ROOM-N': {
    title: '충전소 · 배터리실',
    description: '지게차가 밤새 물려 있는 곳.',
    type: '방',
    person: '공용',
    room: {
      label: '충전소 · 배터리실',
      // N1 지게차 · N2 거치대의 무전기 · N3 충전 커넥터 이력 · N4 배터리실 안 · N5 배터리실 문
      objects: ['QJUT-13', 'UTVE-09', 'BKZO-68', 'TEXV-97', 'KDBK-22'],
      showBody: false,
      people: [],
    },
  },
  'ROOM-J': {
    title: '동쪽 — 갈림 · D구역 · 뒷문',
    description: '자동문 너머, 그날 밤 이름이 하나뿐이던 쪽.',
    type: '방',
    person: '공용',
    room: {
      label: '동쪽 — 갈림 · D구역 · 뒷문',
      // J1 갈림 랙 기둥 · J2 기둥 밑 빈 골판지 상자 · J3 D 작업대 ·
      // J4 폐기 파렛트 · J5 뒷문과 두 개의 시야
      objects: ['LZOB-18', 'QWRS-35', 'QRDK-68', 'UDBD-88', 'TALG-77'],
      showBody: false,
      people: [],
    },
  },
  'ROOM-U': {
    title: '2층 — 사무실 · 관제실 · 계단',
    description: '종이와 기록이 모여 있는 층.',
    type: '방',
    person: '공용',
    room: {
      label: '2층 — 사무실 · 관제실 · 계단',
      // U1 지난달 순찰 일지 묶음 · U2 열쇠함 · U3 관제실 · U4 심야조 명부 · U5 사무실과 계단
      objects: ['ATQK-74', 'OPGY-02', 'ASWY-11', 'KVUN-12', 'OWBV-26'],
      showBody: false,
      people: [],
    },
  },

  // ── 4부 · 카메라 열람 ──────────────────────────────────────────────────────
  // V 14장이 사는 집이다. 이 항목이 없으면 솔로판에서 14장이 통째로 사라진다(머리말 참고).
  // 목록은 카메라 여섯 대 순서대로다 — G-1 정문 2 · M-2 자동문 5 · C-3 갈림 4 · 나머지 3.
  'ROOM-V': {
    title: '관제실 열람대',
    description: '카메라 여섯 대의 그날 밤 기록을 돌려 보는 자리.',
    type: '방',
    person: '공용',
    room: {
      label: '관제실 열람대',
      objects: [
        'DRZS-30', 'LYZR-15',                                           // V1·V2   G-1 정문
        'JPAD-03', 'JSFS-29', 'MPXG-54', 'QNWA-14', 'EMSY-33',          // V3~V7   M-2 자동문
        'VOSB-03', 'ZFDP-41', 'PAOX-30', 'KADA-11',                     // V8~V11  C-3 갈림
        'AHSG-34', 'VABS-05', 'ZDHT-35',                                // V12~V14 L-1·M-1·W-1
      ],
      showBody: false,
      people: [],
    },
  },
};

// 방 항목 코드 13개. index.js 가 clueCodes(109)와 갈라 놓기 위해 쓴다.
export const roomCodes = Object.keys(rooms);

export default rooms;
