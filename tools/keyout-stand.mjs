// 스탠딩 1장 후처리 — 표정 변형본을 기존 스탠딩과 같은 규격으로 맞춘다.
//   흰 배경 flood-fill 키잉(인물 내부 흰색은 보존) → 투명 여백 trim → 기준 높이로 리사이즈
//   → (--match 주면) 기준 그림과 캔버스 크기를 정확히 일치시킴.
//   캔버스가 1px만 달라도 height 고정·width auto 로 그리는 심문 화면에서 인물이 미세하게 움직인다.
//
//   사용: node tools/keyout-stand.mjs <src.png> <출력파일명(stand/ 안)> [기준높이] [--match=S1.png]
//   예  : node tools/keyout-stand.mjs C:/Users/user/Downloads/Gemini_x.png S1_shock.png 1128 --match=S1.png
import sharp from 'sharp';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const STAND = join(ROOT, 'public', 'images', 'people', 'stand');

const argv = process.argv.slice(2);
const matchArg = argv.find((a) => a.startsWith('--match='))?.split('=')[1];
const [src, outName, heightArg] = argv.filter((a) => !a.startsWith('--'));
if (!src || !outName) {
  console.error('사용: node tools/keyout-stand.mjs <src.png> <출력파일명> [기준높이=1128] [--match=기준.png]');
  process.exit(1);
}
// --match 를 주면 그 그림의 높이·폭을 그대로 따른다. 기본 스탠딩은 인물마다 높이가 다르다
//   (S1 1128, S2 1127 …) — 1128로 고정하면 미세하게 어긋난다.
const refMeta = matchArg ? await sharp(join(STAND, matchArg)).metadata() : null;
const H_OUT = refMeta?.height || Number(heightArg) || 1128;
const NEAR_WHITE = 235;

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const isWhite = (i) => data[i * 4] >= NEAR_WHITE && data[i * 4 + 1] >= NEAR_WHITE && data[i * 4 + 2] >= NEAR_WHITE;

// 테두리에서 시작하는 flood-fill — 눈 흰자·옷 하이라이트처럼 갇힌 흰색은 살아남는다
const seen = new Uint8Array(W * H);
const queue = [];
for (let x = 0; x < W; x++) queue.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) queue.push(y * W, y * W + W - 1);
while (queue.length) {
  const i = queue.pop();
  if (seen[i] || !isWhite(i)) continue;
  seen[i] = 1;
  data[i * 4 + 3] = 0;
  const x = i % W, y = (i / W) | 0;
  if (x > 0) queue.push(i - 1);
  if (x < W - 1) queue.push(i + 1);
  if (y > 0) queue.push(i - W);
  if (y < H - 1) queue.push(i + W);
}

const out = join(STAND, outName);
let buf = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
  .trim()                                   // 투명 여백 제거 — objectFit 레터박스 방지
  .resize({ height: H_OUT, withoutEnlargement: true })
  .png({ compressionLevel: 9 })
  .toBuffer();

// 기준 그림과 캔버스를 정확히 맞춘다. 폭이 남으면 투명 여백을 좌우로 나눠 붙이고,
//   넘치면 가운데를 기준으로 잘라낸다 — 인물은 어차피 캔버스 가운데에 있다.
if (refMeta) {
  const ref = refMeta;
  const cur = await sharp(buf).metadata();
  if (cur.width !== ref.width) {
    const d = ref.width - cur.width;
    buf = d > 0
      ? await sharp(buf).extend({ left: d >> 1, right: d - (d >> 1), background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
      : await sharp(buf).extract({ left: (-d) >> 1, top: 0, width: ref.width, height: cur.height }).png().toBuffer();
    console.log(`  캔버스 폭 ${cur.width} → ${ref.width} (${matchArg} 기준)`);
  }
}
await sharp(buf).toFile(out);
const m = await sharp(out).metadata();
console.log(`${outName}: ${m.width}x${m.height} (비율 ${(m.width / m.height).toFixed(4)})`);
