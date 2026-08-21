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
  { id: 'LB', letter: 'L', name: '감식실', color: '#5a5a5a', open: '4라운드 종료 후 · 채취물 제출 전용' },
];
PLACES.find((p) => p.id === 'PS').open = '현장(D1~D10) 2라운드 종료 후 · 기록(D11~) 3라운드 종료 후';

// 앱에서는 이 특수 단서들이 '열람 흔적'(톡서랍 비밀번호 복구·필적 대조·심문)으로 열린다.
//   보드에는 비밀번호도 심문도 없어 unlockedBy 가 비어 있고, 그래서 네 장이 영원히 더미에
//   남아 있었다. 같은 조건을 카드 조합으로 옮긴다 — 앱 데이터는 건드리지 않는다.
//   [코드, 그 단서의 어느 장인지] 로 적는다. 폰은 앱마다 한 장이라 '카카오톡' 장을 가리켜야 한다.
const BOARD_UNLOCK = {
  'SIST-22': [['QIVS-92', '카카오톡'], ['HUOX-80', '카카오톡']],   // 자매의 교차 대화
  'DISC-11': [['LWUY-33', '카카오톡'], ['TCGA-87', '카카오톡']],   // 지워진 대화방
  // 필적 대조는 표본이 '아무 방에나' 있어야 한다. 종현 다이어리를 표본으로 쓰면 조합이 죽는다 —
  //   앞 단계 TUBE-12 의 재료(통 두 개)가 둘 다 종현 방이라 종현이 1라운드에 가져가는 게
  //   합리적인데, 그러면 자기 방이 닫힌 뒤라 표본을 영영 못 얻는다. 목사님 일기장은 누구나 간다.
  'TUBE-22': [['TUBE-12'], ['PRBO-03']],                          // 라벨 위화감 + 필적 표본
  'KMRV-41': [['NBZL-83'], ['AYMX-96', '6월 30일']],              // 지갑 + 가현 일기
};

// 휴대폰 잠금은 두 단계다. 25장이 한 라운드에 통째로 풀리면 그 라운드 토론이 낭독으로 다 날아간다.
//   통신 기록(누구와 이어져 있었나)이 먼저, 대화 내용(무슨 말을 했나)이 나중에 열린다.
const LOCK_TIER = { 연락처: 4, 인터넷: 4 };      // 나머지 앱(카카오톡·메시지·사진·전화)은 5라운드
const SPECIAL = { letter: 'S', name: '특수 단서', color: '#8a6d1f' };
const ROOM_OF = { 최종현: 'JH', 윤은재: 'EJ', 이현지: 'HJ', 박희원: 'HW', 이사랑: 'SR', 이가현: 'GH' };

// 공개 단서 — 아무도 가져갈 수 없고 전원이 언제든 읽는다.
//   동기(수료증 위조)를 받치는 카드가 이것뿐이라, 진범이 집어 숨기면 아무도 못 맞힌다.
const PUBLIC = new Set(['HQIR-26']);

// ── 구조형 단서 쪼개기 ───────────────────────────────────────────────────────
//   다이어리·성경책·일기장은 쪽마다, 휴대폰은 앱마다, 지갑은 항목마다 한 장으로 나눈다.
//   앱판은 화면 안에서 넘겨 보면 그만이지만 종이에서는 그럴 수 없다 — 안 쪼개면 카드에
//   "화살표로 페이지를 넘기세요" 같은 조작 안내만 남고 정작 일기 본문·카톡 대화가 통째로 빠진다.
const line = (a, b) => (b ? `${a}\n${b}` : a);
function explode(c) {
  const one = (extra) => ({ ...c, ...extra, src: c });
  if (c.pages?.length) {
    return c.pages.map((pg, i) => one({
      title: `${c.title} · ${pg.title || i + 1}`,
      image: pg.image || null,
      detail: pg.content || '',
      part: `${i + 1}/${c.pages.length}`,
    }));
  }
  if (c.phone?.apps?.length) {
    return c.phone.apps.map((a) => {
      const NL = '\n';
      let body = '';
      // 필드 이름을 정본과 맞춘다. 어긋나면 조용히 빈 카드가 나온다 —
      //   실제로 검색 기록(searches)이 x.q 를 찾다가 전부 '[object Object]' 로 찍혀,
      //   요힘빈 검색 같은 결정적 물증이 인쇄물에서 통째로 빠져 있었다.
      if (a.chats) {
        body = a.chats.map((ch) => `[${ch.name}${ch.deleted ? ' · 삭제된 대화방(복구됨)' : ''}]` + NL
          + (ch.messages || []).map((mm) => `${mm.who ? mm.who + ': ' : ''}${mm.text || ''}`).join(NL)
        ).join(NL + NL);
      } else if (a.searches) {
        // 검색어만으로는 '무엇을 알아냈는지'가 안 남는다. 결과 제목과 본문까지 실어야
        //   카드 한 장이 그 사람이 읽은 것을 그대로 전한다.
        body = a.searches.map((x) => [
          '· ' + (x.query || x.title || ''),
          x.title && x.query ? '  ' + x.title : '',
          x.snippet ? '  ' + x.snippet : '',
        ].filter(Boolean).join(NL)).join(NL + NL);
      } else if (a.contacts) {
        // 저장된 이름이 별명이면 그게 누구인지가 곧 관계다("종현이" → 최종현)
        body = a.contacts.map((x) => `· ${x.name || ''}`
          + (x.who && x.who !== x.name ? ` — ${x.who}` : '')).join(NL);
      } else if (a.photos) body = a.photos.map((x) => '· ' + (x.caption || x.title || '사진')).join(NL);
      const nm = a.name || a.id;
      return one({ title: `${c.title} · ${nm}`, image: null, detail: body || '(비어 있다)', part: nm, locked: LOCK_TIER[nm] || 5 });
    });
  }
  if (c.wallet?.items?.length) {
    return c.wallet.items.map((it) => one({
      title: `${c.title} · ${it.label}`, image: it.image || null,
      detail: it.detail || '', part: it.label,
    }));
  }
  if (c.handwriting?.options?.length) {
    return [one({ detail: line(c.detail, '필적 대조 대상: ' + c.handwriting.options.map((o) => o.who).join(', ')) })];
  }
  return [one({})];
}

// ── 장소 배정 + 번호 부여 ────────────────────────────────────────────────────
function buildBoard() {
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
    const units = explode(c);
    if (c.type === '감식') { bag.LB.push(...units); continue; }
    if (c.cctv?.timeline || cut.has(c.code)) { bag.CC.push(...units); continue; }
    if (c.type === '특수') { special.push(...units); continue; }
    if (c.person === '목사') { bag.PS.push(...units); continue; }
    const r = ROOM_OF[c.person];
    if (r) bag[r].push(...units); else special.push(...units);
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
      push(num[src[0]], `🔬 감식실에 내면 → <b>${num[t.code]}</b> 를 받는다`);
      continue;
    }
    for (const s of src) {
      const others = src.filter((k) => k !== s).map((k) => num[k]).filter(Boolean);
      if (!others.length) continue;
      push(num[s], `⭐ <b>${others.join(' + ')}</b> 도 함께 있으면 → 특수 <b>${num[t.code]}</b> 를 가져간다`);
    }
  }
  // 보드 전용 조합 — 앱의 열람 흔적 규칙(톡서랍 복구·필적 대조·심문)을 카드 조합으로 옮긴 것.
  for (const [target, reqs] of Object.entries(BOARD_UNLOCK)) {
    if (!num[target]) continue;                  // 덱에서 빠진 특수 카드는 건너뛴다
    const ns = reqs.map(at);
    if (ns.some((n) => !n)) continue;
    ns.forEach((n, i) => {
      const others = ns.filter((_, k) => k !== i);
      push(n, `⭐ <b>${others.join(' + ')}</b> 도 함께 있으면 → 특수 <b>${num[target]}</b> 를 가져간다`);
    });
  }
  return hints;
}

// ── 공통 CSS ─────────────────────────────────────────────────────────────────
const CSS = `
  * { box-sizing: border-box; }
  body { font-family: 'Malgun Gothic','맑은 고딕',sans-serif; margin: 0; color: #14120f;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { display: grid; grid-template-columns: repeat(3, 63mm); grid-auto-rows: 88mm;
           justify-content: center; align-content: start; page-break-after: always; }
  .card { border: 0.3mm dashed #bbb; padding: 3.2mm; overflow: hidden; position: relative;
          display: flex; flex-direction: column; }
  .no { font-size: 11pt; font-weight: 800; letter-spacing: .05em; color: #fff;
        padding: 0.8mm 2.4mm; border-radius: 1.2mm; align-self: flex-start; }
  .ct { font-size: 11pt; font-weight: 800; line-height: 1.25; margin: 1.8mm 0 1.4mm; }
  .cimg { width: 100%; height: 27mm; object-fit: contain; background: #f4f1ea; border-radius: 1mm; margin-bottom: 1.4mm; }
  .cd { font-size: 7.4pt; line-height: 1.5; white-space: pre-wrap; flex: 1; }
  .hint { margin-top: 1.4mm; padding-top: 1.2mm; border-top: 0.3mm dashed #b9a86a; }
  .hint div { font-size: 6.9pt; line-height: 1.45; color: #6b551a; }
  .lock { margin-top: 1.2mm; font-size: 6.9pt; font-weight: 700; color: #8a3b3b; }
  .qr { text-align: center; margin-bottom: 1.4mm; }
  .qr svg { width: 21mm; height: 21mm; }
  .qrl { font-size: 6.2pt; color: #6b6760; margin-top: 0.6mm; }
  .cback { align-items: center; justify-content: center; text-align: center; }
  .bnum { font-size: 30pt; font-weight: 800; letter-spacing: .04em; }
  .bplace { font-size: 8.5pt; font-weight: 700; margin-top: 3mm; opacity: .8; }
  h1 { font-size: 19pt; margin: 0 0 3mm; }
  h2 { font-size: 13pt; margin: 6mm 0 2mm; padding-bottom: 1.2mm; border-bottom: 1.2px solid #14120f; }
  .page { padding: 10mm 12mm; page-break-after: always; }
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
  .ev { border: 2px solid #b8912c; border-radius: 2mm; padding: 5mm 6mm; margin-bottom: 6mm; background: #fffdf6; }
  .evHead { font-size: 9pt; font-weight: 800; color: #8a6d1f; }
  .evNo { display: inline-block; background: #b8912c; color: #fff; border-radius: 50%;
          width: 6mm; height: 6mm; line-height: 6mm; text-align: center; margin-right: 1.5mm; }
  .evTitle { font-size: 15pt; font-weight: 800; margin: 2mm 0 2.5mm; }
  .evBody { font-size: 10pt; line-height: 1.7; }
  .evBody p { margin: 0 0 2mm; }
  .evFold { margin-top: 4mm; text-align: center; font-size: 7.4pt; color: #a09880;
            border-top: 1px dashed #c9bd9a; padding-top: 2mm; }
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
`;
const doc = (title, body) => `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>${esc(title)}</title><style>${CSS}</style></head><body>${body}</body></html>`;

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
  const deck = (list, meta) => {
    const front = (c) => `<div class="card" style="border-color:${meta.color}">
      <span class="no" style="background:${meta.color}">${esc(unitNum.get(c))}</span>
      <div class="ct">${esc(c.title)}</div>
      ${QR[c.code] ? `<div class="qr">${QR[c.code]}<div class="qrl">찍으면 이 장면이 열린다</div></div>`
        : c.image ? `<img class="cimg" src="${esc(img(c.image))}" alt="">` : ''}
      <div class="cd">${esc(c.detail || c.description || '')}</div>
      ${c.locked ? `<div class="lock">🔒 <b>${c.locked}라운드</b>부터 읽을 수 있다 (영장 ${c.locked === 4 ? '①' : '②'}).
        가져가는 것은 지금도 되지만, 그때까지는 아무도 못 읽는다.<br>
        <b>자기 휴대폰은 본인이 가져갈 수 없다.</b></div>` : ''}
      ${mine(c) ? `<div class="lock">⚖ 이 감식은 <b>${esc(mine(c))}</b> 본인의 물건이다.
        본인은 이 카드를 가져갈 수 없다 — 결과를 읽는 손과 결과가 걸린 목이 같으면
        그 카드는 증거가 아니라 증언이 된다.</div>` : ''}
      ${meta.letter === 'S' && origin(c) ? `<div class="hint"><div>${esc(origin(c))}</div></div>` : ''}
      ${hintFor(c) ? `<div class="hint">${hintFor(c).map((h) => `<div>${h}</div>`).join('')}</div>` : ''}
    </div>`;
    const back = (c) => `<div class="card cback" style="border-color:${meta.color};background:${meta.color}12">
      <div class="bnum" style="color:${meta.color}">${esc(unitNum.get(c))}</div>
      <div class="bplace" style="color:${meta.color}">${esc(meta.name)}${c.locked ? ` 🔒${c.locked}` : ''}</div></div>`;
    return `<div class="page"><h1>${esc(meta.name)} — ${list.length}장
      <span class="muted">${meta.letter}1 ~ ${meta.letter}${list.length}</span></h1>
      <p class="muted">${esc(meta.open || '조건을 채우면 이 더미에서 가져간다')} ·
      <b>뒷면(번호)이 보이게</b> 쌓고, 가져간 사람이 앞면을 읽는다.</p></div>`
      + paginate(list, front, back);
  };
  let body = '';
  for (const p of PLACES) if (bag[p.id].length) body += deck(bag[p.id], p);
  if (special.length) body += deck(special, SPECIAL);
  return { filename: '보드_단서카드.html', html: doc('보드게임 단서 카드', body) };
}

// ── 2. 인물 카드 ─────────────────────────────────────────────────────────────
function charCards() {
  const li = (a) => a.map((x) => `<li>${x}</li>`).join('');
  const body = suspects.map((s) => {
    const b = BIBLE[s.name] || {};
    return `<div class="page">
      <h1>${esc(s.name)} <span class="muted">— 공개 프로필 (모두에게 보여 주세요)</span></h1>
      <table><tr><th style="width:22%">나이 · 성별</th><td>${s.age}세 · ${esc(s.gender)}</td></tr>
        <tr><th>직책</th><td>${esc(s.occupation)}</td></tr>
        <tr><th>가족</th><td>${esc(s.family || '-')}</td></tr>
        <tr><th>알려진 것</th><td>${esc(s.notes || '')}</td></tr></table>
      <h2>자기소개</h2>
      <p>1라운드 시작 전에 위 내용을 자기 말로 소개합니다.
        <b>뒷면 내용은 절대 말하지 않습니다.</b></p></div>
    <div class="page">
      <h1>${esc(s.name)} <span class="muted">— 비밀 시나리오 (본인만)</span></h1>
      <p class="muted">${esc(b.meta || '')}</p>
      <h2>당신의 정체</h2><p>${b.identity || ''}</p>
      <h2>당신의 그날 (시간순)</h2>
      <table><tr><th style="width:20%">시각</th><th>행동</th></tr>
        ${(b.timeline || []).map(([t, x]) => `<tr><td>${esc(t)}</td><td>${x}</td></tr>`).join('')}</table>
      <h2>아는 것 / 모르는 것</h2><ul>${li(b.knows || [])}</ul>
      <h2>금지 사항 — 반드시 지키세요</h2><ul>${li(b.forbidden || [])}</ul>
      ${(b.script || []).length ? `<h2>추궁당할 때</h2>
        <table><tr><th style="width:34%">상황</th><th>대응</th></tr>
        ${b.script.map(([q, a]) => `<tr><td>${esc(q)}</td><td>${a}</td></tr>`).join('')}</table>` : ''}
    </div>`;
  }).join('');
  return { filename: '보드_인물카드.html', html: doc('보드게임 인물 카드', body) };
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
  const body = `<div class="page"><h1>사건 브리핑 <span class="muted">— 시작할 때 함께 읽으세요</span></h1>
    <p class="muted">인물 카드를 나눠 갖고 자기소개를 마친 뒤, 이 시트를 소리 내어 돌려 읽습니다.
      한 사람이 한 절씩 읽으면 됩니다.</p>${pages}
    <h2>그리고 규칙 하나</h2>
    <p>여러분 중 <b>한 명이 범인</b>입니다. 범인도 남들과 똑같이 수사에 참여하고, 거짓말을 합니다.
      나머지는 자기가 결백하다는 것만 알 뿐, 누가 범인인지는 모릅니다.</p></div>

  <div class="page"><h1>라운드 트랙</h1>
    <p class="muted">한 라운드가 끝날 때마다 말을 한 칸 옮깁니다.
      <b>2·3·4·6라운드 칸에 이벤트 카드를 얹어 두고</b>, 그 라운드가 끝나면 뒤집어 함께 읽습니다.</p>
    <div class="track">${[1,2,3,4,5,6,7].map((n) => {
      const ev = { 2: '이벤트 ①', 3: '이벤트 ②', 4: '이벤트 ③', 6: '이벤트 ④' }[n];
      return `<div class="tr${ev ? ' trEv' : ''}">
      <div class="trN">${n}</div><div class="trL">${ev || '조사 3장 → 토론 10분'}</div></div>`;
    }).join('')}</div>
    <p class="muted">7라운드가 끝나면 최종 토론 15분 → 한 명씩 범인 지목 → 진상 해설서 → 감상전 10분.</p></div>

  <div class="page"><h1>기본 규칙 <span class="muted">— 판 옆에 펴 두세요</span></h1>
    <h2>한 라운드</h2>
    <p>①<b>조사</b> — 순서대로 한 명씩, 열려 있는 장소 <b>하나</b>를 골라 그 장소의 남은 번호 중
      <b>3장</b>을 가져갑니다. 가져간 번호는 남이 못 가집니다. 내용은 자기만 읽습니다.<br>
      ②<b>토론 10분</b> — 카드를 <b>보여 주지 않고</b> 말로만 공유합니다. 거짓말해도 됩니다.<br>
      ③<b>종료</b> — 트랙의 말을 한 칸 옮기고, 이벤트 칸이면 이벤트 카드를 펼칩니다.</p>
    <h2>가져갈 수 없는 카드</h2>
    <p>· <b>자기 방은 1라운드에만</b> 들어갈 수 있습니다. 2라운드부터는 자기 방에 못 들어갑니다.<br>
      &nbsp;&nbsp;<span class="muted">자기한테 불리한 카드를 자기가 선점해 자기가 해명하는 것이
      언제나 최선이 되면, 아무도 걸리지 않고 판이 멈춥니다.</span><br>
      · <b>자기 휴대폰은 본인이 가져갈 수 없습니다.</b><br>
      · <b>자기 물건의 감식 카드는 본인이 가져갈 수 없습니다.</b> 카드에 ⚖ 로 표시돼 있습니다.</p>
    <h2>특수 단서</h2>
    <p>카드에 적힌 조합(⭐)을 손에 다 모으면, 특수 더미에서 그 번호를 <b>말없이 가져갑니다.</b>
      무엇으로 얻었는지는 특수 카드 앞면에 적혀 있습니다.</p>
    <h2>감식</h2>
    <p>🔬 표시가 있는 카드를 가진 사람은, 감식실이 열린 뒤 그 라운드의 조사로
      <b>감식실에서 해당 번호를 가져갈</b> 수 있습니다.</p></div>

  <div class="page"><h1>이벤트 카드 <span class="muted">— 잘라서 접어 두세요</span></h1>
    ${ev('①', '2라운드가 끝나면 펼친다', '2차 부검 소견 — 타살로 확정',
      `<p>정밀 부검 결과가 왔습니다. <b>심정지가 아니라 질식사</b>입니다.
        코·입 주변 압박흔과 안면 점상출혈, 그리고 기도에서 베개 솜·섬유가 검출됐습니다.</p>
      <p><b>목사님의 방 — 현장(D1~D10)이 열립니다.</b> 그 열 장을 탁자에 놓고,
        「목사님 일정표」는 <b>앞면이 보이게</b> 그 옆에 펴 둡니다 — 이 한 장은 아무도 가져갈 수 없습니다.</p>`)}
    ${ev('②', '3라운드가 끝나면 펼친다', '유품 반출 동의 · 통신 기록 영장',
      `<p>유족이 유품 반출에 동의했고, 통신 기록 영장이 나왔습니다.</p>
      <p><b>목사님의 방 — 기록(D11부터)이 열립니다.</b> 휴대폰과 일기장입니다.<br>
        그리고 <b>🔒4 가 붙은 휴대폰 카드(연락처·인터넷)를 이제 읽을 수 있습니다.</b>
        누구와 이어져 있었는지는 알 수 있지만, 무슨 말을 했는지는 아직 못 봅니다.</p>`)}
    ${ev('③', '4라운드가 끝나면 펼친다', '압수수색 영장 — 대화 내용까지',
      `<p>영장 범위가 넓어졌습니다. 복도 CCTV 원본과 대화 내용을 볼 수 있습니다.</p>
      <p><b>CCTV 열람실(V)과 감식실(L)이 열립니다.</b> 두 더미를 탁자에 놓습니다.<br>
        그리고 <b>🔒5 가 붙은 휴대폰 카드(카카오톡·메시지·사진·전화)를 이제 읽을 수 있습니다.</b></p>`)}
    ${ev('④', '6라운드가 끝나면 펼친다', '대조 열람권 — 한 번은 실물을 보일 수 있다',
      `<p>전원이 <b>대조 열람권 1장</b>을 받습니다. 이 종이를 잘라 한 사람당 한 장씩 가지세요.</p>
      <p>7라운드와 최종 토론 동안 <b>딱 한 번</b>, 자기 카드 <b>한 장</b>을
        <b>지정한 한 사람에게만</b> 실물로 보여 줄 수 있습니다. 쓰면 권리는 사라집니다.</p>
      <p class="muted">마지막 라운드에 집는 카드는 아무도 확인할 수 없어서,
        그대로 두면 "마지막에 말한 사람이 이긴다"가 됩니다. 이 한 장이 그걸 막습니다.</p>`)}
    ${[1,2,3,4,5,6].map(() => `<div class="ev"><div class="evHead">
      <span class="evNo">권</span> 대조 열람권</div>
      <div class="evTitle">한 번만 — 카드 한 장을, 한 사람에게</div>
      <div class="evBody"><p>쓴 뒤에는 이 종이를 탁자 가운데에 내려놓습니다.</p></div></div>`).join('')}
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
