// ─────────────────────────────────────────────────────────────────────────────
// features/scene — 장면(방/현장) 뷰. 역전재판식 풀블리드, 하단 커맨드바 없음.
//   좌우로 밀어 방을 둘러보고, 테두리가 빛나는 물건을 눌러 조사하고, 인물을 눌러 심문으로.
//   수첩=우측 상단 · 나가기=대사창 우측 하단. 감식실은 '의뢰' 흐름.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { getClue } from '../content.js';
import { ROOM_HOTSPOTS, hitBoxFor, hotspotFor } from '../lib/game.js';
import { pendingQuestions } from '../lib/alerts.js';
import { usePinchZoom } from '../lib/pinch.js';
import { SceneBg, StandingFigure } from '../art.jsx';
import { DialogueBox, TopHud } from '../vn.jsx';

// 받침에 맞춘 조사(을/를 · 이/가) — 「최종현을(를)」처럼 둘 다 붙여 두면 어색했다(2026-09-30 시험)
const josa = (w, a, b) => { const c = (w || '').charCodeAt((w || '').length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? a : b; };
// 화면 밖에 남은 단서의 방향 표시 — 폰 세로에선 그림의 21%만 보여서, 안내가 없으면
//   나머지를 통째로 지나친다. solo.css 는 이 파일 소관이 아니라 인라인으로 둔다.
const DLG_COVER = 165; // 하단 대사창이 덮는 높이(px) — 그 아래는 보여도 못 누른다
const EDGE_BASE = {
  position: 'absolute', zIndex: 9, pointerEvents: 'none', whiteSpace: 'nowrap',
  background: '#000000b8', color: '#ffe9a8', border: '1px solid #ffffff22',
  borderRadius: 999, padding: '4px 10px', fontSize: '.72rem', fontWeight: 800,
};
const EDGE_POS = {
  left: { left: 6, top: '46%', transform: 'translateY(-50%)' },
  right: { right: 6, top: '46%', transform: 'translateY(-50%)' },
  up: { top: 88, left: '50%', transform: 'translateX(-50%)' },
  down: { bottom: DLG_COVER + 14, left: '50%', transform: 'translateX(-50%)' },
};
const EDGE_MARK = { left: '◀', right: '▶', up: '▲', down: '▼' };

// ── 장면(역전재판식 풀블리드: 조사/이야기 + 우측 상단 수첩) ────────────────────
export function SceneView({ location, collectedSet, roomSuspect, lab, stage = 1, state, phase = 1, onTalk, onOpen, onLockedToast, onOpenRecord, onBack }) {
  // 이 인물에게 아직 안 물어본 질문 수 — 있으면 대화 영역에 알림 배지
  const talkPending = roomSuspect ? pendingQuestions(roomSuspect.id, state || {}, phase) : 0;
  // 배경 그림의 실제 비율. 트랙을 이 비율로 잡아야 핫스팟 %좌표가 그림과 정확히 일치한다
  //   (16:9로 고정해두면 1376×768 같은 그림은 cover로 좌우가 잘려 좌표가 밀린다).
  const [bgRatio, setBgRatio] = useState(16 / 9);
  const camRef = useRef(null);
  const trackRef = useRef(null);
  // 지금 보고 있는 구간 — 남은 단서가 어느 쪽에 있는지 가장자리 화살표로 알리는 데 쓴다
  const [cam, setCam] = useState(null);
  const syncCam = () => {
    const c = camRef.current, tr = trackRef.current;
    // ox·oy — 그림이 화면보다 작아져 가운데 놓이면(축소) 그만큼 비켜 있다
    if (c && tr) setCam({ l: c.scrollLeft, t: c.scrollTop, w: c.clientWidth, h: c.clientHeight, tw: tr.offsetWidth, th: tr.offsetHeight, ox: tr.offsetLeft, oy: tr.offsetTop });
  };
  // 손가락 확대·축소 — 가장 작게 하면 방 전체가 화면 너비에 들어온다(방 전체 보기).
  //   폰에선 그림의 일부만 보여 단서가 어디 있는지 한눈에 안 들어온다는 말을 들었다.
  const zoom = usePinchZoom(camRef, trackRef, { ratio: bgRatio, resetKey: location?.id, onChange: syncCam });
  // 트랙(방 이미지)이 뷰포트보다 크면 가운데로 스크롤 시작 — 밀어서 둘러본다(모바일은 상하좌우 2D 팬)
  useEffect(() => {
    setBgRatio(16 / 9); // 방을 옮기면 새 그림의 onLoad 가 다시 정확한 비율을 준다
    const cam = camRef.current, tr = trackRef.current;
    if (cam && tr) {
      cam.scrollLeft = Math.max(0, (tr.offsetWidth - cam.clientWidth) / 2);
      cam.scrollTop = Math.max(0, (tr.offsetHeight - cam.clientHeight) / 2);
    }
  }, [location?.id]);
  useEffect(syncCam, [location?.id, bgRatio]); // 그림 비율이 도착하면 트랙 크기가 달라진다
  useEffect(syncCam, [zoom.z]);
  // 물건 목록 — 「방 전체 보기」는 그림이 작아져 테두리가 손톱만 하고 이름표가 겹쳤다(2026-10-12 8회차, 세 사람).
  //   못 챙긴 물건은 이름을 감춘 채(「아직 조사하지 않은 물건」) 줄로 세워, 눌러서 바로 조사한다.
  const [listOpen, setListOpen] = useState(false);
  // 인물 이름표 — 인물 그림이 화면 위쪽 단추 줄까지 올라오면 이름표를 대사창 바로 위(인물의 다리께)에 고정한다.
  //   머리 위에 두면 📓 단추(2차)나 「밀어서 둘러보기」 띠(3차)와 겹쳤다. 그림 비율이 늦게 잡히므로 몇 번 다시 잰다.
  const talkRef = useRef(null);
  const [tipFix, setTipFix] = useState(null);
  useEffect(() => {
    const check = () => {
      const el = talkRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top >= 76) {
        // 위로는 안 걸려도 옆으로 잘리면(지안방 — 인물이 오른쪽 끝, 16회차) 그 모서리에 붙인다
        const tip = el.querySelector('.s-talkzone-tip');
        const tr = tip?.getBoundingClientRect();
        const cur = tip?.style.position === 'fixed';
        if (tr && !cur && (tr.right > window.innerWidth - 4 || tr.left < 4)) {
          const side = tr.right > window.innerWidth - 4 ? 'r' : 'l';
          setTipFix((o) => (o && o.side === side && o.y === Math.round(tr.top) ? o : { side, y: Math.round(tr.top) }));
        } else if (!cur) setTipFix(null);
        return;
      }
      const dlg = document.querySelector('.aa-dialogue');
      const dlgTop = dlg ? dlg.getBoundingClientRect().top : window.innerHeight - 160;
      // 가운데 맞추면 긴 이름이 화면 밖으로 나갔다 — 인물이 선 쪽 모서리에 붙인다
      const side = r.left + r.width / 2 > window.innerWidth / 2 ? 'r' : 'l';
      // 대사창 위의 「방 이름」 칩(약 30px)까지 비켜 선다
      const y = dlgTop - 72;
      setTipFix((o) => (o && o.side === side && o.y === y ? o : { side, y }));
    };
    const ids = [0, 300, 1000, 2500].map((ms) => setTimeout(check, ms));
    window.addEventListener('resize', check);
    return () => { ids.forEach(clearTimeout); window.removeEventListener('resize', check); };
  }, [location?.id]);
  useEffect(() => { setListOpen(false); }, [location?.id]);
  const listRef = useRef(null);
  const [listMore, setListMore] = useState(false);
  const syncList = (el) => setListMore(!!el && el.scrollHeight - el.scrollTop - el.clientHeight > 12);
  useEffect(() => { if (listOpen) syncList(listRef.current); });
  if (!location) return null;
  const isLab = location.kind === 'lab'; // 감식 의뢰실 — 감식원에게 대화형으로 의뢰
  const pannable = !isLab;
  // 이 방에서 지금 보이는 단서와, 그중 아직 못 챙긴 것의 방향(화면 밖이면 화살표로 안내)
  const shown = isLab ? [] : location.objects.filter((code) => {
    const c = getClue(code);
    return c && !(c.phone && stage < 3);
  });
  const missing = shown.filter((code) => !collectedSet.has(code));
  // 진척 수 — 이야기와 이어지지 않는 빈 물건(옷가지·파우치·장갑)은 세지 않는다(16회차, 결정 마)
  const countable = shown.filter((code) => !getClue(code)?.flavor);
  const countGot = countable.filter((code) => collectedSet.has(code)).length;
  const dirs = { left: 0, right: 0, up: 0, down: 0 };
  if (cam?.tw) for (const code of missing) {
    const p = hotspotFor(location, code, location.objects.indexOf(code));
    const x = (cam.ox || 0) + p.x / 100 * cam.tw, y = (cam.oy || 0) + p.y / 100 * cam.th;
    if (x < cam.l) dirs.left++; else if (x > cam.l + cam.w) dirs.right++;
    if (y < cam.t) dirs.up++; else if (y > cam.t + cam.h - DLG_COVER) dirs.down++;
  }
  const offscreen = dirs.left + dirs.right + dirs.up + dirs.down;
  const pickCode = (code) => {
    const c = getClue(code); if (!c) return;
    const have = collectedSet.has(code);
    const isGamsik = c.type === '감식';
    const req = isGamsik && lab ? lab.requested(code) : false;
    if (isGamsik && !have) {
      // 감식은 '의뢰 → 2차 심문 때 결과' 흐름 (2차 개방 후엔 즉시 결과)
      if (!lab || !lab.ready(code)) { onLockedToast('🧪 채취물이 부족합니다 — 관련 실물 단서를 먼저 확보하세요'); return; }
      if (lab.stage >= 3) { onOpen(code); return; }
      if (req) { onLockedToast('🔬 분석 중입니다 — 2차 심문이 열리면 결과가 도착합니다'); return; }
      lab.request(code); return;
    }
    onOpen(code);
  };
  const bodyPos = ROOM_HOTSPOTS[location.id]?.['__body__'] || { x: 50, y: 46, s: 1.1 };
  const talkPos = ROOM_HOTSPOTS[location.id]?.['__talk__']; // 있으면 인물이 배경에 그려짐 → 터치존, 없으면 떠 있는 스탠딩
  return (
    <div className="aa-fs">
      {/* 그림을 줄이면 위아래가 빈다 — 같은 그림을 흐리게 깔아 검은 띠 대신 방 분위기로 채운다 */}
      {pannable && <div className="aa-backdrop" aria-hidden="true"><SceneBg location={location} fit="cover" /></div>}
      <div className={`aa-cam${zoom.atMin ? ' overview' : ''}`} ref={camRef} onScroll={syncCam}>
        <div className="aa-track" ref={trackRef} style={{ aspectRatio: String(bgRatio) }}>
          <SceneBg location={location} onRatio={setBgRatio} />

      {location.showBody && (
        <div className="s-zone-wrap" style={{ left: `${bodyPos.x}%`, top: `${bodyPos.y}%`, '--s': bodyPos.s }}>
          <button className="s-zone body" onClick={() => onOpen('__body__')} aria-label="시신 조사" />
          <svg className="s-zone-outline body" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <rect x="2" y="2" width="96" height="96" rx="6" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="s-zone-lab">시신</span>
        </div>
      )}
      {!isLab && location.objects.map((code, i) => {
        const c = getClue(code); if (!c) return null;
        if (c.phone && stage < 3) return null;   // 휴대폰은 2차 심문(stage 3)에 해금 — 그 전엔 방에 안 보임
        const have = collectedSet.has(code);
        const p = hotspotFor(location, code, i);
        const isGamsik = c.type === '감식';
        const req = isGamsik && lab ? lab.requested(code) : false;
        const zoneLab = have ? c.title
          : isGamsik && lab ? (req ? '🔬 분석 중…' : lab.ready(code) ? '🔬 감식 의뢰' : '채취물 필요')
          : '조사';
        // 핫스팟: w/h가 있으면 물건 크기에 맞춘 상자, poly가 있으면 실루엣 모양.
        //   poly는 버튼 자체를 clip-path로 잘라 '실루엣 안에서만' 클릭되게 한다 →
        //   물건이 서로 붙어 있어도 클릭·표시 영역이 겹치지 않는다.
        //   (이름표는 잘리면 안 되므로 래퍼의 형제로 두고 버튼 hover에 반응시킨다)
        const boxed = p.w != null;
        // 손가락 하한(44px) — 테두리(실루엣)는 그대로 두고 버튼만 바깥으로 넓힌다.
        //   작은 물건은 clip 을 벗겨야 한다: 클립이 판정을 실루엣 안으로 더 깎기 때문.
        //   넓히는 폭은 네 방향이 다르다 — 이웃이 막은 쪽은 접고 반대쪽으로 몰아주기 때문(lib/game).
        const hit = hitBoxFor(location, code);
        const clip = p.poly && hit.clip ? `polygon(${p.poly.map((pt) => `${pt[0]}% ${pt[1]}%`).join(', ')})` : undefined;
        const btnStyle = {
          ...(clip ? { clipPath: clip, WebkitClipPath: clip } : null),
          ...(hit.l || hit.r || hit.t || hit.b
            ? { inset: `${-hit.t / p.h * 100}% ${-hit.r / p.w * 100}% ${-hit.b / p.h * 100}% ${-hit.l / p.w * 100}%` }
            : null),
        };
        const wrapStyle = {
          left: `${p.x}%`, top: `${p.y}%`,
          ...(boxed ? { width: `${p.w}%`, height: `${p.h}%` } : { '--s': p.s }),
          // 몸의 상처(손등·손목)는 인물 터치존(z10) 위에 얹는다 — 그래야 그 부위를 직접 누른다
          ...(p.onPerson ? { zIndex: 11 } : null),
        };
        const onPick = () => pickCode(code);
        const tone = have ? ' have' : req ? ' req' : '';
        return (
          <div key={code} className={`s-zone-wrap${boxed ? ' boxed' : ''}`} style={wrapStyle} data-code={code}>
            {/* 클릭 판정 전용(투명). poly면 실루엣 안에서만 눌린다 */}
            <button className={`s-zone${boxed ? ' boxed' : ''}${p.poly ? ' poly' : ''}${tone}`}
              style={btnStyle}
              aria-label={zoneLab} onClick={onPick} />
            {/* 표시 전용 — 면은 비우고 '테두리만' 빛낸다(버튼 밖이라 발광이 잘리지 않음) */}
            {/* 선을 두 겹으로 — 아래 어두운 굵은 선, 위 밝은 선. 밝은 책상·흰 종이 위에서 밝은 선 하나는 사라졌다(튜토리얼 3차 시험 셋) */}
            <svg className={`s-zone-outline${tone}${c.flavor && !have ? ' flavor' : ''}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {p.poly
                ? <><polygon className="under" points={p.poly.map((pt) => `${pt[0]},${pt[1]}`).join(' ')} vectorEffect="non-scaling-stroke" />
                    <polygon points={p.poly.map((pt) => `${pt[0]},${pt[1]}`).join(' ')} vectorEffect="non-scaling-stroke" /></>
                : <><rect className="under" x="2" y="2" width="96" height="96" rx="6" vectorEffect="non-scaling-stroke" />
                    <rect x="2" y="2" width="96" height="96" rx="6" vectorEffect="non-scaling-stroke" /></>}
            </svg>
            {have && <span className="s-zone-check">✓</span>}
            {/* 새로 할 수 있게 된 것에만 알림 — 감식 의뢰 가능, 2차에 열린 휴대폰.
                안 챙긴 일반 단서까지 붙이면 방마다 느낌표 범벅이라 테두리로 충분하다. */}
            {!have && ((isGamsik && lab?.ready(code) && !req) || (c.phone && stage >= 3)) && (
              <span className="s-alert" title={isGamsik ? '감식 의뢰할 수 있다' : '휴대폰을 볼 수 있게 됐다'}>!</span>
            )}
            {/* 그림에 그 물건이 안 그려진 자리(침대 위 성경책)는 이름표를 늘 보인다 — 빈 육각형만 보고 무엇인지 몰랐다 */}
            <span className={`s-zone-lab${p.label ? ' always' : ''}`}>{!have && typeof p.label === 'string' ? p.label : zoneLab}</span>
          </div>
        );
      })}

      {/* 인물 터치존은 반드시 .aa-track(그림) 안에 둔다 —
          밖에 두면 %좌표가 '그림'이 아니라 '화면' 기준이 되어 창 크기에 따라 인물에서 어긋난다. */}
      {roomSuspect && onTalk && talkPos && (
        <button className="s-talkzone" ref={talkRef}
          style={{ left: `${talkPos.x}%`, top: `${talkPos.y}%`, ...(talkPos.w ? { width: `${talkPos.w}%`, height: `${talkPos.h}%` } : null) }}
          onClick={() => onTalk(roomSuspect.id)} aria-label={`${roomSuspect.name}과 이야기한다`}>
          {/* 인물은 테두리를 그리지 않는다 — 발밑 빛 + '이야기를 한다' 칩만으로 안내.
              (그림 속 인물 위에 선을 얹으면 오히려 지저분해 보임) */}
          <span className="s-talkzone-glow" />
          {/* 이름표를 모서리에 붙일 땐 ❗ 를 이름표 안에 넣는다(따로 띄우면 배지가 화면 폭으로 늘어났다) */}
          {talkPending > 0 && !tipFix && <span className="s-alert" title={`물어볼 것 ${talkPending}`}>!</span>}
          <span className="s-talkzone-tip" style={tipFix ? { position: 'fixed', left: 'auto', [tipFix.side === 'r' ? 'right' : 'left']: 10, top: tipFix.y, transform: 'none', zIndex: 12 } : undefined}>{tipFix && talkPending > 0 ? '❗' : '💬'} {roomSuspect.name} — 이야기를 한다{talkPending > 0 ? ` (${talkPending})` : ''}</span>
        </button>
      )}
        </div>
      </div>

      {/* 방 안에서도 '몇 개 남았는지'가 보여야 한다 — 문패에만 있으면 방에 들어온 뒤엔 알 길이 없다 */}
      <div className="aa-loc-chip">🔦 {location.label}{countable.length > 1 && ` · 단서 ${countGot}/${countable.length}`}</div>
      <TopHud>
        <button className="hall-hud-btn" title="수첩(사건 기록)" onClick={onOpenRecord}>📓</button>
      </TopHud>
      {/* 화면 밖에 남은 단서 방향 — 폰에선 그림의 21%만 보이므로 이게 없으면 그냥 지나친다 */}
      {Object.entries(dirs).map(([d, n]) => n > 0 && (
        <div key={d} style={{ ...EDGE_BASE, ...EDGE_POS[d] }}>{EDGE_MARK[d]} 단서 {n}</div>
      ))}
      {/* 아직 못 찾은 단서가 화면 밖에 있는 동안엔 스와이프 안내를 계속 되풀이한다 */}
      {/* 그림이 화면보다 클 때만 — 이미 다 보이는 넓은 화면에서는 띄우지 않는다 */}
      {pannable && (zoom.canZoomOut || !zoom.atMin) && (
        <button className="view-toggle scene" onClick={zoom.toggle}>
          {zoom.atMin ? '🔍 크게 보기' : '🗺 방 전체 보기'}
        </button>
      )}
      {pannable && !zoom.atMin && <div className="aa-swipe-hint" style={{ animationIterationCount: offscreen > 0 ? 'infinite' : 1 }}>← 밀어서 방을 둘러보기 →</div>}

      {roomSuspect && onTalk && !talkPos && (
        <button className="s-figure" onClick={() => onTalk(roomSuspect.id)} aria-label={`${roomSuspect.name}과 이야기한다`}>
          <span className="s-figure-tip">💬 이야기를 한다</span>
          <StandingFigure sid={roomSuspect.id} person={roomSuspect.name} image={roomSuspect.image} height={240} fallbackSize={110} />
          <span className="s-figure-lab">{roomSuspect.name}</span>
        </button>
      )}

      {listOpen && !isLab && (
        <div className="aa-ask s-room-list" ref={listRef} onScroll={(e) => syncList(e.currentTarget)}>
          <div className="aa-ask-h">📋 {location.label} — 단서 {countGot}/{countable.length}</div>
          {location.showBody && <button onClick={() => { setListOpen(false); onOpen('__body__'); }}>🔎 시신을 조사한다</button>}
          {roomSuspect && onTalk && (
            <button className={talkPending > 0 ? 'new' : ''} onClick={() => { setListOpen(false); onTalk(roomSuspect.id); }}>
              {talkPending > 0 ? '❗ ' : '💬 '}{roomSuspect.name} — 이야기를 한다{talkPending > 0 ? ` (${talkPending})` : ''}
            </button>
          )}
          {/* 아직 조사하지 않은 것을 위로 — 목사님 방 목록 맨 아래 넷을 못 보고 「다 했다」고 여겼다(12회차) */}
          {[...shown].sort((a, b) => (collectedSet.has(a) ? 1 : 0) - (collectedSet.has(b) ? 1 : 0)).map((code) => {
            const c = getClue(code);
            const have = collectedSet.has(code);
            const isGamsik = c?.type === '감식';
            const req = isGamsik && lab ? lab.requested(code) : false;
            const label = have ? `✓ ${c.title}`
              : isGamsik ? (req ? '🔬 분석 중…' : lab?.ready(code) ? '🔬 감식 의뢰할 수 있는 것' : '🧪 채취물이 더 필요한 것')
              : '🔍 아직 조사하지 않은 물건';
            return (
              <button key={code} className={have ? 'done' : 'new'} onClick={() => { if (!isGamsik || have) setListOpen(false); pickCode(code); }}>{label}</button>
            );
          })}
        </div>
      )}

      {listOpen && !isLab && listMore && <div className="aa-ask-more" aria-hidden="true">▼ 아래에 더 있어요 — 목록을 밀어 보세요</div>}

      {isLab && (
        <div className="aa-ask">
          <div className="aa-ask-h">🧑‍🔬 감식원 — 어떤 걸 분석해 드릴까요?</div>
          {location.objects.map((code) => {
            const c = getClue(code); if (!c) return null;
            const have = collectedSet.has(code);
            const req = lab?.requested(code);
            const ready = lab?.ready(code);
            const cls = have ? 'done' : (ready && !req) ? 'new' : req ? 'asked' : '';
            const label = have ? `✅ ${c.title} — 결과 보기`
              : req ? `🔬 ${c.title} — 분석 중…`
              : ready ? `🔬 ${c.title} — 감식 의뢰`
              : `🔒 ${c.title} — 채취물 필요`;
            return (
              <button key={code} className={cls} onClick={() => {
                if (have) { onOpen(code); return; }
                if (!ready) { onLockedToast('🧪 채취물이 부족합니다 — 관련 실물 단서를 먼저 확보하세요'); return; }
                if (lab.stage >= 3) { onOpen(code); return; }
                if (req) { onLockedToast('🔬 분석 중입니다 — 2차 심문이 열리면 결과가 도착합니다'); return; }
                lab.request(code);
              }}>{ready && !req && !have ? '❗ ' : ''}{label}</button>
            );
          })}
        </div>
      )}

      {/* 하단 바 없음 — 나가기는 대사창 우측 하단에. 조사는 상시(테두리가 빛나는 물건을 누르면 된다) */}
      <DialogueBox location={isLab ? '감식 의뢰실' : location.label}
        actions={[
          roomSuspect && onTalk && { label: `💬 ${roomSuspect.name}${talkPending > 0 ? ` (${talkPending})` : ''}`, onClick: () => onTalk(roomSuspect.id) },
          !isLab && shown.length > 0 && { label: listOpen ? '✕ 목록 닫기' : `📋 물건 목록 ${countGot}/${countable.length}`, onClick: () => setListOpen((v) => !v) },
          { label: '🚶 나가기', onClick: onBack },
        ]}
        text={isLab
          ? (stage >= 3 ? '감식원이 결과를 기다린다. 분석할 단서를 고르자 — 채취물을 확보한 것만 의뢰할 수 있고, 지금은 맡기면 곧바로 결과가 나온다.' : '감식원이 결과를 기다린다. 분석할 단서를 고르자 — 채취물을 확보한 것만 의뢰할 수 있고, 결과는 2차 심문이 열릴 때 도착한다.')
          : ('테두리가 빛나는 물건을 누르면 조사할 수 있다.' + (roomSuspect ? ` ${roomSuspect.name}${josa(roomSuspect.name, '을', '를')} 누르면 이야기할 수 있다.` : ''))} />
    </div>
  );
}
