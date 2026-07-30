// 표정 차분이 '얼굴만' 바뀌었는지 수치로 확인한다.
//   목 아래 구간에서 행별 실루엣(좌·우 끝, 폭)을 비교해 몸이 몇 px 움직였는지 재고,
//   겹침 그림(파랑=기본만, 주황=새것만, 흰색=겹침)을 남긴다.
//
//   사용: node tools/expr-check.mjs <기본.png> <차분.png> [겹침출력.png] [목y=168]
import sharp from 'sharp';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const STAND = join(ROOT, 'public', 'images', 'people', 'stand');
const [aF, bF, outPng, neckArg] = process.argv.slice(2);
if (!aF || !bF) { console.error('사용: node tools/expr-check.mjs <기본.png> <차분.png> [겹침.png] [목y]'); process.exit(1); }

const load = async (f) => {
  const { data, info } = await sharp(join(STAND, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const rows = [];
  for (let y = 0; y < H; y++) {
    let x0 = -1, x1 = -1, n = 0;
    for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 60) { if (x0 < 0) x0 = x; x1 = x; n++; }
    rows.push({ x0, x1, w: x1 - x0 + 1, n });
  }
  return { data, W, H, rows };
};

const A = await load(aF), B = await load(bF);
console.log(`${aF} ${A.W}x${A.H}   ${bF} ${B.W}x${B.H}`);
if (A.W !== B.W || A.H !== B.H) console.log('  ⚠ 캔버스 크기가 다르다 — keyout-stand 의 --match 로 맞출 것');

// 키 대비 비율로 잡은 지점들 — 인물 비율이 달라도 대략 같은 부위를 본다
const NECK = Number(neckArg) || 168;
const marks = [['어깨선', .18], ['가슴', .23], ['팔꿈치', .34], ['손', .42],
  ['허리', .50], ['엉덩이', .55], ['무릎', .71], ['정강이', .84], ['발', .967]];
let worstDx = 0, worstDw = 0;
console.log('  구간        기본 x0~x1(폭)      차분 x0~x1(폭)     중심차  폭차');
for (const [name, r] of marks) {
  const y = Math.min(A.H, B.H) - 1 & 0xffff, yy = Math.round(Math.min(A.H, B.H) * r);
  void y;
  const a = A.rows[yy], b = B.rows[yy];
  if (!a || !b || a.n < 3 || b.n < 3) { console.log(`  ${name.padEnd(9)} (한쪽이 비어 있음)`); continue; }
  const dx = (b.x0 + b.x1) / 2 - (a.x0 + a.x1) / 2, dw = b.w - a.w;
  worstDx = Math.max(worstDx, Math.abs(dx));
  worstDw = Math.max(worstDw, Math.abs(dw));
  console.log(`  ${name.padEnd(9)} ${String(a.x0).padStart(4)}~${String(a.x1).padStart(4)}(${String(a.w).padStart(3)})`
    + `   ${String(b.x0).padStart(4)}~${String(b.x1).padStart(4)}(${String(b.w).padStart(3)})`
    + `   ${dx >= 0 ? '+' : ''}${dx.toFixed(1)}   ${dw >= 0 ? '+' : ''}${dw}`);
}
let inter = 0, uni = 0;
for (let y = NECK; y < Math.min(A.H, B.H); y++) {
  for (let x = 0; x < Math.min(A.W, B.W); x++) {
    const pa = A.data[(y * A.W + x) * 4 + 3] > 60, pb = B.data[(y * B.W + x) * 4 + 3] > 60;
    if (pa && pb) inter++;
    if (pa || pb) uni++;
  }
}
console.log(`\n  목(y=${NECK}) 아래 실루엣 일치율(IoU) ${(inter / uni * 100).toFixed(1)}%`
  + `   최대 중심차 ${worstDx.toFixed(1)}px   최대 폭차 ${worstDw}px`);

if (outPng) {
  const W = Math.min(A.W, B.W), H = Math.min(A.H, B.H);
  const out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const pa = A.data[(y * A.W + x) * 4 + 3] > 60, pb = B.data[(y * B.W + x) * 4 + 3] > 60;
    if (pa && pb) { out[i] = out[i + 1] = out[i + 2] = 245; }
    else if (pa) { out[i] = 70; out[i + 1] = 130; out[i + 2] = 235; }
    else if (pb) { out[i] = 240; out[i + 1] = 140; out[i + 2] = 40; }
    else { out[i] = out[i + 1] = out[i + 2] = 24; }
    out[i + 3] = 255;
  }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(outPng);
  console.log(`  겹침 그림 → ${outPng}`);
}
