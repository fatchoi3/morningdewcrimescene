// ─────────────────────────────────────────────────────────────────────────────
// soloStore — 솔로 게임 세이브(이 기기 localStorage, QR 게임과 분리된 키).
//   상태 전체를 한 덩어리로 저장/로드한다. 후속 기능도 이 상태에 얹으면 된다.
// ─────────────────────────────────────────────────────────────────────────────
const KEY = 'morningdew_solo_v1';

export function defaultState() {
  return {
    version: 1,
    started: false,
    difficulty: 'puzzle',       // 'guide' | 'puzzle' | 'detective'
    screen: 'start',            // start | briefing | hub | scene | suspect | casefile | ending
    stageSeen: 1,               // 안내 배너를 이미 띄운 최고 단계(1/2/3)
    collected: [],              // 확보한 단서 코드
    visited: [],                // 방문한 장소 id
    notes: '',                  // 수사 수첩 자유 메모
    suspicion: {},              // { S1: 0..3 } 플레이어의 의심도 마킹
    trust: {},                  // { S1: 5 } 인물별 신뢰도(HP) — 엉뚱한 증거 제시 시 감소
    pressed: {},                // { S1: [증언id] } — 추궁한 진술
    askedQ: {},                 // { S1: [증언id] } — 한 번이라도 골라 들은 질문(✔ 표시용)
    broke: {},                  // { S1: [{ id, text, confess }] } — 모순 잡은 진술
    stUnlocked: {},             // { S1: [증언id] } — 추궁/모순으로 열린 숨은 증언
    eventSeen: false,           // 중간 사건(부검 소견) 연출을 봤는가
    tutorialSeen: false,        // 첫 심문 안내(질문·캐묻기·증거)를 봤는가
    labReq: [],                 // 감식 의뢰한 코드 — 결과는 2차 심문 개방 때 도착
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
