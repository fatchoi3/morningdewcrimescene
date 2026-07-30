// ─────────────────────────────────────────────────────────────────────────────
// features/tutorial — 첫 수사 안내.
//   TutorialCoach : 지정 선택자만 밝히고 주변은 어둡게+클릭 차단, 화살표 안내.
//   TutorialFinale: 첫 심문까지 마치면 한 번 뜨는 마무리 멘트.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';

// ── 튜토리얼 코치마크 — 클릭할 곳만 밝히고 주변은 어둡게+클릭 차단, 깜빡이는 화살표 안내 ──
//   targetSel(선택자)의 실제 위치를 추적해 '구멍'을 내고, 나머지 4개 마스크가 클릭을 막는다.
export function TutorialCoach({ targetSel, text, onSkip, dim = true }) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    let raf;
    const tick = () => {
      const el = document.querySelector(targetSel);
      if (el) { const r = el.getBoundingClientRect(); setRect({ x: r.left, y: r.top, w: r.width, h: r.height }); }
      else setRect(null);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [targetSel]);
  // 대상을 못 찾아도 안내를 지우지 않는다 — 예전엔 여기서 null 을 돌려줘 마스크까지 사라졌고,
  //   그 순간 플레이어가 아무 데나 눌러 딴 길로 샜다(선택자가 바뀌면 조용히 이렇게 된다).
  //   대신 화면을 살짝 덮고 할 일만 가운데 띄운다 — 클릭은 막지 않아 갇히지도 않는다.
  if (!rect || rect.w === 0) {
    return (
      <div className="tut-coach">
        <div className="tut-mask soft" style={{ inset: 0, width: '100%', height: '100%' }} />
        <div className="tut-cap tut-cap-center">{text}</div>
        <button className="tut-skip" onClick={onSkip}>튜토리얼 건너뛰기 ✕</button>
      </div>
    );
  }
  const pad = 12;
  const hx = Math.max(0, rect.x - pad), hy = Math.max(0, rect.y - pad);
  const hw = rect.w + pad * 2, hh = rect.h + pad * 2;
  const below = hy < window.innerHeight * 0.5; // 타깃이 위쪽이면 말풍선을 아래에
  const cx = rect.x + rect.w / 2;
  const half = Math.min(230, window.innerWidth * 0.44); // 말풍선 반폭 — 화면 밖으로 안 나가게 클램프
  const tipLeft = Math.min(Math.max(cx, half + 8), window.innerWidth - half - 8);
  const capShift = tipLeft - cx; // 캡션만 화면 안으로 밀고, 화살표는 타깃 중심을 가리키게 유지
  return (
    <div className="tut-coach">
      {dim && <>
        <div className="tut-mask" style={{ left: 0, top: 0, width: '100%', height: hy }} />
        <div className="tut-mask" style={{ left: 0, top: hy + hh, width: '100%', height: `calc(100% - ${hy + hh}px)` }} />
        <div className="tut-mask" style={{ left: 0, top: hy, width: hx, height: hh }} />
        <div className="tut-mask" style={{ left: hx + hw, top: hy, width: `calc(100% - ${hx + hw}px)`, height: hh }} />
      </>}
      <div className="tut-ring" style={{ left: hx, top: hy, width: hw, height: hh }} />
      <div className="tut-tip" style={{ left: cx, top: below ? hy + hh + 6 : hy - 6, transform: below ? 'translate(-50%,0)' : 'translate(-50%,-100%)' }}>
        {below
          ? (<><div className="tut-arrow up" /><div className="tut-cap" style={{ transform: `translateX(${capShift}px)` }}>{text}</div></>)
          : (<><div className="tut-cap" style={{ transform: `translateX(${capShift}px)` }}>{text}</div><div className="tut-arrow down" /></>)}
      </div>
      <button className="tut-skip" onClick={onSkip}>튜토리얼 건너뛰기 ✕</button>
    </div>
  );
}

// ── 튜토리얼 마무리 멘트 — 첫 심문까지 마치면 한 번 표시 ──
export function TutorialFinale({ onClose }) {
  return (
    <div className="tut-finale-ov">
      <div className="tut-finale">
        <div className="tf-badge">🎓 튜토리얼 완료</div>
        <h3>수사의 기본을 익혔습니다</h3>
        <p>이제 복도를 오가며 <b>용의자 6명의 방을 모두 조사하고 심문</b>하세요.<br />
          확보한 단서는 <b>사건 기록</b>에서 인물·유형별로 확인할 수 있습니다.<br />
          사건이 <b>살인</b>으로 전환되면 목사님 방·CCTV·휴대폰·감식 의뢰실이 열립니다.<br />
          충분히 조사했다면 <b>사건 파일</b>을 제출해 사건을 마무리하세요.</p>
        <button className="s-btn" onClick={onClose}>수사 시작</button>
      </div>
    </div>
  );
}
