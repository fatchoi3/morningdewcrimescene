// ─────────────────────────────────────────────────────────────────────────────
// 오프라인 단독 버전 — 소켓 없이 로컬에서 동작
// 증거 수집 결과는 localStorage('crimescene_evidence')에 저장됨
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import CameraScanner from './components/CameraScanner.jsx';
import EvidenceList from './components/EvidenceList.jsx';
import CommonInfo from './components/SuspectTabs.jsx';
import { evidenceMap, victim, suspects } from './data/gameData.js';

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

const EVIDENCE_KEY = 'crimescene_evidence';

// localStorage에서 수집된 증거 배열을 불러옴. 파싱 실패 시 빈 배열 반환
function loadEvidence() {
  try {
    const raw = localStorage.getItem(EVIDENCE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 수집된 증거 배열을 localStorage에 저장
function saveEvidence(evidence) {
  try {
    localStorage.setItem(EVIDENCE_KEY, JSON.stringify(evidence));
  } catch { }
}

function App() {
  // 앱 시작 시 localStorage에서 이전에 수집한 증거를 복원
  const [evidenceCollected, setEvidenceCollected] = useState(loadEvidence);
  const [scanMessage, setScanMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('evidence'); // 'evidence' | 'pastor' | 'info'
  const [specialUnlockKey, setSpecialUnlockKey] = useState(0);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  /**
   * handleScan
   * QR 스캔 또는 수동 입력으로 넘어온 코드를 처리한다.
   * evidenceMap에서 코드를 조회해 증거를 추가하고 localStorage에 저장한다.
   * CameraScanner의 onScan 콜백 형식에 맞게 { success, message } 객체를 반환한다.
   */
  const handleScan = (code) => {
    const normalized = code.trim().toUpperCase();
    const evidence = evidenceMap[normalized];

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

    const updated = [...evidenceCollected, { code: normalized, ...evidence }];
    const collectedCodes = new Set(updated.map((item) => item.code));

    // unlockedBy 조건이 모두 충족된 특수 단서를 자동으로 추가
    const autoUnlocked = [];
    for (const [specialCode, specialData] of Object.entries(evidenceMap)) {
      if (
        specialData.type === '특수' &&
        Array.isArray(specialData.unlockedBy) &&
        specialData.unlockedBy.length > 0 &&
        !collectedCodes.has(specialCode) &&
        specialData.unlockedBy.every((reqCode) => collectedCodes.has(reqCode))
      ) {
        autoUnlocked.push({ code: specialCode, ...specialData });
        collectedCodes.add(specialCode);
      }
    }

    const finalUpdated = [...updated, ...autoUnlocked];
    setEvidenceCollected(finalUpdated);
    saveEvidence(finalUpdated);
    if (autoUnlocked.length > 0) {
      setSpecialUnlockKey((k) => k + 1);
      const names = autoUnlocked.map((e) => e.title).join(', ');
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast(names);
      toastTimerRef.current = setTimeout(() => setToast(null), 4000);
    }

    const msg = autoUnlocked.length > 0
      ? `증거 수집 완료: ${evidence.title} · 특수 단서 해금: ${autoUnlocked.map((e) => e.title).join(', ')}`
      : `증거 수집 완료: ${evidence.title}`;
    setScanMessage(msg);
    return { success: true, message: msg };
  };

  // 초기화 확인 후 실제 데이터를 비움
  const handleReset = () => {
    setEvidenceCollected([]);
    saveEvidence([]);
    setScanMessage('증거 목록이 초기화되었습니다.');
    setConfirmOpen(false);
  };

  // 목사(피해자) 단서와 그 외 단서를 분리한다.
  // 목사 단서는 용의자에 귀속되지 않으므로 별도 탭에서만 보여준다.
  const pastorEvidence = evidenceCollected.filter((item) => item.person === '목사');
  const mainEvidence = evidenceCollected.filter((item) => item.person !== '목사');

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="title-block">
          <h1>크라임씬 미스터리</h1>
          <p>증거를 수집하여 범인을 밝혀보세요.</p>
        </div>

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
            {activeTab === 'evidence' && <EvidenceList evidence={mainEvidence} specialUnlockKey={specialUnlockKey} />}
            {activeTab === 'pastor' && <EvidenceList evidence={pastorEvidence} specialUnlockKey={specialUnlockKey} />}
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button type="button" className="small-button" onClick={() => setConfirmOpen(true)}>
          초기화
        </button>
      </div>

    </div>
  );
}

export default App;
