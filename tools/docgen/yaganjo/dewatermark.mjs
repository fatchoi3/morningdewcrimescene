// 제미나이 그림 오른쪽 아래의 ✦ 표식을 흐린다 — 야간조 솔로 배경(1376x768)은 모두 같은 자리(1256,648 안팎)에 있다.
//   node tools/docgen/yaganjo/dewatermark.mjs [--at=cx,cy,size] <jpg ...>
//   원본 1024x572 에서 (935,482) 쯤이던 것이 putbg 로 1376x768 이 되며 옮겨 왔다. 제자리에 덮어쓴다.
import sharp from 'file:///C:/ictk_repo/morningdewcrimescene/node_modules/sharp/dist/index.mjs';

//   --at=cx,cy,size 로 자리를 준다(가로·세로는 비율, size 는 너비 비율). 없으면 야간조 배경 자리.
//   새벽이슬 방 사진(1600x900)은 --at=0.925,0.862,0.075
const atArg = process.argv.find((a) => a.startsWith('--at='));
const [cx, cy, sz] = atArg ? atArg.slice(5).split(',').map(Number) : [1256 / 1376, 648 / 768, 68 / 1376];
for (const f of process.argv.slice(2).filter((a) => !a.startsWith('--'))) {
  const { width, height } = await sharp(f).metadata();
  const side = Math.round(sz * width);
  const r = { x: Math.round(cx * width - side / 2), y: Math.round(cy * height - side / 2), w: side, h: side };
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
