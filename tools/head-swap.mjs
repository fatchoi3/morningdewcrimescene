// 표정 차분 만들기 — 기본 스탠딩의 '목 아래'는 원본 그대로 두고 머리만 갈아끼운다.
//   몸/다리/옷/포즈가 1픽셀도 안 바뀌므로, 표정만 달라진 같은 인물로 읽힌다.
//   (통째로 다시 생성하면 몸통·다리 방향이 틀어져 순간 다른 사람처럼 보인다 — 그래서 이 방식.)
//
//   사용: node tools/head-swap.mjs <기본.png> <머리출처.png> <출력파일명> [옵션]
//     --dx=0      좌우 미세조정(px, 기본 그림 좌표계)
//     --dy=0      상하 미세조정(px, +면 머리가 내려간다)
//     --scale=1   목폭 기준 자동 배율에 곱할 보정
//     --feather=16 이음선 알파 그라데이션 높이(px)
//     --debug     목 탐지 결과만 출력하고 종료
import sharp from 'sharp';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const STAND = join(ROOT, 'public', 'images', 'people', 'stand');

const args = process.argv.slice(2);
const opt = (k, d) => {
  const hit = args.find((a) => a.startsWith(`--${k}=`));
  return hit ? Number(hit.split('=')[1]) : d;
};
const [basePath, headPath, outName] = args.filter((a) => !a.startsWith('--'));
if (!basePath || !headPath || !outName) {
  console.error('사용: node tools/head-swap.mjs <기본.png> <머리출처.png> <출력파일명> [--dx --dy --scale --feather --debug]');
  process.exit(1);
}
const DX = opt('dx', 0), DY = opt('dy', 0), SCALE = opt('scale', 1), FEATHER = opt('feather', 16);
const DEBUG = args.includes('--debug');

/** 행별 불투명 폭을 재고 목을 찾는다.
 *  머리에서 폭이 국소 최소가 되는 지점은 여러 개다(머리카락 삐침, 귀 옆). 그래서
 *  '머리 최대폭 행'을 먼저 잡고 그 아래에서 최솟값을 찾는다 — 그게 목이다. */
async function analyze(p) {
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const rows = [];
  for (let y = 0; y < H; y++) {
    let x0 = -1, x1 = -1, n = 0;
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 60) { if (x0 < 0) x0 = x; x1 = x; n++; }
    }
    rows.push({ y, x0, x1, w: x1 - x0 + 1, n });
  }
  const solid = rows.filter((r) => r.n > 4);
  const headTop = solid[0]?.y ?? 0;
  // 폭 프로파일: 정수리(얇음) → 머리 최대폭 → 목(골짜기) → 어깨(급격히 넓어짐).
  //   창 크기로 자르면 인물 비율에 따라 어깨를 '머리'로 오인한다. 그래서 골짜기를 추적한다.
  let headW = 0, headWideY = headTop, neck = null;
  for (let y = headTop; y < H; y++) {
    const r = rows[y];
    if (r.n <= 4) continue;
    if (r.w > headW) { headW = r.w; headWideY = y; }
    // 최대폭의 68% 아래로 꺼지면 골짜기(목)에 들어선 것 — 최저점을 찍고 다시 올라가면 확정
    if (headW > 60 && y > headWideY + 12 && r.w < headW * 0.68) {
      let best = r;
      for (let z = y; z < H; z++) {
        const s = rows[z];
        if (s.n <= 4) continue;
        if (s.w <= best.w) best = s;
        else if (s.w > best.w * 1.22) break;               // 어깨로 벌어졌다 = 골짜기 끝
      }
      neck = best;
      break;
    }
  }
  return { W, H, headTop, neck, headW, headWideY, rows };
}

const b = await analyze(basePath);
const h = await analyze(headPath);
if (!b.neck || !h.neck) { console.error('목을 못 찾았습니다', { base: b.neck, head: h.neck }); process.exit(1); }

const bcx = (b.neck.x0 + b.neck.x1) / 2;
const hcx = (h.neck.x0 + h.neck.x1) / 2;
// 배율은 '목폭'을 맞춘다 — 이음선이 어긋나지 않는 게 머리 크기보다 중요하다.
//   다만 목폭은 고개 각도에 따라 흔들리므로 머리폭 기준과 평균 내 튀는 걸 막는다.
const kNeck = b.neck.w / h.neck.w;
const kHead = b.headW / h.headW;
const K = opt('k', 0);                                    // 직접 지정하면 자동 배율을 무시한다
const k = K > 0 ? K : ((kNeck + kHead) / 2) * SCALE;

console.log(`기본 ${b.W}x${b.H}  목 y=${b.neck.y} x=${b.neck.x0}~${b.neck.x1}(폭 ${b.neck.w}) 머리폭 ${b.headW}`);
console.log(`머리 ${h.W}x${h.H}  목 y=${h.neck.y} x=${h.neck.x0}~${h.neck.x1}(폭 ${h.neck.w}) 머리폭 ${h.headW}`);
console.log(`배율 목기준 ${kNeck.toFixed(3)} / 머리기준 ${kHead.toFixed(3)} → 적용 ${k.toFixed(3)}`);
if (DEBUG) process.exit(0);

// ── 머리 출처에서 '머리만' 오려낸다(목 아래 feather 만큼만 더 남기고) ──
//   전체 그림을 확대하면 캔버스를 넘친다 — 오려낸 뒤에 배율을 적용해야 한다.
const cropBot = Math.min(h.H - 1, h.neck.y + FEATHER);
let cx0 = h.W, cx1 = 0;
for (let y = h.headTop; y <= cropBot; y++) {
  const r = h.rows[y];
  if (r.n > 4) { cx0 = Math.min(cx0, r.x0); cx1 = Math.max(cx1, r.x1); }
}
const cw = cx1 - cx0 + 1, ch = cropBot - h.headTop + 1;
const sw = Math.max(1, Math.round(cw * k)), sh0 = Math.max(1, Math.round(ch * k));
const { data: hd0 } = await sharp(headPath)
  .extract({ left: cx0, top: h.headTop, width: cw, height: ch })
  .resize(sw, sh0, { kernel: 'lanczos3' })
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });

let cutY = Math.round((h.neck.y - h.headTop) * k);     // 오려낸 그림 안에서의 목 위치
const fpx = Math.max(1, Math.round(FEATHER * k));

// ── 머리 올리기 ──
//   생성된 머리는 기본 그림보다 목이 길다. 목 단면을 이음선에 맞추면 얼굴이 그만큼 내려앉아
//   "목 짧은 사람"이 되고 귓불이 옷깃에 물린다(심사 3명이 눈높이 17~19px 처짐으로 지적).
//   그래서 머리를 RAISE 만큼 올리고, 생긴 빈틈은 목 단면 한 줄을 반복해 메운다 —
//   목은 매끈한 살색 기둥이라 늘려도 티가 안 난다.
const RAISE = Math.max(0, Math.round(opt('raise', 0) * k));
const sh = sh0 + RAISE;
const hd = new Uint8Array(sw * sh * 4);
//   메우는 방법이 중요하다. 한 행을 반복하면 그 행에 걸린 턱선·옷깃 잉크가 세로로 번져
//   검은 띠가 생긴다(실제로 그랬다). 그래서 목 구간(BAND 행)을 BAND+RAISE 행으로 '늘려' 뽑는다 —
//   목 양옆 윤곽선이 거의 수직이라 늘려도 선이 끊기지 않고, 중복이 구간 전체에 흩어져 눈에 안 띈다.
const BAND = Math.max(12, RAISE * 2);
const bandTop = Math.max(0, cutY - BAND);
const bandSrc = cutY - bandTop;                        // 원본 쪽 구간 높이
const bandDst = bandSrc + RAISE;                       // 늘린 뒤 높이
for (let y = 0; y < sh; y++) {
  let sy;
  if (y < bandTop) sy = y;
  else if (y <= bandTop + bandDst) sy = bandTop + Math.round(((y - bandTop) / bandDst) * bandSrc);
  else sy = y - RAISE;
  sy = Math.min(sh0 - 1, Math.max(0, sy));
  hd.set(hd0.subarray(sy * sw * 4, (sy + 1) * sw * 4), y * sw * 4);
}
cutY += RAISE;

// ── 목 중심을 맞춰 배치 위치를 먼저 정한다(아래 클리핑·톤보정이 이 값에 의존한다) ──
const left = Math.round(bcx - (hcx - cx0) * k + DX);
const top = Math.round(b.neck.y - cutY + DY);

// ── 기본 그림 로드 + 목 단면 평균색(톤 기준) 확보 후 원래 머리 지우기 ──
const { data: bd, info: bi } = await sharp(basePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
/** 지정한 행의 x 구간에서 불투명 픽셀 평균색 — '목 단면색'을 톤 기준으로 쓴다. */
const rowMean = (buf, W, y, x0, x1) => {
  let r = 0, g = 0, bl = 0, n = 0;
  for (let x = x0; x <= x1; x++) {
    const i = (y * W + x) * 4;
    if (buf[i + 3] > 200) { r += buf[i]; g += buf[i + 1]; bl += buf[i + 2]; n++; }
  }
  return n ? [r / n, g / n, bl / n] : null;
};
const [nr, ng, nb] = rowMean(bd, bi.width, b.neck.y, b.neck.x0, b.neck.x1) || [220, 180, 155];

/** 머리 구간에서 '살색'으로 보이는 픽셀들의 평균 — 뺨·이마가 대부분이라 톤 비교 기준으로 좋다.
 *  목 단면 한 줄은 그림자라 대표성이 없다(그걸로 맞추면 얼굴이 붉게 튄다). */
const skinMean = (buf, W, y0, y1) => {
  let r = 0, g = 0, bl = 0, n = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const R = buf[i], G = buf[i + 1], B = buf[i + 2];
      if (buf[i + 3] > 200 && R > 150 && R > G && G > B && R - B > 20) { r += R; g += G; bl += B; n++; }
    }
  }
  return n > 200 ? [r / n, g / n, bl / n] : null;
};
const baseTone = skinMean(bd, bi.width, 0, b.neck.y) || [227, 188, 158];
for (let y = 0; y < b.neck.y; y++) {
  for (let x = 0; x < bi.width; x++) bd[(y * bi.width + x) * 4 + 3] = 0;
}

// ── 살색 톤 맞추기 ──
//   생성된 머리는 기본 그림보다 밝고 음영이 평평한 경향이 있다. 그대로 붙이면 턱선에서
//   "밝은 얼굴 / 어두운 목"으로 톤이 한 단 끊겨 오려붙인 티가 난다(심사에서 가장 많이 지적된 결함).
//   두 그림의 목 단면 평균색 비율로 전체에 게인을 건다. 머리카락은 거의 검어서 게인 영향이 거의 없다.
const { data: hfull, info: hinfo } = await sharp(headPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const headTone = skinMean(hfull, hinfo.width, h.headTop, h.neck.y);
const NOTONE = args.includes('--no-tone');
const gain = (!NOTONE && headTone)
  ? baseTone.map((v, i) => Math.min(1.25, Math.max(0.75, v / (headTone[i] || 1))))
  : [1, 1, 1];
if (gain.some((g) => g !== 1)) {
  for (let i = 0; i < sw * sh; i++) {
    for (let c = 0; c < 3; c++) hd[i * 4 + c] = Math.min(255, Math.round(hd[i * 4 + c] * gain[c]));
  }
}
console.log(`톤 기준 목색 기본 [${baseTone.map((v) => Math.round(v))}] / 머리 [${headTone ? headTone.map((v) => Math.round(v)) : '없음'}]`
  + ` → 게인 [${gain.map((g) => g.toFixed(3))}]`);

// 이음선 아래는 서서히 사라지게 — 기본 그림의 목과 자연히 이어진다.
//   여기에 두 겹의 제한을 둔다:
//     ① 기본 그림의 목 폭 안쪽만 (밖으로 늘어진 머리카락·어깨 끝 제거)
//     ② 기본 그림 목 색과 비슷한 픽셀만 (목 폭 안으로 늘어진 검은 머리카락 제거)
//   출처가 아니라 '기본' 기준이어야, 고개 각도 탓에 목이 두꺼운 머리를 붙여도 삐져나오지 않는다.
//   가로 제한을 '목 폭'으로 잡으면 턱이 그 폭보다 넓을 때 직선으로 잘려 직각 노치가 생긴다
//   (심사 4명이 지적). 그래서 기준을 '기본 그림이 불투명한 곳'으로 바꾼다 — 턱이 후드 위로
//   자연히 걸치고, 몸 밖으로는 절대 안 나간다. 살색 게이트가 출처의 머리카락·옷깃을 걸러 준다.
const TOL = opt('tol', 110);
for (let y = 0; y < sh; y++) {
  const over = y - cutY;
  if (over <= 0) continue;                                     // 이음선 위는 그대로
  const a = over >= fpx ? 0 : 1 - over / fpx;
  const by = top + y;
  for (let x = 0; x < sw; x++) {
    const i = (y * sw + x) * 4;
    let keep = a;
    if (keep > 0) {
      const bx = left + x;
      const opaque = by >= 0 && by < bi.height && bx >= 0 && bx < bi.width
        && bd[(by * bi.width + bx) * 4 + 3] > 40;
      if (!opaque) keep = 0;                                   // 기본 몸 밖으로는 안 나간다
      else {
        const d = Math.hypot(hd[i] - nr, hd[i + 1] - ng, hd[i + 2] - nb);
        if (d > TOL) keep = 0;                                 // 살색에서 먼 색(머리카락·옷) → 버린다
      }
    }
    hd[i + 3] = Math.round(hd[i + 3] * keep);
  }
}
let clipped = 0;
for (let y = 0; y < sh; y++) {
  const by = top + y;
  if (by < 0 || by >= bi.height) { clipped++; continue; }
  for (let x = 0; x < sw; x++) {
    const bx = left + x;
    if (bx < 0 || bx >= bi.width) { clipped++; continue; }
    const si = (y * sw + x) * 4, di = (by * bi.width + bx) * 4;
    const sa = hd[si + 3] / 255;
    if (sa <= 0) continue;
    const da = bd[di + 3] / 255;
    const oa = sa + da * (1 - sa);
    for (let c = 0; c < 3; c++) bd[di + c] = Math.round((hd[si + c] * sa + bd[di + c] * da * (1 - sa)) / oa);
    bd[di + 3] = Math.round(oa * 255);
  }
}
// ── 마무리: 떨어져 있는 '어두운' 조각 제거 ──
//   출처 머리에서 턱 옆으로 늘어진 머리카락은 이음선 아래가 잘려 공중에 뜬 검은 획으로 남는다.
//   몸통과 이어지지 않은 작은 덩어리 중 어두운 것만 지운다 — 땀방울은 밝아서 살아남는다(표정의 일부).
const W = bi.width, H = bi.height;
// 그라데이션이 남긴 거의 투명한 찌꺼기(알파 10% 이하)는 지운다 — 확대해 보면 흐린 획으로 보인다.
for (let i = 0; i < W * H; i++) if (bd[i * 4 + 3] <= 26) bd[i * 4 + 3] = 0;
const lab = new Int32Array(W * H).fill(-1);
const comps = [];
const stack = [];
for (let s = 0; s < W * H; s++) {
  if (lab[s] !== -1 || bd[s * 4 + 3] <= 40) continue;
  const id = comps.length;
  let area = 0, lum = 0;
  lab[s] = id; stack.push(s);
  while (stack.length) {
    const i = stack.pop();
    area++;
    lum += (bd[i * 4] * 299 + bd[i * 4 + 1] * 587 + bd[i * 4 + 2] * 114) / 1000;
    const x = i % W, y = (i / W) | 0;
    const nb4 = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
    for (const j of nb4) if (j >= 0 && lab[j] === -1 && bd[j * 4 + 3] > 40) { lab[j] = id; stack.push(j); }
  }
  comps.push({ id, area, lum: lum / area });
}
const main = comps.reduce((a, c) => (c.area > a.area ? c : a), comps[0] || { area: 0, id: -1 });
//   어둡거나(머리카락) 아주 작은(잘린 획) 덩어리만 지운다 — 떨어진 땀방울은 밝고 충분히 커서 남는다.
const kill = new Set(comps.filter((c) => c.id !== main.id && (c.lum < 110 || c.area < 40)).map((c) => c.id));
let wiped = 0;
if (kill.size) {
  for (let i = 0; i < W * H; i++) if (kill.has(lab[i])) { bd[i * 4 + 3] = 0; wiped++; }
}

const out = join(STAND, outName);
await sharp(bd, { raw: { width: W, height: H, channels: 4 } })
  .png({ compressionLevel: 9 }).toFile(out);
console.log(`→ ${outName}  머리 ${sw}x${sh} 배치 left=${left} top=${top}`
  + ` (목 y=${b.neck.y}, feather ${fpx}px${clipped ? `, 잘림 ${clipped}px` : ''}`
  + `, 조각 ${comps.length}개 중 어두운 부유물 ${kill.size}개 ${wiped}px 제거)`);
