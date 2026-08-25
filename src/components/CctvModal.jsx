import { useEffect, useRef, useState } from 'react';
import { provider } from '../services/index.js';

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

// 동선 계산은 보드판 QR 화면과 공유한다 — 같은 컷이 두 곳에서 다른 길로 가면 안 된다.
import { routePoints, markerMotion, blindFade } from '../shared/cctvGeom.js';

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
        <text x="102" y="84">한다영</text><text x="197" y="84">한소미</text><text x="290" y="84">서지안</text>
        <text x="360" y="55">목사님</text>
        <text x="102" y="212">최종현</text><text x="197" y="212">문세린</text><text x="290" y="212">강지후</text>
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
    const clue = provider.getClue(code);
    if (clue) setOpenClue(clue);
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
