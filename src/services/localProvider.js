// ─────────────────────────────────────────────────────────────────────────────
// localProvider — GameProvider 인터페이스의 로컬 구현.
//   콘텐츠 접근 + 비밀 검증을 한 곳에 모은다(컴포넌트는 evidenceMap을 직접 안 만짐).
//   clueMap = 비밀이 병합된 전체 맵(로컬 전용). 검증은 로컬에서 즉시 resolve하되,
//   B(원격)에서 서버 fetch로 바뀔 수 있도록 verify*는 Promise를 반환한다.
// ─────────────────────────────────────────────────────────────────────────────
import { computeAutoUnlocked as _autoUnlock, evalTapRules as _tapRules } from './rules.js';

const norm = (s) => String(s ?? '').trim().replace(/\s/g, '').toUpperCase();
const kakaoOf = (clue) => clue?.phone?.apps?.find((a) => a.type === 'kakao') || null;
const lookupOf = (clue) => clue?.phone?.apps?.find((a) => a.type === 'browser' && a.lookup)?.lookup || null;

export function createLocalProvider({ clueMap, cctvClueCodes = [], tapRules = [], adminOpenCode, adminCloseCode }) {
  return {
    // ── 콘텐츠 접근 ──
    getClue(code) { const c = clueMap[code]; return c ? { code, ...c } : null; },
    getAllClues() { return Object.entries(clueMap).map(([code, v]) => ({ code, ...v })); },
    getCluesByPerson(person) { return this.getAllClues().filter((c) => c.person === person); },
    getCctvClueCodes() { return cctvClueCodes; },

    // ── 운영자 마스터 코드 ──
    isAdminCode(raw) {
      const n = norm(raw);
      if (n === norm(adminOpenCode)) return 'open';
      if (n === norm(adminCloseCode)) return 'close';
      return null;
    },

    // ── 감식 비번 ──
    isGamsikProtected(code) { return !!clueMap[code]?.password; },
    debugSecret(code) { return clueMap[code]?.password; }, // 로컬 전용 힌트(운영자 모드). 원격은 undefined.
    async verifyGamsik(code, pw) {
      const p = clueMap[code]?.password;
      return !p || String(pw).trim() === String(p);
    },

    // ── 톡서랍 복구 비번 ──
    isRecoverProtected(code) { return !!kakaoOf(clueMap[code])?.recoverPassword; },
    async verifyRecover(code, pw) {
      const p = kakaoOf(clueMap[code])?.recoverPassword;
      return !p || String(pw).trim() === String(p);
    },

    // ── 수료증 진위 조회 ──
    async verifyLookup(code, answer) {
      const lk = lookupOf(clueMap[code]);
      if (!lk) return { ok: false };
      if (norm(answer) === norm(lk.answer)) return { ok: true, result: lk.result };
      return { ok: false };
    },

    // ── 해금 계산(동기, 로드된 데이터에 대한 순수 함수) ──
    computeAutoUnlocked(codeSet) { return _autoUnlock(clueMap, codeSet); },
    evalTapRules(tapDone) { return _tapRules(tapRules, tapDone); },
  };
}
