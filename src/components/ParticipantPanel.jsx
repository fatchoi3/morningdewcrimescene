// ─────────────────────────────────────────────────────────────────────────────
// ParticipantPanel — 소켓 기반 멀티플레이어 버전에서 사용하던 참가자 인터페이스
// 방 입장, 게임 활성화 여부 수신 등 소켓 의존 로직이 포함되어 있음
// 오프라인 단독 버전에서는 App.jsx가 레이아웃을 직접 렌더링하므로 미사용
// ─────────────────────────────────────────────────────────────────────────────
/*
import { useState } from 'react';
import CameraScanner from './CameraScanner.jsx';
import EvidenceList from './EvidenceList.jsx';
import InfoCard from './InfoCard.jsx';
import SuspectTabs from './SuspectTabs.jsx';

function ParticipantPanel({
  gameActive,
  roomCode,
  joinedRoom,
  onJoinRoom,
  onScan,
  evidenceCollected,
  suspects,
  locationInfo,
  onLeave,
  joinMessage,
  scanMessage
}) {
  const [joinInput, setJoinInput] = useState('');

  return (
    <div className="grid grid-3">
      <div className="card">
        <h2>참가자 인터페이스</h2>
        {!joinedRoom ? (
          <div className="form-group">
            <label htmlFor="room-code">방 코드 입력</label>
            <input
              id="room-code"
              value={joinInput}
              onChange={(event) => setJoinInput(event.target.value)}
              placeholder="예: ROOM-AB12"
            />
            <button
              type="button"
              className="control-button"
              onClick={() => onJoinRoom(joinInput)}
              disabled={!joinInput}
            >
              방 입장
            </button>
            <p className="scan-hint">
              {roomCode
                ? '호스트가 만든 방 코드가 준비되었습니다. 정확히 입력하세요.'
                : '호스트가 먼저 방을 만들어야 입장할 수 있습니다.'}
            </p>
            {joinMessage && (
              <div className="message-box">
                <p>{joinMessage}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <p>
              현재 입장한 방: <strong>{joinedRoom}</strong>
            </p>
            <p>호스트가 게임을 시작해야 카메라와 코드 입력이 활성화됩니다.</p>
            <CameraScanner gameActive={gameActive} onScan={onScan} externalMessage={scanMessage} />
            <button type="button" className="small-button" onClick={onLeave}>
              나가기
            </button>
          </>
        )}
      </div>

      <div className="card">
        <h2>수집된 증거 목록</h2>
        <EvidenceList evidence={evidenceCollected} />
      </div>

      <div className="card">
        <SuspectTabs suspects={suspects} />
        <InfoCard title="장소 정보" details={locationInfo} />
      </div>
    </div>
  );
}

export default ParticipantPanel;
*/
