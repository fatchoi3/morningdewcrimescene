// 라운드마다 실제로 손이 닿는 카드가 인원만큼 되는가.
//   총량만 세면 안 된다 — 「한 장소에 세 명까지」에 걸려 도달 못 하는 카드가 생긴다.
import { readFileSync } from 'node:fs';
const H = readFileSync('tools/docgen/output/html/보드_단서카드.html', 'utf8');
const cards = [...H.matchAll(/<div class="chd"><span class="no"[^>]*>([A-Z])(\d+)<\/span>[\s\S]*?<div class="ct">([^<]*)/g)]
  .map((m) => ({ room: m[1], n: +m[2], title: m[3] }));
const cnt = (r) => cards.filter((c) => c.room === r).length;
const ROOMS = 'ABCEFG'.split('');            // 각자 방
const PHONES = cards.filter((c) => /핸드폰/.test(c.title));

// 이벤트가 붙는 라운드는 인원수마다 다르다 — 어느 쪽이든 마지막 라운드 하나를 남기고 넷을 다 읽는다.
//   여섯은 1·2라운드에 새로 열리는 곳이 없고(이벤트 ① 이 2라운드 끝), 일곱은 1라운드 끝부터 시작한다.
//   여기서 라운드 숫자를 직접 적으면 판정이 인쇄물과 어긋나므로, 이벤트 번호로 적고 라운드에 얹는다.
const AFTER = {                                   // 이벤트 번호 → 그 이벤트가 여는 것
  '①': () => [['D', 10]],
  '②': () => [['D', 2], ...ROOMS.map((r) => [r, PHONES.filter((p) => p.room === r).length])],
  '③': () => [['V', 16]],
  '④': () => [],
};
const openAt = (evAt, rounds) => {
  const o = { 1: ROOMS.map((r) => [r, cnt(r) - PHONES.filter((p) => p.room === r).length]) };
  for (let R = 1; R <= rounds; R++) {
    const ev = evAt[R];                           // R 끝에 읽은 이벤트가 R+1 을 연다
    if (ev && AFTER[ev]) o[R + 1] = [...(o[R + 1] || []), ...AFTER[ev]()];
  }
  return o;
};

function run(players, rounds, evAt, label) {
  const pool = {};
  const open = openAt(evAt, rounds);
  const rows = [];
  let fail = 0;
  for (let R = 1; R <= rounds; R++) {
    for (const [r, k] of (open[R] || [])) pool[r] = (pool[r] || 0) + k;
    // 한 장소에서 한 라운드에 나갈 수 있는 최대 = min(남은 카드, 3명 × 2장)
    const cap = Object.entries(pool).reduce((a, [, v]) => a + Math.min(v, 6), 0);
    const need = players * 2;
    // 실제 소비 — 많은 방부터 채운다(최선의 배정)
    let left = need;
    const sorted = Object.entries(pool).sort((a, b) => b[1] - a[1]);
    for (const e of sorted) {
      const take = Math.min(e[1], 6, left);
      pool[e[0]] -= take; left -= take;
    }
    // 갈 만한 곳이 없으면 세 명 제한을 푼다(규칙에 있는 예외) — 그래도 모자라면 진짜 부족이다.
    let relaxed = false;
    if (left > 0) {
      relaxed = true;
      for (const e of Object.entries(pool).sort((x, y) => y[1] - x[1])) {
        const take = Math.min(e[1], left);
        pool[e[0]] -= take; left -= take;
      }
    }
    if (left > 0) fail++;
    rows.push(`R${R} 상한 ${cap}/필요 ${need}${left > 0 ? ` ← ${left}장 부족` : relaxed ? ' (제한 해제)' : ''}`);
  }
  const rest = Object.values(pool).reduce((a, b) => a + b, 0);
  console.log(`[${label}] ${players}인 ${rounds}R`);
  console.log('  ' + rows.join(' | '));
  console.log(`  남은 카드 ${rest}${fail ? ` · 부족 라운드 ${fail}개` : ' · 부족 없음'}\n`);
  return fail;
}
console.log('방:', ROOMS.map((r) => r + cnt(r)).join(' '), '· D' + cnt('D'), '· V' + cnt('V'), '· 폰', PHONES.length, '\n');
// 앞의 셋은 인원수와 무관하게 같은 자리다. 여섯은 라운드가 하나 더 있어 ④ 만 뒤로 민다.
run(6, 6, { 1: '①', 2: '②', 3: '③', 5: '④' }, '여섯 — ④ 만 한 칸 뒤');
run(7, 5, { 1: '①', 2: '②', 3: '③', 4: '④' }, '일곱');
