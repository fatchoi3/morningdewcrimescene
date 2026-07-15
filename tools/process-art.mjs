// 생성 이미지 후처리 (1회성 유틸)
//   scenes/ROOM-*.png  → 1600px 리사이즈 + jpg(q82) 변환(용량 절감), 원본 png 삭제
//   people/stand/S*.png → 테두리에서 흰 배경 flood-fill 키잉(투명) + 높이 1200px 리사이즈
//   사용: node tools/process-art.mjs
import sharp from 'sharp';
import { readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SCENES = join(ROOT, 'public', 'images', 'scenes');
const STAND = join(ROOT, 'public', 'images', 'people', 'stand');

// ── 방 배경: png → jpg ──
for (const f of readdirSync(SCENES).filter((f) => f.endsWith('.png'))) {
  const src = join(SCENES, f);
  const out = src.replace(/\.png$/, '.jpg');
  await sharp(src).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(out);
  unlinkSync(src);
  console.log('scene:', f, '→ jpg');
}

// ── 스탠딩: 테두리 연결된 흰 영역만 투명화(인물 내부 흰색은 보존) ──
const NEAR_WHITE = 235;
for (const f of readdirSync(STAND).filter((f) => f.endsWith('.png'))) {
  const src = join(STAND, f);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const isWhite = (i) => data[i * 4] >= NEAR_WHITE && data[i * 4 + 1] >= NEAR_WHITE && data[i * 4 + 2] >= NEAR_WHITE;
  const seen = new Uint8Array(W * H);
  const queue = [];
  for (let x = 0; x < W; x++) { queue.push(x, (H - 1) * W + x); }
  for (let y = 0; y < H; y++) { queue.push(y * W, y * W + W - 1); }
  while (queue.length) {
    const i = queue.pop();
    if (seen[i] || !isWhite(i)) continue;
    seen[i] = 1;
    data[i * 4 + 3] = 0; // 투명
    const x = i % W, y = (i / W) | 0;
    if (x > 0) queue.push(i - 1);
    if (x < W - 1) queue.push(i + 1);
    if (y > 0) queue.push(i - W);
    if (y < H - 1) queue.push(i + W);
  }
  // 경계 부드럽게: 투명 픽셀과 맞닿은 흰 기 도는 픽셀 알파 절반
  const buf = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .trim() // 투명 여백 제거 — objectFit 레터박스 방지(인물이 실제 크기로 보이도록)
    .resize({ height: 1200, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await sharp(buf).toFile(src);
  console.log('stand:', f, 'keyed + trimmed + resized');
}
console.log('done');
