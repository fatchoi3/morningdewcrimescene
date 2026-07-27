// ─────────────────────────────────────────────────────────────────────────────
// remoteProvider — B(온라인) 모드 stub. GameProvider와 동일 인터페이스.
//   server.js(방 서버)에 연결해 구현 예정: 콘텐츠·비밀 검증을 서버가 소유하고,
//   클라이언트는 fetch/WS로 결과만 받는다(정답이 번들에 실리지 않음).
//   지금은 미배선 — VITE_MODE=online 선택 시에만 로드되며 호출하면 명시적으로 던진다.
// ─────────────────────────────────────────────────────────────────────────────
export function createRemoteProvider() {
  const nyi = (name) => () => { throw new Error(`RemoteProvider.${name}() 미구현 — B(온라인) 단계에서 server.js와 연결 예정`); };
  return {
    getClue: nyi('getClue'),
    getAllClues: nyi('getAllClues'),
    getCluesByPerson: nyi('getCluesByPerson'),
    getCctvClueCodes: nyi('getCctvClueCodes'),
    isAdminCode: nyi('isAdminCode'),
    isGamsikProtected: nyi('isGamsikProtected'),
    debugSecret: () => undefined, // 원격은 정답 힌트를 노출하지 않음
    verifyGamsik: nyi('verifyGamsik'),
    isRecoverProtected: nyi('isRecoverProtected'),
    verifyRecover: nyi('verifyRecover'),
    verifyLookup: nyi('verifyLookup'),
    computeAutoUnlocked: nyi('computeAutoUnlocked'),
    evalTapRules: nyi('evalTapRules'),
  };
}
