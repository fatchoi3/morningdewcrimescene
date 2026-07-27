// ─────────────────────────────────────────────────────────────────────────────
// remoteStore — B(온라인) 모드 stub. GameStore와 동일 인터페이스.
//   방(room) 단위 공유 상태를 server.js의 game_state broadcast로 동기화 예정.
//   subscribe(cb)로 서버 push를 React state에 반영하면 컴포넌트 변경 없이 동작한다.
//   지금은 미배선.
// ─────────────────────────────────────────────────────────────────────────────
export function createRemoteStore() {
  const nyi = (name) => () => { throw new Error(`RemoteStore.${name}() 미구현 — B(온라인) 단계에서 server.js와 연결 예정`); };
  return {
    getEvidence: nyi('getEvidence'),
    setEvidence: nyi('setEvidence'),
    getTapDone: nyi('getTapDone'),
    setTapDone: nyi('setTapDone'),
    getAdmin: nyi('getAdmin'),
    setAdmin: nyi('setAdmin'),
    getGamsikTries: nyi('getGamsikTries'),
    setGamsikTries: nyi('setGamsikTries'),
    reset: nyi('reset'),
    subscribe: () => () => {},
  };
}
