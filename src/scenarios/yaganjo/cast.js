// ─────────────────────────────────────────────────────────────────────────────
// 야간조 cast — 등장인물의 단일 원천(single source of truth).
//
//   src/data/cast.js(새벽이슬)와 **같은 모양**이다. 다른 것은 셋뿐이다.
//     ① 역할 키가 '목사' 가 아니라 '조장' 이다(단서의 person 필드가 이 문자열을 참조).
//     ② 일곱 번째 인물(안전보건공단 재해조사관)이 있고, **용의자가 아니다.**
//     ③ castPack(운영자 캐스팅 편집)을 쓰지 않는다 — 아래 「팩을 쓰지 않는 이유」.
//
//   ── 토큰 배정은 보드판 더미 글자와 1:1 ────────────────────────────────────
//     A = S1 서장현 · B = S2 차민우 · C = S3 오정숙
//     D = S4 흐엉   · E = S5 윤도경 · F = S6 임기석   · victim = 박태식(조장)
//
//   데이터팩(src/data/yaganjo/)의 109장이 {{S1}}~{{S6}}·{{victim}} 으로 이 배정을
//   그대로 참조한다. **배정을 바꾸면 109장의 본문이 통째로 어긋난다.**
//   토큰은 조용히 어긋나지 그 자리에서 터지지 않으므로, 이 표는 고정이다.
//
//   본문에서 인물을 가리킬 때는 이름을 직접 쓰지 말고 토큰을 쓸 것:
//     {{S5}}            윤도경
//     {{S5.short}}      도경
//     {{S5.short|이/}}   도경이     ← 받침에 따라 조사가 자동으로 맞춰진다
//   자세한 규칙은 src/data/tokens.js 참고.
//
//   ── 팩을 쓰지 않는 이유 ───────────────────────────────────────────────────
//   castPack 의 저장 키(PACK_KEY)는 'crimescene_castPack' 하나뿐이다. 같은 브라우저에서
//   두 시나리오가 같은 키를 나눠 쓰면 새벽이슬 캐스팅 편집이 야간조 인물 위에 덮인다
//   ({ S1: {name:'최종현'} } 이 서장현을 지운다). 키를 시나리오별로 가르는 것은
//   castPack.js 수정이라 이번 범위 밖이다. 그래서 야간조는 저장소 기본 캐스팅만 쓴다.
//
//   ※ 사진: public/images/yaganjo/ 에 아래 image 경로대로 파일을 넣는다.
//     파일이 없으면 앱이 이름 첫 글자 아바타로 대체한다(SuspectTabs.PersonAvatar).
//     경로는 데이터팩 114곳과 같은 관례를 따른다 — ASCII · 소문자 케밥.
//
//   ※ gender: **인물 시트가 밝힌 것만 적는다.** 시트에 표기가 없는 사람은 키 자체를
//     두지 않는다 — 화면이 `person[key] != null` 로 거르므로 빈 줄이 아니라 아예 안 뜬다.
//     없는 사실을 채워 넣는 것보다 비워 두는 편이 낫다.
// ─────────────────────────────────────────────────────────────────────────────
import { resolveTokens, resolveString } from '../../data/tokens.js';
import { withAssetBase } from '../../data/assets.js';

const VICTIM_NAME = '박태식';
const VICTIM_ROLE = '조장';

// 용의자 정렬 순서(용의자 목록·심문 순서)
export const castOrder = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

// 단서 목록의 인물 탭 표시 순서.
// 보드판의 칸 글자 순서(A→F)를 그대로 쓴다 — 카드를 손에 들고 앱을 보는 사람이
// 「D 칸이면 네 번째」로 찾는다. (역할 토큰 '조장'·'공용'은 config 가 뒤에 붙인다)
export const personDisplayOrder = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

// ── 인물 정의 ────────────────────────────────────────────────────────────────
//   앞쪽 필드(name…notes/detail)는 그대로 용의자·피해자 레코드가 된다. 순서 유지.
//   뒤쪽 필드(short/role/theme)는 토큰·색상 전용이라 레코드에서 제외된다.
//
//   theme 색은 **보드판 더미 테두리 색과 같은 배정**이다(룰북 §2 — 「어느 더미에서 나온
//   카드인지 뒤집지 않아도 보인다」). 칸 글자 A~F 가 곧 색이므로, 종이에서 파란 테두리로
//   집은 카드가 앱에서도 파란 칩으로 뜬다. 색을 바꾸려면 인쇄물과 함께 바꾼다.
const castRaw = {
  // 피해자는 이름과 직책을 따로 둔다. 본문의 '박태식 조장' 표기는 {{victim.full}} 로
  // 두 값을 합쳐 만들기 때문에, 이름만 바꿔도 모든 표기가 함께 따라온다.
  victim: {
    name: VICTIM_NAME,
    age: 47,
    gender: '남성',
    occupation: 'GH로지스 3센터 심야조 조장 · 15년차',
    image: '/images/yaganjo/person-victim.jpg',
    family: '아내와 고3 딸이 있습니다.',
    hint: '심야조 스물다섯을 이끌던 조장입니다. 04:10, 넘어진 파렛트 아래에서 발견되었습니다.',
    detail: '매 정시에 순찰을 돌고, 순찰 일지는 안전관리자와 한 권을 나눠 씁니다. 다친 사람을 산재가 아니라 조퇴로 처리해 온 이 센터의 15년치 서류를 쓴 사람이기도 합니다. 발견 장소는 동쪽 C통로 안쪽, 갈림에서 북쪽으로 25m 들어간 막다른 통로입니다. 사망 추정 시각은 03:00~03:30이고 1차 소견은 압사이며, 정밀 부검은 아직 나오지 않았습니다.',
    short: '태식',
    role: VICTIM_ROLE,
    theme: { color: '#6b6760', bg: '#f0ede6' },
  },

  // A 칸
  S1: {
    name: '서장현',
    age: 38,
    gender: '남성',
    occupation: 'GH로지스 3센터 안전관리자',
    image: '/images/yaganjo/person-s1.png',
    family: '아내가 육아휴직 중이고 아들이 두 달이다. 버는 사람은 혼자다.',
    notes: '이 센터의 안전관리자는 한 사람뿐이다. 산업안전기사를 땄고 조선소 협력업체를 거쳐 왔다. 조장이 매 정시에 순찰을 나가면 30분대에 나가 서쪽 2/3와 2층을 돌고, 순찰 일지는 조장과 한 권을 나눠 쓴다. 조회 끝에 「안전 한마디」를 시키는 것도 이 사람 일이다. 조장을 「형」이라고 부른다. 04:15에 112와 119에 신고한 사람이다.',
    short: '장현',
    theme: { color: '#1F6FB2', bg: '#E9F3FB' },
  },

  // B 칸
  S2: {
    name: '차민우',
    age: 22,
    // 인물 시트 1면에 성별 표기가 없다 — 임의로 채우지 않는다.
    occupation: 'B구역 집품 · 알바 1년 반째',
    image: '/images/yaganjo/person-s2.png',
    family: '학자금 대출이 등록금이고 이 알바가 생활비다.',
    notes: '기계공학 3학년. 밤 11시부터 아침 8시까지 일하고 아침 9시 수업에 간다. 그 주가 시험이었고 그날이 나흘째였다. 두 달 전 컨베이어에 낀 박스를 빼다 넘어져 왼 손목이 부러졌고 지금도 보호대를 찬다 — 왼손은 선반을 잡는 데만 쓰고 스캔은 오른손으로 한다.',
    short: '민우',
    theme: { color: '#0F7A5A', bg: '#E7F7F1' },
  },

  // C 칸
  S3: {
    name: '오정숙',
    age: 45,
    gender: '여성',
    occupation: 'B구역 집품 · 파트타임 3년차',
    image: '/images/yaganjo/person-s3.png',
    family: '혼자 아들을 키운다. 열일곱이고, 다리를 오래 수술해 지금도 주 3회 재활을 다닌다.',
    notes: '낮에는 식당, 밤에는 여기. B구역에서 낮은 칸을 많이 맡는다 — 쪼그려 앉는 자리다. 앞치마에 삼각김밥과 장갑이 들어 있어 배고프다는 사람에게 하나씩 준다. 말수가 적고 묻는 말에만 답한다. 04:10에 조장을 발견한 사람이다.',
    short: '정숙',
    theme: { color: '#B3492D', bg: '#FDEDE7' },
  },

  // D 칸
  S4: {
    name: '흐엉',
    age: 31,
    gender: '여성',
    occupation: 'D구역 반품 분류 · 이주노동자(E-9) 한국 3년차',
    image: '/images/yaganjo/person-s4.png',
    family: '남편과 여섯 살 딸. 딸은 하이퐁 친정에 있다.',
    // 여권·명부·사물함 이름표의 「응우옌 티 흐엉」은 카드 본문에 적힌 값이라 토큰이 아니다.
    // 여기(공개 프로필)에서는 한 번만 붙여 두 표기가 같은 사람임을 보이게 한다.
    notes: '여권과 사물함 이름표에는 「응우옌 티 흐엉(NGUYEN THI HUONG)」으로 적혀 있다. 첫 사업장이 여기다. 동쪽 1/3에서 밤새 혼자 반품을 가른다 — 파렛트에서 박스를 내려 커터로 테이프를 긋고, 파손과 멀쩡한 것을 양쪽으로 가르고, 스티커를 붙이고, 단말로 찍는다. 말수가 적고 한국어가 서툴다고들 안다. 야식에는 남들보다 8분 늦게 왔다.',
    short: '흐엉',
    theme: { color: '#7A4BB8', bg: '#F1EBFC' },
  },

  // E 칸
  S5: {
    name: '윤도경',
    age: 34,
    gender: '남성',
    occupation: 'B구역 집품 · 10년차 · 정규직 전환 심사 대기',
    image: '/images/yaganjo/person-s5.png',
    family: '여자친구와 5년째. 결혼은 「전환되면」이었다.',
    notes: '스물넷에 상하차 알바로 들어와 10년. 무기계약이고 전환 심사 대기 3년째다. 조장을 「형」이라고 부른다. 신입에게 파렛트 쌓는 법을 가르치는 쪽이다. 22:50 흡연장에서 조장과 언성이 높았다 — 여럿이 봤다.',
    short: '도경',
    theme: { color: '#A32D5E', bg: '#FCEAF1' },
  },

  // F 칸
  S6: {
    name: '임기석',
    age: 52,
    gender: '남성',
    occupation: '지게차 기사 · 20년차',
    image: '/images/yaganjo/person-s6.png',
    family: '혼자 산다. 이혼했다고만 알려져 있다.',
    notes: '이 센터의 지게차 기사는 한 사람이다. 자리가 없어 충전소가 집이고 밤새 돈다. 도크에서 파렛트를 받아 내리고, A·B 랙 뒤로 보충하고, 집품 완료 파렛트를 출고 리프트 하단에 올린다. 전원을 스치지만 아무 얼굴도 보지 않는다 — 헤드가드 철망 그늘에 얼굴이 가린다. 발견 때 배터리실에서 나왔다.',
    short: '기석',
    theme: { color: '#5A6B2F', bg: '#F0F4E4' },
  },

  // ── 일곱 번째 인물 · 7인 모드 전용 ──────────────────────────────────────────
  //   castOrder 에 넣지 않는다. 그래서 suspectRecords 에 들어가지 않고,
  //   personDisplayOrder 에도 없으므로 단서 목록의 인물 칩으로도 뜨지 않는다.
  //   귀속된 단서가 한 장도 없는 것이 맞다 — 조사관에게는 뒤질 칸이 없다.
  //   isSuspect: false 는 화면이 「지목 대상 아님」을 표시하기 위한 명시적 표식이다.
  investigator: {
    name: '구영호',
    age: 51,
    // 인물 시트가 성별을 밝히지 않는다(「이름은 바꿔도 됩니다」라고 적힌 자리다).
    occupation: '안전보건공단 재해조사관',
    image: '/images/yaganjo/person-investigator.png',
    family: '',
    isSuspect: false,
    notes: '용의자가 아닙니다 — 조장을 죽인 사람은 나머지 여섯 안에 있고, 아무도 조사관을 지목하지 않습니다. 사망사고가 나면 그날 아침 현장에 오는 사람이고, 작업 중지를 요청하는 것도 해제에 서명하는 것도 조사관입니다. 경찰 수사와는 따로 「왜 파렛트가 넘어졌는가」를 밝히러 왔습니다. 재해조사 의견서의 「기인물」과 「발생 형태」 칸에 지금 적을 수 있는 것은 「파렛트 · 협착」뿐입니다. 7인 모드에서만 씁니다.',
    short: '영호',
    theme: { color: '#4A4F58', bg: '#EDEEF1' },
  },
};

// '이름 직책' 합성 표기({{victim.full}})를 붙인 뒤 토큰을 해석한다.
const withFull = (c) => ({
  ...c,
  victim: { ...c.victim, full: `${c.victim.name} ${c.victim.role}` },
});

// notes 안에서도 다른 인물을 토큰으로 참조할 수 있으므로 한 번 해석해 둔다.
// (name/short 자체에는 토큰이 없어 1회 통과로 충분하다.)
const merged = withFull(castRaw);
export const cast = withAssetBase(resolveTokens(merged, merged));

// ── 레코드 파생 ──────────────────────────────────────────────────────────────
// 토큰·색상 전용 필드를 떼어내 앱이 쓰는 인물 레코드 모양으로 만든다.
function record(id) {
  const { short, role, full, theme, ...rest } = cast[id];
  return { id, ...rest };
}

// 문자열 하나를 지금 캐스팅으로 푼다 — JSX 안처럼 데이터 객체로 감쌀 수 없는 곳에서 쓴다.
export const t = (s) => resolveString(s, cast);

// 인물 id 로 적은 맵을 "이름을 키로 쓰는" 맵으로 바꾼다.
//   { S1: x, 조장: y }  →  { '서장현': x, '조장': y }
// (cast 에 없는 키 — '조장'·'공용'·'_default' 등 — 는 그대로 통과시킨다.)
export const keyByPersonName = (map) =>
  Object.fromEntries(Object.entries(map).map(([k, v]) => [cast[k]?.name ?? k, v]));

// 피해자 레코드의 name 은 '박태식 조장' 형태를 쓴다(새벽이슬의 '김호치 목사'와 같은 자리).
// ※ 단서의 person 필드가 쓰는 귀속 키는 이것이 아니라 역할 키 '조장' 이다(config.roles).
export const victimRecord = { ...record('victim'), name: cast.victim.full };
export const suspectRecords = castOrder.map(record);

// 7인 모드에서만 쓴다. 용의자 목록과 섞지 않는다.
export const investigatorRecord = record('investigator');

export default cast;
