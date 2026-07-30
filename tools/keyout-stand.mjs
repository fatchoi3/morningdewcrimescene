// 스탠딩 1장 후처리 — 표정 변형본을 기존 스탠딩과 같은 규격으로 맞춘다.
//   흰 배경 flood-fill 키잉(인물 내부 흰색은 보존) → 투명 여백 trim → 기준 높이로 리사이즈
//   기준 높이를 S1.png(1128)과 맞추면 심문 화면에서 머리 위치가 튀지 않는다.
//
//   사용: node tools/keyout-stand.mjs <src.png> <출력파일명(stand/ 안)> [기준높이]
//   예  : node tools/keyout-stand.mjs C:/Users/user/Downloads/Gemini_x.png S1_shock.png
import sharp from 'sharp';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const STAND = join(ROOT, 'public', 'images', 'people', 'stand');

const [src, outName, heightArg] = process.argv.slice(2);
if (!src || !outName) {
  console.error('사용: node tools/keyout-stand.mjs <src.png> <출력파일명> [기준높이=1128]');
  process.exit(1);
}
const H_OUT = Number(heightArg) || 1128;   // S1.png 기준
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
const buf = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
  .trim()                                   // 투명 여백 제거 — objectFit 레터박스 방지
  .resize({ height: H_OUT, withoutEnlargement: true })
  .png({ compressionLevel: 9 })
  .toBuffer();
await sharp(buf).toFile(out);
const m = await sharp(out).metadata();
console.log(`${outName}: ${m.width}x${m.height} (비율 ${(m.width / m.height).toFixed(4)})`);
