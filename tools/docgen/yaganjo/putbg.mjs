// 솔로 배경 — 새벽이슬 scenes 와 같은 1376×768 JPG. 경로는 public/images/yaganjo/<rel>.jpg
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp'; // 저장소 node_modules 에서 찾는다 — 위치를 박아 두면 폴더를 옮길 때 깨진다
const OUT = fileURLToPath(new URL('../../../public/images/yaganjo', import.meta.url)); // 저장소 기준
// 세 번째 인자로 크기를 줄 수 있다 — 방 배경 세로판(3:4)은 960x1280
const [src, rel, size = '1376x768'] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const dst = path.join(OUT, rel + '.jpg');
mkdirSync(path.dirname(dst), { recursive: true });
const i = await sharp(src).resize(W, H, { fit: 'cover' }).jpeg({ quality: 80 }).toFile(dst);
console.log(rel + '.jpg', i.width + 'x' + i.height, (i.size / 1024 | 0) + 'KB');
