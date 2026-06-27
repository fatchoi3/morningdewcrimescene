// ─────────────────────────────────────────────────────────────────────────────
// 오프라인 단독 버전 — 소켓 없이 로컬에서 동작
// 증거 수집 결과는 localStorage('crimescene_evidence')에 저장됨
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import CameraScanner from './components/CameraScanner.jsx';
import EvidenceList from './components/EvidenceList.jsx';
import CommonInfo from './components/SuspectTabs.jsx';
import { evidenceMap, victim, suspects, cctvClueCodes, ADMIN_OPEN_CODE, ADMIN_CLOSE_CODE } from './data/gameData.js';

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
const TAP_KEY = 'crimescene_tapReveal'; // tapReveal(라벨 떼기 등)·감식 비번 공개 완료 플래그 저장소

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

// tapReveal 완료 플래그 맵 { [code]: true } 로드/저장
function loadTapDone() {
  try { return JSON.parse(localStorage.getItem(TAP_KEY) || '{}'); }
  catch { return {}; }
}
function saveTapDone(done) {
  try { localStorage.setItem(TAP_KEY, JSON.stringify(done)); } catch { }
}

const ADMIN_KEY = 'crimescene_admin'; // 운영자(테스트) 모드 on/off
function loadAdmin() {
  try { return localStorage.getItem(ADMIN_KEY) === '1'; } catch { return false; }
}
function saveAdmin(on) {
  try { localStorage.setItem(ADMIN_KEY, on ? '1' : '0'); } catch { }
}

// 운영자 모드 인물별 일괄획득 버튼 순서
const PERSON_BUTTONS = ['박희원', '이사랑', '이현지', '최종현', '윤은재', '이가현', '목사', '공용'];

// 주어진 코드 집합 기준, 해금 조건이 충족된 미수집 특수/감식 단서를 (연쇄적으로) 반환.
//   unlockedBy    : 모두(AND) 충족 시 해금
//   unlockedByAny : 하나라도(OR) 충족 시 해금
// codeSet은 호출 측에서 누적되도록 직접 변형된다.
function computeAutoUnlocked(codeSet) {
  const out = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const [code, data] of Object.entries(evidenceMap)) {
      if (data.type !== '특수' && data.type !== '감식') continue;
      if (codeSet.has(code)) continue;
      const byAll = Array.isArray(data.unlockedBy) && data.unlockedBy.length > 0
        && data.unlockedBy.every((req) => codeSet.has(req));
      const byAny = Array.isArray(data.unlockedByAny) && data.unlockedByAny.length > 0
        && data.unlockedByAny.some((req) => codeSet.has(req));
      if (byAll || byAny) {
        out.push({ code, ...data });
        codeSet.add(code);
        changed = true;
      }
    }
  }
  return out;
}


function App() {
  // 앱 시작 시 localStorage에서 이전에 수집한 증거를 복원
  const [evidenceCollected, setEvidenceCollected] = useState(loadEvidence);
  const [tapDone, setTapDone] = useState(loadTapDone); // tapReveal 완료 플래그
  const [adminMode, setAdminMode] = useState(loadAdmin); // 운영자(테스트) 모드
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
  /**
   * addCodes
   * 주어진 코드들을 수집 목록에 추가하고, 연계 특수/감식 단서를 자동 해금한다.
   * (handleScan 단건 수집과 운영자 모드 일괄 수집이 공유)
   * cascade=false면 자동 해금을 건너뛰고 전달된 코드만 추가한다.
   * (운영자 인물별 일괄획득은 해당 person 단서만 정확히 넣기 위해 사용)
   */
  const addCodes = (codes, { cascade = true } = {}) => {
    const have = new Set(evidenceCollected.map((i) => i.code));
    const toAdd = codes.filter((c) => evidenceMap[c] && !have.has(c));
    if (!toAdd.length) return { added: [], autoUnlocked: [] };

    let merged = [...evidenceCollected, ...toAdd.map((c) => ({ code: c, ...evidenceMap[c] }))];
    const codeSet = new Set(merged.map((i) => i.code));
    const autoUnlocked = cascade ? computeAutoUnlocked(codeSet) : [];
    if (autoUnlocked.length) merged = [...merged, ...autoUnlocked];

    setEvidenceCollected(merged);
    saveEvidence(merged);
    if (autoUnlocked.length > 0) {
      setSpecialUnlockKey((k) => k + 1);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast(autoUnlocked.map((e) => e.title).join(', '));
      toastTimerRef.current = setTimeout(() => setToast(null), 4000);
    }
    return { added: toAdd, autoUnlocked };
  };

  const handleScan = (code) => {
    const normalized = code.trim().toUpperCase();

    // 운영자(테스트) 모드 마스터 코드 처리 (evidenceMap 조회 전에 가로챔)
    if (normalized === ADMIN_OPEN_CODE) {
      setAdminMode(true); saveAdmin(true);
      const msg = '운영자 모드 ON — 하단의 인물별 버튼으로 단서를 일괄 획득할 수 있고, 감식 비번이 자동 해제됩니다.';
      setScanMessage(msg);
      return { success: true, message: msg };
    }
    if (normalized === ADMIN_CLOSE_CODE) {
      setAdminMode(false); saveAdmin(false);
      const msg = '운영자 모드 OFF — 사용자 모드로 전환되었습니다.';
      setScanMessage(msg);
      return { success: true, message: msg };
    }

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
    const codes = Object.entries(evidenceMap)
      .filter(([, v]) => v.person === person)
      .map(([code]) => code);
    const { added } = addCodes(codes, { cascade: false });
    setScanMessage(`[운영자] ${person} 단서 ${added.length}개 일괄 획득.`);
  };

  /**
   * handleTapComplete
   * 사진/소품의 tapReveal(예: 통 라벨 떼기) 또는 감식 단서 비번 공개가 완료되면 호출된다.
   * 완료 상태를 영구 저장해 재방문(모달 재오픈)·새로고침 시에도 공개 상태가 유지되게 한다.
   * (초기화 버튼을 누르면 handleReset에서 함께 비워진다.)
   * (라벨 떨어짐 기반 자동 해금 갈래는 필적 대조 라인으로 대체되어 폐기됨)
   */
  const handleTapComplete = (code) => {
    if (tapDone[code]) return;
    const nextDone = { ...tapDone, [code]: true };
    setTapDone(nextDone);
    saveTapDone(nextDone);
    // 비대칭 인멸 자동 해금(DISC-11): 목사 폰 톡서랍(0419) 복구 열람 + 가현 폰 카톡 열람 두 흔적이 모이면 해금
    if (nextDone['LWUY-33:톡서랍'] && nextDone['TCGA-87:kakao']) {
      const { added } = addCodes(['DISC-11']);
      if (added.length) {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast(`특수 단서 해금: ${evidenceMap['DISC-11']?.title || '사라진 대화방'}`);
        toastTimerRef.current = setTimeout(() => setToast(null), 4000);
      }
    }
    // 자매 관계 자동 해금(SIST-22): 사랑 폰 톡서랍(0302) + 현지 폰 톡서랍(0815)을 양쪽 다 복구해
    //   서로의 교차 대화를 확인하면 해금 (한쪽만으로는 부여하지 않음)
    if (nextDone['QIVS-92:톡서랍'] && nextDone['HUOX-80:톡서랍']) {
      const { added } = addCodes(['SIST-22']);
      if (added.length) {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast(`특수 단서 해금: ${evidenceMap['SIST-22']?.title || '둘은 무슨 사이?'}`);
        toastTimerRef.current = setTimeout(() => setToast(null), 4000);
      }
    }
  };

  // 초기화 확인 후 실제 데이터를 비움 (tapReveal 완료 플래그도 함께 삭제)
  const handleReset = () => {
    setEvidenceCollected([]);
    saveEvidence([]);
    setTapDone({});
    saveTapDone({});
    setAdminMode(false); // 초기화 시 사용자 모드로 복귀
    saveAdmin(false);
    setScanMessage('증거 목록이 초기화되었습니다. (사용자 모드)');
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
            {activeTab === 'evidence' && <EvidenceList evidence={mainEvidence} specialUnlockKey={specialUnlockKey} onCollect={handleScan} tapDone={tapDone} onTapComplete={handleTapComplete} cctvCodes={cctvClueCodes} adminMode={adminMode} />}
            {activeTab === 'pastor' && <EvidenceList evidence={pastorEvidence} specialUnlockKey={specialUnlockKey} onCollect={handleScan} tapDone={tapDone} onTapComplete={handleTapComplete} cctvCodes={cctvClueCodes} adminMode={adminMode} />}
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

      {/* 운영자(테스트) 모드 — 인물별 단서 일괄 획득 */}
      {adminMode && (
        <div className="admin-bar">
          <div className="admin-bar-title">🛠️ 운영자 모드 · 인물별 일괄 획득 (테스트용)</div>
          <div className="admin-bar-buttons">
            {PERSON_BUTTONS.map((p) => (
              <button key={p} type="button" className="small-button" onClick={() => collectAllOf(p)}>
                {p} 전체
              </button>
            ))}
          </div>
          <div className="admin-bar-note">사용자 모드로 복귀: 코드 입력에 <code>{ADMIN_CLOSE_CODE}</code> 입력 또는 [초기화] 버튼</div>
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
