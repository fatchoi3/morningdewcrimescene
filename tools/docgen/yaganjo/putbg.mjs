// 솔로 배경 — 새벽이슬 scenes 와 같은 1376×768 JPG. 경로는 public/images/yaganjo/<rel>.jpg
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'file:///C:/ictk_repo/morningdewcrimescene/node_modules/sharp/dist/index.mjs';
const OUT = 'C:/ictk_repo/morningdewcrimescene/public/images/yaganjo';
const [src, rel] = process.argv.slice(2);
const dst = path.join(OUT, rel + '.jpg');
mkdirSync(path.dirname(dst), { recursive: true });
const i = await sharp(src).resize(1376, 768, { fit: 'cover' }).jpeg({ quality: 80 }).toFile(dst);
console.log(rel + '.jpg', i.width + 'x' + i.height, (i.size / 1024 | 0) + 'KB');
