// ─────────────────────────────────────────────────────────────────────────────
// 야간조 인쇄물 — 마크다운 → 인쇄 HTML 공통부
//
//   야간조의 종이 정본은 `docs/야간조-보드게임/*.md` 다(dp-architecture.md §4-2).
//   룰북 55KB · 진행물 40KB · 인물시트 90KB · 진상해설서 59KB 의 산문을 JS 문자열로
//   옮겨 적지 않고 그대로 조판한다. 그래서 여기 있는 것은 「작은 마크다운 렌더러」와
//   「쪽 나누기」 둘뿐이고, 고유명사는 한 글자도 없다.
//
//   마크다운 라이브러리를 쓰지 않는 이유 — 이 네 문서가 쓰는 문법이 여덟 가지뿐이고,
//   의존성을 하나 넣으면 브라우저 번들(yaganjo-board 진입점)에도 그대로 들어간다.
//
//   ── 지키는 것 ──────────────────────────────────────────────────────────────
//   · fs 를 쓰지 않는다. 문자열만 받아 문자열을 낸다 — Node 와 브라우저에서 같이 돈다.
//   · 이미지 경로는 `/images/yaganjo/` 로 통일한다. 한글 경로가 들어오면 여기서 바꾼다.
//   · `_(인쇄 안 함)_` · 〔근거〕 · 〔제작〕 같은 제작 주석은 인쇄물에 새지 않는다.
//     한 줄이라도 새면 정답 주석이 참가자 손에 간다 — dropNotes() 가 문서를 읽기 전에 턴다.
// ─────────────────────────────────────────────────────────────────────────────
import { BASE_CSS } from '../styles.mjs';

/* ── 0. 문자열 도구 ───────────────────────────────────────────────────────── */

export function esc(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 데이터팩 114곳이 이미 ASCII 경로다. 문서 쪽에 한글 경로가 남아 있어도 여기서 맞춘다.
export function imgPath(src) {
  return String(src || '')
    .replace(/\/images\/(?:%EC%95%BC%EA%B0%84%EC%A1%B0|야간조)\//g, '/images/yaganjo/');
}

// 인쇄물에 남으면 안 되는 제작 주석. 문서마다 표기가 셋이라 셋 다 턴다.
//   `_(인쇄 안 함)_ …` · `〔근거〕 …` · `- **근거** — …`
const NOTE_LINE = /^\s*(?:_\(인쇄\s*안\s*함\)_|〔(?:근거|제작|정본[^〕]*|출처)〕)/;
const NOTE_LIST = /^\s*[-*]\s*\*\*(?:근거|출처|제작|정본 대조)\*\*/;
// 「인쇄하지 않는다」를 제목에 단 절은 통째로 버린다 — 다음 같은 층 제목까지.
const NOTE_HEAD = /^(#{1,6})\s+.*(?:인쇄\s*(?:하지\s*않는다|안\s*함)|집필\s*메모|제작\s*(?:메모|주석))/;

// 제목이 아니라 **덩이**로 들어앉은 제작 주석. 진행물.md 가 이렇게 쓴다 —
//   `> **제작 주석(인쇄하지 않음)** — 이 시트는 A4 한 장 양면 분량에 맞춰 두었다.`
// 한 줄이 아니라 인용 덩이 전체라, 시작 줄만 버리면 나머지가 그대로 인쇄된다.
// 빈 줄이 나올 때까지 함께 버린다.
const NOTE_BLOCK = /^\s*>?\s*\**\s*(?:제작\s*(?:주석|메모)|집필\s*메모|편집\s*메모|인쇄하지\s*않)/;

export function dropNotes(md) {
  const out = [];
  let skipTo = 0;                     // 0 이면 버리는 중이 아니다. 아니면 그 층 이하를 버린다.
  let inBlock = false;                // 인용/문단 덩이 하나를 통째로 버리는 중인가
  for (const line of String(md || '').split(/\r?\n/)) {
    const h = line.match(/^(#{1,6})\s+/);
    if (skipTo) {
      if (h && h[1].length <= skipTo) skipTo = 0;   // 같거나 위 층 제목이 나오면 다시 받는다
      else continue;
    }
    if (inBlock) {
      if (!line.trim() || h) inBlock = false;       // 빈 줄이나 제목에서 덩이가 끝난다
      if (inBlock) continue;
      if (!line.trim()) continue;
    }
    const nh = line.match(NOTE_HEAD);
    if (nh) { skipTo = nh[1].length; continue; }
    if (NOTE_LINE.test(line) || NOTE_LIST.test(line)) continue;
    if (NOTE_BLOCK.test(line)) { inBlock = true; continue; }
    out.push(line);
  }
  return out.join('\n');
}

/* ── 1. 인라인 문법 ───────────────────────────────────────────────────────── */
//   `코드` · **굵게** · *기울임* · [글](주소) · ![alt](그림) · <sub> <sup> <br>
//   순서가 중요하다 — 코드 조각을 먼저 떼어 놓고, 나머지를 통째로 이스케이프한 뒤
//   문법을 적용하고, 마지막에 허용한 태그만 되살린다.

const ALLOWED_TAG = /&lt;(\/?(?:sub|sup|br|b|i|em|strong))\s*\/?&gt;/g;

//   코드 조각을 **쪼개서** 다루면 안 된다 — 이 문서들은 굵게 안에 코드를 넣는다
//   (`**\`P1 · 여권 보관함\`이 낭독되면**`). 쪼개면 여는 `**` 와 닫는 `**` 가 다른 조각에
//   떨어져 굵게가 통째로 안 먹고 별 두 개가 종이에 그대로 찍힌다. 그래서 자리표를 쓴다.
//   자리표는 사유(私用) 영역 글자다 — 원문에 있을 리 없고, 혹시 있으면 먼저 턴다.
//   소스에 보이지 않는 글자를 박아 두지 않으려고 fromCharCode 로 만든다.
const PH_A = String.fromCharCode(0xe000);
const PH_B = String.fromCharCode(0xe001);
const PH_RE = new RegExp(`${PH_A}(\\d+)${PH_B}`, 'g');
const PH_STRIP = new RegExp(`[${PH_A}${PH_B}]`, 'g');

export function inline(src) {
  const code = [];
  let s = String(src ?? '').replace(PH_STRIP, '');
  s = s.replace(/`([^`]+)`/g, (_m, t) => `${PH_A}${code.push(t) - 1}${PH_B}`);
  s = esc(s);

  // 그림 — 인쇄물에서는 alt 를 버리고 그림만 남긴다. 경로는 ASCII 로 맞춘다.
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g,
    (_m, alt, url) => `<img class="mdimg" src="${esc(imgPath(url))}" alt="${alt}">`);
  // 링크 — 종이에는 주소가 쓸모없다. 글자만 남긴다(문서끼리의 .md 링크가 대부분이다).
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?=$|[^*\w])/g, '$1<i>$2</i>');
  s = s.replace(/(^|[^_\w가-힣])_([^_\n]+)_(?=$|[^_\w가-힣])/g, '$1<i>$2</i>');

  s = s.replace(ALLOWED_TAG, '<$1>');
  return s.replace(PH_RE, (_m, i) => `<code>${esc(code[+i])}</code>`);
}

/* ── 2. 블록 문법 ─────────────────────────────────────────────────────────── */
//   제목 · 가로줄 · 인용 · 목록 · 표 · 코드덩이 · 문단. 여덟이 전부다.

const H = /^(#{1,6})\s+(.*)$/;
const HR = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const QUOTE = /^\s*>\s?(.*)$/;
const LI = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const ROW = /^\s*\|(.*)\|\s*$/;
const SEP = /^\s*\|[\s:|-]+\|\s*$/;
const FENCE = /^\s*```/;

function cells(line) {
  return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
}

export function parseBlocks(md) {
  const lines = String(md || '').split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i += 1; continue; }

    if (FENCE.test(line)) {
      const buf = [];
      i += 1;
      while (i < lines.length && !FENCE.test(lines[i])) { buf.push(lines[i]); i += 1; }
      i += 1;
      out.push({ type: 'code', text: buf.join('\n') });
      continue;
    }

    const h = line.match(H);
    if (h) { out.push({ type: 'h', level: h[1].length, text: h[2].trim() }); i += 1; continue; }

    if (HR.test(line)) { out.push({ type: 'hr' }); i += 1; continue; }

    if (QUOTE.test(line)) {
      const buf = [];
      while (i < lines.length && (QUOTE.test(lines[i]) || (buf.length && lines[i].trim() && !H.test(lines[i]) && !HR.test(lines[i]) && !ROW.test(lines[i]) && !LI.test(lines[i])))) {
        const m = lines[i].match(QUOTE);
        buf.push(m ? m[1] : lines[i].trim());
        i += 1;
      }
      out.push({ type: 'quote', blocks: parseBlocks(buf.join('\n')) });
      continue;
    }

    if (ROW.test(line) && i + 1 < lines.length && SEP.test(lines[i + 1])) {
      const head = cells(line);
      const align = cells(lines[i + 1]).map((c) =>
        (/^:.*:$/.test(c) ? 'center' : /:$/.test(c) ? 'right' : 'left'));
      i += 2;
      const rows = [];
      while (i < lines.length && ROW.test(lines[i])) { rows.push(cells(lines[i])); i += 1; }
      out.push({ type: 'table', head, align, rows });
      continue;
    }

    if (LI.test(line)) {
      const items = [];
      const ordered = /^\s*\d/.test(line);
      while (i < lines.length) {
        const m = lines[i].match(LI);
        if (m) {
          items.push({ indent: m[1].replace(/\t/g, '  ').length, text: m[3], sub: [] });
          i += 1;
          continue;
        }
        // 항목에 이어지는 들여쓴 줄은 그 항목의 다음 줄이다.
        if (items.length && lines[i].trim() && /^\s{2,}/.test(lines[i])) {
          items[items.length - 1].text += ` ${lines[i].trim()}`;
          i += 1;
          continue;
        }
        break;
      }
      out.push({ type: 'list', ordered, items });
      continue;
    }

    const buf = [];
    while (i < lines.length && lines[i].trim()
           && !H.test(lines[i]) && !HR.test(lines[i]) && !QUOTE.test(lines[i])
           && !LI.test(lines[i]) && !FENCE.test(lines[i])
           && !(ROW.test(lines[i]) && SEP.test(lines[i + 1] || ''))) {
      buf.push(lines[i].trim());
      i += 1;
    }
    if (buf.length) out.push({ type: 'p', text: buf.join('\n') });
  }
  return out;
}

/* ── 3. 블록 → HTML ──────────────────────────────────────────────────────── */

export function renderBlocks(blocks, opt = {}) {
  const hTag = opt.hTag || ((lv) => `h${Math.min(6, lv)}`);
  let out = '';
  for (const b of blocks) {
    if (b.type === 'h') {
      const t = hTag(b.level);
      out += `<${t}>${inline(b.text)}</${t}>`;
    } else if (b.type === 'hr') {
      out += '<hr class="mdhr">';
    } else if (b.type === 'p') {
      out += `<p>${inline(b.text).replace(/\n/g, '<br>')}</p>`;
    } else if (b.type === 'code') {
      out += `<pre class="mdpre">${esc(b.text)}</pre>`;
    } else if (b.type === 'quote') {
      out += `<blockquote class="mdq">${renderBlocks(b.blocks, opt)}</blockquote>`;
    } else if (b.type === 'list') {
      const tag = b.ordered ? 'ol' : 'ul';
      const base = Math.min(...b.items.map((x) => x.indent));
      let html = '';
      let open = false;
      for (const it of b.items) {
        const deep = it.indent > base + 1;
        if (deep && !open) { html += `<${tag} class="sub">`; open = true; }
        if (!deep && open) { html += `</${tag}>`; open = false; }
        html += `<li>${inline(it.text)}</li>`;
      }
      if (open) html += `</${tag}>`;
      out += `<${tag} class="mdlist">${html}</${tag}>`;
    } else if (b.type === 'table') {
      const bare = b.head.every((c) => !c);   // `| | |` 꼴 — 머리 없는 두 칸 표
      let html = '<table class="mdtable">';
      if (!bare) {
        html += '<tr>' + b.head.map((c, k) =>
          `<th style="text-align:${b.align[k] || 'left'}">${inline(c)}</th>`).join('') + '</tr>';
      }
      for (const r of b.rows) {
        html += '<tr>' + r.map((c, k) =>
          `<td style="text-align:${b.align[k] || 'left'}">${inline(c)}</td>`).join('') + '</tr>';
      }
      out += `${html}</table>`;
    }
  }
  return out;
}

export const md2html = (md, opt) => renderBlocks(parseBlocks(dropNotes(md)), opt);

/* ── 4. 쪽 나누기 ─────────────────────────────────────────────────────────── */
//   build.mjs 의 marginFor() 가 `보드_` 로 시작하는 파일에 여백 0 을 준다. 그래서
//   여백은 종이가 아니라 **각 장(.ypage)이 제 padding 으로** 든다. 연속해서 흘려 보내면
//   두 번째 장부터 위아래 여백이 사라지므로, 글을 미리 장 단위로 끊어 담는다.
//
//   높이는 Node 에서 잴 수 없다 — 글자 수로 어림한다. 어림이 빗나가 넘치는 장은
//   인쇄 직전에 PAGE_FIT 가 줄여 담는다(genBoard.mjs 가 같은 방식이다).

//   눈금은 「본문 한 줄」이다. A4 세로 · 좌우 여백 15mm · 9.6pt 한글이면
//   한 줄에 52자쯤 들어가고, 줄 높이(1.62)가 5.5mm 라 한 면에 47줄쯤 들어간다.
//   값은 어림이 아니라 **실측으로 맞춘 것**이다 — Chrome 으로 뽑아 장마다 채움률을 재고,
//   문단·표·목록 계수를 돌려 가며 80~95% 에 모이도록 조정했다.
const CPL = 52;                               // 한 줄에 들어가는 글자 수
const LINE = { 1: 2.6, 2: 2.5, 3: 1.7, 4: 1.5, 5: 1.4, 6: 1.4 };

export function cost(b) {
  if (b.type === 'h') return LINE[b.level] || 1.5;
  if (b.type === 'hr') return 1.3;
  // 문단 — 원문의 홑줄바꿈이 그대로 <br> 이 되므로 줄마다 따로 센다.
  if (b.type === 'p') {
    return b.text.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / CPL)), 0) + 0.33;
  }
  if (b.type === 'code') return b.text.split('\n').length * 0.82 + 1.2;
  if (b.type === 'quote') return b.blocks.reduce((n, x) => n + cost(x), 1.4);
  if (b.type === 'list') {
    return b.items.reduce((n, it) => n + Math.max(1, Math.ceil(it.text.length / (CPL - 4))) + 0.2, 0.4);
  }
  // 표 — 칸이 좁아 같은 글자 수라도 문단보다 훨씬 높다. 칸 폭으로 나눠 센다.
  if (b.type === 'table') {
    const rows = [b.head, ...b.rows].filter((r) => r.some((c) => c));
    const cols = Math.max(1, ...rows.map((r) => r.length));
    const perCell = Math.max(8, Math.floor(CPL / cols));
    return rows.reduce((n, r) =>
      n + Math.max(1, ...r.map((c) => Math.ceil((c.length || 1) / perCell))) + 0.35, 0.8);
  }
  return 1;
}

// 블록을 장(page)으로 나눈다.
//   breakAt — 이 층 이하의 제목은 언제나 새 장에서 시작한다(보통 2).
//   budget  — 한 장에 담는 「줄」 수. A4 세로 · 여백 14mm · 9.5pt 기준 46 쯤이다.
export function paginate(blocks, { breakAt = 2, budget = 55, softAt = 3 } = {}) {
  const pages = [];
  let page = [];
  let used = 0;
  const hardAt = [];                      // 이 장이 「반드시 새 장」으로 시작했는가
  const flush = (hard) => {
    if (page.length) { pages.push(page); hardAt.push(!!hard); }
    page = []; used = 0;
  };
  let nextHard = true;
  for (const b of blocks) {
    const c = cost(b);
    const hard = b.type === 'h' && b.level <= breakAt;
    const soft = b.type === 'h' && b.level <= softAt;
    if (hard && page.length) { flush(nextHard); nextHard = true; }
    // 제목 바로 뒤에서 끊으면 제목만 남은 장이 생긴다 — 제목이 아닌 블록에서만 끊는다.
    else if (used + c > budget && page.length && (soft || !isAfterHeading(page))) {
      flush(nextHard); nextHard = false;
    }
    page.push(b);
    used += c;
  }
  flush(nextHard);

  // 꼬리 줍기 — 두세 줄만 남아 넘어간 장은 앞 장으로 되돌린다.
  //   어림이 조금만 빗나가도 열 줄짜리 장이 생기고, 서른 장 책자에서 그런 장이 여섯이 나왔다.
  //   조금 넘치는 것은 PAGE_FIT 가 줄여 담으므로, 빈 종이보다 그쪽이 낫다.
  const TAIL = budget * 0.30;
  const ROOM = budget * 1.18;
  for (let i = pages.length - 1; i > 0; i -= 1) {
    if (hardAt[i]) continue;                               // 절이 바뀌는 자리는 그대로 둔다
    const tail = pages[i].reduce((n, b) => n + cost(b), 0);
    if (tail > TAIL) continue;
    const prev = pages[i - 1].reduce((n, b) => n + cost(b), 0);
    if (prev + tail > ROOM) continue;
    pages[i - 1] = pages[i - 1].concat(pages[i]);
    pages.splice(i, 1);
    hardAt.splice(i, 1);
  }
  return pages;
}

function isAfterHeading(page) {
  return page.length > 0 && page[page.length - 1].type === 'h';
}

/* ── 5. 인쇄 CSS ─────────────────────────────────────────────────────────── */
//   BASE_CSS 를 깔고 그 위에 야간조 인쇄물 규칙만 얹는다(BASE_CSS 는 고유명사 0건).
//   BASE_CSS 의 `body{padding:7mm 14mm}` 은 여기서 0 으로 되돌린다 — 여백은 .ypage 가 든다.

export const YAGANJO_CSS = `${BASE_CSS}
/* ── 야간조 공통 ─────────────────────────────────────────────── */
@page { margin: 0; }
body { padding: 0; font-size: 9.6pt; color: #14120f; }
.ypage { padding: 14mm 15mm 12mm; page-break-after: always; position: relative; }
.ypage:last-of-type { page-break-after: auto; }
.ypage > :first-child { margin-top: 0; }
h1 { font-size: 17pt; margin: 0 0 3mm; line-height: 1.25; }
h2 { font-size: 12.5pt; margin: 6mm 0 2mm; padding-bottom: 1.2mm; border-bottom: 1.1px solid #14120f;
     break-after: avoid; }
h3 { font-size: 10.6pt; margin: 4mm 0 1.4mm; color: #3a352c; break-after: avoid; }
h4, h5, h6 { font-size: 9.6pt; margin: 3mm 0 1.2mm; color: #4a4436; break-after: avoid; }
p { margin: 0 0 1.8mm; line-height: 1.62; }
.mdhr { border: none; border-top: 0.3mm solid #ded7c7; margin: 3.5mm 0; }
.mdlist { margin: 0 0 2mm 5mm; padding: 0; line-height: 1.58; }
.mdlist li { margin-bottom: 0.8mm; }
.mdlist .sub { margin: 0.6mm 0 0.6mm 4mm; }
.mdq { margin: 2mm 0 2.4mm; padding: 2mm 3mm; border-left: 0.8mm solid #cfc2a0;
       background: #fbf9f3; font-size: 9.1pt; }
.mdq > :last-child { margin-bottom: 0; }
.mdpre { font-family: Consolas, monospace; font-size: 8.4pt; line-height: 1.5; background: #f4f1ea;
         border: 0.25mm solid #ded7c7; border-radius: 1mm; padding: 2mm 2.6mm; white-space: pre-wrap;
         margin: 0 0 2mm; }
.mdtable { width: 100%; border-collapse: collapse; margin: 2mm 0 2.6mm; font-size: 8.9pt;
           page-break-inside: avoid; }
.mdtable th { background: #efeae0; color: #14120f; font-size: 8.4pt; font-weight: 800;
              letter-spacing: 0; text-transform: none; border: 0.25mm solid #b9b0a0;
              padding: 1.4mm 2mm; }
.mdtable td { border: 0.25mm solid #cfc7b6; padding: 1.4mm 2mm; vertical-align: top;
              line-height: 1.5; font-size: 8.9pt; }
.mdimg { max-width: 100%; }
/* 종이마다 「이건 언제 쓰는 것인가」를 머리에 한 칸. 인쇄물이 여섯 가지라 없으면 헷갈린다. */
.stg { display: inline-block; font-size: 7.4pt; font-weight: 800; letter-spacing: .04em;
       color: #6b551a; background: #fdf7e6; border: 0.3mm solid #cfae5e; border-radius: 1.2mm;
       padding: 0.8mm 2.4mm; margin-bottom: 2.5mm; }
.yfoot { position: absolute; left: 15mm; right: 15mm; bottom: 5mm; font-size: 6.4pt;
         color: #b3aa99; display: flex; justify-content: space-between; }
.note { font-size: 8.4pt; color: #6b6760; line-height: 1.5; }
/* 라운드 트랙 — 말 하나를 올려 두고 라운드마다 한 칸 옮긴다. 인원별로 두 줄. */
.rtWrap { margin: 6mm 0 4mm; }
.rtHead { font-size: 9.5pt; font-weight: 700; margin: 0 0 1.6mm;
          padding-bottom: 0.8mm; border-bottom: 0.5mm solid #14120f; }
table.rt { width: 100%; border-collapse: collapse; table-layout: fixed; }
table.rt td.rtc { border: 0.4mm solid #14120f; padding: 0; height: 34mm;
                  vertical-align: top; text-align: center; }
table.rt td.rtLast { background: #f3efe6; }
.rtN { font-size: 15pt; font-weight: 700; padding: 1.6mm 0 0; }
.rtE { height: 11mm; font-size: 6.6pt; color: #7a6f5c; line-height: 1.25; }
.rtEv { font-size: 12pt; color: #14120f; }
.rtEvT { letter-spacing: 0.2mm; }
.rtBox { margin: 0 1.4mm 1.4mm; height: 13mm; border: 0.25mm dashed #b9b0a0; }
.rtNote { font-size: 7.6pt; color: #4a4437; line-height: 1.55; margin: 2.4mm 0 0; }
.warn { border: 0.4mm solid #8a3b3b; background: #fdf0ee; border-radius: 1.6mm;
        padding: 2.4mm 3mm; margin: 2.5mm 0; font-size: 9pt; color: #6b2d2d; line-height: 1.58; }
`;

/* 종이보다 긴 장만 담기는 데까지 줄인다. 어림이 빗나간 장을 여기서 건진다.
   transform 이 아니라 zoom 을 쓴다 — transform 은 겉모습만 줄이고 장 높이는 그대로라
   쪽 나눔이 안 바뀐다. 일부러 두 면에 걸치게 둔 장(.spill)은 건드리지 않는다. */
export const PAGE_FIT = `<script>
(function () {
  /* 0.80 이었는데 기본 규칙 시트 앞면이 그 바닥에서 297.64mm 가 되어 A4 를 0.64mm 넘겼다.
     넘친 꼬리가 한 면을 더 먹어 「마지막 두 면만 뽑으세요」가 앞면을 통째로 빠뜨렸다.
     0.78 이면 290mm 로 떨어진다. 2차 감사. */
  var MIN = 0.78;
  function H(el) {
    /* 가로 문서는 297 이 아니라 210mm 가 높이다. 장이 스스로 말하게 한다. */
    var mm = (el.getAttribute("data-h") || 297) - 5;
    return mm / 25.4 * 96;
  }
  function fit() {
    var pages = document.querySelectorAll(".ypage:not(.spill)");
    for (var i = 0; i < pages.length; i++) {
      var el = pages[i], lim = H(el);
      el.style.zoom = "";
      el.removeAttribute("data-over");
      if (el.getBoundingClientRect().height <= lim) continue;
      var k = 1;
      for (var n = 0; n < 6; n++) {
        var h = el.getBoundingClientRect().height;
        if (h <= lim) break;
        k = Math.max(MIN, k * lim / h);
        el.style.zoom = k.toFixed(4);
        if (k === MIN) break;
      }
      /* 바닥에서도 안 담기면 조용히 넘어가지 않는다 — 표시를 남긴다.
         이 도구의 가장 위험한 퇴행이 「조용히 성공하는 인쇄」다.
         **인쇄 맥락에서만 뜻이 있다** — 화면에서는 .ypage 가 종이 크기로 묶이지 않아
         전 장이 넘친 것으로 나온다. 그래서 매 회 지우고 다시 단다(위 removeAttribute). */
      if (el.getBoundingClientRect().height > lim) {
        el.setAttribute("data-over", Math.round(el.getBoundingClientRect().height - lim) + "px");
      }
    }
  }
  if (document.readyState === "complete") fit();
  else window.addEventListener("load", fit);
  window.addEventListener("beforeprint", fit);
})();
</script>`;

/* ── 6. 문서 껍데기 ──────────────────────────────────────────────────────── */
//   build.mjs 의 LANDSCAPE 정규식(`^(보드_인물카드|결과제출지)`)은 야간조 파일명을 잡지 못한다.
//   그래서 가로 문서는 스스로 `@page { size: A4 landscape }` 를 선언한다 —
//   paperOf() 가 CSS 를 먼저 읽으므로 그쪽이 이긴다.

export const A4_LANDSCAPE = '@page { size: A4 landscape; margin: 0; }';

export function docShell(title, body, { css = '', script = '', landscape = false } = {}) {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>${esc(title)}</title>
<style>${YAGANJO_CSS}${landscape ? A4_LANDSCAPE : ''}${css}</style>
</head><body>${body}${script}</body></html>`;
}

// 장 하나. data-h 는 PAGE_FIT 가 「이 장의 종이가 몇 mm 인가」를 알 때 쓴다.
export function page(inner, { cls = '', stage = '', h = 297, foot = '' } = {}) {
  return `<div class="ypage ${cls}" data-h="${h}">`
    + (stage ? `<div class="stg">${esc(stage)}</div>` : '')
    + inner
    + (foot ? `<div class="yfoot"><span>${esc(foot)}</span><span></span></div>` : '')
    + '</div>';
}

/* ── 7. parsed / data 에서 값 꺼내기 ─────────────────────────────────────── */
//   파서와 생성기는 다른 파일이라 필드 이름이 어긋날 수 있다. 여기 한 곳에서만 받아 준다.
//   정본 계약은 `parsed.md.<key>` 와 `parsed.cards` 이고, 나머지는 받아 주는 별명이다.

const MD_ALIAS = {
  cards: ['cards', 'card', '카드'],
  rulebook: ['rulebook', 'rules', '룰북'],
  progress: ['progress', 'run', 'sheets', '진행물'],
  persons: ['persons', 'people', 'characters', '인물시트'],
  truth: ['truth', 'solution', '진상해설서', '진상'],
};

export function pickMd(parsed, key) {
  const names = MD_ALIAS[key] || [key];
  const pots = [parsed?.md, parsed?.raw, parsed?.docs, parsed?.sources, parsed];
  for (const pot of pots) {
    if (!pot || typeof pot !== 'object') continue;
    for (const n of names) {
      const v = pot[n];
      if (typeof v === 'string' && v.length > 40) return v;
    }
  }
  return '';
}

export function pickCards(parsed) {
  if (Array.isArray(parsed)) return parsed;
  for (const k of ['cards', 'list', 'items', '카드']) {
    if (Array.isArray(parsed?.[k])) return parsed[k];
  }
  if (Array.isArray(parsed?.cards?.cards)) return parsed.cards.cards;
  return [];
}

// 문서가 통째로 비면 인쇄물이 빈 종이로 나간다. 그것보다 빌드에서 터지는 편이 낫다.
export function needMd(parsed, key, who) {
  const md = pickMd(parsed, key);
  if (!md) {
    throw new Error(
      `[yaganjo/${who}] parsed 에 「${key}」 원문이 없다. `
      + `parsed.md.${key} 에 docs/야간조-보드게임 의 마크다운 원문을 넣어 달라.`
    );
  }
  return md;
}
