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
import { illustratedMapHTML, ART_ROOMS, shortLabel } from './boardMap.mjs';
import { cctvRoomHTML, labRoomHTML, ROOM_CSS } from './boardRooms.mjs';
import QRCode from 'qrcode';

// 정본 데이터는 주입받는다 — Node(문서 생성기)는 loadData.mjs 가 fs 로 비밀팩을 찾아 넘기고,
//   브라우저(웹 키트)는 @secrets 별칭으로 번들된 것을 넘긴다. loadData 를 직접 import 하면
//   node:fs 가 딸려 들어와 브라우저 번들이 깨진다.
let allClues = [], suspects = [], recover = {}, img = (p) => p, siteUrl = 'https://crimescene.dawndew.org';

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));

// 판 위 7개 방 + 판 밖 시설 2곳. 순서가 곧 카드 번호 순서다.
const PLACES = [
  ...ART_ROOMS.map((r) => ({ id: r.id, letter: r.letter, name: r.label, color: r.color, open: '처음부터' })),
  { id: 'CC', letter: 'V', name: 'CCTV 열람실', color: '#2b6b73', open: '이벤트 ③ 을 읽은 뒤' },
  { id: 'LB', letter: 'L', name: '감식실', color: '#5a5a5a', open: '이벤트 ② 를 읽은 뒤 · 채취물 제출 전용' },
];
// 개방 시점은 라운드 숫자가 아니라 이벤트 번호로 적는다. 여섯이면 6라운드, 일곱이면 5라운드라
//   이벤트가 붙는 라운드가 서로 다른데, 종이마다 숫자를 박아 두었더니 같은 제품 안에서
//   감식실이 3라운드·4라운드로 갈리고 CCTV 가 4라운드·5라운드로 갈렸다. 이벤트 번호는
//   인원수와 무관하게 하나뿐이라, 이렇게 적으면 어긋날 자리가 없어진다.
PLACES.find((p) => p.id === 'PS').open = '현장(D1~D10) 이벤트 ① 뒤 · 기록(D11~) 이벤트 ② 뒤';

// 이벤트가 붙는 라운드는 인원수마다 다르다. 어느 쪽이든 「마지막 라운드 하나를 남기고 넷을 다
//   읽는다」가 규칙이다 — 2차 부검(④)이 뒤집힌 뒤에 조사할 라운드가 한 번은 남아야, 그때서야
//   값이 생기는 카드(베개·손톱 밑 이물질)를 쓸 자리가 있다.
// 여섯은 라운드가 하나 더 있으므로 그 여유를 앞에 둔다 — 1·2라운드는 서로의 방과 조합만으로
//   굴러, 목사님 방이 열리기 전에 사람의 말이 먼저 쌓인다.
const TRACKS = [
  // 여섯은 라운드가 하나 더 있는데, 그 여유를 앞에 두었더니 초반 두 라운드의 조합 재료가
  //   최종현 방 하나에 몰려 절반 가까운 판에서 조합이 아예 안 나왔다. 그래서 여유를 가운데로
  //   옮긴다 — ①②③ 은 일곱과 같은 자리에 두고 ④(2차 부검)만 한 칸 뒤로 미룬다. 그러면
  //   CCTV 가 4·5·6 세 라운드에 걸려 열여섯 장이 전량 도달하고(18슬롯), 부검 뒤 조사도 남는다.
  { label: '여섯이 할 때 — 6라운드', rounds: 6, evAt: { 1: '①', 2: '②', 3: '③', 5: '④' } },
  { label: '일곱이 할 때 — 5라운드 (형사 포함)', rounds: 5, evAt: { 1: '①', 2: '②', 3: '③', 4: '④' } },
];
// 이벤트 카드에 「몇 라운드가 끝나면 펼치는지」를 인원별로 같이 적는다.
const whenEv = (ev) => TRACKS
  .map((t) => `${t.rounds === 6 ? '여섯이면' : '일곱이면'} ${
    Object.keys(t.evAt).find((k) => t.evAt[k] === ev)}라운드`).join(' · ') + '가 끝나면 펼친다';

// 앱에서는 이 특수 단서들이 '열람 흔적'(톡서랍 비밀번호 복구·필적 대조·심문)으로 열린다.
//   보드에는 비밀번호도 심문도 없어 unlockedBy 가 비어 있고, 그래서 네 장이 영원히 더미에
//   남아 있었다. 같은 조건을 카드 조합으로 옮긴다 — 앱 데이터는 건드리지 않는다.
//   [코드, 그 단서의 어느 장인지] 로 적는다. 폰은 앱마다 한 장이라 '카카오톡' 장을 가리켜야 한다.
const BOARD_UNLOCK = {
  'SIST-22': [['QIVS-92', '카카오톡'], ['HUOX-80', '카카오톡']],   // 자매의 교차 대화
  'DISC-11': [['LWUY-33', '카카오톡'], ['TCGA-87', '카카오톡']],   // 지워진 대화방
  'KMRV-41': [['NBZL-83'], ['AYMX-96', '6월 30일']],              // 지갑 + 세린 일기
  // 라벨이 이상하다(S3)를 손에 넣고, 맞춰 볼 손글씨가 하나라도 있으면 대조를 시작할 수 있다.
  //   이게 없으면 S4 는 얻는 길이 아예 없어 라벨 트랙이 사람 입으로만 굴러간다.
  'TUBE-22': [['TUBE-12'], ['EDEZ-28']],                          // 라벨 위화감 + 종현 다이어리
};

// 휴대폰 잠금은 두 단계다. 통신 기록(누구와 이어져 있었나)이 먼저, 대화 내용(무슨 말을 했나)이
//   나중에 열린다. 관계를 먼저 알고 내용을 나중에 아는 순서라야, 대화가 열릴 때 그게
//   누구와의 대화인지가 이미 판에 깔려 있다. 반대로 열면 내용부터 쏟아져 관계가 묻힌다.
// 휴대폰은 앱별로 쪼개지 않고 카드 한 장이 되었다. 잠금도 폰 단위 하나뿐이다(이벤트 ② 통신 기록 영장).
const SPECIAL = { letter: 'S', name: '특수 단서', color: '#8a6d1f' };
const ROOM_OF = { 최종현: 'JH', 강지후: 'EJ', 한소미: 'HJ', 서지안: 'HW', 한다영: 'SR', 문세린: 'GH' };

// 잠긴 대화방과 진위조회는 예전에 카드 다섯 장(Q1~Q5)이었다. 폰을 손에 쥔 사람이 폰을 두고
//   다른 카드를 찾으러 가야 했고, 종이만 다섯 장 늘었다. 지금은 폰 카드의 QR 이 여는 화면
//   안에서 바로 숫자를 넣는다 — 실제 폰이 그렇듯. 잠근 것은 여전히 카드가 아니라 숫자다.
const QCARDS = [];

// 필적 대조는 사람마다 카드가 따로 있다. 화면에서 고르게 두면 손에 표본이 없어도 일곱을
//   차례로 돌려 보게 되고, 그러면 대조가 아니라 목록 훑기가 된다. 카드를 나눠 두면
//   「그 사람의 다이어리를 가진 사람만 그 대조를 할 수 있다」가 물건으로 강제된다.
const HAND_CARDS = () => {
  const at = (code) => allClues.find((c) => c.code === code);
  const opts = at('TUBE-22')?.handwriting?.options || [];
  return opts.map((o, i) => ({
    no: `Q6-${i + 1}`, code: `HAND${i + 1}`, hand: true,
    title: `필적 대조 — ${o.who}`,
    need: at(o.requires)?.title || `${o.who} 의 다이어리`,
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
// 길잡이.svg 는 물음표 하나짜리 자리표시다 — 어느 카드에 붙어도 같은 그림이라 카드에서는 뺀다.
const realImg = (c) => (c.image && !/길잡이\.svg$/.test(c.image) ? c.image : null);
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
        ? '카카오톡에 지워진 대화방이 있다 — 이 QR 을 찍어 들어간 화면 안에서, 그 방을 열고 네 자리 숫자를 넣으면 되살아난다.\n그 네 자리는 다른 단서 안에 적혀 있다. 세 번 틀리면 화면이 어디를 볼지 일러 준다.'
        : '',
    ].filter(Boolean).join('\n');
    // 휴대폰은 이벤트 ② 뒤부터 각 방에서 가져갈 수 있다. 다이어리·성경책은 처음부터.
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
    const body = c.wallet.items
      .map((it) => `· ${it.label} — ${(it.detail || '').replace(/\s+/g, ' ').trim()}`).join('\n');
    return [one({ image: c.wallet.items.find((it) => it.image)?.image || c.image || null, detail: body })];
  }
  if (c.handwriting?.options?.length) {
    // 결과를 카드에 다 실으면 일치하는 사람이 첫눈에 드러나 대조가 아니라 정답 공개가 된다.
    return [one({
      detail: line(c.detail,
        '대조할 수 있는 사람: ' + c.handwriting.options.map((o) => o.who).join(', ')
        + '\n→ 판 옆의 Q6-1 ~ Q6-7 중 대조할 사람의 카드를 찍는다.'
        + '\n그 사람의 다이어리 카드가 판에 공개된 뒤라야 대조할 수 있다 — 누구 손에 있는지는 상관없다.'
        + '\n한 라운드에 세 명까지 대조한다. 조사로 가져가는 카드 수와는 별개다.'),
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
    // LONS-62(2차 부검)는 이벤트 ④ 로 전원이 함께 읽는다 — 덱에는 넣지 않는다.
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
  //   순서를 여기서 정해 두면 "D1~D10 은 이벤트 ① 뒤, D11~ 은 이벤트 ② 뒤" 로 규칙이 한 줄로 끝난다.
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
      push(num[s], others.length
        ? `⭐ <b>${others.join(' + ')}</b> 와 함께 → 특수 <b>${num[t.code]}</b>. `
          + `<span class="hnote">가진 사람이 달라도 된다 — 합의해서 판 가운데에 공개하면 함께 가져간다</span>`
        : `⭐ 이 카드 하나로 → 특수 <b>${num[t.code]}</b>. `
          + `<span class="hnote">판 가운데에 공개하고 특수 더미에서 가져간다</span>`);
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
  /* --cf 는 넘치는 카드에만 인쇄 직전에 1 미만으로 정해진다(아래 cardFit). */
  .card { --cf: 1; border: 0.3mm dashed #bbb; padding: 3.2mm; overflow: hidden; position: relative;
          display: flex; flex-direction: column; }
  .no { font-size: 11pt; font-weight: 800; letter-spacing: .05em; color: #fff;
        padding: 0.8mm 2.4mm; border-radius: 1.2mm; align-self: flex-start; }
  .ct { font-size: calc(11pt * var(--cf)); font-weight: 800; line-height: 1.25;
        margin: calc(1.8mm * var(--cf)) 0 calc(1.4mm * var(--cf)); }
  .cimg { width: 100%; height: calc(27mm * var(--cf)); object-fit: contain; background: #f4f1ea;
          border-radius: 1mm; margin-bottom: calc(1.4mm * var(--cf)); }
  .cd { font-size: calc(7.4pt * var(--cf)); line-height: 1.5; white-space: pre-wrap; flex: 1; }
  .hint { margin-top: calc(1.4mm * var(--cf)); padding-top: calc(1.2mm * var(--cf));
          border-top: 0.3mm dashed #b9a86a; }
  .hint div { font-size: calc(6.9pt * var(--cf)); line-height: 1.45; color: #6b551a; }
  .hnote { display: block; font-size: 6.1pt; color: #8a7a45; }
  .cname { font-weight: 500; color: #6b6250; font-size: 9pt; }
  .press { margin-top: 1.2mm; padding-left: 2mm; border-left: 0.6mm solid #cdbf94;
           font-size: 8.6pt; color: #5b5140; }
  .lock { margin-top: calc(1.2mm * var(--cf)); font-size: calc(6.9pt * var(--cf));
          font-weight: 700; color: #8a3b3b; }
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
  .qr { text-align: center; margin-bottom: calc(1.4mm * var(--cf)); }
  .qr svg { width: calc(21mm * var(--cf)); height: calc(21mm * var(--cf)); }
  .qrl { font-size: 6.2pt; color: #6b6760; margin-top: 0.6mm; }
  .cback { align-items: center; justify-content: center; text-align: center; }
  .bnum { font-size: 30pt; font-weight: 800; letter-spacing: .04em; }
  .bplace { font-size: 8.5pt; font-weight: 700; margin-top: 3mm; opacity: .8; }
  .lg { font-size: 15pt; vertical-align: -2px; }
  .block { margin-top: 3.5mm; font-size: 11pt; font-weight: 800; color: #8a3b3b;
           border: 0.5mm solid #c98a8a; background: #fdf0ee; border-radius: 1.6mm;
           padding: 1.6mm 3mm; }
  .bsub { font-size: 6.4pt; font-weight: 600; color: #a06a6a; margin-top: 0.6mm; }
  .bsci { margin-top: 2.5mm; font-size: 7.4pt; font-weight: 800; color: #265a66;
          border: 0.4mm solid #85b3bd; background: #edf6f8; border-radius: 1.4mm; padding: 1mm 2.4mm; }
  /* CCTV 뒷면의 인물 색점 — 뽑기 전에 누구 장면인지 보이게 하는 것이 전부다.
     흑백으로 뽑으면 여섯 색이 다 같은 회색이 되므로, 점 안에 이름 끝 글자를 흰 글씨로 앉힌다. */
  .bdot { width: 9mm; height: 9mm; border-radius: 50%; margin: 3mm auto 1.4mm;
          border: 0.5mm solid #ffffffcc; box-shadow: 0 0 0 0.4mm #00000022;
          display: flex; align-items: center; justify-content: center;
          font-size: 15pt; font-weight: 800; color: #fff; line-height: 1;
          text-shadow: 0 0 0.6mm #00000055; }
  .bdotl { font-size: 6.4pt; color: #6b6760; line-height: 1.3; }
  h1 { font-size: 19pt; margin: 0 0 3mm; }
  h2 { font-size: 13pt; margin: 6mm 0 2mm; padding-bottom: 1.2mm; border-bottom: 1.2px solid #14120f; }
  .page { padding: 14mm 14mm 12mm; page-break-after: always; }
  /* 마지막 장까지 개행을 걸면 뒤에 빈 면이 한 장 더 나온다 — 인쇄물마다 한 장씩 버려지고 있었다.
     맞춤 스크립트가 본문 끝에 붙는 문서가 있어 :last-child 로는 안 잡힌다. */
  .page:last-of-type, .sheet:last-of-type { page-break-after: auto; }
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
  .board .trk { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2.4mm; margin: 3mm 0 5mm; }
  .board .trk5 { grid-template-columns: repeat(5, 1fr); }
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
  /* 이벤트 카드 넷은 한 면에 안 들어간다(합쳐 290mm 넘음). 넘치는 것은 괜찮지만
     한 장이 페이지 경계에서 잘리면 오려 낼 수가 없다 — 장 단위로 넘긴다. */
  .ev { border: 2px solid #b8912c; border-radius: 2mm; padding: 4mm 5mm; margin-bottom: 4mm; background: #fffdf6;
        page-break-inside: avoid; break-inside: avoid; }
  .evHead { font-size: 9pt; font-weight: 800; color: #8a6d1f; }
  .evNo { display: inline-block; background: #b8912c; color: #fff; border-radius: 50%;
          width: 6mm; height: 6mm; line-height: 6mm; text-align: center; margin-right: 1.5mm; }
  .evTitle { font-size: 14pt; font-weight: 800; margin: 1.6mm 0 2mm; }
  .evBody { font-size: 9.4pt; line-height: 1.6; }
  .evBody p { margin: 0 0 2mm; }
  .evFold { margin-top: 2.5mm; text-align: center; font-size: 7pt; color: #a09880;
            border-top: 1px dashed #c9bd9a; padding-top: 1.5mm; }
  /* 그림 판 */
  /* 이 종이를 언제 쓰는가 — 장 머리의 작은 표. */
  .stg { display: inline-block; font-size: 7.6pt; font-weight: 800; color: #6b5a2a;
         background: #fdf7e6; border: 0.4mm solid #cfae5e; border-radius: 1.4mm;
         padding: 0.8mm 2.4mm; margin-bottom: 2.4mm; }
  .stn { text-align: center; font-weight: 800; font-size: 12pt; color: #8a6d1f; }
  .art { position: relative; margin: 4mm 0; }
${ROOM_CSS}
  .art img { width: 100%; height: auto; display: block; border-radius: 2mm; }
  .art .zone { position: absolute; border-radius: 1mm; }
  .art .rm { position: absolute; }
  .art .rmName { position: absolute; left: 50%; top: 1.5mm; transform: translateX(-50%);
                 color: #fff; font-size: 10.5pt; font-weight: 800; white-space: nowrap;
                 padding: 0.8mm 2mm; border-radius: 1.2mm; box-shadow: 0 0.3mm 1mm #0005; }
  .art .mk { position: absolute; transform: translate(-50%, -50%); background: #fffffff0;
             border: 0.5mm solid; border-radius: 50%; width: 7.4mm; height: 7.4mm;
             display: flex; align-items: center; justify-content: center;
             font-size: 7pt; font-weight: 800; }
  /* 이름이 붙은 마커 — 동그라미가 아니라 알약 모양으로 늘어난다. */
  .art .mkW { width: auto; height: auto; min-width: 0; max-width: 30mm; border-radius: 2.4mm;
              gap: 1.4mm; padding: 1mm 2.2mm; white-space: normal; font-size: 9pt;
              line-height: 1.25; text-align: left; }
  .art .mkW > b { flex: none; }
  .art .mkW .mkN { font-size: 8.6pt; font-weight: 700; color: #3a352c; }
  .art .note { position: absolute; transform: translate(-50%, -50%); white-space: nowrap;
               background: #fffffff2; font-size: 9.4pt; font-weight: 700;
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
  .fold h2 { font-size: 8.6pt; margin: calc(1.8mm * var(--fit)) 0 calc(0.9mm * var(--fit)); padding-bottom: 0.7mm;
             border-bottom: 0.8px solid #14120f; break-after: avoid; }
  .fold h2:first-of-type { margin-top: 0; }
  /* --fit 은 면마다 인쇄 직전에 정해진다(아래 fitScript). 1 이면 원래대로, 크면 넉넉해진다. */
  .half { --fit: 1; }
  .fold p { font-size: 6.9pt; line-height: calc(1.46 * var(--fit)); margin: 0 0 calc(1.2mm * var(--fit)); }
  .fold .muted { font-size: 6.6pt; line-height: calc(1.45 * var(--fit)); }
  .fold table { font-size: 7.6pt; }
  .fold th, .fold td { padding: 1mm 1.4mm; }
  .fold ul { font-size: 6.8pt; line-height: calc(1.4 * var(--fit)); margin: 0 0 calc(1mm * var(--fit)) 3.4mm; }
  .fold li { margin-bottom: calc(0.5mm * (var(--fit) - 1)); }
  .fold .cname { font-size: 6pt; }
  .sy { font-size: 5.6pt; font-weight: 800; padding: 0.2mm 1mm; border-radius: 0.8mm;
        border: 0.25mm solid; vertical-align: 1px; white-space: nowrap; }
  .syF { color: #2f6b45; border-color: #8fbfa2; background: #eef7f1; }
  .syH { color: #7d6116; border-color: #cfae5e; background: #fdf7e6; }
  .syL { color: #8a3b3b; border-color: #c98a8a; background: #fdf0ee; }
  /* 묻고 답하는 대목 — 표는 좁은 면에서 칸이 뭉개져서, 대신 블록으로 쌓는다. */
  .qa { font-size: 6.9pt; line-height: calc(1.34 * var(--fit)); margin: 0 0 calc(0.75mm * var(--fit)); }
  .qa > b { color: #4a4436; }
  .qa > b::after { content: ' — '; font-weight: 400; color: #a49b88; }
  .qa > span { display: inline; }
  .qa .press { display: block; }
  .fold .press { margin-top: calc(0.8mm * var(--fit)); font-size: 6.6pt; }
  .fold .box { border: 0.4mm solid #8a3b3b; border-radius: 1.5mm; padding: 1.6mm 2.2mm;
               margin-top: 1.4mm; background: #fdf6f4; }
  .fold .bl { font-size: 8pt; font-weight: 800; color: #8a3b3b; margin-bottom: 0.9mm; }
  .fold .brk { color: #8a3b3b; }
  /* 시트를 받자마자 무엇을 하는지 — 처음 하는 사람은 이게 없으면 안쪽부터 펼쳐 남에게 보인다. */
  .covHow { margin-top: 3mm; border: 0.5mm solid #b8912c; border-radius: 2mm; padding: 2.6mm 3mm;
            background: #fffdf4; font-size: 8.6pt; line-height: 1.6; }
  .covHow > b { display: block; color: #8a6d1f; margin-bottom: 1.2mm; }
  .covHow > div { margin-bottom: 0.8mm; }
  .covWarn { margin-top: 1.6mm; padding-top: 1.6mm; border-top: 0.3mm dashed #cfc7b6; color: #8a3b3b; }
  .fold .box p { font-size: 6.8pt; line-height: calc(1.45 * var(--fit)); margin-bottom: calc(0.8mm * var(--fit)); }
  .cover { justify-content: space-between; }
  .covName { font-size: 30pt; font-weight: 800; letter-spacing: .02em; }
  .covSub { font-size: 9pt; color: #6b6760; margin-top: 1.5mm; }
  .covFoot { font-size: 6.8pt; color: #8a8375; border-top: 0.3mm solid #ded7c7; padding-top: 2mm; }
`;
const doc = (title, body, pageCss = '', tailScript = '') => `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>${esc(title)}</title><style>${CSS}${pageCss}</style></head><body>${body}${tailScript}</body></html>`;

// 인물 시트는 면마다 남는 자리가 달라, 인쇄 직전에 각 면이 스스로 줄 간격을 늘린다.
// 배치·트랙은 A3 가로에 얹고, 남는 자리만큼 장마다 통째로 확대한다.
const WIDE_FIT = `<script>
/* 글씨를 키운 뒤 혹 넘치는 장이 있으면 담기는 데까지 되돌린다. 넘치지 않으면 손대지 않는다.
   A3 가로는 폭만 두 배이고 높이는 A4 와 같아서, 확대가 아니라 글씨로 자리를 쓴다. */
(function () {
  var MAX = 2.2;
  function fit() {
    var pages = document.querySelectorAll(".page.board");
    for (var i = 0; i < pages.length; i++) {
      var p = pages[i], w = p.firstElementChild;
      if (!w) continue;
      w.style.transform = "";
      var cs = getComputedStyle(p);
      /* .page 는 제 내용만큼 늘어나므로 그 높이로 재면 언제나 100% 다 — 종이 크기로 잰다. */
      var mm = 96 / 25.4;
      var bw = 297 * mm - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var bh = 420 * mm - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      var k = Math.min(bw / w.scrollWidth, bh / w.scrollHeight, MAX);
      if (k < 1) w.style.transform = "scale(" + k.toFixed(3) + ")";
    }
  }
  if (document.readyState === "complete") fit();
  else window.addEventListener("load", fit);
  window.addEventListener("beforeprint", fit);
})();
</script>`;

// 단서 카드는 넘치는 장만 골라 글자와 QR 을 조금 줄인다.
const CARD_FIT = `<script>
/* 넘치는 카드만 골라 담기는 데까지 줄인다. QR 은 0.8 배(16.8mm)까지도 잘 읽힌다. */
(function () {
  var MIN = 0.78;
  function over(el) { return el.scrollHeight - el.clientHeight > 1; }
  function fit() {
    var cards = document.querySelectorAll(".card");
    for (var i = 0; i < cards.length; i++) {
      var el = cards[i];
      el.style.removeProperty("--cf");
      if (!over(el)) continue;
      var lo = MIN, hi = 1;
      for (var n = 0; n < 10; n++) {
        var mid = (lo + hi) / 2;
        el.style.setProperty("--cf", mid.toFixed(3));
        if (over(el)) hi = mid; else lo = mid;
      }
      el.style.setProperty("--cf", lo.toFixed(3));
    }
  }
  if (document.readyState === "complete") fit();
  else window.addEventListener("load", fit);
  window.addEventListener("beforeprint", fit);
})();
</script>`;

const FIT_SCRIPT = `<script>
/* 면마다 남는 자리를 글자 사이로 돌려준다.
   A4 가로에 뽑아 보니 면마다 채움이 62~100% 로 들쭉날쭉했다 — 대본 면 아래가 비는데,
   일괄로 키우면 이미 꽉 찬 면이 잘린다. 그래서 각 면이 스스로 잰다. 넘치지 않는 선까지만
   --fit 을 올리고, 못 늘리는 면은 1 로 남는다. 인쇄와 PDF 모두 이 스크립트가 돈 뒤에 찍힌다. */
(function () {
  var MIN = 0.82, MAX = 1.45, TARGET = 0.97;
  function fill(h) {
    var cs = getComputedStyle(h);
    var box = h.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var kids = h.children, top = h.getBoundingClientRect().top + parseFloat(cs.paddingTop), bot = top;
    for (var i = 0; i < kids.length; i++) bot = Math.max(bot, kids[i].getBoundingClientRect().bottom);
    return box > 0 ? (bot - top) / box : 1;
  }
  function fit() {
    var halves = document.querySelectorAll(".half:not(.cover)");
    for (var i = 0; i < halves.length; i++) {
      var h = halves[i];
      /* 이분법으로 담기는 가장 큰 배율을 찾는다 — 열 번이면 소수 셋째 자리까지 좁혀진다.
         아래로도 내려간다: 내용이 늘어 넘치는 면은 1 미만으로 줄여야 잘리지 않는다. */
      var lo = MIN, hi = MAX;
      for (var n = 0; n < 10; n++) {
        var mid = (lo + hi) / 2;
        h.style.setProperty("--fit", mid.toFixed(3));
        if (fill(h) <= TARGET) lo = mid; else hi = mid;
      }
      h.style.setProperty("--fit", lo.toFixed(3));
    }
  }
  if (document.readyState === "complete") fit();
  else window.addEventListener("load", fit);
  window.addEventListener("beforeprint", fit);
})();
</script>`;

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
  // 휴대폰·다이어리·성경책은 카드 한 장에 QR 하나 — 속은 /clue 화면에서 넘겨 본다.
  //   사진이 붙던 카드도 마찬가지다. 27mm 로 줄여 놓으면 약통 라벨도 손목의 멍도 안 보이는데,
  //   그 47장 때문에 서른여덟 면을 통째로 컬러로 뽑아야 했다. 찍어서 크게 보는 편이 낫다.
  for (const c of allClues) {
    if ((!isScreen(c) && !realImg(c)) || QR[c.code]) continue;
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
      ${q.hand ? `<b>${esc(q.need)}</b>가 판에 공개된 뒤라야 찍을 수 있다.<br>한 라운드에 세 명까지.` : '잠긴 것은 카드가 아니라 <b>숫자</b>다.'}</div></div>
  </div>`;
  return `<div class="page"><h1>필적 대조 카드 — ${allQ().length}장
      <span class="muted">Q6-1 ~ Q6-${HANDS.length}</span></h1>
    <p class="muted">앞면이 보이게 판 옆에 펴 둡니다. <b>가져가는 카드가 아닙니다.</b>
      휴대폰 카메라로 QR 을 찍으면 화면이 열리고, 그 사람만 결과를 봅니다.<br>
      통 라벨의 글씨를 그 사람의 것과 맞춰 봅니다 —
      <b>그 사람의 다이어리 카드가 판에 공개된 뒤라야</b> 찍을 수 있습니다(누구 손에 있는지는 상관없습니다).<br>
      <b>한 라운드에 세 명까지</b> 대조합니다 — <b>조사로 가져가는 두 장과는 별개</b>입니다.
      한 장이 한 사람이라, 누가 어느 카드를 찍는지가 그대로 보입니다.<br>
      <span class="muted">지워진 대화방과 수료증 조회는 카드가 따로 없습니다 —
      그 휴대폰 카드의 QR 을 찍어 들어간 <b>폰 화면 안에서</b> 엽니다.</span></p>
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
  // ⚖ 는 「누구 물건인가」가 아니라 「결과가 누구를 겨누는가」로 붙어야 한다. person 만 보면
  //   목사님 방에서 나온 채취물이 전부 '목사'로 잡혀, 정작 이름이 결과에 박혀 있는 사람이
  //   자기 결과를 자기 입으로 읽는다 — L5 는 본문이 「늘어난 옷깃에서 강지후의 피부 세포가
  //   검출되었다」인데 강지후가 낭독할 수 있었다. 겨누는 목을 여기 손으로 적어 준다.
  // 다만 ⚖ 는 카드 면에 이름을 찍는다. 그러니 카드만 봐서 이미 이어지는 사람에게만 붙여야 한다 —
  //   L3(책상 위 설하정이 가짜였다)에 「⚖ 서지안」을 찍으면, 본문에 그 이름이 한 자도 없는데
  //   집는 순간 진범이 배달된다. L8(텀블러의 졸피뎀)도 같다. 그 둘은 L9·D1 이 나와야 이어지는
  //   것이고, 이어 주는 것은 배지가 아니라 판이어야 한다.
  const AIMS_AT = {
    'SHKB-77': '최종현',   // 쉐이크 통 — 목사님 방에서 나오지만 탄 사람이 종현인 것은 공개 사실이다
    'TUCH-83': '강지후',   // 옷깃 접촉 DNA — 결과 본문에 이름이 박혀 있다
  };
  // 결과가 무해한 감식까지 막으면 그 카드가 영영 안 나온다. 지후의 약봉투(AQFE-59)는
  //   「진짜 부모님 고혈압약이 맞다」라 오히려 본인이 읽는 편이 자연스럽다.
  const HARMLESS = new Set(['AQFE-59']);
  const mine = (c) => {
    if (c.type !== '감식' || HARMLESS.has(c.code)) return null;
    const who = AIMS_AT[c.code] || c.person;
    return ROOM_OF[who] ? who : null;
  };
  // 카드 한 장이 무슨 취급을 받는 물건인지, 집어 들자마자 보이게 한다.
  const badges = (c) => {
    const hs = hintFor(c) || [];
    const b = [];
    if (c.locked) b.push(['bgLock', '🔒', '이벤트 ② 뒤']);
    if (mine(c)) b.push(['bgLock', '⚖', '본인 낭독 불가']);
    if (hs.some((h) => h.includes('🔬'))) b.push(['bgLab', '🔬', '감식실']);
    if (hs.some((h) => h.includes('⭐'))) b.push(['bgStar', '⭐', '조합 재료']);
    return b.length
      ? `<span class="bgs">${b.map(([k, ic, tx]) =>
          `<span class="bg ${k}"><i>${ic}</i>${tx}</span>`).join('')}</span>`
      : '';
  };
  // CCTV 장면은 뒷면에 그 인물의 방 색을 점 하나로 찍는다. 방 카드는 「어느 방에서 나왔나」가
  //   뒷면에 적혀 있어 누구 물건인지 추정되지만, V 는 번호가 시각과도 인물과도 무관해서
  //   무엇을 집었는지 아무도 몰랐다. 그래서 자기 방 금지가 막으려던 바로 그 행동 —
  //   자기에게 불리한 것을 자기가 집어 묻는 것 — 이 V 에서만 완전히 자유로웠다.
  //   실제로 6인 판에서 진범이 자기 장면 두 장을 뽑아 끝까지 묻었다.
  const sceneOf = (c) => {
    const who = Object.keys(ROOM_OF).find((n) => (c.title || '').includes(n));
    if (!who) return null;
    return { who, color: (PLACES.find((p) => p.id === ROOM_OF[who]) || {}).color || '#2b6b73' };
  };
  const deck = (list, meta) => {
    const isCC = meta.letter === 'V';
    // 무엇을 찍는지 한 줄로 알려 준다 — 장면인지, 넘겨 볼 속인지, 사진인지.
    const qrLabel = (c) => (isCC ? '찍으면 이 장면이 열린다'
      : isScreen(c) ? '찍으면 속을 넘겨 본다'
      : '찍으면 사진이 크게 열린다');
    const front = (c) => `<div class="card" style="border-color:${meta.color}">
      <div class="chd"><span class="no" style="background:${meta.color}">${esc(unitNum.get(c))}</span>
        ${badges(c)}</div>
      <div class="ct">${esc(c.title)}</div>
      ${QR[c.code] ? `<div class="qr">${QR[c.code]}<div class="qrl">${qrLabel(c)}</div></div>`
        : realImg(c) ? `<img class="cimg" src="${esc(img(realImg(c)))}" alt="">` : ''}
      <div class="cd${c.small ? ' sm' : ''}">${esc(c.detail || c.description || '')}</div>
      ${c.locked ? `<div class="lock">🔒 <b>이벤트 ②</b>(통신 기록 영장)을 읽은 뒤부터다.
        가져가는 것은 지금도 되지만, 그때까지는 아무도 못 읽는다.<br>
        <b>자기 방에는 못 들어가므로 자기 휴대폰도 못 가져간다.</b></div>` : ''}
      ${mine(c) ? `<div class="lock">⚖ 이 결과는 <b>${esc(mine(c))}</b> 에게 걸린다.
        <b>${esc(mine(c))}</b> 은(는) 이 결과를 읽을 수 없다 — 다른 사람이 집어 소리 내어 읽는다.</div>` : ''}
      ${isCC ? '<div class="lock">📢 이 장면은 <b>가져오는 즉시 소리 내어 읽는다.</b> 혼자 읽고 덮어 두지 못한다.</div>' : ''}
      ${meta.letter === 'S' && origin(c) ? `<div class="hint"><div>${esc(origin(c))}</div></div>` : ''}
      ${hintFor(c) ? `<div class="hint">${hintFor(c).map((h) => `<div>${h}</div>`).join('')}</div>` : ''}
    </div>`;
    const back = (c) => {
      const sc = isCC ? sceneOf(c) : null;
      return `<div class="card cback" style="border-color:${meta.color};background:${meta.color}12">
      <div class="bnum" style="color:${meta.color}">${esc(unitNum.get(c))}</div>
      <div class="bplace" style="color:${meta.color}">${esc(meta.name)}</div>
      ${sc ? `<div class="bdot" style="background:${sc.color}">${esc(sc.who.slice(-1))}</div>
        <div class="bdotl">이 장면에 찍힌 사람 — 색과 이름 끝 글자</div>` : ''}
      ${(hintFor(c) || []).some((h) => h.includes('🔬'))
        ? '<div class="bsci">🔬 감식실에 낼 수 있는 카드</div>' : ''}
      ${c.locked ? `<div class="block">🔒 <b>이벤트 ②</b> 뒤<div class="bsub">준비할 때 빼서 따로 둔다</div></div>` : ''}</div>`;
    };
    return `<div class="page"><h1>${esc(meta.name)} — ${list.length}장
      <span class="muted">${meta.letter}1 ~ ${meta.letter}${list.length}</span></h1>
      <p class="muted">${esc(meta.open || '조건을 채우면 이 더미에서 가져간다')} ·
      <b>뒷면(번호)이 보이게</b> 쌓고, ${isCC
        ? '가져간 사람이 <b>앞면을 모두에게 소리 내어 읽는다.</b>'
        : '가져간 사람이 앞면을 읽는다.'}</p>
      ${isCC ? `<p class="muted"><b>여기서만 한 번에 세 장을 봅니다.</b> 다른 장소는 두 장입니다 —
        화면은 가져가는 것이 아니라 이어 보는 것이라서입니다.<br>
        <b>뒷면의 색점이 그 장면에 찍힌 사람입니다.</b> 자기 색도 가져갈 수 있습니다 —
        다만 가져오면 소리 내어 읽어야 하므로, 자기 장면을 집는 것은 <b>먼저 해명하겠다는 선언</b>이 됩니다.
        여기서만은 카드를 가져가는 것이 곧 공개라, 무엇을 집었는지 감출 수 없습니다.</p>` : ''}</div>`
      + paginate(list, front, back);
  };
  let body = '';
  for (const p of PLACES) if (bag[p.id].length) body += deck(bag[p.id], p);
  if (special.length) body += deck(special, SPECIAL);
  body += lockCards();
  return { filename: '보드_단서카드.html', html: doc('보드게임 단서 카드', body, '', CARD_FIT) };
}

// ── 2. 인물 시트 — A4 한 장에 한 사람, 가로로 반 접는다 ──────────────────────
//   세로 4장을 손에 들고 있으면 어느 장이 공개고 어느 장이 비밀인지 매번 확인해야 하고,
//   옆 사람 눈에 뒷장이 비친다. 한 장으로 접어 두면 겉에는 공개 프로필만 있고
//   나머지는 펼쳐야 보인다 — 탁자에 그대로 두었다가 필요할 때만 편다.
//   면은 넷이다: 겉(공개) · 안 위(비밀 시나리오) · 안 아래(대본) · 뒷면(상황별 대응).
function charCards() {
  const li = (a) => a.map((x) => `<li>${x}</li>`).join('');
  const { num, unitNum } = buildBoard();
  // 카드 이름은 정본 단서 제목이 아니라 «판에 실제로 인쇄된 제목»이어야 한다. 파우치와 옷가지를
  //   한 장으로 합쳐 「다영의 소지품」이 됐는데 시트는 계속 「다영의 파우치」를 가리키고 있었다.
  const boardTitle = {};
  for (const [u, n] of unitNum) if (u.code && !boardTitle[u.code]) boardTitle[u.code] = { n, t: u.title };
  const SID = { 최종현: 'S1', 강지후: 'S2', 한소미: 'S3', 서지안: 'S4', 한다영: 'S5', 문세린: 'S6' };
  const OFF_DECK = {
    'LONS-62': '이벤트 ④',
    'BRIF-00': '시작 시트',
    'SIAH-72': 'V 더미',
  };
  const no = (code) => num[code] || OFF_DECK[code] || '(덱 밖)';
  const titleOfCode = Object.fromEntries(allClues.map((c) => [c.code, c.title || '']));
  const OFF_TITLE = { 'LONS-62': '2차 부검 — 타살 확정', 'BRIF-00': '사건 브리핑', 'SIAH-72': 'CCTV 열람실' };
  const named = (code) => {
    const t = boardTitle[code]?.t || titleOfCode[code] || OFF_TITLE[code] || '';
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
      <div class="covHow"><b>이 시트를 받으면</b>
        <div>① <b>혼자만 모든 내용을 읽습니다</b> — 5분. 남에게 보이지 않게 읽으세요.</div>
        <div>② 자유롭게 차례를 정하여 <b>가족·나이·직책</b>을 소개합니다.
          <b>나이에 몰두하여 연기해 주세요.</b></div>
        <div class="covWarn">게임이 끝날 때까지 <b>자신의 카드를 절대 보여 주지 않습니다.</b></div></div>
    </div>
    <div class="covFoot"><b>A4 가로</b>로 양면 인쇄(<b>짧은 쪽 넘김</b>)해 가운데 점선을 세로로 접으세요.
      접으면 이 면만 보입니다 — 안쪽 세 면은 본인만 폅니다.</div>`;

  // 자기 폰에 지워진 대화방이 있는 사람만 번호가 있다. 없는 사람에게는 아무것도 안 찍는다.
  // 네 자리의 출처가 사람마다 다르다. 남이 스스로 알아낼 수 있는 번호는 그렇다고 적어 준다.
  const RECOVER_OPEN = {
    'YJWR-74': `다만 이 네 자리는 <b>그 수료증의 발급번호 뒷자리</b>입니다.
      수료증을 본 사람이 있다면, <b>당신이 안 알려 줘도 열립니다.</b>`,
  };
  const myPhone = (who) => {
    const mine = allClues.find((c) => c.person === who && /핸드폰/.test(c.title || '')
      && (c.phone?.apps || []).some((a) => (a.chats || []).some((ch) => ch.deleted)));
    const num = mine && recover[mine.code];
    if (!num) return '';
    return `<div class="box"><div class="bl">내 휴대폰 — 톡서랍 복구 번호 ${esc(num)}</div>
      <p>내 폰(<b>${esc(no(mine.code))}</b>)의 카카오톡에는 <b>내가 지운 대화방</b>이 있습니다.
        되살리려면 이 네 자리가 필요하고, <b>그 번호를 아는 사람은 나뿐입니다.</b>
        ${RECOVER_OPEN[mine.code] ? `<br>${RECOVER_OPEN[mine.code]}` : ''}</p>
      <p class="muted">남이 내 폰을 가져가 「비밀번호가 뭐냐」고 물으면 — 알려 줄지, 모른다고 할지,
        엉뚱한 번호를 댈지는 <b>당신이 정합니다.</b> 다만 끝까지 안 알려 주면 그것도 판에 보입니다.</p></div>`;
  };

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
      ${myPhone(s.name)}
      <h2>금지 사항 — 반드시 지키세요</h2><ul>${li(b.forbidden || [])}</ul>
      ${b.knowsWhatBreaks === false ? `<div class="box">
        <p><b>당신은 숨기는 것이 없습니다.</b> 그래서 판이 무엇을 파내든 전부 처음 듣는 이야기입니다.
          뜻밖의 것이 나오면 <b>그 자리에서 처음 본 사람처럼</b> 반응하고, 그게 무슨 뜻인지 <b>남들에게 물으세요.</b></p></div>`
        : ''}
      ${hits.length ? `<div class="box"><div class="bl">⚠ 여기서 무너집니다</div>
        <p>아래 카드가 판에 나오면 <b>더 우기지 말고 인정합니다.</b>
          우기면 게임이 멈춥니다 — 무너지는 것이 당신의 역할입니다.</p>
        <p>${hits.map((h) => b.breakAs?.[(h.codes || [])[0]]
            || (h.codes || []).map(named).join(' · ')).join('<br>')}</p>
        <p class="muted">무엇이라고 말할지는 <b>뒷면 「이 카드가 나오면」</b>에 카드별로 적혀 있습니다.</p></div>` : ''}`;
  };

  // 「이렇게 몰리면」 열세 줄 중 카드 코드가 글에 안 적힌 세 줄. 하나는 카드가 있고 둘은 정황이다.
const PUSH_AT = { 강지후: { '손목 멍 추궁 (1단)': 'IOVT-95' } };
//   카드가 아닌 둘은 이미 있는 정황 줄과 같은 순간이다. 새 줄로 늘리지 않고 그 줄에 붙인다.
const PUSH_AS_MOMENT = {
  '설하정을 비타민으로 바꾼 것이 드러나면': '약 바꿔치기가 드러났을 때',
  '필적 일치(라벨 글씨)로 추궁받으면': '라벨 글씨가 내 것으로 밝혀졌을 때',
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
      <h2>이렇게 물으면 이렇게 <span class="muted">— 말로 물어올 때</span></h2>
      <p class="muted">답마다 <span class="sy syF">사실</span> <span class="sy syH">감춤</span>
        <span class="sy syL">거짓</span> 이 붙어 있습니다 — <b>감춤</b>은 말한 것 자체는 사실이되
        중요한 것을 빼놓은 것입니다. 굳이 거짓말까지 할 자리가 아닙니다.</p>
      ${qa(st.map((x) => [esc(asked(x.q || '')) + say(x.say),
        `${x.text || ''}${x.press ? `<div class="press"><b>더 캐물으면</b> ${x.press}</div>` : ''}`]))}
`;
  };

  // 면 ④ 뒷면 — 보드에서만 벌어지는 국면. 앱에는 없어서 심문 정본만으로는 대응이 안 나온다.
  const moments = (name) => {
    const s = BOARD_SCRIPT[name];
    if (!s) return '';
    // 대응이 세 군데(대본·상황별·카드별)에 흩어져 있으면 판이 도는 중에 어디를 봐야 하는지가
    //   매번 헷갈린다. 그래서 두 덩이로만 모은다 — 「이런 일이 벌어지면」(정황)과
    //   「이 카드가 나오면」(카드 번호). 판에서 실제로 일어나는 일은 둘 중 하나다.
    const d = INTERROGATION[SID[name]];
    const b = BIBLE[name] || {};
    const drop = new Set(s.dropSoft || []);
    const over = s.soft || {};
    const soft = [];
    for (const x of (d?.statements || [])) {
      for (const [c, r] of Object.entries(x.soft || {})) {
        if (drop.has(c)) continue;
        soft.push([c, over[c] || (typeof r === 'string' ? r : r?.text || '')]);
      }
    }
    // 무너지는 카드는 따로 두지 않고 같은 표 안에 ⚠ 로 찍는다 — 그 카드가 나온 순간
    //   시선이 이미 그 줄에 가 있는데, 인정하라는 지시만 다른 면에 있으면 늦는다.
    const breakOn = new Set(b.knowsWhatBreaks === false ? []
      : (INTERROGATION[SID[name]]?.statements || [])
        .filter((x) => x.contradict).flatMap((x) => x.contradict.codes || []));
    // 무너지는 카드에는 무너질 때 할 말이 있어야 한다. 앞면 상자에서 그 대사를 떼어 카드 번호만
    //   남겼더니, 표는 「첫마디입니다」라고 약속해 놓고 정작 가장 중요한 네 칸이 비었다 —
    //   진범이 자백하는 자리에서 즉흥으로 지어내게 된다. 심문 정본의 붕괴 대사를 여기로 옮긴다.
    const breakLine = {};
    for (const x of (d?.statements || [])) {
      const ct = x.contradict;
      if (!ct) continue;
      for (const c of (ct.codes || [])) breakLine[c] = ct.textBy?.[c] || ct.text || '';
    }
    // 「이렇게 몰리면」을 여기로 받는다. 트리거가 같은 표를 둘로 나눠 두면, 그 카드가 나온
    //   순간에 어느 면을 펴야 하는지부터 고르게 된다 — 한 줄 안에서 단계로 읽히는 편이 낫다.
    const pushBy = {}, pushAt = {}, pushMoments = [];
    for (const [q, a] of (b.script || [])) {
      const qs = String(q).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      const at = PUSH_AS_MOMENT[qs];
      const code = at ? null : (PUSH_AT[name]?.[qs] || (qs.match(/[A-Z]{4}-\d{2}/) || [])[0]);
      if (code) pushBy[code] = [pushBy[code], a].filter(Boolean).join(' ');
      else if (at) pushAt[at] = [pushAt[at], a].filter(Boolean).join(' ');
      else pushMoments.push([qs, a]);
    }
    const rows = [...new Map([...soft, ...Object.entries(s.onCard)]).entries()];
    for (const c of breakOn) if (!rows.some(([k]) => k === c)) rows.push([c, '']);
    for (const c of Object.keys(pushBy)) if (!rows.some(([k]) => k === c)) rows.push([c, '']);
    // 한 카드에 둘 다 걸리는 경우가 있다 — 폰에는 무해한 통화 기록과 복구되는 대화방이 같이 있다.
    //   무엇을 들이미느냐에 따라 할 말이 다르므로 두 줄로 갈라 놓는다. 위가 버티는 첫마디,
    //   아래가 더는 못 버티는 자리다.
    const strip = (x) => esc(String(x || '').replace(/<[^>]+>/g, ''));
    const line = (c, t) => {
      const txt = strip(t);
      const psh = strip(pushBy[c]);
      const head = psh ? `${txt}${txt ? '<br>' : ''}<b class="brk">더 몰리면</b> ${psh}` : txt;
      if (!breakOn.has(c)) return head;
      const brk = strip(breakLine[c]);
      return `${head}${head ? '<br>' : ''}<b class="brk">⚠</b> ${brk}${brk ? ' ' : ''}<b class="brk">여기서 인정합니다.</b>`;
    };
    return `<h1>${esc(name)} <span class="muted">— 이 상황에서는 이렇게 (본인만)</span></h1>
      <h2>말투</h2><p>${s.tone}</p>
      <h2>당신이 알고 있어서 자꾸 걸리는 것</h2>
      <p class="muted">누구를 의심하라는 지시가 아닙니다. <b>당신이 아는 사실</b>일 뿐입니다 —
        이걸 지키려다 보면 시선은 저절로 어디론가 향합니다.</p>
      ${qa(s.watch.map(([a, x]) => [esc(a), x]))}
      <h2>이런 일이 벌어지면 <span class="muted">— 정황</span></h2>
      ${qa([...s.moments, ...pushMoments].map(([a, x]) => {
        const add = Object.keys(pushAt).find((k) => String(a).startsWith(k));
        return [esc(a), add ? `${x}<br><b class="brk">더 몰리면</b> ${pushAt[add]}` : x];
      }))}
      <h2>이 카드가 나오면 <span class="muted">— 카드 번호</span></h2>
      <p class="muted">남이 그 카드를 읽었거나 당신에게 내밀었을 때의 첫마디입니다.
        <b class="brk">⚠</b> 가 붙은 카드는 <b>더 우기지 않고 인정하는 자리</b>입니다.</p>
      ${qa(rows.map(([c, t]) => [named(c), line(c, t)]))}
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
    html: doc('보드게임 인물 시트', body + detectiveCard(named, sheet, qa), landscape, FIT_SCRIPT) };
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
        <td>13시 34분 신고를 받고 온 담당 형사. 초동 수사를 마치고 관계자 여섯을 불러 모았다.</td></tr></table>
      <div class="box"><div class="bl">형사는 용의자가 아닙니다</div>
        <p>목사님을 죽인 사람은 나머지 여섯 안에 있습니다. <b>아무도 형사를 지목하지 않습니다.</b>
          그 대신 형사는 <b>자기 방이 없습니다</b> — 처음부터 끝까지 아무 방이나 갈 수 있고,
          여섯은 서로의 방을 뒤지며 자기 물건이 남의 손에 들리는 것을 감수하지만, 형사에게는 그런 것이 없습니다.
          조사·토론·지목은 나머지와 똑같이 합니다.</p></div>
    </div>
    <div class="covFoot">여섯이 하면 이 장을 빼세요. <b>A4 가로</b>로 양면 인쇄(<b>짧은 쪽 넘김</b>)해 가운데 점선을 세로로 접습니다.</div>`;
  const inner = `<h1>${esc(d.name)} 형사 <span class="muted">— 당신이 아는 것 (본인만)</span></h1>
    <h2>당신의 정체</h2><p>${esc(d.identity)}</p>
    <h2>당신의 그날</h2>
    ${qa(d.timeline.map(([t, x]) => [esc(t), esc(x)]))}
    <h2>당신이 아는 것</h2><ul>${li(d.knows)}</ul>
    <p class="muted">여기 없는 것은 <b>당신도 모르는 것</b>입니다.</p>
    <h2>지켜야 할 것</h2><ul>${li(d.forbidden)}</ul>`;
  const back = `<h1>${esc(d.name)} 형사 <span class="muted">— 이 상황에서는 이렇게</span></h1>
    <h2>말투</h2><p>${esc(d.tone)}</p>
    <h2>당신이 알고 있어서 자꾸 걸리는 것</h2>
    ${qa(d.watch.map(([a, b]) => [esc(a), b]))}
    <h2>상황별 대응</h2>
    ${qa(d.moments.map(([a, b]) => [esc(a), b]))}
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
  const { bag, open, num, unitNum } = buildBoard();
  // CCTV 모니터의 색점은 카드 뒷면 색점과 같아야 한다 — 같은 방 색을 쓴다.
  const personColor = (who) => (ART_ROOMS.find((r) => r.id === ROOM_OF[who]) || {}).color;
  const counts = Object.fromEntries(Object.entries(bag).map(([k, v]) => [k, v.length]));
  // 판 위의 번호마다 물건 이름을 한마디씩 — 「A3 볼게요」가 「A3, 풀이요」가 된다.
  const labels = Object.fromEntries(Object.entries(bag).map(([k, v]) => [k, v.map((u) => shortLabel(u.title))]));
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
  const body = `<div class="page"><div class="stg">준비할 때 깔고 · 조사할 때마다 봅니다</div>
    <h1>사건 현장 — 숙소 2층</h1>
    <p class="muted">탁자 가운데에 까는 판이다. <b>A3 세로</b>로 인쇄한다 — A4 로 줄이면 번호 옆 물건 이름이 읽기 어렵다.
      카드는 판 위에 올리지 않고 장소별로 옆에 쌓는다. 방 안의 번호는 <b>고를 자리</b>이지
      물건이 놓인 위치가 아니다 — "A3 볼게요" 하고 그 번호 카드를 집으면 된다.</p>
    ${illustratedMapHTML(counts, img('/images/board/2층평면.png'), labels)}
    <p class="muted">복도 끝 CCTV는 <b>복도만</b> 비춘다. 방문 앞은 사각이라
      누가 방에 들어갔는지는 찍히지 않는다 — 이 사건의 전제다.<br>
      <b>목사님 방 문에는 작은 유리창이 있다.</b> 복도에 선 채로 안을 들여다볼 수 있다 —
      들어가지 않고도 방 안에서 무슨 일이 있는지 볼 수 있었다는 뜻이다.</p>
    <h2>판 밖 시설</h2>
    <table><tr><th style="width:22%">장소</th><th style="width:16%">번호</th><th>여는 시점</th></tr>
      ${side.map((p) => `<tr><td>${esc(p.name)}</td>
        <td>${p.letter}1~${p.letter}${counts[p.id]}</td><td>${esc(p.open)}</td></tr>`).join('')}
      <tr><td>특수 단서</td><td>S1~S${Object.values(num).filter((v) => v.startsWith('S')).length}</td>
        <td>카드에 적힌 조건을 채우면 가져간다</td></tr></table>
  </div>

  <div class="page"><div class="stg">이벤트 ③ 을 읽은 뒤 · 판 옆에 펴 둡니다</div>
    <h1>CCTV 열람실 <span class="muted">— 복도 카메라 원본</span></h1>
    <p class="muted">숙소 카메라가 남긴 열여섯 컷입니다 — 2층 복도가 대부분이고 1층 로비도 있습니다.
      <b>모니터 한 대가 한 장면</b>이고,
      <b>시간 순서</b>로 늘어서 있습니다. 보고 싶은 시각을 골라 그 번호 카드를 집으세요 —
      화면을 눈감고 고르는 일은 없습니다.</p>
    <p class="muted"><b>여기서만 한 번에 세 장을 봅니다.</b> 다른 장소는 두 장입니다.
      그리고 <b>본 장면은 그 자리에서 모두에게 소리 내어 읽습니다</b> — 혼자 읽고 덮어 두지 못합니다.</p>
    ${cctvRoomHTML(bag.CC, (u) => unitNum.get(u), personColor, img('/images/board/CCTV실.png'))}
    <p class="muted"><b>방 안은 어디도 찍히지 않습니다.</b>
      목사님 방 문 앞은 사각이라, 누가 방에 들어갔는지는 이 화면으로 알 수 없습니다 —
      <b>화면에서 사라져 있던 시간</b>이 그 자리를 대신합니다.</p></div>

  <div class="page"><div class="stg">이벤트 ② 를 읽은 뒤 · 판 옆에 펴 둡니다</div>
    <h1>감식실 <span class="muted">— 낸 사람과 읽는 사람이 다르다</span></h1>
    <p class="muted">🔬 표시가 있는 카드가 <b>채취물</b>입니다. 왼쪽에 내려놓으면 다음 라운드에
      오른쪽에서 결과가 나옵니다. <b>낸 사람은 자기 결과를 읽지 못합니다</b> —
      결과를 읽는 손과 결과가 걸린 목이 같으면 그 카드는 증거가 아니라 증언이 되기 때문입니다.</p>
    ${labRoomHTML(bag.LB, (u) => unitNum.get(u), img('/images/board/감식실.png'))}
    <p class="muted"><b>두 라운드가 지나도 안 내면</b> 그다음 라운드 끝에 누구든 대신 낼 수 있습니다.
      가진 사람은 거부하지 못합니다 — 카드는 낸 뒤 돌려줍니다.<br>
      <b>마지막 라운드에 낸 것은 최종 토론이 시작될 때 읽습니다.</b></p></div>${openPages}`;
  const a3 = '@page { size: A3 portrait; margin: 0; }';
  return { filename: '보드_장소판.html', html: doc('보드게임 장소 판', body, a3) };
}

// ── 4. 진행 물품 — 시작 시트 · 라운드 트랙 · 이벤트 카드 ────────────────────
//   진행자가 없으므로 진행자가 하던 일(브리핑 읽기·이벤트 열기)을 물건이 대신한다.
function runSheets() {
  const brief = allClues.find((c) => c.code === 'BRIF-00');
  const pages = (brief?.pages || []).map((pg) =>
    `<h2>${esc(pg.title)}</h2><p style="white-space:pre-wrap">${esc(pg.content)}</p>`).join('');
  // 종이마다 언제 쓰는 것인지를 머리에 한 칸 찍는다. 처음 하는 사람은 「판 옆에 펴 두세요」만
  //   봐서는 그게 지금 읽을 것인지 나중에 볼 것인지 알 수 없다.
  const stage = (t) => `<div class="stg">${esc(t)}</div>`;
  const ev = (n, when, title, body) => `<div class="ev">
    <div class="evHead"><span class="evNo">${n}</span> ${esc(when)}</div>
    <div class="evTitle">${esc(title)}</div><div class="evBody">${body}</div>
    <div class="evFold">— 접어서 뒷면이 보이게 트랙 위에 둔다 —</div></div>`;
  // 처음 하는 여섯 명이 인쇄물 뭉치를 앞에 두고 앉았을 때, 무엇부터 집어야 하는지가
  //   어디에도 없었다. 종이마다 「판 옆에 펴 두세요」라고만 적혀 있어 순서를 알 수 없다.
  //   그래서 첫 장을 「무엇을 언제 읽는가」로 만들고, 이후 모든 장에 그 단계를 찍는다.
  const body = `<div class="page"><h1>여기서부터 <span class="muted">— 이 게임을 처음 하는 분들께</span></h1>
    <p><b>진행자가 없는 추리 게임입니다.</b> 여섯 명(또는 일곱) 모두가 용의자이고,
      그중 한 명이 범인입니다. 범인도 남들과 똑같이 조사하고 똑같이 거짓말합니다.
      나머지는 <b>자기가 결백하다는 것만</b> 알 뿐, 누가 범인인지는 모릅니다.<br>
      두 시간 안팎. <b>토론에는 제한 시간이 없습니다</b> — 할 말이 끝나면 다음으로 갑니다.<br>
      규칙을 다 외울 필요는 없습니다 — <b>이 순서대로만 따라오세요.</b></p>

    <h2>읽는 순서 — 이대로 하면 됩니다</h2>
    <p class="muted">각 종이가 무엇인지는 <b>다음 장</b>에 한 줄씩 적어 두었습니다.
      지금은 이 표만 보고 1번부터 하면 됩니다.</p>
    <table><tr><th style="width:7%">순</th><th style="width:30%">무엇을</th><th>누가 · 어떻게</th></tr>
      <tr><td class="stn">1</td><td><b>「탁자에 이렇게 놓습니다」</b><br><span class="muted">인쇄물 <b>「보드_배치와트랙」</b>의 첫 면 (A3 가로)</span></td>
        <td>한 사람이 읽으며 <b>카드와 종이를 자리에 놓습니다.</b> 10분. 나머지는 거들면 됩니다.</td></tr>
      <tr><td class="stn">2</td><td><b>인물 시트를 하나씩</b></td>
        <td>제비뽑기든 합의든 좋습니다. 받으면 <b>혼자서 5분간 읽습니다.</b>
          접힌 안쪽은 절대 보여 주지 않습니다.</td></tr>
      <tr><td class="stn">3</td><td><b>「사건 브리핑」</b><br><span class="muted">이 책자에서 머리에 <b>「시작할 때」</b>라고 적힌 면</span></td>
        <td>한 사람이 <b>소리 내어 읽습니다.</b> 여기까지가 전원이 아는 전부입니다.</td></tr>
      <tr><td class="stn">4</td><td><b>자기소개</b></td>
        <td>인물 시트 <b>겉면</b>에 적힌 것을 자기 말로. 한 사람에 30초.</td></tr>
      <tr><td class="stn">5</td><td><b>「기본 규칙」 세 면</b><br><span class="muted">이 책자에서 머리에 <b>「첫 라운드 전에 · 계속 펴 둡니다」</b>라고 적힌 면들</span></td>
        <td>다 함께 훑습니다. 3분. <b>앞장 한 면</b>만 알면 1라운드가 돕니다. 판 옆에 계속 펴 둡니다.</td></tr>
      <tr><td class="stn">6</td><td><b>1라운드 시작</b></td>
        <td>조사(장소 하나에서 <b>2장</b>, CCTV 열람실만 <b>3장</b>) → <b>토론</b> → 라운드 끝.
          토론은 <b>할 말이 끝날 때까지</b> 합니다. 이것을 여섯 번(일곱이면 다섯 번) 반복합니다.</td></tr>
      <tr><td class="stn">7</td><td><b>라운드가 끝날 때마다</b><br><span class="muted">「라운드 트랙」은 인쇄물 <b>「보드_배치와트랙」</b>의 둘째 면,
        「사건 기록판」은 이 책자의 <b>「라운드마다」</b> 면</span></td>
        <td><b>「라운드 트랙」</b>의 말을 한 칸 옮기고, 이벤트 칸이면 그 카드를 뒤집어 읽습니다.
          <b>「사건 기록판」</b>에 한 줄 적습니다.</td></tr>
      <tr><td class="stn">8</td><td><b>최종 토론 · 지목</b></td>
        <td>마지막 라운드가 끝나면 충분히 토론하고 <b>동시에</b> 한 명씩 지목합니다.</td></tr>
      <tr><td class="stn">9</td><td><b>진상 해설서</b></td>
        <td>봉투를 엽니다. 한 사람이 소리 내어 읽습니다. 그리고 10분쯤 이야기를 나눕니다.</td></tr></table>

  </div>

  <div class="page">${stage('헷갈릴 때')}<h1>이 종이는 무엇인가 <span class="muted">— 헷갈리면 여기를 보세요</span></h1>
    <table><tr><th style="width:26%">무엇</th><th>어떤 물건인가</th></tr>
      <tr><td><b>진행 물품</b><br><span class="muted">지금 보는 이 책자</span></td>
        <td>사건 브리핑 · 탁자 배치 · 기본 규칙 세 면 · 라운드 트랙 · 사건 기록판 · 이벤트 카드.
          <b>전원이 함께 씁니다.</b> 장마다 머리에 <b>언제 쓰는 것인지</b>가 적혀 있습니다.</td></tr>
      <tr><td><b>인물 시트</b><br><span class="muted">사람마다 한 장</span></td>
        <td>당신이 맡을 사람의 정체·그날의 행적·대사가 들어 있습니다. A4 한 장을 세로로 접은 것이라
          <b>겉면만 남에게 보이고 안쪽 세 면은 본인만</b> 봅니다.</td></tr>
      <tr><td><b>현장 판</b><br><span class="muted">큰 종이 한 장</span></td>
        <td>숙소 2층 평면도. 방마다 <b>번호와 물건 이름</b>이 적혀 있습니다 — 「A3 풀」처럼.
          조사할 때 이 판을 보고 어디를 뒤질지 고릅니다.<br>
          <b>같은 종이에 CCTV 열람실과 감식실 판도 있습니다</b> — 그 이벤트가 열릴 때 꺼내 펴 둡니다.</td></tr>
      <tr><td><b>단서 카드</b><br><span class="muted">잘라 둔 카드 뭉치</span></td>
        <td>장소별로 따로 쌓아 둡니다. <b>뒷면(번호)이 보이게</b> 쌓고, 가져간 사람이 앞면을 혼자 읽습니다.</td></tr>
      <tr><td><b>필적 대조 카드</b><br><span class="muted">Q6 일곱 장</span></td>
        <td>앞면이 보이게 펴 둡니다. <b>가져가는 카드가 아닙니다</b> — 그 자리에서 QR 만 찍습니다.<br>
          그 사람의 <b>다이어리가 판에 공개된 뒤</b>라야 찍을 수 있고, <b>한 라운드에 세 명까지</b>입니다(조사와 별개).</td></tr>
      <tr><td><b>진상 해설서</b><br><span class="muted">봉투 안</span></td>
        <td><b>끝나기 전엔 아무도 열지 않습니다.</b> 지목이 끝난 뒤에 엽니다.</td></tr></table>

    <h2>카드에 붙는 표시 넷</h2>
    <p class="muted">자세한 것은 「기본 규칙 — 뒷장」에 있습니다. 지금은 이 정도만 알면 됩니다.</p>
    <table><tr><th style="width:22%">표시</th><th>뜻</th></tr>
      <tr><td><span class="lg">🔒</span></td><td>아직 못 읽는 카드입니다. 영장이 나와야 열립니다</td></tr>
      <tr><td><span class="lg">⚖</span></td><td>여기 적힌 사람은 <b>이 결과를 읽을 수 없습니다.</b> 남이 집어 읽습니다</td></tr>
      <tr><td><span class="lg">🔬</span></td><td>감식실에 낼 수 있는 것입니다. 결과는 <b>낸 사람 아닌 이가</b> 읽습니다</td></tr>
      <tr><td><span class="lg">⭐</span></td><td>다른 카드와 짝을 맞추면 <b>특수 단서</b>를 가져갑니다. 짝 번호가 카드에 적혀 있습니다</td></tr>
      <tr><td><span class="lg">📢</span></td><td>CCTV 장면입니다. <b>가져오면 그 자리에서 모두에게 소리 내어 읽습니다</b> — 이 더미만 예외입니다</td></tr></table>

    <div class="box"><div class="bl">처음 하는 분들이 가장 많이 묻는 것</div>
      <p><b>규칙을 다 알아야 하나요?</b> 아닙니다. 「기본 규칙」 앞장 한 면만 알면 1라운드를 돌 수 있습니다.
        나머지는 그때가 오면 이벤트 카드가 알려 줍니다.<br>
        <b>연기를 잘해야 하나요?</b> 아닙니다. 시트에 적힌 대로만 말하면 됩니다.
        모르는 질문을 받으면 <b>「그건 모릅니다」</b>가 정답입니다.<br>
        <b>거짓말해도 되나요?</b> <b>전원이 해도 됩니다.</b> 다만 시트에 <b>⚠</b> 로 찍힌 카드가
        판에 나오면 그때는 인정해야 합니다 — 우기면 게임이 멈춥니다.<br>
        <b>휴대폰이 필요한가요?</b> 각자 한 대씩 필요합니다. 카드에 붙은 QR 을 찍어야 하는 것이 있습니다.</p></div>
  </div>

  <!--WIDE-->
  <div class="page board">${stage('준비할 때')}<h1>탁자에 이렇게 놓습니다</h1>
    <p class="muted">가운데에 현장 판을 깔고, 장소마다 카드를 따로 쌓습니다.
      <b>카드는 판 위에 올리지 않습니다</b> — 판은 어디를 고를지 보는 그림이고, 카드는 그 옆에 쌓입니다.</p>
    <div class="tbl">
      <div class="tblRow">
        <div class="slot slotDim">A<br><span>한다영</span></div>
        <div class="slot slotDim">B<br><span>한소미</span></div>
        <div class="slot slotDim">C<br><span>서지안</span></div>
        <div class="slot slotBox">D<br><span>목사님의 방<br>현장 ① 뒤 · 기록 ② 뒤</span></div>
      </div>
      <div class="tblRow">
        <div class="slot slotWide slotMap">현장 판 <span>숙소 2층 평면도 · A3 가로</span></div>
        <div class="slot slotBox">V<br><span>CCTV 열람실<br>이벤트 ③ 뒤 · <b>판 있음</b></span></div>
      </div>
      <div class="tblRow">
        <div class="slot slotDim">E<br><span>최종현</span></div>
        <div class="slot slotDim">F<br><span>문세린</span></div>
        <div class="slot slotDim">G<br><span>강지후</span></div>
        <div class="slot slotBox">L<br><span>감식실<br>이벤트 ② 뒤 · <b>판 있음</b></span></div>
      </div>
      <div class="tblRow">
        <div class="slot slotOpen">S <span>특수 단서 — 처음부터 꺼내 두되 <b>뒷면이 보이게</b></span></div>
        <div class="slot slotOpen">Q <span>필적 대조 7장 — 앞면이 보이게</span></div>
        <div class="slot slotOpen">공개 <span>목사님 일정표 — 이벤트 ① 과 함께 펴 둔다</span></div>
      </div>
      <div class="tblRow">
        <div class="slot slotSheet">라운드 트랙 <span>말 하나</span></div>
        <div class="slot slotSheet">기본 규칙 시트 <span>세 면</span></div>
        <div class="slot slotSheet">사건 기록판 <span>연필</span></div>
        <div class="slot slotSeal">진상 해설서 <span>봉투째 — 끝나기 전엔 열지 않는다</span></div>
      </div>
    </div>
    <p class="muted"><b>사람마다 손에 드는 것</b> — 인물 시트 한 장(접어서 겉면만 보이게)과
      휴대폰 하나. 가져간 카드는 자기 앞에 <b>번호가 보이게</b> 늘어놓습니다 —
      무엇을 몇 장 가졌는지는 서로 보이고, 그 내용만 자기 것입니다.</p>
  </div>



  <!--/WIDE-->
  <div class="page brief">${stage('시작할 때')}<h1>사건 브리핑</h1>
    <p class="muted"><b>순서 3.</b> 인물 시트를 각자 읽은 뒤, 한 사람이 소리 내어 읽습니다.
      한 절씩 돌아가며 읽어도 좋습니다. <b>여기까지가 전원이 아는 전부입니다.</b></p>${pages}
    <h2>그리고 규칙 하나</h2>
    <p>여러분 중 <b>한 명이 범인</b>입니다. 범인도 남들과 똑같이 수사에 참여하고, 거짓말을 합니다.
      나머지는 자기가 결백하다는 것만 알 뿐, 누가 범인인지는 모릅니다.</p></div>

  <div class="page">${stage('첫 라운드 전에 · 계속 펴 둡니다')}<h1>기본 규칙 <span class="muted">— 앞장</span></h1>
    <p class="muted"><b>순서 5.</b> 다 함께 3분간 훑습니다. 다 외울 필요는 없습니다 — 이 한 면이면 1라운드가 돕니다.</p>
    <h2>한 라운드</h2>
    <p>①<b>조사</b> — 순서대로 한 명씩, 열려 있는 장소 <b>하나</b>를 골라 그 장소의 남은 번호 중
      <b>2장</b>을 가져갑니다. 가져간 번호는 남이 못 가집니다. 내용은 자기만 읽습니다.<br>
      &nbsp;&nbsp;<b>단 CCTV 열람실(V)만 한 번에 세 장을 봅니다</b> — 가져가는 것이 아니라
      화면을 이어 보는 것이라서입니다. 세 장 다 그 자리에서 소리 내어 읽습니다.<br>
      &nbsp;&nbsp;시작 플레이어는 <b>라운드마다 한 칸씩 돕니다.</b><br>
      &nbsp;&nbsp;<b>가져오면 그 자리에서 읽습니다 — 소리 내지 말고 혼자서.</b> 남은 번호만 봅니다.<br>
      &nbsp;&nbsp;<span class="muted">읽고 나서 토론에 들어갑니다. 안 읽고 넘어가면 그 라운드 조사가
      발언에 아무 영향을 못 줍니다. 무엇을 읽었는지는 토론에서 <b>말하고 싶은 만큼만, 사실이든
      거짓이든 자유롭게</b> 말합니다.</span><br>
      ②<b>토론</b> — 카드를 <b>보여 주지 않고</b> 말로만 공유합니다. 거짓말해도 됩니다.<br>
      &nbsp;&nbsp;<b>제한 시간은 없습니다.</b> 더 물을 것이 없으면 그때 넘어갑니다 —
      한 라운드에 자백이 둘 셋씩 겹치는 날이 있고, 그런 라운드를 시계로 자르면 자백의 무게가 서로 깎입니다.<br>
      ③<b>종료</b> — 트랙의 말을 한 칸 옮기고, 이벤트 칸이면 이벤트 카드를 펼칩니다.</p>
    <h2>한 방에 세 명까지</h2>
    <p>같은 라운드에 <b>같은 장소로는 세 명까지</b> 갑니다. 네 번째 사람은 다른 곳으로 가세요.<br>
      <b>단, 갈 만한 곳이 없으면 이 제한을 풉니다.</b> 남은 카드가 모자라 뒷순번이 조사를 통째로
      건너뛰게 되는 라운드에는, 이미 세 명이 간 장소에도 들어가 남은 것을 나눠 가집니다.<br>
      <span class="muted">여섯이 한 방에 몰리면 뒷순번은 집을 카드가 없어 그 라운드 발언 재료가
      0이 됩니다. 실제로 세 번 일어났습니다.</span></p>
    <p><b>고른 장소에 남은 카드가 2장에 못 미치면, 남은 만큼만 가져갑니다.</b> 한 장이면 한 장입니다 —
      모자란 만큼을 다른 장소에서 채우지는 않습니다.
      <b>갈 수 있는 곳이 한 군데도 안 남았으면 그 사람은 그 라운드 조사를 건너뜁니다</b> —
      토론에는 그대로 참여합니다.<br>
      <span class="muted">마지막 라운드에는 장소마다 한두 장씩만 남습니다. 이 한 줄이 없으면
      뒷순번이 「갈 곳은 있는데 2장을 못 채우는」 자리에서 판이 멈춥니다.</span></p>

    <h2>가져갈 수 없는 카드</h2>
    <p>· <b>자기 방에는 들어갈 수 없습니다.</b> 처음부터 끝까지, 한 라운드도 예외가 없습니다.
      자기 물건은 <b>남이 찾아 읽습니다.</b><br>
      &nbsp;&nbsp;<span class="muted">자기한테 불리한 카드를 자기가 먼저 집어 자기 입으로 해명하는 것이
      언제나 최선이 되면, 아무도 걸리지 않고 판이 멈춥니다. 내 방은 남이 뒤집니다 — 그게 이 게임입니다.</span><br>
      <span class="muted">(감식은 아래를 따릅니다)</span></p>

  </div>

  <div class="page">${stage('첫 라운드 전에 · 계속 펴 둡니다')}<h1>기본 규칙 <span class="muted">— 뒷장</span></h1>
    <h2>CCTV 는 혼자 읽지 않습니다</h2>
    <p><b>가져온 CCTV 장면(V)은 그 자리에서 모두에게 소리 내어 읽습니다.</b>
      다른 모든 카드는 혼자 읽고 말할지 말지를 정하지만, 이 더미만은 아닙니다.<br>
      <span class="muted">화면은 감출 수 있는 물건이 아닙니다 — 수사팀이 확보한 원본을 한 사람이
      혼자 보고 덮는 일은 없습니다. 자기 발자국을 자기가 지울 수 있으면 이 더미는 진범에게만
      유리한 더미가 됩니다.</span></p>
    <p><b>뒷면에는 그 장면에 찍힌 사람의 색점이 하나 있고, 그 안에 이름 끝 글자가 적혀 있습니다</b>
      (현·후·미·안·영·린). 열람실 판이 알려 주는 것은
      번호와 <b>시각</b>까지이고, <b>누가 찍혔는지</b>는 이 색점이 알려 줍니다.<br>
      <b>자기 색도 가져갈 수 있습니다.</b> 다만 가져오면 소리 내어 읽어야 하니, 자기 장면을 집는 것은
      감추는 수가 아니라 <b>먼저 해명하겠다는 선언</b>입니다.</p>
    <h2>모르는 말이 나오면</h2>
    <p><b>각자 휴대폰으로 찾아봐도 됩니다.</b> 요힘빈이 무엇인지, 졸피뎀이 어떤 약인지,
      설하정을 언제 쓰는지 — 카드에 다 적혀 있지 않습니다.
      찾아본 것을 말할지 말지는 본인이 정합니다. <b>검색으로 알아낸 것도 이 판의 단서입니다.</b></p>

    <h2>카드 위쪽의 표시 — 네 가지</h2>
    <table><tr><th style="width:20%">표시</th><th>뜻</th></tr>
      <tr><td><span class="lg">🔒</span> <b>이벤트 ② 뒤</b></td>
        <td>휴대폰입니다. <b>준비할 때 빼서 따로 두었다가</b>, 이벤트 ② 를 읽을 때 각 방 더미에 섞어 넣습니다.
          카드 뒷면에도 같은 표시가 있습니다 — 그걸 보고 골라내세요.</td></tr>
      <tr><td><span class="lg">⚖</span> <b>본인 낭독 불가</b></td>
        <td>그 결과가 걸리는 사람이 카드에 적혀 있습니다. <b>그 사람은 이 결과를 읽을 수 없습니다</b> — 다른 사람이 집어 소리 내어 읽습니다. <b>가져가는 것도, 내는 것도 누구나 됩니다.</b></td></tr>
      <tr><td><span class="lg">🔬</span> <b>감식실</b></td>
        <td>채취물입니다. 감식실이 열린 뒤부터 라운드 끝에 감식실 옆에 내려놓으세요.
          <b>내는 데는 조사 행동을 쓰지 않습니다.</b> 카드 아래에 결과 번호가 적혀 있습니다.</td></tr>
      <tr><td><span class="lg">⭐</span> <b>조합 재료</b></td>
        <td>다른 카드와 함께 모으면 <b>특수 단서(S)</b> 를 가져갑니다. 무엇과 묶는지는 카드 아래에 적혀 있습니다.
          <b>가진 사람이 달라도 됩니다</b> — 합의해서 판 가운데에 공개하면 함께 가져갑니다.</td></tr>
      <tr><td><span class="lg">📢</span> <b>모두에게 낭독</b></td>
        <td>CCTV 장면입니다. <b>한 번에 세 장을 보고, 그 자리에서 모두에게 소리 내어 읽습니다.</b>
          다른 모든 카드는 두 장씩 가져가 혼자 읽지만, 이 더미만은 아닙니다.</td></tr></table>

    <h2>특수 단서</h2>
    <p>카드에 적힌 조합(⭐)을 다 모으면 그 카드들을 <b>판 가운데에 공개하고</b>, 특수 더미에서 그 번호를 가져옵니다.
      <b>가진 사람이 달라도 됩니다</b> — 둘이 합의하면 됩니다.<br>
      <b>가져온 특수 단서는 한 사람이 소리 내어 읽습니다.</b> 조합은 판이 함께 만든 것이라 판이 함께 압니다 —
      누가 갖는지는 정하지 않아도 됩니다. 무엇으로 얻었는지는 카드 앞면에 적혀 있습니다.</p>
  </div>

  <div class="page">${stage('첫 라운드 전에 · 계속 펴 둡니다')}<h1>기본 규칙 <span class="muted">— 셋째 장</span></h1>
    <h2>휴대폰 안에는 잠긴 것이 있습니다</h2>
    <p>휴대폰 카드의 QR 을 찍으면 <b>앱 목록</b>이 뜹니다 — 연락처 · 인터넷 · 카카오톡 · 사진.
      대부분은 그냥 열리지만, <b>카카오톡의 대화방 하나가 「🔒 삭제된 대화」로 잠겨 있습니다.</b></p>
    <p>1. 그 방을 누르면 <b>네 자리 숫자</b>를 넣는 칸이 뜹니다.<br>
      2. <b>맞는 숫자를 넣으면 그 자리에서 대화가 되살아납니다.</b> 틀리면 아무것도 안 나옵니다.<br>
      3. <b>그 숫자는 다른 단서 안에 적혀 있습니다.</b> 누군가의 다이어리, 목사님의 일기장,
      사진 속의 번호 — 폰을 가진 사람과 숫자를 아는 사람은 대개 다릅니다. <b>물어야 열립니다.</b><br>
      4. 세 번 틀리면 화면이 <b>힌트를 한 줄</b> 줍니다.</p>
    <p class="muted">복구된 화면은 <b>찍은 사람의 폰에만</b> 뜹니다 — 무엇을 봤는지 말할지 말지는 그 사람이 정합니다.
      「내가 그 숫자를 안다」고 말할지 말지도 마찬가지입니다.<br>
      <b>목사님 휴대폰의 「인터넷」 앱에는 조회 화면이 하나 더 있습니다.</b> 번호를 넣으면 결과가 나옵니다 —
      그 번호도 같은 폰 어딘가에 있습니다.</p>

    <h2>감식 — 낸 사람과 읽는 사람이 다르다</h2>
    <p>🔬 표시가 있는 카드는 <b>채취물</b>입니다. 감식실이 열린 뒤부터,</p>
    <p>1. 채취물을 가진 사람이 라운드 끝에 그 카드를 <b>앞면으로 감식실 옆에 내려놓습니다.</b>
      <b>조사 행동을 쓰지 않습니다.</b> <b>사람마다 한 라운드에 한 장</b>씩 낼 수 있습니다. 무엇을 냈는지는 전원이 봅니다.<br>
      2. 다음 라운드 시작 때, <b>낸 사람이 아닌 다른 사람</b>이 그 결과 번호(L…)를 집어
      <b>소리 내어 읽습니다.</b> 읽은 뒤 그 결과 카드는 읽은 사람이 갖고,
      <b>낸 채취물은 낸 사람에게 돌아옵니다</b> — 조합(⭐)에 다시 쓸 수 있습니다.<br>
      3. <b>채취물을 가진 사람이 두 라운드가 지나도 내지 않으면, 그다음 라운드 끝에 누구든
      대신 낼 수 있습니다.</b> 가진 사람은 거부하지 못합니다 — 카드는 낸 뒤 돌려주고, 결과는
      여느 때처럼 낸 사람 아닌 이가 읽습니다.<br>
      4. <b>마지막 라운드에 낸 것은 최종 토론이 시작될 때 읽습니다.</b> 마지막 라운드라고 해서
      버려지지 않습니다 — 늦게라도 내는 것이 안 내는 것보다 낫습니다.</p>
    <p class="muted">결과를 읽는 손과 결과가 걸린 목이 같으면 그 카드는 증거가 아니라 증언이 됩니다.
      그래서 낸 사람은 자기 결과를 못 읽습니다. 반대로 "내 물건이라 아예 못 낸다"고 해 두면
      그 카드가 영영 잠기므로, 넘겨서 내는 길을 열어 둡니다.</p></div>

  <!--WIDE-->
  <div class="page board">${stage('라운드마다')}<h1>라운드 트랙 <span class="muted">— 인원에 맞는 것 하나만 펴 두세요</span></h1>
    <p class="muted">라운드가 끝날 때마다 <b>말을 한 칸 옮깁니다.</b> 말은 동전이든 무엇이든 됩니다.
      <b>①②③④ 자리에 이벤트 카드를 접어 얹어 두고</b>, 그 라운드가 끝나면 뒤집어 함께 읽습니다.<br>
      이벤트가 붙는 라운드는 인원에 따라 다릅니다. <b>순서와 내용은 같습니다</b> —
      마지막 라운드 하나를 남기고 넷을 다 읽습니다.</p>
    ${TRACKS.map(({ label, rounds, evAt }) => `
    <h2>${label}</h2>
    <div class="trk trk${rounds}">${Array.from({ length: rounds }, (_, i) => i + 1).map((n) => {
      const ev = evAt[n];
      // 그 라운드 '시작'에 무엇이 열려 있는지 — 직전 라운드 끝에 읽은 이벤트가 연 것이다.
      const opened = { '①': '목사님의 방<br>— 현장',
        '②': '목사님의 방 — 기록<br>🔒 휴대폰 · 감식실 L',
        '③': 'CCTV 열람실 V' }[evAt[n - 1]];
      return `<div class="cell${ev ? ' cellEv' : ''}${n === rounds ? ' cellLast' : ''}">
        <div class="cellTop"><span class="cellN">${n}</span>${n === rounds
          ? '<span class="cellTag">마지막</span>' : ''}</div>
        <div class="cellOpen">${opened ? `<b>여기서 열립니다</b><br>${opened}`
          : '<span class="muted">새로 열리는 곳 없음</span>'}</div>
        <div class="cellDo">조사 2장<br><span class="muted">CCTV 는 3장</span><br>토론</div>
        ${ev ? `<div class="evSlot">이벤트 ${ev}<div class="evSlotSub">라운드 끝에 뒤집는다</div></div>`
          : '<div class="pawnSlot">말 자리</div>'}
      </div>`;
    }).join('')}</div>`).join('')}
    <p class="muted"><b>여는 순서는 여섯이나 일곱이나 같습니다.</b> 다른 것은 2차 부검(④) 하나뿐입니다 —
      여섯은 라운드가 하나 더 있으므로 그만큼 뒤로 미룹니다. <b>어느 쪽이든 부검 뒤에 조사할 라운드가
      한 번 남습니다</b> — 그때서야 값이 생기는 카드가 있기 때문입니다.<br>
      <b>CCTV 는 세 라운드(여섯) · 두 라운드(일곱)에 걸쳐 열립니다.</b> 한 라운드에 한 장소는 세 명까지라,
      마지막 라운드에만 열면 열여섯 장 중 여섯 장밖에 손이 닿지 않습니다.</p>
    <div class="trkEnd">
      <div class="endStep"><b>최종 토론</b></div>
      <div class="endArrow">→</div>
      <div class="endStep"><b>지목</b> 한 명씩 동시에</div>
      <div class="endArrow">→</div>
      <div class="endStep"><b>진상 해설서</b> 봉투를 연다</div>
      <div class="endArrow">→</div>
      <div class="endStep"><b>감상전</b> 10분</div>
    </div>
    <p class="muted"><b>여섯이면 6라운드, 일곱이면 5라운드입니다.</b>
      일곱은 한 라운드에 조사가 일곱 번 돌아, 라운드가 하나 적어도 전체 조사 횟수는
      거의 같습니다 — 35회와 36회. 조사해 가져갈 카드는 모두 <b>72장</b>(방 56 · CCTV 16)이라,
      여섯이 6라운드면 72장을 <b>정확히 다 소진합니다</b> — 마지막 라운드에는 장소마다 한두 장씩만
      남으므로 아래의 <b>세 명 제한 해제</b>로 나눠 가집니다. 일곱이 5라운드면 70장이라 두 장이 남습니다.<br>
      <b>일곱이면 형사도 한 표를 던집니다.</b> 다만 아무도 형사를 지목하지 않습니다.</p>
  </div>

  <!--/WIDE-->
  <div class="page">${stage('라운드마다')}<h1>사건 기록판 <span class="muted">— 판 가운데에 펴 두세요</span></h1>
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

  <div class="page">${stage('준비할 때 오려 둡니다')}<h1>이벤트 카드 <span class="muted">— 잘라서 접어 두세요</span></h1>
    <p class="muted">준비할 때 네 장을 잘라 접어서, 라운드 트랙의 ①②③④ 자리에 <b>뒷면이 보이게</b> 얹어 둡니다.
      그 라운드가 끝나면 뒤집어 한 사람이 소리 내어 읽습니다. <b>미리 읽지 마세요.</b></p>
    ${ev('①', whenEv('①'), '현장 통제 해제',
      `<p>단순 발작사로 보기 어렵다는 소견이 나와, <b>목사님 방을 현장으로 보존하고 있었습니다.</b>
        1차 검안이 끝나 이제 들어갈 수 있습니다.</p>
      <p class="muted">방 문에는 <b>작은 유리창</b>이 있습니다. 복도에서 안이 들여다보입니다.</p>
      <p><b>목사님의 방 — 현장이 열립니다.</b> 그 카드들을 판 옆에 놓고,
        「목사님 일정표」는 <b>앞면이 보이게</b> 그 옆에 펴 둡니다 — 이 한 장은 아무도 가져갈 수 없습니다.</p>
      <p class="muted">정밀 부검은 아직 나오지 않았습니다. 지금 아는 것은 시작 시트에 적힌 것까지입니다 —
        안구의 출혈, 굳은 손, 입가의 딸기향. <b>무엇이 목사님을 죽였는지는 아직 아무도 모릅니다.</b></p>`)}
    ${ev('②', whenEv('②'), '유품 반출 동의 · 통신 기록 영장',
      `<p>유족이 유품 반출에 동의했고, 통신 기록 영장이 나왔습니다.</p>
      <p><b>목사님의 방 — 기록이 열립니다.</b> 일기장과 휴대폰입니다.<br>
        그리고 <b>따로 빼 두었던 🔒 휴대폰 카드를 각 방 더미에 섞어 넣습니다.</b>
        이제부터 각 방에서 그 방 주인의 휴대폰을 가져갈 수 있습니다. 자기 방에는 못 들어가니 <b>자기 폰은 남이 읽습니다.</b></p>
      <p><b>감식실(L)도 함께 열립니다.</b> <b>이 카드를 읽는 지금 바로</b> 채취물을 낼 수 있습니다 — 다음 라운드까지 기다리지 않습니다.<br>
        <span class="muted">🔬 표시가 있는 카드를 가진 사람은 라운드 끝에 감식실 옆에 내려놓으세요.
        결과는 다음 라운드에 <b>낸 사람이 아닌 다른 사람</b>이 집어 소리 내어 읽습니다.</span></p>`)}
    ${ev('③', whenEv('③'), '숙소 CCTV 원본 확보',
      `<p>숙소 CCTV 원본을 확보했습니다. 2층 복도와 1층 로비까지, 그날 누가 언제 움직였는지가 남아 있습니다.</p>
      <p><b>CCTV 열람실(V)이 열립니다.</b> 더미를 <b>뒷면이 보이게</b> 판 옆에 놓습니다.<br>
        <span class="muted">복도와 로비만 찍힙니다 — <b>방 안은 어디도 찍히지 않습니다.</b></span></p>
      <p><b>여기는 규칙이 둘 다릅니다.</b><br>
        · <b>한 번에 세 장을 봅니다.</b> 다른 장소는 두 장이지만 화면은 이어 보는 것이라서입니다.<br>
        · <b><span style="text-decoration:underline">본 장면은 그 자리에서 모두에게 소리 내어 읽습니다.</span></b>
        혼자 읽고 덮어 두지 못합니다.<br>
        뒷면의 <b>색점</b>은 그 장면에 찍힌 사람입니다. 자기 색도 가져갈 수 있지만, 가져오면 읽어야 합니다.<br>
        <span class="muted">화면은 감출 수 있는 물건이 아닙니다. 수사팀이 확보한 원본을 한 사람이
        혼자 보고 덮는 일은 없습니다.</span></p>`)}
    ${ev('④', whenEv('④'), '2차 부검 소견 — 타살로 확정',
      `<p>정밀 부검 결과가 왔습니다. <b>심정지가 아니라 질식사</b>입니다.
        코·입 주변 압박흔과 안면 점출혈이 확인됐습니다.</p>
      <p>새로 열리는 곳은 없습니다. 지금까지 나온 것으로 좁혀야 합니다.</p>
      <p><b>아직 감식실에 안 낸 채취물(🔬)이 있으면 이번이 마지막 기회입니다.</b>
        마지막 라운드에 낸 것은 최종 토론이 시작될 때 읽습니다.<br>
        <span class="muted">어느 장소든 <b>남은 카드가 모자라면 세 명 제한을 풀고</b> 나눠 가집니다 —
        갈 곳이 없어서 조사를 건너뛰는 사람이 없게 하세요.</span></p>
      <p class="muted">사건 기록판의 시간표를 다 함께 소리 내어 읽으세요. 비어 있는 칸이
        아직 밝혀지지 않은 것입니다.</p>`)}
  </div>`;


  // 표시해 둔 두 장을 떼어 A3 가로로 따로 뽑는다. 나머지는 A4 그대로다.
  const WIDE = /<!--WIDE-->([\s\S]*?)<!--\/WIDE-->/g;
  const wide = [...body.matchAll(WIDE)].map((m) => m[1]).join('');
  const rest = body.replace(WIDE, '');
  const a3land = `@page { size: A3 portrait; margin: 0; }
  .page { padding: 14mm 14mm 12mm; }
  .wrap { transform-origin: top left; }
  /* A4 두 장을 이어 붙인 크기다 — 가로 297mm · 세로 420mm. 가로세로 다 1.41 배가 되므로
     글씨도 그만큼 키운다. 이 두 장은 판을 눈으로 훑는 종이라, 작으면 매번 얼굴을 들이밀게 된다. */
  .page.board h1 { font-size: 30pt; }
  .page.board .muted { font-size: 12.4pt; line-height: 1.55; }
  .page.board .slot { font-size: 18pt; min-height: 26mm; padding: 4mm 3.4mm; }
  .page.board .slot span { font-size: 11.6pt; line-height: 1.45; }
  .page.board .slotMap { font-size: 22pt; min-height: 46mm; }
  .page.board .tbl { gap: 4mm; padding: 6mm; }
  .page.board .tblRow { gap: 4mm; }
  .page.board .cellN { font-size: 25pt; }
  .page.board .cellTag { font-size: 7.2pt; }
  .page.board .cellTop { min-height: 10mm; }
  .page.board .cellOpen { font-size: 8.6pt; min-height: 12mm; padding: 1.6mm 0; }
  .page.board .cellDo { font-size: 8.8pt; }
  .page.board .evSlot { font-size: 9.4pt; min-height: 16mm; }
  .page.board .evSlotSub { font-size: 6.8pt; }
  .page.board .pawnSlot { width: 15mm; height: 15mm; font-size: 7pt; }
  .page.board .endStep { font-size: 9pt; padding: 2.4mm 2mm; }
  .page.board .endArrow { font-size: 13pt; }
  .page.board .trN { font-size: 19pt; }
  .page.board .trL { font-size: 9pt; }
  .page.board .trX { font-size: 8.2pt; }`;
  // 장마다 속을 한 겹 싸 둔다 — 확대는 그 한 겹을 통째로 키우는 것이라 감쌀 상자가 필요하다.
  const wrapped = wide.split('<div class="page board">').filter((x) => x.trim()).map((seg) => {
    const end = seg.lastIndexOf('</div>');                  // 그 장을 닫는 태그
    return `<div class="page board"><div class="wrap">${seg.slice(0, end)}</div></div>`;
  }).join('\n');
  return [
    { filename: '보드_진행물.html', html: doc('보드게임 진행 물품', rest) },
    { filename: '보드_배치와트랙.html', html: doc('보드게임 배치와 트랙', wrapped, a3land, WIDE_FIT) },
  ];
}

/**
 * data: { allClues, suspects } — 정본
 * opts.assetBase: 그림 경로 앞에 붙일 것. Node 는 출력물이 output/html/ 에 놓이므로
 *   저장소 루트까지 네 단계 올라가야 하고, 브라우저는 사이트 루트라 그대로 쓴다.
 */
export async function genBoardDocs(data, opts = {}) {
  allClues = data.allClues;
  suspects = data.suspects;
  recover = data.recover || {};
  const base = opts.assetBase ?? '../../../../public';
  img = (p) => base + p;
  if (opts.siteUrl) siteUrl = opts.siteUrl;
  await buildQR(buildBoard().bag.CC);        // V 카드 QR 을 먼저 만들어 둔다
  return [charCards(), clueCards(), placeBoard(), ...runSheets()];
}
