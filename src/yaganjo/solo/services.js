// ─────────────────────────────────────────────────────────────────────────────
// 야간조 솔로 — provider/store. src/services/index.js 의 야간조판이다.
//
//   ── 왜 복사가 아니라 별도 파일인가 ───────────────────────────────────────
//   src/services/index.js 는 모듈 최상단에서 새벽이슬 gameData 를 import 해
//   **싱글턴을 만든다.** 그 파일을 그대로 쓰면 야간조 솔로 번들에 새벽이슬
//   정답이 함께 실린다(시나리오 레지스트리 주석 §1·§6 이 막으려던 바로 그것).
//   그래서 공장 함수(createLocalProvider/createLocalStore)만 재사용하고,
//   물리는 데이터는 야간조 시나리오 객체에서 꺼낸다. 공장 셋은 순수 함수라
//   시나리오를 모른다 — 고칠 것이 없다.
//
//   ── 저장 키를 가른다 ──────────────────────────────────────────────────────
//   createLocalStore 는 'crimescene_*' 키를 쓴다. 두 판이 같은 기기에서
//   같은 키를 쓰면 새벽이슬 진행 중에 야간조를 열었다가 단서가 섞인다.
//   솔로는 어차피 soloStore(자체 키) 를 쓰지만, provider 쪽 store 도 같이
//   가려 둔다 — 나중에 야간조 본편 앱을 올릴 때 여기가 그대로 쓰인다.
// ─────────────────────────────────────────────────────────────────────────────
import { createLocalProvider } from '../../services/localProvider.js';
import { mergeSecrets } from '../../data/mergeSecrets.js';
import scenario from '../../scenarios/yaganjo/index.js';

const clueMap = mergeSecrets(scenario.evidenceMap, scenario.secrets);

export const provider = createLocalProvider({
  clueMap,
  cctvClueCodes: scenario.cctvClueCodes,
  tapRules: scenario.tapRules,
  adminOpenCode: scenario.config.adminOpenCode,
  adminCloseCode: scenario.config.adminCloseCode,
});

// ── 폰 잠금 네 자리 ──────────────────────────────────────────────────────────
//   새벽이슬 폰에는 잠금 화면이 없었다(톡서랍 복구만 있었다). 그 모달을 물려받은 탓에
//   야간조 폰 일곱 대의 네 자리가 통째로 건너뛰어졌다 — 누르면 바로 다 열렸다.
//   번호는 비밀팩(secrets.phoneLocks)에 있고, 그 출처는 카드 본문이 말한다.
const PHONE_LOCKS = scenario.secrets?.phoneLocks || {};
export const isPhoneLocked = (code) => PHONE_LOCKS[code] != null;
export async function verifyPhoneLock(code, pin) {
  const want = PHONE_LOCKS[code];
  return want == null || String(pin).replace(/\D/g, '') === String(want);
}

export { scenario };
export default { provider, scenario };
