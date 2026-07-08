import { useEffect, useMemo, useRef, useState } from 'react';
import { provider } from '../services/index.js';

/**
 * RoomModal — "방 스캔(AR-lite)" 모드.
 *   방 QR을 스캔하면 뒷카메라 실시간 영상을 배경으로, 방 곳곳(임의 방향)에 단서 마커가 떠오른다.
 *   폰을 돌리면(자이로) 마커가 화면을 가로질러 이동해 "방을 둘러보는" AR 느낌 → 마커를 탭해 확보.
 *   - 카메라/자이로 미지원·미허가(데스크톱 등)면 스타일 배경 + 드래그로 둘러보기로 자동 폴백.
 *   - '목록' 버튼으로 정적 그리드 보기 전환.
 *   데이터: item.room = { label, image?, objects:[code|{code}], showBody?, body?, people? }
 *
 * ⚠️ 자이로 축/부호는 기기·화면방향에 따라 다를 수 있어 아래 상수로 조정(실기기 튜닝 대상).
 */
const HFOV = 70;   // 가로 시야각(도)
const VFOV = 90;   // 세로 시야각(도)
const YAW_SIGN = 1;
const PITCH_SIGN = 1;

const norm = (d) => (((d + 180) % 360) + 360) % 360 - 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const emojiOf = (c) => (!c ? '📦' : c.pages ? '📖' : c.wallet ? '👛' : c.schedule ? '📅' : c.phone ? '📱' : '📦');

// 화면 밖 단서 방향 표시(가장자리 화살표) 스타일
const edgeStyle = (side) => {
  const base = { position: 'absolute', zIndex: 15, pointerEvents: 'none', background: '#000a', color: '#ffd76b', fontWeight: 700, fontSize: 13, padding: '4px 9px', borderRadius: 8 };
  if (side === 'left') return { ...base, left: 6, top: '50%', transform: 'translateY(-50%)' };
  if (side === 'right') return { ...base, right: 6, top: '50%', transform: 'translateY(-50%)' };
  if (side === 'up') return { ...base, top: 44, left: '50%', transform: 'translateX(-50%)' };
  return { ...base, bottom: 40, left: '50%', transform: 'translateX(-50%)' };
};

function RoomModal({ item, evidence = [], onCollect, onClose }) {
  const room = item.room || {};
  const [mode, setMode] = useState('ar');            // 'ar' | 'list'
  const [started, setStarted] = useState(false);      // 카메라/자이로 시작(사용자 제스처) 여부
  const [camOn, setCamOn] = useState(false);
  const [useGyro, setUseGyro] = useState(false);
  const [view, setView] = useState({ yaw: 0, pitch: 0 });
  const [flash, setFlash] = useState(null);
  const [openClue, setOpenClue] = useState(null);
  const [bodyOpen, setBodyOpen] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const dragRef = useRef(null);

  const collected = new Set(evidence.map((e) => e.code));

  // 마커 배치(세션마다 랜덤 방향) — 물건은 360° 고르게 흩되 지터, 시신은 낮은 곳 고정.
  const markers = useMemo(() => {
    const objs = (room.objects || []).map((o) => (typeof o === 'string' ? o : o.code));
    const n = objs.length || 1;
    const step = 360 / n;
    const out = objs.map((code, i) => ({
      code,
      az: norm(i * step + (Math.random() - 0.5) * step * 0.6),
      el: -10 + Math.random() * 32,
    }));
    if (room.showBody) out.push({ isBody: true, az: 0, el: -22 });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.code]);

  // ESC 처리
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

  // 자이로 리스너 + 언마운트 정리
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      window.removeEventListener('deviceorientation', onOrient);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onOrient(e) {
    if (e.alpha == null) return;
    setUseGyro(true);
    setView({ yaw: e.alpha, pitch: (e.beta == null ? 90 : e.beta) - 90 });
  }

  // 사용자 제스처로 카메라 + 자이로 시작(iOS 권한 팝업 대응)
  async function start() {
    setStarted(true);
    // 자이로 권한(iOS 13+)
    try {
      const DOE = window.DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === 'function') {
        const res = await DOE.requestPermission();
        if (res === 'granted') window.addEventListener('deviceorientation', onOrient);
      } else if (DOE) {
        window.addEventListener('deviceorientation', onOrient);
      }
    } catch { /* 자이로 미지원 → 드래그 폴백 */ }
    // 카메라
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
      setCamOn(true);
    } catch { /* 카메라 미지원/거부 → 스타일 배경 유지 */ }
  }

  // 드래그로 둘러보기(자이로 폴백/데스크톱)
  const onPointerDown = (e) => { if (useGyro) return; dragRef.current = { x: e.clientX, y: e.clientY }; };
  const onPointerMove = (e) => {
    if (!dragRef.current || useGyro) return;
    const dx = e.clientX - dragRef.current.x, dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setView((v) => ({ yaw: norm(v.yaw - dx * 0.25), pitch: clamp(v.pitch + dy * 0.25, -70, 70) }));
  };
  const onPointerUp = () => { dragRef.current = null; };

  const project = (m) => {
    const dyaw = norm(m.az - view.yaw) * YAW_SIGN;
    const dp = (m.el - view.pitch) * PITCH_SIGN;
    const inView = Math.abs(dyaw) <= HFOV / 2 + 10 && Math.abs(dp) <= VFOV / 2 + 10;
    return { inView, x: 50 + (dyaw / (HFOV / 2)) * 50, y: 50 - (dp / (VFOV / 2)) * 50 };
  };

  const showClue = (code) => { const c = provider.getClue(code); if (c) setOpenClue(c); };
  const pick = (code) => {
    setBodyOpen(false);
    const c = provider.getClue(code);
    if (collected.has(code)) { setFlash({ ok: true, text: `이미 확보 · [${code}] ${c?.title || ''}` }); showClue(code); return; }
    const res = onCollect ? onCollect(code) : { success: false, message: '' };
    setFlash({ ok: !!res.success, text: res.message || (res.success ? '단서 확보!' : '확보 실패') });
    if (res.success) showClue(code);
  };

  const remaining = markers.filter((m) => !m.isBody && !collected.has(m.code)).length;

  // 화면 밖 미확보 마커가 어느 방향에 있는지 집계(가장자리 화살표용)
  const edge = { left: 0, right: 0, up: 0, down: 0 };
  for (const m of markers) {
    if (m.isBody || collected.has(m.code)) continue;
    const dyaw = norm(m.az - view.yaw) * YAW_SIGN;
    const dp = (m.el - view.pitch) * PITCH_SIGN;
    const hOff = Math.abs(dyaw) > HFOV / 2, vOff = Math.abs(dp) > VFOV / 2;
    if (!hOff && !vOff) continue; // 이미 화면 안
    if (hOff && (!vOff || Math.abs(dyaw) / HFOV >= Math.abs(dp) / VFOV)) edge[dyaw < 0 ? 'left' : 'right']++;
    else edge[dp > 0 ? 'up' : 'down']++;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="room-modal" onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', width: 'min(96vw, 900px)', height: 'min(90vh, 640px)', background: '#0b0d12', borderRadius: 12, overflow: 'hidden', color: '#fff' }}>

        <button className="modal-close" onClick={onClose} aria-label="닫기" style={{ zIndex: 30 }}>✕</button>
        <div className="cctv-titlebar" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}>
          🔦 {room.label || item.title} · {mode === 'ar' ? '방 둘러보기' : '물건 목록'}
          <button type="button" onClick={() => setMode(mode === 'ar' ? 'list' : 'ar')}
            style={{ float: 'right', marginRight: 40, fontSize: 12, padding: '2px 10px', borderRadius: 6, cursor: 'pointer' }}>
            {mode === 'ar' ? '목록' : '둘러보기'}
          </button>
        </div>

        {mode === 'ar' ? (
          <div
            className="room-ar-stage"
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
            style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: useGyro ? 'default' : 'grab',
              background: room.image ? `center/cover url(${room.image})` : 'radial-gradient(120% 90% at 50% 40%, #2a3040, #0c0f16)' }}
          >
            {/* 카메라 실시간 배경 */}
            <video ref={videoRef} muted playsInline autoPlay
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: camOn ? 'block' : 'none' }} />

            {/* 마커 */}
            {markers.map((m, i) => {
              const p = project(m);
              if (!p.inView) return null;
              const key = m.isBody ? 'body' : m.code;
              const have = !m.isBody && collected.has(m.code);
              const c = m.isBody ? null : provider.getClue(m.code);
              return (
                <button key={key} type="button"
                  onClick={(e) => { e.stopPropagation(); m.isBody ? (setOpenClue(null), setBodyOpen(true)) : pick(m.code); }}
                  title={m.isBody ? (room.body?.label || '시신') : (c?.title || m.code)}
                  style={{
                    position: 'absolute', left: `${clamp(p.x, 2, 98)}%`, top: `${clamp(p.y, 8, 92)}%`, transform: 'translate(-50%,-50%)',
                    width: m.isBody ? 'auto' : 60, height: m.isBody ? 'auto' : 60, padding: m.isBody ? '8px 14px' : 0, borderRadius: 10,
                    border: m.isBody ? '2px solid #c06868' : have ? '2px solid #3b6d11' : '2px solid rgba(255,255,255,.75)',
                    background: m.isBody ? '#2a1414d9' : '#000a', color: '#fff', cursor: 'pointer', overflow: 'hidden',
                    boxShadow: '0 0 0 4px rgba(0,0,0,.25), 0 4px 12px rgba(0,0,0,.5)',
                  }}>
                  {m.isBody
                    ? <span style={{ fontWeight: 700, color: '#f0d2d2' }}>🛏 {room.body?.label || '시신'}</span>
                    : (c?.image
                      ? <img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: have ? 0.55 : 1 }} />
                      : <span style={{ fontSize: 26, lineHeight: '60px' }}>{emojiOf(c)}</span>)}
                  {!m.isBody && (
                    <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, fontSize: 9, background: '#000b', textAlign: 'center' }}>
                      {have ? '✓' : '❓'} {m.code}
                    </span>
                  )}
                </button>
              );
            })}

            {/* 화면 밖 단서 방향 화살표(어디로 돌아야 남은 단서가 있는지) */}
            {started && (
              <>
                {edge.left > 0 && <div style={edgeStyle('left')}>◀ {edge.left}</div>}
                {edge.right > 0 && <div style={edgeStyle('right')}>{edge.right} ▶</div>}
                {edge.up > 0 && <div style={edgeStyle('up')}>▲ {edge.up}</div>}
                {edge.down > 0 && <div style={edgeStyle('down')}>▼ {edge.down}</div>}
              </>
            )}

            {/* 시작 오버레이(카메라/자이로 권한 제스처) */}
            {!started && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#000000aa', textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>📷 방을 카메라로 둘러보세요</div>
                <div style={{ fontSize: '0.85rem', color: '#c9c6bd', maxWidth: 360 }}>폰을 들고 천천히 돌리면 방 곳곳에 단서가 나타납니다. (카메라·동작 센서 권한 필요 · 안 되면 화면을 드래그해 둘러보세요)</div>
                <button type="button" onClick={start} style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', background: '#c9a84c', color: '#1a1a1a', border: 'none' }}>둘러보기 시작</button>
              </div>
            )}

            {/* 상태/힌트 */}
            <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'end', pointerEvents: 'none' }}>
              <span style={{ fontSize: 12, background: '#000a', padding: '3px 8px', borderRadius: 6 }}>
                미확보 {remaining}개 {remaining > 0 ? '· 방을 계속 둘러보세요' : '· 이 방은 다 살펴봤어요'}
              </span>
              <span style={{ fontSize: 11, color: '#9c9a92', background: '#000a', padding: '3px 8px', borderRadius: 6 }}>
                {useGyro ? '자이로로 둘러보기' : '드래그로 둘러보기'}
              </span>
            </div>
          </div>
        ) : (
          // ── 목록(폴백) 모드: 정적 그리드 ──
          <div style={{ position: 'absolute', inset: '40px 0 0', overflow: 'auto', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, alignContent: 'start' }}>
            {(room.objects || []).map((o) => {
              const code = typeof o === 'string' ? o : o.code;
              const c = provider.getClue(code); const have = collected.has(code);
              return (
                <button key={code} type="button" onClick={() => pick(code)}
                  style={{ padding: 8, borderRadius: 8, cursor: 'pointer', textAlign: 'center', border: have ? '2px solid #3b6d11' : '1px solid #555', background: '#161a22', color: '#fff' }}>
                  {c?.image ? <img src={c.image} alt="" style={{ width: '100%', height: 64, objectFit: 'cover', borderRadius: 6, opacity: have ? 0.55 : 1 }} />
                    : <div style={{ fontSize: 30 }}>{emojiOf(c)}</div>}
                  <div style={{ fontSize: 11, marginTop: 4 }}>{have ? '✓' : '❓'} [{code}]</div>
                  <div style={{ fontSize: 11, color: '#c9c6bd' }}>{c?.title || ''}</div>
                </button>
              );
            })}
            {room.showBody && (
              <button type="button" onClick={() => { setOpenClue(null); setBodyOpen(true); }}
                style={{ padding: 8, borderRadius: 8, cursor: 'pointer', border: '2px solid #c06868', background: '#2a1414', color: '#f0d2d2', fontWeight: 700 }}>
                🛏 {room.body?.label || '시신'}
              </button>
            )}
          </div>
        )}

        {room.people && room.people.length > 0 && mode === 'list' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, fontSize: '0.8rem', color: '#c9c6bd', background: '#000a', padding: '4px 10px' }}>
            🧍 이 방의 인물: {room.people.map((p, i) => <span key={i} style={{ marginRight: 10 }}>{p.name}{p.note ? ` (${p.note})` : ''}</span>)}
          </div>
        )}

        {flash && <div className={`cctv-flash ${flash.ok ? 'ok' : 'no'}`} style={{ position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)', zIndex: 25 }}>{flash.text}</div>}

        {bodyOpen && room.body && (
          <div className="cctv-clue-panel" style={{ position: 'absolute', left: 12, right: 12, bottom: 40, zIndex: 26 }}>
            <div className="cctv-clue-head"><span className="cctv-clue-code">🛏</span> {room.body.label || '시신'}
              <button className="cctv-clue-x" onClick={() => setBodyOpen(false)} aria-label="닫기">✕</button></div>
            <p className="cctv-clue-detail">{room.body.detail}</p>
          </div>
        )}
        {openClue && (
          <div className="cctv-clue-panel" style={{ position: 'absolute', left: 12, right: 12, bottom: 40, zIndex: 26 }}>
            <div className="cctv-clue-head"><span className="cctv-clue-code">[{openClue.code}]</span> {openClue.title}
              {openClue.person && <span className="cctv-clue-person">{openClue.person}</span>}
              <button className="cctv-clue-x" onClick={() => setOpenClue(null)} aria-label="단서 닫기">✕</button></div>
            <p className="cctv-clue-detail">{openClue.detail || "확보했습니다. '수집 증거' 탭에서 자세히 볼 수 있어요."}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomModal;
