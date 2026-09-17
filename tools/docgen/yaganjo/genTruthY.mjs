// ─────────────────────────────────────────────────────────────────────────────
// 야간조 인쇄물 ④ — 진상 해설서
//
//   판이 끝난 뒤에 펴는 한 권이다. 종이 정본은 `docs/야간조-보드게임/진상해설서.md`.
//
//   ── 첫 면이 표지여야 하는 이유 ────────────────────────────────────────────
//   이 문서는 인쇄물 여섯 가지 중 유일하게 **답이 통째로 적힌 것**이고, 뽑는 사람도
//   플레이어다. 배출된 종이를 집어 드는 순간 둘째 면이 눈에 들어오면 그 사람의 판은 거기서 끝난다.
//   그래서 첫 면을 「표지 + 봉투에 넣으라는 말」로 만들고, 답은 **둘째 면부터** 시작한다.
//   새벽이슬 genTruth.mjs 도 같은 이유로 같은 모양이다.
//
//   ── 파일명 ────────────────────────────────────────────────────────────────
//   `보드_야간조_진상해설서.html`. `보드_` 로 시작해야 build.mjs 의 marginFor() 가 여백 0 을 준다 —
//   `진상해설서_…` 로 지어도 여백 0 이 나오지만(build.mjs 에 그 분기가 따로 있다),
//   야간조 인쇄물은 접두사를 하나로 모아 두는 편이 인쇄 순서표에서 읽기 쉽다.
// ─────────────────────────────────────────────────────────────────────────────
import {
  esc, inline, parseBlocks, renderBlocks, dropNotes, paginate, page, docShell,
  PAGE_FIT, needMd,
} from './mdhtml.mjs';

const FRONT = /^\s*(담당|근거|출처|문면\s*원칙|기준)\s*[:：]/;

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

export function genTruthY(parsed, data = {}) {
  const md = needMd(parsed, 'truth', 'genTruthY');
  const all = parseBlocks(dropNotes(md)).filter((b) => {
    if (b.type !== 'quote') return true;
    const first = b.blocks.find((x) => x.type === 'p');
    return !(first && FRONT.test(first.text));
  });

  const { intro, parts } = splitH1(all);
  // 첫 h1 은 문서 제목이다 — 표지가 대신하므로 제목 줄은 버리고 본문만 쓴다.
  const titleSec = parts[0] && !/^\s*\d/.test(parts[0].title) ? parts[0] : null;
  const rest = titleSec ? parts.slice(1) : parts;
  const opening = [...intro, ...(titleSec?.blocks || [])];

  // ① 표지 — 여기까지만 보고 봉투에 넣는다.
  let body = page(`
    <div class="cover">
      <div class="covTop">
        <div class="covKicker">「야간조」 크라임씬 · 보드게임판</div>
        <div class="covTitle">진상 해설서</div>
        <div class="cbar"></div>
        <div class="covSub">판이 끝난 뒤에 폅니다</div>
      </div>
      <div class="sealBox">
        <b>이 첫 면만 확인하고 봉투에 넣어 봉하세요.</b>
        <p>둘째 면부터가 답입니다. <b>뽑은 사람도 플레이어입니다</b> —
          배출된 종이를 뒤집어 보지 말고 그대로 집어 봉투에 넣으세요.
          봉투는 판이 끝날 때까지 탁자 가운데에 둡니다.</p>
        <p class="sealHow">봉투가 없으면 <b>인쇄된 면이 안쪽으로 가게</b> 반으로 접어
          집게로 물려 두세요. 접힌 채로는 아무 글자도 보이지 않습니다.</p>
      </div>
      <div class="covWhen">
        <b>언제 펴는가</b>
        <div>최종 지목과 승패 판정이 <b>모두 끝난 뒤</b>에 폅니다.</div>
        <div>한 사람이 <b>「1. 그 밤에 실제로 일어난 일」</b>부터 소리 내어 읽으면 됩니다.</div>
        <div>못 잡았더라도 <b>부록 「어디서 끊겼나」</b>까지 읽으세요 — 거기서 판이 정리됩니다.</div>
      </div>
      <div class="covFoot">이 문서는 진행자용이 아니라 <b>전원이 함께 읽는 것</b>입니다.
        야간조에는 진행자가 없습니다.</div>
    </div>`, { cls: 'coverPage' });

  // ② 한눈에 · 머리말
  if (opening.length) {
    body += pagesOf('한눈에', opening);
  }

  // ③ 본문
  for (const p of rest) {
    body += pagesOf(p.title, p.blocks);
  }

  return {
    filename: '보드_야간조_진상해설서.html',
    html: docShell('야간조 — 진상 해설서', body, { css: TRUTH_CSS, script: PAGE_FIT }),
  };
}

// h1 은 「부」라서 크게 잡고, 안쪽은 h2 에서만 넉넉히 끊는다.
function pagesOf(title, blocks) {
  const chunks = paginate(blocks, { breakAt: 1, budget: 55, softAt: 2 });
  if (!chunks.length) chunks.push([]);
  return chunks.map((chunk, i) => page(
    (i === 0 && title ? `<h1>${inline(title)}</h1>` : `<div class="cont">${esc(title)} <span>(이어서)</span></div>`)
    + renderBlocks(chunk),
    { foot: '야간조 · 진상 해설서 — 판이 끝난 뒤에 읽습니다' },
  )).join('');
}

const TRUTH_CSS = `
.ypage { padding: 16mm 17mm 13mm; }
h1 { font-size: 16pt; border-bottom: 1.4px solid #14120f; padding-bottom: 2mm; margin-bottom: 4mm; }
.cont { font-size: 7.6pt; color: #a49b88; border-bottom: 0.3mm solid #e6e0d2;
        padding-bottom: 1.4mm; margin-bottom: 3.5mm; }
.cont span { font-weight: 400; }
/* 표지 */
.coverPage { padding: 0; }
.cover { height: 281mm; display: flex; flex-direction: column; justify-content: space-between;
         padding: 26mm 22mm 16mm; }
.covTop { text-align: center; }
.covKicker { font-size: 9pt; letter-spacing: .14em; color: #8a8375; }
.covTitle { font-size: 40pt; font-weight: 800; letter-spacing: .04em; margin-top: 4mm; }
.cbar { width: 34mm; height: 1mm; background: #8a3b3b; margin: 7mm auto; }
.covSub { font-size: 11pt; color: #6b6760; }
.sealBox { border: 0.8mm solid #8a3b3b; border-radius: 2.5mm; background: #fdf0ee;
           padding: 7mm 8mm; color: #6b2d2d; }
.sealBox > b { display: block; font-size: 13pt; margin-bottom: 3mm; }
.sealBox p { font-size: 10pt; line-height: 1.7; margin: 0 0 2mm; }
.sealHow { color: #8a5a55; }
.covWhen { border: 0.4mm solid #cfc7b6; border-radius: 2mm; padding: 5mm 6mm; background: #fbf9f3; }
.covWhen > b { display: block; font-size: 10.5pt; margin-bottom: 2mm; color: #4a4436; }
.covWhen > div { font-size: 9.6pt; line-height: 1.66; margin-bottom: 1mm; }
.covFoot { font-size: 8.4pt; color: #8a8375; border-top: 0.3mm solid #ded7c7; padding-top: 3mm;
           text-align: center; }
`;

export default genTruthY;
