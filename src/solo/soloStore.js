// ─────────────────────────────────────────────────────────────────────────────
// soloStore — 솔로 게임 세이브(이 기기 localStorage, QR 게임과 분리된 키).
//   상태 전체를 한 덩어리로 저장/로드한다. AI 심문 등 후속 확장도 이 상태에 얹음.
// ─────────────────────────────────────────────────────────────────────────────
const KEY = 'morningdew_solo_v1';

export function defaultState() {
  return {
    version: 1,
    started: false,
    difficulty: 'puzzle',       // 'guide' | 'puzzle' | 'detective'
    screen: 'start',            // start | briefing | hub | scene | suspect | casefile | ending
    collected: [],              // 확보한 단서 코드
    visited: [],                // 방문한 장소 id
    notes: '',                  // 수사 수첩 자유 메모
    suspicion: {},              // { S1: 0..3 } 플레이어의 의심도 마킹
    interrogation: {},          // { S1: [{ q, a }] }
    casefile: {},               // { S1: { role, method, motive } }
    submitted: false,
    result: null,               // 채점 결과
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return { ...defaultState(), ...s };
  } catch {
    return null;
  }
}

export function saveSave(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* 저장 실패는 무시(용량/프라이빗모드) */ }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
