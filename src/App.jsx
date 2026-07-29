// ─────────────────────────────────────────────────────────────────────────────
// 오프라인 단독 버전 — 소켓 없이 로컬에서 동작 (A 배포)
// 상태 저장(store)·콘텐츠/비밀 검증(provider)은 services 계층을 통한다.
//   → 나중에 온라인 모드(B)로 전환 시 컴포넌트 변경 없이 Remote 구현으로 교체된다.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import CameraScanner from './components/CameraScanner.jsx';
import EvidenceList from './components/EvidenceList.jsx';
import CommonInfo from './components/SuspectTabs.jsx';
import { victim, suspects } from './data/gameData.js';
import { gameConfig } from './config/gameConfig.js';
import { provider, store } from './services/index.js';

/**
 * ConfirmModal
 * 위험한 동작 전 사용자에게 확인을 요청하는 모달.
 * ESC 키 또는 오버레이 클릭으로도 취소할 수 있다.
 */
function ConfirmModal({ message, onConfirm, onCancel }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-panel confirm-panel" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button type="button" className="control-button confirm-ok" onClick={onConfirm}>
            초기화
          </button>
          <button type="button" className="small-button confirm-cancel" onClick={onCancel}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

const VICTIM_KEY = gameConfig.roles.victim.key;      // 피해자(목사) 역할 구조 토큰
const PERSON_BUTTONS = gameConfig.personOrder;        // 운영자 모드 인물별 일괄획득 버튼 순서
const cctvClueCodes = provider.getCctvClueCodes();    // 'CCTV' 전용 탭 필터용
const IS_DEMO = import.meta.env.VITE_DEMO === '1';    // 공개 데모(호스팅 시연) 빌드 여부

// 운영자 수동 추가용 — 전체 단서를 인물별로 묶는다 (스캔/코드 입력이 안 될 때의 대비책)
const CLUES_BY_PERSON = (() => {
  const groups = {};
  for (const c of provider.getAllClues()) {
    const p = c.person || '기타';
    (groups[p] = groups[p] || []).push({ code: c.code, title: c.title || c.code, type: c.type });
  }
  return groups;
})();
// 표시 순서 — PERSON_BUTTONS 순서를 따르고, 목록에 없는 인물은 뒤에 붙인다
const CLUE_PERSON_ORDER = [
  ...PERSON_BUTTONS.filter((p) => CLUES_BY_PERSON[p]),
  ...Object.keys(CLUES_BY_PERSON).filter((p) => !PERSON_BUTTONS.includes(p)),
];

function App() {
  // 앱 시작 시 저장소에서 이전 상태를 복원 (store = localStorage 기반 로컬 구현)
  const [evidenceCollected, setEvidenceCollected] = useState(() => store.getEvidence());
  const [tapDone, setTapDone] = useState(() => store.getTapDone()); // tapReveal 완료 플래그
  const [gamsikTries, setGamsikTries] = useState(() => store.getGamsikTries()); // 감식 비번 누적 오답
  const [adminMode, setAdminMode] = useState(() => store.getAdmin()); // 운영자(테스트) 모드
  const [showAllClues, setShowAllClues] = useState(false); // 운영자: 전체 단서 수동 추가 패널 열림 여부
  const [scanMessage, setScanMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('evidence'); // 'evidence' | 'pastor' | 'info'
  const [specialUnlockKey, setSpecialUnlockKey] = useState(0);
  const [unlockKinds, setUnlockKinds] = useState({ special: false, gamsik: false }); // 직전 자동해금 종류(탭 반짝 구분용)
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  /**
   * addCodes
   * 주어진 코드들을 수집 목록에 추가하고, 연계 특수/감식 단서를 자동 해금한다.
   * (handleScan 단건 수집과 운영자 모드 일괄 수집이 공유)
   * cascade=false면 자동 해금을 건너뛰고 전달된 코드만 추가한다.
   */
  const addCodes = (codes, { cascade = true } = {}) => {
    const have = new Set(evidenceCollected.map((i) => i.code));
    const toAdd = codes.filter((c) => provider.getClue(c) && !have.has(c));
    if (!toAdd.length) return { added: [], autoUnlocked: [] };

    let merged = [...evidenceCollected, ...toAdd.map((c) => provider.getClue(c))];
    const codeSet = new Set(merged.map((i) => i.code));
    const autoUnlocked = cascade ? provider.computeAutoUnlocked(codeSet) : [];
    if (autoUnlocked.length) merged = [...merged, ...autoUnlocked];

    setEvidenceCollected(merged);
    store.setEvidence(merged);
    if (autoUnlocked.length > 0) {
      setUnlockKinds({
        special: autoUnlocked.some((e) => e.type === '특수'),
        gamsik: autoUnlocked.some((e) => e.type === '감식'),
      });
      setSpecialUnlockKey((k) => k + 1);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast(autoUnlocked.map((e) => e.title).join(', '));
      toastTimerRef.current = setTimeout(() => setToast(null), 4000);
    }
    return { added: toAdd, autoUnlocked };
  };

  /**
   * handleScan
   * QR 스캔 또는 수동 입력으로 넘어온 코드를 처리한다.
   * provider로 코드를 조회해 증거를 추가하고 store에 저장한다.
   * CameraScanner의 onScan 콜백 형식에 맞게 { success, message } 객체를 반환한다.
   */
  const handleScan = (code) => {
    const normalized = code.trim().toUpperCase();

    // 운영자(테스트) 모드 마스터 코드 처리 (일반 단서 조회 전에 가로챔)
    const adminKind = provider.isAdminCode(normalized);
    if (adminKind === 'open') {
      setAdminMode(true); store.setAdmin(true);
      const msg = '운영자 모드 ON — 하단의 인물별 버튼으로 단서를 일괄 획득할 수 있고, 감식 비번이 자동 해제됩니다.';
      setScanMessage(msg);
      return { success: true, message: msg };
    }
    if (adminKind === 'close') {
      setAdminMode(false); store.setAdmin(false);
      const msg = '운영자 모드 OFF — 사용자 모드로 전환되었습니다.';
      setScanMessage(msg);
      return { success: true, message: msg };
    }

    const evidence = provider.getClue(normalized);
    if (!evidence) {
      const msg = `알 수 없는 코드입니다: ${normalized}`;
      setScanMessage(msg);
      return { success: false, message: msg };
    }
    if (evidenceCollected.some((item) => item.code === normalized)) {
      const msg = `이미 수집된 증거입니다. \n\n${evidence.title}`;
      setScanMessage(msg);
      return { success: false, message: msg };
    }

    const { autoUnlocked } = addCodes([normalized]);
    const msg = autoUnlocked.length > 0
      ? `증거 수집 완료: ${evidence.title} · 특수 단서 해금: ${autoUnlocked.map((e) => e.title).join(', ')}`
      : `증거 수집 완료: ${evidence.title}`;
    setScanMessage(msg);
    return { success: true, message: msg };
  };

  /**
   * collectAllOf — 운영자 모드: 해당 인물의 모든 단서를 일괄 획득(테스트용).
   */
  const collectAllOf = (person) => {
    const codes = provider.getCluesByPerson(person).map((c) => c.code);
    const { added } = addCodes(codes, { cascade: false });
    setScanMessage(`[운영자] ${person} 단서 ${added.length}개 일괄 획득.`);
  };

  /**
   * handleTapComplete
   * 사진/소품의 tapReveal(예: 통 라벨 떼기)·감식 비번 공개·핸드폰 열람 흔적이 완료되면 호출.
   * 완료 상태를 영구 저장하고, tapReveal 조합 규칙(provider.evalTapRules)으로 특수 단서를 자동 해금한다.
   */
  const handleTapComplete = (code) => {
    if (tapDone[code]) return;
    const nextDone = { ...tapDone, [code]: true };
    setTapDone(nextDone);
    store.setTapDone(nextDone);
    // 열람 흔적 조합이 충족된 특수 단서(DISC-11/SIST-22 등)를 데이터 규칙 기반으로 자동 해금
    for (const grant of provider.evalTapRules(nextDone)) {
      const { added } = addCodes([grant]);
      if (added.length) {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast(`특수 단서 해금: ${provider.getClue(grant)?.title || grant}`);
        toastTimerRef.current = setTimeout(() => setToast(null), 4000);
      }
    }
  };

  /**
   * handleGamsikWrong
   * 감식 단서 비밀번호를 틀렸을 때 누적 오답 횟수를 1 늘려 영구 저장(5회 초과 시 잠금 유지).
   */
  const handleGamsikWrong = (code) => {
    const next = { ...gamsikTries, [code]: (gamsikTries[code] || 0) + 1 };
    setGamsikTries(next);
    store.setGamsikTries(next);
  };

  // 초기화 확인 후 실제 데이터를 비움 (tapReveal 완료 플래그·감식 오답 횟수·운영자 모드도 함께 해제)
  const handleReset = () => {
    setEvidenceCollected([]);
    setTapDone({});
    setGamsikTries({});
    setAdminMode(false);
    store.reset();
    setScanMessage('증거 목록이 초기화되었습니다. (사용자 모드)');
    setConfirmOpen(false);
  };

  // 피해자(목사) 단서와 그 외 단서를 분리한다. 목사 단서는 별도 탭에서만 보여준다.
  const pastorEvidence = evidenceCollected.filter((item) => item.person === VICTIM_KEY);
  const mainEvidence = evidenceCollected.filter((item) => item.person !== VICTIM_KEY);
  const collectedCodes = new Set(evidenceCollected.map((item) => item.code)); // 운영자 수동 추가 목록의 보유 표시용

  return (
    <div className="app-shell">
      {IS_DEMO && (
        <div style={{ background: '#7a5a00', color: '#fff', textAlign: 'center', fontSize: '0.85rem', padding: '6px 10px', fontWeight: 700 }}>
          {gameConfig.demoBanner}
        </div>
      )}
      <div className="topbar">
        <div className="title-block">
          <h1>{gameConfig.title}</h1>
          <p>{gameConfig.tagline}</p>
        </div>
        {/* 두 게임의 갈림길 — 루트(/)는 QR 참가자가 스캔해 들어오는 곳이라 그대로 두고,
            혼자 하는 쪽 입구만 여기에 둔다. 참가자에게는 한 단계도 늘지 않는다. */}
        <a className="mode-switch" href="/solo-play">
          <span className="ms-ic">🔦</span>
          <span className="ms-tx"><b>혼자 하는 추리</b><small>QR 없이 바로 플레이</small></span>
        </a>
      </div>

      {confirmOpen && (
        <ConfirmModal
          message="수집된 증거를 모두 삭제할까요? 이 작업은 되돌릴 수 없습니다."
          onConfirm={handleReset}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      <div className="grid grid-2">
        <div className="card">
          <h2>증거 스캐너</h2>
          <CameraScanner gameActive={true} onScan={handleScan} externalMessage={scanMessage} />
        </div>

        <div className="card">
          <div className="tab-list">
            <button
              type="button"
              className={`tab-button ${activeTab === 'evidence' ? 'active' : ''}`}
              onClick={() => setActiveTab('evidence')}
            >
              용의자 증거 ({mainEvidence.length})
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'pastor' ? 'active' : ''}`}
              onClick={() => setActiveTab('pastor')}
            >
              피해자 단서 ({pastorEvidence.length})
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              인물 정보
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'evidence' && <EvidenceList evidence={mainEvidence} specialUnlockKey={specialUnlockKey} unlockKinds={unlockKinds} onCollect={handleScan} tapDone={tapDone} onTapComplete={handleTapComplete} cctvCodes={cctvClueCodes} adminMode={adminMode} gamsikTries={gamsikTries} onGamsikWrong={handleGamsikWrong} />}
            {activeTab === 'pastor' && <EvidenceList evidence={pastorEvidence} specialUnlockKey={specialUnlockKey} unlockKinds={unlockKinds} onCollect={handleScan} tapDone={tapDone} onTapComplete={handleTapComplete} cctvCodes={cctvClueCodes} adminMode={adminMode} gamsikTries={gamsikTries} onGamsikWrong={handleGamsikWrong} />}
            {activeTab === 'info' && <CommonInfo victim={victim} suspects={suspects} />}
          </div>
        </div>
      </div>
      {toast && (
        <div className="toast">
          <span className="toast-label">✨ 특수 단서 해금</span>
          <span className="toast-title">{toast}</span>
        </div>
      )}

      {/* 운영자(테스트) 모드 — ADMIN-OPEN 코드 입력 시에만 노출 */}
      {adminMode && (
        <div className="admin-bar">
          <div className="admin-bar-title">🛠️ 운영자 모드 (테스트용)</div>

          <div className="admin-bar-subtitle">인물별 일괄 획득</div>
          <div className="admin-bar-buttons">
            {PERSON_BUTTONS.map((p) => (
              <button key={p} type="button" className="small-button" onClick={() => collectAllOf(p)}>
                {p} 전체
              </button>
            ))}
          </div>

          {/* 전체 단서 수동 추가 — 스캔/코드 입력이 안 되거나 코드에 문제가 생겼을 때의 대비책 */}
          <button
            type="button"
            className="admin-bar-toggle"
            onClick={() => setShowAllClues((v) => !v)}
            aria-expanded={showAllClues}
          >
            {showAllClues ? '▼' : '▶'} 전체 단서 수동 추가 (인물별)
          </button>
          {showAllClues && (
            <div className="admin-clue-manual">
              <p className="admin-clue-help">
                코드 스캔·입력이 안 될 때 아래에서 단서를 직접 눌러 추가합니다. 스캔과 동일하게 처리되어
                연계 특수·감식 단서도 함께 해금됩니다. (이미 보유한 단서는 ✓로 표시되고 비활성화됩니다.)
              </p>
              {CLUE_PERSON_ORDER.map((person) => (
                <div key={person} className="admin-clue-group">
                  <div className="admin-clue-person">
                    {person} <span>({CLUES_BY_PERSON[person].length})</span>
                  </div>
                  <div className="admin-clue-list">
                    {CLUES_BY_PERSON[person].map((c) => {
                      const have = collectedCodes.has(c.code);
                      return (
                        <button
                          key={c.code}
                          type="button"
                          className={`admin-clue-chip${have ? ' admin-clue-chip--have' : ''}`}
                          disabled={have}
                          onClick={() => handleScan(c.code)}
                          title={have ? '이미 보유 중' : `추가: ${c.code}`}
                        >
                          {have ? '✓' : '+'} [{c.code}] {c.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="admin-bar-note">사용자 모드로 복귀: 코드 입력에 <code>{gameConfig.adminCloseCode}</code> 입력</div>

          <div className="admin-bar-reset">
            <button type="button" className="small-button" onClick={() => setConfirmOpen(true)}>
              초기화
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
