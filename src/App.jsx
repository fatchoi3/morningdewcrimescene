// ─────────────────────────────────────────────────────────────────────────────
// 소켓 기반 멀티플레이어 버전 (주석 보존)
// 소켓 서버 없이 로컬 오프라인으로 동작하는 버전으로 교체됨
// ─────────────────────────────────────────────────────────────────────────────
/*
import { useEffect, useRef, useState } from 'react';
import HostPanel from './components/HostPanel.jsx';
import ParticipantPanel from './components/ParticipantPanel.jsx';
import { locationInfo, suspects } from './data/gameData.js';

const SESSION_KEY = 'crimescene_session';

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(data) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {}
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

const initialGameState = {
  role: null,
  roomCode: '',
  joinedRoom: '',
  gameActive: false,
  evidenceCollected: []
};

const DEFAULT_WS_URL = typeof window !== 'undefined'
  ? `wss://${window.location.hostname}:3001`
  : 'wss://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || DEFAULT_WS_URL;

function App() {
  const savedSession = loadSession();

  const [role, setRole] = useState(savedSession?.role ?? initialGameState.role);
  const [roomCode, setRoomCode] = useState(savedSession?.roomCode ?? initialGameState.roomCode);
  const [joinedRoom, setJoinedRoom] = useState(savedSession?.joinedRoom ?? initialGameState.joinedRoom);
  const [gameActive, setGameActive] = useState(initialGameState.gameActive);
  const [evidenceCollected, setEvidenceCollected] = useState(initialGameState.evidenceCollected);
  const [statusMessage, setStatusMessage] = useState(
    savedSession?.joinedRoom
      ? `이전 세션 복구 중... (방: ${savedSession.joinedRoom})`
      : '서버 연결을 시도 중입니다...'
  );
  const [connectionStatus, setConnectionStatus] = useState('연결 중');
  const [joinMessage, setJoinMessage] = useState('');
  const [scanMessage, setScanMessage] = useState('카메라를 활성화하고 QR 텍스트를 입력하세요.');
  const wsRef = useRef(null);

  useEffect(() => {
    if (role) {
      saveSession({ role, joinedRoom, roomCode });
    } else {
      clearSession();
    }
  }, [role, joinedRoom, roomCode]);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      setConnectionStatus('서버에 연결됨');
      const session = loadSession();
      if (session?.role === 'participant' && session?.joinedRoom) {
        setStatusMessage(`세션 복구: ${session.joinedRoom} 방에 재입장 시도 중...`);
        socket.send(JSON.stringify({ type: 'join_room', roomCode: session.joinedRoom }));
      } else {
        setStatusMessage('서버에 연결되었습니다. 호스트 또는 참가자를 선택하세요.');
      }
    };

    socket.onclose = () => {
      setConnectionStatus('연결 끊김');
      setStatusMessage('웹소켓 서버 연결이 끊겼습니다. 서버를 실행하세요.');
    };

    socket.onerror = () => {
      setConnectionStatus('오류 발생');
      setStatusMessage('웹소켓 연결에서 오류가 발생했습니다. 서버 상태를 확인하세요.');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'room_created':
            setRoomCode(message.roomCode);
            setStatusMessage(`새 방이 생성되었습니다. 참가자는 ${message.roomCode}으로 입장하세요.`);
            break;
          case 'join_success':
            setJoinedRoom(message.roomCode);
            setJoinMessage(`입장 성공: ${message.roomCode}`);
            setStatusMessage('방에 입장했습니다. 호스트가 게임을 시작할 때까지 기다려주세요.');
            break;
          case 'join_error':
            setJoinMessage(`입장 실패: ${message.error}`);
            setStatusMessage(message.error);
            clearSession();
            setJoinedRoom('');
            break;
          case 'game_state':
            setGameActive(message.gameActive);
            setEvidenceCollected(message.evidence || []);
            setStatusMessage(
              message.gameActive
                ? '게임이 시작되었습니다. 참가자는 증거를 수집할 수 있습니다.'
                : '게임이 정지되었습니다. 호스트가 다시 시작할 때까지 기다려주세요.'
            );
            break;
          case 'scan_result':
            setScanMessage(message.message);
            break;
          case 'room_closed':
            setStatusMessage('방이 닫혔습니다. 호스트가 나갔거나 방이 종료되었습니다.');
            setRoomCode('');
            setJoinedRoom('');
            setGameActive(false);
            setEvidenceCollected([]);
            clearSession();
            break;
          default:
            break;
        }
      } catch (error) {
        console.warn('WebSocket message parsing error:', error);
      }
    };

    return () => { socket.close(); };
  }, []);

  const sendSocket = (payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      setStatusMessage('웹소켓 서버에 연결되어 있지 않습니다. 서버를 실행하세요.');
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStatusMessage(
      selectedRole === 'host'
        ? '호스트 모드로 전환되었습니다. 방 만들기를 진행하세요.'
        : '참가자 모드로 전환되었습니다. 방 코드를 입력해 입장하세요.'
    );
  };

  const handleCreateRoom = () => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setStatusMessage('서버에 연결되어 있어야 방을 생성할 수 있습니다.');
      return;
    }
    sendSocket({ type: 'create_room' });
  };

  const handleJoinRoom = (joinCode) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setJoinMessage('서버에 연결되어 있어야 합니다.');
      return;
    }
    const normalized = joinCode.trim().toUpperCase();
    if (!normalized) {
      setJoinMessage('정확한 방 코드를 입력하세요.');
      return;
    }
    setJoinMessage('입장 시도 중...');
    sendSocket({ type: 'join_room', roomCode: normalized });
  };

  const handleToggleGame = () => {
    if (!roomCode) {
      setStatusMessage('먼저 방을 만들어야 게임을 시작할 수 있습니다.');
      return;
    }
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setStatusMessage('서버 연결이 필요합니다.');
      return;
    }
    sendSocket({ type: 'toggle_game', roomCode });
  };

  const handleScan = (scanCode) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      return { success: false, message: '서버에 연결되어 있지 않습니다.' };
    }
    if (!joinedRoom) {
      return { success: false, message: '먼저 방에 입장하세요.' };
    }
    if (!gameActive) {
      return { success: false, message: '호스트가 게임을 시작해야 증거를 수집할 수 있습니다.' };
    }
    const code = scanCode.trim().toUpperCase();
    setScanMessage(`스캔 요청: ${code}`);
    sendSocket({ type: 'scan_evidence', roomCode: joinedRoom, code });
    return { success: true, message: '스캔 요청을 서버로 보내는 중입니다.' };
  };

  const handleResetGame = () => {
    if (!roomCode) {
      setStatusMessage('먼저 방을 만들어야 합니다.');
      return;
    }
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setStatusMessage('서버 연결이 필요합니다.');
      return;
    }
    sendSocket({ type: 'reset_game', roomCode });
  };

  const handleLeave = () => {
    clearSession();
    setRole(null);
    setJoinedRoom('');
    setRoomCode('');
    setGameActive(false);
    setEvidenceCollected([]);
    setJoinMessage('');
    setScanMessage('카메라를 활성화하고 QR 텍스트를 입력하세요.');
    setStatusMessage('역할을 선택해서 게임에 참여하세요.');
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="title-block">
          <h1>크라임씬 미스터리</h1>
          <p>호스트와 참가자가 함께 진행하는 오프라인 탐사 게임입니다.</p>
        </div>
        <div className="role-select">
          <button type="button" onClick={() => handleRoleSelect('host')}>호스트</button>
          <button type="button" onClick={() => handleRoleSelect('participant')}>참가자</button>
        </div>
      </div>

      <div className="card message-box">
        <p>{connectionStatus} · {statusMessage}</p>
      </div>

      {!role && (
        <div className="card">
          <h2>시작하기</h2>
          <p>호스트는 방을 생성하고, 참가자는 해당 방 코드로 입장하여 함께 게임을 진행합니다.</p>
        </div>
      )}

      {role === 'host' && (
        <HostPanel
          roomCode={roomCode}
          gameActive={gameActive}
          evidenceCount={evidenceCollected.length}
          onCreateRoom={handleCreateRoom}
          onToggleGame={handleToggleGame}
          onResetGame={handleResetGame}
        />
      )}

      {role === 'participant' && (
        <ParticipantPanel
          gameActive={gameActive}
          roomCode={roomCode}
          joinedRoom={joinedRoom}
          onJoinRoom={handleJoinRoom}
          onScan={handleScan}
          evidenceCollected={evidenceCollected}
          suspects={suspects}
          locationInfo={locationInfo}
          onLeave={handleLeave}
          joinMessage={joinMessage}
          scanMessage={scanMessage}
        />
      )}
    </div>
  );
}

export default App;
*/
// ─────────────────────────────────────────────────────────────────────────────
// 오프라인 단독 버전 — 소켓 없이 로컬에서 동작
// 증거 수집 결과는 localStorage('crimescene_evidence')에 저장됨
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
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
  } catch {}
}

function App() {
  // 앱 시작 시 localStorage에서 이전에 수집한 증거를 복원
  const [evidenceCollected, setEvidenceCollected] = useState(loadEvidence);
  const [scanMessage, setScanMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('evidence'); // 'evidence' | 'info'

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
      const msg = `이미 수집된 증거입니다: ${evidence.title}`;
      setScanMessage(msg);
      return { success: false, message: msg };
    }

    const updated = [...evidenceCollected, { code: normalized, ...evidence }];
    setEvidenceCollected(updated);
    saveEvidence(updated);

    const msg = `증거 수집 완료: ${evidence.title}`;
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
              수집된 증거 ({evidenceCollected.length})
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              공통 정보
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'evidence' && <EvidenceList evidence={evidenceCollected} />}
            {activeTab === 'info' && <CommonInfo victim={victim} suspects={suspects} />}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button type="button" className="small-button" onClick={() => setConfirmOpen(true)}>
          초기화
      </button>
      </div>
      
    </div>
  );
}

export default App;
