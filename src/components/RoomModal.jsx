import { useEffect, useState } from 'react';
import { provider } from '../services/index.js';

/**
 * RoomModal
 * 방(공간) 단서. 막아둔 방을 "카메라로 둘러보는" 화면.
 *   - 배경(스타일 또는 room.image) 위에 물건 마커(기존 단서 이미지)를 배치.
 *   - 마커 탭 → 해당 단서를 확보(onCollect)하고 창 안에서 인라인 상세 열람.
 *   - room.showBody 면 시신 요소, room.people 있으면 인물 라벨.
 * 데이터: item.room = { label, image?, objects:[code | {code,x,y}], showBody?, body?, people? }
 * (CctvModal의 마커 탭→인라인 열람 패턴을 타임라인 없이 재사용)
 */
function markerEmoji(clue) {
  if (!clue) return '📦';
  if (clue.pages) return '📖';
  if (clue.wallet) return '👛';
  if (clue.schedule) return '📅';
  if (clue.phone) return '📱';
  return '📦';
}

function RoomModal({ item, evidence = [], onCollect, onClose }) {
  const room = item.room || {};
  const [flash, setFlash] = useState(null);
  const [openClue, setOpenClue] = useState(null);
  const [bodyOpen, setBodyOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (openClue) setOpenClue(null);
      else if (bodyOpen) setBodyOpen(false);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, openClue, bodyOpen]);

  const collected = new Set(evidence.map((e) => e.code));

  // 물건 정규화 + 좌표 자동 그리드(미지정 시)
  const raw = (room.objects || []).map((o) => (typeof o === 'string' ? { code: o } : o));
  const cols = Math.max(1, Math.ceil(Math.sqrt(raw.length)));
  const rows = Math.max(1, Math.ceil(raw.length / cols));
  const objs = raw.map((o, i) => {
    const col = i % cols, r = Math.floor(i / cols);
    return {
      ...o,
      x: o.x != null ? o.x : ((col + 0.5) / cols) * 100,
      y: o.y != null ? o.y : ((r + 0.5) / (rows + (room.showBody ? 0.6 : 0))) * 100,
    };
  });

  const showClue = (code) => { const c = provider.getClue(code); if (c) setOpenClue(c); };
  const handlePick = (code) => {
    setBodyOpen(false);
    const c = provider.getClue(code);
    if (collected.has(code)) {
      setFlash({ ok: true, text: `이미 확보 · [${code}] ${c?.title || ''}` });
      showClue(code);
      return;
    }
    const res = onCollect ? onCollect(code) : { success: false, message: '' };
    setFlash({ ok: !!res.success, text: res.message || (res.success ? '단서 확보!' : '확보 실패') });
    if (res.success) showClue(code);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cctv-modal room-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="cctv-titlebar">🔦 {room.label || item.title} · 둘러보기</div>

        {/* 방 화면(스타일 배경 또는 사진) + 물건 마커 */}
        <div
          className="cctv-screen room-scene"
          style={{
            position: 'relative', height: 360, overflow: 'hidden',
            background: room.image
              ? `center/cover no-repeat url(${room.image})`
              : 'radial-gradient(120% 90% at 50% 0%, #262b35 0%, #12151d 100%)',
          }}
        >
          {objs.map((o) => {
            const c = provider.getClue(o.code);
            const have = collected.has(o.code);
            return (
              <button
                key={o.code} type="button" onClick={() => handlePick(o.code)} title={c?.title || o.code}
                style={{
                  position: 'absolute', left: `${o.x}%`, top: `${o.y}%`, transform: 'translate(-50%,-50%)',
                  width: 62, height: 62, borderRadius: 10, padding: 0, overflow: 'hidden', cursor: 'pointer',
                  border: have ? '2px solid #3b6d11' : '2px solid rgba(255,255,255,.5)', background: '#000a',
                }}
              >
                {c?.image
                  ? <img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: have ? 0.55 : 1 }} />
                  : <span style={{ fontSize: 26, lineHeight: '62px' }}>{markerEmoji(c)}</span>}
                <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, fontSize: 9, color: '#fff', background: '#000b', textAlign: 'center', padding: '1px 0' }}>
                  {have ? '✓' : '❓'} {o.code}
                </span>
              </button>
            );
          })}

          {room.showBody && (
            <button
              type="button" onClick={() => { setOpenClue(null); setBodyOpen(true); }} title="시신 살펴보기"
              style={{
                position: 'absolute', left: '50%', top: '85%', transform: 'translate(-50%,-50%)',
                padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
                border: '2px solid #c06868', background: '#2a1414d9', color: '#f0d2d2',
              }}
            >
              🛏 {room.body?.label || '시신'}
            </button>
          )}
        </div>

        {room.people && room.people.length > 0 && (
          <div className="room-people" style={{ margin: '8px 2px', fontSize: '0.85rem', color: '#c9c6bd' }}>
            🧍 이 방의 인물:&nbsp;
            {room.people.map((p, i) => (
              <span key={i} style={{ marginRight: 10 }}>{p.name}{p.note ? ` (${p.note})` : ''}</span>
            ))}
          </div>
        )}

        {flash && <div className={`cctv-flash ${flash.ok ? 'ok' : 'no'}`}>{flash.text}</div>}

        {bodyOpen && room.body && (
          <div className="cctv-clue-panel">
            <div className="cctv-clue-head">
              <span className="cctv-clue-code">🛏</span> {room.body.label || '시신'}
              <button className="cctv-clue-x" onClick={() => setBodyOpen(false)} aria-label="닫기">✕</button>
            </div>
            <p className="cctv-clue-detail">{room.body.detail}</p>
          </div>
        )}

        {openClue && (
          <div className="cctv-clue-panel">
            <div className="cctv-clue-head">
              <span className="cctv-clue-code">[{openClue.code}]</span> {openClue.title}
              {openClue.person && <span className="cctv-clue-person">{openClue.person}</span>}
              <button className="cctv-clue-x" onClick={() => setOpenClue(null)} aria-label="단서 닫기">✕</button>
            </div>
            <p className="cctv-clue-detail">
              {openClue.detail || "확보했습니다. '수집 증거' 탭에서 자세히 볼 수 있어요."}
            </p>
          </div>
        )}

        <p className="cctv-help">막힌 방을 카메라로 둘러봅니다. 물건을 눌러 확보하세요. (확보한 단서는 ‘수집 증거’에서 다시 볼 수 있어요)</p>
      </div>
    </div>
  );
}

export default RoomModal;
