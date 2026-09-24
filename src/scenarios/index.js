// ─────────────────────────────────────────────────────────────────────────────
// 시나리오 레지스트리 — 한 앱에 올라간 판들의 목록.
//
//   시나리오는 「모듈 묶음」이 아니라 **객체 하나**다. 공통 계약은 열 개 필드고,
//   오늘 열두 곳이 gameData 에서 꺼내 가는 것과 같은 모양이다:
//
//     { id, title, evidenceMap, victim, suspects, cctvClueCodes, tapRules,
//       cast, config, secrets }
//
//   시나리오별 추가 필드는 그 위에 얹힌다(야간조의 investigator·startingClueCodes 등).
//   읽는 쪽은 계약 열 개만 알면 되고, 나머지는 아는 쪽만 본다.
//
//   ── 정적 주입이다. 전역도 URL 파싱도 window 변수도 없다 ────────────────────
//   진입점(html)이 자기 시나리오를 **명시적으로** 골라 넘긴다. 그래야 롤업이
//   진입점별로 청크를 완전히 가른다 — 새벽이슬을 하러 온 사람에게 야간조 정답이,
//   야간조를 하러 온 사람에게 새벽이슬 정답이 전송되지 않는다(dp-architecture §1·§6).
//   그러므로 **이 레지스트리를 import 하면 두 판이 다 딸려 온다.** 한 판만 필요한
//   진입점은 레지스트리 대신 `src/scenarios/<id>/index.js` 를 직접 import 한다.
//
//   ── 기존 판은 기본값이다 ──────────────────────────────────────────────────
//   DEFAULT_ID 가 'morningdew' 라서, 기존 코드를 레지스트리로 옮길 때 id 를 넘기지
//   않으면 지금과 똑같이 동작한다. 각 이전이 무변화(no-op)임이 그렇게 보장된다.
// ─────────────────────────────────────────────────────────────────────────────
import morningdew from './morningdew/index.js';
import yaganjo from './yaganjo/index.js';

// 기본 시나리오. 인자 없이 부른 곳은 기존 판을 그대로 받는다.
export const DEFAULT_ID = 'morningdew';

export const SCENARIOS = {
  morningdew,
  yaganjo,
};

// 목록 표시·검증용. 등록 순서를 그대로 쓴다.
export const SCENARIO_IDS = Object.keys(SCENARIOS);

/**
 * 시나리오 하나를 꺼낸다.
 *   getScenario()           → 새벽이슬(기본값)
 *   getScenario('yaganjo')  → 야간조
 *
 * 없는 id 는 조용히 기본값으로 떨어지지 않고 던진다. 오타 하나로 엉뚱한 판의
 * 정답이 뜨는 것보다, 그 자리에서 멈추는 편이 낫다.
 */
export function getScenario(id = DEFAULT_ID) {
  const key = id == null ? DEFAULT_ID : id;
  const scenario = SCENARIOS[key];
  if (!scenario) {
    throw new Error(
      `[scenarios] 등록되지 않은 시나리오 id: '${key}' — 있는 것: ${SCENARIO_IDS.join(', ')}`
    );
  }
  return scenario;
}

export { morningdew, yaganjo };

export default SCENARIOS;
