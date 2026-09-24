// ─────────────────────────────────────────────────────────────────────────────
// 야간조 인쇄물 ③ — 인물 시트 일곱
//
//   한 사람에 **A4 가로 한 장, 양면(짧은 쪽 넘김)**. 가운데를 세로로 반 접으면
//   A5 책자 네 면이 된다 — 인물시트.md 머리가 그렇게 선언하고 있고, 그 형식을 지킨다.
//
//   ── 네 면이 종이의 어디에 찍히는가 ────────────────────────────────────────
//   짧은 쪽 넘김이면 뒷면은 **세로축**으로 뒤집힌다. 그래서 종이의 왼쪽 반(이하 A)의
//   뒷면에는 «인쇄 데이터의 오른쪽 칸» 이 찍히고, 오른쪽 반(B)의 뒷면에는 «왼쪽 칸» 이 찍힌다.
//
//     1면(겉)  →  1쪽 왼쪽    … 접었을 때 위로 오는 면
//     4면      →  1쪽 오른쪽  … 접었을 때 바닥을 향하는 면
//     3면      →  2쪽 왼쪽    … 펼쳤을 때 오른쪽
//     2면      →  2쪽 오른쪽  … 펼쳤을 때 왼쪽
//
//   즉 **2쪽은 [3면 | 2면] 순서로 찍는다.** 이 줄이 이 파일에서 가장 틀리기 쉬운 자리다 —
//   순서를 바꾸면 펼쳤을 때 대본이 먼저 나오고 비밀 시나리오가 뒤에 온다.
//
//   ── 접는 방향을 종이에 적는다 ─────────────────────────────────────────────
//   네 면 중 **셋이 본인만 보는 면**이라, 접는 방향을 틀리면 비밀이 바깥을 본다.
//   1면에 「이 면이 위로 오게」, 4면에 「이 면은 바닥을 향한다」를 찍어 방향을 못 박는다.
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

const sheet = (left, right) => `<div class="fold">
  ${left}<div class="foldline"></div><div class="foldtag">세로로 접는 선</div>${right}</div>`;

const blankHalf = (note) => half(`<div class="blankHalf">${esc(note || '')}</div>`, 'cover');

function faceBody(face) {
  if (!face) return '';
  return `<h1>${inline(face.title)}</h1>${renderBlocks(face.blocks)}`;
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
      <div>① <b>펴지 말고</b> 가운데 접힌 선을 확인합니다. <b>이 면이 위로</b> 오는 것이 맞습니다.</div>
      <div>② 혼자 펼쳐 <b>안쪽 두 면</b>과 <b>바닥을 향하던 면</b>을 5분 동안 읽습니다.</div>
      <div>③ 다시 접어 <b>이 면만 보이게</b> 자기 앞에 둡니다.</div>
      <div class="covWarn">1라운드 시작 전에 이 면의 내용만 자기 말로 소개합니다.
        안쪽은 끝까지 아무에게도 보여 주지 않습니다.</div></div>`, 'cover');
}

// 4면 — 접으면 바닥을 향하는 면. 본인만 보는 내용이라 그 사실을 면 자체에 적어 둔다.
function backFace(p) {
  const f = p.faces.find((x) => x.n === 4);
  return half(`<div class="faceWarn">이 면은 접으면 <b>바닥을 향합니다</b> — 탁자에 그대로 두세요</div>`
    + faceBody(f), 'inner');
}

function personSheets(p) {
  const f2 = p.faces.find((x) => x.n === 2);
  const f3 = p.faces.find((x) => x.n === 3);
  // 1쪽(겉면) — 왼쪽이 1면, 오른쪽이 4면.
  // 2쪽(안쪽) — 짧은 쪽 넘김이라 [3면 | 2면] 순서로 찍어야 펼쳤을 때 2면이 왼쪽에 온다.
  return sheet(coverFace(p), backFace(p))
    + sheet(half(faceBody(f3), 'inner'), half(faceBody(f2), 'inner'));
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
  const inner1 = half(faceBody(d.inner[0]), 'inner');
  const inner2 = half(d.inner[1] ? faceBody(d.inner[1]) : '', 'inner');
  // 형사는 숨길 시나리오가 없어 넷째 면이 없다 — 없는 면을 가리키지 않는다.
  return sheet(cover, blankHalf('형사 시트는 이 한 장뿐입니다'))
    + sheet(inner2, inner1);
}

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const FOLD_CSS = `
body { padding: 0; }
.fold { width: 297mm; height: 210mm; page-break-after: always; display: flex;
        flex-direction: row; position: relative; overflow: hidden; }
.fold:last-of-type { page-break-after: auto; }
.half { --fit: 1; flex: 0 0 148.5mm; width: 148.5mm; height: 210mm;
        padding: 9mm 9mm 6mm; overflow: hidden; position: relative; display: block; }
.half.cover { display: flex; flex-direction: column; }
.hbody { }
.foldline { position: absolute; top: 0; bottom: 0; left: 148.5mm;
            border-left: 0.3mm dashed #c3bcae; }
.foldtag { position: absolute; left: 148.5mm; bottom: 4mm; transform: translateX(-50%);
           font-size: 6pt; color: #b3aa99; background: #fff; padding: 0 1.5mm; }
.blankHalf { height: 100%; display: flex; align-items: flex-end; justify-content: center;
             padding-bottom: 12mm; font-size: 7.5pt; color: #b3aa99; }
/* 안쪽 면 — 글이 많다. 크기는 인쇄 직전에 면마다 스스로 정한다(FIT). */
.half h1 { font-size: calc(11.5pt * var(--fit)); margin: 0 0 calc(2mm * var(--fit));
           padding-bottom: 1mm; border-bottom: 0.8px solid #14120f; line-height: 1.25; }
.half h1 sub { font-size: 7pt; font-weight: 400; color: #6b6760; }
.half h2 { font-size: calc(8.6pt * var(--fit)); margin: calc(2.2mm * var(--fit)) 0 calc(0.9mm * var(--fit));
           padding-bottom: 0.6mm; border-bottom: 0.7px solid #cfc7b6; break-after: avoid; }
.half h3, .half h4 { font-size: calc(7.6pt * var(--fit)); margin: calc(1.8mm * var(--fit)) 0 calc(0.7mm * var(--fit));
                     color: #4a4436; }
.half p { font-size: calc(7pt * var(--fit)); line-height: calc(1.5 * var(--fit));
          margin: 0 0 calc(1.2mm * var(--fit)); }
.half .mdlist { font-size: calc(7pt * var(--fit)); line-height: calc(1.45 * var(--fit));
                margin: 0 0 calc(1.2mm * var(--fit)) 4mm; }
.half .mdlist li { margin-bottom: calc(0.4mm * var(--fit)); }
.half .mdq { font-size: calc(6.8pt * var(--fit)); padding: calc(1.2mm * var(--fit)) 2mm;
             margin: calc(1.2mm * var(--fit)) 0; border-left-width: 0.6mm; }
.half .mdtable { font-size: calc(6.8pt * var(--fit)); margin: calc(1.2mm * var(--fit)) 0; }
.half .mdtable th, .half .mdtable td { padding: calc(0.8mm * var(--fit)) 1.2mm;
                                       font-size: calc(6.8pt * var(--fit)); line-height: 1.4; }
.half .mdhr { margin: calc(2mm * var(--fit)) 0; }
.half .mdpre { font-size: calc(6.4pt * var(--fit)); padding: 1.2mm 1.6mm; }
.half code { font-size: calc(6.3pt * var(--fit)); }
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
/* 안쪽 면 머리의 경고 한 줄 */
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

/* 면마다 글 양이 달라 한 크기로는 안 된다. 인쇄 직전에 면이 스스로 배율을 고른다 —
   넘치지 않는 가장 큰 --fit 을 이분법으로 찾는다. 겉면은 고정 크기라 건드리지 않는다.

   한 단으로는 안 담기는 면이 있다(임기석 4면처럼 대응표가 긴 면). 글자만 줄이면
   4pt 대까지 내려가 못 읽는다 — READ 아래로 내려가야 하는 면은 **두 단으로 돌린다.**
   A5 면을 두 단으로 나누면 62mm 단이 되고, 같은 양이 0.8 대 배율로 들어간다.
   그래도 안 담기는 면만 MIN 까지 내려간다. */
const FIT = `<script>
(function () {
  var MIN = 0.58, MAX = 1.28, READ = 0.80;
  function over(el) { return el.scrollHeight - el.clientHeight > 1; }
  function best(el) {
    el.style.setProperty("--fit", "1");
    var lo, hi;
    if (over(el)) { lo = MIN; hi = 1; } else { lo = 1; hi = MAX; }
    for (var n = 0; n < 11; n++) {
      var mid = (lo + hi) / 2;
      el.style.setProperty("--fit", mid.toFixed(3));
      if (over(el)) hi = mid; else lo = mid;
    }
    el.style.setProperty("--fit", lo.toFixed(3));
    return lo;
  }
  function fit() {
    var faces = document.querySelectorAll(".half.inner");
    for (var i = 0; i < faces.length; i++) {
      var el = faces[i];
      el.classList.remove("two");
      var one = best(el);
      if (one >= READ) continue;
      el.classList.add("two");
      /* 두 단이 더 크게 담기면 두 단으로 둔다. 아니면 한 단으로 되돌린다. */
      if (best(el) <= one) { el.classList.remove("two"); best(el); }
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
    <p><b>혼자 있을 때 뽑으세요.</b> ${n * 4}면 가운데 ${n * 3}면이 남의 비밀입니다.
      나온 그대로 집어 <b>읽지 말고</b> 접어서 겉면만 보이게 엎어 두세요.</p>
    <table>
      <tr><th style="width:22%">종이</th><td><b>A4 가로</b></td></tr>
      <tr><th>인쇄</th><td><b>양면 · 「짧은 쪽 넘김」</b> · 배율 100%(「페이지에 맞춤」을 끄세요)</td></tr>
      <tr><th>장수</th><td><b>${n}장</b>(이 안내 면을 빼고). 한 사람에 한 장입니다
        ${cop ? '— 마지막 한 장이 <b>형사(재해조사관)</b> 시트이고, <b>여섯이 하면 그 장을 뺍니다</b>' : ''}</td></tr>
      <tr><th>접기</th><td>가운데 점선을 <b>세로로</b> 접습니다.
        <b>「1면 · 공개 프로필」이 위로 오게</b> 접으세요 — 그러면 나머지 세 면이 안쪽과 바닥으로 갑니다</td></tr>
    </table>
    <div class="warn"><b>접기 전에 한 번만 확인하세요.</b> 펼쳤을 때 <b>왼쪽이 2면(비밀 시나리오)</b>,
      <b>오른쪽이 3면(대본)</b>이면 넘김 방향이 맞습니다.
      2면과 3면이 서로 바뀌었거나 글자가 거꾸로 서 있으면 <b>「긴 쪽 넘김」으로 뽑힌 것</b>입니다 —
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
