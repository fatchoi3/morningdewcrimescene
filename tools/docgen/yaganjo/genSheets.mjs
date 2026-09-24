// ─────────────────────────────────────────────────────────────────────────────
// 야간조 인쇄물 ② — 룰북 · 진행물
//
//   두 문서를 낸다. 종이 정본은 `docs/야간조-보드게임/룰북.md` 와 `진행물.md` 이고,
//   여기서는 그것을 **조판만** 한다(dp-architecture.md §4-2 — 잉크는 마크다운이 정본).
//
//     보드_야간조_룰북.html     A4 세로 · 단면 · 읽는 책자
//     보드_야간조_진행물.html   A4 세로 · 시작 시트 / 이벤트 카드 4장 /
//                               사건 기록판 / 기본 규칙 시트(양면)
//
//   진행물.md 의 `# 3. 형사 시트` 는 여기서 **빼고** genPersons.mjs 가 가져간다 —
//   형사도 반접이 인물 시트이고(A4 가로), 일곱 번째 시트다. 두 곳에 찍으면 7인 모드에서
//   같은 시트가 두 장 나온다.
//
//   파일명이 `보드_` 로 시작해야 build.mjs 의 marginFor() 가 여백 0 을 준다.
//   여백은 종이가 아니라 각 장(.ypage)이 제 padding 으로 든다.
// ─────────────────────────────────────────────────────────────────────────────
import {
  esc, inline, parseBlocks, renderBlocks, dropNotes, paginate, page, docShell,
  PAGE_FIT, needMd,
} from './mdhtml.mjs';

/* ── 공통 도구 ───────────────────────────────────────────────────────────── */

// 문서 머리의 「담당 / 근거 / 문면 원칙」 인용은 집필용 메모다. 종이에 찍지 않는다.
const FRONT = /^\s*(담당|근거|출처|문면\s*원칙|기준)\s*[:：]/;
function dropFrontMatter(blocks) {
  return blocks.filter((b) => {
    if (b.type !== 'quote') return true;
    const first = b.blocks.find((x) => x.type === 'p');
    return !(first && FRONT.test(first.text));
  });
}

// h1 단위로 자른다. 앞머리(제목 없이 시작하는 부분)는 `intro` 로 돌려준다.
function splitH1(blocks) {
  const intro = [];
  const parts = [];
  let cur = null;
  for (const b of blocks) {
    if (b.type === 'h' && b.level === 1) {
      cur = { title: b.text, blocks: [] };
      parts.push(cur);
      continue;
    }
    (cur ? cur.blocks : intro).push(b);
  }
  return { intro, parts };
}

// 어떤 층의 제목으로 다시 자른다. 제목 앞의 것은 `lead` 다.
function splitBy(blocks, level) {
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

// 제목 한 줄 + 본문을 장으로 나눈다. 넘치는 장은 PAGE_FIT 가 줄여 담는다.
function pagesOf(title, blocks, { stage = '', budget = 55, softAt = 3, foot = '', before = '' } = {}) {
  const chunks = paginate(blocks, { breakAt: 2, budget, softAt });
  if (!chunks.length) chunks.push([]);
  return chunks.map((chunk, i) => page(
    (i === 0 ? before : '')
    + (i === 0 && title ? `<h1>${inline(title)}</h1>` : '')
    + renderBlocks(chunk),
    { stage: i === 0 ? stage : '', foot },
  )).join('');
}

/* ── ① 룰북 ─────────────────────────────────────────────────────────────── */
export function genRulebook(parsed, data = {}) {
  const md = needMd(parsed, 'rulebook', 'genSheets');
  const blocks = dropFrontMatter(parseBlocks(dropNotes(md)));
  const { intro, parts } = splitH1(blocks);

  // 룰북은 h1 이 제목 하나뿐이고 절이 h2 다. 절마다 새 장에서 시작한다.
  const title = parts.length ? parts[0].title : '「야간조」 룰북';
  const flat = [...intro, ...parts.flatMap((p, i) => (i ? [{ type: 'h', level: 2, text: p.title }] : []).concat(p.blocks))];
  const { lead, parts: secs } = splitBy(flat, 2);

  // 표지 — 서른 장이 넘는 책자다. 차례가 없으면 판 중에 규칙을 못 찾는다.
  // 절 제목이 이미 「1.」로 시작한다 — 목록 번호를 또 붙이면 「1. 1. 이 게임의 성격」이 된다.
  const toc = secs.length
    ? `<h2 class="tocHd">차례</h2><ul class="toc">${secs.map((s) =>
        `<li>${inline(s.title)}</li>`).join('')}</ul>`
    : '';
  let body = page(
    `<h1>${inline(title)}</h1>${renderBlocks(lead)}${toc}
     <div class="warn"><b>인쇄</b> — A4 세로 · <b>단면</b>이면 됩니다. 이 책자는 한 권만 있으면 되고,
       판 옆에 펴 두었다가 규칙이 헷갈릴 때 찾습니다. 1라운드에 필요한 것만 추린
       <b>「기본 규칙 시트」</b>는 진행물에 따로 있습니다 — 그쪽을 사람 수만큼 뽑으세요.</div>`,
    { stage: '준비할 때 한 번 · 판 옆에 둡니다', foot: '야간조 · 룰북' },
  );
  for (const s of secs) {
    body += pagesOf(s.title, s.blocks, { foot: '야간조 · 룰북' });
  }

  return {
    filename: '보드_야간조_룰북.html',
    html: docShell('야간조 — 룰북', body, { css: RULE_CSS, script: PAGE_FIT }),
  };
}

const RULE_CSS = `
.ypage { padding: 15mm 16mm 12mm; }
h1 { border-bottom: 1.4px solid #14120f; padding-bottom: 2mm; }
.tocHd { margin-top: 7mm; }
.toc { columns: 2; column-gap: 8mm; margin: 2mm 0 0 2mm; padding: 0; font-size: 9.4pt;
       line-height: 1.75; list-style: none; }
.toc li { break-inside: avoid; }
`;

/* ── ② 진행물 ───────────────────────────────────────────────────────────── */
//   다섯 부분이 성격이 다르다 — 읽는 것(시작 시트) · 오리는 것(이벤트 카드) ·
//   적는 것(사건 기록판) · 펴 두는 것(기본 규칙 시트). 각각 다르게 조판한다.

const IS_START = /^\s*1\./;
const IS_EVENT = /^\s*2\./;
const IS_DETECTIVE = /^\s*3\./;          // ← genPersons.mjs 로 간다
const IS_RECORD = /^\s*4\./;
const IS_BASIC = /^\s*5\./;

export function genProgress(parsed, data = {}) {
  const md = needMd(parsed, 'progress', 'genSheets');
  const blocks = dropFrontMatter(parseBlocks(dropNotes(md)));
  const { parts } = splitH1(blocks);

  const numbered = /^\s*\d+\./;
  let body = '';
  for (const p of parts) {
    if (IS_DETECTIVE.test(p.title)) continue;                    // 인물 시트로 간다
    if (IS_START.test(p.title)) body += startSheet(p);
    else if (IS_EVENT.test(p.title)) body += eventCards(p) + roundTrack();
    else if (IS_RECORD.test(p.title)) body += recordBoard(p);
    else if (IS_BASIC.test(p.title)) body += basicSheet(p);
    else if (!numbered.test(p.title)) body = coverPage(p, parts) + body;   // 문서 제목 → 표지
    else body += pagesOf(p.title, p.blocks, { foot: '야간조 · 진행물' });
  }

  return {
    filename: '보드_야간조_진행물.html',
    html: docShell('야간조 — 진행물', body, { css: RUN_CSS, script: PAGE_FIT }),
  };
}

// 표지 — 이 묶음에 무엇이 몇 장 들어 있고, 어느 것을 어떻게 뽑는지.
//   진행물은 성격이 다른 종이 넷이 한 파일에 들어 있어서, 이 한 장이 없으면
//   「사람 수만큼 뽑을 것」과 「한 장만 뽑을 것」이 섞인 채로 나온다.
function coverPage(part, parts) {
  const has = (re) => parts.some((p) => re.test(p.title));
  return page(
    `<h1>${inline(part.title)}</h1>${renderBlocks(part.blocks)}
     <table class="mdtable">
       <tr><th style="width:26%">이 안에 있는 것</th><th style="width:16%">인쇄</th><th>뽑는 수</th></tr>
       ${has(IS_START) ? '<tr><td><b>시작 시트</b> — 사건 브리핑</td><td>A4 세로 · 단면</td>'
         + '<td>한 벌. 한 사람이 한 절씩 소리 내어 돌려 읽습니다</td></tr>' : ''}
       ${has(IS_EVENT) ? '<tr><td><b>이벤트 카드 4장</b></td><td>A4 세로 · 단면</td>'
         + '<td>한 벌(넉 장). <b>오려서 글이 안으로 오게 접습니다</b> — 접으면 바깥이 백지라, 라운드 트랙 ①②③④ 자리에 그대로 얹어 두면 아무것도 안 보입니다</td></tr>' : ''}
       ${has(IS_EVENT) ? '<tr><td><b>라운드 트랙</b></td><td>A4 세로 · 단면</td>'
         + '<td>한 벌. <b>인원에 맞는 줄 하나만</b> 씁니다 — 여섯이면 6칸, 일곱이면 5칸</td></tr>' : ''}
       ${has(IS_RECORD) ? '<tr><td><b>사건 기록판</b></td><td>A4 세로 · 단면</td>'
         + '<td>한 벌. 손으로 적는 종이라 <b>여유 있게 뽑아 두면 좋습니다</b></td></tr>' : ''}
       ${has(IS_BASIC) ? '<tr><td><b>기본 규칙 시트</b></td><td>A4 <b>양면</b></td>'
         + '<td><b>사람 수만큼.</b> 1라운드가 훨씬 빨라집니다</td></tr>' : ''}
     </table>
     <div class="warn"><b>먼저 뽑을 것이 둘 있습니다.</b> <b>진상 해설서</b>와 <b>인물 시트</b>는
       남의 비밀과 답이 들어 있어 <b>혼자 있을 때</b> 뽑아야 합니다. 그 둘을 먼저 치우고 이 묶음을 뽑으세요.<br>
       <b>형사(재해조사관) 시트는 여기 없습니다</b> — 인물 시트 묶음의 마지막 장입니다. 일곱이 할 때만 씁니다.</div>`,
    { stage: '제일 먼저 · 뽑는 사람만', foot: '야간조 · 진행물' },
  );
}

// 1. 시작 시트 — 한 사람이 한 절씩 소리 내어 돌려 읽는다. 읽는 물건이라 그냥 흘려 담는다.
function startSheet(part) {
  return pagesOf(part.title, part.blocks, {
    stage: '준비 순서 5 · 전원이 돌려 읽습니다',
    foot: '야간조 · 시작 시트',
  });
}

// 2. 이벤트 카드 4장 — 한 장에 한 카드. 앞면과 뒷면을 위아래로 앉히고 가운데를 접는다.
//
//   **골접기**(인쇄된 면이 안으로)다. 단면 인쇄라 접으면 **바깥 두 면이 백지**가 되고,
//   그래서 「뒷면이 보이게 얹어 두고 미리 읽지 마세요」가 실제로 지켜진다.
//
//   한때 산접기(인쇄면이 바깥으로)였다. 그러면 접어도 바깥 두 면이 전부 본문이고,
//   위를 향하는 것이 하필 읽어서는 안 되는 쪽이 된다 — 이벤트 ③ 뒷면, 즉 이 판의
//   물리 법칙(정문만 얼굴이 식별된다 · 자동문은 안전모와 어깨만 · 갈림은 검은 화면)이
//   **준비 단계부터 탁자에 펴진 채로** 시작됐다. 2차 감사가 잡았다.
//   새벽이슬(tools/docgen/genBoard.mjs)은 한 면만 인쇄해 백지가 위로 왔는데,
//   야간조가 면을 둘로 늘리면서 그 백지를 잃고 문구만 그대로 물려받은 것이었다.
//
//   골접기라 펼치면 앞면과 뒷면이 위아래로 한 번에 드러난다 — 위부터 읽으면 순서가 맞다.
function eventCards(part) {
  const { lead, parts } = splitBy(part.blocks, 2);
  let out = page(
    `<h1>${inline(part.title)}</h1>${renderBlocks(lead)}
     <div class="warn"><b>오리고 접는 법</b> — 다음 넉 장이 이벤트 카드입니다. 한 장에 한 카드이고,
       <b>바깥 테두리를 따라 오려</b> 가운데 점선을 <b>글이 안으로 오게</b> 접습니다.
       접으면 <b>바깥 두 면이 백지</b>라 아무것도 안 보입니다.<br>
       접은 넉 장을 라운드 트랙의 ①②③④ 자리에 그대로 얹어 두고,
       그 라운드가 끝나면 <b>펼쳐서 위(앞면)부터 아래(뒷면)로</b> 읽습니다.</div>`,
    { stage: '준비할 때 오려 둡니다', foot: '야간조 · 이벤트 카드' },
  );

  for (const ev of parts) {
    const { lead: when, parts: faces } = splitBy(ev.blocks, 3);
    const face = (name) => faces.find((f) => new RegExp(`^${name}`).test(f.title));
    const fr = face('앞면');
    const bk = face('뒷면');
    const other = faces.filter((f) => f !== fr && f !== bk);
    const box = (label, sub, blocks) => `<div class="evFace">
      <div class="evLbl">${esc(label)}${sub ? ` <span>${inline(sub)}</span>` : ''}</div>
      <div class="evBody">${renderBlocks(blocks || [])}</div></div>`;
    const sub = (f, name) => (f ? String(f.title).replace(new RegExp(`^${name}\\s*[—-]?\\s*`), '') : '');

    out += page(
      `<div class="evCard">
        <div class="evTop"><div class="evTitle">${inline(ev.title)}</div>
          <div class="evWhen">${renderBlocks(when)}</div></div>
        ${box('앞면', sub(fr, '앞면'), fr?.blocks)}
        <div class="evFold">— 여기를 접습니다 (글이 안으로) —</div>
        ${box('뒷면', sub(bk, '뒷면'), [...(bk?.blocks || []), ...other.flatMap((o) => [{ type: 'h', level: 4, text: o.title }, ...o.blocks])])}
      </div>`,
      { cls: 'evPage', foot: '야간조 · 이벤트 카드' },
    );
  }
  return out;
}

// 3. 라운드 트랙 — 룰북이 「인원별로 둘이 인쇄된다」고 못 박은 종이.
//
//   한동안 그 약속만 있고 종이가 없었다(2차 감사). 준비를 맡은 사람은 체크리스트 한 줄을
//   영영 못 채우고, 이벤트 카드 넉 장을 얹을 ①②③④ 자리가 없어 6인 6칸 / 7인 5칸이라는
//   **인원별 차이가 종이에서 사라졌다.** 새벽이슬은 genBoard.mjs 가 같은 면을 그린다.
//
//   이벤트는 여섯이든 일곱이든 1·2·3·4 라운드 끝에 같이 터진다 — 7인은 5라운드뿐이라
//   ④ 다음이 곧 마지막 라운드다. 그 촉박함이 트랙에 눈으로 보여야 한다.
function roundTrack() {
  const cell = (n, ev, last) => `<td class="rtc${last ? ' rtLast' : ''}">
      <div class="rtN">${n}</div>
      <div class="rtE">${ev ? `<span class="rtEv">${ev}</span><br><span class="rtEvT">이벤트 카드</span>` : ''}</div>
      <div class="rtBox"></div></td>`;
  const row = (label, cols, evs) => `<div class="rtWrap">
      <div class="rtHead">${label}</div>
      <table class="rt"><tr>${Array.from({ length: cols }, (_, i) =>
        cell(i + 1, evs[i] || '', i === cols - 1)).join('')}</tr></table></div>`;
  return page(
    `<h1>라운드 트랙</h1>
     <p>쓰는 쪽 하나만 씁니다. <b>말 하나를 1칸에 올려</b> 두고 라운드가 끝날 때마다 한 칸 옮깁니다.</p>
     <div class="warn"><b>이벤트 카드 넉 장은 ①②③④ 칸에 접은 채로 얹어 둡니다.</b>
       글이 안으로 오게 접혀 있어 바깥은 백지입니다. 그 라운드가 끝나면 <b>펼쳐서 앞면 → 뒷면</b>으로 읽습니다.</div>
     ${row('여섯이서 — 6라운드', 6, ['①', '②', '③', '④'])}
     ${row('일곱이서(재해조사관 포함) — 5라운드', 5, ['①', '②', '③', '④'])}
     <p class="rtNote"><b>일곱이서 하면 ④ 다음이 곧 마지막 라운드입니다.</b>
       2차 부검이 판을 뒤집고 나서 손에 남는 것이 한 라운드뿐이라, 여섯이서 할 때보다 훨씬 급합니다.
       그 차이가 이 두 줄의 전부입니다.</p>
     <p class="rtNote">아래 빈 칸은 그 라운드에 <b>무엇이 열렸는지</b> 적는 자리입니다 —
       더미가 열리거나 카드가 섞여 들어온 것을 한 줄로 적어 두면 나중에 되짚기 쉽습니다.</p>`,
    { stage: '준비 순서 1 · 판 가운데에 폅니다', foot: '야간조 · 라운드 트랙' },
  );
}

// 4. 사건 기록판 — 손으로 적는 종이다. 칸마다 한 장씩 준다(⑵ 동쪽 인원은 줄이 길다).
function recordBoard(part) {
  const { lead, parts } = splitBy(part.blocks, 2);
  // 머리말만 있는 장은 4분의 1도 못 채운다 — 첫 칸과 같은 장에 얹는다.
  const head = `<h1>${inline(part.title)}</h1>${renderBlocks(lead)}`;
  let out = '';
  parts.forEach((sec, i) => {
    out += pagesOf(i === 0 ? '' : sec.title, sec.blocks, {
      budget: 50,
      stage: i === 0 ? '판 옆에 펴 두고 라운드마다 적습니다' : '',
      foot: '야간조 · 사건 기록판',
      before: i === 0 ? `${head}<h2>${inline(sec.title)}</h2>` : '',
    });
  });
  if (!parts.length) out = page(head, { foot: '야간조 · 사건 기록판' });
  return out;
}

// 5. 기본 규칙 시트 — A4 한 장 양면. 앞면과 뒷면이 각각 한 면에 들어가야 한다.
function basicSheet(part) {
  const { lead, parts } = splitBy(part.blocks, 2);
  let out = '';
  if (lead.length) {
    out += page(`<h1>${inline(part.title)}</h1>${renderBlocks(lead)}
      <div class="warn"><b>다음 두 면 — 이 묶음의 마지막 두 면 — 이 이 시트입니다.</b>
        그 두 면만 따로 <b>A4 한 장에 양면</b>으로 뽑으면 한 장이 됩니다(넘김 방향은 상관없습니다).
        단면으로 뽑아도 되고, 그러면 두 장이 될 뿐입니다.<br>
        <b>사람 수만큼</b> 뽑아 각자 앞에 두면 1라운드가 훨씬 빨라집니다 —
        규칙을 물으러 룰북을 뒤지는 일이 거의 없어집니다.</div>`,
      { stage: '사람 수만큼 뽑습니다', foot: '야간조 · 기본 규칙 시트' });
  }
  for (const sec of parts) {
    // 한 면에 담아야 하는 종이다 — 쪼개지 않고 한 장에 넣고, 넘치면 PAGE_FIT 가 줄인다.
    out += page(
      `<h1>${inline(sec.title)}</h1>${renderBlocks(sec.blocks)}`,
      { cls: 'basic', stage: '기본 규칙 시트', foot: '야간조 · 기본 규칙 시트' },
    );
  }
  return out;
}

const RUN_CSS = `
/* 이벤트 카드 — A4 한 장이 카드 한 장이다. 위아래 두 칸 사이가 접는 선이다. */
.evPage { padding: 10mm 12mm; }
.evCard { border: 0.8mm solid #b8912c; border-radius: 3mm; padding: 5mm 6mm;
          min-height: 270mm; display: flex; flex-direction: column; background: #fffdf6; }
.evTop { border-bottom: 0.5mm solid #e0d3a8; padding-bottom: 2.5mm; margin-bottom: 3mm; }
.evTitle { font-size: 14pt; font-weight: 800; color: #6b551a; line-height: 1.3; }
.evWhen p { font-size: 8.6pt; color: #8a7a45; margin: 1mm 0 0; }
.evWhen blockquote { margin: 1mm 0 0; padding: 0; border: none; background: none; font-size: 8.6pt;
                     color: #8a7a45; }
.evFace { flex: 1; display: flex; flex-direction: column; }
.evLbl { font-size: 8pt; font-weight: 800; letter-spacing: .08em; color: #b8912c;
         border-bottom: 0.3mm dashed #e0d3a8; padding-bottom: 1mm; margin-bottom: 2mm; }
.evLbl span { font-weight: 600; color: #8a7a45; letter-spacing: 0; }
.evBody { font-size: 10pt; line-height: 1.66; }
.evBody p { margin: 0 0 2mm; }
.evBody h4 { font-size: 10pt; margin: 3mm 0 1mm; }
.evFold { margin: 4mm 0; text-align: center; font-size: 7pt; color: #a09880;
          border-top: 0.4mm dashed #c9bb8a; padding-top: 1.5mm; }
/* 기본 규칙 시트 — 한 면에 담는다. 글이 많아 본문을 한 단계 줄여 둔다. */
.basic { font-size: 8.8pt; }
.basic h1 { font-size: 15pt; }
.basic h2 { font-size: 10.6pt; margin: 3.5mm 0 1.4mm; }
.basic h3 { font-size: 9.4pt; margin: 2.8mm 0 1mm; }
.basic p, .basic .mdlist { line-height: 1.5; }
.basic .mdtable td, .basic .mdtable th { padding: 1mm 1.6mm; font-size: 8.2pt; }
`;

/* ── 두 문서를 한 번에 ───────────────────────────────────────────────────── */
//   index.mjs 가 `[...genSheets(parsed, data)]` 로 받아 쓰도록 배열을 돌려준다.
//   낱개가 필요하면 genRulebook / genProgress 를 쓴다 — 둘 다 (parsed, data) => {filename, html}.
export function genSheets(parsed, data = {}) {
  return [genRulebook(parsed, data), genProgress(parsed, data)];
}

export default genSheets;
