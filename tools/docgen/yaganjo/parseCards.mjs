/**
 * 「야간조」 보드판 마크다운 파서 — 의존성 0, Node·브라우저 공용.
 *
 * 이 파일은 **문자열만** 받는다. fs 를 쓰지 않으므로 브라우저에서는
 * `import cardsMd from '../../docs/야간조-보드게임/카드.md?raw'` 로 넣고,
 * Node 에서는 readFileSync 로 읽어 같은 함수에 넘긴다 — 같은 정본, 두 경로.
 *
 * 하단의 자가 테스트만 Node 전용이고, 그 안에서만 fs 를 동적으로 부른다.
 * (변수 지정자 + @vite-ignore 라 번들러가 node:fs 를 끌어가지 않는다)
 *
 * 카드.md 문법 — dp-architecture.md §4-3
 *   `# 1부 · …`                        부
 *   `## A · 서장현의 칸 — …`            장소
 *   `### A1 · 순찰 일지 클립보드  ⭐`    카드 한 장(번호 · 제목 · 마커)
 *   이어지는 `> ` 블록                  카드 앞면 본문
 *   `> **QR 안 …**` 로 시작하는 블록    종이에 안 찍는다 → qrBody
 *   `- **⭐ 조합** — …`                 카드 하단 줄
 *   그 밖의 맨 줄(`_(인쇄 안 함)_` · `〔…〕` · `제작 —`)  버린다
 */

// ─── 마커 ──────────────────────────────────────────────────────────────────

/** 카드 모서리에 찍는 표시 여섯 가지 중 제목 줄에 오는 다섯. */
export const MARKERS = ['🔒', '⚖', '🔬', '⭐', '🔑'];
const MARKER_SET = new Set(MARKERS);

/** 제목에서 마커를 떼어 낸다. 문자열 순회는 코드포인트 단위라 서로게이트가 안 쪼개진다. */
function splitMarkers(text) {
  const markers = [];
  let rest = '';
  for (const ch of text) {
    if (ch === '️' || ch === '︎') continue; // 이체자 선택자
    if (MARKER_SET.has(ch)) {
      if (!markers.includes(ch)) markers.push(ch);
      continue;
    }
    rest += ch;
  }
  return { markers, text: rest.replace(/\s+/g, ' ').trim() };
}

// ─── 인쇄하지 않는 줄 ──────────────────────────────────────────────────────

/**
 * 제작 주석인가. 카드.md 는 네 가지 표기를 섞어 쓴다.
 * 카드 안에서는 어차피 `>` 와 `-` 만 남기므로 이 함수는 진단·절 파서용이다.
 */
export function isPrintNote(line) {
  const s = line.trim();
  return (
    s.startsWith('_(인쇄 안 함)_') ||
    s.startsWith('〔') ||
    s.startsWith('제작 —') ||
    s.startsWith('**제작 —') ||
    s.startsWith('※ 제작')
  );
}

// ─── 하단 줄 ───────────────────────────────────────────────────────────────

/** 하단 줄을 버릴지 정하는 라벨. 근거는 집필 참조라 종이에 안 간다. */
const DROP_LINE_LABELS = new Set(['근거']);
/** 앞면이 아니라 뒷면에 찍는 줄. */
const BACK_LINE_LABEL = '뒷면';

/** `- **⭐ 조합** — 「…」` 에서 라벨(`⭐ 조합`)과 값(`「…」`)을 뽑는다. */
export function splitLine(text) {
  const m = /^\*\*(.+?)\*\*\s*(?:—\s*)?([\s\S]*)$/.exec(text.trim());
  if (!m) return { label: '', value: text.trim(), text: text.trim() };
  return { label: m[1].trim(), value: m[2].trim(), text: text.trim() };
}

// ─── 카드 파서 ─────────────────────────────────────────────────────────────

const H_RE = /^(#{1,6})\s+(.*)$/;
const PART_RE = /^(\d+부)\s*(?:·\s*)?(.*)$/;
/** `### A1 · 제목` · `### 공개① · 제목` — 번호 토큰에 숫자가 있어야 카드다. */
const CARD_RE = /^(\S+)\s+·\s+(.+)$/;
const CARD_NO_RE = /[0-9０-９①-⑳]/u;
const QR_BLOCK_RE = /^\*\*QR 안/;

function newCard(part, place, placeTitle, no, title, markers, line) {
  return {
    part,
    place,
    placeTitle,
    no,
    title,
    markers,
    body: '',
    lines: [],
    qrBody: '',
    // 아래 셋은 규격 밖의 덤이다 — genCards 가 뒷면·라벨을 알아야 한다
    back: '',
    linesMeta: [],
    sourceLine: line,
  };
}

/** 카드 번호에서 더미 기호를 뽑는다. `A1`→`A` · `V14`→`V` · `공개①`→`공개` */
function deckOf(no) {
  return no.replace(/[0-9０-９①-⑳]+$/u, '') || no;
}

/**
 * 카드.md 전문을 카드 배열로 바꾼다.
 *
 * @param {string} md 카드.md 원문
 * @returns {Array<{part:string, place:string, placeTitle:string, no:string,
 *   title:string, markers:string[], body:string, lines:string[], qrBody:string,
 *   back:string, linesMeta:Array<{label:string,value:string,text:string}>,
 *   sourceLine:number}>}
 */
export function parseCards(md) {
  const src = String(md).split(/\r?\n/);
  const cards = [];

  let part = '';
  let placeTitle = '';
  let placeLetter = '';
  let card = null;

  let quote = null; // 모으는 중인 인용 블록
  let bullet = null; // 모으는 중인 하단 줄(여러 줄로 이어질 수 있다)

  const flushQuote = () => {
    if (!quote || !card) {
      quote = null;
      return;
    }
    const text = quote.join('\n').replace(/^\n+|\s+$/g, '');
    const head = quote.find((l) => l.trim() !== '') || '';
    if (QR_BLOCK_RE.test(head.trim())) {
      card.qrBody = card.qrBody ? `${card.qrBody}\n\n${text}` : text;
    } else if (text) {
      card.body = card.body ? `${card.body}\n\n${text}` : text;
    }
    quote = null;
  };

  const flushBullet = () => {
    if (!bullet || !card) {
      bullet = null;
      return;
    }
    const meta = splitLine(bullet.join('\n'));
    if (meta.label === BACK_LINE_LABEL) {
      card.back = meta.value;
    } else if (!DROP_LINE_LABELS.has(meta.label)) {
      card.lines.push(meta.text);
      card.linesMeta.push(meta);
    }
    bullet = null;
  };

  const flushCard = () => {
    flushQuote();
    flushBullet();
    card = null;
  };

  for (let i = 0; i < src.length; i += 1) {
    const raw = src[i];
    const heading = H_RE.exec(raw);

    if (heading) {
      // 어떤 제목이든 앞 카드를 닫는다 — 카드가 아닌 `###`(거울 표기 표)도 마찬가지다
      flushCard();
      const level = heading[1].length;
      const text = heading[2].trim();

      if (level === 1) {
        const p = PART_RE.exec(text);
        if (p) {
          part = text;
        } else {
          // 부가 아닌 대제목은 묶음 제목이다(예: `# 공개 게시물 2장 — 가져갈 수 없다`)
          placeTitle = text;
          placeLetter = '';
        }
        continue;
      }
      if (level === 2) {
        placeTitle = text;
        const m = /^([A-Z])\s*·/.exec(text);
        placeLetter = m ? m[1] : '';
        continue;
      }
      if (level === 3) {
        const c = CARD_RE.exec(text);
        if (!c) continue; // `### 거울 표기 — …` 같은 비카드 제목
        const no = c[1].trim();
        if (!CARD_NO_RE.test(no) || no.length > 8) continue;
        const { markers, text: title } = splitMarkers(c[2]);
        const deck = deckOf(no);
        card = newCard(part, placeLetter || deck, placeTitle, no, title, markers, i + 1);
        cards.push(card);
        continue;
      }
      continue; // #### 이하는 카드.md 에 없다
    }

    if (!card) continue;

    // ── 인용 블록
    if (/^>/.test(raw)) {
      flushBullet();
      if (!quote) quote = [];
      quote.push(raw.replace(/^>\s?/, ''));
      continue;
    }
    flushQuote();

    // ── 하단 줄
    if (/^-\s+/.test(raw)) {
      flushBullet();
      bullet = [raw.replace(/^-\s+/, '')];
      continue;
    }
    // 하단 줄이 다음 줄로 이어지는 경우(들여쓴 이음줄)
    if (bullet && /^\s{2,}\S/.test(raw)) {
      bullet.push(raw.trim());
      continue;
    }
    flushBullet();

    // 그 밖의 맨 줄은 전부 제작 주석이다 — 버린다
  }

  flushCard();
  return cards;
}

/** `place` 별로 묶는다. 더미 순서는 카드가 나온 순서를 따른다. */
export function groupByDeck(cards) {
  const decks = new Map();
  for (const c of cards) {
    const key = deckOf(c.no);
    if (!decks.has(key)) decks.set(key, { deck: key, placeTitle: c.placeTitle, part: c.part, cards: [] });
    decks.get(key).cards.push(c);
  }
  return [...decks.values()];
}

// ─── 절 파서 (룰북 · 진행물 · 인물시트 · 진상해설서) ────────────────────────

/**
 * 제목 단위로만 자른다. 카드처럼 인용/하단 줄을 가르지 않는다.
 *
 * @param {string} md
 * @param {{dropNotes?: boolean}} [opts] dropNotes 면 제작 주석 줄을 버린다
 * @returns {Array<{level:number, title:string, body:string, children:Array}>}
 */
export function parseSections(md, opts = {}) {
  const dropNotes = opts.dropNotes === true;
  const root = { level: 0, title: '', body: [], children: [] };
  const stack = [root];

  for (const raw of String(md).split(/\r?\n/)) {
    const h = H_RE.exec(raw);
    if (h) {
      const node = { level: h[1].length, title: h[2].trim(), body: [], children: [] };
      while (stack[stack.length - 1].level >= node.level) stack.pop();
      stack[stack.length - 1].children.push(node);
      stack.push(node);
      continue;
    }
    if (dropNotes && isPrintNote(raw)) continue;
    stack[stack.length - 1].body.push(raw);
  }

  const finish = (n) => ({
    level: n.level,
    title: n.title,
    body: n.body.join('\n').replace(/^\n+|\s+$/g, ''),
    children: n.children.map(finish),
  });
  return root.children.map(finish);
}

/** 트리를 평평하게 편다. 절 번호를 붙여 목차를 만들 때 쓴다. */
export function flattenSections(sections, out = []) {
  for (const s of sections) {
    out.push(s);
    flattenSections(s.children, out);
  }
  return out;
}

export const parseRulebook = (md) => parseSections(md);
export const parseHandouts = (md) => parseSections(md);
export const parseTruth = (md) => parseSections(md);

/**
 * 인물시트.md → 사람별 4면.
 * 제목 표기가 두 가지다(`# 서장현 · 38세 · 안전관리자` · `# 시트:4 · 흐엉`).
 * 그래서 이름 줄이 아니라 **아래에 `## 1면…` 이 달렸는가**로 사람을 가른다.
 */
export function parsePersonSheets(md) {
  const top = parseSections(md);
  const people = [];
  for (const node of flattenSections(top)) {
    const faces = node.children.filter((c) => /^\s*\d\s*면/.test(c.title));
    if (faces.length === 0) continue;
    const tokens = node.title.split('·').map((t) => t.trim()).filter(Boolean);
    const named = tokens.filter((t) => !/^시트\s*:/.test(t));
    const age = tokens.find((t) => /^\d+세/.test(t)) || '';
    people.push({
      heading: node.title,
      name: (named[0] || node.title).replace(/\s*\(\d+\)\s*$/, ''),
      age: age.replace(/\D/g, ''),
      role: named.slice(age ? 2 : 1).join(' · '),
      faces: faces.map((f) => ({ title: f.title, body: f.body, children: f.children })),
      children: node.children,
    });
  }
  return people;
}

export default parseCards;

// ─── 자가 테스트 (Node 전용) ───────────────────────────────────────────────

function isNodeEntry() {
  if (typeof process === 'undefined' || !Array.isArray(process.argv) || !process.argv[1]) return false;
  const entry = process.argv[1].replace(/\\/g, '/');
  let here = '';
  try {
    here = decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
  } catch {
    return false;
  }
  return here.toLowerCase() === entry.toLowerCase();
}

async function selfTest() {
  const spec = 'node:fs';
  const { readFileSync } = await import(/* @vite-ignore */ spec);
  const pathSpec = 'node:path';
  const urlSpec = 'node:url';
  const { dirname, join } = await import(/* @vite-ignore */ pathSpec);
  const { fileURLToPath } = await import(/* @vite-ignore */ urlSpec);

  // `new URL('…/폴더/' + 이름, import.meta.url)` 로 쓰면 안 된다.
  //   Vite 의 자산 플러그인이 그 꼴을 **디렉터리 통째 참조**로 읽고,
  //   docs/야간조-보드게임/ 의 md 여섯 장을 전부 dist/assets/ 로 뽑아낸다 —
  //   `진상해설서.md`(정답 전량)와 `설계메모.md` 가 배포 버킷에 그대로 올라간다.
  //   이 함수는 Node 에서만 도는 자가 테스트인데 값은 브라우저 번들이 치른다.
  //   fileURLToPath + join 은 정적 분석에 걸리지 않으므로 아무것도 새지 않는다.
  const docsDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', '야간조-보드게임');
  const read = (name) => readFileSync(join(docsDir, name), 'utf8');

  const cards = parseCards(read('카드.md'));
  const say = (...a) => console.log(...a);

  say('─'.repeat(62));
  say(`카드 수 — ${cards.length}장 (기대 109장) ${cards.length === 109 ? 'OK' : '틀렸다'}`);
  say('─'.repeat(62));

  const count = (arr, key) => {
    const m = new Map();
    for (const x of arr) m.set(key(x), (m.get(key(x)) || 0) + 1);
    return m;
  };

  const byPart = count(cards, (c) => c.part || '(부 없음)');
  say('부별');
  for (const [k, v] of byPart) say(`  ${String(v).padStart(3)}장  ${k}`);

  const byDeck = groupByDeck(cards);
  say('\n더미별');
  say('  ' + byDeck.map((d) => `${d.deck}:${d.cards.length}`).join(' · '));

  say('\n마커 분포');
  const byMarker = new Map(MARKERS.map((m) => [m, 0]));
  for (const c of cards) for (const m of c.markers) byMarker.set(m, (byMarker.get(m) || 0) + 1);
  for (const [k, v] of byMarker) say(`  ${k}  ${String(v).padStart(3)}장`);
  const marked = cards.filter((c) => c.markers.length > 0).length;
  say(`  마커 붙은 카드 ${marked}장 · 마커 총 ${[...byMarker.values()].reduce((a, b) => a + b, 0)}개`);

  say('\n하단 줄 라벨');
  const byLabel = new Map();
  for (const c of cards) for (const l of c.linesMeta) byLabel.set(l.label, (byLabel.get(l.label) || 0) + 1);
  for (const [k, v] of [...byLabel].sort((a, b) => b[1] - a[1])) say(`  ${String(v).padStart(3)}  ${k}`);

  say('\n본문');
  const empty = cards.filter((c) => c.body.trim() === '');
  say(`  본문 빈 카드 ${empty.length}장${empty.length ? ' — ' + empty.map((c) => c.no).join(' · ') : ''}`);
  const shortest = [...cards].sort((a, b) => a.body.length - b.body.length).slice(0, 3);
  say('  가장 짧은 셋 — ' + shortest.map((c) => `${c.no}(${c.body.length}자)`).join(' · '));
  const longest = [...cards].sort((a, b) => b.body.length - a.body.length)[0];
  say(`  가장 긴 것 — ${longest.no}(${longest.body.length}자)`);

  say('\nQR 안 / 뒷면');
  const qr = cards.filter((c) => c.qrBody.trim() !== '');
  say(`  qrBody 있는 카드 ${qr.length}장 — ${qr.map((c) => c.no).join(' · ')}`);
  const back = cards.filter((c) => c.back);
  say(`  뒷면 줄 있는 카드 ${back.length}장 — ${back.map((c) => c.no).join(' · ')}`);

  say('\n누출 검사 — 제작 주석이 카드에 남았는가');
  const leakRe = /(인쇄 안 함|^〔|\n〔|^제작 —|\n제작 —|※ 제작)/;
  const leaked = cards.filter((c) => leakRe.test(c.body + '\n' + c.lines.join('\n') + '\n' + c.qrBody + '\n' + c.back));
  say(`  누출 ${leaked.length}건${leaked.length ? ' — ' + leaked.map((c) => c.no).join(' · ') : ' (깨끗하다)'}`);

  say('\n번호 연속성');
  const gaps = [];
  for (const d of byDeck) {
    const nums = d.cards.map((c) => Number(c.no.replace(/\D/g, ''))).filter((n) => !Number.isNaN(n));
    if (nums.length === 0) continue;
    for (let n = 1; n <= Math.max(...nums); n += 1) if (!nums.includes(n)) gaps.push(`${d.deck}${n}`);
  }
  say(`  빠진 번호 ${gaps.length}개${gaps.length ? ' — ' + gaps.join(' · ') : ''}`);

  say('\n다른 문서 — 절 단위');
  for (const name of ['룰북.md', '진행물.md', '진상해설서.md']) {
    const flat = flattenSections(parseSections(read(name)));
    const lv = count(flat, (s) => s.level);
    say(`  ${name.padEnd(10)} 절 ${String(flat.length).padStart(3)}개 (` +
      [...lv].sort((a, b) => a[0] - b[0]).map(([k, v]) => `h${k}:${v}`).join(' ') + ')');
  }
  const people = parsePersonSheets(read('인물시트.md'));
  say(`  인물시트.md  인물 ${people.length}명 — ` +
    people.map((p) => `${p.name}(${p.faces.length}면)`).join(' · '));

  say('─'.repeat(62));
  const ok = cards.length === 109 && empty.length === 0 && leaked.length === 0 && gaps.length === 0;
  say(ok ? '판정 — 통과' : '판정 — 확인 필요');
  if (!ok && typeof process !== 'undefined') process.exitCode = 1;
}

if (isNodeEntry()) selfTest();
