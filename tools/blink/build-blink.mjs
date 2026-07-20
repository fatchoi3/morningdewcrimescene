// ─────────────────────────────────────────────────────────────────────────────
// build-blink — 눈감음 프레임(art_frames/PLAYER_blink.png)을 원본과 정렬·검증하고
//   눈 부위만 잘라 오버레이(public/images/people/stand/PLAYER.eyes.png)를 만든다.
//   실행: node tools/blink/build-blink.mjs [SID]   (기본 SID=PLAYER)
//   출력: 정렬 dx,dy · 차이 통계(눈만 바뀌었는지) · 오버레이 PNG · 리그 좌표(%).
// ─────────────────────────────────────────────────────────────────────────────
import sharp from 'sharp';

const SID = process.argv[2] || 'PLAYER';
const BASE = `public/images/people/stand/${SID}.png`;
const FRAME = `art_frames/${SID}_blink.png`;
const OUT = `public/images/people/stand/${SID}.eyes.png`;

// 배경(투명 or 근균일 단색) → alpha 0, 그리고 내용 bbox로 트림한 투명 피규어 반환
async function figure(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info, ch = 4, idx = (x, y) => (y * W + x) * ch;
  const s = idx(0, 0), sr = data[s], sg = data[s + 1], sb = data[s + 2];
  const isBg = (i) => data[i + 3] < 20 || (Math.abs(data[i] - sr) + Math.abs(data[i + 1] - sg) + Math.abs(data[i + 2] - sb) < 60);
  const bg = new Uint8Array(W * H), qx = new Int32Array(W * H), qy = new Int32Array(W * H); let h = 0, t = 0;
  const seed = (x, y) => { const p = y * W + x; if (!bg[p] && isBg(idx(x, y))) { bg[p] = 1; qx[t] = x; qy[t] = y; t++; } };
  for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1); } for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y); }
  while (h < t) { const x = qx[h], y = qy[h]; h++; for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) { if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const p = ny * W + nx; if (bg[p]) continue; if (isBg(idx(nx, ny))) { bg[p] = 1; qx[t] = nx; qy[t] = ny; t++; } } }
  for (let p = 0; p < W * H; p++) if (bg[p]) data[p * ch + 3] = 0;
  let minx = W, miny = H, maxx = 0, maxy = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (data[idx(x, y) + 3] > 30) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; } }
  return sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: minx, top: miny, width: maxx - minx + 1, height: maxy - miny + 1 }).png().toBuffer();
}

const base = await sharp(BASE).ensureAlpha().png().toBuffer();
const bmeta = await sharp(base).metadata();
const W = bmeta.width, H = bmeta.height;

// 눈감음 프레임 → 피규어 → base와 같은 높이로 리사이즈 → base 폭 캔버스에 가운데 배치
let blinkFig = await figure(FRAME);
blinkFig = await sharp(blinkFig).resize({ height: H }).png().toBuffer();
let blink = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: blinkFig, gravity: 'center' }]).png().toBuffer();

const A = await sharp(base).raw().toBuffer({ resolveWithObject: true });
const B = await sharp(blink).raw().toBuffer({ resolveWithObject: true });
const al = (d, x, y) => d[(y * W + x) * 4 + 3];

// 실루엣 상관으로 미세 정렬(dx,dy)
let best = { s: 1e15, dx: 0, dy: 0 };
for (let dy = -30; dy <= 30; dy += 2) for (let dx = -24; dx <= 24; dx += 2) {
  let s = 0;
  for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) {
    const a = al(A.data, x, y) > 90 ? 1 : 0; const bx = x - dx, by = y - dy;
    const b = (bx < 0 || by < 0 || bx >= W || by >= H) ? 0 : (al(B.data, bx, by) > 90 ? 1 : 0);
    if (a !== b) s++;
  }
  if (s < best.s) best = { s, dx, dy };
}
const { dx, dy } = best;

// 정렬 후 RGB 차이 bbox(= 바뀐 영역 = 눈)
let minx = W, miny = H, maxx = 0, maxy = 0, ndiff = 0, nover = 0, sad = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 4, bx = x - dx, by = y - dy;
  if (bx < 0 || by < 0 || bx >= W || by >= H) continue;
  const bi = (by * W + bx) * 4;
  if (A.data[i + 3] > 120 && B.data[bi + 3] > 120) {
    nover++;
    const d = Math.abs(A.data[i] - B.data[bi]) + Math.abs(A.data[i + 1] - B.data[bi + 1]) + Math.abs(A.data[i + 2] - B.data[bi + 2]);
    sad += d;
    if (d > 85) { ndiff++; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
  }
}
console.log(`정렬 dx,dy=${dx},${dy} | 평균색차 ${(sad / nover).toFixed(1)} | 큰차이 ${(ndiff / nover * 100).toFixed(1)}%`);
console.log(`바뀐 영역 bbox: x ${minx}~${maxx}, y ${miny}~${maxy} (${(miny / H * 100).toFixed(1)}%~${(maxy / H * 100).toFixed(1)}%)`);
const spreadY = (maxy - miny) / H;
if (spreadY > 0.15 || (ndiff / nover) > 0.03) {
  console.log(`⚠ 차이가 눈보다 넓게 퍼짐(${(spreadY * 100).toFixed(0)}%). 전체 재생성일 가능성 → 눈만 인페인트로 다시.`);
}

// blink를 base 프레임으로 (dx,dy) 시프트 후, 바뀐(눈) 영역만 잘라 오버레이 저장
const M = 48;
const padded = await sharp(blink).extend({ top: M, bottom: M, left: M, right: M, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const shifted = await sharp(padded).extract({ left: M - dx, top: M - dy, width: W, height: H }).png().toBuffer();
const pad = 6;
const cx0 = Math.max(0, minx - pad), cy0 = Math.max(0, miny - pad);
const cw = Math.min(W - cx0, (maxx - minx) + pad * 2), chh = Math.min(H - cy0, (maxy - miny) + pad * 2);
await sharp(shifted).extract({ left: cx0, top: cy0, width: cw, height: chh }).png().toFile(OUT);
console.log(`오버레이 저장: ${OUT} (${cw}x${chh})`);
console.log(`리그 좌표(%) → left ${(cx0 / W * 100).toFixed(2)}, top ${(cy0 / H * 100).toFixed(2)}, width ${(cw / W * 100).toFixed(2)}, height ${(chh / H * 100).toFixed(2)}`);
