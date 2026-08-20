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

// 정본 데이터는 주입받는다 — Node(문서 생성기)는 loadData.mjs 가 fs 로 비밀팩을 찾아 넘기고,
//   브라우저(웹 키트)는 @secrets 별칭으로 번들된 것을 넘긴다. loadData 를 직접 import 하면
//   node:fs 가 딸려 들어와 브라우저 번들이 깨진다.
let allClues = [], suspects = [], img = (p) => p;

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));

// 판 위 7개 방 + 판 밖 시설 2곳. 순서가 곧 카드 번호 순서다.
const PLACES = [
  ...ART_ROOMS.map((r) => ({ id: r.id, letter: r.letter, name: r.label, color: r.color, open: '처음부터' })),
  { id: 'CC', letter: 'V', name: 'CCTV 열람실', color: '#2b6b73', open: '4라운드 종료 후' },
  { id: 'LB', letter: 'L', name: '감식실', color: '#5a5a5a', open: '4라운드 종료 후 · 채취물 제출 전용' },
];
PLACES.find((p) => p.id === 'PS').open = '2라운드 종료 후';
const SPECIAL = { letter: 'S', name: '특수 단서', color: '#8a6d1f' };
const ROOM_OF = { 최종현: 'JH', 윤은재: 'EJ', 이현지: 'HJ', 박희원: 'HW', 이사랑: 'SR', 이가현: 'GH' };

// 공개 단서 — 아무도 가져갈 수 없고 전원이 언제든 읽는다.
//   동기(수료증 위조)를 받치는 카드가 이것뿐이라, 진범이 집어 숨기면 아무도 못 맞힌다.
const PUBLIC = new Set(['HQIR-26']);

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
    if (c.type === '방' || c.code === 'LSUX-91' || c.code === 'BRIF-00') continue;
    if (PUBLIC.has(c.code)) { open.push(c); continue; }
    if (c.type === '감식') { bag.LB.push(c); continue; }
    if (c.cctv?.timeline || cut.has(c.code)) { bag.CC.push(c); continue; }
    if (c.type === '특수') { special.push(c); continue; }
    if (c.person === '목사') { bag.PS.push(c); continue; }
    const r = ROOM_OF[c.person];
    if (r) bag[r].push(c); else special.push(c);
  }
  // 번호표 — 단서코드 → 판 번호(A1 …). 카드·판·조합 안내가 전부 이걸 쓴다.
  const num = {};
  for (const p of PLACES) bag[p.id].forEach((c, i) => { num[c.code] = `${p.letter}${i + 1}`; });
  special.forEach((c, i) => { num[c.code] = `${SPECIAL.letter}${i + 1}`; });
  for (const c of open) num[c.code] = '공개';
  return { bag, special, open, num };
}

// ── 조합 안내 ────────────────────────────────────────────────────────────────
//   unlockedBy 를 뒤집어 "이 카드를 가진 사람에게 무엇을 알려줄지"로 바꾼다.
//   감식(1개짜리)은 제출 안내, 특수(2개 이상)는 상대 카드 번호를 적어 준다.
function buildHints(num) {
  const hints = {};   // 단서코드 → [안내 문장]
  const push = (code, s) => { (hints[code] = hints[code] || []).push(s); };
  for (const t of allClues) {
    const src = t.unlockedBy || [];
    if (!src.length || !num[t.code]) continue;
    if (t.type === '감식' && src.length === 1) {
      push(src[0], `🔬 감식실에 내면 → <b>${num[t.code]}</b> 를 받는다`);
      continue;
    }
    for (const s of src) {
      const others = src.filter((k) => k !== s).map((k) => num[k]).filter(Boolean);
      if (!others.length) continue;
      push(s, `⭐ <b>${others.join(' + ')}</b> 도 함께 있으면 → 특수 <b>${num[t.code]}</b> 를 가져간다`);
    }
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

// ── 1. 단서 카드 ─────────────────────────────────────────────────────────────
function clueCards() {
  const { bag, special, num } = buildBoard();
  const hints = buildHints(num);
  const deck = (list, meta) => {
    const front = (c) => `<div class="card" style="border-color:${meta.color}">
      <span class="no" style="background:${meta.color}">${esc(num[c.code])}</span>
      <div class="ct">${esc(c.title)}</div>
      ${c.image ? `<img class="cimg" src="${esc(img(c.image))}" alt="">` : ''}
      <div class="cd">${esc(c.detail || c.description || '')}</div>
      ${hints[c.code] ? `<div class="hint">${hints[c.code].map((h) => `<div>${h}</div>`).join('')}</div>` : ''}
    </div>`;
    const back = (c) => `<div class="card cback" style="border-color:${meta.color};background:${meta.color}12">
      <div class="bnum" style="color:${meta.color}">${esc(num[c.code])}</div>
      <div class="bplace" style="color:${meta.color}">${esc(meta.name)}</div></div>`;
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
    ${illustratedMapHTML(counts)}
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
      <b>2·4라운드 칸에 이벤트 카드를 얹어 두고</b>, 그 라운드가 끝나면 뒤집어 함께 읽습니다.</p>
    <div class="track">${[1,2,3,4,5,6].map((n) => `<div class="tr${n===2||n===4?' trEv':''}">
      <div class="trN">${n}</div><div class="trL">${n===2?'이벤트 ①':n===4?'이벤트 ②':'조사 → 자유 조사'}</div></div>`).join('')}</div>
    <p class="muted">6라운드가 끝나면 최종 토론 15분 → 한 명씩 범인 지목 → 진상 해설서를 폅니다.</p></div>

  <div class="page"><h1>이벤트 카드 <span class="muted">— 잘라서 접어 두세요</span></h1>
    ${ev('①', '2라운드가 끝나면 펼친다', '2차 부검 소견 — 타살로 확정',
      `<p>정밀 부검 결과가 왔습니다. <b>심정지가 아니라 질식사</b>입니다.
        코·입 주변 압박흔과 안면 점상출혈, 그리고 기도에서 베개 솜·섬유가 검출됐습니다.</p>
      <p><b>목사님의 방(D)이 열립니다.</b> D 더미를 탁자에 놓고,
        「목사님 일정표」는 <b>앞면이 보이게</b> 그 옆에 펴 둡니다 — 이 한 장은 아무도 가져갈 수 없습니다.</p>`)}
    ${ev('②', '4라운드가 끝나면 펼친다', '압수수색 영장 — 기록을 볼 수 있다',
      `<p>영장이 발부됐습니다. 복도 CCTV 원본과 관계자 휴대폰을 열람할 수 있습니다.</p>
      <p><b>CCTV 열람실(V)과 감식실(L)이 열립니다.</b> 두 더미를 탁자에 놓습니다.
        지금까지 가져갔지만 못 읽던 <b>휴대폰 카드를 이제 읽을 수 있습니다.</b></p>`)}
  </div>`;
  return { filename: '보드_진행물.html', html: doc('보드게임 진행 물품', body) };
}

/**
 * data: { allClues, suspects } — 정본
 * opts.assetBase: 그림 경로 앞에 붙일 것. Node 는 출력물이 output/html/ 에 놓이므로
 *   저장소 루트까지 네 단계 올라가야 하고, 브라우저는 사이트 루트라 그대로 쓴다.
 */
export function genBoardDocs(data, opts = {}) {
  allClues = data.allClues;
  suspects = data.suspects;
  const base = opts.assetBase ?? '../../../../public';
  img = (p) => base + p;
  return [charCards(), clueCards(), placeBoard(), runSheets()];
}
