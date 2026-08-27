// 라운드마다 실제로 손이 닿는 카드가 인원만큼 되는가.
//   총량만 세면 안 된다 — 「한 장소에 세 명까지」에 걸려 도달 못 하는 카드가 생긴다.
//   그리고 CCTV 열람실만 한 번에 세 장이라, 사람마다 소모량이 다르다.
import { readFileSync } from 'node:fs';
const H = readFileSync('tools/docgen/output/html/보드_단서카드.html', 'utf8');
const cards = [...H.matchAll(/<div class="chd"><span class="no"[^>]*>([A-Z])(\d+)<\/span>[\s\S]*?<div class="ct">([^<]*)/g)]
  .map((m) => ({ room: m[1], n: +m[2], title: m[3] }));
const cnt = (r) => cards.filter((c) => c.room === r).length;
const ROOMS = 'ABCEFG'.split('');            // 각자 방
const PHONES = cards.filter((c) => /핸드폰/.test(c.title));
const SEATS = 3;                             // 한 장소에 세 명까지
const draw = (r) => (r === 'V' ? 3 : 2);     // CCTV 만 한 번에 세 장

// 이벤트가 붙는 라운드는 인원수마다 다르다 — 어느 쪽이든 마지막 라운드 하나를 남기고 넷을 다 읽는다.
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
    // 한 장소가 이 라운드에 내보낼 수 있는 최대 = min(남은 카드, 세 명분)
    const cap = Object.entries(pool).reduce((a, [r, v]) => a + Math.min(v, SEATS * draw(r)), 0);
    // 한 사람씩 자리를 잡는다 — 카드가 많이 남은 곳부터. 자리(세 명)와 잔량을 같이 본다.
    const seats = {};
    let short = 0;
    for (let p = 0; p < players; p++) {
      const pick = Object.entries(pool)
        .filter(([r, v]) => v > 0 && (seats[r] || 0) < SEATS)
        .sort((a, b) => b[1] - a[1])[0];
      if (!pick) { short += 2; continue; }         // 갈 곳이 아예 없다
      const [r] = pick;
      seats[r] = (seats[r] || 0) + 1;
      const take = Math.min(pool[r], draw(r));
      pool[r] -= take;
      if (take < draw(r)) short += draw(r) - take; // 남은 만큼만 가져간 몫
    }
    // 갈 만한 곳이 없어 못 채웠으면 세 명 제한을 푼다(규칙에 있는 예외).
    let relaxed = false;
    if (short > 0) {
      relaxed = true;
      for (const [r, v] of Object.entries(pool).sort((a, b) => b[1] - a[1])) {
        if (v <= 0 || short <= 0) continue;
        const take = Math.min(v, short);
        pool[r] -= take; short -= take;
      }
    }
    if (short > 0) fail++;
    rows.push(`R${R} 상한 ${cap}/필요 ${players * 2}${short > 0 ? ` ← ${short}장 부족` : relaxed ? ' (제한 해제)' : ''}`);
  }
  const rest = Object.values(pool).reduce((a, b) => a + b, 0);
  const vLeft = pool.V || 0;
  console.log(`[${label}] ${players}인 ${rounds}R`);
  console.log('  ' + rows.join(' | '));
  console.log(`  남은 카드 ${rest}(그중 CCTV ${vLeft})${fail ? ` · 부족 라운드 ${fail}개` : ' · 부족 없음'}\n`);
  return fail;
}
console.log('방:', ROOMS.map((r) => r + cnt(r)).join(' '), '· D' + cnt('D'), '· V' + cnt('V'), '· 폰', PHONES.length,
  '· CCTV 는 한 번에 3장\n');
// 앞의 셋은 인원수와 무관하게 같은 자리다. 여섯은 라운드가 하나 더 있어 ④ 만 뒤로 민다.
run(6, 6, { 1: '①', 2: '②', 3: '③', 5: '④' }, '여섯 — ④ 만 한 칸 뒤');
run(7, 5, { 1: '①', 2: '②', 3: '③', 4: '④' }, '일곱');
