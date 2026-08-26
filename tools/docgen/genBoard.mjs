// 보드게임판 인쇄물 — 인물 카드 · 단서 카드 · 장소 판.
//   앱판과 같은 정본(gameData/cast/bible)에서 파생한다. 여기서 새로 쓰는 텍스트는 규칙뿐이다.
//
//   카드 규격은 표준 카드 63x88mm — A4 한 면에 3x3=9장. 슬리브가 그대로 맞는다.
//   양면 인쇄를 쓰므로 뒷면 페이지는 행마다 좌우를 뒤집는다. 안 뒤집으면 번호와 내용이 어긋난다.
//
//   번호 체계: 장소마다 글자 하나(A~G 방, V CCTV, L 감식, S 특수) + 그 안의 일련번호.
//   판에는 번호만 찍혀 있고, 참가자는 "A3 볼게요" 하고 그 번호 카드를 집는다.
//   조합은 표를 따로 두지 않고 카드에 적는다 — 카드가 스스로 "A6 도 있으면 S1 을 가져가라"고 말한다.
import { BIBLE } from './bible.mjs';
import { DATA as INTERROGATION } from '../../src/solo/interrogation.js';
import { BOARD_SCRIPT, DETECTIVE } from './boardScript.mjs';
import { illustratedMapHTML, ART_ROOMS } from './boardMap.mjs';
import QRCode from 'qrcode';

// 정본 데이터는 주입받는다 — Node(문서 생성기)는 loadData.mjs 가 fs 로 비밀팩을 찾아 넘기고,
//   브라우저(웹 키트)는 @secrets 별칭으로 번들된 것을 넘긴다. loadData 를 직접 import 하면
//   node:fs 가 딸려 들어와 브라우저 번들이 깨진다.
let allClues = [], suspects = [], img = (p) => p, siteUrl = 'https://crimescene.dawndew.org';

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));

// 판 위 7개 방 + 판 밖 시설 2곳. 순서가 곧 카드 번호 순서다.
const PLACES = [
  ...ART_ROOMS.map((r) => ({ id: r.id, letter: r.letter, name: r.label, color: r.color, open: '처음부터' })),
  { id: 'CC', letter: 'V', name: 'CCTV 열람실', color: '#2b6b73', open: '4라운드 종료 후' },
  { id: 'LB', letter: 'L', name: '감식실', color: '#5a5a5a', open: '3라운드 종료 후 · 채취물 제출 전용' },
];
PLACES.find((p) => p.id === 'PS').open = '현장(D1~D10) 1라운드 종료 후 · 기록(D11~) 2라운드 종료 후';

// 앱에서는 이 특수 단서들이 '열람 흔적'(톡서랍 비밀번호 복구·필적 대조·심문)으로 열린다.
//   보드에는 비밀번호도 심문도 없어 unlockedBy 가 비어 있고, 그래서 네 장이 영원히 더미에
//   남아 있었다. 같은 조건을 카드 조합으로 옮긴다 — 앱 데이터는 건드리지 않는다.
//   [코드, 그 단서의 어느 장인지] 로 적는다. 폰은 앱마다 한 장이라 '카카오톡' 장을 가리켜야 한다.
const BOARD_UNLOCK = {
  'SIST-22': [['QIVS-92', '카카오톡'], ['HUOX-80', '카카오톡']],   // 자매의 교차 대화
  'DISC-11': [['LWUY-33', '카카오톡'], ['TCGA-87', '카카오톡']],   // 지워진 대화방
  'KMRV-41': [['NBZL-83'], ['AYMX-96', '6월 30일']],              // 지갑 + 세린 일기
};

// 휴대폰 잠금은 두 단계다. 통신 기록(누구와 이어져 있었나)이 먼저, 대화 내용(무슨 말을 했나)이
//   나중에 열린다. 관계를 먼저 알고 내용을 나중에 아는 순서라야, 대화가 열릴 때 그게
//   누구와의 대화인지가 이미 판에 깔려 있다. 반대로 열면 내용부터 쏟아져 관계가 묻힌다.
// 휴대폰은 앱별로 쪼개지 않고 카드 한 장이 되었다. 잠금도 폰 단위 하나뿐이다(3라운드·영장 ②).
const SPECIAL = { letter: 'S', name: '특수 단서', color: '#8a6d1f' };
const ROOM_OF = { 최종현: 'JH', 강지후: 'EJ', 한소미: 'HJ', 서지안: 'HW', 한다영: 'SR', 문세린: 'GH' };

// 잠금 카드 — 비밀번호를 넣어야 열리는 것들. 앱에서는 톡서랍을 복구하거나 진위조회를 하는
//   상호작용인데, 종이에는 넣을 화면이 없다. QR 한 장으로 그 화면을 대신한다.
//   카드가 아니라 게시물이다 — 아무도 가져가지 않고, 누구나 찍을 수 있다. 잠근 것은 카드가
//   아니라 숫자이므로, 숫자를 아는 사람이 열지 말지·남에게 알려줄지를 정하게 된다.
const QCARDS = [
  { no: 'Q1', code: 'LWUY-33', title: '목사님 휴대폰 — 잠긴 대화방',
    hint: '네 자리 숫자가 필요하다. 목사님은 잠글 것마다 같은 날짜를 쓴다고 어딘가에 적어 두었다.' },
  { no: 'Q2', code: 'QIVS-92', title: '한다영 휴대폰 — 잠긴 대화방',
    hint: '네 자리 숫자가 필요하다. 다영이 무엇을 기준으로 숫자를 정했는지는 다른 사람의 기록에 있다.' },
  { no: 'Q3', code: 'HUOX-80', title: '한소미 휴대폰 — 잠긴 대화방',
    hint: '네 자리 숫자가 필요하다. 소미가 무엇을 기준으로 숫자를 정했는지는 다른 사람의 기록에 있다.' },
  { no: 'Q4', code: 'YJWR-74', title: '서지안 휴대폰 — 잠긴 대화방',
    hint: '네 자리 숫자가 필요하다. 지안이 무엇을 기준으로 숫자를 정했는지는 그가 감추고 싶어 하는 종이 한 장에 적혀 있다.' },
  { no: 'Q5', code: 'CERT', title: '교단 「수료증 진위조회」',
    hint: '수료증에 적힌 발급번호를 넣으면 등록 여부가 나온다. 번호는 그 수료증을 찍은 사진에 있다.' },
];

// 필적 대조는 사람마다 카드가 따로 있다. 화면에서 고르게 두면 손에 표본이 없어도 일곱을
//   차례로 돌려 보게 되고, 그러면 대조가 아니라 목록 훑기가 된다. 카드를 나눠 두면
//   「그 사람의 다이어리를 가진 사람만 그 대조를 할 수 있다」가 물건으로 강제된다.
const HAND_CARDS = () => {
  const at = (code) => allClues.find((c) => c.code === code);
  const opts = at('TUBE-22')?.handwriting?.options || [];
  return opts.map((o, i) => ({
    no: `Q6-${i + 1}`, code: `HAND${i + 1}`, hand: true,
    title: `필적 대조 — ${o.who}`,
    need: at(o.requires)?.title || `${o.who} 의 손글씨가 있는 카드`,
    hint: `통 라벨의 글씨를 ${o.who} 의 것과 맞춰 본다.`,
  }));
};
let HANDS = [];                                   // 필적 대조 카드(정본에서 만든다)
const allQ = () => [...QCARDS, ...HANDS];
const QCARD_NO = Object.fromEntries(QCARDS.map((q) => [q.code, q.no]));

// 공개 단서 — 아무도 가져갈 수 없고 전원이 언제든 읽는다.
//   동기(수료증 위조)를 받치는 카드가 이것뿐이라, 진범이 집어 숨기면 아무도 못 맞힌다.
const PUBLIC = new Set(['HQIR-26']);

// ── 구조형 단서 쪼개기 ───────────────────────────────────────────────────────
//   다이어리·성경책·일기장은 쪽마다, 휴대폰은 앱마다, 지갑은 항목마다 한 장으로 나눈다.
//   앱판은 화면 안에서 넘겨 보면 그만이지만 종이에서는 그럴 수 없다 — 안 쪼개면 카드에
//   "화살표로 페이지를 넘기세요" 같은 조작 안내만 남고 정작 일기 본문·카톡 대화가 통째로 빠진다.
const line = (a, b) => (b ? `${a}\n${b}` : a);
// QR 로 여는 물건 — 카드 한 장에 QR 하나, 속은 화면에서 본다.
//   휴대폰은 앱마다, 다이어리·성경책은 쪽마다 카드가 갈라져서 물건 하나가 서너 장이 됐다.
//   덱의 절반이 남의 신상으로 채워지고, 한 사람의 폰을 다 읽으려면 네 번을 뽑아야 했다.
//   물건은 하나인데 카드만 늘어난 셈이다. 카드는 하나로 두고 속은 QR 뒤에 둔다 —
//   폰을 손에 넣은 사람은 실제로 폰을 손에 넣은 것처럼 다 본다. 대신 그 폰은 그 사람 것이다.
// 지워진 대화방이 실제로 있는 폰만 잠금 카드가 필요하다.
const hasDeleted = (c) => (c.phone?.apps || [])
  .some((a) => (a.chats || []).some((ch) => ch.deleted));
const isScreen = (c) => !!(c.phone?.apps?.length
  || (c.pages?.length && /다이어리|일기장|성경책/.test(c.title)));

function explode(c) {
  const one = (extra) => ({ ...c, ...extra, src: c });

  // 화면으로 여는 물건은 쪼개지 않는다. 카드에는 무엇이 들어 있는지만 적고 QR 을 붙인다.
  if (isScreen(c)) {
    const phone = !!c.phone?.apps?.length;
    const what = phone
      ? c.phone.apps.map((a) => a.name || a.id).join(' · ')
      : `${c.pages.length}쪽 — ${c.pages.map((p) => p.title).filter(Boolean).join(' · ')}`;
    const body = [
      phone ? '안에 든 것' : '표시된 자리',
      what,
      phone && hasDeleted(c)
        ? `지워진 대화방이 있다 — 판 옆의 ${QCARD_NO[c.code] || '잠금'} 카드를 찍어 네 자리 숫자를 넣는다.`
        : '',
    ].filter(Boolean).join('\n');
    // 휴대폰은 3라운드부터 각 방에서 가져갈 수 있다. 다이어리·성경책은 처음부터.
    return [one({ screen: true, image: null, detail: body, locked: phone ? 3 : 0 })];
  }

  if (c.pages?.length) {
    return c.pages.map((pg, i) => one({
      title: `${c.title} · ${pg.title || i + 1}`,
      image: pg.image || null,
      detail: pg.content || '',
      part: `${i + 1}/${c.pages.length}`,
    }));
  }
  if (c.wallet?.items?.length) {
    return c.wallet.items.map((it) => one({
      title: `${c.title} · ${it.label}`, image: it.image || null,
      detail: it.detail || '', part: it.label,
    }));
  }
  if (c.handwriting?.options?.length) {
    // 결과를 카드에 다 실으면 일치하는 사람이 첫눈에 드러나 대조가 아니라 정답 공개가 된다.
    return [one({
      detail: line(c.detail,
        '대조할 수 있는 사람: ' + c.handwriting.options.map((o) => o.who).join(', ')
        + '\n→ 잠금 카드 Q5 의 QR 을 찍어 한 사람씩 맞춰 본다. 결과는 찍은 사람만 본다.'),
    })];
  }
  return [one({})];
}

// ── 카드에 안 들어가는 본문 나누기 ───────────────────────────────────────────
//   카드는 63x88mm 이고 .card 가 overflow:hidden 이다. 넘치는 글은 잘려서 안 보이는데,
//   잘렸다는 표시조차 안 난다 — 인쇄물만 보는 사람은 그런 줄도 모른다.
//   실제로 카톡·성경책 카드 열넷이 넘치고 있었고, 그중 하나는 내용의 예순 몇 퍼센트가 사라졌다.
//   앱은 스크롤하면 그만이지만 종이는 그럴 수 없으니, 넘칠 것 같으면 여러 장으로 나눈다.
const CARD_MM = 81.6;                 // 88 - 위아래 패딩
const LINE_MM = 3.9;                  // 본문 7.4pt · line-height 1.5
const COLS = 21;                      // 한 줄에 들어가는 한글 글자 수
const SM_LINE = 3.5, SM_COLS = 23;    // 작은 글씨(6.5pt) — 한 장에 3분의 1쯤 더 담긴다
                                      //   브라우저 실측으로 맞춘 값이다. 넉넉히 잡는다 —
                                      //   빠듯하게 맞추면 글꼴이 조금만 달라도 잘린다.
const rowsOf = (s, w = COLS) => String(s || '').split('\n')
  .reduce((a, l) => a + Math.max(1, Math.ceil(l.length / w)), 0);

// 조합 안내가 붙게 될 단서들 — 감식의 채취물, 특수의 재료, 보드 전용 조합의 재료.
let HINTED = new Set();
function markHinted() {
  HINTED = new Set();
  for (const t of allClues) for (const k of (t.unlockedBy || [])) HINTED.add(k);
  for (const reqs of Object.values(BOARD_UNLOCK)) for (const [k] of reqs) HINTED.add(k);
}

function splitLong(u) {
  // QR 카드는 나누지 않는다. 나누면 같은 QR 이 두 장에 붙어 무엇을 찍을지 모른다.
  if (u.screen) return [u];
  // 본문 말고 다른 것들이 먼저 먹는 높이
  let fixed = 5.2 + Math.ceil((u.title || '').length / 19) * 4.9 + 3.2;
  if (u.image) fixed += 28.4;
  if (QR[u.code]) fixed += 31.4;
  if (u.locked) fixed += 1.2 + Math.ceil(95 / 23) * 3.6;               // 잠금 문구(실측 4줄)
  // 조합 안내(⭐·🔬)가 붙는 카드에만 그 자리를 비워 둔다. 번호는 나중에 정해지지만
  //   '어느 단서에 붙는지'는 미리 알 수 있으므로, 그것만으로 자리를 잡으면 충분하다.
  //   전부에 비워 두면 안 붙는 카드까지 쓸데없이 나뉘어 덱이 부푼다.
  const room = CARD_MM - fixed - (HINTED.has(u.code) ? 15 : 0);
  const budget = Math.floor(room / LINE_MM);
  if (budget < 3) return [u];                                           // 그림·QR 카드는 원래 글이 짧다
  const lines = String(u.detail || '').split('\n');
  if (rowsOf(u.detail) <= budget) return [u];
  // 나누기 전에 글씨를 한 단계 줄여 본다. 카드가 늘면 덱이 부풀고 정보가 흩어지므로,
  //   한 장에 담을 수 있으면 담는 편이 낫다.
  if (rowsOf(u.detail, SM_COLS) <= Math.floor(room / SM_LINE)) return [{ ...u, small: true }];

  // 빈 줄을 경계로 본다 — 대화방 하나, 검색 결과 하나가 중간에 끊기지 않게.
  const blocks = [];
  let cur = [];
  for (const l of lines) {
    if (l.trim() === '' && cur.length) { blocks.push(cur); cur = []; continue; }
    if (l.trim() !== '') cur.push(l);
  }
  if (cur.length) blocks.push(cur);

  const pages = [];
  let page = [], used = 0;
  for (const b of blocks) {
    const h = rowsOf(b.join('\n')) + 1;                                 // 블록 사이 빈 줄
    if (used && used + h > budget) { pages.push(page); page = []; used = 0; }
    if (h > budget) {                                                   // 블록 하나가 통째로 넘치면 줄 단위로 쪼갠다
      let chunk = [], ch = 0;
      for (const l of b) {
        const lh = Math.max(1, Math.ceil(l.length / COLS));
        if (ch && ch + lh > budget) { pages.push([...page, ...chunk]); page = []; chunk = []; ch = 0; used = 0; }
        chunk.push(l); ch += lh;
      }
      page = [...page, ...chunk]; used += ch; continue;
    }
    page = page.concat(page.length ? [''] : [], b); used += h;
  }
  if (page.length) pages.push(page);
  if (pages.length <= 1) return [u];

  return pages.map((p, i) => ({
    ...u,
    small: true,
    title: `${u.title} (${i + 1}/${pages.length})`,
    detail: p.join('\n'),
    image: i === 0 ? u.image : null,
    // 조합 안내는 첫 장에만 붙어야 하므로 원래 part 를 첫 장이 물려받는다
    part: i === 0 ? u.part : `${u.part || u.title}#${i + 1}`,
  }));
}

// ── 장소 배정 + 번호 부여 ────────────────────────────────────────────────────
function buildBoard() {
  markHinted();
  const cut = new Set();
  for (const c of allClues) {
    for (const t of (c.cctv?.timeline || [])) {
      for (const p of (t.people || [])) if (p.unlocks) cut.add(p.unlocks);
    }
  }
  const bag = Object.fromEntries(PLACES.map((p) => [p.id, []]));
  const special = [], open = [];
  for (const c of allClues) {
    // 방 입구 QR·게임 설명서는 앱판 전용. 사건 브리핑은 카드가 아니라 시작 시트로 따로 뽑는다
    //   — 누가 '가져가는' 물건이 아니라 시작할 때 전원이 돌려 읽는 물건이다.
    // SIAH-72(CCTV 열람대)도 뺀다 — 앱에서 '화면 속 인물을 누르라'는 진입점이라 종이에는 누를 화면이
    //   없다. 빼면 V 덱이 동선 16장으로 딱 떨어져, 그게 곧 사건 당일 타임라인이 된다.
    // LONS-62(2차 부검)도 뺀다 — 이벤트 카드 ① 이 2라운드에 같은 내용을 전원에게 읽어 준다.
    //   더미에 남겨 두면 조합 조건도 없어 아무도 못 가져가는데, 그 사이 이미 다 아는 내용이 된다.
    if (c.type === '방' || c.code === 'LSUX-91' || c.code === 'BRIF-00'
      || c.code === 'SIAH-72' || c.code === 'LONS-62') continue;
    if (PUBLIC.has(c.code)) { open.push(c); continue; }
    const units = explode(c).flatMap(splitLong);
    if (c.type === '감식') { bag.LB.push(...units); continue; }
    if (c.cctv?.timeline || cut.has(c.code)) { bag.CC.push(...units); continue; }
    if (c.type === '특수') { special.push(...units); continue; }
    if (c.person === '목사') { bag.PS.push(...units); continue; }
    const r = ROOM_OF[c.person];
    if (r) bag[r].push(...units); else special.push(...units);
  }

  // 파우치와 옷가지는 사람마다 두 장인데 둘 다 "여벌 옷과 양말" / "스킨·로션·쿠션" 뿐이다.
  //   방마다 이런 카드가 둘씩 있으면 무엇을 고르든 비슷해져 선택이 고민이 아니게 된다. 한 장으로 합쳐
  //   방마다 하나씩만 남긴다 — 아무것도 안 나오는 카드도 있어야 판이 팽팽해지므로 없애지는 않는다.
  const isKit = (u) => /파우치|옷가지/.test(u.title);
  for (const [, id] of Object.entries(ROOM_OF)) {
    const kit = bag[id].filter(isKit);
    if (kit.length < 2) continue;
    const who = (kit[0].title.match(/^(\S+?)의/) || [, ''])[1];
    const merged = {
      ...kit[0],
      title: `${who}의 소지품`,
      detail: kit.map((u) => `· ${u.title.replace(/^\S+?의\s*/, '')} — ${u.detail || ''}`).join('\n'),
    };
    bag[id] = [merged, ...bag[id].filter((u) => !isKit(u))];
  }
  // 번호표 — 단서코드 → 판 번호(A1 …). 카드·판·조합 안내가 전부 이걸 쓴다.
  // 번호는 쪼갠 장마다 붙는다. 조합 안내는 원본 단서 코드로 걸려 있으므로,
  //   원본 → '그 단서의 첫 장' 번호로 잇는다(폰 카톡이 조합 조건이면 그 앱 카드를 가리켜야 한다).
  // 목사님 방 19장을 한 라운드에 통째로 열면 5명이 동시에 몰려 겹치고, 그 다음 라운드는 텅 빈다.
  //   두 묶음으로 나눠 연속된 번호를 준다 — 앞쪽이 현장 물증, 뒤쪽이 기록물(일기장·휴대폰).
  //   순서를 여기서 정해 두면 "D1~D10 은 3라운드, D11~ 은 4라운드" 로 규칙이 한 줄로 끝난다.
  const isRecord = (u) => !!(u.src?.pages || u.src?.phone);
  bag.PS = [...bag.PS.filter((u) => !isRecord(u)), ...bag.PS.filter(isRecord)];

  const num = {}, unitNum = new Map();
  const partNum = {};                            // '코드|장이름' → 번호. 조합이 특정 장을 가리킬 때 쓴다
  const stamp = (list, letter) => list.forEach((u, i) => {
    const n = `${letter}${i + 1}`;
    unitNum.set(u, n);
    if (u.part) partNum[`${u.code}|${u.part}`] = n;
    if (!num[u.code]) num[u.code] = n;          // 첫 장이 그 단서의 대표 번호
  });
  for (const p of PLACES) stamp(bag[p.id], p.letter);
  stamp(special, SPECIAL.letter);
  for (const c of open) num[c.code] = '공개';
  return { bag, special, open, num, unitNum, partNum };
}

// ── 조합 안내 ────────────────────────────────────────────────────────────────
//   unlockedBy 를 뒤집어 "이 카드를 가진 사람에게 무엇을 알려줄지"로 바꾼다.
//   감식(1개짜리)은 제출 안내, 특수(2개 이상)는 상대 카드 번호를 적어 준다.
function buildHints(num, partNum) {
  // 번호(A3)로 키를 잡는다 — 단서코드로 잡으면 쪼갠 여러 장 중 '첫 장'에만 붙어서,
  //   조합 조건이 카카오톡 장인데 안내가 연락처 장에 찍히는 일이 생긴다.
  const hints = {};   // 판 번호 → [안내 문장]
  const push = (n, s) => { if (n) (hints[n] = hints[n] || []).push(s); };
  const at = ([code, part]) => (part && partNum[`${code}|${part}`]) || num[code];
  for (const t of allClues) {
    const src = t.unlockedBy || [];
    if (!src.length || !num[t.code]) continue;
    if (t.type === '감식' && src.length === 1) {
      push(num[src[0]], `🔬 감식실에 내면 → <b>${num[t.code]}</b>. `
        + `<span class="hnote">내는 데 조사 행동을 쓰지 않는다. 결과는 낸 사람 아닌 이가 집어 낭독한다</span>`);
      continue;
    }
    for (const s of src) {
      const others = src.filter((k) => k !== s).map((k) => num[k]).filter(Boolean);
      if (!others.length) continue;
      push(num[s], `⭐ <b>${others.join(' + ')}</b> 와 함께 → 특수 <b>${num[t.code]}</b>. `
        + `<span class="hnote">가진 사람이 달라도 된다 — 합의해서 판 가운데에 공개하면 함께 가져간다</span>`);
    }
  }
  // 보드 전용 조합 — 앱의 열람 흔적 규칙(톡서랍 복구·필적 대조·심문)을 카드 조합으로 옮긴 것.
  for (const [target, reqs] of Object.entries(BOARD_UNLOCK)) {
    if (!num[target]) continue;                  // 덱에서 빠진 특수 카드는 건너뛴다
    const ns = reqs.map(at);
    if (ns.some((n) => !n)) continue;
    ns.forEach((n, i) => {
      const others = ns.filter((_, k) => k !== i);
      push(n, `⭐ <b>${others.join(' + ')}</b> 와 함께 → 특수 <b>${num[target]}</b>. `
        + `<span class="hnote">가진 사람이 달라도 된다 — 합의해서 판 가운데에 공개하면 함께 가져간다</span>`);
    });
  }
  return hints;
}

// ── 공통 CSS ─────────────────────────────────────────────────────────────────
const CSS = `
  /* 인쇄 여백은 @page 가 아니라 각 장이 직접 가진다. @page 에 여백을 주면 브라우저가
     그 자리에 날짜·문서 제목·파일 주소·쪽번호를 찍어 넣는다 — 끄는 표준 방법이 없어서,
     찍을 자리를 아예 없앤다. */
  @page { margin: 0; }
  * { box-sizing: border-box; }
  body { font-family: 'Malgun Gothic','맑은 고딕',sans-serif; margin: 0; color: #14120f;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { display: grid; grid-template-columns: repeat(3, 63mm); grid-auto-rows: 88mm;
           justify-content: center; align-content: start; page-break-after: always;
           padding: 12mm 0; }
  .card { border: 0.3mm dashed #bbb; padding: 3.2mm; overflow: hidden; position: relative;
          display: flex; flex-direction: column; }
  .no { font-size: 11pt; font-weight: 800; letter-spacing: .05em; color: #fff;
        padding: 0.8mm 2.4mm; border-radius: 1.2mm; align-self: flex-start; }
  .ct { font-size: 11pt; font-weight: 800; line-height: 1.25; margin: 1.8mm 0 1.4mm; }
  .cimg { width: 100%; height: 27mm; object-fit: contain; background: #f4f1ea; border-radius: 1mm; margin-bottom: 1.4mm; }
  .cd { font-size: 7.4pt; line-height: 1.5; white-space: pre-wrap; flex: 1; }
  .hint { margin-top: 1.4mm; padding-top: 1.2mm; border-top: 0.3mm dashed #b9a86a; }
  .hint div { font-size: 6.9pt; line-height: 1.45; color: #6b551a; }
  .hnote { display: block; font-size: 6.1pt; color: #8a7a45; }
  .cname { font-weight: 500; color: #6b6250; font-size: 9pt; }
  .press { margin-top: 1.2mm; padding-left: 2mm; border-left: 0.6mm solid #cdbf94;
           font-size: 8.6pt; color: #5b5140; }
  .lock { margin-top: 1.2mm; font-size: 6.9pt; font-weight: 700; color: #8a3b3b; }
  /* 표시는 넷이다 — 🔒 못 읽는 카드, ⚖ 본인이 못 읽는 감식, 🔬 감식실에 낼 것, ⭐ 조합 재료.
     넷 다 6.9pt 로 카드 밑에 깔려 있어서, 급히 집어 든 사람은 그냥 못 보고 지나갔다.
     번호 옆은 원래 비어 있던 자리다 — 세로를 더 먹지 않고 표시를 키울 수 있다. */
  .chd { display: flex; align-items: flex-start; gap: 1.2mm; }
  .bgs { display: flex; gap: 0.9mm; margin-left: auto; flex-wrap: wrap; justify-content: flex-end; }
  .bg { display: flex; align-items: center; gap: 0.7mm; font-size: 6.8pt; font-weight: 800;
        padding: 0.5mm 1.4mm; border-radius: 1.2mm; border: 0.35mm solid; white-space: nowrap;
        line-height: 1.1; }
  .bg i { font-style: normal; font-size: 10pt; line-height: 1; }
  .bgLock { color: #8a3b3b; border-color: #c98a8a; background: #fdf0ee; }
  .bgLab { color: #265a66; border-color: #85b3bd; background: #edf6f8; }
  .bgStar { color: #7d6116; border-color: #cfae5e; background: #fdf7e6; }
  .qr { text-align: center; margin-bottom: 1.4mm; }
  .qr svg { width: 21mm; height: 21mm; }
  .qrl { font-size: 6.2pt; color: #6b6760; margin-top: 0.6mm; }
  .cback { align-items: center; justify-content: center; text-align: center; }
  .bnum { font-size: 30pt; font-weight: 800; letter-spacing: .04em; }
  .bplace { font-size: 8.5pt; font-weight: 700; margin-top: 3mm; opacity: .8; }
  .lg { font-size: 15pt; vertical-align: -2px; }
  .block { margin-top: 3.5mm; font-size: 11pt; font-weight: 800; color: #8a3b3b;
           border: 0.5mm solid #c98a8a; background: #fdf0ee; border-radius: 1.6mm;
           padding: 1.6mm 3mm; }
  .bsub { font-size: 6.4pt; font-weight: 600; color: #a06a6a; margin-top: 0.6mm; }
  h1 { font-size: 19pt; margin: 0 0 3mm; }
  h2 { font-size: 13pt; margin: 6mm 0 2mm; padding-bottom: 1.2mm; border-bottom: 1.2px solid #14120f; }
  .page { padding: 14mm 14mm 12mm; page-break-after: always; }
  .brief h2 { font-size: 12pt; margin: 4mm 0 1.6mm; }
  .brief p { font-size: 9.6pt; line-height: 1.62; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  th, td { border: 1px solid #333; padding: 2mm 2.4mm; vertical-align: top; text-align: left; }
  th { background: #efeae0; font-weight: 800; }
  .muted { color: #6b6760; font-size: 8.6pt; }
  ul { margin: 1mm 0 0 5mm; padding: 0; font-size: 9.5pt; line-height: 1.6; }
  /* 라운드 트랙 · 이벤트 카드 */
  .track { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2mm; margin: 4mm 0 5mm; }
  .tr { border: 1.2px solid #333; border-radius: 2mm; padding: 3mm 2mm; text-align: center; }
  .trEv { background: #fdf3dc; border-color: #b8912c; border-width: 2px; }
  .trN { font-size: 17pt; font-weight: 800; }
  .trL { font-size: 7.4pt; color: #6b6760; margin-top: 1mm; }
  .trX { font-size: 6.6pt; font-weight: 800; color: #b8912c; margin-top: 0.8mm; }
  /* 라운드 트랙 · 배치도 — 종이 위에서 「판」으로 보여야 한다. 숫자만 늘어놓으면
     어디에 무엇을 얹는지가 안 보여서, 이벤트 카드를 손에 들고 있다가 잊는 일이 생긴다. */
  .board .trk { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2.4mm; margin: 5mm 0 4mm; }
  .cell { border: 0.6mm solid #2f2b24; border-radius: 2.4mm; padding: 2.6mm 2mm 2.4mm;
          display: flex; flex-direction: column; gap: 1.6mm; background: #fbf9f4; }
  .cellEv { border-color: #b8912c; background: #fffdf4; }
  .cellLast { border-style: dashed; }
  .cellTop { display: flex; align-items: baseline; justify-content: center; gap: 1.2mm; min-height: 9mm; }
  .cellN { font-size: 20pt; font-weight: 800; line-height: 1; }
  .cellTag { font-size: 5.6pt; font-weight: 800; color: #8a6d1f; }
  .cellOpen { font-size: 6.4pt; line-height: 1.4; text-align: center; min-height: 11mm;
              border-top: 0.3mm dashed #cfc7b6; border-bottom: 0.3mm dashed #cfc7b6; padding: 1.4mm 0; }
  .cellDo { font-size: 6.6pt; font-weight: 700; text-align: center; color: #5b5140; }
  .evSlot { margin-top: auto; border: 0.5mm dashed #b8912c; border-radius: 1.6mm;
            min-height: 15mm; display: flex; flex-direction: column; align-items: center;
            justify-content: center; font-size: 7.4pt; font-weight: 800; color: #8a6d1f; text-align: center; }
  .evSlotSub { font-size: 5.4pt; font-weight: 600; color: #a89468; margin-top: 0.8mm; }
  .pawnSlot { margin-top: auto; border: 0.4mm dashed #c3bcae; border-radius: 50%;
              width: 13mm; height: 13mm; align-self: center; display: flex; align-items: center;
              justify-content: center; font-size: 5.6pt; color: #a39a89; text-align: center; }
  .trkEnd { display: flex; align-items: stretch; gap: 1.6mm; margin: 4mm 0 3mm; }
  .endStep { flex: 1; border: 0.4mm solid #b3aa99; border-radius: 1.6mm; padding: 2.2mm 1.6mm;
             font-size: 7pt; text-align: center; background: #f6f4ef; }
  .endArrow { align-self: center; font-size: 9pt; color: #a39a89; }
  /* 탁자 배치도 */
  .tbl { display: flex; flex-direction: column; gap: 2.4mm; margin: 5mm 0 4mm;
         border: 0.8mm solid #2f2b24; border-radius: 3mm; padding: 4mm; background: #f4f1ea; }
  .tblRow { display: flex; gap: 2.4mm; }
  .slot { flex: 1; border: 0.5mm solid #6b6250; border-radius: 2mm; padding: 2.4mm 2mm;
          font-size: 9pt; font-weight: 800; text-align: center; background: #fff; min-height: 14mm;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1mm; }
  .slot span { font-size: 6.2pt; font-weight: 600; color: #6b6250; line-height: 1.35; }
  .slotBox { border-style: dashed; background: #efece5; color: #8a8375; }
  .slotMap { flex: 3; min-height: 26mm; font-size: 11pt; background: #fdfcf9; border-width: 0.8mm; }
  .slotOpen { background: #fdf7e6; border-color: #b8912c; }
  .slotSheet { background: #fbf9f4; }
  .slotSeal { background: #fdf0ee; border-color: #8a3b3b; color: #8a3b3b; }
  .ev { border: 2px solid #b8912c; border-radius: 2mm; padding: 4mm 5mm; margin-bottom: 4mm; background: #fffdf6; }
  .evHead { font-size: 9pt; font-weight: 800; color: #8a6d1f; }
  .evNo { display: inline-block; background: #b8912c; color: #fff; border-radius: 50%;
          width: 6mm; height: 6mm; line-height: 6mm; text-align: center; margin-right: 1.5mm; }
  .evTitle { font-size: 14pt; font-weight: 800; margin: 1.6mm 0 2mm; }
  .evBody { font-size: 9.4pt; line-height: 1.6; }
  .evBody p { margin: 0 0 2mm; }
  .evFold { margin-top: 2.5mm; text-align: center; font-size: 7pt; color: #a09880;
            border-top: 1px dashed #c9bd9a; padding-top: 1.5mm; }
  /* 그림 판 */
  .art { position: relative; margin: 4mm 0; }
  .art img { width: 100%; height: auto; display: block; border-radius: 2mm; }
  .art .zone { position: absolute; border-radius: 1mm; }
  .art .rm { position: absolute; }
  .art .rmName { position: absolute; left: 50%; top: 1.5mm; transform: translateX(-50%);
                 color: #fff; font-size: 7.6pt; font-weight: 800; white-space: nowrap;
                 padding: 0.8mm 2mm; border-radius: 1.2mm; box-shadow: 0 0.3mm 1mm #0005; }
  .art .mk { position: absolute; transform: translate(-50%, -50%); background: #fffffff0;
             border: 0.5mm solid; border-radius: 50%; width: 7.4mm; height: 7.4mm;
             display: flex; align-items: center; justify-content: center;
             font-size: 7pt; font-weight: 800; }
  .art .note { position: absolute; transform: translate(-50%, -50%); white-space: nowrap;
               background: #fffffff2; font-size: 7.4pt; font-weight: 700;
               padding: 0.7mm 1.8mm; border-radius: 1mm; border: 0.4mm solid; }
  /* A4 반접이 인물 시트 — 한 사람이 A4 가로 한 장에 들어가고, 가운데를 세로로 접는다.
     접으면 A5 세로 책자가 된다. 세로 4장을 들고 있으면 남의 눈에 뭐가 보이는지 신경 쓰게 된다.
     접어서 한 장이면 공개 프로필만 겉으로 두고 탁자에 놓아 두면 된다. */
  .fold { width: 297mm; height: 210mm; page-break-after: always; display: flex;
          flex-direction: row; position: relative; }
  .half { flex: 0 0 148.5mm; width: 148.5mm; height: 210mm; padding: 8mm 8mm 5mm; overflow: hidden;
          position: relative; display: flex; flex-direction: column; }
  .foldline { position: absolute; top: 0; bottom: 0; left: 148.5mm; border-left: 0.3mm dashed #c3bcae; }
  .foldtag { position: absolute; left: 148.5mm; bottom: 4mm; transform: translateX(-50%);
             font-size: 6pt; color: #b3aa99; background: #fff; padding: 0 1.5mm; }
  .fold h1 { font-size: 13pt; margin: 0 0 1.6mm; }
  .fold h1 .muted { font-size: 8pt; }
  .fold h2 { font-size: 8.6pt; margin: 1.8mm 0 0.9mm; padding-bottom: 0.7mm;
             border-bottom: 0.8px solid #14120f; break-after: avoid; }
  .fold h2:first-of-type { margin-top: 0; }
  .fold p { font-size: 6.9pt; line-height: 1.46; margin: 0 0 1.2mm; }
  .fold .muted { font-size: 6.6pt; line-height: 1.45; }
  .fold table { font-size: 7.6pt; }
  .fold th, .fold td { padding: 1mm 1.4mm; }
  .fold ul { font-size: 6.8pt; line-height: 1.4; margin: 0 0 1mm 3.4mm; }
  .fold .cname { font-size: 6pt; }
  .sy { font-size: 5.6pt; font-weight: 800; padding: 0.2mm 1mm; border-radius: 0.8mm;
        border: 0.25mm solid; vertical-align: 1px; white-space: nowrap; }
  .syF { color: #2f6b45; border-color: #8fbfa2; background: #eef7f1; }
  .syH { color: #7d6116; border-color: #cfae5e; background: #fdf7e6; }
  .syL { color: #8a3b3b; border-color: #c98a8a; background: #fdf0ee; }
  /* 묻고 답하는 대목 — 표는 좁은 면에서 칸이 뭉개져서, 대신 블록으로 쌓는다. */
  .qa { font-size: 6.9pt; line-height: 1.34; margin: 0 0 0.75mm; }
  .qa > b { color: #4a4436; }
  .qa > b::after { content: ' — '; font-weight: 400; color: #a49b88; }
  .qa > span { display: inline; }
  .qa .press { display: block; }
  .fold .press { margin-top: 0.8mm; font-size: 6.6pt; }
  .fold .box { border: 0.4mm solid #8a3b3b; border-radius: 1.5mm; padding: 1.6mm 2.2mm;
               margin-top: 1.4mm; background: #fdf6f4; }
  .fold .bl { font-size: 8pt; font-weight: 800; color: #8a3b3b; margin-bottom: 0.9mm; }
  .fold .box p { font-size: 6.8pt; line-height: 1.45; margin-bottom: 0.8mm; }
  .cover { justify-content: space-between; }
  .covName { font-size: 30pt; font-weight: 800; letter-spacing: .02em; }
  .covSub { font-size: 9pt; color: #6b6760; margin-top: 1.5mm; }
  .covFoot { font-size: 6.8pt; color: #8a8375; border-top: 0.3mm solid #ded7c7; padding-top: 2mm; }
`;
const doc = (title, body, pageCss = '') => `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>${esc(title)}</title><style>${CSS}${pageCss}</style></head><body>${body}</body></html>`;

// 3x3 면 단위로 자르고, 뒷면은 행마다 좌우를 뒤집어 양면 인쇄를 맞춘다.
function paginate(items, front, back) {
  let out = '';
  for (let i = 0; i < items.length; i += 9) {
    const page = items.slice(i, i + 9);
    out += `<div class="sheet">${page.map(front).join('')}</div>`;
    const mirrored = [];
    for (let r = 0; r < page.length; r += 3) mirrored.push(...page.slice(r, r + 3).reverse());
    out += `<div class="sheet">${mirrored.map(back).join('')}</div>`;
  }
  return out;
}

// V 카드마다 다른 QR — 찍으면 그 컷 하나만 열린다.
//   번호(V8)가 아니라 단서 코드(PKIN-42)를 담는다. 덱 번호가 바뀌어도 인쇄한 QR 이 살아 있게.
let QR = {};
async function buildQR(list) {
  QR = {};
  for (const c of list) {
    QR[c.code] = await QRCode.toString(`${siteUrl}/cctv#${c.code}`,
      { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
  }
  HANDS = HAND_CARDS();
  for (const q of allQ()) {
    QR[`Q:${q.code}`] = await QRCode.toString(`${siteUrl}/unlock#${q.code}`,
      { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
  }
  // 휴대폰·다이어리·성경책 — 카드 한 장에 QR 하나. 속은 /clue 화면에서 넘겨 본다.
  for (const c of allClues) {
    if (!isScreen(c) || QR[c.code]) continue;
    QR[c.code] = await QRCode.toString(`${siteUrl}/clue#${c.code}`,
      { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
  }
}

// ── 잠금 카드 ────────────────────────────────────────────────────────────────
//   가져가는 카드가 아니라 탁자에 펴 두는 게시물이다. QR 을 찍으면 숫자를 넣는 화면이 뜬다.
function lockCards() {
  const face = (q) => `<div class="card" style="border-color:#5a3f8a">
    <span class="no" style="background:#5a3f8a">${q.no}</span>
    <div class="ct">${esc(q.title)}</div>
    <div class="qr">${QR[`Q:${q.code}`] || ''}<div class="qrl">${q.hand ? '찍으면 대조 결과가 나온다' : '찍으면 입력 화면이 열린다'}</div></div>
    <div class="cd">${esc(q.hint)}</div>
    <div class="hint"><div>이 카드는 <b>아무도 가져갈 수 없다.</b> 판 옆에 펴 두고 누구나 찍는다.<br>
      ${q.hand ? `대조하려면 <b>${esc(q.need)}</b>가 손에 있어야 한다.` : '잠긴 것은 카드가 아니라 <b>숫자</b>다.'}</div></div>
  </div>`;
  return `<div class="page"><h1>잠금 카드 — ${allQ().length}장
      <span class="muted">Q1 ~ Q${QCARDS.length} · 필적 대조 Q6-1 ~ Q6-${HANDS.length}</span></h1>
    <p class="muted">앞면이 보이게 판 옆에 펴 둡니다. <b>가져가는 카드가 아닙니다.</b>
      휴대폰 카메라로 QR 을 찍으면 화면이 열리고, 그 사람만 내용을 봅니다.<br>
      <b>Q1~Q5 는 숫자를 넣어야 열립니다.</b> Q1~Q4 는 지워진 카카오톡 대화방이고, Q5 는 수료증 조회입니다.
      숫자는 <b>다른 단서 카드 안에 적혀 있습니다</b> — 그 카드를 손에 넣은 사람이 알려 줄지 말지를 정합니다.
      찍으면 숫자 넣는 칸이 뜨고, <b>맞는 숫자를 넣은 사람만</b> 내용을 봅니다. 틀리면 아무것도 안 나옵니다.<br>
      <b>Q6-n 은 필적 대조입니다.</b> 통 라벨의 글씨를 그 사람의 것과 맞춰 봅니다 —
      <b>그 사람의 손글씨가 있는 카드를 손에 넣은 사람만</b> 찍을 수 있습니다.
      한 장이 한 사람이라, 누가 어느 카드를 찍는지가 그대로 보입니다.</p>
    <div class="sheet">${allQ().map(face).join('')}</div></div>`;
}

// ── 1. 단서 카드 ─────────────────────────────────────────────────────────────
function clueCards() {
  const { bag, special, num, unitNum, partNum } = buildBoard();
  const hints = buildHints(num, partNum);
  // 안내는 번호로 걸려 있다 — 조합 조건이 가리키는 바로 그 장에만 찍힌다.
  const hintFor = (c) => hints[unitNum.get(c)];
  // 특수 카드에는 '무엇 + 무엇으로 얻었는지'를 적는다. 나중에 남에게 근거로 보일 때 필요하다.
  const origin = (c) => {
    const board = BOARD_UNLOCK[c.code];
    const ns = board
      ? board.map(([k, part]) => (part && partNum[`${k}|${part}`]) || num[k])
      : (c.src?.unlockedBy || c.unlockedBy || []).map((k) => num[k]);
    const ok = ns.filter(Boolean);
    return ok.length ? `얻는 법 — ${ok.join(' + ')}` : null;
  };
  // 자기 물건의 감식을 본인이 집으면 무료 방어권이 된다. 소유자가 참가자인 감식만 막는다.
  const mine = (c) => (c.type === '감식' && ROOM_OF[c.person] ? c.person : null);
  // 카드 한 장이 무슨 취급을 받는 물건인지, 집어 들자마자 보이게 한다.
  const badges = (c) => {
    const hs = hintFor(c) || [];
    const b = [];
    if (c.locked) b.push(['bgLock', '🔒', `${c.locked}라운드부터`]);
    if (mine(c)) b.push(['bgLock', '⚖', '본인 낭독 불가']);
    if (hs.some((h) => h.includes('🔬'))) b.push(['bgLab', '🔬', '감식실']);
    if (hs.some((h) => h.includes('⭐'))) b.push(['bgStar', '⭐', '조합 재료']);
    return b.length
      ? `<span class="bgs">${b.map(([k, ic, tx]) =>
          `<span class="bg ${k}"><i>${ic}</i>${tx}</span>`).join('')}</span>`
      : '';
  };
  const deck = (list, meta) => {
    const front = (c) => `<div class="card" style="border-color:${meta.color}">
      <div class="chd"><span class="no" style="background:${meta.color}">${esc(unitNum.get(c))}</span>
        ${badges(c)}</div>
      <div class="ct">${esc(c.title)}</div>
      ${QR[c.code] ? `<div class="qr">${QR[c.code]}<div class="qrl">찍으면 이 장면이 열린다</div></div>`
        : c.image ? `<img class="cimg" src="${esc(img(c.image))}" alt="">` : ''}
      <div class="cd${c.small ? ' sm' : ''}">${esc(c.detail || c.description || '')}</div>
      ${c.locked ? `<div class="lock">🔒 <b>${c.locked}라운드</b>부터다 (영장 ${c.locked === 3 ? '②' : '③'}).
        가져가는 것은 지금도 되지만, 그때까지는 아무도 못 읽는다.<br>
        <b>자기 방에는 못 들어가므로 자기 휴대폰도 못 가져간다.</b></div>` : ''}
      ${mine(c) ? `<div class="lock">⚖ <b>${esc(mine(c))}</b> 본인의 물건에 대한 감식이다.
        <b>${esc(mine(c))}</b> 은(는) 이 결과를 읽을 수 없다 — 다른 사람이 집어 소리 내어 읽는다.</div>` : ''}
      ${meta.letter === 'S' && origin(c) ? `<div class="hint"><div>${esc(origin(c))}</div></div>` : ''}
      ${hintFor(c) ? `<div class="hint">${hintFor(c).map((h) => `<div>${h}</div>`).join('')}</div>` : ''}
    </div>`;
    const back = (c) => `<div class="card cback" style="border-color:${meta.color};background:${meta.color}12">
      <div class="bnum" style="color:${meta.color}">${esc(unitNum.get(c))}</div>
      <div class="bplace" style="color:${meta.color}">${esc(meta.name)}</div>
      ${c.locked ? `<div class="block">🔒 <b>${c.locked}라운드</b>부터<div class="bsub">준비할 때 빼서 따로 둔다</div></div>` : ''}</div>`;
    return `<div class="page"><h1>${esc(meta.name)} — ${list.length}장
      <span class="muted">${meta.letter}1 ~ ${meta.letter}${list.length}</span></h1>
      <p class="muted">${esc(meta.open || '조건을 채우면 이 더미에서 가져간다')} ·
      <b>뒷면(번호)이 보이게</b> 쌓고, 가져간 사람이 앞면을 읽는다.</p></div>`
      + paginate(list, front, back);
  };
  let body = '';
  for (const p of PLACES) if (bag[p.id].length) body += deck(bag[p.id], p);
  if (special.length) body += deck(special, SPECIAL);
  body += lockCards();
  return { filename: '보드_단서카드.html', html: doc('보드게임 단서 카드', body) };
}

// ── 2. 인물 시트 — A4 한 장에 한 사람, 가로로 반 접는다 ──────────────────────
//   세로 4장을 손에 들고 있으면 어느 장이 공개고 어느 장이 비밀인지 매번 확인해야 하고,
//   옆 사람 눈에 뒷장이 비친다. 한 장으로 접어 두면 겉에는 공개 프로필만 있고
//   나머지는 펼쳐야 보인다 — 탁자에 그대로 두었다가 필요할 때만 편다.
//   면은 넷이다: 겉(공개) · 안 위(비밀 시나리오) · 안 아래(대본) · 뒷면(상황별 대응).
function charCards() {
  const li = (a) => a.map((x) => `<li>${x}</li>`).join('');
  const { num } = buildBoard();
  const SID = { 최종현: 'S1', 강지후: 'S2', 한소미: 'S3', 서지안: 'S4', 한다영: 'S5', 문세린: 'S6' };
  const OFF_DECK = {
    'LONS-62': '이벤트 ①',
    'BRIF-00': '시작 시트',
    'SIAH-72': 'V 더미',
  };
  const no = (code) => num[code] || OFF_DECK[code] || '(덱 밖)';
  const titleOfCode = Object.fromEntries(allClues.map((c) => [c.code, c.title || '']));
  const OFF_TITLE = { 'LONS-62': '2차 부검 — 타살 확정', 'BRIF-00': '사건 브리핑', 'SIAH-72': 'CCTV 열람실' };
  const named = (code) => {
    const t = titleOfCode[code] || OFF_TITLE[code] || '';
    return `<b>${esc(no(code))}</b>${t ? ` <span class="cname">${esc(t)}</span>` : ''}`;
  };
  // 표는 좁은 단을 넘어갈 때 줄이 깨진다. 묻고 답하는 대목은 블록으로 쌓는다.
  // 앱에서는 추궁하는 쪽이 고르는 질문 제목이라 사실을 단정해도 된다. 종이는 다르다 —
  //   당사자가 판 시작 전에 자기 시트를 통째로 읽으므로, 제목이 사실이면 그 순간 아는 사람이 된다.
  const ASK_AS = {
    '라벨이 바뀐 것에 대해': '누군가 "라벨이 바뀐 것 같다"고 하면',
    '라벨의 글씨를 대조해 봤습니다': '누군가 라벨 글씨를 대조해 봤다고 하면',
  };
  const asked = (q) => ASK_AS[q] || q;
  // 이 답이 사실인지, 사실이되 감춘 것이 있는지, 아예 거짓인지. 연기하는 사람이 스스로
  //   가늠하기 어려운 대목이라 표시해 둔다 — 「감춤」은 거짓말 없이 몰리는 자리다.
  const SAY_CLS = { '사실': 'syF', '감춤': 'syH', '거짓': 'syL' };
  const say = (v) => (v ? ` <span class="sy ${SAY_CLS[v] || ''}">${esc(v)}</span>` : '');
  const deCode = (t) => String(t)
    .replace(/([A-Z]{4}-\d{2})/g, (m, code) => (num[code] ? `<b>${num[code]}</b>` : ''))
    .replace(/[(（]\s*(?:\d단\s*·\s*)?\s*[)）]/g, '')
    .replace(/[(（]\s*·\s*/g, '(')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([)）,.])/g, '$1')
    .trim();

  const qa = (rows) => rows.map(([q, a]) =>
    `<div class="qa"><b>${q}</b><span>${a}</span></div>`).join('');

  // 면 ① 겉 — 접었을 때 위로 오는 면. 남이 봐도 되는 것만 있다.
  const cover = (s) => `<div>
      <div class="covName">${esc(s.name)}</div>
      <div class="covSub">${s.age}세 · ${esc(s.gender)} · ${esc(s.occupation)}</div>
    </div>
    <div>
      <table><tr><th style="width:22%">가족</th><td>${esc(s.family || '-')}</td></tr>
        <tr><th>알려진 것</th><td>${esc(s.notes || '')}</td></tr></table>
      <p style="margin-top:3mm">1라운드 시작 전에 위 내용을 자기 말로 소개합니다.
        <b>접힌 안쪽은 절대 보여 주지 않습니다.</b></p>
    </div>
    <div class="covFoot"><b>A4 가로</b>로 양면 인쇄해 가운데 점선을 세로로 접으세요.
      접으면 이 면만 보입니다 — 안쪽 세 면은 본인만 폅니다.</div>`;

  // 면 ② 안 위 — 비밀 시나리오
  const secret = (s) => {
    const b = BIBLE[s.name] || {};
    // 언제 무너지는지는 자기 시나리오의 끝이다. 대본 면은 문답만으로도 거의 차다.
    const hits = b.knowsWhatBreaks === false ? []
      : (INTERROGATION[SID[s.name]]?.statements || [])
        .filter((x) => x.contradict).map((x) => x.contradict);
    return `<h1>${esc(s.name)} <span class="muted">— 비밀 시나리오 (본인만)</span></h1>
      <p class="muted">${esc(b.meta || '')}</p>
      <h2>당신의 정체</h2><p>${b.identity || ''}</p>
      <h2>당신의 그날</h2>
      ${qa((b.timeline || []).map(([t, x]) => [esc(t), x]))}
      <h2>당신이 아는 것</h2><ul>${li(b.knows || [])}</ul>
      <p class="muted">여기 없는 것은 <b>당신도 모르는 것</b>입니다.</p>
      <h2>금지 사항 — 반드시 지키세요</h2><ul>${li(b.forbidden || [])}</ul>
      ${b.knowsWhatBreaks === false ? `<div class="box">
        <p><b>당신은 숨기는 것이 없습니다.</b> 그래서 판이 무엇을 파내든 전부 처음 듣는 이야기입니다.
          뜻밖의 것이 나오면 <b>그 자리에서 처음 본 사람처럼</b> 반응하고, 그게 무슨 뜻인지 <b>남들에게 물으세요.</b></p></div>`
        : ''}
      ${hits.length ? `<div class="box"><div class="bl">⚠ 여기서 무너집니다 — 버티지 마세요</div>
        ${hits.map((h) => `<p>${b.breakAs?.[(h.codes || [])[0]]
            || `${(h.codes || []).map(named).join(' 또는 ')} 가 나오면`}:<br>
          ${h.text || ''}${h.confess ? '<br><b>— 여기서 인정합니다.</b>' : ''}</p>`).join('')}
        <p class="muted">나온 뒤에도 계속 우기면 게임이 멈춥니다 — 무너지는 것이 당신의 역할입니다.
          <b>뒷면 「상황별 대응」과 어긋나면 그쪽을 따르세요.</b></p></div>` : ''}`;
  };

  // 면 ③ 안 아래 — 앱판 심문 정본에서 뽑은 대본
  const lines = (name) => {
    const d = INTERROGATION[SID[name]];
    if (!d) return '';
    const st = d.statements || [];
    const soft = [];
    for (const x of st) for (const [code, r] of Object.entries(x.soft || {})) soft.push([code, r]);
    return `<h1>${esc(name)} <span class="muted">— 대본 (본인만)</span></h1>
      <p class="muted">외울 필요는 없습니다. <b>상황에 맞게 자기 말로, 즉흥으로 대응하세요.</b>
        여기 없는 질문은 시나리오에 맞게 지어내면 됩니다 — 다만 <b>사실관계는 벗어나지 마세요.</b></p>
      <h2>이렇게 물으면 이렇게</h2>
      <p class="muted">답마다 <span class="sy syF">사실</span> <span class="sy syH">감춤</span>
        <span class="sy syL">거짓</span> 이 붙어 있습니다 — <b>감춤</b>은 말한 것 자체는 사실이되
        중요한 것을 빼놓은 것입니다. 굳이 거짓말까지 할 자리가 아닙니다.</p>
      ${qa(st.map((x) => [esc(asked(x.q || '')) + say(x.say),
        `${x.text || ''}${x.press ? `<div class="press"><b>더 캐물으면</b> ${x.press}</div>` : ''}`]))}
      ${(BIBLE[name]?.script || []).length ? `<h2>이렇게 몰리면</h2>
        ${qa(BIBLE[name].script.map(([q, a]) => [deCode(esc(q)), deCode(a)]))}` : ''}
`;
  };

  // 면 ④ 뒷면 — 보드에서만 벌어지는 국면. 앱에는 없어서 심문 정본만으로는 대응이 안 나온다.
  const moments = (name) => {
    const s = BOARD_SCRIPT[name];
    if (!s) return '';
    // 카드가 나왔을 때의 반응은 여기 한 면에 모은다 — 대본 면에 두면 두 면 다 넘친다.
    const d = INTERROGATION[SID[name]];
    const drop = new Set(s.dropSoft || []);
    const over = s.soft || {};
    const soft = [];
    for (const x of (d?.statements || [])) {
      for (const [c, r] of Object.entries(x.soft || {})) {
        if (drop.has(c)) continue;
        soft.push([c, over[c] || (typeof r === 'string' ? r : r?.text || '')]);
      }
    }
    return `<h1>${esc(name)} <span class="muted">— 이 상황에서는 이렇게 (본인만)</span></h1>
      <h2>말투</h2><p>${s.tone}</p>
      <h2>당신이 알고 있어서 자꾸 걸리는 것</h2>
      <p class="muted">누구를 의심하라는 지시가 아닙니다. <b>당신이 아는 사실</b>일 뿐입니다 —
        이걸 지키려다 보면 시선은 저절로 어디론가 향합니다.</p>
      ${qa(s.watch.map(([a, b]) => [esc(a), esc(b)]))}
      <h2>상황별 대응</h2>
      ${qa(s.moments.map(([a, b]) => [esc(a), b]))}
      <h2>이 번호의 카드가 나오면</h2>
      ${qa(Object.entries(s.onCard).map(([c, t]) => [named(c), esc(t)]))}
      ${soft.length ? `<h2>이 카드를 내밀면</h2>${qa(soft.map(([c, r]) => [named(c), r]))}` : ''}
`;
  };

  const sheet = (left, right, leftCls = '') => `<div class="fold">
    <div class="half ${leftCls}">${left}</div>
    <div class="foldline"></div><div class="foldtag">세로로 접는 선</div>
    <div class="half">${right}</div></div>`;

  const body = suspects.map((s) =>
    sheet(cover(s), secret(s), 'cover') + sheet(lines(s.name), moments(s.name))).join('');
  const landscape = '@page { size: A4 landscape; margin: 0; }';
  return { filename: '보드_인물카드.html',
    html: doc('보드게임 인물 시트', body + detectiveCard(named, sheet, qa), landscape) };
}

// ── 7인 모드 · 형사 시트 ─────────────────────────────────────────────────────
//   여섯이면 이 한 장을 빼고, 일곱이면 넣는다. 다른 인물과 같은 반접이 형식이되
//   비밀 시나리오가 없다 — 숨길 것이 없는 사람이라 채울 면이 하나 적다.
function detectiveCard(no, sheet, qa) {   // no 는 이름까지 붙은 HTML 을 돌려준다
  const d = DETECTIVE;
  const li = (a) => a.map((x) => `<li>${x}</li>`).join('');
  const cover = `<div>
      <div class="covName">${esc(d.name)} 형사</div>
      <div class="covSub">47세 · 남성 · 관할서 강력팀 · 이 사건 담당</div>
    </div>
    <div>
      <table><tr><th style="width:22%">알려진 것</th>
        <td>13시 31분 신고를 받고 온 담당 형사. 초동 수사를 마치고 관계자 여섯을 불러 모았다.</td></tr></table>
      <div class="box"><div class="bl">형사는 용의자가 아닙니다</div>
        <p>목사님을 죽인 사람은 나머지 여섯 안에 있습니다. <b>아무도 형사를 지목하지 않습니다.</b>
          그 대신 형사는 <b>자기 방이 없습니다</b> — 처음부터 끝까지 아무 방이나 갈 수 있고,
          1라운드에 낭독할 자기 물건도 없습니다. 조사·토론·지목은 나머지와 똑같이 합니다.</p></div>
    </div>
    <div class="covFoot">여섯이 하면 이 장을 빼세요. <b>A4 가로</b>로 양면 인쇄해 가운데 점선을 세로로 접습니다.</div>`;
  const inner = `<h1>${esc(d.name)} 형사 <span class="muted">— 당신이 아는 것 (본인만)</span></h1>
    <h2>당신의 정체</h2><p>${esc(d.identity)}</p>
    <h2>당신의 그날</h2>
    ${qa(d.timeline.map(([t, x]) => [esc(t), esc(x)]))}
    <h2>당신이 아는 것</h2><ul>${li(d.knows.map(esc))}</ul>
    <p class="muted">여기 없는 것은 <b>당신도 모르는 것</b>입니다.</p>
    <h2>지켜야 할 것</h2><ul>${li(d.forbidden.map(esc))}</ul>`;
  const back = `<h1>${esc(d.name)} 형사 <span class="muted">— 이 상황에서는 이렇게</span></h1>
    <h2>말투</h2><p>${esc(d.tone)}</p>
    <h2>당신이 알고 있어서 자꾸 걸리는 것</h2>
    ${qa(d.watch.map(([a, b]) => [esc(a), esc(b)]))}
    <h2>상황별 대응</h2>
    ${qa(d.moments.map(([a, b]) => [esc(a), esc(b)]))}
    <h2>이 번호의 카드가 나오면</h2>
    ${qa(Object.entries(d.onCard).map(([c, t]) => [no(c), esc(t)]))}
    <div class="box"><div class="bl">결론을 대신 내려 주지 마세요</div>
      <p>아무도 당신을 의심하지 않으니 마음껏 물을 수 있습니다. 그런데 그 편함으로 판을
        정리해 버리면 <b>나머지 여섯이 구경꾼이 됩니다.</b> 묻고, 짚고, 기다리세요.
        답은 저들의 입에서 나와야 합니다.</p></div>`;
  return sheet(cover, inner, 'cover') + sheet(back, '<p class="muted">(비워 둡니다 — 형사에게는 숨길 시나리오가 없습니다.)</p>');
}

// ── 3. 장소 판 + 공개 단서 ───────────────────────────────────────────────────
function placeBoard() {
  const { bag, open, num } = buildBoard();
  const counts = Object.fromEntries(Object.entries(bag).map(([k, v]) => [k, v.length]));
  const openPages = open.map((c) => {
    const rows = (c.schedule?.entries || [])
      .map((e) => `<tr><td>${esc(e.time)}</td><td>${esc(e.person)}</td><td>${esc(e.content)}</td></tr>`).join('');
    return `<div class="page"><h1>${esc(c.title)} <span class="muted">— 공개 단서</span></h1>
      <p class="muted">목사님의 방이 열릴 때 판 옆에 펴 둔다.
        <b>아무도 가져갈 수 없고, 전원이 언제든 읽는다.</b></p>
      ${rows ? `<table><tr><th style="width:18%">시각</th><th style="width:22%">상대</th><th>목격된 것</th></tr>${rows}</table>`
        : `<p>${esc(c.detail || c.description || '')}</p>`}
      <h2>이 단서가 여는 질문</h2>
      <p>목사님은 사건 전날 다섯 명을 따로 불렀다. <b>무슨 이야기를 했는가?</b>
        면담 내용은 이 표에 없다 — 당사자에게 직접 물어야 한다.</p></div>`;
  }).join('');
  const side = PLACES.filter((p) => !ART_ROOMS.some((r) => r.id === p.id));
  const body = `<div class="page"><h1>사건 현장 — 숙소 2층</h1>
    <p class="muted">탁자 가운데에 까는 판이다. <b>A3 가로</b> 권장.
      카드는 판 위에 올리지 않고 장소별로 옆에 쌓는다. 방 안의 번호는 <b>고를 자리</b>이지
      물건이 놓인 위치가 아니다 — "A3 볼게요" 하고 그 번호 카드를 집으면 된다.</p>
    ${illustratedMapHTML(counts, img('/images/board/2층평면.png'))}
    <p class="muted">복도 끝 CCTV는 <b>복도만</b> 비춘다. 방문 앞은 사각이라
      누가 방에 들어갔는지는 찍히지 않는다 — 이 사건의 전제다.</p>
    <h2>판 밖 시설</h2>
    <table><tr><th style="width:22%">장소</th><th style="width:16%">번호</th><th>여는 시점</th></tr>
      ${side.map((p) => `<tr><td>${esc(p.name)}</td>
        <td>${p.letter}1~${p.letter}${counts[p.id]}</td><td>${esc(p.open)}</td></tr>`).join('')}
      <tr><td>특수 단서</td><td>S1~S${Object.values(num).filter((v) => v.startsWith('S')).length}</td>
        <td>카드에 적힌 조건을 채우면 가져간다</td></tr></table>
  </div>${openPages}`;
  return { filename: '보드_장소판.html', html: doc('보드게임 장소 판', body) };
}

// ── 4. 진행 물품 — 시작 시트 · 라운드 트랙 · 이벤트 카드 ────────────────────
//   진행자가 없으므로 진행자가 하던 일(브리핑 읽기·이벤트 열기)을 물건이 대신한다.
function runSheets() {
  const brief = allClues.find((c) => c.code === 'BRIF-00');
  const pages = (brief?.pages || []).map((pg) =>
    `<h2>${esc(pg.title)}</h2><p style="white-space:pre-wrap">${esc(pg.content)}</p>`).join('');
  const ev = (n, when, title, body) => `<div class="ev">
    <div class="evHead"><span class="evNo">${n}</span> ${esc(when)}</div>
    <div class="evTitle">${esc(title)}</div><div class="evBody">${body}</div>
    <div class="evFold">— 접어서 뒷면이 보이게 트랙 위에 둔다 —</div></div>`;
  const body = `<div class="page brief"><h1>사건 브리핑 <span class="muted">— 시작할 때 함께 읽으세요</span></h1>
    <p class="muted">인물 카드를 나눠 갖고 자기소개를 마친 뒤, 이 시트를 소리 내어 돌려 읽습니다.
      한 사람이 한 절씩 읽으면 됩니다.</p>${pages}
    <h2>그리고 규칙 하나</h2>
    <p>여러분 중 <b>한 명이 범인</b>입니다. 범인도 남들과 똑같이 수사에 참여하고, 거짓말을 합니다.
      나머지는 자기가 결백하다는 것만 알 뿐, 누가 범인인지는 모릅니다.</p></div>

  <div class="page board"><h1>라운드 트랙 <span class="muted">— 판 옆에 펴 두세요</span></h1>
    <p class="muted">라운드가 끝날 때마다 <b>말을 한 칸 옮깁니다.</b> 말은 동전이든 무엇이든 됩니다.
      <b>1·2·3·4 칸의 네모 자리에 이벤트 카드를 접어 얹어 두고</b>, 그 라운드가 끝나면 뒤집어 함께 읽습니다.</p>
    <div class="trk">${[1, 2, 3, 4, 5, 6].map((n) => {
      const ev = { 1: '①', 2: '②', 3: '③', 4: '④' }[n];
      const open = {
        2: '목사님의 방<br>— 현장',
        3: '목사님의 방 — 기록<br>🔒3 휴대폰',
        4: '감식실 L',
        5: 'CCTV 열람실 V',
      }[n];
      return `<div class="cell${ev ? ' cellEv' : ''}${n === 6 ? ' cellLast' : ''}">
        <div class="cellTop"><span class="cellN">${n}</span>${n === 6
          ? '<span class="cellTag">여섯일 때만</span>'
          : n === 5 ? '<span class="cellTag">일곱은 여기서 끝</span>' : ''}</div>
        <div class="cellOpen">${open ? `<b>여기서 열립니다</b><br>${open}` : '<span class="muted">새로 열리는 곳 없음</span>'}</div>
        <div class="cellDo">조사 2장<br>토론 10분</div>
        ${ev ? `<div class="evSlot">이벤트 ${ev}<div class="evSlotSub">라운드 끝에 뒤집는다</div></div>`
          : '<div class="pawnSlot">말 자리</div>'}
      </div>`;
    }).join('')}</div>
    <div class="trkEnd">
      <div class="endStep"><b>최종 토론</b> 15분</div>
      <div class="endArrow">→</div>
      <div class="endStep"><b>지목</b> 한 명씩 동시에</div>
      <div class="endArrow">→</div>
      <div class="endStep"><b>진상 해설서</b> 봉투를 연다</div>
      <div class="endArrow">→</div>
      <div class="endStep"><b>감상전</b> 10분</div>
    </div>
    <p class="muted"><b>여섯이면 6라운드, 일곱이면 5라운드입니다.</b>
      일곱은 한 라운드에 조사가 일곱 번 돌아, 라운드가 하나 적어도 전체 조사 횟수는
      거의 같습니다 — 35회와 36회. 조사해 가져갈 카드는 모두 <b>75장</b>이라,
      여섯이 6라운드면 72장, 일곱이 5라운드면 70장을 엽니다 — 거의 다 열고 끝납니다.<br>
      <b>일곱이면 형사도 한 표를 던집니다.</b> 다만 아무도 형사를 지목하지 않습니다.</p>
  </div>

  <div class="page board"><h1>탁자에 이렇게 놓습니다</h1>
    <p class="muted">가운데에 현장 판을 깔고, 장소마다 카드를 따로 쌓습니다.
      <b>카드는 판 위에 올리지 않습니다</b> — 판은 어디를 고를지 보는 그림이고, 카드는 그 옆에 쌓입니다.</p>
    <div class="tbl">
      <div class="tblRow">
        <div class="slot slotDim">A<br><span>한다영</span></div>
        <div class="slot slotDim">B<br><span>한소미</span></div>
        <div class="slot slotDim">C<br><span>서지안</span></div>
        <div class="slot slotBox">D<br><span>목사님의 방<br>현장 2R · 기록 3R 부터</span></div>
      </div>
      <div class="tblRow">
        <div class="slot slotWide slotMap">현장 판 <span>숙소 2층 평면도 · A3 가로</span></div>
        <div class="slot slotBox">V<br><span>CCTV 열람실<br>5라운드부터</span></div>
      </div>
      <div class="tblRow">
        <div class="slot slotDim">E<br><span>최종현</span></div>
        <div class="slot slotDim">F<br><span>문세린</span></div>
        <div class="slot slotDim">G<br><span>강지후</span></div>
        <div class="slot slotBox">L<br><span>감식실<br>4라운드부터</span></div>
      </div>
      <div class="tblRow">
        <div class="slot slotOpen">S <span>특수 단서 — 처음부터 꺼내 둔다</span></div>
        <div class="slot slotOpen">Q <span>잠금 카드 12장 — 앞면이 보이게</span></div>
        <div class="slot slotOpen">공개 <span>목사님 일정표 — 2라운드에 펴 둔다</span></div>
      </div>
      <div class="tblRow">
        <div class="slot slotSheet">라운드 트랙 <span>말 하나</span></div>
        <div class="slot slotSheet">기본 규칙 시트 <span>앞·뒷장</span></div>
        <div class="slot slotSheet">사건 기록판 <span>연필</span></div>
        <div class="slot slotSeal">진상 해설서 <span>봉투째 — 끝나기 전엔 열지 않는다</span></div>
      </div>
    </div>
    <p class="muted"><b>사람마다 손에 드는 것</b> — 인물 시트 한 장(접어서 겉면만 보이게)과
      휴대폰 하나. 가져간 카드는 자기 앞에 <b>번호가 보이게</b> 늘어놓습니다 —
      무엇을 몇 장 가졌는지는 서로 보이고, 그 내용만 자기 것입니다.</p>
  </div>


  <div class="page"><h1>기본 규칙 <span class="muted">— 판 옆에 펴 두세요</span></h1>
    <h2>한 라운드</h2>
    <p>①<b>조사</b> — 순서대로 한 명씩, 열려 있는 장소 <b>하나</b>를 골라 그 장소의 남은 번호 중
      <b>2장</b>을 가져갑니다. 가져간 번호는 남이 못 가집니다. 내용은 자기만 읽습니다.<br>
      &nbsp;&nbsp;시작 플레이어는 <b>라운드마다 한 칸씩 돕니다.</b><br>
      &nbsp;&nbsp;<b>가져오면 그 자리에서 읽습니다 — 소리 내지 말고 혼자서.</b> 남은 번호만 봅니다.<br>
      &nbsp;&nbsp;<span class="muted">읽고 나서 토론에 들어갑니다. 안 읽고 넘어가면 그 라운드 조사가
      발언에 아무 영향을 못 줍니다. 무엇을 읽었는지는 토론에서 <b>말하고 싶은 만큼만, 사실이든
      거짓이든 자유롭게</b> 말합니다.</span><br>
      ②<b>토론 10분</b> — 카드를 <b>보여 주지 않고</b> 말로만 공유합니다. 거짓말해도 됩니다.<br>
      ③<b>종료</b> — 트랙의 말을 한 칸 옮기고, 이벤트 칸이면 이벤트 카드를 펼칩니다.</p>
    <h2>한 방에 세 명까지</h2>
    <p>같은 라운드에 <b>같은 장소로는 세 명까지</b> 갑니다. 네 번째 사람은 다른 곳으로 가세요.<br>
      <span class="muted">여섯이 한 방에 몰리면 뒷순번은 집을 카드가 없어 그 라운드 발언 재료가
      0이 됩니다. 실제로 세 번 일어났습니다.</span></p>

    <h2>가져갈 수 없는 카드</h2>
    <p>· <b>자기 방에는 들어갈 수 없습니다.</b> 처음부터 끝까지, 한 라운드도 예외가 없습니다.
      자기 물건은 <b>남이 찾아 읽습니다.</b><br>
      &nbsp;&nbsp;<span class="muted">자기한테 불리한 카드를 자기가 먼저 집어 자기 입으로 해명하는 것이
      언제나 최선이 되면, 아무도 걸리지 않고 판이 멈춥니다. 내 방은 남이 뒤집니다 — 그게 이 게임입니다.</span><br>
      <span class="muted">(감식은 아래를 따릅니다)</span></p>
  </div>

  <div class="page"><h1>기본 규칙 <span class="muted">— 뒷장</span></h1>
    <h2>모르는 말이 나오면</h2>
    <p><b>각자 휴대폰으로 찾아봐도 됩니다.</b> 요힘빈이 무엇인지, 졸피뎀이 어떤 약인지,
      설하정을 언제 쓰는지 — 카드에 다 적혀 있지 않습니다.
      찾아본 것을 말할지 말지는 본인이 정합니다. <b>검색으로 알아낸 것도 이 판의 단서입니다.</b></p>

    <h2>카드 위쪽의 표시 — 네 가지</h2>
    <table><tr><th style="width:20%">표시</th><th>뜻</th></tr>
      <tr><td><span class="lg">🔒</span> <b>3라운드부터</b></td>
        <td>휴대폰입니다. <b>준비할 때 빼서 따로 두었다가</b>, 2라운드가 끝나면 각 방 더미에 섬어 넣습니다.
          카드 뒷면에도 같은 표시가 있습니다 — 그걸 보고 골라내세요.</td></tr>
      <tr><td><span class="lg">⚖</span> <b>본인 낭독 불가</b></td>
        <td>자기 물건을 감식한 결과입니다. 카드에 적힌 사람은 <b>이 결과를 읽을 수 없습니다</b> — 다른 사람이 집어 소리 내어 읽습니다.</td></tr>
      <tr><td><span class="lg">🔬</span> <b>감식실</b></td>
        <td>채취물입니다. 감식실이 열린 뒤부터 라운드 끝에 감식실 옆에 내려놓으세요.
          <b>내는 데는 조사 행동을 쓰지 않습니다.</b> 카드 아래에 결과 번호가 적혀 있습니다.</td></tr>
      <tr><td><span class="lg">⭐</span> <b>조합 재료</b></td>
        <td>다른 카드와 함께 모으면 <b>특수 단서(S)</b> 를 가져갑니다. 무엇과 묶는지는 카드 아래에 적혀 있습니다.
          <b>가진 사람이 달라도 됩니다</b> — 합의해서 판 가운데에 공개하면 함께 가져갑니다.</td></tr></table>

    <h2>특수 단서</h2>
    <p>카드에 적힌 조합(⭐)을 손에 다 모으면, 특수 더미에서 그 번호를 <b>말없이 가져갑니다.</b>
      무엇으로 얻었는지는 특수 카드 앞면에 적혀 있습니다.</p>
    <h2>감식 — 낸 사람과 읽는 사람이 다르다</h2>
    <p>🔬 표시가 있는 카드는 <b>채취물</b>입니다. 감식실이 열린 뒤부터,</p>
    <p>1. 채취물을 가진 사람이 라운드 끝에 그 카드를 <b>앞면으로 감식실 옆에 내려놓습니다.</b>
      <b>조사 행동을 쓰지 않습니다.</b> <b>사람마다 한 라운드에 한 장</b>씩 낼 수 있으니,
      여섯 명이 같은 라운드에 여섯 장을 내도 됩니다. 무엇을 냈는지는 전원이 봅니다.<br>
      2. 다음 라운드 시작 때, <b>낸 사람이 아닌 다른 사람</b>이 그 결과 번호(L…)를 집어
      <b>소리 내어 읽습니다.</b> 읽은 뒤 그 카드는 읽은 사람이 갖습니다.<br>
      3. 낼 사람이 없으면 채취물을 <b>다른 사람에게 넘겨</b> 대신 내게 할 수 있습니다.
      감식실에 내는 목적일 때만 카드를 넘길 수 있습니다.<br>
      4. <b>마지막 라운드에 낸 것은 최종 토론이 시작될 때 읽습니다.</b> 마지막 라운드라고 해서
      버려지지 않습니다 — 늦게라도 내는 것이 안 내는 것보다 낫습니다.</p>
    <p class="muted">결과를 읽는 손과 결과가 걸린 목이 같으면 그 카드는 증거가 아니라 증언이 됩니다.
      그래서 낸 사람은 자기 결과를 못 읽습니다. 반대로 "내 물건이라 아예 못 낸다"고 해 두면
      그 카드가 영영 잠기므로, 넘겨서 내는 길을 열어 둡니다.</p></div>

  <div class="page"><h1>사건 기록판 <span class="muted">— 판 가운데에 펴 두세요</span></h1>
    <p class="muted">진행자가 없으니 판이 무엇을 확정했는지 아무도 기록하지 않습니다. 그러면 같은 질문이
      네 번 반복되고, 시간표를 매 라운드 다시 계산하게 됩니다. <b>라운드가 끝날 때마다 한 줄씩</b>
      채우세요. 한 사람이 맡지 말고 그 라운드 시작 플레이어가 적습니다.</p>
    <table><tr><th style="width:8%">R</th><th style="width:46%">이번 라운드에 확정된 사실</th>
      <th>답을 못 받은 질문 — 다음 토론 첫머리에 반드시 답한다</th></tr>
      ${[1,2,3,4,5,6].map((n) => `<tr style="height:13mm"><td style="text-align:center;font-weight:800">${n}</td><td></td><td></td></tr>`).join('')}</table>
    <h2>그날의 시간표 <span class="muted">— 밝혀진 것만 적습니다</span></h2>
    <table><tr><th style="width:14%">시각</th><th style="width:20%">누가</th><th>무엇을 했나 · 근거 번호</th></tr>
      ${Array.from({ length: 10 }).map(() => '<tr style="height:9mm"><td></td><td></td><td></td></tr>').join('')}</table>
    <p class="muted">근거 번호를 꼭 같이 적으세요. "누가 그렇게 말했다"와 "어느 카드에 그렇게 적혀 있다"는
      다릅니다 — 이 판에서 사람이 속는 자리가 정확히 거기입니다.</p></div>

  <div class="page"><h1>이벤트 카드 <span class="muted">— 잘라서 접어 두세요</span></h1>
    ${ev('①', '1라운드가 끝나면 펼친다', '2차 부검 소견 — 타살로 확정',
      `<p>정밀 부검 결과가 왔습니다. <b>심정지가 아니라 질식사</b>입니다.
        코·입 주변 압박흔과 안면 점상출혈, 그리고 기도에서 베개 솜·섬유가 검출됐습니다.</p>
      <p><b>목사님의 방 — 현장이 열립니다.</b> 그 카드들을 탁자에 놓고,
        「목사님 일정표」는 <b>앞면이 보이게</b> 그 옆에 펴 둡니다 — 이 한 장은 아무도 가져갈 수 없습니다.</p>`)}
    ${ev('②', '2라운드가 끝나면 펼친다', '유품 반출 동의 · 통신 기록 영장',
      `<p>유족이 유품 반출에 동의했고, 통신 기록 영장이 나왔습니다.</p>
      <p><b>목사님의 방 — 기록이 열립니다.</b> 일기장과 휴대폰입니다.<br>
        그리고 <b>따로 빼 두었던 🔒3 휴대폰 카드를 각 방 더미에 섞어 넣습니다.</b>
        이제부터 각 방에서 그 방 주인의 휴대폰을 가져갈 수 있습니다. 자기 방에는 못 들어가니 <b>자기 폰은 남이 읽습니다.</b></p>`)}
    ${ev('③', '3라운드가 끝나면 펼친다', '압수수색 영장 — 감정 의뢰까지',
      `<p>영장 범위가 넓어졌습니다. 채취한 것을 정식으로 감정에 넘길 수 있습니다.</p>
      <p><b>감식실(L)이 열립니다.</b> 이번 라운드 끝부터 채취물을 낼 수 있습니다.<br>
        <span class="muted">🔬 표시가 있는 카드를 가진 사람은 라운드 끝에 감식실 옆에 내려놓으세요.
        결과는 다음 라운드에 <b>낸 사람이 아닌 다른 사람</b>이 집어 소리 내어 읽습니다.</span></p>`)}
    ${ev('④', '4라운드가 끝나면 펼친다', '복도 CCTV 원본 확보',
      `<p>숙소 2층 복도 CCTV 원본을 확보했습니다. 그날 누가 언제 움직였는지가 남아 있습니다.</p>
      <p><b>CCTV 열람실(V)이 열립니다.</b> 더미를 탁자에 놓습니다.<br>
        <span class="muted">방 안은 찍히지 않습니다. 복도만입니다.</span></p>`)}
  </div>`;


  return { filename: '보드_진행물.html', html: doc('보드게임 진행 물품', body) };
}

/**
 * data: { allClues, suspects } — 정본
 * opts.assetBase: 그림 경로 앞에 붙일 것. Node 는 출력물이 output/html/ 에 놓이므로
 *   저장소 루트까지 네 단계 올라가야 하고, 브라우저는 사이트 루트라 그대로 쓴다.
 */
export async function genBoardDocs(data, opts = {}) {
  allClues = data.allClues;
  suspects = data.suspects;
  const base = opts.assetBase ?? '../../../../public';
  img = (p) => base + p;
  if (opts.siteUrl) siteUrl = opts.siteUrl;
  await buildQR(buildBoard().bag.CC);        // V 카드 QR 을 먼저 만들어 둔다
  return [charCards(), clueCards(), placeBoard(), runSheets()];
}
