// ─────────────────────────────────────────────────────────────────────────────
// localStore — GameStore 인터페이스의 로컬(localStorage) 구현.
//   키/형식은 기존과 100% 동일(진행 중 게임·기존 저장분 호환).
//   B(온라인)에서는 RemoteStore가 같은 인터페이스로 방 단위 공유 상태를 제공한다.
// ─────────────────────────────────────────────────────────────────────────────
const EVIDENCE_KEY = 'crimescene_evidence';
const TAP_KEY = 'crimescene_tapReveal';   // tapReveal·감식 공개 완료 플래그
const ADMIN_KEY = 'crimescene_admin';     // 운영자(테스트) 모드
const GAMSIK_KEY = 'crimescene_gamsik';   // 감식 비번 누적 오답 횟수

function readJSON(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}
function writeJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* 저장 실패 무시 */ } }

export function createLocalStore() {
  return {
    getEvidence() { return readJSON(EVIDENCE_KEY, []); },
    setEvidence(v) { writeJSON(EVIDENCE_KEY, v); },
    getTapDone() { return readJSON(TAP_KEY, {}); },
    setTapDone(v) { writeJSON(TAP_KEY, v); },
    getAdmin() { try { return localStorage.getItem(ADMIN_KEY) === '1'; } catch { return false; } },
    setAdmin(on) { try { localStorage.setItem(ADMIN_KEY, on ? '1' : '0'); } catch { /* 무시 */ } },
    getGamsikTries() { return readJSON(GAMSIK_KEY, {}); },
    setGamsikTries(v) { writeJSON(GAMSIK_KEY, v); },
    reset() { this.setEvidence([]); this.setTapDone({}); this.setGamsikTries({}); this.setAdmin(false); },
    // 로컬은 단일 클라이언트라 구독이 필요 없다(원격에서 방 상태 push용 seam).
    subscribe() { return () => {}; },
  };
}
