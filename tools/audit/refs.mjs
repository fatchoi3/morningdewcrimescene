// 정합성 점검 — 단서·인물·시트가 서로 가리키는 것이 실제로 있는지, 서로 어긋나지 않는지.
import { evidenceMap, suspects } from '../../src/data/gameData.js';
import { DATA } from '../../src/solo/interrogation.js';
import { BIBLE } from '../docgen/bible.mjs';
import { BOARD_SCRIPT, DETECTIVE } from '../docgen/boardScript.mjs';

const SID = { 최종현: 'S1', 강지후: 'S2', 한소미: 'S3', 서지안: 'S4', 한다영: 'S5', 문세린: 'S6' };
const NAMES = Object.keys(SID);
const bad = [];
const warn = [];
const codeOf = new Set(Object.keys(evidenceMap));
const title = (c) => evidenceMap[c]?.title || '(없음)';

// ① 심문 정본이 가리키는 단서 코드가 실제로 있는가
for (const [sid, d] of Object.entries(DATA)) {
  for (const st of d.statements || []) {
    const needs = [].concat(st.needs || []);
    for (const n of needs) if (n && !codeOf.has(n)) bad.push(`${sid}.${st.id} needs 없는 코드 ${n}`);
    for (const c of Object.keys(st.soft || {})) if (!codeOf.has(c)) bad.push(`${sid}.${st.id} soft 없는 코드 ${c}`);
    for (const c of (st.contradict?.codes || [])) if (!codeOf.has(c)) bad.push(`${sid}.${st.id} contradict 없는 코드 ${c}`);
    for (const c of Object.keys(st.contradict?.textBy || {})) {
      if (!codeOf.has(c)) bad.push(`${sid}.${st.id} textBy 없는 코드 ${c}`);
      else if (!(st.contradict.codes || []).includes(c)) bad.push(`${sid}.${st.id} textBy ${c} 가 codes 에 없음`);
    }
    if (st.contradict?.unlock && !(d.statements || []).some((x) => x.id === st.contradict.unlock))
      bad.push(`${sid}.${st.id} unlock 대상 ${st.contradict.unlock} 없음`);
  }
}

// ② 보드 대본이 가리키는 코드
for (const [name, s] of Object.entries(BOARD_SCRIPT)) {
  for (const c of Object.keys(s.onCard || {})) if (!codeOf.has(c)) bad.push(`BOARD ${name}.onCard 없는 코드 ${c}`);
  for (const c of (s.dropSoft || [])) if (!codeOf.has(c)) bad.push(`BOARD ${name}.dropSoft 없는 코드 ${c}`);
  for (const c of Object.keys(s.soft || {})) if (!codeOf.has(c)) bad.push(`BOARD ${name}.soft 없는 코드 ${c}`);
}
for (const c of Object.keys(DETECTIVE.onCard || {})) if (!codeOf.has(c)) bad.push(`형사.onCard 없는 코드 ${c}`);

// ③ unlockedBy 가 가리키는 코드
for (const [k, v] of Object.entries(evidenceMap))
  for (const u of (v.unlockedBy || [])) if (!codeOf.has(u)) bad.push(`${k} unlockedBy 없는 코드 ${u}`);

// ④ 인물 이름 — 옛 이름이 남아 있는가
const OLD = ['박희원', '윤은재', '이가현', '이사랑', '이현지'];
const scan = (obj, where) => {
  const s = JSON.stringify(obj);
  for (const o of OLD) if (s.includes(o)) bad.push(`${where} 에 옛 이름 「${o}」`);
};
scan(evidenceMap, 'gameData');
scan(DATA, 'interrogation');
scan(BIBLE, 'bible');
scan(BOARD_SCRIPT, 'boardScript');

// ⑤ 나이·직책이 cast 와 맞는가
for (const s of suspects) {
  const b = BIBLE[s.name];
  if (!b) { bad.push(`BIBLE 에 ${s.name} 없음`); continue; }
  const m = /(\d+)세/.exec(b.meta || '');
  if (m && +m[1] !== s.age) bad.push(`${s.name} 나이 어긋남 — cast ${s.age} / bible ${m[1]}`);
  if (!BOARD_SCRIPT[s.name]) bad.push(`BOARD_SCRIPT 에 ${s.name} 없음`);
  if (!DATA[SID[s.name]]) bad.push(`INTERROGATION 에 ${s.name} 없음`);
}

// ⑥ 필적 대조 옵션의 표본 카드가 있는가
const hw = evidenceMap['TUBE-22']?.handwriting?.options || [];
for (const o of hw) if (o.requires && !codeOf.has(o.requires)) bad.push(`필적 표본 없는 코드 ${o.requires} (${o.who})`);
if (hw.filter((o) => o.correct).length !== 1) bad.push(`필적 정답이 ${hw.filter((o) => o.correct).length} 개`);

// ⑦ 지워진 대화방이 있는 폰마다 복구 번호가 있는가
const { default: secrets } = await import('../../src/data/secrets.js');
for (const [k, v] of Object.entries(evidenceMap)) {
  const gone = (v.phone?.apps || []).some((a) => (a.chats || []).some((c) => c.deleted));
  if (gone && !secrets.recover?.[k]) bad.push(`${k}(${v.title}) 지워진 대화방이 있는데 복구 번호 없음`);
  if (!gone && secrets.recover?.[k]) warn.push(`${k}(${v.title}) 복구 번호가 있는데 지워진 대화방 없음`);
}
// ⑧ 감식 비밀번호가 있는 단서가 실제 감식인가
for (const k of Object.keys(secrets.passwords || {}))
  if (!codeOf.has(k)) bad.push(`secrets.passwords 없는 코드 ${k}`);

console.log('=== 정합성 점검 ===');
console.log(bad.length ? bad.map((x) => '  ✗ ' + x).join('\n') : '  결함 없음');
if (warn.length) console.log('\n[참고]\n' + warn.map((x) => '  · ' + x).join('\n'));
