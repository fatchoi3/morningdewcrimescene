import { useEffect, useRef, useState } from 'react';
import { evidenceMap } from '../data/gameData.js';

/**
 * CctvModal
 * 공용 CCTV 단서. 2층 평면도(위에서 내려다본 화면)에 시간대별 인물 동선을 보여준다.
 *
 * 2단 계층:
 *   ① 상위 — 시간대 칩(10/12/13/14시대)
 *   ② 칩 선택 시 — 평면도 + 그 시간대의 분단위 ❓ 칩(10:05 …)
 * 분 칩 선택 시 해당 컷의 장면 + 동선 화살표(arrow.from→to) + 인물 ❓ 마커 표시.
 * 인물 ❓를 누르면 단서를 확보하고, CCTV 창을 닫지 않고 그 자리에서 단서 상세를 펼쳐 본다.
 *
 * cctv.timeline[].people[] = { look, who, unlocks, x, y, arrow:{from:{x,y}, to:{x,y}} }
 */

/**
 * routeArrow — 직선 대신 복도를 따라가는 꺾인 경로(맨해튼 경로)를 만든다.
 * 평면도: 가로 복도 중심선 y≈141, 오른쪽 세로 통로(목사방·1층) 중심선 x≈360.
 * 방/통로 끝점을 복도 중심선까지 끌어낸 뒤 복도를 따라 잇는다 → 벽·방을 뚫지 않음.
 */
function routeArrow(from, to) {
  const Y = 141;   // 가로 복도 중심선
  const SX = 360;  // 세로 통로(목사방·1층) 중심선
  const lead = (p) => (p.x >= 334
    ? [{ x: p.x, y: p.y }, { x: SX, y: p.y }, { x: SX, y: Y }]   // 통로/목사방/1층 → 세로통로 → 복도
    : [{ x: p.x, y: p.y }, { x: p.x, y: Y }]);                    // 방/복도 → 복도 중심선
  const pts = [...lead(from), ...lead(to).reverse()];
  return pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y);
}

/* 경로 점들 → SVG path d 문자열 */
const toPathD = (pts) => pts.map((pt, j) => `${j ? 'L' : 'M'}${pt.x} ${pt.y}`).join(' ');
/* 폴리라인 총 길이 */
const polyLen = (pts) => pts.reduce((s, pt, j) => (j ? s + Math.hypot(pt.x - pts[j - 1].x, pt.y - pts[j - 1].y) : 0), 0);

/* 동선 점들 — meet(만남점)이 있으면 from→meet→to로 잇는다 */
function routePoints(arrow, meet) {
  if (!meet) return routeArrow(arrow.from, arrow.to);
  const a = routeArrow(arrow.from, meet);
  const b = routeArrow(meet, arrow.to);
  return a.concat(b.slice(1));
}

/**
 * 마커 모션(path d + keyPoints/keyTimes/dur) 계산.
 *  - meet 있음(동반 컷): 컷 전체가 같은 dur(5s)로 움직여 동시 출발·만남점 동시 통과를 보장.
 *      만남점은 동선 길이 비율(frac) 위치에 오며 항상 t=0.5에 통과한다.
 *  - round(양방향): 끝점에서 동선을 따라 시작점으로 되돌아온다(왕복).
 *  - 단방향: 끝점 도착 후 다음 루프에서 시작점으로 즉시 점프(뿅 — 되짚어 오지 않음).
 */
function markerMotion(arrow, meet) {
  const SPEED = 60, END_DWELL = 1;
  if (meet) {
    const a = routeArrow(arrow.from, meet);
    const b = routeArrow(meet, arrow.to);
    const frac = Math.round((polyLen(a) / ((polyLen(a) + polyLen(b)) || 1)) * 1000) / 1000;
    return { d: toPathD(a.concat(b.slice(1))), dur: 5, keyPoints: `0;${frac};1;1`, keyTimes: '0;0.5;0.9;1' };
  }
  const pts = routeArrow(arrow.from, arrow.to);
  const d = toPathD(pts);
  const move = polyLen(pts) / SPEED;
  if (arrow.round) {
    const total = 2 * move + END_DWELL;
    const t1 = Math.round((move / total) * 1000) / 1000;
    const t2 = Math.round(((move + END_DWELL) / total) * 1000) / 1000;
    return { d, dur: Math.min(12, Math.max(3, Math.round(total * 10) / 10)), keyPoints: '0;1;1;0', keyTimes: `0;${t1};${t2};1` };
  }
  const total = move + END_DWELL;
  const t1 = Math.round((move / total) * 1000) / 1000;
  return { d, dur: Math.min(9, Math.max(3, Math.round(total * 10) / 10)), keyPoints: '0;1;1', keyTimes: `0;${t1};1` };
}

/**
 * CCTV 사각(목사방) 가시성.
 * 카메라 시야 콘은 가로 복도(y≈141)뿐 — 우측 세로 통로 위쪽 끝(목사방)은 잡히지 않는다.
 *  · 복도/방문 앞(x ≤ VICTIM_X) → 항상 보임
 *  · 세로 통로라도 복도 합류부(y ≥ VIS_Y) → 보임 (※ 1층 방향 동선은 그대로 포착)
 *  · 목사방 쪽(위)으로 올라갈수록 → 스르르 사라짐, 내려오면 스르륵 다시 보임
 */
const VICTIM_X = 334;   // 세로 통로(목사방·1층) 시작 x
const VIS_Y = 124;      // 복도 상단(시야 콘 끝) — 이보다 아래는 보임
const HID_Y = 92;       // 목사방 입구 — 이보다 위는 완전히 사각
function opacityAt(x, y) {
  if (x <= VICTIM_X) return 1;          // 카메라 시야(복도·방문 앞)
  if (y >= VIS_Y) return 1;             // 통로 합류부 — 1층 방향 포함 보임
  if (y <= HID_Y) return 0;             // 목사방 안쪽 — 사각
  return Math.round(((y - HID_Y) / (VIS_Y - HID_Y)) * 100) / 100;  // 진입로 — 스르르
}

/**
 * blindFade — 마커가 동선을 따라 움직이는 동안의 opacity 애니메이션(values/keyTimes)을 만든다.
 * markerMotion과 같은 시간축(dur·keyTimes·keyPoints)을 공유하도록, 시간 tau를 촘촘히 샘플링해
 * 그 순간의 경로 위치(x,y)를 구하고 opacityAt으로 투명도를 매긴다(왕복·만남점 모두 자연 대응).
 */
function blindFade(pts, m) {
  const kp = m.keyPoints.split(';').map(Number);
  const kt = m.keyTimes.split(';').map(Number);
  let total = 0; const cum = [0];
  for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); cum.push(total); }
  const frac = cum.map((d) => (total ? d / total : 0));
  const posAt = (f) => {
    if (f <= 0) return pts[0];
    if (f >= 1) return pts[pts.length - 1];
    for (let i = 1; i < pts.length; i++) {
      if (f <= frac[i]) {
        const t = (f - frac[i - 1]) / ((frac[i] - frac[i - 1]) || 1);
        return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t };
      }
    }
    return pts[pts.length - 1];
  };
  const tToFrac = (tau) => {
    if (tau <= kt[0]) return kp[0];
    for (let i = 1; i < kt.length; i++) {
      if (tau <= kt[i]) {
        const t = (tau - kt[i - 1]) / ((kt[i] - kt[i - 1]) || 1);
        return kp[i - 1] + (kp[i] - kp[i - 1]) * t;
      }
    }
    return kp[kp.length - 1];
  };
  const N = 36;
  const values = []; const times = [];
  for (let s = 0; s <= N; s++) {
    const tau = s / N;
    const pos = posAt(tToFrac(tau));
    values.push(opacityAt(pos.x, pos.y));
    times.push(Math.round(tau * 1000) / 1000);
  }
  return { values: values.join(';'), keyTimes: times.join(';') };
}

/* 2층 평면도(고정 구조) + 현재 컷 인물 마커 + 동선 화살표 */
function FloorPlan({ people, collected, onPick, meet, cutKey, svgRef }) {
  return (
    <svg ref={svgRef} className="cctv-map" viewBox="0 0 400 280" role="img" aria-label="2층 평면도">
      <defs>
        <pattern id="cctvWall" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="7" height="7" fill="#161b24" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="#3a4656" strokeWidth="2.5" />
        </pattern>
        <marker id="cctvArrowHead" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto-start-reverse">
          <path d="M0,0 L7,3 L0,6 Z" fill="#ffd24a" />
        </marker>
        {/* 동선 페이드 마스크 — 목사방 진입로(우측 세로통로 위쪽)로 갈수록 점선이 흐려진다.
            복도·1층 방향(y ≥ 124)은 그대로 선명, 목사방 안쪽(y ≤ 92)은 사라져 진입 여부를 숨긴다. */}
        <linearGradient id="cctvFadeGrad" x1="0" y1="92" x2="0" y2="124" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask id="cctvFade" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="280">
          <rect x="0" y="0" width="400" height="280" fill="#fff" />
          <rect x="334" y="0" width="66" height="280" fill="url(#cctvFadeGrad)" />
        </mask>
      </defs>

      {/* CCTV 시야 콘 */}
      <polygon points="47,141 334,124 334,158" fill="rgba(165,110,200,0.16)" stroke="rgba(180,130,210,0.55)" strokeWidth="1" />

      {/* 윗줄 방 */}
      <g className="cctv-room">
        <rect x="55" y="45" width="95" height="70" rx="3" />
        <rect x="150" y="45" width="95" height="70" rx="3" />
        <rect x="245" y="45" width="90" height="70" rx="3" />
      </g>
      {/* 목사님 방 (우상단) */}
      <rect className="cctv-room cctv-room--victim" x="334" y="12" width="52" height="80" rx="3" />
      <rect x="343" y="86" width="30" height="9" rx="2" fill="#3aa0e6" />

      {/* 아랫줄 방 */}
      <g className="cctv-room">
        <rect x="55" y="172" width="95" height="73" rx="3" />
        <rect x="150" y="172" width="95" height="73" rx="3" />
        <rect x="245" y="172" width="90" height="73" rx="3" />
      </g>

      {/* 복도 */}
      <rect className="cctv-hall" x="55" y="122" width="279" height="38" />
      <rect className="cctv-hall" x="334" y="92" width="52" height="166" />
      <text x="360" y="196" className="cctv-map-note">1층 가는 길</text>
      <path d="M360 204 l0 30 m-7 -9 l7 9 l7 -9" stroke="#8a98aa" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* 벽 */}
      <rect className="cctv-wall" x="18" y="119" width="13" height="44" rx="1" />
      <text x="24" y="112" className="cctv-wall-label">벽</text>
      <rect className="cctv-wall" x="386" y="12" width="12" height="246" rx="1" />
      <text x="392" y="58" className="cctv-wall-label" transform="rotate(90 392 58)">벽</text>
      <text x="392" y="180" className="cctv-wall-label" transform="rotate(90 392 180)">벽</text>

      {/* 방문 */}
      <g className="cctv-door">
        <rect x="88" y="118" width="30" height="7" /><rect x="183" y="118" width="30" height="7" /><rect x="276" y="118" width="30" height="7" />
        <rect x="88" y="157" width="30" height="7" /><rect x="183" y="157" width="30" height="7" /><rect x="276" y="157" width="30" height="7" />
      </g>

      {/* 방 이름 */}
      <g className="cctv-room-label">
        <text x="102" y="84">이사랑</text><text x="197" y="84">이현지</text><text x="290" y="84">박희원</text>
        <text x="360" y="55">목사님</text>
        <text x="102" y="212">최종현</text><text x="197" y="212">이가현</text><text x="290" y="212">윤은재</text>
      </g>

      {/* CCTV 카메라 */}
      <circle cx="47" cy="141" r="10" fill="#11151c" stroke="#e6e9ef" strokeWidth="2" />
      <circle cx="47" cy="141" r="3.5" fill="#e6e9ef" />
      <text x="47" y="166" className="cctv-map-cam">CCTV</text>

      {/* 동선 화살표 (현재 컷) — 복도를 따라 꺾인 경로. meet면 만남점 경유, round면 양끝 표시.
          목사방에 가까워질수록 점선이 그라데이션으로 흐려져, 방에 들어갔는지 알 수 없다. */}
      <g mask="url(#cctvFade)">
        {people.map((p, i) => p.arrow && (
          <polyline
            key={`a${i}`}
            points={routePoints(p.arrow, meet).map((pt) => `${pt.x},${pt.y}`).join(' ')}
            fill="none" stroke="#ffd24a" strokeWidth="2.5" strokeDasharray="6 4"
            strokeLinejoin="round" strokeLinecap="round"
            markerEnd="url(#cctvArrowHead)" opacity="0.9"
            {...(p.arrow.round ? { markerStart: 'url(#cctvArrowHead)' } : {})}
          />
        ))}
      </g>

      {/* 인물 마커 (현재 컷) — arrow가 있으면 동선 경로를 따라 이동.
          컷이 바뀌면 key(cutKey)가 달라져 remount → 애니메이션이 동선 시작점부터 다시 시작. */}
      {people.map((p, i) => {
        const isScene = !p.unlocks;           // unlocks 없는 인물(목사 동반 등장)은 클릭/수집 불가
        const got = !isScene && collected.has(p.unlocks);
        const cls = `cctv-marker ${got ? 'got' : ''} ${isScene ? 'cctv-marker--scene' : ''}`.trim();
        const inner = (
          <>
            {!got && !isScene && <circle className="cctv-marker-ping" r="13" />}
            {!isScene && <circle className="cctv-marker-hit" r="17" fill="transparent" />}
            <circle r={isScene ? 8 : 9} className="cctv-marker-dot" />
            {!isScene && <text className="cctv-marker-glyph" y="4">{got ? '✓' : '?'}</text>}
            <text className="cctv-marker-label" y={isScene ? 23 : 24}>{isScene ? p.who : (got ? p.who : '인물')}</text>
          </>
        );
        const clickProps = isScene ? { 'aria-hidden': 'true' } : { onClick: () => onPick(p), role: 'button' };
        if (p.arrow) {
          const m = markerMotion(p.arrow, meet);
          const fade = blindFade(routePoints(p.arrow, meet), m);
          return (
            <g key={`${cutKey}-${i}`} className={cls} {...clickProps}>
              <animateMotion
                dur={`${m.dur}s`} repeatCount="indefinite" calcMode="linear"
                keyPoints={m.keyPoints} keyTimes={m.keyTimes} path={m.d}
              />
              {/* 목사방 쪽으로 가면 스르르 사라지고, 복도로 돌아오면 다시 보임 (동선과 같은 시간축) */}
              <animate
                attributeName="opacity" dur={`${m.dur}s`} repeatCount="indefinite" calcMode="linear"
                keyTimes={fade.keyTimes} values={fade.values}
              />
              {inner}
            </g>
          );
        }
        return (
          <g key={`${cutKey}-${i}`} className={cls} transform={`translate(${p.x}, ${p.y})`} opacity={opacityAt(p.x, p.y)} {...clickProps}>
            {inner}
          </g>
        );
      })}
    </svg>
  );
}

const decadeOf = (time) => (time || '').slice(0, 2);

function CctvModal({ item, evidence = [], onCollect, onClose }) {
  const timeline = item.cctv?.timeline || [];
  const decades = [...new Set(timeline.map((t) => decadeOf(t.time)))];

  const [decade, setDecade] = useState(decades[0]);
  const cutsInDecade = timeline.filter((t) => decadeOf(t.time) === decade);
  const [cutTime, setCutTime] = useState(cutsInDecade[0]?.time);
  const [flash, setFlash] = useState(null);
  const [openClue, setOpenClue] = useState(null); // CCTV 창 내 인라인 단서 상세
  const svgRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { if (openClue) setOpenClue(null); else onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, openClue]);

  // 시간대/컷이 바뀌면 SVG 애니메이션 클럭을 0으로 리셋 → 마커가 동선 시작점부터 다시 출발.
  // (SMIL begin은 문서 시간 기준이라 remount만으론 위상이 0이 되지 않음)
  useEffect(() => {
    try { svgRef.current?.setCurrentTime(0); } catch { /* setCurrentTime 미지원 환경 무시 */ }
  }, [cutTime, decade]);

  const collected = new Set(evidence.map((e) => e.code));
  const scene = timeline.find((t) => t.time === cutTime) || cutsInDecade[0];

  const selectDecade = (d) => {
    setDecade(d);
    const first = timeline.find((t) => decadeOf(t.time) === d);
    setCutTime(first?.time);
    setFlash(null);
    setOpenClue(null);
  };
  const selectCut = (t) => { setCutTime(t.time); setFlash(null); setOpenClue(null); };

  const showClue = (code) => {
    const clue = evidenceMap[code];
    if (clue) setOpenClue({ code, ...clue });
  };

  const handlePick = (p) => {
    if (collected.has(p.unlocks)) {
      setFlash({ ok: true, text: `이미 확보한 단서입니다 · ${p.who} [${p.unlocks}]` });
      showClue(p.unlocks); // 기획득 컷도 창 안에서 재열람
      return;
    }
    const res = onCollect ? onCollect(p.unlocks) : { success: false, message: '' };
    setFlash({ ok: !!res.success, text: res.message || (res.success ? '단서 확보!' : '확보 실패') });
    if (res.success) showClue(p.unlocks);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cctv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="cctv-titlebar">CCTV 열람대 · 2F</div>

        {/* ① 상위: 시간대 칩 */}
        <div className="cctv-timebar">
          {decades.map((d) => (
            <button key={d} className={`cctv-time ${d === decade ? 'active' : ''}`} onClick={() => selectDecade(d)}>
              {d}시대
            </button>
          ))}
        </div>

        {/* 모니터 화면 (평면도) */}
        <div className="cctv-screen">
          <div className="cctv-osd cctv-osd-top"><span>CH-1</span></div>
          <div className="cctv-osd cctv-osd-bottom">
            <span className="cctv-rec">● REC</span>
            <span>{scene?.time}</span>
          </div>
          <div className="cctv-scanlines" />
          <FloorPlan people={scene?.people || []} collected={collected} onPick={handlePick} meet={scene?.meet} cutKey={scene?.time} svgRef={svgRef} />
        </div>

        {/* ② 분단위 ❓ 칩 (선택 시간대) */}
        <div className="cctv-timebar cctv-minutebar">
          {cutsInDecade.map((t) => (
            <button key={t.time} className={`cctv-time ${t.time === cutTime ? 'active' : ''}`} onClick={() => selectCut(t)}>
              ❓ {t.time}
            </button>
          ))}
        </div>

        <p className="cctv-scene-desc">{scene?.scene}</p>

        {flash && <div className={`cctv-flash ${flash.ok ? 'ok' : 'no'}`}>{flash.text}</div>}

        {/* ③ 창 안에서 단서 상세 인라인 열람 */}
        {openClue && (
          <div className="cctv-clue-panel">
            <div className="cctv-clue-head">
              <span className="cctv-clue-code">[{openClue.code}]</span> {openClue.title}
              {openClue.person && <span className="cctv-clue-person">{openClue.person}</span>}
              <button className="cctv-clue-x" onClick={() => setOpenClue(null)} aria-label="단서 닫기">✕</button>
            </div>
            {openClue.detail && <p className="cctv-clue-detail">{openClue.detail}</p>}
          </div>
        )}

        <p className="cctv-help">시간대 칩 → 분단위 ❓를 고르면 그 시점의 동선(화살표)이 보입니다. 평면도의 인물 ❓를 누르면 단서를 확보하고 여기서 바로 펼쳐 봅니다.</p>
      </div>
    </div>
  );
}

export default CctvModal;
