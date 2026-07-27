// ─────────────────────────────────────────────────────────────────────────────
// features/admin — 운영자(테스트) 모드 패널. 방입장·단서 취득을 쉽게.
//   전 구역 개방 토글 + 모든 단서 확보/비우기/튜토리얼 스킵/처음화면/초기화.
// ─────────────────────────────────────────────────────────────────────────────

// ── 운영자(테스트) 모드 패널 — 방입장·단서 취득을 쉽게 ──
export function AdminPanel({ state, onClose, onUpdate, onCollectAll, onClearClues, onReset, onGoStart }) {
  return (
    <div className="s-modal-ov" onClick={onClose}>
      <div className="s-modal" onClick={(e) => e.stopPropagation()}>
        <div className="s-modal-h"><div className="mt">⚙ 운영자 모드 <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '.8rem' }}>(테스트용)</span></div><button className="mx" onClick={onClose}>✕</button></div>
        <div className="s-modal-b">
          <div className="s-adm-row">
            <div><div style={{ fontWeight: 800 }}>전 구역 개방</div><div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>단계 잠금 없이 모든 방·CCTV·휴대폰·감식·목사님 방 입장 + 2차 심문</div></div>
            <button className={`s-adm-toggle${state.admin ? ' on' : ''}`}
              onClick={() => onUpdate(state.admin ? { admin: false } : { admin: true, eventSeen: true, tutorialSeen: true, tutRecordDone: true, tutFinaleSeen: true })}>
              {state.admin ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="s-adm-actions">
            <button className="s-btn sm" onClick={onCollectAll}>📦 모든 단서 확보</button>
            <button className="s-btn sm ghost" onClick={onClearClues}>🧹 단서 비우기</button>
            <button className="s-btn sm ghost" onClick={() => onUpdate({ tutorialSeen: true, tutRecordDone: true, tutFinaleSeen: true })}>🎓 튜토리얼 스킵</button>
            <button className="s-btn sm ghost" onClick={onGoStart}>🏠 처음 화면으로</button>
            <button className="s-btn sm ghost" onClick={onReset} style={{ gridColumn: '1 / -1' }}>♻ 저장 초기화</button>
          </div>
          <p style={{ fontSize: '.76rem', color: 'var(--muted)', marginTop: 12, lineHeight: 1.6 }}>
            테스트 편의 기능입니다. ‘전 구역 개방’을 켜면 진행도와 무관하게 모든 장소에 바로 들어가고, ‘모든 단서 확보’로 사건 기록을 가득 채워 확인할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}
