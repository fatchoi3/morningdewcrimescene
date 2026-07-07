// ─────────────────────────────────────────────────────────────────────────────
// rules — 데이터 기반 해금 엔진. provider가 사용하는 순수 함수(로드된 콘텐츠 대상).
// ─────────────────────────────────────────────────────────────────────────────

// 주어진 코드 집합 기준, 해금 조건이 충족된 미수집 특수/감식 단서를 (연쇄적으로) 반환.
//   unlockedBy    : 모두(AND) 충족 시 해금
//   unlockedByAny : 하나라도(OR) 충족 시 해금
// codeSet은 호출 측에서 누적되도록 직접 변형된다. (기존 App.computeAutoUnlocked 이전)
export function computeAutoUnlocked(clueMap, codeSet) {
  const out = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const [code, data] of Object.entries(clueMap)) {
      if (data.type !== '특수' && data.type !== '감식') continue;
      if (codeSet.has(code)) continue;
      const byAll = Array.isArray(data.unlockedBy) && data.unlockedBy.length > 0
        && data.unlockedBy.every((req) => codeSet.has(req));
      const byAny = Array.isArray(data.unlockedByAny) && data.unlockedByAny.length > 0
        && data.unlockedByAny.some((req) => codeSet.has(req));
      if (byAll || byAny) {
        out.push({ code, ...data });
        codeSet.add(code);
        changed = true;
      }
    }
  }
  return out;
}

// tapReveal 조합 규칙 — 지정한 열람 흔적(tapDone 키)이 모두 모이면 grants 코드를 해금.
//   (기존 App.handleTapComplete의 하드코딩 DISC-11/SIST-22 판정을 데이터화)
export function evalTapRules(tapRules, tapDone) {
  return (tapRules || [])
    .filter((r) => Array.isArray(r.requiresTaps) && r.requiresTaps.every((k) => tapDone[k]))
    .map((r) => r.grants);
}
