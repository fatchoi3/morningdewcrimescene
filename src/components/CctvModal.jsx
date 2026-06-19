import { useEffect, useState } from 'react';

/**
 * CctvModal
 * 공용 CCTV 단서. 2층 평면도를 위에서 내려다본 화면으로 보여주고,
 * CCTV 시야(콘) 안 복도에 시간대별로 인물이 나타난다.
 * 인물을 누르면 그 시간·위치와 일치하는 용의자의 CCTV 단서를 확보한다.
 *
 * cctv.timeline[].people[] = { look, who, unlocks, x, y }  (x,y는 평면도 viewBox 0 0 400 280 좌표)
 */

/* 2층 평면도(고정 구조) + 현재 시간대 인물 마커 */
function FloorPlan({ people, collected, onPick }) {
  return (
    <svg className="cctv-map" viewBox="0 0 400 280" role="img" aria-label="2층 평면도">
      {/* CCTV 시야 콘 */}
      <polygon points="47,141 342,122 342,160" fill="rgba(165,110,200,0.16)" stroke="rgba(180,130,210,0.55)" strokeWidth="1" />

      {/* 예배당 가는 길 (오른쪽 통로) */}
      <line x1="342" y1="92" x2="342" y2="258" stroke="#55657a" strokeWidth="2" />
      <path d="M352 232 l8 0 m-4 -5 l4 5 l-4 5" stroke="#8a98aa" strokeWidth="1.5" fill="none" />
      <text x="356" y="210" className="cctv-map-note" transform="rotate(90 356 210)">예배당 가는 길</text>

      {/* 윗줄 방 */}
      <g className="cctv-room">
        <rect x="55" y="45" width="95" height="70" rx="3" />
        <rect x="150" y="45" width="95" height="70" rx="3" />
        <rect x="245" y="45" width="90" height="70" rx="3" />
      </g>
      {/* 목사님 방 (우상단) */}
      <rect className="cctv-room cctv-room--victim" x="335" y="12" width="63" height="80" rx="3" />
      <rect x="340" y="84" width="34" height="10" rx="2" fill="#3aa0e6" />

      {/* 아랫줄 방 */}
      <g className="cctv-room">
        <rect x="55" y="172" width="95" height="73" rx="3" />
        <rect x="150" y="172" width="95" height="73" rx="3" />
        <rect x="245" y="172" width="90" height="73" rx="3" />
      </g>

      {/* 복도 (가운데) */}
      <rect className="cctv-hall" x="55" y="122" width="287" height="38" />

      {/* 방문 */}
      <g className="cctv-door">
        <rect x="88" y="118" width="30" height="7" />
        <rect x="183" y="118" width="30" height="7" />
        <rect x="276" y="118" width="30" height="7" />
        <rect x="88" y="157" width="30" height="7" />
        <rect x="183" y="157" width="30" height="7" />
        <rect x="276" y="157" width="30" height="7" />
      </g>

      {/* 방 이름 */}
      <g className="cctv-room-label">
        <text x="102" y="84">이사랑</text>
        <text x="197" y="84">이현지</text>
        <text x="290" y="84">박희원</text>
        <text x="366" y="55">목사님</text>
        <text x="102" y="212">최종현</text>
        <text x="197" y="212">이가현</text>
        <text x="290" y="212">윤은재</text>
      </g>

      {/* CCTV 카메라 */}
      <circle cx="47" cy="141" r="10" fill="#11151c" stroke="#e6e9ef" strokeWidth="2" />
      <circle cx="47" cy="141" r="3.5" fill="#e6e9ef" />
      <text x="47" y="166" className="cctv-map-cam">CCTV</text>

      {/* 인물 마커 (현재 시간대) */}
      {people.map((p, i) => {
        const got = collected.has(p.unlocks);
        return (
          <g
            key={i}
            className={`cctv-marker ${got ? 'got' : ''}`}
            transform={`translate(${p.x}, ${p.y})`}
            onClick={() => onPick(p)}
            role="button"
          >
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

function CctvModal({ item, evidence = [], onCollect, onClose }) {
  const timeline = item.cctv?.timeline || [];
  const [idx, setIdx] = useState(0);
  const [flash, setFlash] = useState(null); // { ok, text }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const collected = new Set(evidence.map((e) => e.code));
  const scene = timeline[idx];

  const handlePick = (p) => {
    if (collected.has(p.unlocks)) {
      setFlash({ ok: true, text: `이미 확보한 단서입니다 · ${p.who} [${p.unlocks}]` });
      return;
    }
    const res = onCollect ? onCollect(p.unlocks) : { success: false, message: '' };
    setFlash({ ok: !!res.success, text: res.message || (res.success ? '단서 확보!' : '확보 실패') });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cctv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="cctv-titlebar">📹 CCTV 열람대 · 2F</div>

        {/* 시간대 선택 */}
        <div className="cctv-timebar">
          {timeline.map((t, i) => (
            <button
              key={i}
              className={`cctv-time ${i === idx ? 'active' : ''}`}
              onClick={() => { setIdx(i); setFlash(null); }}
            >
              {t.time}
            </button>
          ))}
        </div>

        {/* 모니터 화면 (평면도) */}
        <div className="cctv-screen">
          <div className="cctv-osd cctv-osd-top">
            <span>CH-1</span>
            {/* <span>{scene?.location}</span> */}
          </div>
          <div className="cctv-osd cctv-osd-bottom">
            <span className="cctv-rec">● REC</span>
            <span>{scene?.time}</span>
          </div>
          <div className="cctv-scanlines" />
          <FloorPlan people={scene?.people || []} collected={collected} onPick={handlePick} />
        </div>

        <p className="cctv-scene-desc">{scene?.scene}</p>

        {flash && (
          <div className={`cctv-flash ${flash.ok ? 'ok' : 'no'}`}>{flash.text}</div>
        )}
        <p className="cctv-help">CCTV 시야(보라색) 안의 인물을 누르면 신원이 확인되고 해당 CCTV 단서를 확보합니다.</p>
      </div>
    </div>
  );
}

export default CctvModal;
