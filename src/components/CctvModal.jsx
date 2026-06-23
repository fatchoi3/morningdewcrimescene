import { useEffect, useState } from 'react';
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

/* 2층 평면도(고정 구조) + 현재 컷 인물 마커 + 동선 화살표 */
function FloorPlan({ people, collected, onPick }) {
  return (
    <svg className="cctv-map" viewBox="0 0 400 280" role="img" aria-label="2층 평면도">
      <defs>
        <pattern id="cctvWall" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="7" height="7" fill="#161b24" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="#3a4656" strokeWidth="2.5" />
        </pattern>
        <marker id="cctvArrowHead" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="#ffd24a" />
        </marker>
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

      {/* 동선 화살표 (현재 컷) — 복도를 따라 꺾인 경로 */}
      {people.map((p, i) => p.arrow && (
        <polyline
          key={`a${i}`}
          points={routeArrow(p.arrow.from, p.arrow.to).map((pt) => `${pt.x},${pt.y}`).join(' ')}
          fill="none" stroke="#ffd24a" strokeWidth="2.5" strokeDasharray="6 4"
          strokeLinejoin="round" strokeLinecap="round"
          markerEnd="url(#cctvArrowHead)" opacity="0.9"
        />
      ))}

      {/* 인물 마커 (현재 컷) */}
      {people.map((p, i) => {
        const got = collected.has(p.unlocks);
        return (
          <g key={i} className={`cctv-marker ${got ? 'got' : ''}`} transform={`translate(${p.x}, ${p.y})`} onClick={() => onPick(p)} role="button">
            {!got && <circle className="cctv-marker-ping" r="13" />}
            <circle r="9" className="cctv-marker-dot" />
            <text className="cctv-marker-glyph" y="4">{got ? '✓' : '?'}</text>
            <text className="cctv-marker-label" y="24">{got ? p.who : '인물'}</text>
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

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { if (openClue) setOpenClue(null); else onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, openClue]);

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
        <div className="cctv-titlebar">📹 CCTV 열람대 · 2F</div>

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
          <FloorPlan people={scene?.people || []} collected={collected} onPick={handlePick} />
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
