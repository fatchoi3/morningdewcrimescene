// ─────────────────────────────────────────────────────────────────────────────
// 야간조 솔로 — 시뮬레이션 팩. 에이전트가 판을 굴릴 때 **이 한 파일만** 읽게 한다.
//
//   사용 — node tools/sim/yaganjoSoloPack.mjs <출력.json>
//
//   코드베이스를 뒤지게 하면 사람마다 다른 것을 읽고 서로 다른 판을 굴린다.
//   그래서 판 위의 것을 전부 여기 모은다 — 인물시트 전문 · 정본 §0~12 ·
//   단서 122장(폰·페이지 안쪽까지) · 솔로의 단계·장소·이벤트 · 심문 데이터.
//
//   ※ 그림 안의 정보는 들어가지 않는다. 사진 속 숫자나 글자는 텍스트에 없다.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import scenario from '../../src/scenarios/yaganjo/index.js';
import { soloContent } from '../../src/yaganjo/solo/soloContent.js';
import { DATA, TESTIMONY, GRANTS, CLUE_REACT, TOPICS } from '../../src/yaganjo/solo/interrogation.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const out = process.argv[2];
if (!out) { console.error('출력 경로가 필요하다'); process.exit(1); }

// ── 인물시트 — 사람별로 가른다 ──────────────────────────────────────────────
const sheetsRaw = read('docs/야간조-보드게임/인물시트.md');
const HEADS = [
  ['S1', /^# 서장현 ·/m], ['S2', /^# 차민우 ·/m], ['S3', /^# 오정숙 ·/m],
  ['S4', /^# 시트:4 · 흐엉/m], ['S5', /^# 시트:5 · 윤도경/m], ['S6', /^# 시트:6 · 임기석/m],
];
const idx = HEADS.map(([id, re]) => [id, sheetsRaw.search(re)]);
if (idx.some(([, i]) => i < 0)) throw new Error('인물시트 머리를 못 찾음: ' + JSON.stringify(idx));
const sorted = [...idx].sort((a, b) => a[1] - b[1]);
const sheets = {};
sorted.forEach(([id, i], k) => {
  const end = k + 1 < sorted.length ? sorted[k + 1][1] : sheetsRaw.search(/^# 시트:7|^# 구영호|^# 조사관/m) > i ? sheetsRaw.search(/^# 시트:7|^# 구영호|^# 조사관/m) : sheetsRaw.length;
  sheets[id] = sheetsRaw.slice(i, end).trim();
});

// ── 정본 §0~§12 (배경지식·각색·배치 이후는 뺀다) ─────────────────────────────
const canonRaw = read('docs/야간조.md');
const canon = canonRaw.slice(0, canonRaw.search(/^## 13\. /m)).trim();

// ── 단서 — 앱이 보여 주는 본문 그대로. 그림 경로만 뺀다 ─────────────────────
const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (k === 'image' ? undefined : v)));
const clues = {};
for (const c of soloContent.provider.getAllClues()) {
  if (c.type === '방') continue;
  clues[c.code] = strip(c);
}
// 솔로가 만든 기록 — 본문은 데이터팩·진행물 문장 그대로다
const derived = {};
for (const code of ['AUTOPSY-1', 'AUTOPSY-2', 'LOOKUP-ZVLJ-37', 'GELH-98-2']) {
  const d = soloContent.getClue(code);
  if (d) derived[code] = strip(d);
}

// ── 장소와 단계 ──────────────────────────────────────────────────────────────
const locations = soloContent.locations.all.map((l) => ({
  id: l.id, label: l.label, person: l.person || null, stage: l.stage,
  kind: l.kind, showBody: !!l.showBody, objects: l.objects,
}));

// ── 솔로 연출 원문 — JSX 라 import 못 한다. 원문을 통째로 싣는다 ─────────────
const solo = {
  briefing: soloContent.briefing,
  startingClues: soloContent.startingClues,
  recordCodes: soloContent.recordCodes,
  caseKey: soloContent.caseKey,
  source: {
    'features/intro.jsx': read('src/yaganjo/solo/features/intro.jsx'),
    'lib/game.js (단계·배너·진상·시간표)': read('src/yaganjo/solo/lib/game.js').split('// ── 방별 핫스팟 좌표표')[0]
      + '\n…(핫스팟 좌표 생략)…\n' + read('src/yaganjo/solo/lib/game.js').split('export const REVEAL')[1].replace(/^/, 'export const REVEAL'),
  },
};

const mechanics = `
# 솔로 심문 엔진이 실제로 하는 일 (코드 기준 — 추측하지 말 것)

## 단계
- 단계 1 「1차 탐문」: 인물의 칸 A~F 여섯만 열린다. 심문은 phase 1.
- 단계 1→2: 여섯 명을 **한 번씩 다 심문하면** 넘어간다. 넘어갈 때 EventVN 연출(intro.jsx) 이 뜬다.
- 단계 2 「중간 점검」: C통로 현장(X)·조장의 칸(P)·공용 W/N/J/U·관제실 열람대(V)·감식 의뢰실(LAB) 이 열린다. 심문은 여전히 phase 1.
- 단계 2→3: C통로 현장 단서를 **3개** 확보하면 넘어간다. 넘어갈 때 EventVN2 연출이 뜬다.
- 단계 3 「2차 심문」: 심문이 phase 2 가 된다. 이때부터 **휴대폰**(각 방 안)이 보이고, **감식 의뢰했던 결과**가 도착한다.
- 범인 지목은 단계 3 에서만. 채점은 scoreCase(lib/game.js).

## 휴대폰
- 각 폰은 그 사람의 칸(조장 폰은 C통로 X)에 있다. **단계 3 전에는 방에 아예 안 보인다.**
- 네 자리 잠금이 걸려 있다(secrets.phoneLocks). **잠금을 풀어야 「가진 것」으로 친다** — 폰을 집기만 해서는 needs/contradict 에 못 쓴다. 잠금 출처는 카드 본문에서 찾아야 한다.
- 조장 태블릿(ZVLJ-37)은 잠금이 없다. 「관리자 조회」에 사번-네 자리(30112-0519)를 넣어 성공하면 **LOOKUP-ZVLJ-37**(취소 세 줄 · 조회 로그) 기록이 들어온다.

## 감식
- 단계 2 부터 감식 의뢰실에서 의뢰할 수 있다 — 단, 그 감식의 **채취물(선행 단서)을 먼저 모아야** 한다.
- 결과는 **단계 3 이 열릴 때** 도착한다. 그 전에는 결과를 못 본다.

## 특수 단서(⭐)
- unlockedBy 의 재료를 모두 모으면 **자동으로** 사건 기록에 들어온다.

## 기록 대조 Q1~Q7
- **단계 3 이 열리고 심야조 명부(KVUN-12)를 쥐면** 일곱 장이 한꺼번에 도착한다.
- Q2 의 둘째 구간(**GELH-98-2**, 6/3~7/28)은 따로 — 「없어진 두 달」(AOBI-88 = 수첩 + 명부)이 선 뒤에 도착한다.

## 솔로가 만든 기록(clues.json 의 derived 에 있다)
- **AUTOPSY-1** 1차 검안 소견서 — 처음부터 사건 기록에 있다(보드판 시작 시트 절 ④-1)
- **AUTOPSY-2** 2차 부검 소견 — 단계 3 이 열릴 때 들어온다(보드판 이벤트 ④). 「텀블러 성분은 사인과 무관」 한 줄이 들어 있다
- **LOOKUP-ZVLJ-37** — 태블릿 관리자 조회 성공 시
- **GELH-98-2** — 위 기록 대조 둘째 구간
- 증언(TST-*)은 interrogation 의 GRANTS / contradict.grants 로 들어온다(testimony.json)

## 조장의 칸(ROOM-P)
- 단계 2 에 열리지만 **사물함 마스터키(OIXS-24, 흐엉의 칸)를 쥐어야** 들어갈 수 있다.

## 심문 데이터(DATA · TOPICS · CLUE_REACT · GRANTS)가 화면에 뜨는 규칙
- statement 는 **phase ≤ 현재** 이고, needs 가 없거나 **needs 중 하나라도 들고 있으면** 질문지에 뜬다.
  hidden:true 는 모순(contradict.unlock)이나 캐묻기(pressUnlock)로 열려야 뜬다.
- q = **형사(플레이어)가 고르는 질문 문구.** 형사가 입에 올리는 말이다.
- text = 그 질문에 대한 대답.
- press = 「더 캐묻는다」. **증거 없이 한 번 더 누르기만 하면 나온다.** 즉 statement 가 보이면 press 도 사실상 공짜다.
- soft[코드] = 그 statement 가 떠 있을 때 형사가 그 단서를 들이밀면 나오는 반응.
- contradict = 그 코드 중 하나를 들이밀면 진술이 깨진다 → text 를 말하고, unlock 을 열고, confess 면 자백 처리.
- CLUE_REACT[인물][코드] = statement 와 무관하게 그 단서를 그 사람에게 물으면 나오는 기본 반응.
- TOPICS[인물] = 화제. codes 중 하나라도 들고 있으면 화제가 뜨고, text/press 는 공짜로 나온다.
- GRANTS[인물][statement] = 그 statement 를 캐물으면 사건 기록에 증언 단서(TESTIMONY)가 들어온다.

## 심문 시점
- 모든 심문은 **사건 다음 날 아침**, 04:15 신고 이후다. 인물은 그날 밤 자기가 겪은 것은 안다.
  **남이 한 일, 자기가 못 본 시각, 감식·부검 결과, 남의 폰 내용은 모른다** — 형사가 보여 주기 전까지는.
`;

const pack = {
  _readme: '이 파일이 유일한 진실원천이다. 여기 없는 것은 지어내지 마라. 그림 안의 정보(사진 속 숫자·글자)는 여기 없다.',
  mechanics,
  cast: Object.fromEntries(['victim', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((k) => [k, strip(scenario.cast[k])])),
  secrets: { phoneLocks: scenario.secrets.phoneLocks, passwords: scenario.secrets.passwords },
  sheets,
  canon,
  locations,
  clues,
  derived,
  solo,
  interrogation: { DATA, TOPICS, CLUE_REACT, GRANTS, TESTIMONY },
};

writeFileSync(out, JSON.stringify(pack, null, 1), 'utf8');

// 세어 본다 — 숫자가 예상과 다르면 싸는 쪽이 틀렸다.
const n = (o) => Object.keys(o).length;
console.log('시트', n(sheets), Object.entries(sheets).map(([k, v]) => `${k}:${v.length}`).join(' '));
console.log('정본', canon.length, '자');
console.log('단서', n(clues), '· 폰', Object.values(clues).filter((c) => c.phone).length,
  '· 페이지', Object.values(clues).filter((c) => c.pages).length,
  '· 특수', Object.values(clues).filter((c) => c.type === '특수').length,
  '· 감식', Object.values(clues).filter((c) => c.type === '감식').length);
console.log('장소', locations.length, '· 심문 인물', n(DATA), '· 진술', Object.values(DATA).reduce((a, d) => a + d.statements.length, 0),
  '· 화제', Object.values(TOPICS).reduce((a, t) => a + t.length, 0),
  '· 대질반응', Object.values(CLUE_REACT).reduce((a, r) => a + n(r), 0));
console.log('크기', (JSON.stringify(pack).length / 1024 | 0), 'KB →', out);
