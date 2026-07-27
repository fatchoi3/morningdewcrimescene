// ─────────────────────────────────────────────────────────────────────────────
// cast — 등장인물의 단일 원천(single source of truth).
//
//   캐스팅을 바꾸려면 이 파일만 고치면 된다.
//   본문(gameData)·색상표(gameConfig)·용의자 목록이 모두 여기서 파생된다.
//
//   본문에서 인물을 가리킬 때는 이름을 직접 쓰지 말고 토큰을 쓸 것:
//     {{S5}}            이사랑
//     {{S5.short}}      사랑
//     {{S5|과/와}}       이사랑과   ← 받침에 따라 조사가 자동으로 맞춰진다
//     {{S5.short|이/}}   사랑이     ← 받침 없는 이름이면 '이'가 붙지 않는다
//   자세한 규칙은 tokens.js 참고.
//
//   ※ 사진: public/images/people/ 에 아래 image 경로대로 파일을 넣는다.
//     실제 얼굴 사진은 git 에 커밋되지 않는다(README.txt 참고).
//     파일이 없으면 앱이 이름 첫 글자 아바타로 대체한다.
// ─────────────────────────────────────────────────────────────────────────────
import { resolveTokens } from './tokens.js';

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
  victim: {
    name: `${VICTIM_NAME} ${VICTIM_ROLE}`,
    age: 58,
    gender: '남성',
    occupation: '샛별이슬 교회 청년부 담임 목사',
    image: '/images/people/victim.jpg',
    family: '아내와 함께 거주, 장성한 자녀 둘은 분가했습니다.',
    hint: '피해자는 청년부를 이끄는 영향력 있는 목사님이었습니다.',
    detail: '청년부를 오래 이끌어 온 원칙주의자 목사님. 재정과 사역 자격 문제에 엄격해, 수련회를 앞두고 여러 임원과 개인 면담을 가졌습니다. 협심증 병력이 있었으며, 수련회 당일 개인 방에서 사망한 채 발견되었습니다.',
    bare: VICTIM_NAME,
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
    name: '윤은재',
    age: 24,
    gender: '남성',
    occupation: '샛별이슬 청년부 찬양팀 팀장',
    image: '/images/people/s2.png',
    family: '부모님과 함께 거주하며 외동아들이다.',
    notes: '솔직하고 다혈질인 찬양팀 팀장. 목사님과 찬양곡 선정 문제로 몇 달째 부딪혔고, 수련회 당일에도 목사님 방에서 언성을 높이며 크게 다투고 나왔다는 목격담이 있습니다.',
    short: '은재',
    theme: { color: '#444440', bg: '#F0EFEC' },
  },

  S3: {
    name: '이현지',
    age: 26,
    gender: '여성',
    occupation: '샛별이슬 청년부 회계',
    image: '/images/people/s3.png',
    family: '',
    notes: '말수가 적고 꼼꼼한 회계 담당. 좀처럼 속을 드러내지 않습니다. 총무 {{S5|과/와}} 유독 가깝게 지내며, 목사님과의 특별한 마찰은 알려진 바 없습니다.',
    short: '현지',
    theme: { color: '#0F6E56', bg: '#E8F8F2' },
  },

  S4: {
    name: '박희원',
    age: 28,
    gender: '여성',
    occupation: '샛별이슬 청년부 전도사',
    image: '/images/people/s4.png',
    family: '부모님과 남동생, 여동생이 있다.',
    notes: '차분하고 모범적인 전도사. 평소 목사님을 깍듯이 따랐지만, 수련회 날을 기점으로 목사님을 대하는 태도가 눈에 띄게 어색해졌다고 합니다.',
    short: '희원',
    theme: { color: '#854F0B', bg: '#FEF6E4' },
  },

  S5: {
    name: '이사랑',
    age: 25,
    gender: '여성',
    occupation: '샛별이슬 청년부 총무',
    image: '/images/people/s5.png',
    family: '',
    notes: '사교적이고 씀씀이가 큰 총무. 행사·총무 업무를 도맡습니다. 수련회 날을 기점으로 목사님과 마주치기를 피하며 어색해하는 모습이 보였습니다.',
    short: '사랑',
    theme: { color: '#A32D2D', bg: '#FDEAEA' },
  },

  S6: {
    name: '이가현',
    age: 28,
    gender: '여성',
    occupation: '샛별이슬 청년부 회장',
    image: '/images/people/s6.png',
    family: '미혼으로, 부모님과는 왕래가 드뭅니다.',
    notes: '책임감 강하고 리더십 있는 청년부 회장. 그러나 수련회 날을 기점으로 목사님과 눈도 마주치지 않을 만큼 사이가 어색해졌습니다.',
    short: '가현',
    theme: { color: '#534AB7', bg: '#EEEDFE' },
  },
};

// notes 안에서도 다른 인물을 토큰으로 참조하므로 한 번 해석해 둔다.
// (name/short 자체에는 토큰이 없어 1회 통과로 충분하다.)
export const cast = resolveTokens(castRaw, castRaw);

// ── 레코드 파생 ──────────────────────────────────────────────────────────────
// 토큰·색상 전용 필드를 떼어내 앱이 쓰는 인물 레코드 모양으로 만든다.
function record(id) {
  const { bare, short, role, theme, ...rest } = cast[id];
  return { id, ...rest };
}

export const victimRecord = record('victim');
export const suspectRecords = castOrder.map(record);

export default cast;
