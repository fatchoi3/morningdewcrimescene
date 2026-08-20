// 보드게임판 인쇄물 — 인물 카드 · 단서 카드 · 장소 판 · 조합표 · 답안지 · 채점표.
//   앱판과 같은 정본(gameData/cast/bible)에서 파생한다. 여기서 새로 쓰는 텍스트는 규칙뿐이다.
//
//   카드 규격은 표준 카드 63x88mm — A4 한 면에 3x3=9장. 슬리브가 그대로 맞는다.
//   양면 인쇄를 쓰므로 뒷면 페이지는 행마다 좌우를 뒤집는다. 안 뒤집으면 제목과 내용이 어긋난다.
import { allClues, suspects } from './loadData.mjs';
import { BIBLE } from './bible.mjs';
import { boardMapSVG, illustratedMapHTML } from './boardMap.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
// 인쇄용 이미지 경로 — 출력물이 output/html/ 에 놓이므로 저장소 루트까지 네 단계 올라간다.
const img = (p) => '../../../../public' + p;

// ── 장소 배정 ────────────────────────────────────────────────────────────────
const PLACES = [
  { id: 'JH', name: '최종현의 방', color: '#2f6f4f', open: '처음부터' },
  { id: 'EJ', name: '윤은재의 방', color: '#3a5f9f', open: '처음부터' },
  { id: 'HJ', name: '이현지의 방', color: '#7a4f9f', open: '처음부터' },
  { id: 'HW', name: '박희원의 방', color: '#8a5a2b', open: '처음부터' },
  { id: 'SR', name: '이사랑의 방', color: '#a32d2d', open: '처음부터' },
  { id: 'GH', name: '이가현의 방', color: '#b07d1a', open: '처음부터' },
  { id: 'PS', name: '목사님의 방', color: '#1f1f1f', open: '2라운드 종료 후' },
  { id: 'CC', name: 'CCTV 열람실', color: '#2b6b73', open: '4라운드 종료 후' },
  { id: 'LB', name: '감식실', color: '#5a5a5a', open: '4라운드 종료 후 · 채취물 제출 전용' },
];
const ROOM_OF = { 최종현: 'JH', 윤은재: 'EJ', 이현지: 'HJ', 박희원: 'HW', 이사랑: 'SR', 이가현: 'GH' };

// 공개 단서 — 아무도 가져갈 수 없고 전원이 언제든 읽는다.
//   독점 규칙에서 '그 한 장이 없으면 아무도 못 맞히는' 단서는 진범이 집어 숨기면 끝이다.
//   목사님 일정표는 동기(20점)를 받치는 유일한 카드였다. 면담 5건과 각자의 반응만 적혀 있어
//   정답을 흘리지도 않는다 — 오히려 진범 칸이 "평소와 같은 모습"이라 수사의 출발점으로 맞다.
const PUBLIC = new Set(['HQIR-26']);

// 앱의 방 배치와 같은 규칙(person + type)으로 가른다. 별도 표를 두면 정본과 어긋난다.
function buildPlaces() {
  // CCTV 컷은 열람대 단서 안에 박혀 있다 — 하위 코드를 먼저 모아 두고 그 방으로 보낸다.
  const cut = new Set();
  for (const c of allClues) {
    for (const t of (c.cctv?.timeline || [])) {
      for (const p of (t.people || [])) if (p.unlocks) cut.add(p.unlocks);
    }
  }
  const bag = Object.fromEntries(PLACES.map((p) => [p.id, []]));
  const special = [];
  const open = [];
  for (const c of allClues) {
    if (c.type === '방' || c.code === 'LSUX-91') continue;   // 방 입구 QR·게임 설명서는 앱판 전용
    if (PUBLIC.has(c.code)) { open.push(c); continue; }
    if (c.type === '감식') { bag.LB.push(c); continue; }
    if (c.cctv?.timeline || cut.has(c.code)) { bag.CC.push(c); continue; }
    if (c.type === '특수') { special.push(c); continue; }    // 조합·추궁으로만 나오므로 장소가 없다
    if (c.person === '목사') { bag.PS.push(c); continue; }
    const r = ROOM_OF[c.person];
    if (r) bag[r].push(c); else special.push(c);             // 공용(브리핑)은 진행자 보관
  }
  return { bag, special, open };
}

// ── 공통 CSS ─────────────────────────────────────────────────────────────────
const CSS = `
  * { box-sizing: border-box; }
  body { font-family: 'Malgun Gothic','맑은 고딕',sans-serif; margin: 0; color: #14120f;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { display: grid; grid-template-columns: repeat(3, 63mm); grid-auto-rows: 88mm;
           justify-content: center; align-content: start; page-break-after: always; }
  .card { border: 0.3mm dashed #bbb; padding: 3.4mm; overflow: hidden; position: relative;
          display: flex; flex-direction: column; }
  .tag { font-size: 6.6pt; font-weight: 800; letter-spacing: .04em; color: #fff;
         padding: 0.7mm 2mm; border-radius: 1mm; align-self: flex-start; }
  .code { position: absolute; right: 3mm; bottom: 2.4mm; font-size: 6pt; color: #9a958c; letter-spacing: .04em; }
  .ct { font-size: 12pt; font-weight: 800; line-height: 1.25; margin: 2.4mm 0 1.6mm; }
  .cimg { width: 100%; height: 34mm; object-fit: contain; background: #f4f1ea; border-radius: 1mm; margin-bottom: 1.6mm; }
  .cd { font-size: 7.8pt; line-height: 1.55; white-space: pre-wrap; flex: 1; }
  .cface { align-items: center; justify-content: center; text-align: center; }
  .cface .ct { font-size: 13.5pt; margin: 3mm 0 0; }
  .cface .pl { font-size: 8pt; font-weight: 700; margin-top: 2mm; }
  /* 뒷면 — 펼쳐 뒀을 때 보이는 면. 번호만 크게 둬서 멀리서도 집어낼 수 있게 한다. */
  .cback { align-items: center; justify-content: center; text-align: center; }
  .bnum { font-size: 20pt; font-weight: 800; letter-spacing: .06em; }
  .bplace { font-size: 8.5pt; font-weight: 700; margin-top: 3mm; opacity: .75; }
  h1 { font-size: 19pt; margin: 0 0 3mm; }
  h2 { font-size: 13pt; margin: 6mm 0 2mm; padding-bottom: 1.2mm; border-bottom: 1.2px solid #14120f; }
  .page { padding: 10mm 12mm; page-break-after: always; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  th, td { border: 1px solid #333; padding: 2mm 2.4mm; vertical-align: top; text-align: left; }
  th { background: #efeae0; font-weight: 800; }
  .muted { color: #6b6760; font-size: 8.6pt; }
  ul { margin: 1mm 0 0 5mm; padding: 0; font-size: 9.5pt; line-height: 1.6; }
  .blank { display: inline-block; min-width: 40mm; border-bottom: 1px solid #888; }
  /* 현장 전체도 — 인쇄 폭을 꽉 채운다 */
  .map { margin: 4mm 0; }
  .map svg { width: 100%; height: auto; }
  /* 그림 판 — 그림 위에 이름표를 얹는다. 그림 해상도가 낮아도 글자는 벡터라 선명하다. */
  .art { position: relative; margin: 4mm 0; }
  .art img { width: 100%; height: auto; display: block; border-radius: 2mm; }
  .art .spot { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; }
  .art .pin { color: #fff; font-size: 9pt; font-weight: 800; padding: 1.1mm 2.6mm;
              border-radius: 1.4mm; box-shadow: 0 0.4mm 1.2mm #0006; }
  .art .note { background: #fffffff2; font-size: 7.4pt; font-weight: 700;
               padding: 0.7mm 1.8mm; border-radius: 1mm; border: 0.4mm solid; }
  /* 촬영 범위 / 사각지대 띠 — 그림 위에 얹는다 */
  .art .zone { position: absolute; border-radius: 1mm; pointer-events: none; }
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
  const { bag } = buildPlaces();
  let body = '';
  for (const p of PLACES) {
    const list = bag[p.id];
    if (!list.length) continue;
    // 앞면 = 내용 전부(이름·그림·설명). 뒷면 = 번호만 — 펼쳐 둘 때 보이는 면이다.
    const front = (c) => `<div class="card" style="border-color:${p.color}">
      <span class="tag" style="background:${p.color}">${esc(c.title)}</span>
      ${c.image ? `<img class="cimg" src="${esc(img(c.image))}" alt="">` : ''}
      <div class="cd">${esc(c.detail || c.description || '')}</div>
      <div class="code">${esc(c.code)}</div></div>`;
    const back = (c) => `<div class="card cback" style="border-color:${p.color};background:${p.color}12">
      <div class="bnum" style="color:${p.color}">${esc(c.code)}</div>
      <div class="bplace" style="color:${p.color}">${esc(p.name)}</div></div>`;
    body += `<div class="page"><h1>${esc(p.name)} — 단서 ${list.length}장</h1>
      <p class="muted">개방: ${esc(p.open)} · 테두리색으로 장소를 구분한다.
      <b>뒷면(번호)이 보이게</b> 펼쳐 두고, 가져간 사람이 앞면을 읽는다.</p></div>`;
    body += paginate(list, front, back);
  }
  return { filename: '보드_단서카드.html', html: doc('보드게임 단서 카드', body) };
}

// ── 2. 인물 카드 ─────────────────────────────────────────────────────────────
//   앞면은 전원에게 보여 주는 프로필(gameData 의 notes 그대로), 뒷면은 본인만 보는 시나리오(bible).
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

// ── 2-b. 공개 단서 ───────────────────────────────────────────────────────────
//   장소 판 옆에 펴 두는 큰 시트. 카드가 아니라 게시물이라 A4 한 면을 그대로 쓴다.
function openClues() {
  const { open } = buildPlaces();
  const body = open.map((c) => {
    const rows = (c.schedule?.entries || [])
      .map((e) => `<tr><td>${esc(e.time)}</td><td>${esc(e.person)}</td><td>${esc(e.title)}</td><td>${esc(e.content)}</td></tr>`).join('');
    return `<div class="page" style="border-top:8mm solid #1f1f1f">
      <h1>${esc(c.title)} <span class="muted">— 공개 단서</span></h1>
      <p class="muted">목사님의 방이 열릴 때 장소 판 옆에 펴 둔다.
        <b>아무도 가져갈 수 없고, 전원이 언제든 읽는다.</b></p>
      ${c.image ? `<img src="${esc(img(c.image))}" alt="" style="max-width:100%;max-height:70mm;object-fit:contain">` : ''}
      ${rows ? `<table><tr><th style="width:16%">시각</th><th style="width:20%">상대</th>
        <th style="width:22%">내용</th><th>목격된 것</th></tr>${rows}</table>`
        : `<p>${esc(c.detail || c.description || '')}</p>`}
      <h2>이 단서가 여는 질문</h2>
      <p>목사님은 사건 전날 다섯 명을 따로 불렀다. <b>무슨 이야기를 했는가?</b>
        면담 내용은 이 표에 없다 — 당사자에게 직접 물어야 한다.</p>
    </div>`;
  }).join('');
  return { filename: '보드_공개단서.html', html: doc('보드게임 공개 단서', body) };
}

// ── 3. 장소 판 ───────────────────────────────────────────────────────────────
function placeBoards() {
  const { bag, open } = buildPlaces();
  const counts = Object.fromEntries(Object.entries(bag).map(([k, v]) => [k, v.length]));
  // 첫 장이 실제로 탁자에 까는 판이다. 뒤따르는 장소별 페이지는 수납 목록(진행자용).
  // 1면은 실제로 탁자에 까는 판(그림), 2면은 같은 배치의 도식판(흑백 인쇄·수정용 예비).
  const overview = `<div class="page mapPage"><h1>사건 현장 — 숙소 2층</h1>
    <p class="muted">탁자 가운데에 까는 판이다. <b>A3 가로</b> 권장.
      카드는 판 위에 올리지 않고 장소별로 옆에 쌓는다 — 판은 위치와 이동을 보는 용도다.</p>
    ${illustratedMapHTML(counts)}
    <p class="muted">복도 끝 CCTV는 <b>복도만</b> 비춘다. 방문 앞은 사각이라
      누가 방에 들어갔는지는 찍히지 않는다 — 이 사건의 전제다.</p></div>
    <div class="page mapPage"><h1>사건 현장 — 도식판 <span class="muted">(예비)</span></h1>
    <p class="muted">그림 없이 흑백으로 뽑을 때 쓴다. 방 위치는 위 판과 같다.</p>
    <div class="map">${boardMapSVG(counts)}</div></div>`;
  const body = overview + PLACES.map((p) => `<div class="page" style="border-top:8mm solid ${p.color}">
    <h1>${esc(p.name)}</h1>
    <p class="muted">개방 시점: <b>${esc(p.open)}</b> · 단서 ${bag[p.id].length}장</p>
    <p>이 판 위에 아래 카드를 <b>제목이 보이게</b> 펼쳐 둔다. 방문한 사람이 2장을 가져간다.</p>
    ${p.id === 'PS' && open.length ? `<p class="muted">이 방에는 공개 단서가 따로 있다 —
      <b>${open.map((c) => esc(c.title)).join(', ')}</b>. 판 옆에 펴 두고 아무도 가져가지 않는다.</p>` : ''}
    <table><tr><th style="width:16%">코드</th><th>단서</th><th style="width:20%">귀속</th></tr>
      ${bag[p.id].map((c) => `<tr><td>${esc(c.code)}</td><td>${esc(c.title)}</td><td>${esc(c.person)}</td></tr>`).join('')}
    </table></div>`).join('');
  return { filename: '보드_장소판.html', html: doc('보드게임 장소 판', body) };
}

// ── 4. 조합표(진행자용) ──────────────────────────────────────────────────────
function comboSheet() {
  const t = Object.fromEntries(allClues.map((c) => [c.code, c.title]));
  const lab = allClues.filter((c) => c.type === '감식' && c.unlockedBy?.length);
  const comb = allClues.filter((c) => c.type === '특수' && c.unlockedBy?.length);
  const rest = allClues.filter((c) => c.type === '특수' && !c.unlockedBy?.length);
  const row = (c) => `<tr><td>${esc(c.unlockedBy.map((k) => t[k] || k).join('  +  '))}</td>
    <td><b>${esc(c.title)}</b></td><td>${esc(c.code)}</td></tr>`;
  const body = `<div class="page"><h1>조합 · 감식 표 <span class="muted">— 진행자용</span></h1>
    <h2>감식 (채취물 제출 → 다음 라운드에 결과)</h2>
    <table><tr><th style="width:46%">제출할 물건</th><th>받는 결과</th><th style="width:16%">코드</th></tr>
      ${lab.map(row).join('')}</table>
    <h2>조합 (필요한 카드를 공개 선언)</h2>
    <table><tr><th style="width:46%">필요한 단서</th><th>얻는 특수 단서</th><th style="width:16%">코드</th></tr>
      ${comb.map(row).join('')}</table>
    <h2>그 밖의 특수 단서</h2>
    <p class="muted">이벤트·추궁 성공·휴대폰 잠금 해제로 나온다. 진행자가 판단해 내어 준다.</p>
    <table><tr><th>특수 단서</th><th style="width:16%">코드</th></tr>
      ${rest.map((c) => `<tr><td>${esc(c.title)}</td><td>${esc(c.code)}</td></tr>`).join('')}</table>
  </div>`;
  return { filename: '보드_조합표.html', html: doc('보드게임 조합·감식 표', body) };
}

// ── 5. 답안지 ────────────────────────────────────────────────────────────────
function answerSheet() {
  const names = suspects.map((s) => s.name);
  const body = `<div class="page"><h1>답안지</h1>
    <p class="muted">이름 <span class="blank"></span> · 맡은 인물 <span class="blank"></span></p>
    <table>
      <tr><th style="width:26%">범인은 누구인가 <span class="muted">(40점)</span></th>
        <td>${names.map((n) => `&#9744; ${esc(n)}`).join('&nbsp;&nbsp;&nbsp;')}</td></tr>
      <tr><th>어떻게 죽였는가 <span class="muted">(25점)</span></th><td style="height:34mm"></td></tr>
      <tr><th>왜 죽였는가 <span class="muted">(20점)</span></th><td style="height:30mm"></td></tr>
      <tr><th>공범이 있는가 <span class="muted">(15점)</span></th><td style="height:26mm"></td></tr>
      <tr><th>근거가 된 단서</th><td style="height:26mm"></td></tr>
    </table>
    <p class="muted">작성 시간 5분. 이때부터 대화 금지 — 다 쓰면 함께 펼친다.</p></div>`;
  return { filename: '보드_답안지.html', html: doc('보드게임 답안지', body) };
}

// ── 6. 채점표(진행자용 · 진상 포함) ──────────────────────────────────────────
function scoreKey() {
  const roleIs = (s, k) => (BIBLE[s.name]?.role || '').startsWith(k);
  const body = `<div class="page"><h1>채점표 <span class="muted">— 진행자용 · 참가자에게 보이지 마세요</span></h1>
    <h2>정답</h2>
    <table><tr><th style="width:16%">항목</th><th>정답</th><th style="width:12%">배점</th></tr>
      ${suspects.filter((s) => roleIs(s, '주범')).map((s) =>
        `<tr><td>범인</td><td><b>${esc(s.name)}</b> — ${esc(BIBLE[s.name].role)}</td><td>40</td></tr>`).join('')}
      <tr><td>수법</td><td>당일 아침 협심증 응급약(설하정)을 비타민C로 바꿔치기해 자연사를 유도했고,
        실패한 것으로 보이자 13:15~17 방에 들어가 <b>베개로 질식시켜</b> 살해했다.</td><td>25</td></tr>
      <tr><td>동기</td><td>신학교 수료증을 위조해 전도사가 되었고, 목사가 이를 의심해
        수련회 후 교단에 확인하겠다고 통보했다.</td><td>20</td></tr>
      ${suspects.filter((s) => roleIs(s, '공범')).map((s) =>
        `<tr><td>공범</td><td><b>${esc(s.name)}</b> — ${esc(BIBLE[s.name].role)}.
          찬조금 유용이 드러날 재정 점검을 미루려 했다. 살해 의도는 없었다.</td><td>15</td></tr>`).join('')}
    </table>
    <h2>승패</h2>
    <ul>
      <li><b>시민 승리</b> — 6명 중 4명 이상이 범인을 정확히 지목.</li>
      <li><b>진범 승리</b> — 그 외 전부.</li>
      <li><b>공범 특별 승리</b> — 진범이 잡혀도 공범의 행위가 답안에서 지목되지 않았다면 공범은 따로 살아남는다.</li>
    </ul>
    <h2>흔한 오답</h2>
    <ul>
      <li>요힘빈을 사인으로 적는다 — 그건 <b>미수</b>다. 직접 사인은 질식이다.</li>
      <li>수면제(졸피뎀)를 사인으로 적는다 — 관계없다. 이현지의 별건이다.</li>
      <li>공범을 주범으로 적는다 — 라벨 교체는 살해 의도가 아니다.</li>
    </ul></div>`;
  return { filename: '보드_채점표.html', html: doc('보드게임 채점표', body) };
}

export function genBoardDocs() {
  return [charCards(), clueCards(), openClues(), placeBoards(), comboSheet(), answerSheet(), scoreKey()];
}
