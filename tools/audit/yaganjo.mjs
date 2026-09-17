// ─────────────────────────────────────────────────────────────────────────────
// 「야간조」 정합성 점검 —  node tools/audit/yaganjo.mjs
//
//   tools/audit/refs.mjs 를 본보기로 삼되, 검사 항목은 다르다. 새벽이슬 판은
//   `chk('목사 폰이 지문으로 열린다', …)` 꼴로 **사실을 하드코딩한 체크리스트**라
//   그대로는 못 쓴다. 야간조에서 값어치 있는 검사는 「세 정본이 같은 말을 하는가」다.
//
//     ① 종이  — docs/야간조-보드게임/카드.md        (잉크로 찍히는 것의 정본)
//     ② 다리  — src/scenarios/yaganjo/cards.js      (손으로 한 번 적은 사상표)
//     ③ 화면  — src/data/yaganjo/                   (QR 뒤 화면의 정본)
//
//   ①과 ③은 서로를 모른다 — 마크다운에는 카드 번호만, 데이터에는 코드만 있다.
//   그 사이에 ②가 있고, ②가 틀리면 **QR 이 엉뚱한 카드를 연다.** 화면에는 멀쩡한
//   단서가 뜨므로 아무도 눈치채지 못한다. 그래서 셋을 삼중으로 맞춰 본다.
//
//   ── 파서를 빌려 쓰지 않는 까닭 ────────────────────────────────────────────
//   tools/docgen/yaganjo/parseCards.mjs 로 읽으면 **파서의 버그를 파서로 검사**하게
//   된다. 파서가 카드 한 장을 놓치면 뽑힌 카드도 108장이고 점검도 108장이라 통과한다.
//   그래서 여기서는 마크다운을 **따로 한 번 더 읽는다**(아래 readCards, 정규식 넷).
//   두 읽기가 다르면 그 차이 자체가 결함이다 — 파서가 있으면 그 대조도 함께 돌린다.
//
//   ── 종료 코드 ────────────────────────────────────────────────────────────
//   결함이 하나라도 있으면 1. 「참고」는 종료 코드를 바꾸지 않는다.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { cardToCode, codeToCard, CARD_COUNT } from '../../src/scenarios/yaganjo/cards.js';
import yaganjo from '../../src/scenarios/yaganjo/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const DOCS = join(ROOT, 'docs', '야간조-보드게임');

const bad = [];      // 결함 — 종료 코드를 1 로 만든다
const skipped = [];  // 돌리지 못한 검사 — 「통과」가 아니므로 따로 적는다
const note = [];     // 참고
const fail = (m) => bad.push(m);
const warn = (m) => skipped.push(m);

const readDoc = (name) => {
  const p = join(DOCS, name);
  if (!existsSync(p)) { fail(`정본이 없다: docs/야간조-보드게임/${name}`); return ''; }
  return readFileSync(p, 'utf8');
};

const cardsMd = readDoc('카드.md');
const ruleMd = readDoc('룰북.md');
const sheetMd = readDoc('진행물.md');

const { evidenceMap, clueCodes } = yaganjo;

// 카드 번호의 생김새. `A1` `X10` `V14` `L6` `공개①`.
// 마크다운 제목에는 카드가 아닌 `### 거울 표기 — …` 같은 절도 섞여 있으므로,
// 「번호처럼 생겼고 가운뎃점이 따라오는 것」만 카드로 본다.
const CARD_NO = '(?:[A-Z]{1,2}\\d{1,2}|공개[①②])';
const setOf = (a) => new Set(a);
const sortCards = (a) => [...a].sort();
const diff = (a, b) => [...a].filter((x) => !b.has(x));

// ── 마크다운을 스스로 한 번 읽는다 ───────────────────────────────────────────
/** `### A1 · 순찰 일지 클립보드  ⭐` 를 카드 하나로 읽는다. 절(節) 본문도 함께 담는다. */
function readCards(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let cur = null;
  const head = new RegExp(`^### (${CARD_NO})\\s*·\\s*(.+?)\\s*$`);
  for (const line of lines) {
    const m = head.exec(line);
    if (m) {
      cur = { no: m[1], title: m[2].replace(/\s*[🔒⚖🔬⭐🔑📱]\s*/g, '').trim(), marks: m[2], body: [] };
      out.push(cur);
      continue;
    }
    if (/^#{1,3} /.test(line)) { cur = null; continue; } // 카드가 아닌 절에 들어섰다
    if (cur) cur.body.push(line);
  }
  return out.map((c) => ({ ...c, body: c.body.join('\n') }));
}

const cards = readCards(cardsMd);
const mdNos = setOf(cards.map((c) => c.no));

// ── ① 삼중 대조 ─────────────────────────────────────────────────────────────
// 카드.md 109 ↔ 사상표 109 ↔ evidenceMap 의 카드 코드 109.
const mapNos = setOf(Object.keys(cardToCode));
const mapCodes = setOf(Object.values(cardToCode));
const dataCodes = setOf(clueCodes);

if (cards.length !== mdNos.size) {
  const dup = cards.map((c) => c.no).filter((n, i, a) => a.indexOf(n) !== i);
  fail(`카드.md 에 같은 번호가 둘 있다: ${[...setOf(dup)].join(' ')}`);
}

// 마크다운이 머리글에서 스스로 선언한 수와도 맞춰 본다 — 「조사 82 + 비조사 27 = 109」.
const declared = /=\s*\*\*총\s*(\d+)\s*장\*\*/.exec(cardsMd)?.[1];
if (declared && Number(declared) !== cards.length) {
  fail(`카드.md 머리글은 총 ${declared}장이라 선언하는데 실제 카드 절은 ${cards.length}개다.`);
}

for (const n of diff(mdNos, mapNos)) fail(`카드.md 의 ${n} 이 사상표(cards.js)에 없다 — QR 로 열 코드가 없다.`);
for (const n of diff(mapNos, mdNos)) fail(`사상표의 ${n} 이 카드.md 에 없다 — 종이에 없는 카드다.`);
for (const c of diff(mapCodes, dataCodes)) fail(`사상표가 가리키는 ${c} 가 evidenceMap 에 없다 — QR 이 빈 화면을 연다.`);
for (const c of diff(dataCodes, mapCodes)) fail(`evidenceMap 의 ${c} 가 사상표에 없다 — 어느 카드의 QR 도 여기로 오지 않는다.`);

if (CARD_COUNT !== cards.length || CARD_COUNT !== dataCodes.size) {
  fail(`장수가 어긋난다 — 카드.md ${cards.length} · 사상표 ${CARD_COUNT} · evidenceMap ${dataCodes.size}`);
}

// ── ② 번호 연속성 ───────────────────────────────────────────────────────────
// 더미마다 1 부터 빠짐없이 이어져야 한다. 한 장이 빠지면 인쇄에서 그 자리가 빈다.
{
  const byPrefix = new Map();
  for (const n of mdNos) {
    const m = /^([A-Z]{1,2})(\d{1,2})$/.exec(n);
    if (!m) continue; // 공개①·공개② 는 번호가 아니다
    if (!byPrefix.has(m[1])) byPrefix.set(m[1], []);
    byPrefix.get(m[1]).push(Number(m[2]));
  }
  for (const [p, nums] of [...byPrefix].sort()) {
    const max = Math.max(...nums);
    const missing = [];
    for (let i = 1; i <= max; i++) if (!nums.includes(i)) missing.push(`${p}${i}`);
    if (missing.length) fail(`${p} 더미에 빠진 번호: ${missing.join(' ')}`);
  }
}

// ── ③ 조합 S1~S8 ────────────────────────────────────────────────────────────
// 종이: `- **재료** — **X3** + **V1**`   화면: unlockedBy:['PIMY-01','DRZS-30']
// 자동 해금 엔진(rules.computeAutoUnlocked)이 AND 로 전부 요구하므로, 한 장이
// 어긋나면 그 특수 단서는 **앱에서 영영 열리지 않는다.** 아무도 오류를 보지 못한다.
const byNo = new Map(cards.map((c) => [c.no, c]));
function materialsOf(no) {
  const line = /^- \*\*재료\*\* — (.+)$/m.exec(byNo.get(no)?.body || '');
  if (!line) return null;
  const found = [];
  for (const m of line[1].matchAll(new RegExp(`\\*\\*([^*]+)\\*\\*`, 'g'))) {
    for (const t of m[1].split(/\s*[·+]\s*/)) {
      const v = t.trim();
      if (new RegExp(`^${CARD_NO}$`).test(v)) found.push(v);
    }
  }
  return found;
}

const S_NOS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
const mdMaterials = new Map();
for (const no of S_NOS) {
  const mats = materialsOf(no);
  if (!mats || mats.length === 0) { fail(`카드.md 의 ${no} 에 「재료」 줄이 없다.`); continue; }
  mdMaterials.set(no, mats);

  const code = cardToCode[no];
  const item = evidenceMap[code];
  if (!item) { fail(`${no}(${code}) 가 evidenceMap 에 없다.`); continue; }
  if (item.type !== '특수') {
    fail(`${no}(${code}) 의 type 이 '${item.type}' 이다 — '특수' 가 아니면 자동 해금 엔진이 건너뛴다.`);
  }
  const want = setOf(mats.map((n) => cardToCode[n]).filter(Boolean));
  const unknown = mats.filter((n) => !cardToCode[n]);
  for (const n of unknown) fail(`${no} 의 재료 ${n} 이 사상표에 없다.`);
  const got = setOf(item.unlockedBy || []);
  const only1 = diff(want, got).map((c) => `${c}(${byCode(c)})`);
  const only2 = diff(got, want).map((c) => `${c}(${byCode(c)})`);
  if (only1.length || only2.length) {
    fail(
      `${no} 재료가 어긋난다 — 종이 [${mats.join(' ')}]` +
        (only1.length ? ` · 화면에 없는 것: ${only1.join(' ')}` : '') +
        (only2.length ? ` · 종이에 없는 것: ${only2.join(' ')}` : '')
    );
  }
}
function byCode(code) { return Object.keys(cardToCode).find((k) => cardToCode[k] === code) || '?'; }

// ── ④ 거울 표기 (카드.md §K) ────────────────────────────────────────────────
// 「A1 이 W2 를 가리키면 W2 도 A1 을 가리킨다」. 한쪽에만 ⭐ 줄이 있으면,
// 그 카드를 뽑은 사람은 자기 손의 카드가 조합 재료인 줄 **끝까지 모른다.**
// 재료 집합과 ⭐ 줄을 단 카드 집합이 같아야 성립한다.
{
  const starred = new Map(); // S번호 → 그 조합을 알리는 ⭐ 줄을 가진 카드들
  for (const c of cards) {
    for (const m of c.body.matchAll(/^- \*\*⭐[^\n]*→\s*\*\*(S\d)\*\*/gm)) {
      if (!starred.has(m[1])) starred.set(m[1], new Set());
      starred.get(m[1]).add(c.no);
    }
  }
  for (const no of S_NOS) {
    const mats = setOf(mdMaterials.get(no) || []);
    const stars = starred.get(no) || new Set();
    const noStar = diff(mats, stars);
    const orphan = diff(stars, mats);
    if (noStar.length) fail(`${no} 의 재료 ${noStar.join(' ')} 에 ⭐ 줄이 없다 — 거울이 한쪽뿐이다.`);
    if (orphan.length) fail(`${orphan.join(' ')} 이 ${no} 를 가리키는데 ${no} 의 재료가 아니다.`);
  }
}

// ── ⑤ 감식 L1~L9 ────────────────────────────────────────────────────────────
// 종이: `> **검체 — W1 조장 텀블러.**`   화면: unlockedBy:['CTBT-25']
// 검체가 어긋나면 그 감식은 영영 목록에 뜨지 않는다 — ③과 같은 조용한 죽음이다.
const L_NOS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'];
for (const no of L_NOS) {
  const body = byNo.get(no)?.body || '';
  const m = new RegExp(`검체\\s*—\\s*(${CARD_NO})\\b`).exec(body);
  if (!m) { fail(`카드.md 의 ${no} 에 「검체 — 」 줄이 없다.`); continue; }
  const sample = m[1];
  const code = cardToCode[no];
  const item = evidenceMap[code];
  if (!item) { fail(`${no}(${code}) 가 evidenceMap 에 없다.`); continue; }
  if (item.type !== '감식') {
    fail(`${no}(${code}) 의 type 이 '${item.type}' 이다 — '감식' 이 아니면 비번 게이트도 자동 해금도 걸리지 않는다.`);
  }
  const want = cardToCode[sample];
  if (!want) { fail(`${no} 의 검체 ${sample} 이 사상표에 없다.`); continue; }
  const got = item.unlockedBy || [];
  if (got.length !== 1 || got[0] !== want) {
    fail(`${no} 검체가 어긋난다 — 종이 ${sample}(${want}) / 화면 [${got.join(' ') || '없음'}]`);
  }
}

// 🔬 가 붙은 카드와 L 의 검체 아홉이 같은 집합인가.
{
  const sampled = setOf(
    L_NOS.map((no) => new RegExp(`검체\\s*—\\s*(${CARD_NO})\\b`).exec(byNo.get(no)?.body || '')?.[1]).filter(Boolean)
  );
  const marked = setOf(cards.filter((c) => c.marks.includes('🔬')).map((c) => c.no));
  const a = diff(marked, sampled);
  const b = diff(sampled, marked);
  if (a.length) fail(`🔬 가 붙었는데 어느 감식의 검체도 아닌 카드: ${sortCards(a).join(' ')}`);
  if (b.length) fail(`감식 검체인데 🔬 가 없는 카드: ${sortCards(b).join(' ')}`);
}

// 🔒 가 붙은 카드는 QR 이 폰 안을 연다 — 화면 쪽에 phone 이 있어야 한다.
for (const c of cards) {
  if (!c.marks.includes('🔒')) continue;
  const item = evidenceMap[cardToCode[c.no]];
  if (item && !item.phone) fail(`${c.no} 에 🔒 이 붙었는데 ${cardToCode[c.no]} 에 phone 이 없다 — QR 이 열 화면이 없다.`);
}

// ── ⑥ Q 게이트가 세 곳에서 같은 말을 하는가 ─────────────────────────────────
// 「이벤트 ② + U4 심야조 명부 뒤에 Q1~Q7 이 한꺼번에 열린다」가 카드.md 머리글 ·
// 룰북 · 진행물 세 곳에 적혀 있다. 한 곳만 고치면 판에서 말이 갈린다.
{
  const has = (md) =>
    md.split(/\r?\n/).some((l) => /이벤트\s*②/.test(l) && /U4|명부/.test(l) && /Q1\s*~\s*Q7|Q 일곱|일곱 장/.test(l));
  for (const [name, md] of [['카드.md', cardsMd], ['룰북.md', ruleMd], ['진행물.md', sheetMd]]) {
    if (md && !has(md)) fail(`${name} 에 Q 게이트(이벤트 ② + U4 → Q1~Q7)를 한 줄로 말하는 자리가 없다.`);
  }
}

// ── ⑦ `_(인쇄 안 함)_` 이 HTML 로 새지 않는가 ───────────────────────────────
// 제작 주석 50줄에는 잠금 네 자리의 출처와 정답 근거가 그대로 적혀 있다.
// 이게 종이에 찍히면 그 판은 그 자리에서 끝난다.
const LEAK = '인쇄 안 함';
{
  const inMd = cardsMd.split(LEAK).length - 1;
  if (inMd === 0) warn(`카드.md 에 「${LEAK}」 주석이 한 줄도 없다 — 검사가 헛돈다.`);
  else note.push(`카드.md 의 제작 주석 ${inMd}줄이 종이로 새지 않아야 한다.`);
}

const genPath = join(ROOT, 'tools', 'docgen', 'yaganjo', 'index.mjs');
if (!existsSync(genPath)) {
  warn('tools/docgen/yaganjo/index.mjs 가 없어 인쇄물 누출 검사를 건너뛴다.');
} else {
  const MD_FILES = { cards: '카드.md', rulebook: '룰북.md', sheets: '진행물.md', persons: '인물시트.md', truth: '진상해설서.md' };
  const md = {};
  let ok = true;
  for (const [k, f] of Object.entries(MD_FILES)) {
    const p = join(DOCS, f);
    if (!existsSync(p)) { ok = false; continue; }
    md[k] = readFileSync(p, 'utf8');
  }
  if (!ok) warn('정본 마크다운이 모자라 인쇄물 누출 검사를 건너뛴다.');
  else {
    try {
      const { genYaganjoDocs } = await import('../docgen/yaganjo/index.mjs');
      const genWarn = [];
      const docs = await genYaganjoDocs(md, { ...yaganjo, recover: yaganjo.secrets?.recover || {} },
        { assetBase: '.', onWarn: (m) => genWarn.push(m) });
      // 표기가 둘이다. `_(인쇄 안 함)_` 줄과, 집필용 머리글(「제작 주석(인쇄하지 않음)」).
      // 뒤엣것은 인용 블록 안에 들어 있기도 해서 줄 단위 필터로는 안 걸린다.
      // 진상해설서는 애초에 정답 책이라 뺀다.
      const SOFT = /제작 주석|제작 메모|집필 메모|인쇄하지 않는|인쇄하지 않음/;
      let leaked = 0;
      for (const d of docs) {
        const n = d.html.split(LEAK).length - 1;
        if (n) { fail(`「${LEAK}」 제작 주석이 ${d.filename} 에 ${n}곳 남았다.`); leaked += n; }
        if (d.filename === '보드_야간조_진상해설서.html') continue;
        const m = SOFT.exec(d.html);
        if (m) {
          leaked += 1;
          fail(`집필용 주석 「${m[0]}」 이 ${d.filename} 에 남았다 — 참가자가 읽을 종이다.`);
        }
      }
      if (!leaked) note.push(`인쇄물 ${docs.length}장에 제작 주석 누출 없음.`);

      // QR 이 붙어야 할 카드에 실제로 붙었는가.
      //   빠져도 종이는 멀쩡해 보인다 — 본문과 「QR」 줄은 그대로 찍히고 그림만 없다.
      //   그러면 그 카드는 **영영 열리지 않는 카드**가 되고, 판에서는 「QR 이 원래 없나 보다」로 읽힌다.
      const wantQr = setOf(
        cards.filter((c) => c.marks.includes('🔒') || /^- \*\*QR\*\*/m.test(c.body)).map((c) => c.no)
      );
      const cardDoc = docs.find((d) => d.filename === '보드_야간조_카드.html');
      if (!cardDoc) warn('카드 판이 나오지 않아 QR 검사를 건너뛴다.');
      else {
        const got = setOf(
          [...cardDoc.html.matchAll(/<div class="qrl">([^<]*)<\/div>/g)]
            .map((m) => codeToCard[m[1].trim()] || m[1].trim())
        );
        const miss = diff(wantQr, got);
        const extra = diff(got, wantQr);
        if (miss.length) {
          fail(
            `QR 이 붙어야 할 카드 ${wantQr.size}장 중 ${miss.length}장에 QR 그림이 없다: ` +
              `${sortCards(miss).join(' ')}`
          );
        }
        if (extra.length) warn(`QR 줄도 🔒 도 없는데 QR 이 붙은 카드: ${sortCards(extra).join(' ')}`);
        if (!miss.length && !extra.length) note.push(`QR ${got.size}장 전량이 제자리에 붙었다.`);
      }

      // 생성기가 스스로 낸 경고 중 **여기서 이미 따로 본 것**은 두 번 적지 않는다.
      // (제작 주석 누출 · QR 누락 — 둘 다 위에서 결함으로 올렸다)
      const MINE = new RegExp(`${LEAK}|QR 그림이 없다|${SOFT.source}`);
      for (const m of genWarn) if (!MINE.test(m)) warn(`생성기 — ${m}`);
    } catch (e) {
      warn(`인쇄물을 만들어 보지 못해 누출 검사를 건너뛴다 — ${e.message}`);
    }
  }
}

// ── ⑧ 파서가 있으면 두 읽기를 맞춰 본다 ─────────────────────────────────────
// 여기와 parseCards.mjs 는 같은 파일을 **따로** 읽는다. 결과가 다르면 둘 중 하나가 틀렸다.
{
  const p = join(ROOT, 'tools', 'docgen', 'yaganjo', 'parseCards.mjs');
  if (!existsSync(p)) {
    warn('tools/docgen/yaganjo/parseCards.mjs 가 없어 두 읽기 대조를 건너뛴다.');
  } else {
    try {
      const mod = await import('../docgen/yaganjo/parseCards.mjs');
      const fn = mod.parseCards || mod.default;
      const parsed = typeof fn === 'function' ? fn(cardsMd) : null;
      const list = Array.isArray(parsed) ? parsed : parsed?.cards;
      if (!Array.isArray(list)) warn('parseCards 가 카드 배열을 돌려주지 않아 대조를 건너뛴다.');
      else {
        const theirs = setOf(list.map((c) => c.no ?? c.number ?? c.card).filter(Boolean));
        const a = diff(mdNos, theirs);
        const b = diff(theirs, mdNos);
        if (a.length) fail(`parseCards 가 놓친 카드: ${sortCards(a).join(' ')}`);
        if (b.length) fail(`parseCards 만 뽑은 카드: ${sortCards(b).join(' ')}`);
        if (!a.length && !b.length) note.push(`두 읽기가 카드 ${theirs.size}장으로 일치.`);
      }
    } catch (e) {
      warn(`parseCards 를 돌리지 못해 대조를 건너뛴다 — ${e.message}`);
    }
  }
}

// ── 출력 ────────────────────────────────────────────────────────────────────
console.log('=== 야간조 정합성 점검 ===');
console.log(`  카드.md ${cards.length}장 · 사상표 ${CARD_COUNT}행 · evidenceMap 카드 ${dataCodes.size}개 (방 ${yaganjo.roomCodes.length}개 별도)`);
console.log(bad.length ? '\n' + bad.map((x) => '  ✗ ' + x).join('\n') : '\n  결함 없음');
if (skipped.length) console.log('\n[건너뛴 것]\n' + skipped.map((x) => '  ⚠ ' + x).join('\n'));
if (note.length) console.log('\n[참고]\n' + note.map((x) => '  · ' + x).join('\n'));
if (bad.length) process.exitCode = 1;
