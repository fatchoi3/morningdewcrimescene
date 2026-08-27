import fs from 'node:fs';
const f = 'tools/docgen/genBoard.mjs';
let s = fs.readFileSync(f, 'utf8');
const bad = [];
const put = (a, b) => { if (!s.includes(a)) bad.push(a.slice(0, 58)); else s = s.split(a).join(b); };

// 라운드 트랙은 여섯 칸 트랙과 다섯 칸 트랙을 위아래로 얹은 장이라 세로가 원래 빠듯하다.
//   폭이 두 배가 돼도 칸 높이는 최소 높이가 정하므로 세로는 안 준다 — 386mm 로 넘쳤다.
//   글자를 조금 되돌리고, 넘치면 스크립트가 담기는 데까지 줄이게 한다.
put("  '  .page.board .cellN { font-size: 30pt; }',", "  '  .page.board .cellN { font-size: 25pt; }',");
put("  '  .page.board .cellTop { min-height: 12mm; }',", "  '  .page.board .cellTop { min-height: 10mm; }',");
put("  '  .page.board .cellOpen { font-size: 10pt; min-height: 15mm; padding: 2mm 0; }',",
    "  '  .page.board .cellOpen { font-size: 8.6pt; min-height: 12mm; padding: 1.6mm 0; }',");
put("  '  .page.board .cellDo { font-size: 10.4pt; }',", "  '  .page.board .cellDo { font-size: 8.8pt; }',");
put("  '  .page.board .evSlot { font-size: 11pt; min-height: 20mm; }',",
    "  '  .page.board .evSlot { font-size: 9.4pt; min-height: 16mm; }',");
put("  '  .page.board .evSlotSub { font-size: 8pt; }',", "  '  .page.board .evSlotSub { font-size: 6.8pt; }',");
put("  '  .page.board .pawnSlot { width: 18mm; height: 18mm; font-size: 8pt; }',",
    "  '  .page.board .pawnSlot { width: 15mm; height: 15mm; font-size: 7pt; }',");
put("  '  .page.board .endStep { font-size: 10.6pt; padding: 3mm 2.4mm; }',",
    "  '  .page.board .endStep { font-size: 9pt; padding: 2.4mm 2mm; }',");
put("  '  .page.board .trN { font-size: 22pt; }',", "  '  .page.board .trN { font-size: 19pt; }',");
put("  '  .page.board .trL { font-size: 10.4pt; }',", "  '  .page.board .trL { font-size: 9pt; }',");
put("  '  .page.board .trX { font-size: 9.4pt; }',", "  '  .page.board .trX { font-size: 8.2pt; }',");
put("  '  .page.board .cellTag { font-size: 8.4pt; }',", "  '  .page.board .cellTag { font-size: 7.2pt; }',");

// ── 맞춤 스크립트가 아무 일도 안 하고 있었다 ──────────────────────────────────
//   .page 에는 높이가 정해져 있지 않아 제 내용만큼 늘어난다. 그 높이를 상자로 삼아 잰
//   비율은 언제나 100% 라, 넘치는 장을 한 번도 못 잡았다. 종이 크기로 직접 잰다.
put(`      var p = pages[i], w = p.firstElementChild;
      if (!w) continue;
      w.style.transform = "";
      var cs = getComputedStyle(p);
      var bw = p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var bh = p.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);`,
`      var p = pages[i], w = p.firstElementChild;
      if (!w) continue;
      w.style.transform = "";
      var cs = getComputedStyle(p);
      /* .page 는 제 내용만큼 늘어나므로 그 높이로 재면 언제나 100% 다 — 종이로 잰다. */
      var mm = 96 / 25.4;
      var bw = 420 * mm - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var bh = 297 * mm - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);`);
put('      var k = Math.min(bw / w.scrollWidth, bh / w.scrollHeight, MAX);',
    '      var k = Math.min(bw / w.scrollWidth, bh / w.scrollHeight, MAX);\n'
  + '      /* 줄일 때는 폭도 함께 줄어드니, 줄인 만큼 폭을 되돌려 옆의 빈자리를 쓴다. */');

if (bad.length) { console.log('못 찾은 것:\n' + bad.join('\n')); process.exit(1); }
fs.writeFileSync(f, s, 'utf8');
console.log('트랙 글씨를 되돌리고 · 맞춤 스크립트가 종이로 재게 한다');
