// ─────────────────────────────────────────────────────────────────────────────
// gameConfig — 이벤트별 리브랜딩 토큰(앱·문서 생성기 공용 단일 설정).
// 다른 단체가 가져다 쓸 때 이 파일 + cast(등장인물) + secrets(비번)만 바꾸면 된다.
// (순수 데이터 모듈 — 브라우저/Node 양쪽에서 import 가능. React 의존 없음.)
// ─────────────────────────────────────────────────────────────────────────────
import { cast, personDisplayOrder } from '../data/cast.js';

// 인물이 아닌 귀속 키(역할·공용). 단서 데이터가 이 문자열을 그대로 참조한다.
const ROLE_KEYS = ['목사', '공용'];
const ROLE_THEME = { color: '#6b6760', bg: '#f0ede6' };

// 색상표는 cast 에서 파생한다 — 이름을 바꿔도 색이 따라온다.
const themeBy = (pick) => Object.fromEntries([
  ...personDisplayOrder.map((id) => [cast[id].name, pick(cast[id].theme)]),
  ...ROLE_KEYS.map((key) => [key, pick(ROLE_THEME)]),
]);

export const gameConfig = {
  title: '크라임씬 미스터리',
  tagline: '증거를 수집하여 범인을 밝혀보세요.',
  siteUrl: 'https://morningdewcrimescene.site',

  // 역할 토큰: key = 구조 필터용(단서 데이터가 참조 — 바꾸지 말 것) / label = 화면 표시용
  roles: {
    victim: { key: '목사', label: '목사' },
  },

  // 운영자(테스트) 모드 마스터 코드
  adminOpenCode: 'ADMIN-OPEN',
  adminCloseCode: 'ADMIN-CLOSE',

  // 조 이름 (편성은 별도 공지)
  teams: ['원영조', '민경조', '재헌조', '도현조', '정혁조', '예림조'],

  // 인물 표시 순서 + 색상 (앱/문서 공통 팔레트) — cast 에서 파생, 직접 고치지 말 것.
  // 순서를 바꾸려면 cast.js 의 personDisplayOrder, 색을 바꾸려면 cast[id].theme 를 고친다.
  personOrder: [...personDisplayOrder.map((id) => cast[id].name), ...ROLE_KEYS],
  personColor: themeBy((t) => t.color),
  personBg: themeBy((t) => t.bg),

  // 공개 데모(호스팅 시연)에서 상단에 띄울 문구 — 실제 표시는 VITE_DEMO 빌드에서만
  demoBanner: '데모 모드 — 실제 비밀번호는 포함되어 있지 않습니다.',
};

export default gameConfig;
