// 운영 문서 일괄 생성기.
//   node tools/docgen/build.mjs          → HTML + PDF 모두 생성
//   node tools/docgen/build.mjs --html   → HTML만 (puppeteer 불필요)
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { lint, allClues, suspects, victim } from './loadData.mjs';
import { genAllRefSheets } from './genRefSheets.mjs';
import { genPlaceGuide } from './genPlace.mjs';
import { genTruth } from './genTruth.mjs';
import { genQRDocs } from './genQR.mjs';
import { genResultSheet } from './genResult.mjs';
import { genSlidesPptx } from './genSlides.mjs';
import { genBoardDocs } from './genBoard.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'output');
const HTML_DIR = join(OUT, 'html');
const PDF_DIR = join(OUT, 'pdf');

// A4 + 문서별 여백(mm)
const M = (t, r, b, l) => ({ top: `${t}mm`, right: `${r}mm`, bottom: `${b}mm`, left: `${l}mm` });
function marginFor(name) {
  // 보드 인쇄물은 장마다 크기가 정해져 있고 여백도 그 안에 들어 있다.
  //   여기서 또 여백을 주면 그만큼 줄어들어 카드가 63x88mm 로 안 나온다.
  if (name.startsWith('보드_') || name.startsWith('결과제출지')) return M(0, 0, 0, 0);
  if (name.startsWith('배우레퍼런스')) return M(14, 14, 16, 14);
  if (name.startsWith('단서배치')) return M(16, 15, 18, 15);
  if (name.startsWith('진상해설서')) return M(20, 18, 22, 18);
  if (name.startsWith('이미지생성')) return M(12, 12, 12, 12);
  if (name.startsWith('QR_인쇄시트')) return M(8, 8, 8, 8);
  if (name.startsWith('QR_')) return M(14, 14, 16, 14);
  return M(14, 14, 14, 14);
}

// 가로로 뽑을 문서 — 인물 시트는 A4 가로를 세로로 접는 형식이고, 결과 제출지는 두 벌이 나란히 있다.
const LANDSCAPE = /^(보드_인물카드|결과제출지)/;

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const htmlOnly = process.argv.includes('--html');

  const docs = [...genAllRefSheets(), genPlaceGuide(), genTruth({ victim }), ...(await genQRDocs()), genResultSheet(), ...(await genBoardDocs({ allClues, suspects }))];

  mkdirSync(HTML_DIR, { recursive: true });
  for (const d of docs) writeFileSync(join(HTML_DIR, d.filename), d.html, 'utf8');
  console.log(`✔ HTML ${docs.length}개 생성 → ${HTML_DIR}`);

  // 정합성 경고
  const warns = lint();
  if (warns.length) console.log('⚠ evidenceMap 정합성 경고:\n  ' + warns.join('\n  '));

  // 게임 진행 PPT (.pptx) — puppeteer/Chrome 불필요
  try {
    mkdirSync(OUT, { recursive: true });
    const pptPath = join(OUT, '게임진행_슬라이드.pptx');
    await genSlidesPptx(pptPath);
    console.log('✔ PPT 생성 →', pptPath);
  } catch (e) {
    console.log('⚠ PPT 생성 실패:', e.message);
  }

  if (htmlOnly) { console.log('--html 모드: PDF 생략'); return; }

  if (!existsSync(CHROME)) {
    console.log(`⚠ Chrome 없음(${CHROME}). HTML만 생성됨. --html 로 재실행하거나 경로 수정.`);
    return;
  }

  let puppeteer;
  try {
    puppeteer = (await import('puppeteer-core')).default;
  } catch {
    console.log('⚠ puppeteer-core 미설치. `npm i -D puppeteer-core` 후 재실행하면 PDF가 생성됩니다.');
    return;
  }

  mkdirSync(PDF_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  for (const d of docs) {
    const pdfName = d.filename.replace(/\.html$/, '.pdf');
    await page.goto('file:///' + join(HTML_DIR, d.filename).replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 30000 });
    await page.pdf({ path: join(PDF_DIR, pdfName), format: 'A4', landscape: LANDSCAPE.test(d.filename), printBackground: true, margin: marginFor(d.filename) });
    console.log('  PDF:', pdfName);
  }
  await browser.close();
  console.log(`✔ PDF ${docs.length}개 생성 → ${PDF_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
