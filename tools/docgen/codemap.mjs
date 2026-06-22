// clue-code-map.txt (OLD -> NEW) 파서.
// 구버전 빌더 데이터(이미지 프롬프트·진상해설서)에 박힌 옛 코드를
// 현재 evidenceMap의 신 코드로 자동 변환하기 위해 사용한다.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAP_PATH = join(__dirname, '..', '..', 'clue-code-map.txt');

const OLD2NEW = {};
const NEW2OLD = {};

for (const line of readFileSync(MAP_PATH, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9]{3,5}-\d{2})\s*->\s*([A-Z]{4}-\d{2})\s*$/);
  if (!m) continue;
  OLD2NEW[m[1]] = m[2];
  NEW2OLD[m[2]] = m[1];
}

/** 옛 코드를 신 코드로. 매핑이 없으면 입력을 그대로 돌려준다. */
export function toNew(oldCode) {
  return OLD2NEW[oldCode] || oldCode;
}

export { OLD2NEW, NEW2OLD };
