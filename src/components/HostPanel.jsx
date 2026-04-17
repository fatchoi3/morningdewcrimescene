function HostPanel({ roomCode, gameActive, evidenceCount, onCreateRoom, onToggleGame, onResetGame }) {
  return (
    <div className="grid grid-3">
      <div className="card">
        <h2>호스트 대시보드</h2>
        <p>방을 만들고 게임을 시작하거나 중지하세요. 참가자는 같은 방 코드로 입장해야 합니다.</p>
        <div className="form-group">
          <div>
            <strong>방 코드:</strong>{' '}
            <span className="status-pill">{roomCode || '없음'}</span>
          </div>
          <div>
            <strong>게임 상태:</strong>{' '}
            <span className="status-pill">{gameActive ? '진행 중' : '정지됨'}</span>
          </div>
          <div>
            <strong>수집된 증거:</strong> {evidenceCount}건
          </div>
        </div>
        <div className="form-group">
          <button type="button" className="control-button" onClick={onCreateRoom}>
            방 만들기
          </button>
          <button type="button" className="control-button" onClick={onToggleGame} disabled={!roomCode}>
            {gameActive ? '게임 정지' : '게임 시작'}
          </button>
          <button type="button" className="small-button" onClick={onResetGame}>
            게임 초기화
          </button>
        </div>
      </div>

      <div className="card">
        <h2>진행 팁</h2>
        <div className="hint-box">
          <p>참가자에게 방 코드를 공유해 주세요. 참가자가 모두 입장한 후 게임을 시작하세요.</p>
          <p>호스트가 게임을 시작해야만 카메라 스캔 및 코드 입력이 활성화됩니다.</p>
        </div>
      </div>

      <div className="card">
        <h2>게임 규칙</h2>
        <ul>
          <li>방을 만든 사람은 호스트입니다.</li>
          <li>입장한 사람은 모두 참가자가 됩니다.</li>
          <li>호스트가 시작 버튼을 누르면 참가자는 증거 수집을 시작할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
}

export default HostPanel;
