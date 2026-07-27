import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { provider } from '../services/index.js';

/**
 * RoomModal — "방 스캔(AR-lite 심화)" 모드.
 *   ① 입장 → 카메라로 방을 한 바퀴 둘러보며 스캔(자이로 커버리지) → "방 구성이 완료되었습니다".
 *   ② 마커는 고정 방향에 앵커(벽에 붙은 느낌). 멀리선 잠긴 힌트(❓)만, 화면 중앙 조준점으로
 *      조준하면 가장 가까운 마커가 🔍로 바뀌고, 그 🔍 마커를 탭하면 단서 확보.
 *   - 실제 깊이/평면 인식(WebXR)이 아니라 방향+정조준 시뮬레이션(아이폰 포함 웹 호환).
 *   - 카메라/자이로 미지원·데스크톱이면 스타일 배경 + 드래그로 둘러보기 폴백.
 *   - '목록' 버튼으로 정적 그리드 폴백.
 *   데이터: item.room = { label, image?, objects:[code|{code}], showBody?, body?, people? }
 *
 * ⚠️ 자이로 축/부호·시야각은 기기·화면방향마다 달라 아래 상수로 조정(실기기 튜닝).
 */
const HFOV = 70, VFOV = 90;
const YAW_SIGN = 1, PITCH_SIGN = 1;
const SCAN_BUCKETS = 12;        // 방위 12등분
const SCAN_NEEDED = 8;          // 이만큼(≈240°) 둘러보면 스캔 완료
const FOCUS_TOL = 26;           // 이 각도 안(가장 가까운 1개)으로 조준하면 🔍 → 탭하여 확보

const norm = (d) => (((d + 180) % 360) + 360) % 360 - 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const emojiOf = (c) => (!c ? '📦' : c.pages ? '📖' : c.wallet ? '👛' : c.schedule ? '📅' : c.phone ? '📱' : '📦');
const edgeStyle = (side) => {
  const base = { position: 'absolute', zIndex: 15, pointerEvents: 'none', background: '#000a', color: '#ffd76b', fontWeight: 700, fontSize: 13, padding: '4px 9px', borderRadius: 8 };
  if (side === 'left') return { ...base, left: 6, top: '50%', transform: 'translateY(-50%)' };
  if (side === 'right') return { ...base, right: 6, top: '50%', transform: 'translateY(-50%)' };
  if (side === 'up') return { ...base, top: 44, left: '50%', transform: 'translateX(-50%)' };
  return { ...base, bottom: 40, left: '50%', transform: 'translateX(-50%)' };
};

function RoomModal({ item, evidence = [], onCollect, onClose }) {
  const room = item.room || {};
  const objectCodes = useMemo(() => (room.objects || []).map((o) => (typeof o === 'string' ? o : o.code)), [item.code]); // eslint-disable-line

  const [mode, setMode] = useState('ar');           // 'ar' | 'list'
  const [started, setStarted] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [useGyro, setUseGyro] = useState(false);
  const [phase, setPhase] = useState('scan');       // 'scan' | 'find'
  const [scanPct, setScanPct] = useState(0);
  const [doneMsg, setDoneMsg] = useState(false);
  const [view, setView] = useState({ yaw: 0, pitch: 0 });
  const [anchors, setAnchors] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [flash, setFlash] = useState(null);
  const [openClue, setOpenClue] = useState(null);
  const [bodyOpen, setBodyOpen] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const dragRef = useRef(null);
  const viewRef = useRef({ yaw: 0, pitch: 0 });
  const phaseRef = useRef('scan');
  const seenRef = useRef(new Set());
  const anchorsRef = useRef(null);
  const collectedRef = useRef(new Set());
  const pressRef = useRef(null);        // 탭 중인 마커 id(포커스 래치 → 탭 유실 방지)
  const gestureRef = useRef(null);      // { id, x0,y0, lx,ly, moved }
  const doneMsgRef = useRef(false);     // 완료 배너 표시 중(루프에서 확보 잠금)
  const doneTimerRef = useRef(null);    // 완료 배너 타이머(언마운트 정리)

  const collected = new Set(evidence.map((e) => e.code));
  collectedRef.current = collected;

  const applyView = (next) => { viewRef.current = next; setView(next); };
  const setPhaseBoth = (p) => { phaseRef.current = p; setPhase(p); };

  // 안정 핸들러(렌더마다 재생성 금지) → add/remove 참조 일치, 리스너 누수 방지
  const onOrient = useCallback((e) => {
    if (e.alpha == null) return;
    setUseGyro(true);
    const next = { yaw: e.alpha, pitch: (e.beta == null ? 90 : e.beta) - 90 };
    viewRef.current = next;
    setView(next);
  }, []);

  async function start() {
    setStarted(true);
    try {
      const DOE = window.DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === 'function') {
        const res = await DOE.requestPermission();
        if (res === 'granted') window.addEventListener('deviceorientation', onOrient);
      } else if (DOE) window.addEventListener('deviceorientation', onOrient);
    } catch { /* 자이로 없음 → 드래그 */ }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
      setCamOn(true);
    } catch { /* 카메라 없음 → 스타일 배경 */ }
  }

  function buildAnchors() {
    const seen = [...seenRef.current];
    const buckets = seen.length ? seen : Array.from({ length: SCAN_BUCKETS }, (_, i) => i);
    const bw = 360 / SCAN_BUCKETS;
    const out = objectCodes.map((code, i) => ({
      code,
      az: norm(buckets[i % buckets.length] * bw + bw / 2 + (Math.random() - 0.5) * bw * 0.6),
      el: -8 + Math.random() * 26,
    }));
    if (room.showBody) out.push({ isBody: true, az: norm((seen[0] ?? 0) * bw + bw / 2), el: -24 });
    return out;
  }

  // 스캔/탐색 루프(refs 기반 → 클로저 문제 없음)
  useEffect(() => {
    if (!started) return;
    const iv = setInterval(() => {
      const v = viewRef.current;
      if (phaseRef.current === 'scan') {
        const b = Math.floor((((v.yaw % 360) + 360) % 360) / (360 / SCAN_BUCKETS));
        seenRef.current.add(b);
        const pct = Math.min(1, seenRef.current.size / SCAN_NEEDED);
        setScanPct(pct);
        if (pct >= 1) {
          anchorsRef.current = buildAnchors();
          setAnchors(anchorsRef.current);
          setPhaseBoth('find');
          setDoneMsg(true);
          doneMsgRef.current = true;
          doneTimerRef.current = setTimeout(() => { setDoneMsg(false); doneMsgRef.current = false; }, 1900);
        }
        return;
      }
      // find: 화면 중앙(조준점)에 가장 가까운 미확보 마커를 포커스(🔍) — 탭하면 확보
      if (doneMsgRef.current) return;               // 완료 배너 동안엔 포커스/확보 비활성
      const list = anchorsRef.current;
      if (!list) return;
      if (pressRef.current) {                        // 탭 진행 중이면 그 마커에 포커스 고정(탭 유실 방지)
        setFocusId((prev) => (prev === pressRef.current ? prev : pressRef.current));
        return;
      }
      let best = null, bestAng = 1e9;
      for (const m of list) {
        if (!m.isBody && collectedRef.current.has(m.code)) continue;
        const dyaw = norm(m.az - v.yaw) * YAW_SIGN, dp = (m.el - v.pitch) * PITCH_SIGN;
        const ang = Math.hypot(dyaw, dp);
        if (ang < bestAng) { bestAng = ang; best = m; }
      }
      const id = best && bestAng <= FOCUS_TOL ? (best.isBody ? 'body' : best.code) : null;
      setFocusId((prev) => (prev === id ? prev : id));
    }, 90);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // 언마운트 정리
  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    window.removeEventListener('deviceorientation', onOrient);
  }, [onOrient]);

  useEffect(() => {
    const onKey = (e) => { if (e.key !== 'Escape') return; if (openClue) setOpenClue(null); else if (bodyOpen) setBodyOpen(false); else onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, openClue, bodyOpen]);

  const showClue = (code) => { const c = provider.getClue(code); if (c) setOpenClue(c); };
  const pick = (code) => {
    setBodyOpen(false);
    const c = provider.getClue(code);
    if (collected.has(code)) { setFlash({ ok: true, text: `이미 확보 · [${code}] ${c?.title || ''}` }); showClue(code); return; }
    const res = onCollect ? onCollect(code) : { success: false, message: '' };
    setFlash({ ok: !!res.success, text: res.message || (res.success ? '단서 확보!' : '확보 실패') });
    if (res.success) showClue(code);
  };
  const openMarker = (m) => { setFocusId(null); if (m.isBody) { setOpenClue(null); setBodyOpen(true); setFlash({ ok: true, text: '🛏 시신을 살펴봅니다' }); } else pick(m.code); };

  // 드래그(자이로 폴백)
  const onDown = (e) => { if (useGyro) return; dragRef.current = { x: e.clientX, y: e.clientY }; };
  const onMove = (e) => {
    if (!dragRef.current || useGyro) return;
    const dx = e.clientX - dragRef.current.x, dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    const v = viewRef.current;
    applyView({ yaw: norm(v.yaw - dx * 0.25), pitch: clamp(v.pitch + dy * 0.25, -70, 70) });
  };
  const onUp = () => { dragRef.current = null; };

  // 마커 제스처: 탭(이동 없음)=확보, 드래그(이동)=둘러보기 — 팬 데드존·오확보·탭 유실 방지
  const markerDown = (e, id) => {
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    pressRef.current = id;                 // 포커스 래치 시작(탭 중 다른 마커로 안 넘어감)
    gestureRef.current = { id, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, moved: false };
    setFocusId(id);
  };
  const markerMove = (e) => {
    const g = gestureRef.current;
    if (!g) return;
    if (Math.hypot(e.clientX - g.x0, e.clientY - g.y0) > 8) { g.moved = true; pressRef.current = null; } // 드래그 판정 → 래치 해제
    if (!useGyro) { const v = viewRef.current; applyView({ yaw: norm(v.yaw - (e.clientX - g.lx) * 0.25), pitch: clamp(v.pitch + (e.clientY - g.ly) * 0.25, -70, 70) }); }
    g.lx = e.clientX; g.ly = e.clientY;
  };
  const markerUp = (e, m) => {
    e.stopPropagation();
    const g = gestureRef.current;
    gestureRef.current = null; pressRef.current = null;
    if (g && !g.moved) openMarker(m);      // 이동 없이 뗐으면 탭 → 확보
  };
  const markerCancel = () => { gestureRef.current = null; pressRef.current = null; };

  const project = (m) => {
    const dyaw = norm(m.az - view.yaw) * YAW_SIGN, dp = (m.el - view.pitch) * PITCH_SIGN;
    return { inView: Math.abs(dyaw) <= HFOV / 2 + 10 && Math.abs(dp) <= VFOV / 2 + 10, x: 50 + (dyaw / (HFOV / 2)) * 50, y: 50 - (dp / (VFOV / 2)) * 50 };
  };

  // 화면 밖 미확보 방향 화살표(find 단계)
  const edge = { left: 0, right: 0, up: 0, down: 0 };
  if (phase === 'find' && anchors) {
    for (const m of anchors) {
      if (m.isBody || collected.has(m.code)) continue;
      const dyaw = norm(m.az - view.yaw) * YAW_SIGN, dp = (m.el - view.pitch) * PITCH_SIGN;
      const hOff = Math.abs(dyaw) > HFOV / 2, vOff = Math.abs(dp) > VFOV / 2;
      if (!hOff && !vOff) continue;
      if (hOff && (!vOff || Math.abs(dyaw) / HFOV >= Math.abs(dp) / VFOV)) edge[dyaw < 0 ? 'left' : 'right']++;
      else edge[dp > 0 ? 'up' : 'down']++;
    }
  }
  const remaining = anchors ? anchors.filter((m) => !m.isBody && !collected.has(m.code)).length : objectCodes.length;

  const bg = room.image ? `center/cover url(${room.image})` : 'radial-gradient(120% 90% at 50% 40%, #2a3040, #0c0f16)';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="room-modal" onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', width: 'min(96vw, 900px)', height: 'min(90vh, 640px)', background: '#0b0d12', borderRadius: 12, overflow: 'hidden', color: '#fff' }}>
        <button className="modal-close" onClick={onClose} aria-label="닫기" style={{ zIndex: 30 }}>✕</button>
        <div className="cctv-titlebar" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}>
          🔦 {room.label || item.title} · {mode === 'list' ? '물건 목록' : phase === 'scan' ? '방 스캔' : '단서 탐색'}
          <button type="button" onClick={() => setMode(mode === 'ar' ? 'list' : 'ar')}
            style={{ float: 'right', marginRight: 40, fontSize: 12, padding: '2px 10px', borderRadius: 6, cursor: 'pointer' }}>
            {mode === 'ar' ? '목록' : '둘러보기'}
          </button>
        </div>

        {mode === 'ar' ? (
          <div className="room-ar-stage" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
            style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: useGyro ? 'default' : 'grab', background: bg }}>
            <video ref={videoRef} muted playsInline autoPlay style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: camOn ? 'block' : 'none' }} />

            {/* 중앙 조준점 */}
            {started && !doneMsg && (
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 26, height: 26, border: '2px solid #ffffffcc', borderRadius: '50%', zIndex: 14, pointerEvents: 'none' }} />
            )}

            {/* find 단계 마커(조준→🔍→탭 확보). 완료 배너 동안은 숨김(조준점과 함께 등장) */}
            {phase === 'find' && !doneMsg && anchors && anchors.map((m) => {
              const p = project(m);
              if (!p.inView) return null;
              const id = m.isBody ? 'body' : m.code;
              const have = !m.isBody && collected.has(m.code);
              const focused = focusId === id;
              const tappable = focused && !have;
              return (
                <div key={id}
                  onPointerDown={tappable ? (e) => markerDown(e, id) : undefined}
                  onPointerMove={tappable ? markerMove : undefined}
                  onPointerUp={tappable ? (e) => markerUp(e, m) : undefined}
                  onPointerCancel={tappable ? markerCancel : undefined}
                  style={{ position: 'absolute', left: `${clamp(p.x, 4, 96)}%`, top: `${clamp(p.y, 10, 90)}%`, transform: 'translate(-50%,-50%)', pointerEvents: tappable ? 'auto' : 'none', cursor: tappable ? 'pointer' : 'default', touchAction: 'none', textAlign: 'center' }}>
                  <div style={{
                    width: 54, height: 54, margin: '0 auto', borderRadius: '50%',
                    border: `2px ${have ? 'solid' : 'dashed'} ${have ? '#3b6d11' : focused ? '#ffd76b' : '#ffffff88'}`,
                    background: have ? '#0a0' : focused ? '#1a1a1acc' : '#0006',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    boxShadow: focused ? '0 0 16px #ffd76bcc' : 'none',
                    transform: focused ? 'scale(1.12)' : 'none',
                  }}>
                    {have ? '✓' : m.isBody ? '🛏' : focused ? '🔍' : '❓'}
                  </div>
                  {(focused || have) && (
                    <div style={{ fontSize: 10, marginTop: 3, fontWeight: 700, background: tappable ? '#c9a84c' : '#000a', color: tappable ? '#1a1a1a' : '#fff', borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                      {have ? `✓ ${m.isBody ? '' : m.code}` : m.isBody ? '탭하여 살펴보기' : '탭하여 확보'}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 화면 밖 방향 화살표 */}
            {phase === 'find' && !doneMsg && (
              <>
                {edge.left > 0 && <div style={edgeStyle('left')}>◀ {edge.left}</div>}
                {edge.right > 0 && <div style={edgeStyle('right')}>{edge.right} ▶</div>}
                {edge.up > 0 && <div style={edgeStyle('up')}>▲ {edge.up}</div>}
                {edge.down > 0 && <div style={edgeStyle('down')}>▼ {edge.down}</div>}
              </>
            )}

            {/* 시작 오버레이 */}
            {!started && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#000a', textAlign: 'center', padding: 20, zIndex: 18 }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>📷 방 스캔 준비</div>
                <div style={{ fontSize: '0.85rem', color: '#c9c6bd', maxWidth: 360 }}>시작하면 카메라로 방을 <b>한 바퀴 천천히 둘러보며</b> 스캔합니다. (카메라·동작 센서 권한 필요 · 안 되면 화면 드래그로 진행)</div>
                <button type="button" onClick={start} style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', background: '#c9a84c', color: '#1a1a1a', border: 'none' }}>스캔 시작</button>
              </div>
            )}

            {/* 스캔 진행 오버레이 */}
            {started && phase === 'scan' && (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 16, pointerEvents: 'none', padding: '0 24px' }}>
                <div style={{ fontWeight: 700, background: '#000a', padding: '4px 12px', borderRadius: 8 }}>🔄 방을 천천히 한 바퀴 둘러보세요… {Math.round(scanPct * 100)}%</div>
                <div style={{ width: 'min(80%, 380px)', height: 8, background: '#0008', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${scanPct * 100}%`, height: '100%', background: '#c9a84c', transition: 'width .2s' }} />
                </div>
              </div>
            )}

            {/* 완료 안내 */}
            {doneMsg && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 22, pointerEvents: 'none' }}>
                <div style={{ background: '#0d1a0dcc', border: '1px solid #3b6d11', color: '#dfffd0', fontWeight: 700, padding: '14px 20px', borderRadius: 12, textAlign: 'center' }}>
                  ✅ 방 구성이 완료되었습니다<br /><span style={{ fontSize: 13, color: '#bfe6b0' }}>{objectCodes.length}곳 감지 · 카메라로 방을 살펴 단서를 찾으세요</span>
                </div>
              </div>
            )}

            {/* 상태바 */}
            {started && phase === 'find' && !doneMsg && (
              <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
                <span style={{ fontSize: 12, background: '#000a', padding: '3px 8px', borderRadius: 6 }}>
                  미확보 {remaining}개 {remaining > 0 ? '· 조준해 🔍가 뜨면 탭하세요' : '· 다 찾았어요'}
                </span>
                <span style={{ fontSize: 11, color: '#9c9a92', background: '#000a', padding: '3px 8px', borderRadius: 6 }}>{useGyro ? '자이로' : '드래그'}로 둘러보기</span>
              </div>
            )}
          </div>
        ) : (
          // 목록(폴백)
          <div style={{ position: 'absolute', inset: '40px 0 0', overflow: 'auto', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, alignContent: 'start' }}>
            {objectCodes.map((code) => {
              const c = provider.getClue(code); const have = collected.has(code);
              return (
                <button key={code} type="button" onClick={() => pick(code)} style={{ padding: 8, borderRadius: 8, cursor: 'pointer', textAlign: 'center', border: have ? '2px solid #3b6d11' : '1px solid #555', background: '#161a22', color: '#fff' }}>
                  {c?.image ? <img src={c.image} alt="" style={{ width: '100%', height: 64, objectFit: 'cover', borderRadius: 6, opacity: have ? 0.55 : 1 }} /> : <div style={{ fontSize: 30 }}>{emojiOf(c)}</div>}
                  <div style={{ fontSize: 11, marginTop: 4 }}>{have ? '✓' : '❓'} [{code}]</div>
                  <div style={{ fontSize: 11, color: '#c9c6bd' }}>{c?.title || ''}</div>
                </button>
              );
            })}
            {room.showBody && (
              <button type="button" onClick={() => { setOpenClue(null); setBodyOpen(true); }} style={{ padding: 8, borderRadius: 8, cursor: 'pointer', border: '2px solid #c06868', background: '#2a1414', color: '#f0d2d2', fontWeight: 700 }}>🛏 {room.body?.label || '시신'}</button>
            )}
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
