// ─────────────────────────────────────────────────────────────────────────────
// 「야간조」 인쇄물 생성기 — 조립부
//
//   genYaganjoDocs(mdSources, data, opts) → [{ filename, html }]
//
//   genBoardDocs(data, opts) 와 **같은 반환형**이다. 앞에 mdSources 가 하나 더 붙는
//   까닭은 §4-2 의 경계 때문이다 — **종이에 잉크로 찍히는 것은 마크다운이 정본이고,
//   QR 뒤 화면은 evidenceMap 이 정본이다.** 새벽이슬은 보드판 자체가 코드로 적혀
//   있어서(genBoard.mjs 1,898줄) data 하나면 됐지만, 야간조의 산문 355KB 는
//   docs/야간조-보드게임/*.md 에 있고 그것을 JS 문자열로 옮겨 적는 순간
//   `_(인쇄 안 함)_` 제작 주석과 조합 줄의 거울 표기와 인물 시트의 접지 면 구분이
//   통째로 사라진다. 그래서 마크다운을 **인자로** 받는다.
//
//   ── 같은 정본, 두 경로 ────────────────────────────────────────────────────
//   docs/ 는 public/ 이 아니라 서빙되지 않는다. 두 호출자가 같은 파일을 다르게 읽는다.
//
//     Node    : readFileSync('docs/야간조-보드게임/카드.md', 'utf8')   ← buildY.mjs
//     브라우저: import cardsMd from '…/카드.md?raw'                     ← yaganjo-board.html
//
//   읽는 방법이 둘일 뿐 정본은 하나다. src/board/main.js 머리말이 자랑하는 불변식과 같다.
//
//   ── 생성기 넷의 계약 ──────────────────────────────────────────────────────
//   네 모듈이 전부 **같은 세 인자** `(parsed, data, opts)` 를 받는다.
//
//     genSheets (parsed, data, opts) → [진행물, 룰북]   (한 모듈이 두 장을 낸다)
//     genCards  (parsed, data, opts) → [카드]
//     genPersons(parsed, data, opts) → [인물시트]
//     genTruthY (parsed, data, opts) → [진상해설서]
//
//   `parsed` 는 **마크다운 원문과 이미 읽어 둔 것을 함께 담은 묶음**이다.
//
//     parsed.md    = { cards, rulebook, sheets, progress, persons, truth }  원문 그대로
//     parsed.cards = parseCards(md.cards)   카드 109장. 여기서 **한 번만** 읽는다
//
//   카드.md 92KB 를 생성기마다 다시 읽으면 같은 파서 버그가 네 번 난다. 조립부가
//   한 번 읽어 나눠 준다. 원문을 그대로 들려 보내는 까닭은 카드 말고 다른 절을
//   보는 생성기(룰북·진행물·인물시트·해설서)가 자기 방식으로 잘라 읽기 때문이고,
//   mdhtml.mjs 의 `needMd(parsed, key, who)` 가 그 자리에서 없는 원문을 잡는다.
//   `progress` 는 `sheets` 의 별명이다 — 파서 쪽 MD_ALIAS 가 둘 다 받는다.
//
//   하나를 돌려주든 배열을 돌려주든 받는다. 이름 있는 export(genCards 등)와
//   default export 둘 다 잡는다 — 그 밖의 이름은 잡지 않는다. 시끄럽게 죽는 편이
//   「문서 한 장이 조용히 빠진 ZIP」보다 낫다.
//
//   ── 파일명이 규칙이다 ─────────────────────────────────────────────────────
//   전부 `보드_` 로 시작한다. tools/docgen/build.mjs 의 marginFor() 가 파일명 접두사로
//   여백을 분기하기 때문이다(`보드_` → 0mm). `야간조_보드_…` 로 지으면 그 분기가
//   false 라 14mm 가 한 번 더 먹고 **카드가 63×88mm 로 안 나온다**(dp-architecture §4-3 함정 1).
//   buildY.mjs 는 자기 여백 규칙을 따로 갖지만, 파일명은 두 경로에서 같게 둔다.
//   가로 문서는 파일명이 아니라 **문서 스스로 `@page { size: A4 landscape }`** 를
//   선언해야 한다 — LANDSCAPE 정규식이 새벽이슬 파일명만 알기 때문이다.
// ─────────────────────────────────────────────────────────────────────────────
import QRCode from 'qrcode';
import { cardToCode, codeToCard, CARD_COUNT } from '../../../src/scenarios/yaganjo/cards.js';
import { parseCards } from './parseCards.mjs';

/** 마크다운 묶음이 반드시 가져야 하는 키와, 그 키가 어느 파일인가. */
export const MD_KEYS = {
  cards: 'docs/야간조-보드게임/카드.md',
  rulebook: 'docs/야간조-보드게임/룰북.md',
  sheets: 'docs/야간조-보드게임/진행물.md',
  persons: 'docs/야간조-보드게임/인물시트.md',
  truth: 'docs/야간조-보드게임/진상해설서.md',
};

/** 인쇄 순서. 파일 목록만 봐도 뭘 먼저 뽑을지 알 수 있게 번호는 호출자가 붙인다. */
export const DOC_ORDER = [
  '보드_야간조_진행물.html',
  '보드_야간조_룰북.html',
  '보드_야간조_카드.html',
  '보드_야간조_인물시트.html',
  '보드_야간조_진상해설서.html',
];

/** 문서 한 장이 무엇이고 어떻게 뽑는가. 키트 페이지와 buildY 가 같은 문장을 쓴다. */
export const DOC_NOTES = {
  '보드_야간조_진행물.html':
    '먼저 이렇게 뽑습니다 · 시작 시트 · 기본 규칙 · 사건 기록판 · 이벤트 카드 넷. A4 세로',
  '보드_야간조_룰북.html':
    '진행자 없이 굴리는 규칙 전량. A4 세로 — 한 부만 뽑아 판 옆에 둡니다',
  '보드_야간조_카드.html':
    '카드 109장(조사 82 · 감식 9 · 특수 8 · 대조 7 · 태블릿 1 · 공개 게시물 2). 63×88mm 3×3. 양면 · 긴 쪽 넘김',
  '보드_야간조_인물시트.html':
    '한 사람에 A4 가로 한 장. 양면 · 짧은 쪽 넘김으로 뽑아 안쪽이 마주 보게 세로로 접습니다. 6인이면 형사(재해조사관) 시트는 빼세요',
  '보드_야간조_진상해설서.html':
    '정답이 들어 있다. 봉투에 넣어 두고 끝나기 전엔 열지 말 것',
};

/** ZIP 안 「읽어보세요.txt」. 키트 페이지와 Node 판이 같은 글을 쓴다. */
export const KIT_README = `야간조 — 보드게임 인쇄물
6명(7인 가능) · 진행자 없음 · 두 시간 안팎

[인쇄 요령]
- HTML 을 브라우저로 열고 Ctrl+P.
- "배경 그래픽" 을 반드시 켜세요. 안 켜면 더미 색과 번호 배경이 사라집니다.
- 보드_야간조_카드 는 양면 · 긴 쪽 넘김으로 뽑으세요.
  세로 판이라 뒷면을 행마다 좌우로 뒤집어 뒀습니다 — 짧은 쪽으로 넘기면 앞뒤가 어긋납니다.
- 보드_야간조_인물시트 는 반대로 양면 · 짧은 쪽 넘김입니다. 가로 판이라 그렇습니다.
  뽑아서 가운데를 세로로 접으면 네 면짜리 책자가 됩니다.
- 전부 A4 입니다.

[주의]
- 보드_야간조_진상해설서 에는 정답이 들어 있습니다. 봉투에 넣어 두고 끝나기 전엔 열지 마세요.
- 인물 시트는 각자에게 따로 나눠 주세요. 접힌 안쪽은 본인만 봅니다.
- 🔒 카드의 QR 은 폰·태블릿 화면으로 갑니다. 인터넷이 되는 자리에서 하세요.
`;

// ── 생성기 넷 ────────────────────────────────────────────────────────────────
const GENERATORS = [
  { key: 'sheets', name: 'genSheets', file: './genSheets.mjs', load: () => import('./genSheets.mjs') },
  { key: 'cards', name: 'genCards', file: './genCards.mjs', load: () => import('./genCards.mjs') },
  { key: 'persons', name: 'genPersons', file: './genPersons.mjs', load: () => import('./genPersons.mjs') },
  { key: 'truth', name: 'genTruthY', file: './genTruthY.mjs', load: () => import('./genTruthY.mjs') },
];

// 종이에 새면 안 되는 문자열. 카드.md 에 50줄 있다.
//   이게 참가자 손에 가면 그 자리에서 정답이 샌다 — 「§C 문서번호 1207 을 여기에
//   인쇄한다. A6 폰 네 자리의 출처는…」 같은 줄이다. 그래서 경고가 아니라 결함이다.
const LEAK = '인쇄 안 함';
// 새면 곤란하지만 즉사는 아닌 것 — 집필용 머리글. 진상해설서는 애초에 정답 책이라 뺀다.
const SOFT_LEAK = /제작 주석|제작 메모|집필 메모|인쇄하지 않는|인쇄하지 않음/;
const TRUTH_DOC = '보드_야간조_진상해설서.html';

// ── QR ───────────────────────────────────────────────────────────────────────
// 🔒 카드의 QR 은 그 단서의 화면으로 간다. 카메라(V)만 갈 곳이 다르다.
//   `/yaganjo-clue#<코드>`  · V 는 `/yaganjo-cctv#<코드>`
// 두 진입점은 2단계에 만든다(dp-architecture §3-3). 코드는 그 전에 이미 확정이라
// 지금 뽑은 종이가 나중에 그대로 맞는다 — 카드를 다시 뽑을 일이 없다.
//
// **주소를 짓는 자리를 여기 하나로 둔다.** genCards 는 QR 그림이 없을 때 같은 주소를
// 글자로 찍는데, 규칙이 두 곳에 있으면 그림과 글자가 다른 곳을 가리키게 된다.
const qrPathOf = (no) => (/^V\d/.test(String(no)) ? 'yaganjo-cctv' : 'yaganjo-clue');
const makeQrUrl = (code, no, siteUrl) =>
  `${String(siteUrl || '').replace(/\/$/, '')}/${qrPathOf(no)}#${code}`;

/** 코드마다 QR SVG 를 뽑는다. 생성기는 자기가 필요한 것만 집어 쓴다. */
async function buildQrMap(siteUrl, warn) {
  const out = {};
  try {
    for (const [no, code] of Object.entries(cardToCode)) {
      const svg = await QRCode.toString(makeQrUrl(code, no, siteUrl), {
        type: 'svg', margin: 1, errorCorrectionLevel: 'M',
      });
      // 인라인으로 넣을 것이라 XML 선언은 뗀다.
      out[code] = svg.replace(/^<\?xml[^>]*\?>\s*/, '');
    }
  } catch (e) {
    warn(`QR 을 만들지 못했다 — ${e.message}. 카드에는 주소가 글자로 찍힌다.`);
  }
  return out;
}

/** mdSources 를 확인한다. 없는 키를 「빈 문자열」로 넘기면 문서가 빈 채로 나온다. */
function requireSources(mdSources) {
  if (!mdSources || typeof mdSources !== 'object') {
    throw new Error(
      '[yaganjo/docgen] mdSources 가 없다. ' +
        `{ ${Object.keys(MD_KEYS).join(', ')} } 문자열 묶음이 필요하다 — ` +
        'Node 는 readFileSync 로, 브라우저는 ?raw 로 넣는다.'
    );
  }
  const missing = [];
  for (const [key, path] of Object.entries(MD_KEYS)) {
    const v = mdSources[key];
    if (typeof v !== 'string' || v.trim() === '') missing.push(`${key}(${path})`);
  }
  if (missing.length) {
    throw new Error(`[yaganjo/docgen] mdSources 에 빠진 마크다운: ${missing.join(' · ')}`);
  }
  return mdSources;
}

/**
 * 마크다운을 **한 번만** 읽어 생성기 넷이 나눠 쓸 묶음으로 만든다.
 * 카드.md 92KB 를 넷이 각자 읽으면 같은 파서 버그가 네 번 나고, 넷이 서로 다른
 * 장수를 세도 아무도 모른다. 읽는 자리를 하나로 둔다.
 */
function buildParsed(md) {
  let cards;
  try {
    cards = parseCards(md.cards);
  } catch (e) {
    throw new Error(`[yaganjo/docgen] 카드.md 를 읽지 못했다 — ${e.message}`);
  }
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error('[yaganjo/docgen] 카드.md 에서 카드를 한 장도 읽지 못했다.');
  }
  // progress 는 sheets 의 별명이다. 생성기가 어느 이름으로 찾든 같은 원문이 잡힌다.
  return { md: { ...md, progress: md.sheets }, cards };
}

/**
 * 생성기 넷이 늘 기대할 수 있는 모양으로 data 를 채운다.
 * 채우기만 하고 덮어쓰지 않는다 — 호출자가 준 값이 언제나 이긴다.
 * 원본은 건드리지 않는다(얕은 복사).
 */
function normalizeData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('[yaganjo/docgen] data 가 없다. 시나리오 객체를 넘겨야 한다.');
  }
  const out = { ...data };
  const map = out.evidenceMap;
  if (!map || typeof map !== 'object') {
    throw new Error('[yaganjo/docgen] data.evidenceMap 이 없다.');
  }
  // 코드 → 항목을 배열로도 준다. loadData.mjs 의 allClues 와 같은 모양이다.
  if (!Array.isArray(out.allClues)) {
    out.allClues = Object.entries(map).map(([code, v]) => ({ code, ...v }));
  }
  // 종이와 화면을 잇는 사상표. 생성기마다 따로 import 하지 않게 여기서 한 번만 준다.
  //   **codeOf·cardOf 는 맵이다. 함수가 아니다** — 생성기가 `data.codeOf[c.no]` 로 읽는다.
  //   이름이 함수처럼 생긴 것은 아쉽지만, 읽는 쪽이 이미 그 모양으로 쓰고 있다.
  out.cardToCode ||= cardToCode;
  out.codeToCard ||= codeToCard;
  out.codeOf ||= cardToCode;
  out.cardOf ||= codeToCard;
  out.cardCount ||= CARD_COUNT;
  out.clueOf ||= (code) => (map[code] ? { code, ...map[code] } : null);
  out.titleOf ||= (code) => map[code]?.title || `⚠️미존재(${code})`;
  return out;
}

/** 모듈에서 생성기 함수를 꺼낸다. 이름 있는 export 아니면 default, 둘뿐이다. */
async function resolveGenerator(g, opts, warn) {
  const injected = opts.generators?.[g.key];
  if (typeof injected === 'function') return injected;

  let mod;
  try {
    mod = await g.load();
  } catch (e) {
    warn(`생성기 ${g.name}(${g.file})를 불러오지 못했다 — ${e.message}`);
    return null;
  }
  const fn = mod?.[g.name] ?? mod?.default;
  if (typeof fn !== 'function') {
    warn(
      `생성기 모듈에 ${g.name} 이(가) 없다. ` +
        `export function ${g.name}(parsed, data, opts) 또는 default export 여야 한다.`
    );
    return null;
  }
  return fn;
}

/** 생성기가 돌려준 것을 문서 배열로 편다. 하나를 주든 배열을 주든 받는다. */
function toDocs(out, g) {
  const list = out == null ? [] : Array.isArray(out) ? out : [out];
  return list.filter(Boolean).map((d) => {
    if (typeof d?.filename !== 'string' || !d.filename.endsWith('.html')) {
      throw new Error(`[yaganjo/docgen] ${g.name} 이 filename 없는 것을 돌려줬다.`);
    }
    if (typeof d.html !== 'string' || d.html.trim() === '') {
      throw new Error(`[yaganjo/docgen] ${g.name} 의 ${d.filename} 이 빈 HTML 이다.`);
    }
    return d;
  });
}

/**
 * 인쇄 순서대로 세운다. ORDER 에 없는 문서는 **버리지 않고 뒤에 붙인다.**
 * 예전 판에서는 목록에 없으면 조용히 빠졌고, 문서를 새로 떼어 냈을 때
 * 웹 키트에서만 그 종이가 통째로 사라졌다(src/board/main.js 의 주석).
 */
function sortDocs(docs, warn) {
  const rank = (f) => {
    const i = DOC_ORDER.indexOf(f);
    if (i < 0) {
      warn(`인쇄 순서 목록(DOC_ORDER)에 없는 문서: ${f} — 맨 뒤에 붙였다.`);
      return DOC_ORDER.length;
    }
    return i;
  };
  return [...docs].sort((a, b) => rank(a.filename) - rank(b.filename));
}

/** 같은 파일명이 둘이면 한 장이 조용히 덮인다. 이름을 대며 던진다. */
function checkDuplicates(docs) {
  const seen = new Map();
  for (const d of docs) {
    if (seen.has(d.filename)) {
      throw new Error(
        `[yaganjo/docgen] 파일명 중복: '${d.filename}' 을 ${seen.get(d.filename)} 와 ` +
          '다른 생성기가 함께 낸다. 한 장이 조용히 덮인다.'
      );
    }
    seen.set(d.filename, d.filename);
  }
}

/**
 * 종이에 새면 안 되는 것을 찾는다.
 * 여기서 던지지 않는 이유는, 운영자가 여는 키트 페이지가 통째로 죽으면
 * 「무엇이 샜는지」조차 못 보기 때문이다. 대신 buildY.mjs 와 tools/audit/yaganjo.mjs 가
 * 이 경고를 받아 **종료 코드 1** 로 떨어진다.
 */
function checkLeaks(docs, warn) {
  for (const d of docs) {
    if (d.html.includes(LEAK)) {
      const n = d.html.split(LEAK).length - 1;
      warn(`「${LEAK}」 제작 주석이 ${d.filename} 에 ${n}곳 남아 있다 — 정답이 참가자 손에 간다.`);
    }
    if (d.filename !== TRUTH_DOC && SOFT_LEAK.test(d.html)) {
      warn(`집필용 머리글(${SOFT_LEAK.source})이 ${d.filename} 에 남아 있다.`);
    }
  }
}

/**
 * QR 이 붙어야 할 카드에 실제로 붙었는가.
 * 빠져도 종이는 멀쩡해 보인다 — 본문도 「QR」 줄도 그대로 찍히고 그림만 없다.
 * 그러면 그 카드는 **영영 열리지 않는 카드**가 되고, 판에서는 「원래 QR 이 없나 보다」로 읽힌다.
 */
function checkQr(docs, parsed, warn) {
  const doc = docs.find((d) => d.filename === '보드_야간조_카드.html');
  if (!doc) return;
  const wantsQr = (c) => {
    if ((Array.isArray(c.markers) ? c.markers : []).includes('🔒')) return true;
    if ((Array.isArray(c.linesMeta) ? c.linesMeta : []).some((l) => /QR/.test(l?.label || ''))) return true;
    return (Array.isArray(c.lines) ? c.lines : [])
      .some((l) => /^\*\*QR\*\*/.test(typeof l === 'string' ? l : l?.text || ''));
  };
  const want = new Set(parsed.cards.filter(wantsQr).map((c) => c.no));
  const got = new Set(
    [...doc.html.matchAll(/<div class="qrl">([^<]*)<\/div>/g)].map((m) => codeToCard[m[1].trim()] || m[1].trim())
  );
  const miss = [...want].filter((n) => !got.has(n)).sort();
  if (miss.length) {
    warn(`QR 이 붙어야 할 카드 ${want.size}장 중 ${miss.length}장에 QR 그림이 없다: ${miss.join(' ')}`);
  }
}

/** 파일명 접두사와 가로 선언 — 뽑아 보기 전에는 안 보이는 두 함정(§4-3). */
function checkPrintTraps(docs, warn) {
  for (const d of docs) {
    if (!d.filename.startsWith('보드_')) {
      warn(
        `${d.filename} 이 '보드_' 로 시작하지 않는다 — build.mjs 의 marginFor() 가 ` +
          '여백을 한 번 더 먹여 카드가 63×88mm 로 안 나온다.'
      );
    }
    // @page 에 여백을 남기면 브라우저가 그 자리에 날짜·제목·주소·쪽번호를 찍는다.
    // 여백은 본문이 든다(BASE_CSS 머리말). 크기(size:)는 A4 세로가 기본이라 안 적어도 된다 —
    // 다만 **가로 문서는 스스로 `@page { size: A4 landscape }` 를 선언해야 한다.**
    // build.mjs 의 LANDSCAPE 정규식은 새벽이슬 파일명만 알아서 야간조를 세로로 뽑는다.
    if (!/@page\s*\{[^}]*margin:\s*0/.test(d.html)) {
      warn(`${d.filename} 이 @page { margin: 0 } 을 선언하지 않았다 — 종이 가장자리에 날짜와 주소가 찍힌다.`);
    }
  }
}

/**
 * 야간조 인쇄물 전량을 만든다.
 *
 * @param {{cards:string, rulebook:string, sheets:string, persons:string, truth:string}} mdSources
 *        docs/야간조-보드게임/*.md 원문. Node 는 readFileSync, 브라우저는 ?raw.
 * @param {object} data 야간조 시나리오 객체(src/scenarios/yaganjo/index.js).
 *        최소한 evidenceMap 이 있어야 하고, 나머지는 여기서 채운다.
 * @param {{assetBase?:string, siteUrl?:string, onWarn?:(msg:string)=>void,
 *          generators?:object}} [opts]
 *        assetBase — 그림 경로 앞자리('.' 이면 ZIP 용 상대경로).
 *        onWarn    — 경고 받는 곳. 안 주면 console.warn.
 *        generators— 생성기 직접 주입(시험용). 넷 중 준 것만 갈아 끼운다.
 * @returns {Promise<Array<{filename:string, html:string}>>} genBoardDocs 와 같은 반환형.
 */
export async function genYaganjoDocs(mdSources, data, opts = {}) {
  const warn = typeof opts.onWarn === 'function' ? opts.onWarn : (m) => console.warn('⚠ ' + m);
  const md = requireSources(mdSources);
  const parsed = buildParsed(md);
  const ctx = normalizeData(data);
  const o = {
    ...opts,
    assetBase: opts.assetBase ?? '.',
    siteUrl: opts.siteUrl ?? ctx.config?.siteUrl ?? '',
  };

  // 주소와 QR. 생성기는 data 만 받으므로(두 인자) 여기서 data 에 얹는다.
  ctx.siteUrl ||= o.siteUrl;
  ctx.qrUrl ||= (code, card) => makeQrUrl(code, card?.no ?? codeToCard[code], ctx.siteUrl);
  if (!ctx.qr) ctx.qr = await buildQrMap(ctx.siteUrl, warn);

  const docs = [];
  for (const g of GENERATORS) {
    const fn = await resolveGenerator(g, o, warn);
    if (!fn) continue;
    docs.push(...toDocs(await fn(parsed, ctx, o), g));
  }

  if (docs.length === 0) {
    throw new Error(
      '[yaganjo/docgen] 문서가 한 장도 나오지 않았다. ' +
        `생성기 넷(${GENERATORS.map((g) => g.name).join(' · ')})이 tools/docgen/yaganjo/ 에 있는지 본다.`
    );
  }

  checkDuplicates(docs);
  checkLeaks(docs, warn);
  checkQr(docs, parsed, warn);
  checkPrintTraps(docs, warn);
  return sortDocs(docs, warn);
}

export default genYaganjoDocs;
