// ─────────────────────────────────────────────────────────────────────────────
// 야간조 인쇄물 ① — 단서 카드 109장
//
//   표준 카드 63×88mm · A4 한 면에 3×3 = 9장. 시중 슬리브가 그대로 맞는다.
//   양면 인쇄(**긴 쪽 넘김**)를 쓰므로 뒷면 면은 **행마다 좌우를 뒤집는다** —
//   안 뒤집으면 번호와 내용이 다른 종이에 찍힌다.
//
//   ── 뒷면에 무엇을 적는가 ──────────────────────────────────────────────────
//   · 보통 카드 — 번호 + 더미 이름 + **앞면과 같은 표시**(🔒 ⚖ 🔬 ⭐ 🔑).
//     준비할 때 폰 일곱 장을 빼 두었다가 이벤트 ② 에 섞어 넣어야 하고(룰북 §3),
//     표시가 뒷면에 없으면 109장을 한 장씩 뒤집어 봐야 한다.
//   · **V 카드만 다르다 — 카메라 기호와 시간대뿐이다.** 번호도 적지 않는다.
//     룰북 §3-b 가 「V 카드 뒷면에 누가 찍혔는지 적지 않는다」로 못 박은 규칙이고,
//     번호(V1…V14)는 시각순이라 번호만으로도 시간대가 읽혀 같은 문이 열린다.
//     문면은 카드.md 의 `- **뒷면** — G-1 · 22:3x` 줄을 그대로 쓴다.
//
//   ── 파일명 ────────────────────────────────────────────────────────────────
//   `보드_` 로 시작해야 한다. build.mjs 의 marginFor() 가 그 접두사에만 여백 0 을 준다 —
//   `야간조_보드_…` 로 지으면 14mm 가 한 번 더 먹어 카드가 63×88mm 로 안 나온다.
// ─────────────────────────────────────────────────────────────────────────────
import { esc, inline, md2html, docShell, pickCards } from './mdhtml.mjs';

/* ── 더미 ────────────────────────────────────────────────────────────────── */
//   글자는 보드 칸 글자 그대로다(dp-mapping.md §0 — A~F 가 cast S1~S6 과 1:1).
const DECK = {
  A: { name: '서장현의 칸', color: '#3a6ea5' },
  B: { name: '차민우의 칸', color: '#2f6b45' },
  C: { name: '오정숙의 칸', color: '#8a5a2b' },
  D: { name: '흐엉의 칸', color: '#7a3f7a' },
  E: { name: '윤도경의 칸', color: '#2a6b74' },
  F: { name: '임기석의 칸', color: '#8a3b3b' },
  X: { name: '현장 · C통로', color: '#2f2b24' },
  P: { name: '조장의 칸', color: '#4a4436' },
  W: { name: '서쪽 · 휴게실', color: '#6b6115' },
  N: { name: '충전소 · 배터리실', color: '#5a5a2b' },
  J: { name: '동쪽 · 갈림', color: '#3f5a2b' },
  U: { name: '2층 · 관제실', color: '#4a4a7a' },
  T: { name: '조장 태블릿', color: '#5a3f8a' },
  V: { name: '카메라 열람', color: '#265a66' },
  L: { name: '감식 결과', color: '#265a66' },
  S: { name: '특수 단서', color: '#b8912c' },
  Q: { name: '기록 대조', color: '#7a5a3a' },
  공개: { name: '공개 게시물', color: '#8a7a45' },
};
const UNKNOWN = { name: '', color: '#6b6760' };

const deckOf = (no) => (String(no || '').match(/^(공개|[A-Z])/) || [])[1] || '';
const metaOf = (no) => DECK[deckOf(no)] || UNKNOWN;

/* ── 표시 ────────────────────────────────────────────────────────────────── */
//   룰북 §3-b 의 「카드에 붙는 표시」. 앞면과 뒷면에 같은 것이 찍힌다.
const MARK = {
  // 🔒 는 「잠겼다」가 아니라 **「이벤트 ② 뒤에 더미에 섞는다」** 다(룰북 §3-b 표시 표).
  // 「잠김」으로 찍으면 B5·F5 처럼 본문이 「잠금이 걸려 있지 않다」고 적은 카드가
  // 자기 배지와 정면으로 어긋난다. 룰북 범례의 글자를 그대로 쓴다.
  '🔒': { label: '이벤트 ② 뒤', cls: 'bgLock' },
  '⚖': { label: '본인 낭독 불가', cls: 'bgLaw' },
  '🔬': { label: '감식실', cls: 'bgLab' },
  '⭐': { label: '조합', cls: 'bgStar' },
  '🔑': { label: '열쇠', cls: 'bgKey' },
  '▲': { label: '밝힘', cls: 'bgTell' },
  '📱': { label: '기기', cls: 'bgLock' },
};
const MARK_RE = /[🔒⚖🔬⭐🔑▲📱]/gu;

// 종이에 찍지 않는 줄. 카드.md 는 제작 주석을 세 가지 표기로 쓴다.
const DROP_LABEL = /^(근거|출처|제작|정본|정본 대조|참고)/;

/* ── 카드 한 장 정규화 ───────────────────────────────────────────────────── */
//   파서와 생성기가 다른 파일이라 필드 이름이 어긋날 수 있다. 여기 한 곳에서 받아 준다.
function norm(raw) {
  const no = String(raw.no ?? raw.num ?? raw.number ?? raw.id ?? '').trim();
  const title = String(raw.title ?? raw.name ?? '').trim();

  let marks = raw.markers ?? raw.marks ?? raw.marker ?? '';
  if (!Array.isArray(marks)) marks = String(marks || '').match(MARK_RE) || [];
  // 제목 뒤에 표시가 붙어 오는 경우(### A1 · 순찰 일지 클립보드  ⭐)도 받는다.
  const inTitle = title.match(MARK_RE) || [];
  marks = [...new Set([...marks, ...inTitle])].filter((m) => MARK[m]);

  const body = Array.isArray(raw.body) ? raw.body.join('\n\n')
    : String(raw.body ?? raw.text ?? raw.front ?? raw.detail ?? '');

  // parseCards.mjs 는 `lines`(원문 그대로의 줄)와 `linesMeta`({label, value, text})를
  // 둘 다 준다. 쪼개 놓은 쪽을 먼저 쓴다 — 여기서 같은 정규식을 또 돌릴 이유가 없다.
  const rawLines = raw.linesMeta ?? raw.lines ?? raw.bottom ?? raw.notes ?? raw.hints ?? [];
  const lines = [];
  const unquote = (s) => String(s || '').replace(/`/g, '').trim();
  let back = unquote(raw.back ?? raw.backText ?? raw['뒷면']);
  for (const l of (Array.isArray(rawLines) ? rawLines : [])) {
    let label;
    let text;
    if (l && typeof l === 'object') {
      label = String(l.label ?? l.kind ?? l.key ?? '').trim();
      // `text` 는 **줄 전체**다(`**QR** — 찍으면 …`). 이름표를 떼어 둔 `value` 가 있으면
      // 그쪽을 쓴다 — 아니면 「QR — **QR** — 찍으면 …」이 되어 이름표가 두 번 찍힌다.
      text = String((label ? l.value : undefined) ?? l.value ?? l.text ?? l.body ?? '').trim();
    } else {
      // `- **QR** — 찍으면 …` 꼴의 날 문자열도 받는다.
      const m = String(l || '').replace(/^\s*[-*]\s*/, '').match(/^\*\*(.+?)\*\*\s*(?:—|-|:)?\s*(.*)$/s);
      label = m ? m[1].trim() : '';
      text = m ? m[2].trim() : String(l || '').trim();
    }
    const bare = label.replace(MARK_RE, '').trim();
    if (DROP_LABEL.test(bare)) continue;              // 제작 주석은 종이에 안 간다
    if (bare === '뒷면') { if (!back) back = text.replace(/`/g, '').trim(); continue; }
    lines.push({ label, text });
  }

  return {
    no,
    title: title.replace(MARK_RE, '').replace(/\s*·\s*$/, '').trim(),
    marks,
    body,
    lines,
    back,
    place: String(raw.place ?? raw.placeTitle ?? raw.section ?? '').trim(),
  };
}

/* ── 본문 조판 ───────────────────────────────────────────────────────────── */
//   빈 줄이 문단, 홑줄바꿈은 줄바꿈이다. V 카드의 통행 로그가 홑줄바꿈으로 적혀 있어
//   그것을 문단으로 뭉개면 「23:03 동 · 사람」 여덟 줄이 한 덩이가 된다.
//   블록 렌더러를 쓰는 이유는 표 때문이다 — 공개② 「그날 밤 작업 배치표」가 카드 본문
//   안의 마크다운 표이고, 「동쪽 1/3에 이름이 하나뿐이다」가 그 표에서만 보인다.
//   문단으로 흘리면 `|---|---:|` 이 그대로 인쇄된다.
const bodyHtml = (text) => md2html(text);

const markBadges = (marks) => (marks.length
  ? `<div class="bgs">${marks.map((m) =>
      `<span class="bg ${MARK[m].cls}"><i>${m}</i>${esc(MARK[m].label)}</span>`).join('')}</div>`
  : '');

/* ── QR ──────────────────────────────────────────────────────────────────── */
//   생성기는 동기 함수이고 fs 도 네트워크도 쓰지 않는다(브라우저에서도 돈다).
//   그래서 QR 은 **미리 그려서** data.qr 로 받는다 —
//     data.qr[code] = await QRCode.toString(url, { type: 'svg', margin: 0 })
//   없으면 카드에 주소를 글자로 적어 둔다. 빈 자리로 두면 인쇄가 빠진 것인지
//   원래 QR 이 없는 카드인지 구별이 안 된다.
function qrBlock(card, data) {
  const code = data?.codeOf?.[card.no];
  const wantsQr = card.lines.some((l) => /QR/.test(l.label)) || card.marks.includes('🔒');
  if (!wantsQr) return '';
  if (!code) {
    return '<div class="noqr">이 카드의 단서 코드가 사상표에 없습니다 — QR 을 넣지 못했습니다</div>';
  }
  const svg = data?.qr?.[code];
  if (svg) return `<div class="qr">${svg}<div class="qrl">${esc(code)}</div></div>`;
  const url = qrUrl(card, code, data);
  return `<div class="noqr">QR 자리 — <code>${esc(url)}</code></div>`;
}

function qrUrl(card, code, data) {
  if (typeof data?.qrUrl === 'function') return data.qrUrl(code, card);
  const base = String(data?.siteUrl || '').replace(/\/$/, '');
  const path = deckOf(card.no) === 'V' ? 'yaganjo-cctv' : 'yaganjo-clue';
  return `${base}/${path}#${code}`;
}

/* ── 앞면 · 뒷면 ─────────────────────────────────────────────────────────── */
function front(card, data) {
  const m = metaOf(card.no);
  const hint = card.lines.length
    ? `<div class="hint">${card.lines.map((l) =>
        `<div>${l.label ? `<b>${inline(l.label)}</b> — ` : ''}${inline(l.text)}</div>`).join('')}</div>`
    : '';
  return `<div class="card" style="border-color:${m.color}">
    <div class="chd"><span class="no" style="background:${m.color}">${esc(card.no)}</span>${markBadges(card.marks)}</div>
    <div class="ct">${inline(card.title)}</div>
    <div class="cd">${bodyHtml(card.body)}</div>
    ${qrBlock(card, data)}${hint}</div>`;
}

function back(card) {
  const m = metaOf(card.no);
  // V 카드 — 카메라 기호와 시간대뿐이다. 번호도 이름도 적지 않는다.
  if (deckOf(card.no) === 'V') {
    return `<div class="card cback" style="border-color:${m.color};background:${m.color}10">
      <div class="bcam">🎥</div>
      <div class="bband">${esc(card.back || '카메라')}</div>
      <div class="bdotl">이 더미는 뒷면에 사람을 적지 않습니다</div></div>`;
  }
  return `<div class="card cback" style="border-color:${m.color};background:${m.color}10">
    <div class="bnum" style="color:${m.color}">${esc(card.no)}</div>
    <div class="bplace">${esc(m.name)}</div>
    ${markBadges(card.marks)}</div>`;
}

/* ── 3×3 쪽 나누기 ──────────────────────────────────────────────────────── */
//   뒷면은 행마다 좌우를 뒤집는다. 모자란 줄은 빈 칸으로 세 칸을 채운 뒤에 뒤집어야
//   그 줄만 좌우가 어긋나지 않는다.
function sheets(cards, data, head) {
  let out = '';
  for (let i = 0; i < cards.length; i += 9) {
    const pageCards = cards.slice(i, i + 9);
    const thin = pageCards.length <= 3
      ? '<p class="sparseNote">이 면에서는 카드가 <b>' + pageCards.length
        + '장</b>만 나옵니다. 빈 종이가 아닙니다 — <b>버리지 마세요.</b></p>'
      : '';
    out += `<div class="sheetPage">${i === 0 ? head : ''}`
      + `<div class="sheet">${pageCards.map((c) => front(c, data)).join('')}</div>${thin}</div>`;
    const mirrored = [];
    for (let r = 0; r < pageCards.length; r += 3) {
      const row = pageCards.slice(r, r + 3);
      while (row.length < 3) row.push(null);
      mirrored.push(...row.reverse());
    }
    out += `<div class="sheetPage"><div class="sheet">${
      mirrored.map((c) => (c ? back(c) : '<div class="cardGap"></div>')).join('')}</div>${thin}</div>`;
  }
  return out;
}

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const CARD_CSS = `
.sheetPage { page-break-after: always; }
.sheetPage:last-of-type { page-break-after: auto; }
.sheet { display: grid; grid-template-columns: repeat(3, 63mm); grid-auto-rows: 88mm;
         justify-content: center; align-content: start; padding: 3mm 0 0; }
.cardGap { }
/* --cf 는 넘치는 카드에만 인쇄 직전에 1 미만으로 정해진다(CARD_FIT). */
.card { --cf: 1; border: 0.35mm dashed #bbb; padding: 3.2mm; overflow: hidden; position: relative;
        display: flex; flex-direction: column; background: #fff; }
.chd { display: flex; align-items: flex-start; gap: 1.2mm; }
.no { font-size: 11pt; font-weight: 800; letter-spacing: .04em; color: #fff;
      padding: 0.8mm 2.4mm; border-radius: 1.2mm; align-self: flex-start; }
.bgs { display: flex; gap: 0.9mm; margin-left: auto; flex-wrap: wrap; justify-content: flex-end; }
.bg { display: flex; align-items: center; gap: 0.7mm; font-size: 6.6pt; font-weight: 800;
      padding: 0.5mm 1.4mm; border-radius: 1.2mm; border: 0.35mm solid; white-space: nowrap;
      line-height: 1.1; }
.bg i { font-style: normal; font-size: 9.6pt; line-height: 1; }
.bgLock { color: #8a3b3b; border-color: #c98a8a; background: #fdf0ee; }
.bgLaw  { color: #5a3f8a; border-color: #a893c9; background: #f3eefa; }
.bgLab  { color: #265a66; border-color: #85b3bd; background: #edf6f8; }
.bgStar { color: #7d6116; border-color: #cfae5e; background: #fdf7e6; }
.bgKey  { color: #7a5a1a; border-color: #cbb07a; background: #fbf5e8; }
.bgTell { color: #2f6b45; border-color: #8fbfa2; background: #eef7f1; }
.ct { font-size: calc(10.6pt * var(--cf)); font-weight: 800; line-height: 1.25;
      margin: calc(1.8mm * var(--cf)) 0 calc(1.4mm * var(--cf)); }
.cd { font-size: calc(7.3pt * var(--cf)); line-height: 1.5; flex: 1; }
.cd p { margin: 0 0 calc(1.2mm * var(--cf)); }
.cd p:last-child { margin-bottom: 0; }
.cd code { font-size: calc(6.8pt * var(--cf)); padding: 0 2px; }
/* 카드 안의 표 — 63mm 폭에 들어가야 한다(공개② 작업 배치표). */
.cd .mdtable { margin: calc(1mm * var(--cf)) 0; }
.cd .mdtable th, .cd .mdtable td { font-size: calc(6.4pt * var(--cf)); padding: 0.5mm 1mm;
                                   line-height: 1.35; }
.cd .mdlist { margin: 0 0 calc(1mm * var(--cf)) 3.4mm; font-size: calc(7.3pt * var(--cf));
              line-height: 1.45; }
.cd .mdq { margin: calc(1mm * var(--cf)) 0; padding: 0.8mm 1.4mm; border-left-width: 0.5mm;
           font-size: calc(7pt * var(--cf)); }
.cd .mdhr { margin: calc(1.2mm * var(--cf)) 0; }
.hint { margin-top: calc(1.4mm * var(--cf)); padding-top: calc(1.2mm * var(--cf));
        border-top: 0.3mm dashed #b9a86a; }
.hint div { font-size: calc(6.8pt * var(--cf)); line-height: 1.45; color: #6b551a; }
.hint b { color: #5a4712; }
.qr { text-align: center; margin: calc(1.2mm * var(--cf)) 0 calc(1mm * var(--cf)); }
.qr svg { width: calc(20mm * var(--cf)); height: calc(20mm * var(--cf)); }
.qrl { font-size: 6pt; color: #6b6760; margin-top: 0.5mm; letter-spacing: .06em; }
.noqr { margin: 1.2mm 0 0.6mm; padding: 1mm 1.6mm; font-size: 6.2pt; color: #6b6760;
        background: #f4f1ea; border: 0.25mm dashed #bdb6a6; border-radius: 1mm; text-align: center; }
.noqr code { font-size: 5.8pt; white-space: normal; word-break: break-all; }
/* 뒷면 */
.cback { align-items: center; justify-content: center; text-align: center; }
.cback .bgs { margin: 3mm 0 0; justify-content: center; }
.bnum { font-size: 30pt; font-weight: 800; letter-spacing: .04em; }
.bplace { font-size: 8.4pt; font-weight: 700; margin-top: 2.5mm; color: #4a4436; }
.bcam { font-size: 26pt; line-height: 1; }
.bband { font-size: 12pt; font-weight: 800; margin-top: 4mm; letter-spacing: .04em;
         font-family: Consolas, monospace; color: #265a66; }
.bdotl { font-size: 6pt; color: #8a8375; margin-top: 3mm; line-height: 1.3; }
/* 아홉 칸이 안 차는 면 — 빈 종이로 알고 버리는 것을 막는다. */
.sparseNote { margin: 12mm auto 0; width: 189mm; text-align: center; font-size: 12pt;
              font-weight: 700; color: #6b4a1e; background: #fdf6e6;
              border: 0.6mm dashed #c9a24a; border-radius: 2mm; padding: 6mm 4mm; }
/* 덱 머리글 — 카드 세 줄(264mm)을 빼면 한 면에 30mm 쯤 남는다. 그 안에 들어가야 한다. */
.deckHd { padding: 5mm 12mm 0; }
.deckHd h1 { font-size: 13pt; margin: 0 0 1.2mm; }
.deckHd p { font-size: 6.9pt; line-height: 1.45; margin: 0; color: #4a4436; }
`;

/* 넘치는 카드만 골라 담기는 데까지 줄인다. QR 은 0.8배(16mm)까지도 잘 읽힌다. */
const CARD_FIT = `<script>
(function () {
  var MIN = 0.76;
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

/* ── 생성기 ──────────────────────────────────────────────────────────────── */
export function genCards(parsed, data = {}) {
  const cards = pickCards(parsed).map(norm).filter((c) => c.no && (c.title || c.body));

  const n = cards.length;
  const nQr = cards.filter((c) => data?.qr?.[data?.codeOf?.[c.no]]).length;
  const counts = {};
  for (const c of cards) {
    const d = deckOf(c.no) || '?';
    counts[d] = (counts[d] || 0) + 1;
  }
  const tally = Object.entries(counts).map(([d, k]) => `${d} ${k}`).join(' · ');

  const head = `<div class="deckHd">
    <h1>「야간조」 단서 카드 <span style="font-weight:400;font-size:9pt;color:#6b6760">— ${n}장</span></h1>
    <p><b>A4 세로 · 양면 인쇄 · 「긴 쪽 넘김」 · 배율 100%(「페이지에 맞춤」을 끄세요).</b>
      한 면에 3×3 = 9장이고, 뒷면 면은 행마다 좌우가 이미 뒤집혀 있습니다 — 그대로 뽑으면 맞습니다.<br>
      자르기 전에 <b>카드 한 장을 자로 재세요. 63 × 88mm</b> 가 아니면 배율이 잘못된 것입니다.
      한 장을 빛에 비춰 <b>뒷면 번호가 앞면 카드와 겹치는지</b>도 보세요.<br>
      더미 — ${esc(tally)}. QR 은 ${nQr}장에 붙어 있습니다.
      <b>V 더미 뒷면에는 번호도 이름도 없습니다</b> — 카메라와 시간대뿐입니다(룰북 §3-b).</p></div>`;

  const body = sheets(cards, data, head);
  return {
    filename: '보드_야간조_카드.html',
    html: docShell('야간조 — 단서 카드', body, { css: CARD_CSS, script: CARD_FIT }),
  };
}

export default genCards;
