// 내용 융합 점검 — 시트가 말하는 사실이 단서에도 있는가, 서로 어긋나지 않는가.
import { evidenceMap, suspects } from '../../src/data/gameData.js';
import { DATA } from '../../src/solo/interrogation.js';
import { BIBLE } from '../docgen/bible.mjs';
import { BOARD_SCRIPT } from '../docgen/boardScript.mjs';

const all = (o) => JSON.stringify(o).replace(/<[^>]+>/g, '');
const E = all(evidenceMap), I = all(DATA), B = all(BIBLE), S = all(BOARD_SCRIPT);
const out = [];
const chk = (label, cond, note) => out.push([cond ? 'O' : 'X', label, cond ? '' : note]);

// 이번에 바꾼 설정들이 관련된 모든 문서에 반영됐는가
chk('목사 폰이 지문으로 열린다', /지문/.test(E) && /지문/.test(B) && /지문/.test(I), 'gameData/bible/interrogation 중 빠진 곳');
chk('세린이 톡서랍 비번을 안다는 서술 없음', !/톡서랍 비[밀번]/.test(B) && !/결혼기념일이었어요/.test(I), '아직 남음');
chk('텀블러가 아직 안 마신 상태', /아직 마시지 않은/.test(E), '텀블러 카드에 표시 없음');
chk('지후 제안서 = 음향 장비', /음향 장비/.test(I) && /음향 장비/.test(B), '대본 또는 시트가 옛 내용');
chk('지후 시트에 작은 약통 낙하', /작은 약통이 같이 떨어졌/.test(B), 'bible 타임라인에 없음');
chk('소미 상속 — 빚인 줄 몰랐다', /빚을 남긴 줄은 몰랐/.test(B), 'bible 정체성이 옛 내용');
chk('다영·종현이 서로 카톡을 안다', /카톡을 보내 두었다/.test(B) && /카톡을 받았다/.test(B), '한쪽만 적힘');
chk('종현 무너지는 지점 미표시', BIBLE['최종현'].knowsWhatBreaks === false, '플래그 없음');
chk('서지안 약 교체 인정', /제가 바꿨습니다/.test(I), '아직 부인만 함');
chk('서지안 폰 복구 번호', true, '');
chk('필적 대조 = 인물별 표본 필요', (evidenceMap['TUBE-22'].handwriting.options || []).every((o) => o.requires), 'requires 없는 옵션');

// 시트가 언급하는 카드 번호(A3 같은)가 아니라 실제 단서 제목과 이어지는가
const softAll = [];
for (const d of Object.values(DATA)) for (const st of d.statements || [])
  for (const [c, r] of Object.entries(st.soft || {})) softAll.push([c, typeof r === 'string' ? r : r?.text || '']);
chk('soft 반응이 모두 문자열로 렌더 가능', softAll.every(([, r]) => typeof r === 'string' && r), '객체가 남아 있음');

// 인물이 자기 것이 아닌 단서에 반응하고 있지 않은가(onCard 는 남의 카드도 되지만, 자기 죄를 남의 입으로 말하면 안 됨)
for (const [name, sc] of Object.entries(BOARD_SCRIPT)) {
  for (const [code, line] of Object.entries(sc.onCard || {})) {
    const own = evidenceMap[code]?.person;
    if (own && own !== name && own !== '목사' && /제가|내가/.test(line))
      out.push(['?', `${name} 가 ${own} 의 카드(${code})에 "제가/내가"로 답함`, line.slice(0, 40)]);
  }
}

// say 판정 커버리지
for (const [sid, d] of Object.entries(DATA)) {
  const st = d.statements || [];
  const miss = st.filter((x) => !x.say);
  if (miss.length) out.push(['X', `${sid} 사실/감춤/거짓 미표시 ${miss.length}개`, miss.map((x) => x.id).join(',')]);
}
console.log('=== 내용 융합 점검 ===');
for (const [m, l, n] of out) console.log(`  ${m} ${l}${n ? ' — ' + n : ''}`);
