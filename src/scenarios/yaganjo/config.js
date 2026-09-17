// ─────────────────────────────────────────────────────────────────────────────
// 야간조 config — 이벤트별 리브랜딩 토큰(앱·문서 생성기 공용 단일 설정).
//   src/config/gameConfig.js(새벽이슬)와 **같은 모양·같은 키**다. 값만 야간조다.
//   (순수 데이터 모듈 — 브라우저/Node 양쪽에서 import 가능. React 의존 없음.)
//
//   새벽이슬 판과 다른 것은 역할 키 하나다 — '목사' 자리에 '조장' 이 들어간다.
//   단서 데이터의 person 필드가 이 문자열을 그대로 참조하므로 바꾸면 귀속이 끊긴다.
// ─────────────────────────────────────────────────────────────────────────────
import { cast, personDisplayOrder } from './cast.js';

// 인물이 아닌 귀속 키(역할·공용). 단서 데이터가 이 문자열을 그대로 참조한다.
// 야간조 데이터팩의 person 값은 {{S1}}~{{S6}} · '조장' · '공용' 여덟뿐이다.
const ROLE_KEYS = ['조장', '공용'];
const ROLE_THEME = { color: '#6b6760', bg: '#f0ede6' };

// 색상표는 cast 에서 파생한다 — 이름을 바꿔도 색이 따라온다.
const themeBy = (pick) => Object.fromEntries([
  ...personDisplayOrder.map((id) => [cast[id].name, pick(cast[id].theme)]),
  ...ROLE_KEYS.map((key) => [key, pick(ROLE_THEME)]),
]);

export const gameConfig = {
  title: '야간조',
  tagline: '03:00과 03:30 사이, 동쪽에서 무슨 일이 있었는지 밝혀 주세요.',
  // 인쇄물(접속 QR)에 찍히는 주소. 새벽이슬과 **같은 호스트**를 쓴다 —
  // 두 시나리오가 한 앱·한 배포이므로 도메인이 둘일 이유가 없다(dp-architecture §0·§6).
  // 야간조 전용 페이지는 이 아래의 pretty URL(/yaganjo-kit 등)로 붙는다.
  siteUrl: 'https://crimescene.dawndew.org',

  // 역할 토큰: key = 구조 필터용(단서 데이터가 참조 — 바꾸지 말 것) / label = 화면 표시용
  roles: {
    victim: { key: '조장', label: '조장' },
  },

  // 운영자(테스트) 모드 마스터 코드.
  // 새벽이슬('ADMIN-OPEN'/'ADMIN-CLOSE')과 **일부러 다르게** 둔다 — 한 기기에서 두 판을
  // 번갈아 돌릴 때 한쪽 운영자 코드가 다른 쪽 판을 열어 버리면 안 된다.
  adminOpenCode: 'YAGANJO-OPEN',
  adminCloseCode: 'YAGANJO-CLOSE',

  // 조 이름 (편성은 별도 공지). 이 판의 구역 이름에서 땄다.
  teams: ['입고조', '집품조', '반품조', '출고조', '충전조', '관제조'],

  // 인물 표시 순서 + 색상 (앱/문서 공통 팔레트) — cast 에서 파생, 직접 고치지 말 것.
  // 순서를 바꾸려면 cast.js 의 personDisplayOrder, 색을 바꾸려면 cast[id].theme 를 고친다.
  // 순서는 보드판 칸 글자 A→F 그대로다.
  personOrder: [...personDisplayOrder.map((id) => cast[id].name), ...ROLE_KEYS],
  personColor: themeBy((t) => t.color),
  personBg: themeBy((t) => t.bg),

  // 공개 데모(호스팅 시연)에서 상단에 띄울 문구 — 실제 표시는 VITE_DEMO 빌드에서만
  demoBanner: '데모 모드 — 실제 비밀번호는 포함되어 있지 않습니다.',
};

export default gameConfig;
