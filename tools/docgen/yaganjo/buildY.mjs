// ─────────────────────────────────────────────────────────────────────────────
// 「야간조」 인쇄물 일괄 생성 (Node)
//
//   node tools/docgen/yaganjo/buildY.mjs          → HTML + PDF
//   node tools/docgen/yaganjo/buildY.mjs --html   → HTML 만 (puppeteer·Chrome 불필요)
//
//   tools/docgen/build.mjs 와 **같은 방식**으로 PDF 를 뽑되, 그 파일을 고치지 않는다.
//   새벽이슬 판이 깨지면 이 과제 전체가 실패다 — 그래서 여기가 자기 것을 갖는다.
//   빌려 온 것은 「어떻게」뿐이고(인쇄 모드로 바꾼 뒤 beforeprint 를 직접 띄운다),
//   「무엇을」은 다르다(§4-3 함정 1 을 파일명이 아니라 CSS 로 피한다 — 아래 paperOf).
//
//   ── 나가는 자리 ──────────────────────────────────────────────────────────
//   tools/docgen/output/yaganjo/{html,pdf} 다. 새벽이슬은 output/{html,pdf} 를 쓴다.
//   파일명이 `보드_야간조_` 라 섞여도 부딪히지는 않지만, 한 폴더에 두 판을 섞으면
//   「어느 판을 뽑고 있는지」가 목록에서 사라진다. 지우는 일도 갈라 둔다.
//
//   ── 종료 코드 ────────────────────────────────────────────────────────────
//   제작 주석이 새거나 문서가 한 장이라도 빠지면 **1** 로 떨어진다.
//   조용히 성공하는 인쇄 도구가 제일 위험하다 — 사람은 PDF 를 열어 보지 않고 뽑는다.
// ─────────────────────────────────────────────────────────────────────────────
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { genYaganjoDocs, MD_KEYS, DOC_NOTES, DOC_ORDER, KIT_README } from './index.mjs';
import { cardToCode, CARD_COUNT } from '../../../src/scenarios/yaganjo/cards.js';
import yaganjo from '../../../src/scenarios/yaganjo/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '..'); // 저장소 뿌리
const OUT = join(__dirname, '..', 'output', 'yaganjo');
const HTML_DIR = join(OUT, 'html');
const PDF_DIR = join(OUT, 'pdf');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// ── 종이 ─────────────────────────────────────────────────────────────────────
// 문서가 @page 로 선언한 크기를 그대로 PDF 에 전한다. format 을 넘기면 CSS 의 size 가
// 무시되어, A3 로 짠 판이 A4 로 줄어든 채 나온다.
//   가로/세로도 **문서가 스스로 말한 것만** 믿는다. 새벽이슬 build.mjs 는 파일명
//   정규식(`/^(보드_인물카드|결과제출지)/`)으로 가로를 판정하는데, 그 목록은 야간조
//   파일명을 모른다. 인물 시트가 세로로 뽑히는 사고가 거기서 난다.
const PAPER = { A4: [210, 297], A3: [297, 420], A5: [148, 210] };
function paperOf(html) {
  const m = html.match(/@page\s*\{[^}]*size:\s*([A-Za-z][A-Za-z0-9]*)(?:\s+(landscape|portrait))?/);
  const [w, h] = PAPER[(m?.[1] || 'A4').toUpperCase()] || PAPER.A4;
  return m?.[2] === 'landscape' ? { width: `${h}mm`, height: `${w}mm` } : { width: `${w}mm`, height: `${h}mm` };
}

// 야간조 문서는 전부 여백을 **본문이 든다**(BASE_CSS 의 `@page{margin:0}` · `body{padding}`,
// 카드 판은 63×88mm 격자가 자기 여백을 갖는다). 여기서 또 주면 그만큼 줄어들어
// 카드가 규격으로 안 나온다. 그래서 파일명으로 분기하지 않고 전부 0 이다.
const MARGIN = { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' };

// ── 정본 읽기 ────────────────────────────────────────────────────────────────
// 브라우저는 같은 파일을 `?raw` 로 번들에 넣는다. 읽는 방법이 둘일 뿐 정본은 하나다.
function loadMdSources() {
  const md = {};
  const missing = [];
  for (const [key, rel] of Object.entries(MD_KEYS)) {
    const path = join(ROOT, ...rel.split('/'));
    if (!existsSync(path)) { missing.push(rel); continue; }
    md[key] = readFileSync(path, 'utf8');
  }
  if (missing.length) {
    console.error('✗ 정본 마크다운이 없다:\n  ' + missing.join('\n  '));
    process.exit(1);
  }
  return md;
}

// ── 카드 수 세기 ─────────────────────────────────────────────────────────────
// 세 곳을 따로 세어 나란히 놓는다. 한 숫자만 찍으면 「무엇을 센 것인가」가 사라진다.
//   ① 사상표(cards.js)          — 종이와 화면을 잇는 손작업
//   ② 데이터팩(clueCodes)        — QR 뒤 화면의 정본
//   ③ 뽑힌 HTML                 — 실제로 종이에 찍히는 것
// ③ 은 카드 앞면의 번호 딱지를 센다. 세는 길이 셋이고, 위에서부터 맞는 것을 쓴다.
//   ⒜ `data-card="A1"`           — 기계가 세라고 남긴 표시(있으면 제일 정확하다)
//   ⒝ `<span class="no">A1</span>` — genCards 가 앞면에 찍는 번호 딱지
//   ⒞ 사상표의 번호가 본문에 나타나는가 — 「A1 도 함께 있으면」 같은 줄까지 세는 어림수
function countCardsInHtml(html) {
  const stamped = new Set([...html.matchAll(/data-card="([^"]+)"/g)].map((m) => m[1]));
  if (stamped.size) return { n: stamped.size, how: 'data-card', exact: true, set: stamped };

  const tagged = new Set(
    [...html.matchAll(/<span class="no"[^>]*>([^<]+)<\/span>/g)].map((m) => m[1].trim())
  );
  if (tagged.size) return { n: tagged.size, how: '앞면 번호 딱지', exact: true, set: tagged };

  const found = new Set();
  for (const card of Object.keys(cardToCode)) {
    // A1 이 A10 에 걸려 두 번 세지 않게 뒤에 숫자가 오는 것은 뺀다.
    const re = new RegExp(`(^|[^A-Za-z0-9])${card.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^0-9]|$)`);
    if (re.test(html)) found.add(card);
  }
  return { n: found.size, how: '본문에 나타난 번호(어림)', exact: false, set: found };
}

async function main() {
  const htmlOnly = process.argv.includes('--html');
  const md = loadMdSources();

  const warnings = [];
  const data = {
    ...yaganjo,
    // 인물 시트의 「내 폰 번호」. 새벽이슬 loadData.mjs 와 같은 자리다.
    recover: yaganjo.secrets?.recover || {},
  };

  let docs;
  try {
    docs = await genYaganjoDocs(md, data, {
      assetBase: '.',                       // ZIP 과 같은 상대경로로 뽑는다
      siteUrl: yaganjo.config?.siteUrl || '',
      onWarn: (m) => warnings.push(m),
    });
  } catch (e) {
    console.error('✗ 인쇄물을 만들지 못했다 —', e.message);
    process.exit(1);
  }

  mkdirSync(HTML_DIR, { recursive: true });
  docs.forEach((d, i) => {
    writeFileSync(join(HTML_DIR, `${String(i + 1).padStart(2, '0')}_${d.filename}`), d.html, 'utf8');
  });
  writeFileSync(join(HTML_DIR, '읽어보세요.txt'), KIT_README, 'utf8');
  console.log(`✔ HTML ${docs.length}장 → ${HTML_DIR}`);
  for (const d of docs) {
    const kb = (Buffer.byteLength(d.html, 'utf8') / 1024).toFixed(0);
    console.log(`   · ${d.filename.padEnd(30)} ${String(kb).padStart(5)}KB  ${DOC_NOTES[d.filename] || ''}`);
  }

  // ── 빠진 장 ────────────────────────────────────────────────────────────────
  const got = new Set(docs.map((d) => d.filename));
  const absent = DOC_ORDER.filter((f) => !got.has(f));
  if (absent.length) warnings.push(`인쇄 순서에 있는데 나오지 않은 문서: ${absent.join(' · ')}`);

  // ── 카드 수 ────────────────────────────────────────────────────────────────
  const cardsDoc = docs.find((d) => d.filename === '보드_야간조_카드.html');
  console.log('\n── 카드 수 ──');
  console.log(`   사상표(cards.js)        ${CARD_COUNT}`);
  console.log(`   데이터팩(clueCodes)     ${yaganjo.clueCodes.length}`);
  if (cardsDoc) {
    const c = countCardsInHtml(cardsDoc.html);
    console.log(`   뽑힌 HTML               ${c.n}  (${c.how})`);
    if (c.exact && c.n !== CARD_COUNT) {
      const miss = Object.keys(cardToCode).filter((k) => !c.set.has(k));
      const extra = [...c.set].filter((k) => !cardToCode[k]);
      warnings.push(
        `카드 장수가 어긋난다 — 사상표 ${CARD_COUNT} / HTML ${c.n}` +
          (miss.length ? ` · 안 찍힌 것: ${miss.join(' ')}` : '') +
          (extra.length ? ` · 표에 없는 것: ${extra.join(' ')}` : '')
      );
    }
    if (!c.exact) {
      warnings.push(
        '카드 판에서 번호 딱지를 찾지 못해 어림수로 셌다 — ' +
          'genCards 가 카드 앞면에 data-card="A1" 을 남기면 기계가 정확히 센다.'
      );
    }
  } else {
    warnings.push('카드 판(보드_야간조_카드.html)이 나오지 않았다.');
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  if (!htmlOnly) await makePdfs(docs, warnings);

  // ── 경고 ──────────────────────────────────────────────────────────────────
  if (warnings.length) {
    console.log('\n✗ 결함 ' + warnings.length + '건');
    for (const w of warnings) console.log('   ✗ ' + w);
    process.exitCode = 1;
  } else {
    console.log('\n✔ 결함 없음');
  }
}

async function makePdfs(docs, warnings) {
  if (!existsSync(CHROME)) {
    console.log(`\n⚠ Chrome 없음(${CHROME}). HTML 만 만들었다. --html 로 재실행하거나 경로를 고친다.`);
    return;
  }
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer-core')).default;
  } catch {
    console.log('\n⚠ puppeteer-core 미설치. `npm i -D puppeteer-core` 뒤에 다시 돌리면 PDF 가 나온다.');
    return;
  }

  mkdirSync(PDF_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    for (const [i, d] of docs.entries()) {
      const stem = `${String(i + 1).padStart(2, '0')}_${d.filename}`;
      const src = join(HTML_DIR, stem);
      await page.goto('file:///' + src.replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 30000 });
      // 문서마다 인쇄 직전에 스스로 크기를 맞추는 스크립트가 있다. load 때는 아직 화면
      // 모드라 인쇄 배치와 다르다 — 인쇄에서만 넘치는 장을 못 잡는다. 사람이 브라우저에서
      // 인쇄하면 beforeprint 가 알아서 뜨지만 page.pdf() 는 그 사건을 안 띄운다.
      await page.emulateMediaType('print');
      await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
      const pdfName = stem.replace(/\.html$/, '.pdf');
      await page.pdf({ path: join(PDF_DIR, pdfName), ...paperOf(d.html), printBackground: true, margin: MARGIN });
      console.log('   PDF:', pdfName);
    }
  } catch (e) {
    warnings.push(`PDF 변환 실패 — ${e.message}`);
  } finally {
    await browser.close();
  }
  console.log(`✔ PDF ${docs.length}개 → ${PDF_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
