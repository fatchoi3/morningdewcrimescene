// ─────────────────────────────────────────────────────────────────────────────
// cast — 등장인물의 단일 원천(single source of truth).
//
//   캐스팅을 바꾸려면 이 파일만 고치면 된다.
//   본문(gameData)·색상표(gameConfig)·용의자 목록이 모두 여기서 파생된다.
//
//   본문에서 인물을 가리킬 때는 이름을 직접 쓰지 말고 토큰을 쓸 것:
//     {{S5}}            한다영
//     {{S5.short}}      다영
//     {{S5|과/와}}       한다영과   ← 받침에 따라 조사가 자동으로 맞춰진다
//     {{S5.short|이/}}   다영이     ← 받침 없는 이름이면 '이'가 붙지 않는다
//   자세한 규칙은 tokens.js 참고.
//
//   ※ 사진: public/images/people/ 에 아래 image 경로대로 파일을 넣는다.
//     실제 얼굴 사진은 git 에 커밋되지 않는다(README.txt 참고).
//     파일이 없으면 앱이 이름 첫 글자 아바타로 대체한다.
// ─────────────────────────────────────────────────────────────────────────────
import { resolveTokens, resolveString } from './tokens.js';
import { readPack, applyPack } from './castPack.js';
import { withAssetBase } from './assets.js';

const VICTIM_NAME = '김호치';
const VICTIM_ROLE = '목사';

// 용의자 정렬 순서(용의자 목록·심문 순서)
export const castOrder = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

// 단서 목록의 인물 탭 표시 순서 (역할 토큰 '목사'·'공용'은 gameConfig 가 뒤에 붙인다)
export const personDisplayOrder = ['S4', 'S5', 'S3', 'S1', 'S2', 'S6'];

// ── 인물 정의 ────────────────────────────────────────────────────────────────
//   앞쪽 필드(name…notes/detail)는 그대로 용의자·피해자 레코드가 된다. 순서 유지.
//   뒤쪽 필드(short/bare/role/theme)는 토큰·색상 전용이라 레코드에서 제외된다.
const castRaw = {
  // 피해자는 이름과 직책을 따로 둔다. 본문의 '김호치 목사' 표기는 {{victim.full}} 로
  // 두 값을 합쳐 만들기 때문에, 이름만 바꿔도 모든 표기가 함께 따라온다.
  victim: {
    name: VICTIM_NAME,
    age: 58,
    gender: '남성',
    occupation: '샛별이슬 교회 청년부 담임 목사',
    image: '/images/people/victim.jpg',
    family: '아내와 함께 거주, 장성한 자녀 둘은 분가했습니다.',
    hint: '피해자는 청년부를 이끄는 영향력 있는 목사님이었습니다.',
    detail: '청년부를 오래 이끌어 온 원칙주의자 목사님. 재정과 사역 자격 문제에 엄격해, 수련회를 앞두고 여러 임원과 개인 면담을 가졌습니다. 협심증 병력이 있었으며, 수련회 당일 개인 방에서 사망한 채 발견되었습니다.',
    short: '호치',
    role: VICTIM_ROLE,
    theme: { color: '#6b6760', bg: '#f0ede6' },
  },

  S1: {
    name: '최종현',
    age: 23,
    gender: '남성',
    occupation: '샛별이슬 청년부 서기',
    image: '/images/people/s1.png',
    family: '부모님 함께 살며 누나 한 명이 있다.',
    notes: '청년부 막내. 싹싹하고 밝은 분위기 메이커입니다. 피해자 목사님과 가장 친밀해 자주 함께 등산했고, 보충제 음료도 직접 챙겨 드리곤 했습니다.',
    short: '종현',
    theme: { color: '#185FA5', bg: '#EAF3FC' },
  },

  S2: {
    name: '강지후',
    age: 24,
    gender: '남성',
    occupation: '샛별이슬 청년부 찬양팀 팀장',
    image: '/images/people/s2.png',
    family: '부모님과 함께 거주하며 외동아들이다.',
    notes: '솔직하고 다혈질인 찬양팀 팀장. 목사님과 찬양곡 선정 문제로 몇 달째 부딪혔고, 수련회 당일에도 목사님 방에서 언성을 높이며 크게 다투고 나왔다는 목격담이 있습니다.',
    short: '지후',
    theme: { color: '#444440', bg: '#F0EFEC' },
  },

  S3: {
    name: '한소미',
    age: 26,
    gender: '여성',
    occupation: '샛별이슬 청년부 회계',
    image: '/images/people/s3.png',
    family: '',
    notes: '말수가 적고 꼼꼼한 회계 담당. 좀처럼 속을 드러내지 않습니다. 총무 {{S5|과/와}} 유독 가깝게 지내며, 목사님과의 특별한 마찰은 알려진 바 없습니다.',
    short: '소미',
    theme: { color: '#0F6E56', bg: '#E8F8F2' },
  },

  S4: {
    name: '서지안',
    age: 28,
    gender: '여성',
    occupation: '샛별이슬 청년부 전도사',
    image: '/images/people/s4.png',
    family: '부모님과 남동생, 여동생이 있다.',
    notes: '차분하고 모범적인 전도사. 평소 목사님을 깍듯이 따랐지만, 수련회 날을 기점으로 목사님을 대하는 태도가 눈에 띄게 어색해졌다고 합니다.',
    short: '지안',
    theme: { color: '#854F0B', bg: '#FEF6E4' },
  },

  S5: {
    name: '한다영',
    age: 25,
    gender: '여성',
    occupation: '샛별이슬 청년부 총무',
    image: '/images/people/s5.png',
    family: '',
    notes: '사교적이고 씀씀이가 큰 총무. 행사·총무 업무를 도맡습니다. 수련회 날을 기점으로 목사님과 마주치기를 피하며 어색해하는 모습이 보였습니다.',
    short: '다영',
    theme: { color: '#A32D2D', bg: '#FDEAEA' },
  },

  S6: {
    name: '문세린',
    age: 28,
    gender: '여성',
    occupation: '샛별이슬 청년부 회장',
    image: '/images/people/s6.png',
    family: '미혼으로, 부모님과는 왕래가 드뭅니다.',
    notes: '책임감 강하고 리더십 있는 청년부 회장. 그러나 수련회 날을 기점으로 목사님과 눈도 마주치지 않을 만큼 사이가 어색해졌습니다.',
    short: '세린',
    theme: { color: '#534AB7', bg: '#EEEDFE' },
  },
};

// 운영자가 저장한 콘텐츠 팩(있으면)을 기본 캐스팅 위에 덮어쓴다.
// 토큰 해석보다 먼저 해야 본문의 {{S5}} 가 바뀐 이름으로 풀린다.
const castMerged = applyPack(castRaw, readPack());

// '이름 직책' 합성 표기({{victim.full}})는 팩 적용 뒤에 만들어야 바뀐 이름을 반영한다.
// '이름 직책' 합성 표기({{victim.full}})를 붙인 뒤 토큰을 해석한다.
// 합성이 팩 적용 뒤에 일어나야 바뀐 이름이 반영된다.
const withFull = (c) => ({
  ...c,
  victim: { ...c.victim, full: `${c.victim.name} ${c.victim.role}` },
});

// notes 안에서도 다른 인물을 토큰으로 참조하므로 한 번 해석해 둔다.
// (name/short 자체에는 토큰이 없어 1회 통과로 충분하다.)
const merged = withFull(castMerged);
export const cast = withAssetBase(resolveTokens(merged, merged));

// 팩을 적용하지 않은 원래 캐스팅 — 편집기가 "무엇이 바뀌었는지" 비교하는 기준.
// 이 덕분에 팩에는 실제로 고친 항목만 담기고, 나머지는 저장소 기본값을 계속 따라간다.
const defaults = withFull(castRaw);
export const castDefaults = resolveTokens(defaults, defaults);

// ── 레코드 파생 ──────────────────────────────────────────────────────────────
// 토큰·색상 전용 필드를 떼어내 앱이 쓰는 인물 레코드 모양으로 만든다.
function record(id) {
  const { short, role, full, theme, ...rest } = cast[id];
  return { id, ...rest };
}

// 문자열 하나를 지금 캐스팅으로 푼다 — JSX 안처럼 데이터 객체로 감쌀 수 없는 곳에서 쓴다.
//   t('{{S1.short}}방을 눌러 들어가세요')  →  '종현방을 눌러 들어가세요'
export const t = (s) => resolveString(s, cast);

// 인물 id 로 적은 맵을 "이름을 키로 쓰는" 맵으로 바꾼다.
//   { S1: x, 목사: y }  →  { '최종현': x, '목사': y }
// 단서 데이터의 person 필드가 이름 문자열이라 조회 키도 이름이어야 하는데,
// 그 이름을 소스에 직접 적으면 캐스팅을 바꿀 때 조용히 어긋난다. cast 에서 뽑아 쓴다.
// (cast 에 없는 키 — '목사'·'공용'·'_default' 등 — 는 그대로 통과시킨다.)
export const keyByPersonName = (map) =>
  Object.fromEntries(Object.entries(map).map(([k, v]) => [cast[k]?.name ?? k, v]));

// 피해자 레코드의 name 은 '김호치 목사' 형태를 쓴다(기존 표시·데이터 키와 동일).
export const victimRecord = { ...record('victim'), name: cast.victim.full };
export const suspectRecords = castOrder.map(record);

export default cast;
