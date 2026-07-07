// ─────────────────────────────────────────────────────────────────────────────
// mergeSecrets — 공개 콘텐츠(clueMap)에 비밀팩(secrets)을 코드 키로 재주입한다.
//   로컬 모드 앱(provider)과 문서 생성기(loadData.mjs)가 공유하는 단일 병합 로직.
//   원본은 변형하지 않고, 건드리는 노드만 얕은 복제해 새 맵을 반환한다.
//
// secrets 형식:
//   { passwords: {code: '감식비번'}, recover: {code: '톡서랍비번'},
//     lookups: {code: {answer, result}} }
//   (recover/lookups는 해당 phone 단서의 kakao/browser 앱 안으로 주입된다)
// ─────────────────────────────────────────────────────────────────────────────
export function mergeSecrets(clueMap, secrets = {}) {
  const { passwords = {}, recover = {}, lookups = {} } = secrets;
  const out = {};
  for (const [code, clue] of Object.entries(clueMap)) {
    let c = clue;
    if (passwords[code] != null) c = { ...c, password: passwords[code] };
    if (c.phone && (recover[code] != null || lookups[code] != null)) {
      c = {
        ...c,
        phone: {
          ...c.phone,
          apps: (c.phone.apps || []).map((app) => {
            if (app.type === 'kakao' && recover[code] != null) {
              return { ...app, recoverPassword: recover[code] };
            }
            if (app.type === 'browser' && app.lookup && lookups[code] != null) {
              return { ...app, lookup: { ...app.lookup, ...lookups[code] } };
            }
            return app;
          }),
        },
      };
    }
    out[code] = c;
  }
  return out;
}

export default mergeSecrets;
