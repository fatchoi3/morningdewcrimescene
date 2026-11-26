// ─────────────────────────────────────────────────────────────────────────────
// 야간조 인쇄물 ③ — 인물 시트 일곱
//
//   한 사람에 **A4 가로 두 장, 양면(짧은 쪽 넘김)**. 두 장을 포개어 가운데를 세로로
//   함께 반 접으면 A5 8쪽 책자가 된다 — 바깥은 1면(겉표지)과 빈 뒤표지뿐이다.
//   (한 장 네 면으로 접던 때는 4면이 뒤표지로 바깥에 나왔다. 글자도 6pt 밑으로 내려갔다.)
//
//   ── 면이 종이의 어디에 찍히는가 ──────────────────────────────────────────
//   짧은 쪽 넘김이면 뒷면은 **세로축**으로 뒤집힌다. 그래서 종이의 왼쪽 반의
//   뒷면에는 «인쇄 데이터의 오른쪽 칸» 이 찍히고, 오른쪽 반의 뒷면에는 «왼쪽 칸» 이 찍힌다.
//   쪽 배치는 personSheets() 머리 주석에 있다. 이 자리가 이 파일에서 가장 틀리기 쉽다.
//
//   ── 형사(재해조사관) ─────────────────────────────────────────────────────
//   숨길 넷째 면이 없어 A4 한 장이다. 바깥은 겉면과 빈 면, 안쪽 두 면이 본인만 보는 면이다.
//
//   ── 파일명 ────────────────────────────────────────────────────────────────
//   `보드_` 로 시작한다(build.mjs `marginFor()` → 여백 0). 그리고 build.mjs 의
//   LANDSCAPE 정규식은 `^(보드_인물카드|결과제출지)` 라 야간조 파일명을 못 잡는다 —
//   그래서 문서가 스스로 `@page { size: A4 landscape }` 를 선언한다(paperOf() 가 CSS 를 먼저 읽는다).
// ─────────────────────────────────────────────────────────────────────────────
import {
  esc, inline, parseBlocks, renderBlocks, dropNotes, docShell, needMd, pickMd,
} from './mdhtml.mjs';

const FACE = /^\s*([1-4])\s*면/;                  // `1면 · 겉 — …` · `1면 (겉) — …`
const PERSON_PREFIX = /^\s*시트\s*[:：]?\s*\d+\s*·\s*/;

/* ── 문서 자르기 ─────────────────────────────────────────────────────────── */
function splitH(blocks, level) {
  const lead = [];
  const parts = [];
  let cur = null;
  for (const b of blocks) {
    if (b.type === 'h' && b.level === level) {
      cur = { title: b.text, blocks: [] };
      parts.push(cur);
      continue;
    }
    (cur ? cur.blocks : lead).push(b);
  }
  return { lead, parts };
}

// 사람 한 명 = 「…면」 제목을 자식으로 가진 h1. 묶음 제목(「야간조」 인물 시트 — …)은
// 자식이 없으므로 이 검사 하나로 걸러진다. 제목 형식이 둘이라(`서장현 · 38세 · …` ·
// `시트:4 · 흐엉`) 이름만 따로 떼어 낸다.
function persons(md) {
  const { parts } = splitH(parseBlocks(dropNotes(md)), 1);
  const out = [];
  for (const p of parts) {
    const { parts: faces } = splitH(p.blocks, 2);
    const numbered = faces.filter((f) => FACE.test(f.title));
    if (numbered.length < 2) continue;
    const head = String(p.title).replace(PERSON_PREFIX, '').trim();
    const bits = head.split(/\s*·\s*/);
    out.push({
      name: bits[0] || head,
      sub: bits.slice(1).join(' · '),
      faces: numbered.map((f) => ({
        n: Number(f.title.match(FACE)[1]),
        title: f.title,
        blocks: f.blocks,
      })).sort((a, b) => a.n - b.n),
    });
  }
  return out;
}

// 형사 시트는 진행물.md 안에 있다(`# 3. 형사 시트 — 재해조사관`). 면이 셋이라
// 넷째 면은 백지로 둔다 — 형사는 숨길 시나리오가 없다.
function detective(progressMd) {
  if (!progressMd) return null;
  const { parts } = splitH(parseBlocks(dropNotes(progressMd)), 1);
  const sec = parts.find((p) => /형사\s*시트/.test(p.title));
  if (!sec) return null;
  const { lead, parts: faces } = splitH(sec.blocks, 2);
  const cover = faces.find((f) => /겉/.test(f.title));
  const inner = faces.filter((f) => /안쪽/.test(f.title));
  if (!cover || inner.length < 1) return null;
  const nameLine = (cover.blocks.find((b) => b.type === 'h') || {}).text || '형사';
  const bits = String(nameLine).split(/\s*·\s*/);
  return {
    name: bits[0].replace(/\s*\(\d+\)\s*/, '').trim() || '형사',
    sub: bits.slice(1).join(' · '),
    lead,
    cover,
    inner,
  };
}

/* ── 면 그리기 ───────────────────────────────────────────────────────────── */
//   안쪽 면은 글을 .hbody 한 겹으로 감싼다 — 두 단으로 돌릴 때 단을 걸 자리가 필요하고,
//   .half 가 overflow:hidden 이라 넘침 판정(scrollHeight)은 그대로 된다.
const half = (inner, cls = '') => (cls.includes('cover')
  ? `<div class="half ${cls}">${inner}</div>`
  : `<div class="half ${cls}"><div class="hbody">${inner}</div></div>`);

const sheet = (left, right, tag = '') => `<div class="fold">
  ${left}<div class="foldline"></div><div class="foldtag">세로로 접는 선${tag ? ` · ${esc(tag)}` : ''}</div>${right}</div>`;

// 안쪽 쪽들을 한 줄로 잇는다(책자 순서). 면은 늘 새 쪽에서 시작하고, 넘치는 꼬리는
// 다음 쪽으로 흐른다 — 인쇄 직전에 FIT 가 나눈다. 같은 data-chain 의 쪽들이 한 줄이다.
//   faces 의 i 번째 면은 처음에 i 번째 쪽에 들어 있다(스크립트가 없을 때도 읽히게).
let chainSeq = 0;
function chainHalves(faces, count, labelOf) {
  const id = `c${++chainSeq}`;
  return Array.from({ length: count }, (_, i) => {
    const f = faces[i];
    const face = f ? ` data-face="${esc(labelOf(f))}"` : '';
    return `<div class="half inner" data-chain="${id}" data-seq="${i}"${face}><div class="hbody">${f ? faceBody(f) : ''}</div></div>`;
  });
}

const blankHalf = (note) => half(`<div class="blankHalf">${esc(note || '')}</div>`, 'cover');

// 안쪽 첫 면 맨 위의 「먼저 읽을 다섯 줄」 인용 상자는 굵은 테두리 상자로 그린다 —
// 시트를 펴자마자 눈에 걸려야 하는 줄이라 다른 인용과 모양을 가른다.
const FIRST5 = /^\s*\**\s*먼저 읽을 다섯 줄/;
function faceBody(face) {
  if (!face) return '';
  // 면 끝의 가름줄(---)은 원고의 면 구분일 뿐이다 — 면은 어차피 새 쪽에서 시작한다.
  const blocks = face.blocks.slice();
  while (blocks.length && blocks[blocks.length - 1].type === 'hr') blocks.pop();
  const [b0, ...rest] = blocks;
  const p0 = b0 && b0.type === 'quote' && b0.blocks[0];
  const head = `<h1>${inline(face.title)}</h1>`;
  if (p0 && p0.type === 'p' && FIRST5.test(p0.text)) {
    return `${head}<div class="first5">${renderBlocks(b0.blocks)}</div>${renderBlocks(rest)}`;
  }
  return `${head}${renderBlocks(blocks)}`;
}

// 1면 — 겉. 남이 봐도 되는 것만 있다. 시트를 받자마자 무엇을 하는지도 여기 적는다.
function coverFace(p) {
  return half(`<div class="covTop">
      <div class="covName">${esc(p.name)}</div>
      ${p.sub ? `<div class="covSub">${inline(p.sub)}</div>` : ''}
      <div class="cbar"></div>
    </div>
    <div class="covBody">${renderBlocks((p.faces[0] || {}).blocks || [])}</div>
    <div class="covHow"><b>받자마자 이렇게 하세요</b>
      <div>① <b>펴지 말고</b> 가운데 접힌 선을 확인합니다. <b>이 면이 위로</b>, 접힌 선이 왼쪽에 오는 것이 맞습니다.</div>
      <div>② 혼자 책처럼 펼쳐 <b>안쪽 여섯 쪽</b>(2·3·4면)을 12~15분 동안 읽습니다.</div>
      <div>③ 다시 접어 <b>이 면만 보이게</b> 자기 앞에 둡니다. 뒤표지는 빈 면입니다.</div>
      <div class="covWarn">1라운드 시작 전에 이 면의 내용만 자기 말로 소개합니다.
        안쪽은 끝까지 아무에게도 보여 주지 않습니다.</div></div>`, 'cover');
}

// 한 사람 = A4 가로 **두 장을 포개어** 함께 반 접은 8쪽 책자다(바깥 장 X · 안쪽 장 Y).
//   접었을 때 바깥에 나오는 것은 1면(겉표지)과 빈 뒤표지뿐이고, 비밀 세 면은 전부 안쪽이다.
//   한 장으로 접던 때는 4면이 뒤표지로 바깥에 나와, 들고 읽으면 맞은편에서 보였다.
//
//   표지가 오른쪽 반이라 접힌 선이 표지의 왼쪽에 오고, 책처럼 왼쪽으로 넘긴다.
//   짧은 쪽 넘김이면 오른쪽 반의 뒷면은 뒷장의 **왼쪽 칸**이다. 그래서 쪽 번호(책자 순서)는
//     X 앞 [8 뒤표지 | 1 표지]   X 뒤 [2 | 7]
//     Y 앞 [6 | 3]               Y 뒤 [4 | 5]
//   안쪽 여섯 쪽(2~7)에 2면 · 3면 · 4면을 차례로 흘린다(chainHalves). 면마다 새 쪽에서 시작한다.
function personSheets(p) {
  const faces = [2, 3, 4].map((n) => p.faces.find((x) => x.n === n)).filter(Boolean);
  const [p2, p3, p4, p5, p6, p7] = chainHalves(faces, 6, (f) => `${f.n}면`);
  return sheet(blankHalf('뒤표지 — 비워 둡니다'), coverFace(p), `${p.name} · 바깥 장`)
    + sheet(p2, p7, `${p.name} · 바깥 장`)
    + sheet(p6, p3, `${p.name} · 안쪽 장`)
    + sheet(p4, p5, `${p.name} · 안쪽 장`);
}

function detectiveSheets(d) {
  const cover = half(`<div class="covTop">
      <div class="covName">${esc(d.name)}</div>
      ${d.sub ? `<div class="covSub">${inline(d.sub)}</div>` : ''}
      <div class="cbar"></div></div>
    <div class="covBody">${renderBlocks(d.cover.blocks)}</div>
    <div class="covHow"><b>일곱이 할 때만 씁니다</b>
      <div>여섯이 하면 <b>이 한 장을 빼세요.</b></div>
      <div>형사는 용의자가 아닙니다 — 아무도 형사를 지목하지 않습니다.</div>
      <div class="covWarn">안쪽 두 면은 본인만 봅니다.</div></div>`, 'cover');
  const [inner1, inner2] = chainHalves(d.inner.slice(0, 2), 2,
    (f) => String(f.title).split(/\s*·\s*/)[0]);
  // 형사는 숨길 시나리오가 없어 넷째 면이 없다 — 없는 면을 가리키지 않는다.
  // 인물 시트와 같은 방향으로 접는다 — 표지가 오른쪽 반, 뒷장 왼쪽 칸이 펼친 왼쪽이다.
  return sheet(blankHalf('형사 시트는 이 한 장뿐입니다'), cover, `${d.name}`)
    + sheet(inner1, inner2, `${d.name}`);
}

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const FOLD_CSS = `
body { padding: 0; }
.fold { width: 297mm; height: 210mm; page-break-after: always; display: flex;
        flex-direction: row; position: relative; overflow: hidden; }
.fold:last-of-type { page-break-after: auto; }
.half { --fit: 1; flex: 0 0 148.5mm; width: 148.5mm; height: 210mm;
        padding: 9mm 9mm 6mm; overflow: hidden; position: relative; display: block;
        contain: layout paint; }
.half.cover { display: flex; flex-direction: column; }
.hbody { }
.foldline { position: absolute; top: 0; bottom: 0; left: 148.5mm;
            border-left: 0.3mm dashed #c3bcae; }
.foldtag { position: absolute; left: 148.5mm; bottom: 4mm; transform: translateX(-50%);
           font-size: 6.5pt; color: #b3aa99; background: #fff; padding: 0 1.5mm; white-space: nowrap; }
.blankHalf { height: 100%; display: flex; align-items: flex-end; justify-content: center;
             padding-bottom: 12mm; font-size: 7.5pt; color: #b3aa99; }
/* 안쪽 면 — 글이 많다. 크기는 인쇄 직전에 면마다 스스로 정한다(FIT).
   FIT 의 바닥(0.9)에서도 본문이 6.5pt 이상이 되게 기준 크기를 잡았다. 줄 간격은 배율과 따로 1.3 이상. */
.half h1 { font-size: calc(11.5pt * var(--fit)); margin: 0 0 calc(2mm * var(--fit));
           padding-bottom: 1mm; border-bottom: 0.8px solid #14120f; line-height: 1.25; }
.half h1 sub { font-size: 7pt; font-weight: 400; color: #6b6760; }
.half h2 { font-size: calc(9pt * var(--fit)); margin: calc(2.2mm * var(--fit)) 0 calc(0.9mm * var(--fit));
           padding-bottom: 0.6mm; border-bottom: 0.7px solid #cfc7b6; break-after: avoid; }
.half h3, .half h4 { font-size: calc(8.2pt * var(--fit)); margin: calc(1.8mm * var(--fit)) 0 calc(0.7mm * var(--fit));
                     color: #4a4436; }
.half p { font-size: calc(8pt * var(--fit)); line-height: 1.45;
          margin: 0 0 calc(1.2mm * var(--fit)); }
.half .mdlist { font-size: calc(8pt * var(--fit)); line-height: 1.4;
                margin: 0 0 calc(1.2mm * var(--fit)) 4mm; }
.half .mdlist li { margin-bottom: calc(0.4mm * var(--fit)); }
.half .mdq { font-size: calc(7.8pt * var(--fit)); padding: calc(1.2mm * var(--fit)) 2mm;
             margin: calc(1.2mm * var(--fit)) 0; border-left-width: 0.6mm; line-height: 1.4; }
.half .mdq p { font-size: inherit; }
.half .mdtable { font-size: calc(7.6pt * var(--fit)); margin: calc(1.2mm * var(--fit)) 0; }
.half .mdtable th, .half .mdtable td { padding: calc(0.8mm * var(--fit)) 1.2mm;
                                       font-size: calc(7.6pt * var(--fit)); line-height: 1.35; }
.half .mdhr { margin: calc(2mm * var(--fit)) 0; }
.half .mdpre { font-size: calc(7.4pt * var(--fit)); padding: 1.2mm 1.6mm; line-height: 1.35; }
.half code { font-size: calc(7.3pt * var(--fit)); }
/* 두 쪽에 흘린 면의 뒤쪽 머리 */
.half.cont::before { content: attr(data-cont); display: block; font-size: 7pt; font-weight: 800;
                     color: #8a6d1f; margin-bottom: 1.6mm; }
/* 겉면 */
.cover { justify-content: space-between; }
.covTop { text-align: center; padding-top: 6mm; }
.covName { font-size: 28pt; font-weight: 800; letter-spacing: .02em; }
.covSub { font-size: 10pt; color: #6b6760; margin-top: 2mm; }
.cbar { width: 26mm; height: 0.8mm; background: #b8912c; margin: 5mm auto 0; }
.covBody { flex: 1; overflow: hidden; margin-top: 5mm; }
.covBody p { font-size: 8.6pt; line-height: 1.66; margin: 0 0 2mm; }
.covBody .mdq { font-size: 8pt; }
.covBody .mdtable, .covBody .mdtable th, .covBody .mdtable td { font-size: 8pt; }
.covHow { margin-top: 4mm; border: 0.5mm solid #b8912c; border-radius: 2mm; padding: 2.6mm 3mm;
          background: #fffdf4; font-size: 7.8pt; line-height: 1.55; }
.covHow > b { display: block; color: #8a6d1f; margin-bottom: 1.2mm; }
.covHow > div { margin-bottom: 0.7mm; }
.covWarn { margin-top: 1.6mm; padding-top: 1.6mm; border-top: 0.3mm dashed #cfc7b6; color: #8a3b3b; }
/* 한 단으로는 글자가 4pt 대까지 내려가는 면만 두 단으로 돌린다(FIT 가 붙인다).
   제목과 경고 줄은 두 단에 걸쳐 둔다 — 단 안에 들어가면 면의 머리가 아니라 문단이 된다. */
.half.two .hbody { column-count: 2; column-gap: 5mm; }
.half.two h1, .half.two .faceWarn { column-span: all; }
.half.two h2, .half.two h3, .half.two h4 { break-after: avoid; }
.half.two .mdtable, .half.two .mdq { break-inside: avoid; }
/* 안쪽 첫 면 맨 위 — 먼저 읽을 다섯 줄 */
.first5 { border: 0.7mm solid #14120f; border-radius: 1.5mm; background: #fffdf4;
          padding: calc(1.1mm * var(--fit)) 2.2mm calc(0.8mm * var(--fit));
          margin: 0 0 calc(1.8mm * var(--fit)); break-inside: avoid; }
.first5 > p:first-child { font-weight: 800; margin-bottom: calc(0.4mm * var(--fit)); }
.first5 .mdlist { font-size: calc(7.4pt * var(--fit)); line-height: 1.3; margin-bottom: 0; }
.first5 .mdlist li { margin-bottom: 0; }
.half.two .first5 { column-span: all; }/* 안쪽 면 머리의 경고 한 줄 */
.faceWarn { font-size: 6.4pt; color: #8a3b3b; background: #fdf0ee; border: 0.25mm solid #e0bdb8;
            border-radius: 1mm; padding: 0.8mm 1.6mm; margin-bottom: 2mm; text-align: center; }
/* 인쇄 요령 한 장 — 이 문서를 처음 뽑는 사람이 제일 먼저 보는 면 */
.howto { width: 297mm; height: 210mm; page-break-after: always; padding: 16mm 20mm;
         display: flex; flex-direction: column; }
.howto h1 { font-size: 20pt; margin: 0 0 4mm; }
.howto p { font-size: 10pt; line-height: 1.7; margin: 0 0 3mm; }
.howto table { width: 100%; border-collapse: collapse; margin: 3mm 0; font-size: 9.5pt; }
.howto th, .howto td { border: 0.25mm solid #b9b0a0; padding: 2mm 2.6mm; vertical-align: top;
                       text-align: left; }
.howto th { background: #efeae0; font-weight: 800; }
.howto .warn { font-size: 9.5pt; }
/* 안내 면의 **뒷면**. 일부러 비워 둔다 — 아래 howtoBack 주석 참고 */
.howtoBack { width: 297mm; height: 210mm; page-break-after: always;
             display: flex; align-items: center; justify-content: center;
             font-size: 9pt; color: #9a9384; }
`;

/* 면마다 글 양이 달라 한 크기로는 안 된다. 인쇄 직전에 시트가 스스로 배율을 고른다 —
   넘치지 않는 가장 큰 --fit 을 이분법으로 찾는다. 겉면은 고정 크기라 건드리지 않는다.

   안쪽 쪽들은 한 줄(data-chain)이다. 면마다 새 쪽에서 시작해 넘치는 꼬리를 다음 쪽으로
   흘린다(pour). 바닥(FLOOR = 0.9, 본문 6.5pt 남짓)까지는 한 단으로 담고, 한 단으로 안 되면
   두 단으로 돌린다. 그래도 안 담기는 시트만 바닥 밑으로 내려가고 data-over 표시를 남긴다 —
   조용히 작아지는 인쇄가 제일 위험하다. */
const FIT = `<script>
(function () {
  var FLOOR = 0.9, MIN = 0.7, MAX = 1.15, cache = {};
  function over(el) { return el.scrollHeight - el.clientHeight > 1; }
  function body(el) { return el.querySelector(".hbody"); }
  function chainOf(id) {
    if (cache[id]) return cache[id];
    var hs = [].slice.call(document.querySelectorAll('.half.inner[data-chain="' + id + '"]'));
    hs.sort(function (x, y) { return +x.getAttribute("data-seq") - +y.getAttribute("data-seq"); });
    var items = [];
    hs.forEach(function (h) {
      if (!h.hasAttribute("data-face")) return;
      var label = h.getAttribute("data-face"), kids = [].slice.call(body(h).children);
      kids.forEach(function (n, k) { items.push({ node: n, label: label, start: k === 0 }); });
    });
    return (cache[id] = { halves: hs, items: items });
  }
  /* 쪽에 차례로 붓는다. 다 담으면 true. 못 담으면 남은 것을 마지막 쪽에 몰아 두고 false. */
  function pour(c) {
    var hs = c.halves, it = c.items, i = -1, ok = true;
    hs.forEach(function (h) {
      var B = body(h);
      while (B.firstChild) B.removeChild(B.firstChild);
      h.classList.remove("cont");
    });
    for (var k = 0; k < it.length; k++) {
      var x = it[k];
      if (!ok) { body(hs[hs.length - 1]).appendChild(x.node); continue; }
      if (x.start || i < 0) {
        i++;
        if (i >= hs.length) { ok = false; i = hs.length - 1; body(hs[i]).appendChild(x.node); continue; }
      }
      var h = hs[i];
      body(h).appendChild(x.node);
      if (!over(h)) continue;
      if (body(h).children.length > 1 && i + 1 < hs.length) {
        i++;
        h = hs[i];
        h.setAttribute("data-cont", x.label + " — 이어서");
        h.classList.add("cont");
        body(h).appendChild(x.node);
        if (!over(h)) continue;
      }
      ok = false;
    }
    return ok;
  }
  function fitChain(c) {
    function ok(f, two) {
      for (var i = 0; i < c.halves.length; i++) {
        c.halves[i].style.setProperty("--fit", f.toFixed(3));
        c.halves[i].classList.toggle("two", two);
      }
      return pour(c);
    }
    c.halves[0].removeAttribute("data-over");
    var two = false, lo = FLOOR, hi = MAX;
    if (!ok(FLOOR, false)) {
      two = true;
      if (!ok(FLOOR, true)) { lo = MIN; hi = FLOOR; c.halves[0].setAttribute("data-over", "1"); }
    }
    if (ok(hi, two)) lo = hi;
    else for (var n = 0; n < 9; n++) {
      var mid = (lo + hi) / 2;
      if (ok(mid, two)) lo = mid; else hi = mid;
    }
    ok(lo, two);
  }
  function fit() {
    var seen = {}, faces = document.querySelectorAll(".half.inner[data-chain]");
    for (var i = 0; i < faces.length; i++) {
      var id = faces[i].getAttribute("data-chain");
      if (seen[id]) continue;
      seen[id] = 1;
      fitChain(chainOf(id));
    }
  }
  if (document.readyState === "complete") fit();
  else window.addEventListener("load", fit);
  window.addEventListener("beforeprint", fit);
})();
</script>`;

/* ── 생성기 ──────────────────────────────────────────────────────────────── */
export function genPersons(parsed, data = {}) {
  const md = needMd(parsed, 'persons', 'genPersons');
  const list = persons(md);
  const cop = detective(pickMd(parsed, 'progress'));

  const n = list.length + (cop ? 1 : 0);
  const howto = `<div class="howto">
    <h1>인물 시트 — 뽑는 법</h1>
    <p><b>혼자 있을 때 뽑으세요.</b> 겉표지 말고는 전부 남의 비밀입니다.
      나온 그대로 집어 <b>읽지 말고</b> 접어서 겉면만 보이게 엎어 두세요.</p>
    <table>
      <tr><th style="width:22%">종이</th><td><b>A4 가로</b></td></tr>
      <tr><th>인쇄</th><td><b>양면 · 「짧은 쪽 넘김」</b> · 배율 100%(「페이지에 맞춤」을 끄세요)</td></tr>
      <tr><th>장수</th><td><b>${list.length * 2 + (cop ? 1 : 0)}장</b>(이 안내 면을 빼고). <b>한 사람에 두 장</b>입니다
        ${cop ? '— 마지막 한 장이 <b>형사(재해조사관)</b> 시트이고(한 장뿐), <b>여섯이 하면 그 장을 뺍니다</b>' : ''}</td></tr>
      <tr><th>접기</th><td>한 사람의 두 장 가운데 <b>이름이 크게 찍힌 장(바깥 장)</b>을 밖으로, 다른 장(안쪽 장)을 그 안에
        포개어 가운데 점선을 <b>세로로 함께</b> 접습니다. 점선 아래에 이름과 「바깥 장 · 안쪽 장」이 적혀 있습니다.
        <b>「1면 · 공개 프로필」이 위로</b>, 접힌 선이 왼쪽에 오게 두면 바깥에는 겉표지와 빈 뒤표지만 보입니다</td></tr>
    </table>
    <div class="warn"><b>접기 전에 한 번만 확인하세요.</b> 책처럼 펼쳤을 때 <b>2면 · 3면 · 4면</b>이 차례로 나오고
      글자가 바로 서 있으면 넘김 방향이 맞습니다.
      면 순서가 뒤섞였거나 글자가 거꾸로 서 있으면 <b>「긴 쪽 넘김」으로 뽑힌 것</b>입니다 —
      인쇄 설정을 <b>짧은 쪽 넘김</b>으로 바꿔 다시 뽑으세요.</div>
    <p class="note">시트에는 그 사람이 아는 것만 적혀 있습니다. 남이 무엇을 했는지는 어느 시트에도 없습니다.</p>
  </div>`;

  // 안내 면의 뒷면. **비어 있어야 한다.**
  //   이 문서는 양면·짧은 쪽 넘김으로 뽑는다. 안내 면이 홀수 면 하나로 서 있으면
  //   프린터가 그 뒷면에 **첫 사람의 겉면**을 찍어 버리고, 그때부터 모든 장이 한 면씩
  //   밀려 1면과 4면이 다른 종이에 갈린다. 뒷면 한 장을 비워 두면 인물 시트가 다시
  //   홀수 면에서 시작해 「한 사람에 종이 한 장」이 성립한다.
  //   (안내 면을 빼고 뽑는 사람에게도 이 면은 그냥 버리는 한 장이라 손해가 없다.)
  const howtoBack = '<div class="howtoBack">이 면은 비워 둡니다 — 안내 면의 뒷면입니다.</div>';

  const body = howto + howtoBack + list.map(personSheets).join('') + (cop ? detectiveSheets(cop) : '');

  return {
    filename: '보드_야간조_인물시트.html',
    html: docShell('야간조 — 인물 시트', body, { css: FOLD_CSS, script: FIT, landscape: true }),
  };
}

export default genPersons;
