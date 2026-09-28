import sharp from 'file:///C:/ictk_repo/morningdewcrimescene/node_modules/sharp/dist/index.mjs';
const [src, dst, X, Y, W, H, R = '0'] = process.argv.slice(2);
const x = +X, y = +Y, w = +W, h = +H, rot = +R;
const { width, height } = await sharp(src).metadata();

// 알파가 있는 마스크 — 흐린 가장자리가 그대로 알파로 남는다
const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#ffffff"` +
  (rot ? ` transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"` : '') + `/></svg>`
);
const mask = await sharp(svg).blur(16).png().toBuffer();

const blurred = await sharp(src).blur(5).ensureAlpha()
  .composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

await sharp(src).composite([{ input: blurred, blend: 'over' }]).png().toFile(dst);
console.log('ok', dst);
