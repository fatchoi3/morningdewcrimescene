import { useEffect, useRef, useState } from 'react';
import HostPanel from './components/HostPanel.jsx';
import ParticipantPanel from './components/ParticipantPanel.jsx';
import { locationInfo, suspects } from './data/gameData.js';

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
  const [role, setRole] = useState(initialGameState.role);
  const [roomCode, setRoomCode] = useState(initialGameState.roomCode);
  const [joinedRoom, setJoinedRoom] = useState(initialGameState.joinedRoom);
  const [gameActive, setGameActive] = useState(initialGameState.gameActive);
  const [evidenceCollected, setEvidenceCollected] = useState(initialGameState.evidenceCollected);
  const [statusMessage, setStatusMessage] = useState('서버 연결을 시도 중입니다...');
  const [connectionStatus, setConnectionStatus] = useState('연결 중');
  const [joinMessage, setJoinMessage] = useState('');
  const [scanMessage, setScanMessage] = useState('카메라를 활성화하고 QR 텍스트를 입력하세요.');
  const wsRef = useRef(null);

  useEffect(() => {
    console.log('WS_URL', WS_URL);
    console.log('WebSocket connecting...', WS_URL);
    const socket = new WebSocket(WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('서버에 연결됨');
      setStatusMessage('서버에 연결되었습니다. 호스트 또는 참가자를 선택하세요.');
    };

    socket.onclose = (event) => {
      console.log('WebSocket closed', event);
      setConnectionStatus('연결 끊김');
      setStatusMessage('웹소켓 서버 연결이 끊겼습니다. 서버를 실행하세요.');
    };

    socket.onerror = (event) => {
      console.error('WebSocket error', event);
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
            break;
          default:
            break;
        }
      } catch (error) {
        console.warn('WebSocket message parsing error:', error);
      }
    };

    return () => {
      socket.close();
    };
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
          <button type="button" onClick={() => handleRoleSelect('host')}>
            호스트
          </button>
          <button type="button" onClick={() => handleRoleSelect('participant')}>
            참가자
          </button>
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
