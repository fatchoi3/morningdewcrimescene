// 라운드마다 실제로 손이 닿는 카드가 인원만큼 되는가.
//   총량만 세면 안 된다 — 「한 장소에 세 명까지」에 걸려 도달 못 하는 카드가 생긴다.
import { readFileSync } from 'node:fs';
const H = readFileSync('tools/docgen/output/html/보드_단서카드.html', 'utf8');
const cards = [...H.matchAll(/<div class="chd"><span class="no"[^>]*>([A-Z])(\d+)<\/span>[\s\S]*?<div class="ct">([^<]*)/g)]
  .map((m) => ({ room: m[1], n: +m[2], title: m[3] }));
const cnt = (r) => cards.filter((c) => c.room === r).length;
const ROOMS = 'ABCEFG'.split('');            // 각자 방
const PHONES = cards.filter((c) => /핸드폰/.test(c.title));

// 라운드별로 열리는 장소 — [6인 일정, 7인 일정]
const openAt = (plan) => ({
  1: ROOMS.map((r) => [r, cnt(r) - PHONES.filter((p) => p.room === r).length]),
  2: [['D', 10]],
  3: [['D', 2], ...ROOMS.map((r) => [r, PHONES.filter((p) => p.room === r).length])],
  4: plan.cctv === 4 ? [['V', 16]] : [],
  5: plan.cctv === 4 ? [] : [['V', 16]],
  6: [],
});

function run(players, rounds, plan, label) {
  const pool = {};
  const open = openAt(plan);
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
    if (left > 0) fail++;
    rows.push(`R${R} 상한 ${cap}/필요 ${need}${left > 0 ? ` ← ${left}장 부족` : ''}`);
  }
  const rest = Object.values(pool).reduce((a, b) => a + b, 0);
  console.log(`[${label}] ${players}인 ${rounds}R`);
  console.log('  ' + rows.join(' | '));
  console.log(`  남은 카드 ${rest}${fail ? ` · 부족 라운드 ${fail}개` : ' · 부족 없음'}\n`);
  return fail;
}
console.log('방:', ROOMS.map((r) => r + cnt(r)).join(' '), '· D' + cnt('D'), '· V' + cnt('V'), '· 폰', PHONES.length, '\n');
run(6, 6, { cctv: 4 }, '지금 일정 — CCTV 는 3라운드 끝에 열린다');
run(7, 5, { cctv: 4 }, '지금 일정 — CCTV 는 3라운드 끝에 열린다');
