// 그림 속 글자·숫자·사람을 국소로 흐린다 — 상자 여럿을 한 번에.
//   node blurbox.mjs <원본> <결과> <시그마> x,y,w,h [x,y,w,h ...]
//   blurcol.mjs 는 마스크를 16 만큼 번지게 해서 작은 상자(사물함 번호표)는 거의 안 흐려졌다.
//   여기서는 가장자리 번짐을 상자 크기에 맞춰(짧은 변의 1/6, 최대 6) 작게 잡는다.
import sharp from 'file:///C:/ictk_repo/morningdewcrimescene/node_modules/sharp/dist/index.mjs';

const [src, dst, S, ...boxes] = process.argv.slice(2);
const { width, height } = await sharp(src).metadata();
const rects = boxes.map((b) => b.split(',').map(Number));
const feather = Math.max(1, Math.min(6, Math.min(...rects.map(([, , w, h]) => Math.min(w, h))) / 6));
const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
  rects.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#ffffff"/>`).join('') +
  `</svg>`,
);
const mask = await sharp(svg).blur(feather).png().toBuffer();
const blurred = await sharp(src).blur(+S || 8).ensureAlpha()
  .composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
await sharp(src).composite([{ input: blurred, blend: 'over' }]).png().toFile(dst);
console.log('ok', dst, rects.length, 'boxes', 'feather', feather.toFixed(1));
