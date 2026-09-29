// 제미나이 그림 오른쪽 아래의 ✦ 표식을 흐린다 — 솔로 배경(1376x768)은 모두 같은 자리(1256,648 안팎)에 있다.
//   node tools/docgen/yaganjo/dewatermark.mjs <jpg ...>
//   원본 1024x572 에서 (935,482) 쯤이던 것이 putbg 로 1376x768 이 되며 옮겨 왔다. 제자리에 덮어쓴다.
import sharp from 'file:///C:/ictk_repo/morningdewcrimescene/node_modules/sharp/dist/index.mjs';

const BOX = { x: 1222, y: 614, w: 68, h: 68 };
for (const f of process.argv.slice(2)) {
  const { width, height } = await sharp(f).metadata();
  const sx = width / 1376, sy = height / 768;
  const r = { x: Math.round(BOX.x * sx), y: Math.round(BOX.y * sy), w: Math.round(BOX.w * sx), h: Math.round(BOX.h * sy) };
  const mask = await sharp(Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="14" fill="#fff"/></svg>`,
  )).blur(6).png().toBuffer();
  const blurred = await sharp(f).blur(16).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const out = await sharp(f).composite([{ input: blurred, blend: 'over' }]).jpeg({ quality: 80 }).toBuffer();
  await sharp(out).toFile(f + '.tmp.jpg');
  const { renameSync } = await import('node:fs');
  renameSync(f + '.tmp.jpg', f);
  console.log('ok', f);
}
